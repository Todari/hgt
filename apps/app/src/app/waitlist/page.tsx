"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { MeProfile } from "@hgt-client/contract";
import { css } from "_panda/css";
import { Ambient } from "@/components/ui/Ambient";
import { GlassButton } from "@/components/ui/glass";
import { api } from "@/lib/api";
import { getPostAuthRoute, isWebWaitlistMode } from "@/lib/release";
import { clearSession, getSession } from "@/lib/session";

const releaseSteps = [
  ["01", "홍익대 인증", "포털을 통해 구성원 확인을 마쳤어요."],
  ["02", "앱 출시 준비", "알림과 1:1 대화가 안정적인 앱을 준비하고 있어요."],
  ["03", "취향 등록", "출시 후 앱에서 키워드를 고르면 매칭 준비가 끝나요."],
] as const;

export default function WaitlistPage() {
  const router = useRouter();
  const [me, setMe] = useState<MeProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/signin");
      return;
    }

    let active = true;
    void api
      .getMe(session)
      .then((profile) => {
        if (!active) return;
        if (!isWebWaitlistMode()) {
          router.replace(getPostAuthRoute(profile.termsAgreedAt));
          return;
        }
        setMe(profile);
      })
      .catch(() => {
        if (active) setError("인증 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
      });

    return () => {
      active = false;
    };
  }, [router]);

  async function logout() {
    const session = getSession();
    setLoggingOut(true);
    try {
      if (session) await api.logout(session);
    } catch {
      // The local session still needs to be cleared when the network is down.
    } finally {
      clearSession();
      router.replace("/");
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
          paddingBottom: "5",
          display: "flex",
          flexDirection: "column",
          gap: "4",
        })}
      >
        <header
          className={css({
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          })}
        >
          <span
            className={css({
              display: "inline-flex",
              alignItems: "center",
              gap: "2.5",
              fontSize: "lg",
              fontWeight: "black",
            })}
          >
            <span
              className={css({
                display: "grid",
                placeItems: "center",
                width: "42px",
                height: "42px",
                color: "white",
                background: "primary.500",
                border: "1px solid rgba(190,48,36,.18)",
                borderRadius: "13px",
                boxShadow: "0 7px 18px rgba(255,79,63,.18)",
                fontWeight: "black",
              })}
            >
              H
            </span>
            HGT
          </span>
          <span
            className={css({
              paddingX: "3",
              paddingY: "1.5",
              border: "1px solid rgba(54,185,128,.24)",
              borderRadius: "capsule",
              background: "rgba(54,185,128,.15)",
              fontFamily: "monospace",
              fontSize: "10px",
              fontWeight: "black",
              letterSpacing: "0.08em",
            })}
          >
            VERIFIED
          </span>
        </header>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32 }}
          className={css({
            position: "relative",
            overflow: "hidden",
            padding: "5",
            border: "1px solid rgba(84,130,242,.2)",
            borderRadius: "18px",
            background: "rgba(84,130,242,.14)",
            boxShadow: "var(--content-shadow)",
          })}
        >
          <p
            className={css({
              color: "primary.700",
              fontFamily: "monospace",
              fontSize: "xs",
              fontWeight: "black",
              letterSpacing: "0.08em",
            })}
          >
            PRE-REGISTERED · HONGIK
          </p>
          <h1
            className={css({
              marginTop: "3",
              color: "ink.950",
              fontSize: "34px",
              fontWeight: "black",
              lineHeight: "1.08",
              letterSpacing: "-0.05em",
            })}
          >
            {me ? `${me.name}님,` : "홍익인님,"}
            <br />
            사전 등록됐어요.
          </h1>
          <p
            className={css({
              marginTop: "3",
              color: "ink.700",
              fontSize: "sm",
              fontWeight: "semibold",
              lineHeight: "1.65",
            })}
          >
            앱이 출시되면 사진보다 취향을 먼저 보는
            <br />
            한 사람과의 대화를 시작할 수 있어요.
          </p>
          {me && (
            <div
              className={css({
                marginTop: "4",
                display: "inline-flex",
                alignItems: "center",
                gap: "2",
                paddingX: "3",
                paddingY: "2",
                border: "1px solid rgba(17,17,15,.08)",
                borderRadius: "12px",
                background: "rgba(255,255,255,.68)",
                color: "ink.700",
                fontSize: "xs",
                fontWeight: "bold",
              })}
            >
              <span aria-hidden>✓</span>
              {me.major} · {me.academicStatus ?? "홍익대 구성원"}
            </div>
          )}
        </motion.section>

        <section
          aria-label="출시 준비 단계"
          className={css({
            overflow: "hidden",
            border: "1px solid",
            borderColor: "surface.hairline",
            borderRadius: "18px",
            background: "var(--content-surface)",
            boxShadow: "var(--content-shadow)",
          })}
        >
          {releaseSteps.map(([number, title, body], index) => (
            <div
              key={number}
              className={css({
                display: "grid",
                gridTemplateColumns: "38px 1fr",
                gap: "3",
                padding: "3.5",
                borderTop: index === 0 ? "none" : "1px solid",
                borderColor: "surface.hairline",
              })}
            >
              <span
                className={css({
                  display: "grid",
                  placeItems: "center",
                  alignSelf: "start",
                  width: "34px",
                  height: "34px",
                  border: "1px solid rgba(17,17,15,.08)",
                  borderRadius: "11px",
                  background: index === 0 ? "rgba(54,185,128,.15)" : "#fff3bd",
                  fontFamily: "monospace",
                  fontSize: "xs",
                  fontWeight: "black",
                })}
              >
                {index === 0 ? "✓" : number}
              </span>
              <div>
                <h2 className={css({ fontSize: "sm", fontWeight: "black" })}>{title}</h2>
                <p
                  className={css({
                    marginTop: "1",
                    color: "ink.500",
                    fontSize: "xs",
                    lineHeight: "1.55",
                  })}
                >
                  {body}
                </p>
              </div>
            </div>
          ))}
        </section>

        {error && (
          <p
            role="alert"
            className={css({
              color: "primary.700",
              fontSize: "xs",
              fontWeight: "bold",
              textAlign: "center",
            })}
          >
            {error}
          </p>
        )}

        <div className={css({ marginTop: "auto", display: "flex", flexDirection: "column", gap: "2" })}>
          <div
            className={css({
              minHeight: "52px",
              display: "grid",
              placeItems: "center",
              border: "1px solid rgba(17,17,15,.08)",
              borderRadius: "16px",
              background: "#fff3bd",
              color: "ink.700",
              fontSize: "sm",
              fontWeight: "black",
            })}
          >
            HGT 앱 출시 준비 중
          </div>
          <GlassButton
            type="button"
            variant="secondary"
            disabled={loggingOut}
            onClick={() => void logout()}
            className={css({ width: "100%" })}
          >
            {loggingOut ? "로그아웃하는 중..." : "다른 계정으로 인증하기"}
          </GlassButton>
        </div>
      </main>
    </>
  );
}
