# HGT

홍익대학교 구성원 인증을 바탕으로 취향과 키워드를 나누고, 매주 새로운 1:1 대화로
연결하는 캠퍼스 매칭 서비스입니다. 웹과 iOS·Android 앱, API, 실시간 채팅 계약을 하나의
TypeScript 모노레포에서 관리합니다.

HGT는 홍익대학교가 운영하거나 보증하는 공식 서비스가 아닌 독립 프로젝트입니다.

> 이 저장소가 현재 HGT 제품의 정본입니다. 이전 Flutter 앱과 Go 서버 구현은 공개 배포·유지보수
> 대상에서 제외하고 별도의 비공개 아카이브로 보존합니다.

## 핵심 흐름

- 홍익대학교 포털 계정을 이용한 구성원 확인
- MBTI와 키워드 기반 프로필·선호 설정
- 휴면 사용자 제외와 키워드 점수를 반영한 주간 1:1 매칭
- WebSocket 기반 실시간 채팅과 재연결
- 차단·신고·안전 안내를 포함한 사용자 보호 흐름
- 하나의 코드베이스에서 제공하는 웹·Capacitor 모바일 앱

```text
Next.js + Capacitor app
          │ HTTP / WebSocket
          ▼
     Hono API server
          │
          ▼
Drizzle ORM + PostgreSQL
```

API 요청·응답 형태는 `packages/contract`의 zod 스키마를 정본으로 사용합니다. 앱과 API가
같은 타입을 공유해 인증, 프로필, 매칭과 채팅 계약이 서로 어긋나지 않도록 구성했습니다.

## 저장소 구조

| 경로                | 역할                           | 주요 기술                            |
| ------------------- | ------------------------------ | ------------------------------------ |
| `apps/api`          | HTTP·WebSocket API와 주간 매칭 | Hono, Drizzle, PostgreSQL            |
| `apps/app`          | 웹·iOS·Android 사용자 앱       | Next.js, React, Panda CSS, Capacitor |
| `apps/landing`      | 서비스 소개 페이지             | Next.js                              |
| `packages/contract` | 공유 zod 스키마와 API 타입     | TypeScript, zod                      |
| `packages/ui`       | 공유 UI 컴포넌트               | React                                |

상세 설계는 [아키텍처 문서](docs/architecture.md), 운영 환경은
[배포 문서](DEPLOY.md), 저장소 작업 규칙은 [CLAUDE.md](CLAUDE.md)를 참고하세요.

## 로컬 실행

Node.js 20 이상, pnpm 9, Docker가 필요합니다.

```bash
pnpm install
docker compose up -d postgres
cp apps/api/.env.example apps/api/.env
pnpm db:push
pnpm --filter api db:seed
pnpm dev
```

- API: `http://localhost:8080`
- 사용자 앱: `http://localhost:3000`
- PostgreSQL: 호스트 포트 `5433`

## 검증

```bash
pnpm build
pnpm lint
pnpm check-types
```

DB 스키마 변경은 개발 환경에서 `pnpm db:push`로 확인하고, 배포 가능한 마이그레이션은
`pnpm db:generate && pnpm db:migrate`로 생성·검증합니다.

## 보안과 공개 범위

- 학교 계정 자격증명과 세션 토큰을 소스·로그·테스트 픽스처에 남기지 않습니다.
- 세션 토큰은 로그인마다 교체하고, 클라이언트에는 필요한 인증 상태만 저장합니다.
- 운영 환경 변수와 배포 자격증명은 저장소 밖에서 관리합니다.
- 보안 문제는 공개 이슈 대신 [보안 정책](.github/SECURITY.md)의 비공개 채널로 제보해 주세요.
