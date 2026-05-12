#!/bin/bash
# ============================================================
#  start.sh — Lance le backend FastAPI + le frontend Next.js
#  pour le déploiement HuggingFace Spaces (port 7860).
# ============================================================
set -e

echo "=============================================="
echo "  UNICEF Chatbot — Démarrage des services"
echo "=============================================="

# ── Backend FastAPI (port 8000, interne) ──────────────────────────────────
echo "[1/2] Démarrage du backend FastAPI..."
cd /app/backend
uvicorn app.main:app \
  --host 127.0.0.1 \
  --port 8000 \
  --no-access-log &
BACKEND_PID=$!
echo "      Backend PID: $BACKEND_PID"

# Attendre que le backend soit prêt (max 60 s)
echo "      Attente du backend..."
for i in $(seq 1 30); do
  if curl -sf http://127.0.0.1:8000/api/health > /dev/null 2>&1; then
    echo "      Backend prêt ✓"
    break
  fi
  sleep 2
done

# ── Frontend Next.js (port 7860, exposé par HF Spaces) ───────────────────
echo "[2/2] Démarrage du frontend Next.js sur le port 7860..."
cd /app/frontend
PORT=7860 HOSTNAME=0.0.0.0 node server.js &
FRONTEND_PID=$!
echo "      Frontend PID: $FRONTEND_PID"

echo ""
echo "=============================================="
echo "  Chatbot disponible sur http://0.0.0.0:7860"
echo "=============================================="

# Maintenir les deux processus en vie
wait $BACKEND_PID $FRONTEND_PID
