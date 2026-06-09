import React from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HGT",
  description: "대학생 매칭 서비스",
};

// viewport-fit=cover makes env(safe-area-inset-*) non-zero on notched devices
// (iOS) so content can clear the notch / status bar / home indicator.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
        {children}
      </body>
    </html>
  );
}
