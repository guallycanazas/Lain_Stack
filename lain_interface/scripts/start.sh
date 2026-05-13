#!/usr/bin/env bash
# ============================================================
# CanazasTEL Admin Platform — Full startup script
# Usage: ./scripts/start.sh [--seed]
# ============================================================
set -e

SEED=${1:-""}
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "═══════════════════════════════════════════════"
echo "  CanazasTEL Admin Platform — Startup Script   "
echo "═══════════════════════════════════════════════"

# Copy .env if it doesn't exist
if [ ! -f "$PROJECT_ROOT/.env" ]; then
  echo "⚙️  Creating .env from .env.example..."
  cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
  echo "✅ .env created — please review and update secrets before production"
fi

echo "🐳 Starting Docker services..."
docker compose -f "$PROJECT_ROOT/docker-compose.yml" up -d db redis

echo "⏳ Waiting for database..."
sleep 8

echo "🏗️  Running Alembic migrations..."
docker compose -f "$PROJECT_ROOT/docker-compose.yml" run --rm backend \
  sh -c "cd /app && alembic upgrade head"

if [ "$SEED" = "--seed" ]; then
  echo "🌱 Running database seed..."
  docker compose -f "$PROJECT_ROOT/docker-compose.yml" run --rm backend \
    python scripts/seed.py
fi

echo "🚀 Starting all services..."
docker compose -f "$PROJECT_ROOT/docker-compose.yml" up -d

echo ""
echo "═══════════════════════════════════════════════"
echo "  ✅ CanazasTEL Admin Platform is running!     "
echo "═══════════════════════════════════════════════"
echo "  Frontend:    http://localhost"
echo "  Backend API: http://localhost:8000"
echo "  API Docs:    http://localhost:8000/api/v1/docs"
echo "  PgAdmin:     postgresql://localhost:5432/canazastel_db"
echo ""
echo "  Demo Credentials:"
echo "  admin    → Admin1234!"
echo "  operator → Oper1234!"
echo "  viewer   → View1234!"
echo "═══════════════════════════════════════════════"
