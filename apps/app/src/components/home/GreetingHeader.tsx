"use client";

import { css } from "_panda/css";

/**
 * Compact home header: name + one warm line. No logout / settings actions
 * here — the bottom TabBar owns navigation and settings owns account actions.
 */
export function GreetingHeader({ name }: { name: string }) {
  return (
    <header className={css({ display: "flex", flexDirection: "column", gap: "1", paddingTop: "1" })}>
      <p className={css({ color: "primary.700", fontSize: "xs", fontWeight: "black", letterSpacing: "0.02em" })}>
        HGT · 홍익대 인증 매칭
      </p>
      <h1 className={css({ color: "ink.950", fontSize: "2xl", fontWeight: "black", lineHeight: "1.2" })}>
        {name}님, 안녕하세요
      </h1>
      <p className={css({ color: "ink.500", fontSize: "sm", lineHeight: "1.6" })}>
        매주 월요일 저녁 7시, 단 한 사람을 소개해요.
      </p>
    </header>
  );
}
