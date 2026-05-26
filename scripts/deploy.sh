#!/bin/bash
set -euo pipefail

APP_DIR="/home/deploy/library-lms"
REPO_URL="git@github.com:yourusername/library-lms.git"
BRANCH="main"

echo "=== Deploying Library LMS ==="

cd "$APP_DIR"

git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "[1/4] Building frontend..."
cd client
npm ci
npm run build
cd ..

echo "[2/4] Installing backend dependencies..."
cd server
npm ci --omit=dev

echo "[3/4] Running database migrations..."
npx prisma generate
npx prisma migrate deploy
cd ..

echo "[4/4] Restarting application..."
pm2 startOrRestart ecosystem.config.cjs --update-env
pm2 save

echo "=== Deployment complete ==="
