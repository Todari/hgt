import type { Metadata } from "next";
import { css } from "_panda/css";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { TERMS_OF_SERVICE } from "@/content/legal";

// Public, unauthenticated URL — store review forms link here.
export const metadata: Metadata = { title: "이용약관 | HGT" };

export default function TermsPage() {
  return (
    <main
      className={css({
        maxWidth: "720px",
        marginX: "auto",
        paddingX: "5",
        paddingY: "10",
      })}
    >
      <LegalDocument markdown={TERMS_OF_SERVICE} />
    </main>
  );
}
