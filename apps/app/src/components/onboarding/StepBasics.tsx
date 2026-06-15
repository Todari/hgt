"use client";

import { useEffect, useRef, useState } from "react";
import type { Property } from "@hgt-client/contract";
import { css } from "_panda/css";
import { SwitchKnob } from "@/components/ui/glass";
import { FieldHeader, Pill, PillRow, StepCard } from "./primitives";

const CORAL_TEXT_GRADIENT = "linear-gradient(135deg, #b83e3a, #d0463c)";

/**
 * MBTI is four binary axes, so pick one letter per axis instead of choosing from
 * 16 chips. The four letters assemble into a type (e.g. "ENTP") which resolves
 * back to the matching `mbti` property id. Optional: incomplete → null.
 */
const MBTI_AXES = [
  { left: { letter: "E", ko: "외향" }, right: { letter: "I", ko: "내향" } },
  { left: { letter: "N", ko: "직관" }, right: { letter: "S", ko: "감각" } },
  { left: { letter: "T", ko: "사고" }, right: { letter: "F", ko: "감정" } },
  { left: { letter: "J", ko: "계획" }, right: { letter: "P", ko: "탐색" } },
] as const;

/** "" or "ENTP" → a fixed 4-slot array (unset slots are ""). */
function toLetters(type: string): string[] {
  const arr = ["", "", "", ""];
  for (let i = 0; i < type.length && i < 4; i += 1) arr[i] = type[i]!;
  return arr;
}

function MbtiPicker({
  options,
  selectedId,
  onSelect,
}: {
  options: Property[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const valueOf = (id: string | null) => options.find((o) => o.id === id)?.value ?? "";
  // Local 4-letter state so partial selections (one axis at a time) persist —
  // a partial type has no property id, so it can't live in `selectedId`.
  const [letters, setLetters] = useState<string[]>(() => toLetters(valueOf(selectedId)));
  // Adopt EXTERNAL changes to selectedId (async prefill / reset) without
  // clobbering our own in-progress edits.
  const lastEmitted = useRef<string | null>(selectedId);
  useEffect(() => {
    if (selectedId !== lastEmitted.current) {
      setLetters(toLetters(valueOf(selectedId)));
      lastEmitted.current = selectedId;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const complete = letters.every(Boolean);
  const selectedType = complete ? letters.join("") : "";
  const partial = !complete && letters.some(Boolean);

  const choose = (axis: number, letter: string) => {
    const next = [...letters];
    next[axis] = letter;
    setLetters(next);
    const id = next.every(Boolean)
      ? (options.find((o) => o.value === next.join(""))?.id ?? null)
      : null; // partial selection isn't a valid type yet
    lastEmitted.current = id;
    onSelect(id);
  };

  const clear = () => {
    setLetters(["", "", "", ""]);
    lastEmitted.current = null;
    onSelect(null);
  };

  return (
    <StepCard className={css({ display: "flex", flexDirection: "column", gap: "3" })}>
      <FieldHeader
        title="MBTI"
        helper="대화 성향을 가볍게 참고하는 신호로 써요."
        trailing={
          selectedType ? (
            <span
              className={css({
                display: "inline-flex",
                alignItems: "center",
                minHeight: "26px",
                paddingX: "2.5",
                borderRadius: "capsule",
                fontSize: "xs",
                fontWeight: "black",
                letterSpacing: "0.04em",
                color: "white",
                background: CORAL_TEXT_GRADIENT,
              })}
            >
              {selectedType}
            </span>
          ) : partial ? (
            <button
              type="button"
              onClick={clear}
              className={css({ color: "ink.400", fontSize: "xs", fontWeight: "bold", cursor: "pointer", background: "transparent", border: "none" })}
            >
              지우기
            </button>
          ) : undefined
        }
      />
      <div className={css({ display: "flex", flexDirection: "column", gap: "2" })}>
        {MBTI_AXES.map((axis, i) => {
          const active = letters[i];
          return (
            <div
              key={i}
              className={css({
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1.5",
                padding: "1",
                borderRadius: "16px",
                background: "rgba(10,17,24,.05)",
              })}
            >
              {[axis.left, axis.right].map((opt) => {
                const on = active === opt.letter;
                return (
                  <button
                    key={opt.letter}
                    type="button"
                    aria-pressed={on}
                    onClick={() => choose(i, opt.letter)}
                    className={css({
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "1.5",
                      minHeight: "44px",
                      borderRadius: "12px",
                      fontSize: "sm",
                      fontWeight: "bold",
                      cursor: "pointer",
                      color: on ? "white" : "ink.700",
                      background: on ? CORAL_TEXT_GRADIENT : "surface.card",
                      border: "1px solid",
                      borderColor: on ? "transparent" : "surface.hairline",
                      boxShadow: on ? "0 6px 14px rgba(255,107,95,.2)" : "none",
                      transition: "background 140ms ease, color 140ms ease",
                      _active: { transform: "scale(0.97)" },
                    })}
                  >
                    <span className={css({ fontWeight: "black", fontSize: "md" })}>{opt.letter}</span>
                    <span className={css({ fontSize: "12px", opacity: 0.9 })}>{opt.ko}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </StepCard>
  );
}

/** Solid toggle row matching the other step-4 cards (vs. the glass GlassToggle). */
function ToggleRow({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <StepCard className={css({ padding: 0 })}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={css({
          width: "100%",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) auto",
          alignItems: "center",
          gap: "3",
          padding: "4",
          textAlign: "left",
          background: "transparent",
          border: "none",
          cursor: "pointer",
        })}
      >
        <span className={css({ minWidth: 0, display: "flex", flexDirection: "column", gap: "1" })}>
          <span className={css({ color: "ink.950", fontSize: "sm", fontWeight: "black" })}>{label}</span>
          {description && (
            <span className={css({ color: "ink.500", fontSize: "xs", lineHeight: "1.5" })}>{description}</span>
          )}
        </span>
        <SwitchKnob checked={checked} />
      </button>
    </StepCard>
  );
}

export type ProfilePropertyType = "height" | "smoke" | "religion" | "mbti";

export type BasicsState = {
  heightId: string | null;
  smokeId: string | null;
  religionId: string | null;
  mbtiId: string | null;
  army: boolean | null;
  description: string;
  minAge: string;
  maxAge: string;
  canCc: boolean;
};

function PropertyPicker({
  title,
  helper,
  options,
  selectedId,
  onSelect,
  disabled = false,
}: {
  title: string;
  helper?: string;
  options: Property[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  disabled?: boolean;
}) {
  return (
    <StepCard className={css({ display: "flex", flexDirection: "column", gap: "3" })}>
      <FieldHeader title={title} helper={helper} />
      <PillRow>
        {options.map((option) => (
          <Pill
            key={option.id}
            selected={selectedId === option.id}
            disabled={disabled}
            onClick={() => onSelect(selectedId === option.id ? null : option.id)}
          >
            {option.value}
          </Pill>
        ))}
      </PillRow>
    </StepCard>
  );
}

const ageInputCss = css({
  width: "100%",
  minHeight: "48px",
  paddingX: "3.5",
  borderRadius: "14px",
  border: "1px solid",
  borderColor: "surface.hairline",
  background: "surface.card",
  color: "ink.950",
  fontSize: "md",
  fontWeight: "medium",
  textAlign: "center",
  _focusVisible: {
    outline: "none",
    borderColor: "primary.400",
    boxShadow: "0 0 0 3px rgba(255,107,95,.14)",
  },
});

/**
 * Step ④ — basic info. Single-select property pickers (키/흡연/종교/MBTI),
 * 병역, 자기소개 (≤500), 원하는 나이 범위, 같은 과 매칭 허용 토글.
 * The religion picker is disabled (with a quiet explanation) unless the user
 * gave the optional 민감정보 처리 동의 in step ①.
 */
export function StepBasics({
  properties,
  state,
  sensitiveAccepted,
  gender,
  onChange,
}: {
  properties: Property[];
  state: BasicsState;
  sensitiveAccepted: boolean;
  gender: boolean; // true = 남 — 병역 항목은 남성에게만 보여준다
  onChange: <K extends keyof BasicsState>(key: K, value: BasicsState[K]) => void;
}) {
  const opts = (type: ProfilePropertyType) => properties.filter((p) => p.type === type);

  return (
    <div className={css({ display: "flex", flexDirection: "column", gap: "4" })}>
      <PropertyPicker
        title="키"
        helper="정확한 수치보다 가까운 구간을 골라주세요."
        options={opts("height")}
        selectedId={state.heightId}
        onSelect={(id) => onChange("heightId", id)}
      />

      <PropertyPicker
        title="흡연"
        options={opts("smoke")}
        selectedId={state.smokeId}
        onSelect={(id) => onChange("smokeId", id)}
      />

      <StepCard className={css({ display: "flex", flexDirection: "column", gap: "3" })}>
        <FieldHeader
          title="종교"
          helper={
            sensitiveAccepted
              ? "서로의 가치관을 이해하기 위한 선택 항목이에요."
              : undefined
          }
        />
        {sensitiveAccepted ? (
          <PillRow>
            {opts("religion").map((option) => (
              <Pill
                key={option.id}
                selected={state.religionId === option.id}
                onClick={() =>
                  onChange("religionId", state.religionId === option.id ? null : option.id)
                }
              >
                {option.value}
              </Pill>
            ))}
          </PillRow>
        ) : (
          <p
            className={css({
              color: "ink.500",
              fontSize: "xs",
              lineHeight: "1.6",
              padding: "3",
              borderRadius: "12px",
              background: "rgba(10,17,24,.04)",
            })}
          >
            종교는 민감정보라, 첫 단계의 ‘민감정보 처리 동의’를 선택하셔야 입력할 수 있어요.
            동의는 선택 사항이며, 언제든 설정에서 바꿀 수 있어요.
          </p>
        )}
      </StepCard>

      <MbtiPicker
        options={opts("mbti")}
        selectedId={state.mbtiId}
        onSelect={(id) => onChange("mbtiId", id)}
      />

      {gender && (
        <StepCard className={css({ display: "flex", flexDirection: "column", gap: "3" })}>
          <FieldHeader title="병역" helper="해당하지 않으면 비워두셔도 괜찮아요." />
          <PillRow>
            <Pill selected={state.army === true} onClick={() => onChange("army", state.army === true ? null : true)}>
              군필
            </Pill>
            <Pill selected={state.army === false} onClick={() => onChange("army", state.army === false ? null : false)}>
              미필
            </Pill>
          </PillRow>
        </StepCard>
      )}

      <StepCard className={css({ display: "flex", flexDirection: "column", gap: "3" })}>
        <FieldHeader
          title="자기소개"
          helper="사진 없이 만나는 서비스예요. 대화 리듬이나 관계에서 중요한 태도를 적어주세요."
          trailing={
            <span className={css({ color: "ink.400", fontSize: "xs", fontWeight: "bold" })}>
              {state.description.length}/500
            </span>
          }
        />
        <textarea
          value={state.description}
          maxLength={500}
          onChange={(e) => onChange("description", e.target.value)}
          placeholder="예: 천천히 친해지는 편이고, 대화가 잘 이어지는 사람을 좋아해요."
          className={css({
            width: "100%",
            minHeight: "104px",
            padding: "3.5",
            borderRadius: "14px",
            border: "1px solid",
            borderColor: "surface.hairline",
            background: "surface.card",
            color: "ink.950",
            fontSize: "md",
            lineHeight: "1.6",
            resize: "vertical",
            _focusVisible: {
              outline: "none",
              borderColor: "primary.400",
              boxShadow: "0 0 0 3px rgba(255,107,95,.14)",
            },
          })}
        />
      </StepCard>

      <StepCard className={css({ display: "flex", flexDirection: "column", gap: "3" })}>
        <FieldHeader
          title="원하는 나이 범위"
          helper="18세부터 99세까지 입력할 수 있어요. 비워두면 제한 없이 매칭돼요."
        />
        <div
          className={css({
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            gap: "2",
          })}
        >
          <input
            inputMode="numeric"
            value={state.minAge}
            placeholder="최소"
            aria-label="최소 나이"
            onChange={(e) => onChange("minAge", e.target.value.replace(/\D/g, "").slice(0, 2))}
            className={ageInputCss}
          />
          <span className={css({ color: "ink.400", fontSize: "sm", fontWeight: "bold" })}>~</span>
          <input
            inputMode="numeric"
            value={state.maxAge}
            placeholder="최대"
            aria-label="최대 나이"
            onChange={(e) => onChange("maxAge", e.target.value.replace(/\D/g, "").slice(0, 2))}
            className={ageInputCss}
          />
        </div>
      </StepCard>

      <ToggleRow
        checked={state.canCc}
        onChange={(v) => onChange("canCc", v)}
        label="같은 과 매칭 허용"
        description="같은 과 상대도 매칭 후보에 포함해요."
      />
    </div>
  );
}
