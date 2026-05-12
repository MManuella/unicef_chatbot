# ══════════════════════════════════════════════════════════════════════════════
#  Dockerfile — UNICEF Chatbot (HuggingFace Spaces)
#
#  Architecture :
#   ┌────────────────────────────────────────────────┐
#   │  Port 7860 (exposé HF Spaces)                  │
#   │  ┌──────────────┐   rewrites   ┌─────────────┐ │
#   │  │ Next.js :7860│ ──/api/*──▶  │ FastAPI:8000│ │
#   │  └──────────────┘              └─────────────┘ │
#   │  Qdrant : mode fichier local (/app/qdrant_data) │
#   │  Cache  : fallback mémoire (pas de Redis)       │
#   │  LLM    : Mistral API (MISTRAL_API_KEY requis)  │
#   └────────────────────────────────────────────────┘
#
#  Build local :
#    docker build -t unicef-chatbot .
#    docker run -p 7860:7860 -e MISTRAL_API_KEY=sk-... unicef-chatbot
# ══════════════════════════════════════════════════════════════════════════════

# ── Stage 1 : Build Next.js frontend ─────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /build/frontend

COPY frontend/package*.json ./
RUN npm ci --prefer-offline

COPY frontend/ ./

# NEXT_PUBLIC_API_URL="" → les appels /api/* deviennent relatifs
# et sont ensuite proxiés par les rewrites Next.js vers FastAPI:8000
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_URL=""
RUN npm run build

# ── Stage 2 : Runtime Python (backend + frontend standalone) ─────────────────
FROM python:3.11-slim

# Outils système minimaux + Node.js pour exécuter le serveur Next.js
RUN apt-get update && apt-get install -y --no-install-recommends \
        curl \
        nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Dépendances Python ────────────────────────────────────────────────────────
# PyTorch CPU d'abord (évite le téléchargement de la version CUDA ~3 Go)
RUN pip install --no-cache-dir \
    torch==2.2.2 \
    --index-url https://download.pytorch.org/whl/cpu

# Reste des dépendances backend (sans CUDA)
COPY backend/requirements-hf.txt ./
RUN pip install --no-cache-dir -r requirements-hf.txt

# ── Code source backend ───────────────────────────────────────────────────────
COPY backend/ ./backend/

# ── Téléchargement du PDF depuis GitHub ───────────────────────────────────────
# Le PDF est exclu du push HF Spaces (.hfignore) car HF refuse les binaires.
# Il est hébergé dans les GitHub Releases (binary assets, URL publique directe).
ARG GITHUB_PDF_URL=https://github.com/MManuella/unicef_chatbot/releases/download/v1.0/guide-peda-v6-2.pdf
RUN mkdir -p /app/backend/data/documents && \
    curl -L --retry 3 --fail "$GITHUB_PDF_URL" \
         -o /app/backend/data/documents/guide-peda-v6-2.pdf && \
    echo "PDF téléchargé : $(wc -c < /app/backend/data/documents/guide-peda-v6-2.pdf) octets"

# ── Pré-indexation des documents dans Qdrant (mode fichier local) ─────────────
# Cette étape est exécutée au BUILD, pas au démarrage.
# Le modèle d'embedding (~1,2 Go) est téléchargé ici et baqué dans l'image.
# Les vecteurs sont stockés dans /app/qdrant_data et inclus dans l'image.
ENV QDRANT_LOCAL_PATH=/app/qdrant_data
ENV LLM_PROVIDER=mistral_api
RUN cd /app/backend && python -m app.ingestion.ingest

# ── Frontend Next.js (build standalone) ──────────────────────────────────────
# Structure attendue par le serveur standalone de Next.js :
#   /app/frontend/server.js          ← point d'entrée
#   /app/frontend/.next/static/      ← assets statiques (JS/CSS)
#   /app/frontend/public/            ← fichiers publics
COPY --from=frontend-builder /build/frontend/.next/standalone /app/frontend/
COPY --from=frontend-builder /build/frontend/.next/static     /app/frontend/.next/static
COPY --from=frontend-builder /build/frontend/public           /app/frontend/public

# ── Script de démarrage ───────────────────────────────────────────────────────
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# ── Métadonnées HuggingFace Spaces ───────────────────────────────────────────
# HF Spaces attend le port 7860
EXPOSE 7860

# Variables d'environnement — à surcharger via les Secrets HF Spaces
ENV PYTHONUNBUFFERED=1
ENV NEXT_TELEMETRY_DISABLED=1

CMD ["/app/start.sh"]
