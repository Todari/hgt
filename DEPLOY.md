# Deployment

```
 Native app ──HTTP──▶  EC2 :8080 (apps/api)  ──▶  local Postgres (docker)
 Vercel web ─rewrites─▶ (same EC2)
```

- **Backend** (`apps/api`) → **EC2** (Ubuntu, ap-northeast-2), systemd service
- **DB** → **Postgres on the EC2 itself** (docker compose, no RDS)
- **Native app** (Capacitor) → calls the EC2 directly
- **Web** (`apps/app`) → Vercel, proxying to the EC2 via Next `rewrites`

> ⚠️ No domain yet ⇒ the EC2 API is plain **HTTP**. Fine for testing, but the
> portal password then transits HTTP. **Before real users, get a cheap domain +
> Caddy TLS** (see the end) — it's far cheaper than RDS.

---

## 0. Push (done)
Already pushed to `origin/dev`. `ios/`·`android/` are gitignored — regenerate on
the build machine with `pnpm --filter app cap:sync` after `cap add`.

## 1. Backend on EC2

```bash
ssh -i todari-consolidated.pem ubuntu@ec2-52-78-45-209.ap-northeast-2.compute.amazonaws.com

# toolchain
sudo apt update && sudo apt install -y git docker.io docker-compose-v2
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs
sudo corepack enable
sudo usermod -aG docker ubuntu && newgrp docker     # use docker without sudo

# code
git clone https://github.com/Todari/hgt-client.git && cd hgt-client
pnpm install --frozen-lockfile

# local Postgres (host 5433)
docker compose up -d postgres

# env
cp apps/api/.env.production.example apps/api/.env
nano apps/api/.env        # set ADMIN_TOKEN (openssl rand -hex 32), CORS_ORIGINS, FIREBASE_SERVICE_ACCOUNT

# schema + seed  (prod uses migrations, not push)
pnpm --filter api db:migrate
pnpm --filter api db:seed

# run as a service
sudo cp deploy/hgt-api.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now hgt-api
journalctl -u hgt-api -f          # logs
```

**EC2 security group:** open inbound **22** and **8080** (and 80/443 only if you add Caddy).
Test: `curl http://<EC2-public-DNS>:8080/health` → `{"ok":true}`.

## 2. Native app → the EC2

`NEXT_PUBLIC_API_URL` is baked at `build:app`. Point it at the EC2:

```bash
NEXT_PUBLIC_API_URL=http://ec2-52-78-45-209.ap-northeast-2.compute.amazonaws.com:8080 \
  pnpm --filter app build:app && pnpm --filter app cap:sync
pnpm --filter app cap:ios     # Xcode → Run
```

## 3. Web on Vercel (optional, no domain)

Add a proxy so the browser only talks to Vercel (HTTPS), Vercel forwards to the EC2:

```js
// apps/app/next.config.js
async rewrites() {
  return [{ source: "/api/:path*", destination: "http://ec2-…:8080/:path*" }];
}
```
Set `NEXT_PUBLIC_API_URL=/api`, Root Directory `apps/app`, deploy. (No EC2 TLS needed.)

## 4. Production hardening (before real users)
- **Domain + HTTPS:** point `api.yourdomain.com` → EC2 IP, `sudo apt install caddy`,
  use `deploy/Caddyfile` (reverse_proxy localhost:8080). Then set
  `NEXT_PUBLIC_API_URL=https://api.yourdomain.com` and rebuild.
- **EC2 security group must NOT expose 5432/5433** (Postgres is localhost-only).

## Ops
```bash
curl -X POST http://<ec2>:8080/admin/match/run -H "X-Admin-Token: $ADMIN_TOKEN"   # manual round
cd hgt-client && git pull && pnpm install && pnpm --filter api db:migrate && sudo systemctl restart hgt-api
```
