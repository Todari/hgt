import React from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "HGT | 홍익대 인증 키워드 매칭",
  description:
    "검증된 홍익대 구성원과 매주 한 번. 사진 대신 취향과 키워드로 만나는 1:1 매칭 서비스.",
};

// viewport-fit=cover makes env(safe-area-inset-*) non-zero on notched devices
// (iOS) so content can clear the notch / status bar / home indicator.
// interactiveWidget=resizes-content shrinks the layout viewport when the
// on-screen keyboard opens, keeping the chat composer visible.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#f6f0e4",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
