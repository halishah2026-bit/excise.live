#!/bin/bash
set -euo pipefail

ROOT_DIR="/var/www/html/excise.live"
API_DIR="$ROOT_DIR/api"
WEB_DIR="$ROOT_DIR/web"

echo "========================================="
echo "  Excise.Live Vehicle Verification"
echo "========================================="
echo ""

if [[ ! -d "$API_DIR" || ! -d "$WEB_DIR" ]]; then
  echo "Project directories not found:"
  echo "  API: $API_DIR"
  echo "  WEB: $WEB_DIR"
  exit 1
fi

echo "[1/3] Building Frontend for production..."
cd "$WEB_DIR"
npm run build

echo "[2/3] Starting Backend API (port 5000)..."
cd "$API_DIR"
node server.js &
API_PID=$!
echo "    API PID: $API_PID"
sleep 2

echo "[3/3] Starting Frontend (port 3000, production)..."
cd "$WEB_DIR"
PORT=3000 npm run start &
WEB_PID=$!
echo "    Frontend PID: $WEB_PID"

echo ""
echo "========================================="
echo "  Services Running:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:5000"
echo ""
echo "  Default Admin:"
echo "  Email:    admin@excise.live"
echo "  Password: Admin@123"
echo "========================================="

wait
