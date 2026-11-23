#!/usr/bin/env bash
# Runs ON THE SERVER as the forced command of the GitHub Actions deploy key
# (authorized_keys: restrict,command="/home/ubuntu/hgt-client/deploy/remote-deploy.sh").
# The key can do exactly one thing: deploy a commit that is on origin/dev of the
# public repo. The EC2 box is shared with other projects, so the CD key must
# never be a general shell. See DEPLOY.md §1b.
set -euo pipefail

sha="${SSH_ORIGINAL_COMMAND:-${1:-}}"
if [[ ! "$sha" =~ ^[0-9a-f]{40}$ ]]; then
  echo "usage: ssh <host> <40-hex commit sha on dev>" >&2
  exit 2
fi

export PATH="$HOME/.local/share/pnpm:$PATH"
SRC="$HOME/hgt-src"
APP="$HOME/hgt-client"

[ -d "$SRC/.git" ] || git clone --quiet --branch dev https://github.com/Todari/hgt.git "$SRC"
git -C "$SRC" fetch --quiet origin dev
if ! git -C "$SRC" merge-base --is-ancestor "$sha" FETCH_HEAD; then
  echo "$sha is not on origin/dev — refusing to deploy" >&2
  exit 2
fi
git -C "$SRC" checkout --quiet --force --detach "$sha"
echo "deploying $(git -C "$SRC" log -1 --format='%h %s')"

# Server-only files survive: the env file and the port-edited compose file.
rsync -a --delete \
  --exclude=.git --exclude=node_modules --exclude=.turbo --exclude=styled-system \
  --exclude=apps/api/.env --exclude=docker-compose.yml \
  "$SRC/" "$APP/"

cd "$APP"
pnpm install --frozen-lockfile --filter "api..."
pnpm --filter api db:migrate
sudo systemctl restart hgt-api

for _ in 1 2 3 4 5 6; do
  sleep 5
  if curl -fsS http://localhost:8090/health | grep -q '"ok":true'; then
    echo "deploy healthy"
    exit 0
  fi
done
echo "health check failed after restart" >&2
exit 1
