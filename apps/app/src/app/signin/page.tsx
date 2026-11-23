"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { css } from "_panda/css";
import { hongikLoginSchema } from "@hgt-client/contract";
import { Ambient } from "@/components/ui/Ambient";
import { GlassButton, GlassTextField } from "@/components/ui/glass";
import { api, ApiError } from "@/lib/api";
import { getPostAuthRoute } from "@/lib/release";
import { setSession } from "@/lib/session";

const trustPoints = [
  "포털 인증을 통과한 홍익대 구성원만 이용해요.",
  "비밀번호는 저장하지 않고 인증에만 사용해요.",
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
      router.replace(getPostAuthRoute(response.user?.termsAgreedAt));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "로그인에 실패했어요. 잠시 후 다시 시도해주세요.",
      );
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
          minHeight: "var(--hgt-page-height)",
          width: "100%",
          maxWidth: "480px",
          marginX: "auto",
          paddingX: "4",
          paddingTop: "4",
          paddingBottom: "8",
          display: "flex",
          flexDirection: "column",
          gap: "6",
        })}
      >
        <header>
          <div
            className={css({
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "6",
            })}
          >
            <Link
              href="/"
              aria-label="이전 화면"
              className={css({
                display: "grid",
                placeItems: "center",
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                color: "ink.950",
                background: "surface.card",
                border: "1px solid",
                borderColor: "surface.hairline",
                fontSize: "xl",
                fontWeight: "black",
              })}
            >
              ‹
            </Link>
            <span
              className={css({
                paddingX: "3",
                paddingY: "1.5",
                border: "1px solid rgba(84,130,242,.18)",
                borderRadius: "capsule",
                background: "rgba(84,130,242,.14)",
                fontFamily: "monospace",
                fontSize: "10px",
                fontWeight: "black",
                letterSpacing: "0.08em",
              })}
            >
              HONGIK VERIFIED
            </span>
          </div>
          <p
            className={css({
              marginBottom: "2",
              color: "primary.700",
              fontFamily: "monospace",
              fontSize: "xs",
              fontWeight: "black",
              letterSpacing: "0.08em",
            })}
          >
            STEP 01 · VERIFY
          </p>
          <h1
            className={css({
              color: "ink.950",
              fontSize: "34px",
              fontWeight: "black",
              lineHeight: "1.08",
              letterSpacing: "-0.05em",
            })}
          >
            같은 학교라는
            <br />
            신뢰부터 확인해요.
          </h1>
          <p
            className={css({
              marginTop: "3",
              color: "ink.700",
              fontSize: "md",
              lineHeight: "1.65",
            })}
          >
            홍익대 포털 계정으로 재학·휴학·졸업 상태를 확인합니다.
          </p>
        </header>

        <section
          className={css({
            position: "relative",
            padding: "5",
            border: "1px solid",
            borderColor: "surface.hairline",
            borderRadius: "18px",
            background: "var(--content-surface)",
            boxShadow: "var(--content-shadow)",
          })}
        >
          <span
            aria-hidden
            className={css({
              position: "absolute",
              top: "-15px",
              right: "18px",
              paddingX: "2.5",
              paddingY: "1",
              border: "1px solid rgba(218,167,22,.22)",
              borderRadius: "capsule",
              background: "#fff3bd",
              fontFamily: "monospace",
              fontSize: "10px",
              fontWeight: "black",
            })}
          >
            HONGIK ONLY
          </span>
          <form
            onSubmit={onSubmit}
            className={css({
              display: "flex",
              flexDirection: "column",
              gap: "4",
            })}
          >
            <GlassTextField
              id="hongik-id"
              label="학번"
              value={id}
              onChange={(event) => setId(event.target.value)}
              autoComplete="username"
              inputMode="text"
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
            <GlassButton
              type="submit"
              disabled={loading}
              className={css({ width: "100%", marginTop: "1" })}
            >
              {loading ? "인증하는 중..." : "홍익대 포털 인증하기 →"}
            </GlassButton>
          </form>
        </section>

        <ul
          className={css({
            display: "flex",
            flexDirection: "column",
            gap: "2.5",
            padding: 0,
            listStyle: "none",
          })}
        >
          {trustPoints.map((point, index) => (
            <li
              key={point}
              className={css({
                display: "flex",
                alignItems: "flex-start",
                gap: "2.5",
              })}
            >
              <span
                aria-hidden
                className={css({
                  display: "grid",
                  placeItems: "center",
                  width: "24px",
                  height: "24px",
                  flexShrink: 0,
                  border: "1px solid rgba(17,17,15,.07)",
                  borderRadius: "8px",
                  background:
                    index === 0
                      ? "rgba(84,130,242,.14)"
                      : "rgba(54,185,128,.14)",
                  fontSize: "xs",
                  fontWeight: "black",
                })}
              >
                ✓
              </span>
              <span
                className={css({
                  color: "ink.700",
                  fontSize: "sm",
                  fontWeight: "bold",
                  lineHeight: "1.6",
                })}
              >
                {point}
              </span>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
