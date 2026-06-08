"use client";

import { useState, type FormEvent } from "react";
import { css } from "_panda/css";
import { hongikLoginSchema, type HongikLoginResponse } from "@hgt-client/contract";
import { api, ApiError } from "@/lib/api";

const fieldCss = css({ display: "flex", flexDirection: "column", gap: "1" });
const labelCss = css({ fontSize: "sm", fontWeight: "medium", color: "gray.700" });
const inputCss = css({
  border: "1px solid",
  borderColor: "gray.300",
  borderRadius: "md",
  padding: "2.5",
  fontSize: "md",
});

export default function SignInPage() {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [result, setResult] = useState<HongikLoginResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = hongikLoginSchema.safeParse({ id, pw });
    if (!parsed.success) {
      setError("학번과 비밀번호를 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.hongikLogin(parsed.data);
      setResult(res);
      setPw(""); // drop the password from memory once we're done with it
      if (typeof window !== "undefined") {
        localStorage.setItem("hgt_session", res.session);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const u = result?.user;

  return (
    <main
      className={css({
        maxWidth: "440px",
        margin: "0 auto",
        padding: "8",
        display: "flex",
        flexDirection: "column",
        gap: "6",
      })}
    >
      <header className={css({ display: "flex", flexDirection: "column", gap: "1" })}>
        <h1 className={css({ fontSize: "2xl", fontWeight: "bold" })}>홍익대 포털 로그인</h1>
        <p className={css({ fontSize: "sm", color: "gray.600" })}>
          홍익대학교 재학생만 이용할 수 있어요. 포털 계정으로 재학 인증을 진행합니다.
        </p>
      </header>

      <form onSubmit={onSubmit} className={css({ flexDirection: "column", gap: "4" })}>
        <div className={fieldCss}>
          <label className={labelCss}>학번</label>
          <input
            className={inputCss}
            value={id}
            onChange={(e) => setId(e.target.value)}
            autoComplete="username"
            placeholder="B000000"
          />
        </div>
        <div className={fieldCss}>
          <label className={labelCss}>포털 비밀번호</label>
          <input
            className={inputCss}
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </div>
        <p className={css({ fontSize: "xs", color: "gray.500" })}>
          🔒 비밀번호는 홍익대 포털 인증에만 1회 사용되며 <b>저장하지 않습니다.</b>
        </p>
        <button
          type="submit"
          disabled={loading}
          className={css({
            bg: "black",
            color: "white",
            padding: "3",
            borderRadius: "md",
            fontWeight: "semibold",
            cursor: "pointer",
            _disabled: { opacity: 0.5, cursor: "not-allowed" },
          })}
        >
          {loading ? "인증 중..." : "재학 인증하고 시작하기"}
        </button>
      </form>

      {error && <p className={css({ color: "red.600", fontSize: "sm" })}>⚠️ {error}</p>}

      {u && (
        <section
          className={css({
            display: "flex",
            flexDirection: "column",
            gap: "3",
            padding: "5",
            bg: "green.50",
            border: "1px solid",
            borderColor: "green.200",
            borderRadius: "lg",
          })}
        >
          <p className={css({ fontSize: "sm", fontWeight: "semibold", color: "green.800" })}>
            ✅ 재학 인증 완료
          </p>
          <dl className={css({ display: "grid", gridTemplateColumns: "auto 1fr", rowGap: "1.5", columnGap: "4", fontSize: "sm" })}>
            <dt className={css({ color: "gray.500" })}>이름</dt>
            <dd className={css({ fontWeight: "medium" })}>{u.name}</dd>
            <dt className={css({ color: "gray.500" })}>학번</dt>
            <dd>{u.studentId}</dd>
            <dt className={css({ color: "gray.500" })}>학과</dt>
            <dd>{u.major}</dd>
            <dt className={css({ color: "gray.500" })}>나이 · 성별</dt>
            <dd>
              {u.age}세 · {u.gender ? "남" : "여"}
            </dd>
            <dt className={css({ color: "gray.500" })}>학적상태</dt>
            <dd>{u.academicStatus ?? "-"}</dd>
          </dl>
        </section>
      )}
    </main>
  );
}
