#!/usr/bin/env bash
# Quick local dev setup (without Docker) for backend only
set -e

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../apps/backend" && pwd)"

echo "🐍 Setting up Python virtual environment..."
cd "$BACKEND_DIR"

python3 -m venv .venv
source .venv/bin/activate

echo "📦 Installing dependencies..."
pip install -r requirements.txt -q

echo "✅ Venv ready. Activate with:"
echo "   source apps/backend/.venv/bin/activate"
echo ""
echo "Then run:"
echo "   uvicorn app.main:app --reload"
