"use client";

import Link from "next/link";
import { useState } from "react";
import { css } from "_panda/css";
import {
  GlassBadge,
  GlassButton,
  GlassChip,
  GlassFeatureCard,
  GlassMetric,
  GlassPanel,
  GlassTextarea,
  GlassTextField,
  GlassToggle,
} from "@/components/ui/glass";

const swatches = [
  ["Primary", "#FF6B5F"],
  ["Deep", "#B83E3A"],
  ["Soft", "#FFE2DB"],
  ["Ink", "#0A1118"],
  ["Muted", "#5E6F7A"],
  ["Glass", "rgba(255,255,255,.62)"],
];

const featureCards = [
  {
    label: "01",
    title: "인증 기반 신뢰",
    body: "홍익대 포털 인증을 거친 사용자만 매칭 흐름에 들어옵니다.",
  },
  {
    label: "02",
    title: "1:1 집중 매칭",
    body: "여러 명을 동시에 비교하는 구조보다 한 사람을 진지하게 볼 수 있게 설계합니다.",
  },
  {
    label: "03",
    title: "AI 궁합 신호",
    body: "외모가 아닌 생활 리듬, 대화 성향, 만남의 온도를 기준으로 추천합니다.",
  },
];

export default function DesignSystemPage() {
  const [matchingEnabled, setMatchingEnabled] = useState(true);
  const [sameDepartmentEnabled, setSameDepartmentEnabled] = useState(false);

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
      <section
        className={css({
          position: "relative",
          zIndex: 1,
          maxWidth: "1120px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "8",
          paddingBottom: "12",
        })}
      >
        <nav
          className={css({
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "4",
          })}
        >
          <Link href="/" className={css({ color: "ink.700", fontSize: "sm", fontWeight: "bold" })}>
            HGT
          </Link>
          <GlassButton href="/signin" variant="secondary">
            인증 화면
          </GlassButton>
        </nav>

        <header
          className={css({
            display: "grid",
            gridTemplateColumns: { base: "1fr", lg: ".9fr 1.1fr" },
            alignItems: "end",
            gap: "6",
            paddingTop: { base: "6", md: "10" },
          })}
        >
          <div className={css({ display: "flex", flexDirection: "column", gap: "4" })}>
            <GlassBadge>HGT Warm Glass System</GlassBadge>
            <h1
              className={css({
                color: "ink.950",
                fontSize: { base: "4xl", md: "6xl" },
                lineHeight: "1.02",
                fontWeight: "black",
              })}
            >
              따뜻하지만 가볍지 않은 소개팅 UI
            </h1>
          </div>
          <p
            className={css({
              color: "ink.700",
              fontSize: { base: "md", md: "lg" },
              lineHeight: "1.75",
              maxWidth: "560px",
            })}
          >
            코랄 primary 하나로 설렘을 만들고, 글래스 레이어와 ink 계열로 신뢰감을
            유지합니다. 이 페이지는 앞으로 만들 인증, 매칭, 대화, 결과 화면의 기준입니다.
          </p>
        </header>

        <section
          className={css({
            display: "grid",
            gridTemplateColumns: { base: "1fr", md: "repeat(6, minmax(0, 1fr))" },
            gap: "3",
          })}
        >
          {swatches.map(([label, color]) => (
            <GlassPanel
              key={label}
              tone="quiet"
              className={css({
                minHeight: "132px",
                padding: "3",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              })}
            >
              <div
                className={css({
                  position: "relative",
                  zIndex: 1,
                  height: "48px",
                  borderRadius: "16px",
                  border: "1px solid rgba(255,255,255,.72)",
                  boxShadow: "0 12px 24px rgba(10,17,24,.08)",
                })}
                style={{ background: color }}
              />
              <div className={css({ position: "relative", zIndex: 1 })}>
                <p className={css({ color: "ink.950", fontSize: "sm", fontWeight: "black" })}>
                  {label}
                </p>
                <p className={css({ color: "ink.500", fontSize: "xs", fontWeight: "bold" })}>
                  {color}
                </p>
              </div>
            </GlassPanel>
          ))}
        </section>

        <section
          className={css({
            display: "grid",
            gridTemplateColumns: { base: "1fr", lg: ".9fr 1.1fr" },
            gap: "5",
          })}
        >
          <GlassPanel
            className={css({
              minHeight: "420px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "6",
            })}
          >
            <div className="liquid-sheen" aria-hidden />
            <div className={css({ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: "4" })}>
              <GlassBadge>Hero Pattern</GlassBadge>
              <h2
                className={css({
                  color: "ink.950",
                  fontSize: { base: "3xl", md: "4xl" },
                  lineHeight: "1.08",
                  fontWeight: "black",
                })}
              >
                신뢰, 진심, AI 매칭을 한 화면에
              </h2>
              <p className={css({ color: "ink.700", lineHeight: "1.7" })}>
                첫 화면은 서비스 설명보다 사용자가 느끼는 문제와 HGT의 다른 점을
                즉시 보여줍니다.
              </p>
            </div>
            <div className={css({ position: "relative", zIndex: 1, display: "flex", flexWrap: "wrap", gap: "3" })}>
              <GlassButton href="/signin">인증하고 시작하기</GlassButton>
              <GlassButton href="/" variant="secondary">
                랜딩 보기
              </GlassButton>
            </div>
          </GlassPanel>

          <div
            className={css({
              display: "grid",
              gridTemplateColumns: { base: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
              gap: "3",
            })}
          >
            <GlassMetric value="1:1" label="집중 매칭" />
            <GlassMetric value="AI" label="비외모 추천" />
            <GlassTextField
              label="학번"
              placeholder="B000000"
              helper="인증 화면 입력 필드의 기본 상태입니다."
              containerClassName={css({ gridColumn: { sm: "span 2" } })}
            />
            <GlassTextField
              label="오류 상태"
              placeholder="비밀번호"
              error="입력값을 다시 확인해주세요."
              containerClassName={css({ gridColumn: { sm: "span 2" } })}
            />
            <div
              className={css({
                gridColumn: { sm: "span 2" },
                display: "flex",
                flexWrap: "wrap",
                gap: "2",
              })}
            >
              <GlassChip selected>재학 인증</GlassChip>
              <GlassChip selected={false}>생활 리듬</GlassChip>
              <GlassChip selected={false}>대화 성향</GlassChip>
            </div>
            <GlassToggle
              checked={matchingEnabled}
              onChange={setMatchingEnabled}
              label="이번 주 매칭 참여"
              description="진지하게 만날 준비가 되었을 때 켜두는 설정입니다."
            />
            <GlassToggle
              checked={sameDepartmentEnabled}
              onChange={setSameDepartmentEnabled}
              label="같은 과 매칭 허용"
              description="익숙한 생활권의 상대도 후보에 포함합니다."
            />
            <GlassTextarea
              label="AI에게 알려줄 한 줄"
              placeholder="천천히 친해지는 편이고, 대화가 잘 이어지는 사람을 선호해요."
              helper="외모보다 관계에서 중요한 리듬을 입력합니다."
              containerClassName={css({ gridColumn: { sm: "span 2" } })}
            />
          </div>
        </section>

        <section
          className={css({
            display: "grid",
            gridTemplateColumns: { base: "1fr", md: "repeat(3, minmax(0, 1fr))" },
            gap: "3",
          })}
        >
          {featureCards.map((card) => (
            <GlassFeatureCard key={card.title} label={card.label} title={card.title}>
              {card.body}
            </GlassFeatureCard>
          ))}
        </section>
      </section>
    </main>
  );
}
