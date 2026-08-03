import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HGT | 홍익대 인증 키워드 매칭",
    short_name: "HGT",
    description:
      "검증된 홍익대 구성원과 매주 한 번 만나는 키워드 기반 1:1 매칭 서비스.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f0e4",
    theme_color: "#ff4f3f",
    lang: "ko-KR",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
