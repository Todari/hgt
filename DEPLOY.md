# Deployment

```
 Browser ──HTTPS──▶ Vercel (apps/app)  ──HTTPS──▶  Caddy ─▶ EC2 :8080 (apps/api) ─▶ RDS Postgres
```

- **Frontend** (`apps/app`, `apps/landing`) → **Vercel**
- **Backend** (`apps/api`) → **EC2** (Ubuntu, ap-northeast-2), HTTPS via **Caddy**
- **DB** → **AWS RDS PostgreSQL** (same region)

> ⚠️ Vercel serves the frontend over HTTPS, so `NEXT_PUBLIC_API_URL` **must be HTTPS**.
> A browser on an HTTPS page cannot call `http://…` (mixed content). That's why the
> EC2 API needs a domain + TLS (Caddy). The `ec2-….amazonaws.com` hostname can't get
> a cert — use your own domain (A record → EC2 IP).

---

## 0. Push the repo

The 7 commits are still local. Push so EC2/Vercel can pull:

```bash
git push -u origin dev
```

## 1. Database — RDS PostgreSQL

1. Create an RDS PostgreSQL (ap-northeast-2), DB name `hgt`.
2. Security group: allow inbound `5432` from the EC2's security group.
3. Note the endpoint → goes into `DATABASE_URL` (with `DATABASE_SSL=true`).

> Cheaper alternative: run Postgres on the EC2 (`docker compose up -d postgres`
> from this repo, or `apt install postgresql`) and point `DATABASE_URL` at localhost.

## 2. Backend — EC2

```bash
ssh -i todari-consolidated.pem ubuntu@ec2-52-78-45-209.ap-northeast-2.compute.amazonaws.com

# toolchain
sudo apt update && sudo apt install -y git
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo corepack enable            # provides pnpm

# code
git clone https://github.com/Todari/hgt-client.git
cd hgt-client
pnpm install --frozen-lockfile

# env
cp apps/api/.env.production.example apps/api/.env
nano apps/api/.env              # fill DATABASE_URL, CORS_ORIGINS, ADMIN_TOKEN (openssl rand -hex 32)

# schema + seed (one time)
pnpm --filter api db:push
pnpm --filter api db:seed

# run as a service
sudo cp deploy/hgt-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now hgt-api
journalctl -u hgt-api -f        # logs
```

The API now listens on `127.0.0.1:8080`.

## 3. HTTPS — Caddy

```bash
sudo apt install -y caddy
sudo nano /etc/caddy/Caddyfile   # paste deploy/Caddyfile, set your domain
sudo systemctl restart caddy
```

Point `api.yourdomain.com` (A record) → EC2 public IP, and open inbound **80 + 443**
in the EC2 security group. Caddy auto-issues TLS. Test: `curl https://api.yourdomain.com/`.

## 4. Frontend — Vercel

1. Import the GitHub repo in Vercel.
2. **Root Directory** = `apps/app` (Next.js auto-detected; pnpm workspace handled automatically).
3. Env var: `NEXT_PUBLIC_API_URL = https://api.yourdomain.com`.
4. Deploy. Then add the resulting Vercel URL (e.g. `https://hgt.vercel.app`) to the
   API's `CORS_ORIGINS` and restart `hgt-api`.
5. (Optional) a second Vercel project with Root Directory `apps/landing`.

> Alternative without an EC2 domain: use Next.js `rewrites` to proxy
> `/api/:path*` → the EC2 origin server-side (no mixed content, no CORS), and set
> `NEXT_PUBLIC_API_URL=/api`. Trades a little latency for skipping TLS on EC2.

## 5. Operations

```bash
# trigger a match round manually (cron also runs it weekly if MATCH_CRON_ENABLED=true)
curl -X POST https://api.yourdomain.com/admin/match/run -H "X-Admin-Token: $ADMIN_TOKEN"

sudo systemctl restart hgt-api        # after env or code changes (git pull && pnpm install)
```
