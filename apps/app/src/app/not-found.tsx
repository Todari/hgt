import { css } from "_panda/css";
import { GlassButton, GlassPanel } from "@/components/ui/glass";

/** 404 — unknown route. */
export default function NotFound() {
  return (
    <main
      className={css({
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: "5",
      })}
    >
      <GlassPanel
        className={css({
          width: "100%",
          maxWidth: "420px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4",
          padding: "8",
          textAlign: "center",
        })}
      >
        <p className={css({ color: "primary.600", fontSize: "sm", fontWeight: "black" })}>
          404
        </p>
        <h1 className={css({ color: "ink.950", fontSize: "xl", fontWeight: "black" })}>
          페이지를 찾을 수 없어요
        </h1>
        <p className={css({ color: "ink.500", fontSize: "sm", lineHeight: "1.7" })}>
          주소가 바뀌었거나 삭제된 페이지일 수 있어요.
        </p>
        <GlassButton href="/home" className={css({ width: "100%" })}>
          홈으로
        </GlassButton>
      </GlassPanel>
    </main>
  );
}
