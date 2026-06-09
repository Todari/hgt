# HGT Warm Glass Design System

## Product Position

HGT는 “많이 고르는 소개팅 앱”이 아니라 “믿을 수 있는 한 사람을 진지하게 만나는 캠퍼스 매칭”이다. UI는 설렘을 주되 가볍지 않아야 하며, 인증과 AI 매칭의 신뢰감을 함께 전달해야 한다.

Core promises:

- Trust: 홍익대 인증으로 상대의 기본 신뢰를 만든다.
- Focus: 다대일 노출보다 한 사람에게 집중하는 1:1 흐름을 우선한다.
- AI Fit: 사진과 자기소개보다 생활 리듬, 대화 성향, 만남의 온도 같은 궁합 신호를 본다.

## Visual Direction

Selected palette: HGT Warm Glass

- Primary: `#FF6B5F`
- Primary deep: `#B83E3A`
- Primary soft: `#FFE2DB`
- Ink: `#0A1118`, `#293843`, `#5E6F7A`
- Glass white: `rgba(255, 255, 255, 0.42-0.78)`

Rules:

- Use one visible hue family only: warm coral.
- Do not add blue, green, purple, yellow, or rainbow gradients for product UI.
- Warmth comes from primary tint, not from saturating the entire screen.
- Trust comes from ink contrast, restrained layout, clear status copy, and verified flows.

## Material Rules

- Glass surfaces use translucent fill, white inner highlight, hairline border, and primary-tinted layered shadow.
- Primary action gets `actionGlow`; ordinary surfaces use `glassFloat` or `glassLift`.
- Never use a flat card when the element is a control, authentication panel, match note, or decision surface.
- Avoid glass inside glass unless the inner element is a small chip, metric, or input.
- Preserve text legibility: glass backgrounds must stay light enough for `ink.900` text.

## Motion Rules

- Buttons: hover lift `y: -3`, tap scale `0.98`.
- Cards: hover lift `y: -4` or slight x-shift for lists.
- Background light bands: slow ambient movement only.
- Do not animate long text independently from its container.
- Global reduced-motion support lives in `globals.css`.

## Implemented Tokens

- Panda tokens: `apps/app/panda.config.ts`
- Global material classes: `apps/app/src/app/globals.css`
- Reusable UI primitives: `apps/app/src/components/ui/glass.tsx`
- Showcase route: `apps/app/src/app/design-system/page.tsx`

## Implemented Components

`GlassPanel`

- Use for authentication panels, match notes, explanation cards, modal bodies, and major content surfaces.
- Props: `tone="default" | "quiet" | "strong"`, `interactive`.

`GlassButton`

- Use for CTA and secondary commands.
- Variants: `primary`, `secondary`.
- Supports `href` for links and native button props for actions.

`GlassBadge`

- Use for compact labels like “믿을 수 있는 캠퍼스 소개팅”, “AI Match Note”, “인증 완료”.

`GlassTextField`

- Use for login, onboarding, profile preference, and matching preference inputs.
- Supports helper and error text.

`GlassTextarea`

- Use for AI matching notes, profile intent, and longer privacy-safe descriptions.
- Avoid appearance-first prompts; ask for relationship rhythm, boundaries, and conversation style.

`GlassChip`

- Use for selectable matching signals and compact verified attributes.
- Selected state uses warm coral fill; unselected state stays mostly translucent.

`GlassToggle`

- Use for binary settings such as weekly matching participation and same-major matching.
- Copy must explain what changes when the setting is enabled.

`GlassFeatureCard`

- Use for problem, solution, value prop, and policy explanation cards.

`GlassMetric`

- Use sparingly. Metrics must support trust or progress. Avoid vanity stats like “오늘 연결 수” unless real and meaningful.

## Required Future Components

These are not yet implemented, but should follow the same material and motion rules:

- VerifiedIdentityCard: school, department, certification state, privacy-safe disclosure.
- MatchBriefCard: one recommended person, why AI matched them, next action.
- CompatibilitySignal: lifestyle, conversation, intent, schedule, value-fit chips.
- OneToOneQueueState: waiting, reviewing, accepted, expired.
- ConsentDecisionBar: accept, pass, hold; always clear and low-pressure.
- ChatPreviewCard: opens only after mutual acceptance.
- SafetyNotice: reporting, privacy, no-password-storage, matching policy.
- ProfileQuestionBlock: AI matching input without appearance-first framing.
- EmptyStateGlass: waiting states and no-match states with restrained copy.

## Page Layout Patterns

Landing

- First viewport must state the problem and HGT’s difference.
- Primary message: trust, 1:1 focus, AI non-appearance match.
- Avoid fake social proof and dating-app vanity numbers.

Auth

- Use one glass authentication panel.
- State clearly that password is not stored.
- After success, show certification result without overexposing personal data.

Onboarding

- Step-based full-width layout, not dense forms.
- Ask about rhythm, intent, conversation style, interests, and boundaries.
- Do not ask users to optimize profile attractiveness.

Match Result

- Show one match at a time.
- Explain why the AI recommended the person using short compatibility signals.
- De-emphasize appearance; no large photo-first card.

Chat

- Quiet and readable over decorative.
- Use glass top/bottom controls; messages should stay clean and high-contrast.
- Surface safety and report controls without making them visually loud.

Admin/Operations

- Use dense, restrained layouts.
- Glass only for top bars, filters, and summary panels; tables should remain highly legible.

## Asset Direction

Use assets only when they clarify the service:

- Brand mark: simple H monogram in coral glass.
- Background: abstract light bands, noise, and grid fields from CSS.
- Icons: use lucide icons when icon dependency is added; avoid custom decorative SVG icons for common actions.
- Avatars: do not use face photos as the primary visual system. If needed, use verified initials, silhouette gradients, or privacy-first placeholders.
- Illustration: avoid stock couples, hearts, and overly romantic imagery. HGT should feel warm, credible, and campus-native.

## Content Voice

- Direct and calm.
- Avoid marketing claims like “운명의 상대” or “완벽한 매칭”.
- Prefer: “한 사람에게 집중”, “인증된 상대”, “AI가 궁합 신호를 봅니다”.
- Safety copy must be explicit and concrete.

## Accessibility

- Text must meet contrast on glass surfaces.
- Buttons and fields need visible focus states.
- Do not rely on color alone for error, success, or verification.
- Motion must remain optional through reduced-motion media query.

## Acceptance Checklist

Before shipping a new UI:

- Uses only HGT Warm Glass palette.
- Shows the user’s next action clearly.
- Does not look like a generic swipe-based dating app.
- Does not make appearance the primary decision surface.
- Has mobile and desktop layout constraints.
- Has loading, empty, error, disabled, and success states where applicable.
- Passes `pnpm --filter app check-types`, `lint`, and `build`.
