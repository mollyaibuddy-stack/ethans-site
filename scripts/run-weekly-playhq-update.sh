#!/bin/zsh
set -euo pipefail

REPO_DIR="/Users/openclawbuddy/Documents/Codex/Ethan website/ethans-site-repo"
LOG_DIR="$REPO_DIR/logs"
LOG_FILE="$LOG_DIR/playhq-update.log"

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

mkdir -p "$LOG_DIR"
exec >> "$LOG_FILE" 2>&1

echo "---- $(date) PlayHQ update started ----"
cd "$REPO_DIR"

git pull --ff-only origin main

if [ ! -d node_modules ]; then
  npm ci
fi

PLAYHQ_HEADLESS="${PLAYHQ_HEADLESS:-0}" node scripts/update-playhq-local.mjs

node -e "JSON.parse(require('fs').readFileSync('public/data/playhq.json', 'utf8')); console.log('playhq.json is valid JSON')"

if git diff --quiet -- public/data/playhq.json; then
  echo "No PlayHQ data changes to commit."
  echo "---- $(date) PlayHQ update finished ----"
  exit 0
fi

git add public/data/playhq.json
git commit -m "Auto-update PlayHQ data"
git push origin main

echo "---- $(date) PlayHQ update finished ----"
