/**
 * Manual test harness for Hongik-portal login — ported from the legacy Flutter
 * app (`flutter/hgt/lib/http/crawl.dart`) and adapted to the current portal.
 *
 * SAFETY: your portal password is read from a hidden prompt (or HONGIK_PW env),
 * used ONCE to log in to https://ap.hongik.ac.kr, and is never stored, logged,
 * or sent anywhere else.
 *
 *   pnpm --filter api test:hongik
 */
import * as readline from "node:readline";
import * as cheerio from "cheerio";
import iconv from "iconv-lite";

const LOGIN_URL = "https://ap.hongik.ac.kr/login/LoginExec3.php";
const HOME_URL = "https://cn.hongik.ac.kr/";
const INFO_URL = "https://cn.hongik.ac.kr/stud/A/01000/01000.jsp";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

/** Decode a response body honoring its charset (cn pages are UTF-8; legacy ap pages EUC-KR). */
function decodeBody(buf: Buffer, res: Response): string {
  const ct = res.headers.get("content-type") ?? "";
  const cs = (ct.match(/charset=([\w-]+)/i)?.[1] ?? "").toLowerCase();
  const enc = /euc-?kr|ks_c_5601|cp949/.test(cs) ? "euc-kr" : "utf-8";
  return iconv.decode(buf, enc);
}

function ask(query: string, { hidden = false }: { hidden?: boolean } = {}): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      const node = rl as unknown as { _writeToOutput: (s: string) => void };
      const original = node._writeToOutput.bind(rl);
      node._writeToOutput = (s: string) => {
        if (s.startsWith(query) || s.includes("\n")) original(s);
      };
    }
    rl.question(query, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer.trim());
    });
  });
}

/** Decode a percent-encoded EUC-KR string (e.g. cookie value "%C0%CC..." -> 한글). */
function decodeEucKrPercent(s: string): string {
  try {
    const bytes = s.replace(/%([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
    return iconv.decode(Buffer.from(bytes, "latin1"), "euc-kr");
  } catch {
    return s;
  }
}

/* --------------------------- tiny cookie jar --------------------------- */
type Jar = Map<string, string>;

function absorb(jar: Jar, res: Response): number {
  let added = 0;
  for (const sc of res.headers.getSetCookie?.() ?? []) {
    const nv = sc.split(";")[0] ?? "";
    const eq = nv.indexOf("=");
    if (eq > 0) {
      jar.set(nv.slice(0, eq).trim(), nv.slice(eq + 1).trim());
      added++;
    }
  }
  return added;
}

const cookieHeader = (jar: Jar) => [...jar].map(([k, v]) => `${k}=${v}`).join("; ");

/**
 * Parse ALL `SetCookie('name','value', ...)` JS calls in the body.
 * (The legacy port hardcoded 12, which dropped the `.hongik.ac.kr` SSO cookies
 * — notably `pni_token` — that cn.hongik.ac.kr needs.)
 */
function parseBodyCookies(body: string): Array<[string, string]> {
  const re = /SetCookie\(\s*'([^']*)'\s*,\s*'([^']*)'/g;
  const pairs: Array<[string, string]> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    pairs.push([m[1] ?? "", m[2] ?? ""]); // raw cookie value
  }
  return pairs;
}

/** GET following redirects manually while accumulating cookies into the jar. */
async function get(url: string, jar: Jar, label: string) {
  let current = url;
  for (let hop = 0; hop < 6; hop++) {
    const res = await fetch(current, { headers: { Cookie: cookieHeader(jar), "User-Agent": UA }, redirect: "manual" });
    const added = absorb(jar, res);
    const loc = res.headers.get("location");
    console.log(`  ${label}[${hop}] ${res.status} ${current.replace("https://", "")} (loc=${loc ?? "-"}, +${added}c)`);
    if (res.status >= 300 && res.status < 400 && loc) {
      current = new URL(loc, current).toString();
      continue;
    }
    const html = decodeBody(Buffer.from(await res.arrayBuffer()), res);
    return { html, status: res.status, finalUrl: current };
  }
  return { html: "", status: 0, finalUrl: current };
}

async function login(id: string, pw: string, jar: Jar) {
  const res = await fetch(LOGIN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA },
    body: new URLSearchParams({ USER_ID: id, PASSWD: pw, Refer: "https://cn.hongik.ac.kr" }),
    redirect: "manual",
  });
  const body = decodeBody(Buffer.from(await res.arrayBuffer()), res);
  const pairs = parseBodyCookies(body);
  for (const [name, value] of pairs) jar.set(name, value); // seed with RAW value
  absorb(jar, res);
  return { bodyLen: body.length, pairs, body };
}

async function main() {
  const id = process.env.HONGIK_ID ?? (process.stdin.isTTY ? await ask("학번(USER_ID): ") : "");
  const pw = process.env.HONGIK_PW ?? (process.stdin.isTTY ? await ask("포털 비밀번호: ", { hidden: true }) : "");
  if (!id || !pw) {
    console.log("\n자격증명 필요: pnpm --filter api test:hongik (또는 HONGIK_ID/HONGIK_PW env)");
    process.exit(0);
  }

  const jar: Jar = new Map();

  console.log("\n[1/3] 포털 로그인...");
  const { bodyLen, pairs, body } = await login(id, pw, jar);
  console.log(`  본문 ${bodyLen}b · jar=${jar.size}`);
  if (jar.size === 0) {
    console.error("  ❌ 로그인 실패 (쿠키 미수신 — 학번/비번 또는 폼 변경)");
    process.exit(1);
  }
  console.log("  ✅ 로그인 성공. SSO 쿠키 디코딩(이게 신원정보일 가능성):");
  for (const [name, value] of pairs) {
    const decoded = decodeEucKrPercent(value);
    // mask obvious auth tokens; show identity-ish fields fully
    const isToken = /AUTH|KEY|SESS/i.test(name);
    console.log(`    ${name.padEnd(16)} = ${isToken ? `${decoded.slice(0, 6)}…(${decoded.length})` : decoded}`);
  }

  // Inspect the login response for the SSO handoff to cn (token-redacted).
  const redacted = body.replace(/(SetCookie\('[^']*',\s*')[^']*(')/g, "$1[…]$2");
  const hints = redacted
    .split(/[\n;]/)
    .map((l) => l.trim())
    .filter((l) => l && /location|href|cn\.hongik|Refer|ticket|token|sso|\.jsp|\.do/i.test(l))
    .slice(0, 14);
  console.log("\n[login 응답 구조 힌트 (토큰 마스킹) — cn 핸드오프가 있나?]");
  console.log(hints.length ? hints.map((h) => "  " + h).join("\n") : "  (cn/redirect 단서 없음 → cn은 별도 SSO 세션 필요)");

  console.log("\n[2/3] (옛 방식 확인) cn 학생정보 크롤링 시도...");
  await get(HOME_URL, jar, "home");
  const info = await get(INFO_URL, jar, "info");
  console.log(`  info ${info.status}, HTML ${info.html.length}b`);
  if (info.html.length < 1200) {
    console.log("  → 응답:", info.html.replace(/\s+/g, " ").trim().slice(0, 200));
    return;
  }

  console.log("\n[3/3] 학생정보 파싱:");
  const $ = cheerio.load(info.html);
  let cells = $("#body > div.table1.mato10 > table > tbody > tr > td")
    .map((_, el) => $(el).text().trim().replace(/\s+/g, " "))
    .get();
  let selector = "2024 selector";
  if (cells.length === 0) {
    cells = $("table td").map((_, el) => $(el).text().trim().replace(/\s+/g, " ")).get();
    selector = "fallback(table td)";
  }

  // PII safety: never print resident-registration numbers / phone numbers.
  const mask = (s: string) =>
    s
      .replace(/\d{6}\s*[-–]\s*[1-4]\d{6}/g, "######-#######")
      .replace(/01[016-9][-\s]?\d{3,4}[-\s]?\d{4}/g, "010-####-####");

  const birth = cells[7]?.match(/\d{4}/)?.[0];
  const guess = {
    studentId: cells[1] ?? null,
    name: cells[3] ?? null,
    major: cells[9] ?? null,
    gender: info.html.includes("군복무") ? "남" : "여",
    age: birth ? new Date().getFullYear() - Number(birth) : null,
  };
  console.log(`  <title>="${$("title").text().trim()}", selector=${selector}, cellCount=${cells.length}`);
  console.log("  [legacy 인덱스 추정]", JSON.stringify(guess));
  console.log("  --- 셀 덤프 (인덱스 보정용 · 주민/전화 마스킹 · 40자 컷) ---");
  console.log(cells.map((c, i) => `   [${i}] ${mask(c).slice(0, 40)}`).join("\n"));
}

main().catch((e) => {
  console.error("에러:", e instanceof Error ? e.message : e);
  process.exit(1);
});
