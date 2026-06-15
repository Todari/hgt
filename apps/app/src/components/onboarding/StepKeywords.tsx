"use client";

import { useMemo, useState } from "react";
import type { Keyword } from "@hgt-client/contract";
import { css } from "_panda/css";
import { CountPill, Pill, PillRow, SegmentedTabs } from "./primitives";

const MAX_KEYWORDS = 20;

/** Stable category order matching the contract's keywordCategorySchema. */
const CATEGORY_ORDER = ["성격", "취미", "관심사", "라이프스타일", "가치관"];

function orderCategories(keywords: Keyword[]): string[] {
  const present = new Set(keywords.map((k) => k.category));
  const ordered = CATEGORY_ORDER.filter((c) => present.has(c));
  // append any unexpected categories so nothing is silently dropped
  for (const c of present) if (!ordered.includes(c)) ordered.push(c);
  return ordered;
}

/**
 * Step ② / ③ — keyword multi-select. 5 categories as horizontal segmented
 * tabs; one category's chips visible at a time so the step stays ~1 viewport.
 * Live counter (min 1, max 20). The tab badge shows per-category selections.
 */
export function StepKeywords({
  keywords,
  selected,
  onToggle,
}: {
  keywords: Keyword[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  const categories = useMemo(() => orderCategories(keywords), [keywords]);
  const [active, setActive] = useState(categories[0] ?? "");

  const byCategory = useMemo(() => {
    const map = new Map<string, Keyword[]>();
    for (const k of keywords) {
      const list = map.get(k.category);
      if (list) list.push(k);
      else map.set(k.category, [k]);
    }
    return map;
  }, [keywords]);

  const perCategoryCount = useMemo(() => {
    const counts = new Map<string, number>();
    for (const k of keywords) {
      if (selected.has(k.id)) counts.set(k.category, (counts.get(k.category) ?? 0) + 1);
    }
    return counts;
  }, [keywords, selected]);

  const activeKeyword = active && categories.includes(active) ? active : categories[0] ?? "";
  const atMax = selected.size >= MAX_KEYWORDS;
  const visible = byCategory.get(activeKeyword) ?? [];

  return (
    <div className={css({ display: "flex", flexDirection: "column", gap: "4" })}>
      <div
        className={css({
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "3",
        })}
      >
        <p className={css({ color: "ink.500", fontSize: "xs", lineHeight: "1.55" })}>
          최소 1개, 최대 {MAX_KEYWORDS}개까지 고를 수 있어요.
        </p>
        <CountPill count={selected.size} />
      </div>

      <SegmentedTabs
        tabs={categories.map((c) => ({
          key: c,
          label: c,
          count: perCategoryCount.get(c) ?? 0,
        }))}
        active={activeKeyword}
        onSelect={setActive}
      />

      <PillRow>
        {visible.map((keyword) => {
          const isSelected = selected.has(keyword.id);
          return (
            <Pill
              key={keyword.id}
              selected={isSelected}
              disabled={!isSelected && atMax}
              onClick={() => onToggle(keyword.id)}
            >
              {keyword.value}
            </Pill>
          );
        })}
      </PillRow>

      {atMax && (
        <p
          className={css({
            color: "primary.700",
            fontSize: "xs",
            fontWeight: "bold",
            lineHeight: "1.55",
          })}
        >
          최대 {MAX_KEYWORDS}개까지 선택할 수 있어요. 더 고르려면 선택한 키워드를 먼저 빼주세요.
        </p>
      )}
    </div>
  );
}
