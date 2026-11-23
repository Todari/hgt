# Deployment

```
 Native app ──HTTPS──▶ api.hgt.todari.dev ─▶ Nginx ─▶ EC2 :8090 (apps/api)
 Vercel web ──HTTPS───┘                              └─▶ Postgres :5455 (localhost)
```

## ✅ Status (live)
Backend is **deployed and running** on `ec2-52-78-45-209.ap-northeast-2`:
- `apps/api` via systemd (`hgt-api`, auto-restart) on **:8090**
- Postgres (docker `hgt-postgres`) on **127.0.0.1:5455** (localhost-only)
- migrations applied, catalog seeded (88 keywords / 33 attribute options)
- weekly match scheduler **on**; `GET /health` → `{"ok":true}`
- Nginx + Certbot serves `https://api.hgt.todari.dev` → `127.0.0.1:8090`
- Vercel projects deployed: `hgt-landing` and `hgt-app`
- Custom domains live: `hgt.todari.dev` and `app.hgt.todari.dev`

> This EC2 already hosts other projects (Postgres on 5432–5436, web on 8080),
> so HGT auto-moved to **8090 / 5455**. Those are this box's real ports.

### ✅ External access (HTTPS only)

The API is public only through Nginx on 80/443. Direct inbound TCP 8090 was
removed from SG `sg-01f4daecf394a97da` after TLS verification:

```bash
curl https://api.hgt.todari.dev/health   # {"ok":true}
```

Ports 8090 and 5455 stay private — never add them back to the SG.

> **출시 전 전체 점검 목록**: [docs/launch-checklist.md](docs/launch-checklist.md)
> (TLS, DB 비밀번호, 푸시, 스토어 제출, PIPA 등 — 이 문서의 §4–§8과 교차 참조).

---

## 1. Backend on EC2 — the recipe (already executed)

```bash
ssh -i ~/.ssh/todari-consolidated.pem ubuntu@ec2-52-78-45-209.ap-northeast-2.compute.amazonaws.com

# toolchain (docker + git were already present; installed Node 22 + corepack)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs
sudo corepack enable

# code: rsync'd from the dev machine (repo is private). To re-sync from local:
#   rsync -az --delete -e "ssh -i ~/.ssh/todari-consolidated.pem" \
#     --exclude=node_modules --exclude=.next --exclude=out --exclude=ios --exclude=android \
#     --exclude=styled-system --exclude=.turbo ~/workspace/projects/hgt-client/ \
#     ubuntu@ec2-…:~/hgt-client/
cd ~/hgt-client && pnpm install --frozen-lockfile --filter "api..."

# local Postgres on a free port (5455 here; docker-compose.yml ports edited + skip-worktree'd)
docker compose up -d postgres

# env
cp apps/api/.env.production.example apps/api/.env
#   DATABASE_URL → …localhost:5455/hgt   PORT → 8090
#   ADMIN_TOKEN  → openssl rand -hex 32   (set on server, not in git)
#   FIREBASE_SERVICE_ACCOUNT → paste to enable push (optional)

pnpm --filter api db:migrate   # prod uses migrations, not db:push
pnpm --filter api db:seed

sudo cp deploy/hgt-api.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now hgt-api
journalctl -u hgt-api -f
```

## 1b. 자동 배포 (CD) — `.github/workflows/deploy.yml`

`dev` 브랜치에 푸시하면 GitHub Actions가 lint·type 게이트를 통과한 커밋 sha를
서버에 SSH로 넘기고, 서버의 `deploy/remote-deploy.sh`가 나머지를 수행한다:
공개 레포 `origin/dev`에서 그 커밋을 받아 `~/hgt-client`로 동기화 → install →
`db:migrate` → `systemctl restart` → `/health` 확인. 서버의 `apps/api/.env`와
포트 수정된 `docker-compose.yml`은 동기화에서 제외해 보존한다.
수동 실행도 가능(Actions → Deploy (EC2) → Run).

**배포 키는 전용·제한 키다.** EC2가 다른 프로젝트와 공용이라 CD 키는 셸 권한이
없고 `remote-deploy.sh`만 실행한다(`authorized_keys`의 `restrict,command=…`).
`dev`에 없는 커밋은 스크립트가 거부한다. `todari-consolidated.pem`은 GitHub에
올리지 않는다.

**시크릿 (레포 Settings → Secrets and variables → Actions)**
- `EC2_SSH_KEY` — CD 전용 ed25519 개인키
- `EC2_HOST` — `api.hgt.todari.dev`

키 교체: 새 키쌍 생성 → 서버 `~/.ssh/authorized_keys`의
`hgt-github-actions-deploy` 줄을 새 공개키로 교체(옵션 접두사 유지) →
`gh secret set EC2_SSH_KEY < 새_개인키`.

수동 배포·롤백(운영자 키로 접속한 뒤): `~/hgt-client/deploy/remote-deploy.sh <sha>`.

시크릿이 없으면 deploy 잡은 경고만 남기고 건너뛴다(verify는 항상 실행).
⚠️ 단일 브랜치(`dev`)→프로덕션 직접 배포다(스테이징 없음).
스키마 변경은 `db:migrate`가 자동 적용하되,
파괴적 마이그레이션은 §6 백업 후 수동 검토를 권장.

## 2. Native app → the EC2
```bash
NEXT_PUBLIC_API_URL=https://api.hgt.todari.dev \
  pnpm --filter app build:app && pnpm --filter app cap:sync
pnpm --filter app cap:ios     # Xcode → Run
```
(The native webview origin `capacitor://localhost` is already allowed by CORS.)

## 3. Web on Vercel

| Project | Root directory | Domain | Production env |
|---|---|---|---|
| `hgt-landing` | `apps/landing` | `hgt.todari.dev` | `NEXT_PUBLIC_APP_URL=https://app.hgt.todari.dev/signin` |
| `hgt-app` | `apps/app` | `app.hgt.todari.dev` | `NEXT_PUBLIC_API_URL=https://api.hgt.todari.dev`, `NEXT_PUBLIC_WEB_APP_MODE=waitlist` |

## 4. DNS + HTTPS

Gabia DNS:

| Host | Type | Value |
|---|---|---|
| `hgt` | A | `76.76.21.21` |
| `app.hgt` | A | `76.76.21.21` |
| `api.hgt` | A | `52.78.45.209` |

The Nginx vhost is versioned at `deploy/nginx-api.hgt.todari.dev.conf`.
Certbot manages the deployed TLS directives and automatic renewal:

```bash
sudo certbot --nginx -d api.hgt.todari.dev --redirect
curl -fsS https://api.hgt.todari.dev/health
```

The native app has been rebuilt using §2. Public SG port 8090 is closed; keep
80/443 open for Nginx and certificate renewal.

## 5. Production hardening (before real users)
- **Push:** native Firebase config/bridge is versioned. Set
  `FIREBASE_SERVICE_ACCOUNT`, enable the Apple App ID's Push capability, refresh
  its provisioning profile, and upload the APNs key to Firebase — full runbook:
  `apps/app/CAPACITOR.md`.
- **DB password:** prod currently runs the committed dev password — fix per §7 below.
- SG must never expose 5455.
- 나머지 출시 전 항목: [docs/launch-checklist.md](docs/launch-checklist.md).

## 6. 백업

`deploy/backup-db.sh`가 도커 Postgres를 `pg_dump | gzip`으로 `/var/backups/hgt/`에
덤프하고 **14일 지난 덤프를 자동 삭제**한다. EC2에서:

```bash
# 1회 준비: 백업 디렉터리 (cron 실행 유저가 쓸 수 있게)
sudo mkdir -p /var/backups/hgt && sudo chown ubuntu:ubuntu /var/backups/hgt

# crontab -e (ubuntu 유저, docker 그룹 필요) — 매일 04:30 KST
# 서버 TZ가 UTC이므로 19:30 UTC = 04:30 KST. 서버 TZ를 바꿨다면 시간도 함께 조정.
30 19 * * * /home/ubuntu/hgt-client/deploy/backup-db.sh >> /var/backups/hgt/backup.log 2>&1
```

복구 (빈 `hgt` DB 기준 — 데이터가 남아 있으면 먼저 DROP/CREATE):

```bash
# (전체 복구 시) 기존 DB 비우기 — 접속 끊긴 상태에서:
docker exec hgt-postgres psql -U hgt -d postgres -c 'DROP DATABASE hgt' -c 'CREATE DATABASE hgt OWNER hgt'
# 덤프 주입:
gunzip -c /var/backups/hgt/hgt-YYYYMMDD-HHMMSS.sql.gz | docker exec -i hgt-postgres psql -U hgt -d hgt
```

> ⚠️ **오프사이트 복사 필요**: 지금은 백업이 같은 EC2 디스크에만 쌓인다.
> 인스턴스/볼륨 장애 = 백업까지 소실. **실사용자를 받기 전에** S3 (`aws s3 sync
> /var/backups/hgt s3://<bucket>/hgt-backups/`) 또는 rclone으로 복사하는 단계를
> cron 끝에 추가할 것.

## 7. DB 비밀번호 (운영 필수)

`docker-compose.yml`은 `POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-hgt_local_dev}` —
로컬은 기본값, **운영은 반드시 강한 비밀번호로 override** 해야 한다.

> ⚠️ **확인된 리스크**: 현재 운영 EC2는 git에 커밋된 dev 비밀번호(`hgt_local_dev`)
> 그대로 돌고 있다 (`.env.production.example`의 DATABASE_URL 참고). 5455가
> localhost 전용이라 당장 외부 노출은 없지만, 실사용자 전에 반드시 교체할 것.

운영 교체 절차 (Postgres는 `POSTGRES_PASSWORD`를 **볼륨 최초 초기화 때만** 반영하므로,
이미 돌고 있는 DB는 `ALTER USER`로 바꿔야 한다):

```bash
NEW_PW="$(openssl rand -hex 24)"   # 어딘가 안전한 곳에 보관
# 1) 살아있는 DB의 비밀번호 변경
docker exec hgt-postgres psql -U hgt -d hgt -c "ALTER USER hgt WITH PASSWORD '$NEW_PW'"
# 2) API가 같은 비밀번호를 쓰도록: apps/api/.env 의 DATABASE_URL 갱신 후 재시작
#    DATABASE_URL=postgresql://hgt:$NEW_PW@localhost:5455/hgt
sudo systemctl restart hgt-api && curl -fsS localhost:8090/health
# 3) 컨테이너를 나중에 재생성해도 유지되도록 compose env 고정
#    (repo 루트 .env는 gitignore 되어 있고 docker compose가 자동으로 읽는다)
echo "POSTGRES_PASSWORD=$NEW_PW" >> ~/hgt-client/.env
```

## 8. 모니터링

- **업타임 체크 — `GET /health`** (DB ping 포함, 실패 시 503):
  [UptimeRobot](https://uptimerobot.com) 무료 플랜에 `http://<EC2>:8090/health`
  (TLS 후 `https://api.<도메인>/health`) 키워드 모니터(`"ok":true`, 5분 간격)를 거는
  게 제일 간단. 외부 서비스가 싫으면 다른 머신에서 curl cron + 메일:

  ```bash
  # crontab — 5분마다 헬스 체크, 실패 시 메일 (mailutils 등 MTA 필요)
  */5 * * * * curl -fsS -m 10 http://<EC2>:8090/health | grep -q '"ok":true' || echo "HGT API down $(date)" | mail -s "[HGT] health FAIL" rhymint@gmail.com
  ```

- **systemd 저널 보존**: 기본값은 디스크를 잠식할 수 있다. `/etc/systemd/journald.conf`에
  `SystemMaxUse=500M` (또는 `MaxRetentionSec=14day`) 설정 후
  `sudo systemctl restart systemd-journald`. 일회성 정리는
  `sudo journalctl --vacuum-time=14d`.
- **TODO — 에러 트래킹 (Sentry)**: 아직 미도입. 도입 시 추가할 패키지:
  `pnpm --filter api add @sentry/node` (Hono 백엔드),
  `pnpm --filter app add @sentry/nextjs` (웹), 네이티브 크래시까지 보려면
  `@sentry/capacitor`. 출시 후 첫 스프린트에 넣을 것
  ([docs/launch-checklist.md](docs/launch-checklist.md) 참고).

## Ops
```bash
# manual match round
curl -X POST http://localhost:8090/admin/match/run -H "X-Admin-Token: $ADMIN_TOKEN"
# redeploy after code changes (re-rsync from local, then:)
cd ~/hgt-client && pnpm install --filter "api..." && pnpm --filter api db:migrate && sudo systemctl restart hgt-api
sudo systemctl status hgt-api && journalctl -u hgt-api -n 50
```
