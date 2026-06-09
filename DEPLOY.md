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
  GoogleService-Info.plist + APNs key).
- SG must never expose 5455.

## Ops
```bash
# manual match round
curl -X POST http://localhost:8090/admin/match/run -H "X-Admin-Token: $ADMIN_TOKEN"
# redeploy after code changes (re-rsync from local, then:)
cd ~/hgt-client && pnpm install --filter "api..." && pnpm --filter api db:migrate && sudo systemctl restart hgt-api
sudo systemctl status hgt-api && journalctl -u hgt-api -n 50
```
