import React from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "HGT",
  description: "대학생 매칭 서비스",
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
  themeColor: "#f8efec",
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
