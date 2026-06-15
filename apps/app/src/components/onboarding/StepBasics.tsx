"use client";

import type { Property } from "@hgt-client/contract";
import { css } from "_panda/css";
import { GlassToggle } from "@/components/ui/glass";
import { FieldHeader, Pill, PillRow, StepCard } from "./primitives";

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

      <PropertyPicker
        title="MBTI"
        helper="대화 성향을 가볍게 참고하는 신호로 써요."
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

      <GlassToggle
        checked={state.canCc}
        onChange={(v) => onChange("canCc", v)}
        label="같은 과 매칭 허용"
        description="같은 과 상대도 매칭 후보에 포함해요."
      />
    </div>
  );
}
