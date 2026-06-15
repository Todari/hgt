"use client";

/**
 * Last-resort error boundary — replaces the root layout entirely, so
 * globals.css / Panda classes are NOT available here. Inline styles only,
 * mirroring the token values (surface.card, hairline, cardSoft, primary.600).
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          padding:
            "env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)",
          background: "linear-gradient(160deg, #fffaf8 0%, #f8efec 48%, #eee6e3 100%)",
          color: "#0a1118",
          fontFamily:
            '"Pretendard Variable", ui-sans-serif, system-ui, -apple-system, sans-serif',
          wordBreak: "keep-all",
        }}
      >
        <div
          style={{
            width: "calc(100% - 40px)",
            maxWidth: "420px",
            padding: "32px 24px",
            borderRadius: "24px",
            background: "rgba(255, 255, 255, 0.92)",
            border: "1px solid rgba(15, 25, 35, 0.1)",
            boxShadow: "0 6px 24px rgba(17, 24, 32, 0.08)",
            textAlign: "center",
          }}
        >
          <h1 style={{ margin: 0, fontSize: "20px", fontWeight: 900 }}>
            문제가 발생했어요
          </h1>
          <p
            style={{
              margin: "12px 0 20px",
              fontSize: "14px",
              lineHeight: 1.7,
              color: "#5e6f7a",
            }}
          >
            앱을 다시 불러오면 해결될 수 있어요.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              width: "100%",
              minHeight: "52px",
              border: "none",
              borderRadius: "999px",
              background: "linear-gradient(135deg, #b83e3a, #d0463c)",
              color: "white",
              fontSize: "16px",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
