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
          minHeight: "var(--hgt-page-height)",
          display: "grid",
          placeItems: "center",
          padding:
            "env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)",
          background: "#f7f3ea",
          color: "#11110f",
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
            borderRadius: "20px",
            background: "#fffef9",
            border: "1px solid rgba(54,45,40,.11)",
            boxShadow: "0 12px 34px rgba(73,48,38,.07)",
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
              border: "1px solid rgba(190,48,36,.18)",
              borderRadius: "16px",
              background: "#ff4f3f",
              color: "white",
              boxShadow: "0 10px 24px rgba(255,79,63,.2)",
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
