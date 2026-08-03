import React from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_URL = "https://hgt.todari.dev";
const TITLE = "HGT | 홍익대 인증 키워드 매칭";
const DESCRIPTION =
  "검증된 홍익대 구성원과 매주 한 번. 사진 대신 취향과 키워드로 만나는 1:1 매칭 서비스.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s | HGT",
  },
  description: DESCRIPTION,
  applicationName: "HGT",
  keywords: [
    "HGT",
    "홍익대학교",
    "홍익대 소개팅",
    "대학생 매칭",
    "키워드 매칭",
    "캠퍼스 소개팅",
  ],
  authors: [{ name: "Todari", url: "https://todari.dev" }],
  creator: "Todari",
  category: "lifestyle",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "/",
    siteName: "HGT",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ff4f3f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
