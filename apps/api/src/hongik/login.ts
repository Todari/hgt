import * as cheerio from "cheerio";
import iconv from "iconv-lite";

/**
 * Hongik-portal authentication + profile extraction.
 *
 * Ported from the legacy Flutter app (`flutter/hgt/lib/http/crawl.dart`) and
 * adapted to the current portal (verified live 2026-06):
 *   1. POST 학번/비번 to ap.hongik.ac.kr/login/LoginExec3.php (plaintext form).
 *   2. The response body sets cookies via `SetCookie(...)` JS — including the
 *      `.hongik.ac.kr` SSO `pni_token` (a JWT) that cn.hongik.ac.kr requires.
 *   3. GET cn.hongik.ac.kr to exchange the token for a cn session, then GET the
 *      학적 basic-info page (UTF-8) and scrape the profile.
 *
 * The password is used only here and never stored or logged.
 */

const LOGIN_URL = "https://ap.hongik.ac.kr/login/LoginExec3.php";
const HOME_URL = "https://cn.hongik.ac.kr/";
const INFO_URL = "https://cn.hongik.ac.kr/stud/A/01000/01000.jsp";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export type HongikProfile = {
  studentId: string;
  name: string;
  major: string;
  gender: "남" | "여";
  age: number | null;
  academicStatus: string | null; // 재학 / 휴학 / 졸업 / 수료 ...
};

export type HongikAuthErrorCode = "INVALID_CREDENTIALS" | "PROFILE_UNAVAILABLE";

export class HongikAuthError extends Error {
  constructor(
    public readonly code: HongikAuthErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "HongikAuthError";
  }
}

type Jar = Map<string, string>;

function decodeBody(buf: Buffer, res: Response): string {
  const ct = res.headers.get("content-type") ?? "";
  const cs = (ct.match(/charset=([\w-]+)/i)?.[1] ?? "").toLowerCase();
  const enc = /euc-?kr|ks_c_5601|cp949/.test(cs) ? "euc-kr" : "utf-8";
  return iconv.decode(buf, enc);
}

function absorb(jar: Jar, res: Response): void {
  for (const sc of res.headers.getSetCookie?.() ?? []) {
    const nv = sc.split(";")[0] ?? "";
    const eq = nv.indexOf("=");
    if (eq > 0) jar.set(nv.slice(0, eq).trim(), nv.slice(eq + 1).trim());
  }
}

const cookieHeader = (jar: Jar) => [...jar].map(([k, v]) => `${k}=${v}`).join("; ");

/** Capture every `SetCookie('name','value', ...)` call from the login body. */
function seedCookiesFromBody(jar: Jar, body: string): number {
  const re = /SetCookie\(\s*'([^']*)'\s*,\s*'([^']*)'/g;
  let m: RegExpExecArray | null;
  let count = 0;
  while ((m = re.exec(body)) !== null) {
    if (m[1]) {
      jar.set(m[1], m[2] ?? "");
      count++;
    }
  }
  return count;
}

/** GET following redirects manually while accumulating cookies. */
async function get(url: string, jar: Jar): Promise<string> {
  let current = url;
  for (let hop = 0; hop < 6; hop++) {
    const res = await fetch(current, { headers: { Cookie: cookieHeader(jar), "User-Agent": UA }, redirect: "manual" });
    absorb(jar, res);
    const loc = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && loc) {
      current = new URL(loc, current).toString();
      continue;
    }
    return decodeBody(Buffer.from(await res.arrayBuffer()), res);
  }
  return "";
}

export async function authenticateHongik(id: string, pw: string): Promise<HongikProfile> {
  const jar: Jar = new Map();

  const loginRes = await fetch(LOGIN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA },
    body: new URLSearchParams({ USER_ID: id, PASSWD: pw, Refer: "https://cn.hongik.ac.kr" }),
    redirect: "manual",
  });
  const loginBody = decodeBody(Buffer.from(await loginRes.arrayBuffer()), loginRes);
  seedCookiesFromBody(jar, loginBody);
  absorb(jar, loginRes);

  if (jar.size === 0) {
    throw new HongikAuthError("INVALID_CREDENTIALS", "학번 또는 비밀번호가 올바르지 않습니다.");
  }

  // Establish the cn session (token handoff) then load the 학적 info page.
  await get(HOME_URL, jar);
  const html = await get(INFO_URL, jar);
  if (html.length < 1200 || /통합로그인 후 접속/.test(html)) {
    throw new HongikAuthError("PROFILE_UNAVAILABLE", "학적 정보를 불러오지 못했습니다.");
  }

  const $ = cheerio.load(html);
  const cells = $("#body > div.table1.mato10 > table > tbody > tr > td")
    .map((_, el) => $(el).text().trim().replace(/\s+/g, " "))
    .get();

  // Label-based lookup (robust to column shifts): each label cell is followed by its value.
  const norm = (s: string) => s.replace(/\s/g, "");
  const valueAfter = (label: string): string | null => {
    const i = cells.findIndex((c) => norm(c).includes(norm(label)));
    return i >= 0 ? (cells[i + 1] ?? null) : null;
  };

  const studentId = valueAfter("학번");
  const name = valueAfter("성명(국문)");
  if (!studentId || !name) {
    throw new HongikAuthError("PROFILE_UNAVAILABLE", "프로필 파싱에 실패했습니다.");
  }
  const birthYear = valueAfter("생년월일")?.match(/\d{4}/)?.[0];

  return {
    studentId,
    name,
    major: valueAfter("전공(국문)") ?? "",
    gender: html.includes("군복무") ? "남" : "여", // males have a 군복무여부 row
    age: birthYear ? new Date().getFullYear() - Number(birthYear) : null,
    academicStatus: valueAfter("학적상태"),
  };
}
