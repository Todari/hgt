"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { css } from "_panda/css";
import { Ambient } from "@/components/ui/Ambient";
import { isWebWaitlistMode } from "@/lib/release";
import { getSession } from "@/lib/session";

const reasons = [
  {
    number: "01",
    label: "VERIFIED",
    title: "검증된 홍익인만",
    body: "포털 인증을 거친 재학·휴학·졸업 구성원만 들어와요.",
    color: "rgba(84,130,242,.14)",
  },
  {
    number: "02",
    label: "ONLY ONE",
    title: "매주 한 사람만",
    body: "끝없는 탐색 대신 이번 주의 한 사람을 알아가요.",
    color: "rgba(255,199,46,.18)",
  },
  {
    number: "03",
    label: "NO PHOTO",
    title: "사람 자체를 먼저",
    body: "사진 대신 취향과 관계의 태도를 키워드로 만나요.",
    color: "rgba(54,185,128,.14)",
  },
] as const;

export default function IntroPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [webWaitlist, setWebWaitlist] = useState(false);

  useEffect(() => {
    const waitlist = isWebWaitlistMode();
    if (getSession()) {
      router.replace(waitlist ? "/waitlist" : "/home");
      return;
    }
    setWebWaitlist(waitlist);
    setReady(true);
  }, [router]);

  if (!ready) return null;

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
          paddingTop: "3",
          paddingBottom: "3",
          display: "flex",
          flexDirection: "column",
          gap: "4",
        })}
      >
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className={css({
            display: "flex",
            flexDirection: "column",
            gap: "4",
          })}
        >
          <div
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
                paddingX: "2.5",
                paddingY: "1.5",
                border: "1px solid",
                borderColor: "surface.hairline",
                borderRadius: "capsule",
                background: "rgba(255,255,255,.7)",
                fontFamily: "monospace",
                fontSize: "10px",
                fontWeight: "black",
                letterSpacing: "0.08em",
              })}
            >
              HONGIK MATCH
            </span>
          </div>

          <div>
            <p
              className={css({
                marginBottom: "3",
                color: "primary.700",
                fontFamily: "monospace",
                fontSize: "xs",
                fontWeight: "black",
                letterSpacing: "0.08em",
              })}
            >
              {webWaitlist ? "APP · COMING SOON" : "MONDAY · 19:00"}
            </p>
            <h1
              className={css({
                color: "ink.950",
                fontSize: "42px",
                fontWeight: "black",
                lineHeight: "0.98",
                letterSpacing: "-0.065em",
              })}
            >
              이번 주에는,
              <br />
              <span
                className={css({
                  display: "inline-block",
                  marginTop: "2",
                  paddingX: "1.5",
                  background: "primary.500",
                  borderRadius: "6px",
                })}
              >
                단 한 사람만.
              </span>
            </h1>
            <p
              className={css({
                marginTop: "4",
                color: "ink.700",
                fontSize: "md",
                fontWeight: "semibold",
                lineHeight: "1.65",
              })}
            >
              검증된 홍익대 구성원과 매주 한 번.
              <br />
              사진 대신 취향과 키워드로 만나요.
            </p>
          </div>
        </motion.header>

        <section
          aria-label="HGT가 다른 이유"
          className={css({
            overflow: "hidden",
            border: "1px solid",
            borderColor: "surface.hairline",
            borderRadius: "18px",
            background: "var(--content-surface)",
            boxShadow: "var(--content-shadow)",
          })}
        >
          {reasons.map((reason, index) => (
            <motion.article
              key={reason.number}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 + index * 0.07, duration: 0.28 }}
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
                  background: reason.color,
                  fontFamily: "monospace",
                  fontSize: "xs",
                  fontWeight: "black",
                })}
              >
                {reason.number}
              </span>
              <div>
                <p
                  className={css({
                    margin: 0,
                    color: "ink.500",
                    fontFamily: "monospace",
                    fontSize: "10px",
                    fontWeight: "black",
                    letterSpacing: "0.09em",
                  })}
                >
                  {reason.label}
                </p>
                <h2
                  className={css({
                    marginTop: "1",
                    color: "ink.950",
                    fontSize: "lg",
                    fontWeight: "black",
                    letterSpacing: "-0.025em",
                  })}
                >
                  {reason.title}
                </h2>
                <p
                  className={css({
                    marginTop: "1",
                    color: "ink.500",
                    fontSize: "sm",
                    lineHeight: "1.55",
                  })}
                >
                  {reason.body}
                </p>
              </div>
            </motion.article>
          ))}
        </section>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.3 }}
          className={css({
            marginTop: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "3",
          })}
        >
          <Link
            href="/signin"
            className={css({
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "space-between",
              minHeight: "58px",
              paddingX: "5",
              borderRadius: "16px",
              color: "white",
              background: "primary.500",
              border: "1px solid rgba(190,48,36,.18)",
              boxShadow: "0 12px 26px rgba(255,79,63,.2)",
              fontSize: "md",
              fontWeight: "black",
              _active: {
                transform: "scale(.985)",
                boxShadow: "0 6px 16px rgba(255,79,63,.17)",
              },
            })}
          >
            {webWaitlist ? "홍익대 인증하고 사전 등록하기" : "홍익대 인증하고 시작하기"}
            <span aria-hidden>→</span>
          </Link>
          <p
            className={css({
              textAlign: "center",
              color: "ink.500",
              fontSize: "xs",
              lineHeight: "1.6",
            })}
          >
            포털 비밀번호는 저장하지 않고 인증에만 사용해요.
          </p>
        </motion.div>
      </main>
    </>
  );
}
