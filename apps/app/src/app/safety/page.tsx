"use client";

import { useRouter } from "next/navigation";
import { css } from "_panda/css";
import { AppShell } from "@/components/shell/AppShell";
import { Ambient } from "@/components/ui/Ambient";

const SUPPORT_EMAIL = "support@hgt.kr";

const guideItems = [
  {
    title: "첫 만남은 공개된 장소에서",
    body: "사람이 많은 카페나 식당에서 만나고, 늦은 시간이나 외진 곳은 피해주세요.",
  },
  {
    title: "개인정보는 천천히 공유해요",
    body: "전화번호, 주소, SNS, 금융 정보는 충분히 신뢰가 생긴 뒤에 신중하게 알려주세요.",
  },
  {
    title: "불편하면 바로 멈춰요",
    body: "강요, 성희롱, 비방, 집요한 연락이 있으면 대화를 멈추고 차단하거나 신고하세요.",
  },
  {
    title: "약속은 주변에 알려요",
    body: "만남 시간과 장소를 친구에게 공유하고, 이동 경로를 스스로 정해두세요.",
  },
];

function ShieldIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3 5 6v6c0 4 3 6.7 7 9 4-2.3 7-5 7-9V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export default function SafetyPage() {
  const router = useRouter();

  return (
    <>
      <Ambient />
      <AppShell>
        <div
          className={css({
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "5",
          })}
        >
          <header
            className={css({
              display: "flex",
              alignItems: "center",
              gap: "2",
              minHeight: "44px",
              paddingX: "1",
              paddingTop: "2",
            })}
          >
            <button
              type="button"
              aria-label="뒤로"
              onClick={() => router.back()}
              className={css({
                display: "grid",
                placeItems: "center",
                width: "36px",
                height: "36px",
                marginLeft: "-8px",
                flexShrink: 0,
                borderRadius: "capsule",
                color: "ink.700",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                _active: { background: "rgba(10,17,24,.05)" },
              })}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="m15 6-6 6 6 6" />
              </svg>
            </button>
            <h1 className={css({ color: "ink.950", fontSize: "2xl", fontWeight: "black" })}>안전 가이드</h1>
          </header>

          <section
            className={css({
              position: "relative",
              overflow: "hidden",
              borderRadius: "liquid",
              padding: "5",
              background: "linear-gradient(150deg, #fff5f2, #ffffff 70%)",
              border: "1px solid",
              borderColor: "primary.100",
              boxShadow: "cardSoft",
              display: "flex",
              flexDirection: "column",
              gap: "3",
            })}
          >
            <span
              aria-hidden
              className={css({
                display: "grid",
                placeItems: "center",
                width: "44px",
                height: "44px",
                borderRadius: "14px",
                color: "white",
                background: "linear-gradient(140deg, #b83e3a, #ff6b5f)",
                boxShadow: "0 10px 22px rgba(255,107,95,.24)",
              })}
            >
              <ShieldIcon />
            </span>
            <h2 className={css({ color: "ink.950", fontSize: "xl", fontWeight: "black", lineHeight: "1.3" })}>
              안전은 내 속도와 경계를 지키는 것부터예요.
            </h2>
            <p className={css({ color: "ink.700", fontSize: "sm", lineHeight: "1.7" })}>
              HGT는 재학 인증과 1:1 매칭을 제공하지만, 실제 만남에서는 본인의 속도와 경계를
              가장 우선해 주세요.
            </p>
          </section>

          <section className={css({ display: "flex", flexDirection: "column", gap: "2" })}>
            <h2 className={css({ paddingX: "4", color: "ink.500", fontSize: "xs", fontWeight: "black" })}>
              안전 수칙
            </h2>
            <div
              className={css({
                background: "surface.card",
                border: "1px solid",
                borderColor: "surface.hairline",
                borderRadius: "liquid",
                boxShadow: "cardSoft",
                overflow: "hidden",
                "& > * + *": { borderTop: "1px solid", borderTopColor: "surface.hairline" },
              })}
            >
              {guideItems.map((item, index) => (
                <div
                  key={item.title}
                  className={css({ display: "flex", gap: "3", paddingX: "4", paddingY: "4" })}
                >
                  <span
                    aria-hidden
                    className={css({
                      display: "grid",
                      placeItems: "center",
                      width: "26px",
                      height: "26px",
                      flexShrink: 0,
                      borderRadius: "50%",
                      color: "primary.700",
                      fontSize: "xs",
                      fontWeight: "black",
                      background: "primary.50",
                      border: "1px solid",
                      borderColor: "primary.100",
                    })}
                  >
                    {index + 1}
                  </span>
                  <div className={css({ minWidth: 0 })}>
                    <h3 className={css({ color: "ink.950", fontSize: "md", fontWeight: "bold", lineHeight: "1.4" })}>
                      {item.title}
                    </h3>
                    <p className={css({ marginTop: "1", color: "ink.500", fontSize: "sm", lineHeight: "1.65" })}>
                      {item.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={css({ display: "flex", flexDirection: "column", gap: "2" })}>
            <h2 className={css({ paddingX: "4", color: "ink.500", fontSize: "xs", fontWeight: "black" })}>
              차단과 신고
            </h2>
            <div
              className={css({
                background: "surface.card",
                border: "1px solid",
                borderColor: "surface.hairline",
                borderRadius: "liquid",
                boxShadow: "cardSoft",
                paddingX: "4",
                paddingY: "4",
              })}
            >
              <p className={css({ color: "ink.700", fontSize: "sm", lineHeight: "1.75" })}>
                불편한 상대가 있다면 채팅방 오른쪽 위{" "}
                <span className={css({ color: "ink.950", fontWeight: "black" })}>⋯ 메뉴</span>에서 바로
                차단하거나 신고할 수 있어요. 차단하면 그 상대와의 대화와 매칭이 모두 멈추고,
                신고 내용은 운영팀이 검토해 조치해요.
              </p>
            </div>
          </section>

          <section className={css({ display: "flex", flexDirection: "column", gap: "2" })}>
            <h2 className={css({ paddingX: "4", color: "ink.500", fontSize: "xs", fontWeight: "black" })}>
              도움이 필요하면
            </h2>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className={css({
                display: "flex",
                alignItems: "center",
                gap: "3",
                minHeight: "56px",
                paddingX: "4",
                paddingY: "3",
                background: "surface.card",
                border: "1px solid",
                borderColor: "surface.hairline",
                borderRadius: "liquid",
                boxShadow: "cardSoft",
                transition: "background 120ms ease",
                _active: { background: "rgba(10,17,24,.05)" },
              })}
            >
              <span className={css({ flex: 1, minWidth: 0 })}>
                <span className={css({ display: "block", color: "ink.950", fontSize: "md", fontWeight: "bold" })}>
                  운영팀에 문의하기
                </span>
                <span className={css({ display: "block", marginTop: "0.5", color: "ink.500", fontSize: "xs" })}>
                  {SUPPORT_EMAIL}
                </span>
              </span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={css({ flexShrink: 0, color: "ink.300" })}>
                <path d="M7 17 17 7M9 7h8v8" />
              </svg>
            </a>
          </section>
        </div>
      </AppShell>
    </>
  );
}
