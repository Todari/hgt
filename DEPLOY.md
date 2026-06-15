# Deployment

```
 Native app ──HTTP──▶  EC2 :8090 (apps/api)  ──▶  Postgres :5455 (docker, localhost)
 Vercel web ─rewrites─▶ (same EC2)
```

## ✅ Status (live)
Backend is **deployed and running** on `ec2-52-78-45-209.ap-northeast-2`:
- `apps/api` via systemd (`hgt-api`, auto-restart) on **:8090**
- Postgres (docker `hgt-postgres`) on **127.0.0.1:5455** (localhost-only)
- migrations applied, catalog seeded (88 keywords / 33 attribute options)
- weekly match scheduler **on**; `GET /health` → `{"ok":true}`

> This EC2 already hosts other projects (Postgres on 5432–5436, web on 8080),
> so HGT auto-moved to **8090 / 5455**. Those are this box's real ports.

### ✅ External access (open)
Inbound TCP 8090 (0.0.0.0/0) is open on SG `sg-01f4daecf394a97da` (added via local
`aws` CLI). The API is reachable from the internet:
```bash
curl http://ec2-52-78-45-209.ap-northeast-2.compute.amazonaws.com:8090/health   # {"ok":true}
# manage the SG later (mac has working creds for acct 236677164563):
aws ec2 authorize-security-group-ingress --region ap-northeast-2 \
  --group-id sg-01f4daecf394a97da --ip-permissions 'IpProtocol=tcp,FromPort=8090,ToPort=8090,IpRanges=[{CidrIp=0.0.0.0/0}]'
```
Postgres (5455) stays localhost-only — never add it to the SG.

> No domain yet ⇒ the API is plain **HTTP**, so the portal password transits HTTP.
> Fine for testing; before real users add a domain + Caddy TLS (§4).

> **출시 전 전체 점검 목록**: [docs/launch-checklist.md](docs/launch-checklist.md)
> (TLS, DB 비밀번호, 푸시, 스토어 제출, PIPA 등 — 이 문서의 §4–§7과 교차 참조).

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

`dev` 브랜치에 푸시하면 GitHub Actions가 위 수동 절차(§1: rsync → install →
`db:migrate` → `systemctl restart`)를 그대로 실행한다. lint·type 게이트를 먼저
통과해야 배포되고, 서버의 `apps/api/.env`와 포트 수정된 `docker-compose.yml`은
rsync에서 제외해 보존한다. 수동 실행도 가능(Actions → Deploy (EC2) → Run).

**활성화: 레포 Settings → Secrets and variables → Actions 에 2개 시크릿 추가**
- `EC2_SSH_KEY` — 개인키 전체 내용 (`~/.ssh/todari-consolidated.pem`)
- `EC2_HOST` — `ec2-52-78-45-209.ap-northeast-2.compute.amazonaws.com`

시크릿이 없으면 deploy 잡은 경고만 남기고 건너뛴다(verify는 항상 실행).
⚠️ 단일 브랜치(`dev`)→프로덕션 직접 배포다(스테이징 없음). TLS 적용 전까지는
실사용자 트래픽을 받지 말 것(§4). 스키마 변경은 `db:migrate`가 자동 적용하되,
파괴적 마이그레이션은 §5 백업 후 수동 검토를 권장.

## 2. Native app → the EC2
```bash
NEXT_PUBLIC_API_URL=http://ec2-52-78-45-209.ap-northeast-2.compute.amazonaws.com:8090 \
  pnpm --filter app build:app && pnpm --filter app cap:sync
pnpm --filter app cap:ios     # Xcode → Run
```
(Requires SG 8090 open. The native webview origin `capacitor://localhost` is already allowed by CORS.)

## 3. Web on Vercel (optional, no domain)
```js
// apps/app/next.config.js
async rewrites() {
  return [{ source: "/api/:path*", destination: "http://ec2-…:8090/:path*" }];
}
```
Set `NEXT_PUBLIC_API_URL=/api`, Root Directory `apps/app`. (Browser → HTTPS Vercel → EC2.)

## 4. Production hardening (before real users)
- **Domain + HTTPS:** `api.yourdomain.com` → EC2 IP, `sudo apt install caddy`,
  `deploy/Caddyfile` (reverse_proxy localhost:8090), then
  `NEXT_PUBLIC_API_URL=https://api.yourdomain.com` and rebuild. Close 8090, open 443.
- **Push:** set `FIREBASE_SERVICE_ACCOUNT` + native Firebase config (google-services.json /
  GoogleService-Info.plist + APNs key) — full runbook: `apps/app/CAPACITOR.md`.
- **DB password:** prod currently runs the committed dev password — fix per §6 below.
- SG must never expose 5455.
- 나머지 출시 전 항목: [docs/launch-checklist.md](docs/launch-checklist.md).

## 5. 백업

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

## 6. DB 비밀번호 (운영 필수)

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

## 7. 모니터링

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
