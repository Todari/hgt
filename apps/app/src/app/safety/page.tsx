"use client";

import { motion } from "framer-motion";
import { css, cx } from "_panda/css";
import { GlassBadge, GlassButton, GlassPanel } from "@/components/ui/glass";
import { OfflineBanner } from "@/components/ui/status";

const guideItems = [
  {
    title: "첫 만남은 공개된 장소에서",
    body: "캠퍼스 안팎의 사람이 많은 장소를 선택하고, 늦은 시간이나 외진 장소는 피해주세요.",
  },
  {
    title: "개인정보 공유는 천천히",
    body: "전화번호, 주소, SNS, 금융 정보는 충분히 신뢰가 생긴 뒤에도 신중하게 공유해주세요.",
  },
  {
    title: "불편하면 바로 멈추기",
    body: "강요, 성희롱, 비방, 집요한 연락이 있으면 대화를 중단하고 차단 또는 신고를 사용하세요.",
  },
  {
    title: "오프라인 약속은 주변에 알리기",
    body: "만남 시간과 장소를 친구에게 공유하고, 이동 경로를 스스로 통제할 수 있게 준비해주세요.",
  },
];

export default function SafetyPage() {
  return (
    <main
      className={css({
        position: "relative",
        minHeight: "100dvh",
        overflow: "hidden",
        padding: { base: "4", md: "8" },
      })}
    >
      <div className="mesh-field" aria-hidden />
      <motion.div
        aria-hidden
        className={css({
          position: "absolute",
          top: "8%",
          right: "-18%",
          width: "88%",
          height: "36%",
          background:
            "linear-gradient(108deg, transparent, rgba(255,107,95,.16) 34%, rgba(255,107,95,.08), transparent)",
          filter: "blur(15px)",
          transform: "rotate(9deg)",
        })}
        animate={{ x: [16, -16, 16], y: [0, 14, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
      />

      <section
        className={css({
          position: "relative",
          zIndex: 1,
          maxWidth: "960px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "6",
        })}
      >
        <nav
          className={cx(
            "glass-nav",
            css({
              minHeight: "64px",
              borderRadius: "capsule",
              display: "flex",
              alignItems: { base: "flex-start", sm: "center" },
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "3",
              padding: "2",
              paddingLeft: { base: "4", md: "5" },
            }),
          )}
        >
          <div className={css({ position: "relative", zIndex: 1 })}>
            <p className={css({ color: "ink.950", fontSize: "sm", fontWeight: "black" })}>
              HGT 안전 가이드
            </p>
            <p className={css({ color: "ink.500", fontSize: "xs", fontWeight: "bold" })}>
              소개팅 전 확인할 기본 원칙
            </p>
          </div>
          <div className={css({ position: "relative", zIndex: 1, display: "flex", flexWrap: "wrap", gap: "2" })}>
            <GlassButton href="/home" variant="secondary">
              홈
            </GlassButton>
            <GlassButton href="/settings" variant="secondary">
              설정
            </GlassButton>
          </div>
        </nav>

        <OfflineBanner />

        <GlassPanel
          className={css({
            minHeight: "300px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: "6",
          })}
        >
          <div className="liquid-sheen" aria-hidden />
          <div className={css({ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: "4" })}>
            <GlassBadge>Before You Meet</GlassBadge>
            <h1
              className={css({
                color: "ink.950",
                fontSize: { base: "3xl", md: "5xl" },
                lineHeight: "1.06",
                fontWeight: "black",
              })}
            >
              신뢰는 인증에서 시작하고, 안전은 선택에서 완성됩니다.
            </h1>
            <p className={css({ color: "ink.700", fontSize: { base: "md", md: "lg" }, lineHeight: "1.7" })}>
              HGT는 재학 인증과 1:1 매칭을 제공하지만, 실제 만남에서는 본인의 속도와
              경계를 가장 우선해 주세요.
            </p>
          </div>
        </GlassPanel>

        <section
          className={css({
            display: "grid",
            gridTemplateColumns: { base: "1fr", md: "repeat(2, minmax(0, 1fr))" },
            gap: "4",
          })}
        >
          {guideItems.map((item, index) => (
            <GlassPanel key={item.title} tone="quiet" interactive className={css({ minHeight: "180px" })}>
              <div className={css({ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: "3" })}>
                <span className={css({ color: "primary.700", fontSize: "xs", fontWeight: "black" })}>
                  0{index + 1}
                </span>
                <h2 className={css({ color: "ink.950", fontSize: "xl", fontWeight: "black" })}>
                  {item.title}
                </h2>
                <p className={css({ color: "ink.700", fontSize: "sm", lineHeight: "1.7" })}>
                  {item.body}
                </p>
              </div>
            </GlassPanel>
          ))}
        </section>
      </section>
    </main>
  );
}
