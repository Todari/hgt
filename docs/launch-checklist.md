# 출시 체크리스트

> HGT를 실제 사용자에게 열기 전까지 남은 작업 목록. 배포 절차는
> [../DEPLOY.md](../DEPLOY.md), 네이티브 빌드/푸시 런북은
> [../apps/app/CAPACITOR.md](../apps/app/CAPACITOR.md) 참고.
> 완료하면 체크하고, 항목이 사라지거나 바뀌면 이 파일을 갱신할 것.
>
> **상태 갱신 (2026-11-23):** 8월 작업분을 `dev`에 정본화했고, API는 `dev` push 시
> 자동 배포(CD)된다. TLS·약관 공개 URL·웹 대기 화면 게이트·zod 4/보안 패치가 운영에
> 반영됐다. DB 비밀번호 교체와 백업 cron·복구 리허설도 끝났다. 남은 P0는 백업
> 오프사이트 복사, 푸시(유료 Apple Developer 가입 필요) 실기기 검증, Capacitor 8
> 실기기 확인, 스토어 스크린샷이다 (아래 각 항목 참고).
>
> **최종 출시 점검 (2026-06-15):** 코드 품질은 양호 — `app`/`api` check-types +
> `app` lint 통과, 코럴 그라데이션 WCAG 대비(흰 글자) 회귀 수정 확인, QA 픽스처
> (매칭 쌍 + 대화 5건) 정상. 그러나 아래 **출시 전 필수** 다수가 미완(법무/서버운영)
> 이라 소프트 런치는 **조건부 NO-GO**. 판정은 본 파일 하단 "출시 판정" 참고.

## 출시 전 필수

- [x] **TLS (HTTPS/WSS)** — Nginx + Certbot으로 `https://api.hgt.todari.dev` 운영
      (`deploy/nginx-api.hgt.todari.dev.conf`, DEPLOY.md §4). 2026-11-23 확인: 외부
      `/health` 200, `wss` 업그레이드 101, 8090 직접 접근 차단.
- [x] **네이티브 빌드에 https URL 굽기** — `next.config.js`가 localhost API URL이
      박힌 Capacitor 빌드를 거부한다(`CAPACITOR_ALLOW_LOCAL_API=true`는 시뮬레이터 전용).
      스토어 빌드는 `NEXT_PUBLIC_API_URL=https://api.hgt.todari.dev`로 만들 것.
- [x] **DB 비밀번호 교체** — 2026-11-23 운영 DB 비밀번호를 무작위 값으로 교체
      (DEPLOY.md §7). `apps/api/.env`의 `DATABASE_URL`과 서버 루트 `.env`의
      `POSTGRES_PASSWORD`에만 있고, 배포 동기화에서 제외된다. 이전 dev 비밀번호는
      TCP 접속에서 거부됨을 확인.
- [~] **백업 + 오프사이트** — 2026-11-23 `deploy/backup-db.sh` cron 등록(매일 04:30 KST,
      `/var/backups/hgt/`, 14일 보관)하고 복구 리허설 1회 완료(스크래치 DB에 복원해
      테이블·행 수 일치 확인). **남은 작업:** 오프사이트 복사 — 서버에 `aws`/`rclone`이
      없고 버킷·자격 증명이 필요하다. 실사용자를 받기 전에 추가할 것.
- [x] **푸시 클라이언트 배선** — `cap sync`, AppDelegate FCM 토큰 브리지,
      `GoogleService-Info.plist` / `google-services.json`, `aps-environment`
      entitlement까지 구현하고 Firebase 포함 iOS Simulator 빌드 통과.
- [ ] **푸시 운영 자격 증명 + 실기기 검증** — 서버
      `FIREBASE_SERVICE_ACCOUNT`, Apple App ID Push capability/프로비저닝 프로필
      갱신, APNs 키 → Firebase 업로드 후 이태훈 iPhone에서 실제 알림 수신 확인.
      전체 런북: CAPACITOR.md "Push notifications".
- [ ] **Capacitor 6 → 8 마이그레이션** — Google Play가 2026-08-31부터 신규 앱에
      **target API 36**을 요구한다. PR #29에서 Capacitor 8.6(targetSdk 36, iOS 15+,
      Gradle에 JDK 21 필요)으로 올렸고 iOS 시뮬레이터·Android debug 빌드는 통과.
      **실기기 검증 후 머지** — 확인 항목(edge-to-edge, 네이티브 탭바, 키보드, 푸시)은
      PR 본문 참고.
- [x] **이용약관/개인정보처리방침 공개 URL** — `https://app.hgt.todari.dev/terms`,
      `https://app.hgt.todari.dev/privacy`. 본문은 `apps/app/src/content/legal.ts`
      하나만 고치면 앱 내부·공개 URL에 함께 반영된다.
- [x] **PIPA: 민감정보(종교) 별도 동의 — 서버 저장/강제 (코드 구현 완료)** —
      ① 스키마에 `users.sensitive_consent_at` 컬럼 + 마이그레이션 `0003_tricky_nuke.sql`,
      ② contract `updateProfileSchema.agreedToSensitive` 플래그 + `userSchema.sensitiveConsentAt`,
      ③ `me.ts`: 동의(기존 또는 이번 요청)가 없으면 `religionId` 거부(400 "종교 정보를
      입력하려면 민감정보 수집·이용에 동의해야 합니다."), 동의 시 시각 stamp. 라이브 검증:
      동의 없는 종교 입력 → 400, 동의와 함께 → 200 + `sensitiveConsentAt` 기록.
      온보딩 `StepTerms` 동의 토글이 `agreedToSensitive`를 전송하도록 배선됨.
      **남은 작업:** 개인정보처리방침 문구가 이 동의 흐름과 일치하는지 법무 검수. (소유: 법무 확인)
- [ ] **처리방침 ↔ 실제 데이터 흐름 일치 검증** — 수집 항목(포털에서 학번·이름·
      전공·성별·나이·재학상태 스크래핑, 키워드, 채팅 메시지, 디바이스 토큰),
      비밀번호는 포워딩만 하고 저장하지 않음, 탈퇴 시 cascade 삭제, 제3자
      제공(Firebase FCM) — 문서 문구가 코드와 다르면 둘 중 하나를 고칠 것.
      **확인 필요(2026-11-23):** 웹 대기 모드에서는 로그인 즉시 포털 정보가 수집·저장되지만
      약관 동의 단계(온보딩 `StepTerms`)를 거치지 않고 대기 화면으로 간다. 로그인 화면에
      수집 고지·약관 링크를 둘지, 대기 화면에서 동의를 받을지 법무 판단 필요.
- [x] **여성 계정 플로우 QA** — 3차 검증에서 여성 계정(qa_seed_female)으로
      홈/대화/채팅/설정/온보딩 전 구간 + 계정 간 실시간 메시지 전달까지 점검,
      성별 대칭성 확인(저심각 항목만). **수정 완료:** 병역(군필/미필) 필드를
      남성에게만 노출하도록 게이팅(`StepBasics` `gender` prop, `gender===true`일 때만 렌더).
      신규 가입(fresh) 여성 계정의 온보딩→매칭→신고/차단 전 구간은 실유저 가입 시 재확인 권장.

## 스토어 제출

- [~] **스토어 자산 제작** — 앱 아이콘·스플래시는 브랜드 마크(코랄 + H)로 교체함
      (소스 `apps/app/assets/`, `@capacitor/assets` 레이아웃). **남은 작업:** 기기에서
      아이콘·스플래시 확인, 기기별 스토어 스크린샷.
- [x] **App Review용 데모 계정 (`DEMO_ACCOUNTS`) — 코드 구현 완료** — 포털 우회
      데모 로그인은 구현됨(`apps/api/src/routes/auth.ts`: `DEMO_ACCOUNTS="id:pw,..."`
      매칭 시 포털 스크래핑 생략, 고정 데모 프로필 upsert). `.env.example`에 문서화됨.
      ② **데모 매칭/대화 시드 — 코드 구현 완료**(`apps/api/scripts/demo-seed.ts`):
      데모 계정에 완성 프로필 + 이번 주 매치(데모 파트너) + 대화를 직접 insert해
      심사자가 로그인 즉시 매칭/채팅을 본다. 프로덕션 안전(전역 매치 라운드/타
      사용자 무영향, 멱등). **2026-11-23 운영 반영:** 서버 `apps/api/.env`에
      `DEMO_ACCOUNTS=review01:<무작위>` 설정 후 `demo-seed.ts` 실행 — 데모 로그인,
      이번 주 매치, 대화 2건 확인. **남은 작업:** ③ 스토어 심사 노트에 계정 기재
      (비밀번호는 서버 env에서 확인). 심사가 끝나면 env에서 지워 비활성화할 수 있다.
- [ ] **"프로필 사진 없음"은 의도된 설계임을 명시** — 외모 비중심 키워드 매칭이
      제품 컨셉. 심사 노트(리뷰어 메모)와 스토어 설명에 명시해 미완성 앱으로
      오해받지 않게 할 것.
- [ ] **데이팅 앱 등급/안전 요건** — 연령 등급(17+/18+) 설정, 신고·차단 기능
      안내(이미 구현됨: blocks/reports), UGC 정책 문구.

## 출시 후

- [~] **모니터링 상시화** — **API Sentry 배선 완료**(`@sentry/node`,
      `apps/api/src/lib/observability.ts` + `app.onError` capture; `SENTRY_DSN`
      미설정 시 완전 no-op). **남은 작업:** 운영 env에 `SENTRY_DSN` 설정,
      `/health` 업타임 체크(UptimeRobot 또는 curl cron) 가동, 앱 측 클라이언트
      에러 추적(`@sentry/capacitor`/`@sentry/nextjs`)은 정적 export 영향 검토 후
      디바이스 테스트와 함께 도입.
- [ ] **애널리틱스 결정** — 현재 아무 분석 도구도 없음. 도입 여부와 도구(자체
      이벤트 테이블 vs PostHog 등)를 정하고, 도입 시 개인정보처리방침에 반영.
- [ ] **어드민 콘솔 확장** — 현재 admin은 수동 매치 실행 + 신고 목록 조회 수준.
      신고 처리 워크플로(경고/정지), 유저 검색, 매칭 지표 대시보드로 확장.

## 출시 판정 (2026-06-15 최종 게이트키퍼 점검)

**판정: 조건부 NO-GO** (소프트 런치 web + TestFlight). 코드/UX 품질은 출시 수준이나,
**보안·법무·운영 차단 항목**이 미해소다. 아래 P0를 닫으면 GO.

> **갱신 (2026-11-23):** 아래 NO-GO 사유 중 #1 TLS, #2 https URL 빌드 가드,
> #5 약관 공개 URL은 해소됐다. #4 DB 비밀번호도 교체했다. 남은 차단 항목은 백업 오프사이트,
> 푸시 운영 자격 증명 + 실기기 검증, Capacitor 8 실기기 확인, 스토어 스크린샷이다.
> 운영 DB에는 실사용자가 아직 없다(계정 1개).

### NO-GO 사유 (Top 블로커, 모두 코드 외 작업)
1. **TLS 미구성 (보안, 치명)** — API가 평문 HTTP(:8090)로 외부 노출 중이고 Caddyfile은
   여전히 `api.yourdomain.com` placeholder. 포털 **비밀번호가 평문으로 전송**된다.
   런치 전 반드시 HTTPS/WSS. (소유: 서버운영)
2. **네이티브 빌드 https URL 굽기** — TLS 적용 후 `NEXT_PUBLIC_API_URL=https://…`로
   재빌드. HTTP가 박힌 빌드는 절대 스토어/TestFlight에 올리지 말 것. (소유: 디바이스/Xcode)
3. **PIPA 민감정보(종교) 동의 서버 저장/강제 누락 (법무)** — UI만 있고 서버가 동의를
   기록·강제하지 않음 → **코드 해소 완료**(`sensitive_consent_at` + `me.ts` 강제,
   라이브 검증됨). 남은 건 처리방침 문구의 법무 검수뿐. (소유: 법무)
4. **DB 비밀번호 교체** — 커밋된 dev 비밀번호로 운영 중(확인된 리스크). (소유: 서버운영)
5. **약관/처리방침 공개 URL** — 스토어 심사 필수 양식. 미게시. (소유: 법무/배포)

> 갱신(2026-06-15, 후속 코드 패치): 위 #3의 리포 코드 부분과 아래 P1(여성 병역 숨김),
> P2의 `/me/match` `score` 제거 + 'AI' 과장 카피(온보딩) 정직화까지 **모두 반영 완료**.
> 남은 P0는 전부 **서버운영·법무·디바이스** 소유 항목이다 — 리포 코드 측 출시 차단 요소 없음.

### GO 가능 신호 (이미 통과)
- 코드 검증: `pnpm --filter app check-types` / `--filter api check-types` /
  `--filter app lint` 모두 통과(경고 0).
- 코럴 그라데이션 WCAG AA(흰 글자) 회귀 수정 확인 — 온보딩 primitives + 대화 목록
  안읽음 배지 모두 deep gradient(`#b83e3a→#d0463c`, ≈4.55:1)로 전환됨.
- 데모 로그인·민감정보 동의 UI·신고/차단 등 핵심 기능 코드 구현 완료.
- QA 픽스처(매칭 쌍 + 대화 5건) 무손상.

### 작업 순서 (소유자별)
- **서버운영 (P0):** TLS(Caddy) → SG 443 open/8090 close → DB 비밀번호 교체 →
  백업 cron + 오프사이트 + 복구 리허설 → `DEMO_ACCOUNTS`/`ADMIN_TOKEN`/
  `FIREBASE_SERVICE_ACCOUNT` env 설정 → `/health` 업타임 체크.
- **법무 (P0):** 처리방침/약관 공개 URL 게시 → PIPA 민감정보 동의 문구 검수 →
  처리방침 ↔ 실제 수집 항목 일치 검증.
- **리포 코드:** ✅ 민감정보 동의 서버 저장/강제, ✅ 여성 병역 필드 숨김,
  ✅ `/me/match` `score` 제거, ✅ 온보딩 'AI' 과장 카피 정직화 — 모두 완료.
  남은 P2 cosmetic(선택): 홈 "다시 시도" 버튼/브랜드 H 로고 코럴 통일, 라디우스
  토큰 정리, 내부 `/design-system` 쇼케이스 라우트의 'AI 매칭' 카피(프로덕션 번들 포함).
- **디바이스/Xcode (P0):** https URL로 네이티브 재빌드 → Capacitor 8 PR #29 실기기 검증·머지
  (Play target API 36) → Apple Push capability/프로필/APNs 키와 실기기 푸시 확인 → 앱 아이콘/스플래시/
  스크린샷 → 데이팅 앱 연령 등급.
- **서버운영/제품 (런치 후):** Sentry, 애널리틱스 결정, 어드민 콘솔 확장.

### Week 1 모니터링 (런치 후 우선 관찰)
- **인증/로그인:** `POST /auth/hongik` 실패율 + 포털 스크래핑 오류(EUC-KR 파싱),
  레이트리밋(429) 발생률, 세션 회전 후 401 급증 여부.
- **실시간/채팅:** WS 재연결 빈도(백오프 폭주 = 끊김 신호), 메시지 전송 429,
  콘텐츠 필터 오탐/누락(특히 전화번호·주민번호 패턴), 푸시 전달 실패.
- **매칭:** 월요일 19:00 KST 크론 실제 발화 + 멱등성(주당 1회), 미매칭 잔여 인원,
  catch-up 틱이 조기 실행 안 하는지.
- **안전:** 신고/차단 발생 추이(신고 5/day 한도 도달 사용자), 차단 후 대화 숨김·
  매칭 제외 정상 동작.
- **인프라:** `/health` 업타임, EC2 CPU/메모리, Postgres 연결 수·디스크,
  백업 cron 성공, 64KiB 바디 한도 413 발생.
- **법무 신호:** 민감정보(종교) 동의율 — 서버 저장 구현 후 동의 없는 종교 입력 시도
  로그.
