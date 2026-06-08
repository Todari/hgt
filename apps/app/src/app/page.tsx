import React from "react";
import Link from "next/link";
import { css } from "_panda/css";

export default function HomePage() {
  return (
    <main
      className={css({
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100dvh",
        gap: "6",
        padding: "6",
      })}
    >
      <h1 className={css({ fontSize: "5xl", fontWeight: "bold" })}>HGT</h1>
      <p className={css({ color: "gray.600" })}>대학생 매칭 서비스</p>
      <Link
        href="/signin"
        className={css({
          bg: "black",
          color: "white",
          paddingX: "6",
          paddingY: "3",
          borderRadius: "md",
          fontWeight: "medium",
          _hover: { opacity: 0.85 },
        })}
      >
        시작하기
      </Link>
    </main>
  );
}
