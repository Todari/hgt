import type { Metadata } from "next";
import { css } from "_panda/css";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { PRIVACY_POLICY } from "@/content/legal";

// Public, unauthenticated URL — store review forms link here.
export const metadata: Metadata = { title: "개인정보처리방침 | HGT" };

export default function PrivacyPage() {
  return (
    <main
      className={css({
        maxWidth: "720px",
        marginX: "auto",
        paddingX: "5",
        paddingY: "10",
      })}
    >
      <LegalDocument markdown={PRIVACY_POLICY} />
    </main>
  );
}
