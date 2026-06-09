"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { css, cx } from "_panda/css";

const problems = [
  {
    title: "상대를 믿기 어려운 프로필",
    detail: "앱 안의 몇 장짜리 정보만으로는 같은 사람을 만나도 되는지 판단하기 어려웠습니다.",
  },
  {
    title: "가벼워지는 다대일 매칭",
    detail: "여러 명에게 동시에 열리는 연결은 한 사람에게 집중하기 어렵게 만듭니다.",
  },
  {
    title: "외모와 소개글 중심의 선택",
    detail: "사진과 짧은 자기소개만 보고 고르는 방식은 진짜 잘 맞는 사람을 놓치게 합니다.",
  },
];

const solutions = [
  {
    label: "Trust",
    title: "홍익대 인증으로 시작",
    detail: "포털 인증을 거친 사용자만 들어오게 해 최소한의 신뢰 기반을 먼저 만듭니다.",
  },
  {
    label: "Focus",
    title: "한 번에 한 사람에게 집중",
    detail: "HGT의 매칭은 많은 선택지를 던지는 대신, 진지하게 볼 수 있는 연결을 우선합니다.",
  },
  {
    label: "AI",
    title: "외모가 아닌 궁합 신호",
    detail: "AI가 생활 리듬, 관심사, 대화 성향, 만남의 온도를 읽고 어울리는 상대를 추천합니다.",
  },
];

const matchSignals = ["재학 인증", "생활 리듬", "대화 성향", "만남 온도"];

export default function HomePage() {
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
          top: { base: "72px", md: "92px" },
          left: "-12%",
          width: "124%",
          height: { base: "240px", md: "320px" },
          background:
            "linear-gradient(100deg, transparent 0%, rgba(255,107,95,.2) 22%, rgba(255,107,95,.14) 48%, rgba(255,107,95,.08) 68%, transparent 100%)",
          filter: "blur(15px)",
          transform: "rotate(-8deg)",
          opacity: 0.72,
        })}
        animate={{ x: [-24, 26, -24], y: [0, 16, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.nav
        className={cx(
          "glass-nav",
          css({
            position: "relative",
            zIndex: 5,
            maxWidth: "1120px",
            margin: "0 auto",
            minHeight: "64px",
            borderRadius: "capsule",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "3",
            padding: "2",
            paddingLeft: { base: "4", md: "5" },
          }),
        )}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className={css({
            position: "relative",
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            gap: "3",
            minWidth: 0,
          })}
        >
          <span
            className={css({
              display: "grid",
              placeItems: "center",
              width: "38px",
              height: "38px",
              flexShrink: 0,
              borderRadius: "14px",
              color: "white",
              fontSize: "sm",
              fontWeight: "black",
              background:
                "linear-gradient(140deg, #b83e3a 0%, #ff6b5f 58%, #ff9a87 100%)",
              boxShadow:
                "0 14px 26px rgba(255,107,95,.28), 10px -8px 24px rgba(255,107,95,.16)",
            })}
          >
            H
          </span>
          <div className={css({ minWidth: 0 })}>
            <p className={css({ fontSize: "sm", fontWeight: "bold" })}>HGT</p>
            <p
              className={css({
                display: { base: "none", sm: "block" },
                color: "ink.500",
                fontSize: "xs",
              })}
            >
              AI campus blind date
            </p>
          </div>
        </div>
        <Link
          href="/signin"
          className={cx(
            "glass-control",
            css({
              position: "relative",
              zIndex: 1,
              borderRadius: "capsule",
              paddingX: { base: "4", md: "5" },
              paddingY: "2.5",
              color: "ink.900",
              fontSize: "sm",
              fontWeight: "bold",
              whiteSpace: "nowrap",
              boxShadow: "glassLift",
            }),
          )}
        >
          인증하기
        </Link>
      </motion.nav>

      <section
        className={css({
          position: "relative",
          zIndex: 1,
          maxWidth: "1120px",
          minHeight: { base: "calc(100dvh - 96px)", md: "calc(100dvh - 128px)" },
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: { base: "1fr", lg: "1.02fr .98fr" },
          alignItems: "center",
          gap: { base: "8", lg: "10" },
          paddingTop: { base: "10", md: "8" },
          paddingBottom: { base: "8", md: "6" },
        })}
      >
        <motion.div
          className={css({
            display: "flex",
            flexDirection: "column",
            gap: "7",
            maxWidth: "660px",
          })}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.62, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className={css({ display: "flex", flexDirection: "column", gap: "4" })}>
            <div
              className={cx(
                "glass-panel",
                css({
                  width: "fit-content",
                  borderRadius: "capsule",
                  paddingX: "4",
                  paddingY: "2",
                  color: "ink.700",
                  fontSize: "sm",
                  fontWeight: "bold",
                  boxShadow: "glassInset",
                }),
              )}
            >
              <span className={css({ position: "relative", zIndex: 1 })}>
                믿을 수 있는 캠퍼스 소개팅
              </span>
            </div>
            <h1
              className={css({
                maxWidth: "720px",
                color: "ink.950",
                fontSize: { base: "4xl", md: "6xl" },
                lineHeight: "1.02",
                fontWeight: "black",
              })}
            >
              외모보다 신뢰와 진심이 먼저인 매칭
            </h1>
            <p
              className={css({
                maxWidth: "590px",
                color: "ink.700",
                fontSize: { base: "md", md: "lg" },
                lineHeight: "1.75",
              })}
            >
              HGT는 홍익대 인증으로 상대의 기본 신뢰를 확인하고, AI가 겉모습이
              아닌 만남의 태도와 생활 신호를 읽어 한 사람에게 집중할 수 있는
              연결을 제안합니다.
            </p>
          </div>

          <div className={css({ display: "flex", flexWrap: "wrap", gap: "3" })}>
            <motion.div whileHover={{ y: -3, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/signin"
                className={cx(
                  "glass-control",
                  css({
                    position: "relative",
                    zIndex: 1,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "52px",
                    borderRadius: "capsule",
                    paddingX: "6",
                    color: "white",
                    fontWeight: "black",
                    background:
                      "linear-gradient(135deg, rgba(184,62,58,.94), rgba(255,107,95,.9) 58%, rgba(255,154,135,.86))",
                    boxShadow: "actionGlow",
                  }),
                )}
              >
                <span className={css({ position: "relative", zIndex: 1 })}>
                  인증하고 시작하기
                </span>
              </Link>
            </motion.div>
            <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}>
              <a
                href="#why-hgt"
                className={cx(
                  "glass-control",
                  css({
                    position: "relative",
                    zIndex: 1,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "52px",
                    borderRadius: "capsule",
                    paddingX: "6",
                    color: "ink.800",
                    fontWeight: "bold",
                  }),
                )}
              >
                <span className={css({ position: "relative", zIndex: 1 })}>
                  왜 HGT인가요
                </span>
              </a>
            </motion.div>
          </div>

          <div
            className={css({
              display: "grid",
              gridTemplateColumns: { base: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
              gap: "3",
              maxWidth: "660px",
            })}
          >
            {["인증된 상대", "1:1 중심", "AI 궁합"].map((item) => (
              <div
                key={item}
                className={css({
                  border: "1px solid rgba(255,255,255,.62)",
                  borderRadius: "20px",
                  padding: "3",
                  color: "ink.700",
                  background: "rgba(255,255,255,.36)",
                  fontSize: "sm",
                  fontWeight: "bold",
                  boxShadow: "0 12px 26px rgba(10,17,24,.07)",
                  backdropFilter: "blur(11px)",
                })}
              >
                {item}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className={cx(
            "glass-panel",
            css({
              position: "relative",
              overflow: "hidden",
              borderRadius: "vessel",
              padding: { base: "4", md: "5" },
              minHeight: { base: "500px", md: "580px" },
            }),
          )}
          initial={{ opacity: 0, y: 22, rotateX: 7 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.72, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -6, rotateX: 1.2, rotateY: -1.4 }}
        >
          <div className="liquid-sheen" aria-hidden />
          <div
            className={css({
              position: "relative",
              zIndex: 1,
              display: "flex",
              flexDirection: "column",
              height: "100%",
              gap: "4",
            })}
          >
            <div
              className={css({
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "4",
              })}
            >
              <div>
                <p className={css({ color: "ink.500", fontSize: "sm", fontWeight: "bold" })}>
                  AI Match Note
                </p>
                <h2
                  className={css({
                    marginTop: "1",
                    color: "ink.950",
                    fontSize: { base: "2xl", md: "3xl" },
                    lineHeight: "1.12",
                    fontWeight: "black",
                  })}
                >
                  사진이 아니라 신호를 봅니다
                </h2>
              </div>
              <motion.div
                className={css({
                  display: "grid",
                  placeItems: "center",
                  width: "72px",
                  height: "72px",
                  flexShrink: 0,
                  borderRadius: "50%",
                  color: "primary.700",
                  fontSize: "xs",
                  fontWeight: "black",
                  background:
                    "conic-gradient(from 160deg, #b83e3a, #ff6b5f, #ff9a87, #ffe2db, #ff6b5f, #b83e3a)",
                  boxShadow:
                    "0 18px 38px rgba(255,107,95,.22), -10px 10px 30px rgba(255,107,95,.14)",
                  padding: "7px",
                })}
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
              >
                <div
                  className={css({
                    display: "grid",
                    placeItems: "center",
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,.76)",
                    backdropFilter: "blur(11px)",
                  })}
                >
                  AI
                </div>
              </motion.div>
            </div>

            <div
              className={css({
                display: "grid",
                gridTemplateColumns: { base: "repeat(2, minmax(0, 1fr))", sm: "repeat(4, minmax(0, 1fr))" },
                gap: "2",
              })}
            >
              {matchSignals.map((item, index) => (
                <motion.div
                  key={item}
                  className={css({
                    border: "1px solid rgba(255,255,255,.64)",
                    borderRadius: "18px",
                    padding: "3",
                    color: "ink.700",
                    fontSize: "xs",
                    fontWeight: "bold",
                    textAlign: "center",
                    background:
                      index % 2 === 0
                        ? "rgba(255,255,255,.42)"
                        : "rgba(255,245,242,.38)",
                    boxShadow: "0 10px 22px rgba(10,17,24,.07)",
                    backdropFilter: "blur(10px)",
                  })}
                  animate={{ y: [0, index % 2 === 0 ? -4 : 4, 0] }}
                  transition={{
                    duration: 3.8 + index * 0.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  {item}
                </motion.div>
              ))}
            </div>

            <div
              className={css({
                display: "flex",
                flexDirection: "column",
                gap: "3",
                marginTop: "2",
              })}
            >
              {solutions.map((solution, index) => (
                <motion.article
                  key={solution.title}
                  className={css({
                    position: "relative",
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,.66)",
                    borderRadius: "24px",
                    padding: "4",
                    background:
                      "linear-gradient(145deg, rgba(255,255,255,.58), rgba(255,255,255,.28))",
                    boxShadow:
                      "0 1px 0 rgba(255,255,255,.72) inset, 0 16px 32px rgba(10,17,24,.1)",
                    backdropFilter: "blur(12px)",
                  })}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.52,
                    delay: 0.32 + index * 0.08,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  whileHover={{ x: 4, scale: 1.015 }}
                >
                  <span
                    className={css({
                      position: "absolute",
                      inset: "0 auto 0 0",
                      width: "8px",
                      background: `rgba(255, 107, 95, ${0.18 - index * 0.035})`,
                      boxShadow: "18px 0 44px rgba(255,107,95,.14)",
                    })}
                  />
                  <div
                    className={css({
                      position: "relative",
                      zIndex: 1,
                      display: "grid",
                      gridTemplateColumns: "auto 1fr",
                      gap: "3",
                      alignItems: "start",
                    })}
                  >
                    <div
                      className={css({
                        display: "grid",
                        placeItems: "center",
                        width: "46px",
                        height: "46px",
                        borderRadius: "16px",
                        color: "primary.700",
                        fontSize: "xs",
                        fontWeight: "black",
                        background: "rgba(255,255,255,.5)",
                        border: "1px solid rgba(255,255,255,.72)",
                        boxShadow: "0 10px 20px rgba(10,17,24,.08)",
                      })}
                    >
                      {solution.label}
                    </div>
                    <div>
                      <h3 className={css({ color: "ink.950", fontWeight: "black" })}>
                        {solution.title}
                      </h3>
                      <p
                        className={css({
                          marginTop: "1",
                          color: "ink.500",
                          fontSize: "sm",
                          lineHeight: "1.65",
                        })}
                      >
                        {solution.detail}
                      </p>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      <section
        id="why-hgt"
        className={css({
          position: "relative",
          zIndex: 1,
          maxWidth: "1120px",
          margin: "0 auto",
          paddingBottom: { base: "10", md: "16" },
        })}
      >
        <div
          className={css({
            display: "grid",
            gridTemplateColumns: { base: "1fr", md: "0.82fr 1.18fr" },
            gap: { base: "5", md: "6" },
            alignItems: "start",
          })}
        >
          <div
            className={css({
              display: "flex",
              flexDirection: "column",
              gap: "3",
              paddingTop: "2",
            })}
          >
            <p className={css({ color: "primary.700", fontSize: "sm", fontWeight: "black" })}>
              왜 만들었나요
            </p>
            <h2
              className={css({
                color: "ink.950",
                fontSize: { base: "3xl", md: "4xl" },
                lineHeight: "1.08",
                fontWeight: "black",
              })}
            >
              소개팅 앱에서 가장 아쉬웠던 세 가지
            </h2>
          </div>

          <div
            className={css({
              display: "grid",
              gridTemplateColumns: { base: "1fr", md: "repeat(3, minmax(0, 1fr))" },
              gap: "3",
            })}
          >
            {problems.map((problem, index) => (
              <motion.article
                key={problem.title}
                className={cx(
                  "glass-panel",
                  css({
                    position: "relative",
                    overflow: "hidden",
                    minHeight: "210px",
                    borderRadius: "liquid",
                    padding: "4",
                    display: "flex",
                    flexDirection: "column",
                    gap: "3",
                  }),
                )}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4 }}
              >
                <span
                  className={css({
                    position: "relative",
                    zIndex: 1,
                    color: "primary.700",
                    fontSize: "xs",
                    fontWeight: "black",
                  })}
                >
                  0{index + 1}
                </span>
                <h3
                  className={css({
                    position: "relative",
                    zIndex: 1,
                    color: "ink.950",
                    fontSize: "lg",
                    lineHeight: "1.25",
                    fontWeight: "black",
                  })}
                >
                  {problem.title}
                </h3>
                <p
                  className={css({
                    position: "relative",
                    zIndex: 1,
                    color: "ink.500",
                    fontSize: "sm",
                    lineHeight: "1.7",
                  })}
                >
                  {problem.detail}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
