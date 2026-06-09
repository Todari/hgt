"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { css, cx } from "_panda/css";
import { hongikLoginSchema } from "@hgt-client/contract";
import {
  GlassBadge,
  GlassButton,
  GlassMetric,
  GlassPanel,
  GlassTextField,
} from "@/components/ui/glass";
import { api, ApiError } from "@/lib/api";
import { setSession } from "@/lib/session";

export default function SignInPage() {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
      router.push("/home");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

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
          top: "9%",
          right: "-18%",
          width: "88%",
          height: "42%",
          background:
            "linear-gradient(108deg, transparent, rgba(255,107,95,.17) 32%, rgba(255,107,95,.2) 58%, rgba(255,107,95,.1), transparent)",
          filter: "blur(15px)",
          transform: "rotate(9deg)",
        })}
        animate={{ x: [18, -18, 18], y: [0, 16, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      <div
        className={css({
          position: "relative",
          zIndex: 1,
          maxWidth: "1080px",
          minHeight: "calc(100dvh - 64px)",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: { base: "1fr", lg: ".95fr 1.05fr" },
          alignItems: "center",
          gap: { base: "6", lg: "9" },
          paddingY: { base: "3", md: "6" },
        })}
      >
        <motion.section
          className={css({
            display: "flex",
            flexDirection: "column",
            gap: "6",
            order: { base: 2, lg: 1 },
          })}
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link
            href="/"
            className={cx(
              "glass-control",
              css({
                width: "fit-content",
                borderRadius: "capsule",
                paddingX: "4",
                paddingY: "2",
                color: "ink.700",
                fontSize: "sm",
                fontWeight: "bold",
              }),
            )}
          >
            <span className={css({ position: "relative", zIndex: 1 })}>HGT</span>
          </Link>

          <header className={css({ display: "flex", flexDirection: "column", gap: "4" })}>
            <GlassBadge>홍익대 포털 인증</GlassBadge>
            <div className={css({ display: "flex", flexDirection: "column", gap: "3" })}>
              <h1
                className={css({
                  color: "ink.950",
                  fontSize: { base: "4xl", md: "5xl" },
                  lineHeight: "1.05",
                  fontWeight: "black",
                })}
              >
                믿을 수 있는 상대부터 시작합니다.
              </h1>
              <p
                className={css({
                  maxWidth: "520px",
                  color: "ink.700",
                  fontSize: { base: "md", md: "lg" },
                  lineHeight: "1.75",
                })}
              >
                HGT는 재학생 인증을 먼저 확인한 뒤, AI가 외모가 아닌 궁합 신호를
                읽어 한 사람에게 집중할 수 있는 매칭을 준비합니다.
              </p>
            </div>
          </header>

          <div
            className={css({
              display: "grid",
              gridTemplateColumns: { base: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
              gap: "3",
              maxWidth: "560px",
            })}
          >
            <GlassMetric value="1회" label="포털 확인" />
            <GlassMetric value="0개" label="비밀번호 저장" />
            <GlassMetric value="1:1" label="집중 매칭" />
          </div>
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: 22, rotateX: 7 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.68, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -4, rotateX: 1.1, rotateY: 1.2 }}
        >
          <GlassPanel
            className={css({
              order: { base: 1, lg: 2 },
              borderRadius: "vessel",
              padding: { base: "4", md: "6" },
            })}
          >
            <div className="liquid-sheen" aria-hidden />
            <div
              className={css({
                position: "relative",
                zIndex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "5",
              })}
            >
              <div className={css({ display: "flex", alignItems: "center", gap: "3" })}>
                <span
                  className={css({
                    display: "grid",
                    placeItems: "center",
                    width: "48px",
                    height: "48px",
                    flexShrink: 0,
                    borderRadius: "18px",
                    color: "white",
                    fontWeight: "black",
                    background:
                      "linear-gradient(140deg, #b83e3a 0%, #ff6b5f 58%, #ff9a87 100%)",
                    boxShadow:
                      "0 16px 30px rgba(255,107,95,.28), 12px -10px 28px rgba(255,107,95,.14)",
                  })}
                >
                  H
                </span>
                <div>
                  <h2
                    className={css({
                      color: "ink.950",
                      fontSize: "2xl",
                      fontWeight: "black",
                    })}
                  >
                    로그인
                  </h2>
                  <p className={css({ color: "ink.500", fontSize: "sm", fontWeight: "medium" })}>
                    Hongik Ground Table
                  </p>
                </div>
              </div>

              <form
                onSubmit={onSubmit}
                className={css({
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
                  placeholder="B000000"
                />
                <GlassTextField
                  id="hongik-password"
                  label="포털 비밀번호"
                  type="password"
                  value={pw}
                  onChange={(event) => setPw(event.target.value)}
                  autoComplete="current-password"
                  placeholder="비밀번호"
                  helper="비밀번호는 저장하지 않고 재학 확인에만 사용합니다."
                />

                <GlassButton type="submit" disabled={loading}>
                  {loading ? "인증 중..." : "재학 인증하고 시작하기"}
                </GlassButton>
              </form>

              {error && (
                <div
                  className={css({
                    border: "1px solid rgba(255,107,95,.24)",
                    borderRadius: "18px",
                    padding: "4",
                    background: "rgba(255,245,242,.54)",
                    boxShadow: "0 14px 28px rgba(255,107,95,.1)",
                  })}
                >
                  <p
                    className={css({
                      color: "ink.900",
                      fontSize: "sm",
                      fontWeight: "bold",
                    })}
                  >
                    {error}
                  </p>
                </div>
              )}
            </div>
          </GlassPanel>
        </motion.div>
      </div>
    </main>
  );
}
