"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { Keyword, Property } from "@hgt-client/contract";
import { css, cx } from "_panda/css";
import {
  GlassBadge,
  GlassButton,
  GlassChip,
  GlassPanel,
  GlassTextarea,
  GlassTextField,
  GlassToggle,
} from "@/components/ui/glass";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { OfflineBanner } from "@/components/ui/status";
import {
  PRIVACY_POLICY,
  TERMS_OF_SERVICE,
  TERMS_VERSION,
} from "@/content/legal";
import { api, ApiError } from "@/lib/api";
import { getSession } from "@/lib/session";

type ProfilePropertyType = Extract<Property["type"], "height" | "smoke" | "religion" | "mbti">;

const propertySections: Array<{
  type: ProfilePropertyType;
  title: string;
  description: string;
}> = [
  {
    type: "height",
    title: "키",
    description: "정확한 수치보다 가까운 구간을 선택해주세요.",
  },
  {
    type: "smoke",
    title: "흡연",
    description: "생활 리듬과 만남의 편안함을 판단하는 신호입니다.",
  },
  {
    type: "religion",
    title: "종교",
    description: "서로의 가치관을 이해하기 위한 선택 항목입니다.",
  },
  {
    type: "mbti",
    title: "MBTI",
    description: "대화 성향을 가볍게 참고하는 신호로 사용합니다.",
  },
];

function KeywordPicker({
  title,
  description,
  keywords,
  selected,
  onToggle,
}: {
  title: string;
  description: string;
  keywords: Keyword[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  const byCategory = new Map<string, Keyword[]>();
  for (const keyword of keywords) {
    const group = byCategory.get(keyword.category);
    if (group) group.push(keyword);
    else byCategory.set(keyword.category, [keyword]);
  }

  return (
    <GlassPanel tone="quiet" className={css({ display: "flex", flexDirection: "column", gap: "5" })}>
      <div className={css({ position: "relative", zIndex: 1 })}>
        <h2 className={css({ color: "ink.950", fontSize: "2xl", fontWeight: "black" })}>
          {title}
        </h2>
        <p className={css({ marginTop: "1", color: "ink.500", fontSize: "sm", lineHeight: "1.7" })}>
          {description}
        </p>
      </div>

      <div className={css({ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: "5" })}>
        {[...byCategory.entries()].map(([category, categoryKeywords]) => (
          <div key={category} className={css({ display: "flex", flexDirection: "column", gap: "2" })}>
            <p className={css({ color: "primary.700", fontSize: "xs", fontWeight: "black" })}>
              {category}
            </p>
            <div className={css({ display: "flex", flexWrap: "wrap", gap: "2" })}>
              {categoryKeywords.map((keyword) => (
                <GlassChip
                  key={keyword.id}
                  selected={selected.has(keyword.id)}
                  onClick={() => onToggle(keyword.id)}
                >
                  {keyword.value}
                </GlassChip>
              ))}
            </div>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

function PropertyPicker({
  title,
  description,
  options,
  selectedId,
  onSelect,
}: {
  title: string;
  description: string;
  options: Property[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <div
      className={css({
        position: "relative",
        zIndex: 1,
        border: "1px solid rgba(255,255,255,.58)",
        borderRadius: "20px",
        padding: "4",
        background: "rgba(255,255,255,.34)",
        boxShadow: "0 12px 26px rgba(10,17,24,.07)",
        display: "flex",
        flexDirection: "column",
        gap: "3",
      })}
    >
      <div>
        <h3 className={css({ color: "ink.950", fontSize: "lg", fontWeight: "black" })}>
          {title}
        </h3>
        <p className={css({ marginTop: "1", color: "ink.500", fontSize: "sm", lineHeight: "1.6" })}>
          {description}
        </p>
      </div>
      <div className={css({ display: "flex", flexWrap: "wrap", gap: "2" })}>
        <GlassChip selected={selectedId == null} onClick={() => onSelect(null)}>
          선택 안함
        </GlassChip>
        {options.map((option) => (
          <GlassChip
            key={option.id}
            selected={selectedId === option.id}
            onClick={() => onSelect(selectedId === option.id ? null : option.id)}
          >
            {option.value}
          </GlassChip>
        ))}
      </div>
    </div>
  );
}

function LegalConsentPanel({
  termsAccepted,
  privacyAccepted,
  alreadyAgreed,
  onTermsChange,
  onPrivacyChange,
}: {
  termsAccepted: boolean;
  privacyAccepted: boolean;
  alreadyAgreed: boolean;
  onTermsChange: (checked: boolean) => void;
  onPrivacyChange: (checked: boolean) => void;
}) {
  const [openDocument, setOpenDocument] = useState<"terms" | "privacy" | null>(null);

  return (
    <GlassPanel tone="quiet" className={css({ display: "flex", flexDirection: "column", gap: "5" })}>
      <div className={css({ position: "relative", zIndex: 1 })}>
        <GlassBadge>Legal Required</GlassBadge>
        <h2 className={css({ marginTop: "3", color: "ink.950", fontSize: "2xl", fontWeight: "black" })}>
          약관 동의
        </h2>
        <p className={css({ marginTop: "1", color: "ink.500", fontSize: "sm", lineHeight: "1.7" })}>
          서비스 이용을 위해 이용약관과 개인정보처리방침 동의가 필요합니다. 현재 약관 버전은
          {` ${TERMS_VERSION}`}입니다.
        </p>
      </div>

      <div className={css({ position: "relative", zIndex: 1, display: "grid", gap: "3" })}>
        {[
          {
            id: "terms",
            title: "이용약관에 동의합니다.",
            checked: termsAccepted,
            onChange: onTermsChange,
          },
          {
            id: "privacy",
            title: "개인정보처리방침에 동의합니다.",
            checked: privacyAccepted,
            onChange: onPrivacyChange,
          },
        ].map((item) => (
          <label
            key={item.id}
            className={css({
              display: "grid",
              gridTemplateColumns: "auto 1fr auto",
              alignItems: "center",
              gap: "3",
              border: "1px solid rgba(255,255,255,.58)",
              borderRadius: "20px",
              padding: "4",
              background: "rgba(255,255,255,.34)",
              boxShadow: "0 12px 26px rgba(10,17,24,.07)",
              cursor: alreadyAgreed ? "default" : "pointer",
            })}
          >
            <input
              type="checkbox"
              checked={item.checked}
              disabled={alreadyAgreed}
              onChange={(event) => item.onChange(event.target.checked)}
              className={css({ accentColor: "var(--hgt-primary)" })}
            />
            <span className={css({ color: "ink.950", fontSize: "sm", fontWeight: "black" })}>
              {item.title}
            </span>
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setOpenDocument(openDocument === item.id ? null : (item.id as "terms" | "privacy"));
              }}
              className={cx(
                "glass-control",
                css({
                  position: "relative",
                  zIndex: 1,
                  borderRadius: "capsule",
                  paddingX: "3",
                  paddingY: "1.5",
                  color: "ink.700",
                  fontSize: "xs",
                  fontWeight: "bold",
                }),
              )}
            >
              본문 보기
            </button>
          </label>
        ))}
      </div>

      {openDocument && (
        <div
          className={css({
            position: "relative",
            zIndex: 1,
            border: "1px solid rgba(255,255,255,.58)",
            borderRadius: "20px",
            padding: "4",
            background: "rgba(255,255,255,.34)",
          })}
        >
          <LegalDocument markdown={openDocument === "terms" ? TERMS_OF_SERVICE : PRIVACY_POLICY} />
        </div>
      )}

      {alreadyAgreed && (
        <p className={css({ position: "relative", zIndex: 1, color: "ink.500", fontSize: "sm", fontWeight: "bold" })}>
          이미 약관 동의가 완료된 계정입니다.
        </p>
      )}
    </GlassPanel>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [session, setSession] = useState<string | null>(null);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [self, setSelf] = useState<Set<string>>(new Set());
  const [ideal, setIdeal] = useState<Set<string>>(new Set());
  const [description, setDescription] = useState("");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [heightId, setHeightId] = useState<string | null>(null);
  const [smokeId, setSmokeId] = useState<string | null>(null);
  const [religionId, setReligionId] = useState<string | null>(null);
  const [mbtiId, setMbtiId] = useState<string | null>(null);
  const [termsAgreedAt, setTermsAgreedAt] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [canCc, setCanCc] = useState(false);
  const [explore, setExplore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const currentSession = getSession();
    if (!currentSession) {
      router.replace("/signin");
      return;
    }

    setSession(currentSession);
    void (async () => {
      try {
        const [keywordList, propertyList, profile] = await Promise.all([
          api.getKeywords(currentSession),
          api.listProperties(currentSession),
          api.getMe(currentSession),
        ]);
        setKeywords(keywordList);
        setProperties(propertyList);
        setSelf(new Set(profile.selfKeywords.map((keyword) => keyword.id)));
        setIdeal(new Set(profile.idealKeywords.map((keyword) => keyword.id)));
        setDescription(profile.description ?? "");
        setMinAge(profile.targetMinAge != null ? String(profile.targetMinAge) : "");
        setMaxAge(profile.targetMaxAge != null ? String(profile.targetMaxAge) : "");
        setHeightId(profile.heightId);
        setSmokeId(profile.smokeId);
        setReligionId(profile.religionId);
        setMbtiId(profile.mbtiId);
        setTermsAgreedAt(profile.termsAgreedAt);
        setTermsAccepted(profile.termsAgreedAt != null);
        setPrivacyAccepted(profile.termsAgreedAt != null);
        setCanCc(profile.canCc);
        setExplore(profile.explore);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "프로필을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const toggler =
    (selected: Set<string>, setSelected: (value: Set<string>) => void) => (id: string) => {
      const next = new Set(selected);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setSelected(next);
    };

  async function onSave() {
    if (!session) return;

    const minAgeValue = minAge.trim();
    const maxAgeValue = maxAge.trim();
    const isAgeText = (value: string) => value === "" || /^\d+$/.test(value);

    if (!isAgeText(minAgeValue) || !isAgeText(maxAgeValue)) {
      setError("선호 나이는 숫자로 입력해주세요.");
      return;
    }

    const parsedMinAge = minAgeValue ? Number(minAgeValue) : null;
    const parsedMaxAge = maxAgeValue ? Number(maxAgeValue) : null;
    const ageValues = [parsedMinAge, parsedMaxAge].filter((age): age is number => age != null);

    if (ageValues.some((age) => age < 18 || age > 99)) {
      setError("선호 나이는 18세부터 99세 사이로 입력해주세요.");
      return;
    }

    if (parsedMinAge != null && parsedMaxAge != null && parsedMinAge > parsedMaxAge) {
      setError("선호 최소 나이는 최대 나이보다 클 수 없습니다.");
      return;
    }

    if (!termsAccepted || !privacyAccepted) {
      setError("이용약관과 개인정보처리방침에 모두 동의해주세요.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await api.updateProfile(session, {
        selfKeywordIds: [...self],
        idealKeywordIds: [...ideal],
        description: description.trim() || null,
        canCc,
        explore,
        targetMinAge: parsedMinAge,
        targetMaxAge: parsedMaxAge,
        heightId,
        smokeId,
        religionId,
        mbtiId,
        agreedToTerms: termsAgreedAt == null ? true : undefined,
      });
      router.push("/home");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main
        className={css({
          position: "relative",
          minHeight: "100dvh",
          padding: { base: "4", md: "8" },
          display: "grid",
          placeItems: "center",
        })}
      >
        <GlassPanel className={css({ minWidth: { base: "100%", sm: "420px" }, textAlign: "center" })}>
          <p className={css({ position: "relative", zIndex: 1, color: "ink.700", fontWeight: "bold" })}>
            프로필 설정을 불러오는 중입니다.
          </p>
        </GlassPanel>
      </main>
    );
  }

  const selectedPropertyCount = [heightId, smokeId, religionId, mbtiId].filter(Boolean).length;
  const selectedPropertyIds: Record<ProfilePropertyType, string | null> = {
    height: heightId,
    smoke: smokeId,
    religion: religionId,
    mbti: mbtiId,
  };
  const propertySetters: Record<ProfilePropertyType, (id: string | null) => void> = {
    height: setHeightId,
    smoke: setSmokeId,
    religion: setReligionId,
    mbti: setMbtiId,
  };

  return (
    <main
      className={css({
        position: "relative",
        minHeight: "100dvh",
        overflow: "hidden",
        padding: { base: "4", md: "8" },
      })}
    >
      <div className="mesh-field" aria-hidden />
      <motion.div
        aria-hidden
        className={css({
          position: "absolute",
          top: "6%",
          left: "-18%",
          width: "88%",
          height: "34%",
          background:
            "linear-gradient(108deg, transparent, rgba(255,107,95,.14) 32%, rgba(255,107,95,.08), transparent)",
          filter: "blur(15px)",
          transform: "rotate(-8deg)",
        })}
        animate={{ x: [-16, 16, -16], y: [0, 14, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
      />

      <section
        className={css({
          position: "relative",
          zIndex: 1,
          maxWidth: "1120px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "6",
        })}
      >
        <nav
          className={cx(
            "glass-nav",
            css({
              minHeight: "64px",
              borderRadius: "capsule",
              display: "flex",
              alignItems: { base: "flex-start", sm: "center" },
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "3",
              padding: "2",
              paddingLeft: { base: "4", md: "5" },
            }),
          )}
        >
          <div className={css({ position: "relative", zIndex: 1 })}>
            <p className={css({ color: "ink.950", fontSize: "sm", fontWeight: "black" })}>HGT</p>
            <p className={css({ color: "ink.500", fontSize: "xs", fontWeight: "bold" })}>
              AI가 볼 궁합 신호 설정
            </p>
          </div>
          <div
            className={css({
              position: "relative",
              zIndex: 1,
              display: "flex",
              flexWrap: "wrap",
              justifyContent: { base: "flex-start", sm: "flex-end" },
              gap: "2",
              width: { base: "100%", sm: "auto" },
            })}
          >
            <GlassButton href="/home" variant="secondary">
              홈으로
            </GlassButton>
          </div>
        </nav>

        <OfflineBanner />

        <header
          className={css({
            display: "grid",
            gridTemplateColumns: { base: "1fr", lg: ".9fr 1.1fr" },
            gap: "5",
            alignItems: "stretch",
          })}
        >
          <GlassPanel
            className={css({
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "6",
              minHeight: "320px",
            })}
          >
            <div className="liquid-sheen" aria-hidden />
            <div className={css({ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: "4" })}>
              <GlassBadge>Profile Signals</GlassBadge>
              <h1
                className={css({
                  color: "ink.950",
                  fontSize: { base: "3xl", md: "5xl" },
                  lineHeight: "1.06",
                  fontWeight: "black",
                })}
              >
                외모가 아닌 궁합 신호를 알려주세요.
              </h1>
              <p className={css({ color: "ink.700", fontSize: { base: "md", md: "lg" }, lineHeight: "1.7" })}>
                HGT의 AI는 사진보다 생활 리듬, 관심사, 대화 성향, 만남의 태도를 봅니다.
              </p>
            </div>
          </GlassPanel>

          <GlassPanel tone="quiet" className={css({ display: "grid", gap: "3", alignContent: "start" })}>
            <GlassBadge>현재 선택</GlassBadge>
            <div
              className={css({
                position: "relative",
                zIndex: 1,
                display: "grid",
                gridTemplateColumns: { base: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
                gap: "3",
              })}
            >
              <div
                className={css({
                  border: "1px solid rgba(255,255,255,.58)",
                  borderRadius: "20px",
                  padding: "4",
                  background: "rgba(255,255,255,.36)",
                })}
              >
                <p className={css({ color: "ink.950", fontSize: "2xl", fontWeight: "black" })}>
                  {self.size}
                </p>
                <p className={css({ color: "ink.500", fontSize: "xs", fontWeight: "bold" })}>
                  나를 설명하는 신호
                </p>
              </div>
              <div
                className={css({
                  border: "1px solid rgba(255,255,255,.58)",
                  borderRadius: "20px",
                  padding: "4",
                  background: "rgba(255,255,255,.36)",
                })}
              >
                <p className={css({ color: "ink.950", fontSize: "2xl", fontWeight: "black" })}>
                  {ideal.size}
                </p>
                <p className={css({ color: "ink.500", fontSize: "xs", fontWeight: "bold" })}>
                  기대하는 상대 신호
                </p>
              </div>
              <div
                className={css({
                  border: "1px solid rgba(255,255,255,.58)",
                  borderRadius: "20px",
                  padding: "4",
                  background: "rgba(255,255,255,.36)",
                })}
              >
                <p className={css({ color: "ink.950", fontSize: "2xl", fontWeight: "black" })}>
                  {selectedPropertyCount}/4
                </p>
                <p className={css({ color: "ink.500", fontSize: "xs", fontWeight: "bold" })}>
                  기본 속성
                </p>
              </div>
            </div>
            <p className={css({ position: "relative", zIndex: 1, color: "ink.500", fontSize: "sm", lineHeight: "1.7" })}>
              많이 고르는 것보다 정확히 고르는 것이 중요합니다. 실제 대화와 만남에서
              자연스럽게 드러나는 항목 위주로 선택해주세요.
            </p>
          </GlassPanel>
        </header>

        <div
          className={css({
            display: "grid",
            gridTemplateColumns: { base: "1fr", lg: "1fr 1fr" },
            gap: "5",
            alignItems: "start",
          })}
        >
          <KeywordPicker
            title="나를 설명하는 키워드"
            description="AI가 나의 생활 방식과 대화 성향을 이해하는 데 쓰입니다."
            keywords={keywords}
            selected={self}
            onToggle={toggler(self, setSelf)}
          />
          <KeywordPicker
            title="기대하는 상대 키워드"
            description="사진보다 함께 있을 때의 온도와 리듬을 기준으로 선택해주세요."
            keywords={keywords}
            selected={ideal}
            onToggle={toggler(ideal, setIdeal)}
          />
        </div>

        <GlassPanel tone="quiet" className={css({ display: "flex", flexDirection: "column", gap: "5" })}>
          <div className={css({ position: "relative", zIndex: 1 })}>
            <h2 className={css({ color: "ink.950", fontSize: "2xl", fontWeight: "black" })}>
              기본 프로필 속성
            </h2>
            <p className={css({ marginTop: "1", color: "ink.500", fontSize: "sm", lineHeight: "1.7" })}>
              키, 흡연, 종교, MBTI는 각각 하나만 선택합니다. AI가 생활 방식과 대화 리듬을
              이해하는 보조 신호로 사용합니다.
            </p>
          </div>
          <div
            className={css({
              display: "grid",
              gridTemplateColumns: { base: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
              gap: "4",
            })}
          >
            {propertySections.map((section) => (
              <PropertyPicker
                key={section.type}
                title={section.title}
                description={section.description}
                options={properties.filter((property) => property.type === section.type)}
                selectedId={selectedPropertyIds[section.type]}
                onSelect={propertySetters[section.type]}
              />
            ))}
          </div>
        </GlassPanel>

        <GlassPanel tone="quiet" className={css({ display: "flex", flexDirection: "column", gap: "5" })}>
          <div className={css({ position: "relative", zIndex: 1 })}>
            <h2 className={css({ color: "ink.950", fontSize: "2xl", fontWeight: "black" })}>
              자기소개
            </h2>
            <p className={css({ marginTop: "1", color: "ink.500", fontSize: "sm", lineHeight: "1.7" })}>
              사진 없이 만나는 서비스이기 때문에, 나의 대화 리듬과 관계에서 중요하게 생각하는
              태도를 구체적으로 적어주세요.
            </p>
          </div>
          <GlassTextarea
            label="나를 소개하는 한 줄"
            placeholder="예: 천천히 친해지는 편이고, 대화가 잘 이어지는 사람을 선호해요."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={500}
            helper={`${description.length}/500 · 외모 어필보다 관계에서 중요한 태도나 리듬을 적어주세요.`}
          />
        </GlassPanel>

        <GlassPanel tone="quiet" className={css({ display: "flex", flexDirection: "column", gap: "5" })}>
          <div className={css({ position: "relative", zIndex: 1 })}>
            <h2 className={css({ color: "ink.950", fontSize: "2xl", fontWeight: "black" })}>
              매칭 참여 설정
            </h2>
            <p className={css({ marginTop: "1", color: "ink.500", fontSize: "sm", lineHeight: "1.7" })}>
              한 사람에게 집중할 수 있는 상태일 때만 매칭에 참여하도록 조절할 수 있습니다.
            </p>
          </div>

          <div
            className={css({
              position: "relative",
              zIndex: 1,
              display: "grid",
              gridTemplateColumns: { base: "1fr", md: "repeat(2, minmax(0, 1fr))" },
              gap: "4",
            })}
          >
            <GlassTextField
              label="선호 최소 나이"
              inputMode="numeric"
              placeholder="최소"
              value={minAge}
              onChange={(event) => setMinAge(event.target.value)}
            />
            <GlassTextField
              label="선호 최대 나이"
              inputMode="numeric"
              placeholder="최대"
              value={maxAge}
              onChange={(event) => setMaxAge(event.target.value)}
            />
            <GlassToggle
              checked={canCc}
              onChange={setCanCc}
              label="같은 과 매칭 허용"
              description="익숙한 생활권의 상대도 매칭 후보에 포함합니다."
            />
            <GlassToggle
              checked={explore}
              onChange={setExplore}
              label="이번 주 매칭 참여"
              description="지금 진지하게 만날 준비가 되었을 때 켜두세요."
            />
          </div>
        </GlassPanel>

        <LegalConsentPanel
          termsAccepted={termsAccepted}
          privacyAccepted={privacyAccepted}
          alreadyAgreed={termsAgreedAt != null}
          onTermsChange={setTermsAccepted}
          onPrivacyChange={setPrivacyAccepted}
        />

        {error && (
          <GlassPanel tone="quiet" className={css({ padding: "4" })}>
            <p className={css({ position: "relative", zIndex: 1, color: "ink.900", fontSize: "sm", fontWeight: "bold" })}>
              {error}
            </p>
          </GlassPanel>
        )}

        <div
          className={css({
            display: "flex",
            justifyContent: "flex-end",
            paddingBottom: "4",
          })}
        >
          <GlassButton type="button" onClick={onSave} disabled={saving}>
            {saving ? "저장 중..." : "저장하고 매칭 준비하기"}
          </GlassButton>
        </div>
      </section>
    </main>
  );
}
