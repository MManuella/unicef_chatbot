from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import chat, health, topics
from app.core.config import settings

# Création de l'application FastAPI
app = FastAPI(
    title="UNICEF Chatbot API",
    description="API pour le chatbot de conseils UNICEF aux populations",
    version="1.0.0",
)

# ============================================================
# CORS (Cross-Origin Resource Sharing)
# 
# En production (HF Spaces), les appels API passent par le proxy
# Next.js (rewrites), donc le navigateur ne contacte jamais
# directement l'API → CORS non critique en prod.
# En dev, on autorise localhost:3000.
# Si ALLOWED_ORIGINS=["*"], on accepte toutes les origines.
# ============================================================
origins = settings.ALLOWED_ORIGINS
allow_credentials = origins != ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# ENREGISTREMENT DES ROUTES
# ============================================================

app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(topics.router, prefix="/api/topics", tags=["topics"])


# Préchargement du modèle LLM au démarrage
from app.api.dependencies import get_chat_service

@app.on_event("startup")
async def preload_llm():
    service = get_chat_service()
    provider = settings.LLM_PROVIDER.lower()
    # Ollama nécessite un warm-up explicite ; les API externes sont déjà prêtes.
    if provider == "ollama":
        try:
            await service.rag_service.llm_service.llm.ainvoke("init")
            print("[STARTUP] Ollama : modèle préchargé en RAM.")
        except Exception as e:
            print(f"[STARTUP] Avertissement Ollama warm-up : {e}")
    else:
        print(f"[STARTUP] LLM provider '{provider}' prêt (pas de warm-up nécessaire).")
