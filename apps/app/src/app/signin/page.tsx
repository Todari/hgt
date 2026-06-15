"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { css, cx } from "_panda/css";
import { hongikLoginSchema } from "@hgt-client/contract";
import { Ambient } from "@/components/ui/Ambient";
import { GlassButton, GlassTextField } from "@/components/ui/glass";
import { api, ApiError } from "@/lib/api";
import { setSession } from "@/lib/session";

const trustPoints = [
  "홍익대 포털로 재학생만 인증해요.",
  "비밀번호는 저장하지 않고 인증에만 써요.",
];

export default function SignInPage() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = hongikLoginSchema.safeParse({ id, pw });
    if (!parsed.success) {
      setError("학번과 비밀번호를 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.hongikLogin(parsed.data);
      setSession(response.session);
      setPw("");
      // Verified users who already agreed to terms go straight home; everyone
      // else completes onboarding. replace() so back doesn't return to the form.
      router.replace(response.user?.termsAgreedAt ? "/home" : "/onboarding");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "로그인에 실패했어요. 잠시 후 다시 시도해주세요.");
      setLoading(false);
    }
  }

  return (
    <>
      <Ambient />
      <main
        className={css({
          position: "relative",
          zIndex: 1,
          minHeight: "100dvh",
          width: "100%",
          maxWidth: "480px",
          marginX: "auto",
          paddingX: "5",
          paddingTop: "8",
          paddingBottom: "10",
          display: "flex",
          flexDirection: "column",
          gap: "7",
        })}
      >
        <header className={css({ display: "flex", flexDirection: "column", gap: "4" })}>
          <Link
            href="/"
            aria-label="홈으로"
            className={css({
              display: "inline-grid",
              placeItems: "center",
              width: "48px",
              height: "48px",
              borderRadius: "16px",
              color: "white",
              fontSize: "lg",
              fontWeight: "black",
              background: "linear-gradient(140deg, #b83e3a 0%, #ff6b5f 58%, #ff9a87 100%)",
              boxShadow: "0 14px 28px rgba(255,107,95,.26)",
            })}
          >
            H
          </Link>
          <div>
            <h1 className={css({ color: "ink.950", fontSize: "3xl", fontWeight: "black", lineHeight: "1.12" })}>
              재학생 인증으로
              <br />
              시작해요
            </h1>
            <p className={css({ marginTop: "3", color: "ink.700", fontSize: "md", lineHeight: "1.7" })}>
              홍익대 포털 계정으로 재학생인지만 확인해요. 믿을 수 있는 상대부터 만나요.
            </p>
          </div>
        </header>

        <form
          onSubmit={onSubmit}
          className={css({ display: "flex", flexDirection: "column", gap: "4" })}
        >
          <GlassTextField
            id="hongik-id"
            label="학번"
            value={id}
            onChange={(event) => setId(event.target.value)}
            autoComplete="username"
            inputMode="numeric"
            placeholder="B000000"
            disabled={loading}
          />
          <GlassTextField
            id="hongik-password"
            label="포털 비밀번호"
            type="password"
            value={pw}
            onChange={(event) => setPw(event.target.value)}
            autoComplete="current-password"
            placeholder="비밀번호"
            disabled={loading}
            error={error ?? undefined}
          />

          <GlassButton type="submit" disabled={loading} className={css({ width: "100%", marginTop: "1" })}>
            {loading ? "인증하는 중..." : "재학 인증하고 시작하기"}
          </GlassButton>
        </form>

        <ul className={css({ display: "flex", flexDirection: "column", gap: "2.5", marginTop: "auto" })}>
          {trustPoints.map((point) => (
            <li
              key={point}
              className={css({ display: "flex", alignItems: "center", gap: "2.5" })}
            >
              <span
                aria-hidden
                className={cx(
                  "glass-control",
                  css({
                    display: "grid",
                    placeItems: "center",
                    width: "24px",
                    height: "24px",
                    flexShrink: 0,
                    borderRadius: "50%",
                    color: "primary.700",
                  }),
                )}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="m5 12 5 5 9-11" />
                </svg>
              </span>
              <span className={css({ color: "ink.700", fontSize: "sm", fontWeight: "bold", lineHeight: "1.6" })}>
                {point}
              </span>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
