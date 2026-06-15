"use client";

import { useState } from "react";
import { css } from "_panda/css";
import { LegalDocument } from "@/components/legal/LegalDocument";
import {
  PRIVACY_POLICY,
  TERMS_OF_SERVICE,
  TERMS_VERSION,
} from "@/content/legal";
import { StepCard } from "./primitives";

type DocKey = "terms" | "privacy" | null;

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={css({
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        width: "24px",
        height: "24px",
        borderRadius: "8px",
        border: "1.5px solid",
        borderColor: checked ? "transparent" : "surface.hairline",
        background: checked ? "linear-gradient(135deg, #ff7a6b, #d0463c)" : "surface.card",
        transition: "background 140ms ease, border-color 140ms ease",
      })}
    >
      {checked && (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 13l4 4L19 7" />
        </svg>
      )}
    </span>
  );
}

function ConsentRow({
  checked,
  onToggle,
  title,
  required,
  description,
  onView,
  disabled = false,
}: {
  checked: boolean;
  onToggle: () => void;
  title: string;
  required: boolean;
  description?: string;
  onView?: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={css({
        display: "flex",
        flexDirection: "column",
        gap: description ? "2" : "0",
        padding: "3.5",
      })}
    >
      <div className={css({ display: "flex", alignItems: "center", gap: "3" })}>
        <button
          type="button"
          role="checkbox"
          aria-checked={checked}
          disabled={disabled}
          onClick={onToggle}
          className={css({
            display: "flex",
            alignItems: "center",
            gap: "3",
            flex: 1,
            minWidth: 0,
            minHeight: "32px",
            textAlign: "left",
            background: "transparent",
            border: "none",
            cursor: disabled ? "default" : "pointer",
          })}
        >
          <CheckBox checked={checked} />
          <span className={css({ minWidth: 0, display: "flex", alignItems: "baseline", gap: "1.5" })}>
            <span
              className={css({
                fontSize: "sm",
                fontWeight: "bold",
                color: "ink.950",
                lineHeight: "1.45",
              })}
            >
              {title}
            </span>
            <span
              className={css({
                fontSize: "11px",
                fontWeight: "black",
                flexShrink: 0,
                color: required ? "primary.700" : "ink.400",
              })}
            >
              {required ? "(필수)" : "(선택)"}
            </span>
          </span>
        </button>
        {onView && (
          <button
            type="button"
            onClick={onView}
            className={css({
              flexShrink: 0,
              minHeight: "32px",
              paddingX: "2.5",
              borderRadius: "capsule",
              fontSize: "xs",
              fontWeight: "bold",
              color: "ink.600",
              textDecoration: "underline",
              textUnderlineOffset: "2px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            })}
          >
            보기
          </button>
        )}
      </div>
      {description && (
        <p
          className={css({
            paddingLeft: "9",
            color: "ink.500",
            fontSize: "xs",
            lineHeight: "1.55",
          })}
        >
          {description}
        </p>
      )}
    </div>
  );
}

const dividerCss = css({ height: "1px", background: "surface.hairline" });

/**
 * Step ① — consent. Two required agreements (서비스 이용약관 + 개인정보 수집·이용)
 * and one SEPARATE optional 민감정보(종교) 처리 동의 (개인정보보호법 제23조).
 * Without the sensitive consent the religion picker in step ④ stays disabled.
 *
 * In edit mode (`alreadyAgreed`) the required block is shown as completed and
 * locked; only the sensitive consent remains toggleable.
 */
export function StepTerms({
  termsAccepted,
  privacyAccepted,
  sensitiveAccepted,
  alreadyAgreed,
  onTerms,
  onPrivacy,
  onSensitive,
}: {
  termsAccepted: boolean;
  privacyAccepted: boolean;
  sensitiveAccepted: boolean;
  alreadyAgreed: boolean;
  onTerms: (v: boolean) => void;
  onPrivacy: (v: boolean) => void;
  onSensitive: (v: boolean) => void;
}) {
  const [openDoc, setOpenDoc] = useState<DocKey>(null);
  const bothRequired = termsAccepted && privacyAccepted;

  return (
    <div className={css({ display: "flex", flexDirection: "column", gap: "4" })}>
      {/* "Agree to all required" master toggle */}
      {!alreadyAgreed && (
        <button
          type="button"
          onClick={() => {
            const next = !bothRequired;
            onTerms(next);
            onPrivacy(next);
          }}
          className={css({
            display: "flex",
            alignItems: "center",
            gap: "3",
            padding: "3.5",
            borderRadius: "liquid",
            background: bothRequired
              ? "linear-gradient(135deg, rgba(255,122,107,.12), rgba(208,70,60,.08))"
              : "surface.card",
            border: "1px solid",
            borderColor: bothRequired ? "primary.200" : "surface.hairline",
            boxShadow: "cardSoft",
            cursor: "pointer",
            textAlign: "left",
          })}
        >
          <CheckBox checked={bothRequired} />
          <span
            className={css({
              fontSize: "md",
              fontWeight: "black",
              color: "ink.950",
            })}
          >
            필수 약관에 모두 동의합니다
          </span>
        </button>
      )}

      <StepCard className={css({ padding: 0, overflow: "hidden" })}>
        <ConsentRow
          checked={termsAccepted}
          onToggle={() => !alreadyAgreed && onTerms(!termsAccepted)}
          title="서비스 이용약관"
          required
          disabled={alreadyAgreed}
          onView={() => setOpenDoc(openDoc === "terms" ? null : "terms")}
        />
        <div className={dividerCss} aria-hidden />
        <ConsentRow
          checked={privacyAccepted}
          onToggle={() => !alreadyAgreed && onPrivacy(!privacyAccepted)}
          title="개인정보 수집·이용 동의"
          required
          disabled={alreadyAgreed}
          onView={() => setOpenDoc(openDoc === "privacy" ? null : "privacy")}
        />
      </StepCard>

      {openDoc && (
        <StepCard>
          <LegalDocument markdown={openDoc === "terms" ? TERMS_OF_SERVICE : PRIVACY_POLICY} />
        </StepCard>
      )}

      <StepCard className={css({ padding: 0, overflow: "hidden" })}>
        <ConsentRow
          checked={sensitiveAccepted}
          onToggle={() => onSensitive(!sensitiveAccepted)}
          title="민감정보(종교) 처리 동의"
          required={false}
          description="개인정보보호법 제23조에 따른 별도 동의입니다. 동의하지 않으셔도 가입할 수 있고, 종교 항목만 입력하지 않게 됩니다. 언제든 설정에서 바꿀 수 있어요."
        />
      </StepCard>

      <p
        className={css({
          paddingX: "1",
          color: "ink.400",
          fontSize: "11px",
          lineHeight: "1.55",
        })}
      >
        약관 버전 {TERMS_VERSION}
        {alreadyAgreed ? " · 이미 동의가 완료된 계정이에요." : ""}
      </p>
    </div>
  );
}
