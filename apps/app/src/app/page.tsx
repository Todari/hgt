"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { css } from "_panda/css";
import { Ambient } from "@/components/ui/Ambient";
import { getSession } from "@/lib/session";

const valueProps = [
  {
    title: "재학생만 인증해요",
    body: "홍익대 포털 인증을 거친 사람만 들어와요. 믿을 수 있는 상대부터 시작해요.",
    icon: (
      <path d="M12 3 5 6v6c0 4 3 6.7 7 9 4-2.3 7-5 7-9V6l-7-3Z" />
    ),
  },
  {
    title: "한 사람에게 집중해요",
    body: "여러 명에게 동시에 열리는 연결 대신, 매주 한 사람을 진지하게 만나요.",
    icon: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M5 21c0-3.5 3-6 7-6s7 2.5 7 6" />
      </>
    ),
  },
  {
    title: "외모가 아닌 궁합을 봐요",
    body: "생활 리듬, 관심사, 대화 성향이 맞는 상대를 키워드로 찾아 연결해요.",
    icon: (
      <>
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
      </>
    ),
  },
];

export default function IntroPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (getSession()) {
      router.replace("/home");
      return;
    }
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
          minHeight: "100dvh",
          width: "100%",
          maxWidth: "480px",
          marginX: "auto",
          paddingX: "5",
          paddingTop: "9",
          paddingBottom: "9",
          display: "flex",
          flexDirection: "column",
          gap: "8",
        })}
      >
        <motion.header
          className={css({ display: "flex", flexDirection: "column", gap: "5" })}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <span
            className={css({
              display: "inline-grid",
              placeItems: "center",
              width: "52px",
              height: "52px",
              borderRadius: "18px",
              color: "white",
              fontSize: "xl",
              fontWeight: "black",
              background: "linear-gradient(140deg, #b83e3a 0%, #ff6b5f 58%, #ff9a87 100%)",
              boxShadow: "0 16px 32px rgba(255,107,95,.28)",
            })}
          >
            H
          </span>
          <div>
            <span
              className={css({
                display: "inline-block",
                marginBottom: "3",
                paddingX: "3",
                paddingY: "1.5",
                borderRadius: "capsule",
                color: "primary.700",
                fontSize: "xs",
                fontWeight: "black",
                background: "primary.50",
                border: "1px solid",
                borderColor: "primary.100",
              })}
            >
              홍익대 키워드 매칭 소개팅
            </span>
            <h1 className={css({ color: "ink.950", fontSize: "4xl", fontWeight: "black", lineHeight: "1.1" })}>
              외모보다 신뢰와
              <br />
              진심이 먼저예요
            </h1>
            <p className={css({ marginTop: "4", color: "ink.700", fontSize: "md", lineHeight: "1.75" })}>
              홍익대 인증으로 상대의 기본 신뢰를 확인하고, 겉모습이 아닌 만남의 태도와 생활
              신호로 한 사람에게 집중할 수 있는 연결을 제안해요.
            </p>
          </div>
        </motion.header>

        <div className={css({ display: "flex", flexDirection: "column", gap: "3" })}>
          {valueProps.map((prop, index) => (
            <motion.article
              key={prop.title}
              className={css({
                display: "flex",
                gap: "3.5",
                padding: "4",
                background: "surface.card",
                border: "1px solid",
                borderColor: "surface.hairline",
                borderRadius: "liquid",
                boxShadow: "cardSoft",
              })}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <span
                aria-hidden
                className={css({
                  display: "grid",
                  placeItems: "center",
                  width: "44px",
                  height: "44px",
                  flexShrink: 0,
                  borderRadius: "14px",
                  color: "primary.700",
                  background: "primary.50",
                  border: "1px solid",
                  borderColor: "primary.100",
                })}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  {prop.icon}
                </svg>
              </span>
              <div className={css({ minWidth: 0 })}>
                <h2 className={css({ color: "ink.950", fontSize: "md", fontWeight: "black", lineHeight: "1.4" })}>
                  {prop.title}
                </h2>
                <p className={css({ marginTop: "1", color: "ink.500", fontSize: "sm", lineHeight: "1.65" })}>
                  {prop.body}
                </p>
              </div>
            </motion.article>
          ))}
        </div>

        <motion.div
          className={css({ marginTop: "auto", display: "flex", flexDirection: "column", gap: "3" })}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.34, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link
            href="/signin"
            className={css({
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "54px",
              borderRadius: "capsule",
              color: "white",
              fontSize: "md",
              fontWeight: "black",
              background: "linear-gradient(135deg, #b83e3a, #d0463c)",
              boxShadow: "0 16px 34px rgba(255,107,95,.3)",
              transition: "transform 120ms ease",
              _active: { transform: "scale(0.98)" },
            })}
          >
            재학생 인증으로 시작하기
          </Link>
          <p className={css({ textAlign: "center", color: "ink.500", fontSize: "xs", lineHeight: "1.6" })}>
            비밀번호는 저장하지 않고 재학 확인에만 사용해요.
          </p>
        </motion.div>
      </main>
    </>
  );
}
