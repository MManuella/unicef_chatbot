import logging
import time
from collections import defaultdict
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.routes import chat, health, topics
from app.core.config import settings


# ── Rate limiting (SEC-6) ─────────────────────────────────────────────────────
class RateLimitMiddleware(BaseHTTPMiddleware):
    """20 requêtes/min par IP sur les endpoints /api/chat."""

    def __init__(self, app, max_requests: int = 20, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._counts: dict[str, list[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next) -> Response:
        if not request.url.path.startswith("/api/chat"):
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        cutoff = now - self.window_seconds

        self._counts[client_ip] = [t for t in self._counts[client_ip] if t > cutoff]
        if len(self._counts[client_ip]) >= self.max_requests:
            return Response(
                content='{"detail":"Trop de requêtes. Réessayez dans quelques instants."}',
                status_code=429,
                media_type="application/json",
            )
        self._counts[client_ip].append(now)
        return await call_next(request)


# ── Lifespan ───────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    import asyncio
    from app.api.dependencies import get_chat_service
    svc = get_chat_service()
    if settings.LLM_PROVIDER.lower() == "ollama":
        try:
            await asyncio.wait_for(
                svc.rag_service.llm_service.llm.ainvoke("init"),
                timeout=30.0,
            )
            logging.info("[STARTUP] Ollama : modèle préchargé en RAM.")
        except asyncio.TimeoutError:
            logging.warning("[STARTUP] Ollama warm-up timeout (30s) — le modèle chargera à la première requête.")
        except Exception as e:
            logging.warning("[STARTUP] Ollama warm-up ignoré : %s", e)
    else:
        logging.info("[STARTUP] Provider '%s' prêt.", settings.LLM_PROVIDER)
    yield


# ── Application ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="UNICEF Chatbot API",
    description="API pour le chatbot de conseils UNICEF aux populations",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS (SEC-4) ───────────────────────────────────────────────────────────────
origins = settings.ALLOWED_ORIGINS
# credentials + wildcard est interdit par la spec CORS
allow_credentials = "*" not in origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=allow_credentials,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)

app.add_middleware(RateLimitMiddleware)

# ── Routes ─────────────────────────────────────────────────────────────────────
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(topics.router, prefix="/api/topics", tags=["topics"])
