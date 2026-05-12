"""
Chat Service — L'orchestrateur principal.

C'est le point d'entrée unique pour traiter une question.
Il coordonne tous les autres services dans cet ordre :

  Question de l'utilisateur
       │
       ▼
  1. GUARDRAILS — La question est-elle autorisée ?
       │ Non → réponse de refus immédiate
       │ Oui ↓
  2. CACHE — On a déjà répondu à cette question ?
       │ Oui → retour instantané depuis Redis
       │ Non ↓
  3. RAG — Chercher docs + générer réponse avec le LLM
       │
       ▼
  4. CACHE — Stocker la réponse dans Redis pour la prochaine fois
       │
       ▼
  Réponse au frontend (avec sources + disclaimer)
"""

import hashlib
import json
import uuid

from app.services.rag_service import RAGService
from app.services.cache_service import CacheService
from app.services.guardrails import check_guardrails
from app.api.schemas import ChatResponse, SourceInfo


class ChatService:
    def __init__(self, rag_service: RAGService, cache_service: CacheService):
        self.rag_service = rag_service
        self.cache_service = cache_service

    async def get_response(
        self, question: str, conversation_id: str | None = None
    ) -> ChatResponse:
        """Traite une question et retourne la réponse complète."""

        # Générer un ID de conversation si pas fourni
        if not conversation_id:
            conversation_id = str(uuid.uuid4())

        # ── Étape 1 : Guardrails ──
        guardrail_result = check_guardrails(question)
        if guardrail_result:
            # Question hors-scope → refus poli, on ne va pas plus loin
            return ChatResponse(
                answer=guardrail_result,
                sources=[],
                conversation_id=conversation_id,
            )

        # ── Étape 2 : Cache ──
        cache_key = self._build_cache_key(question)
        cached = await self.cache_service.get(cache_key)
        if cached:
            print("[CACHE] Réponse trouvée dans Redis pour la question :", question)
            # Réponse trouvée dans le cache → retour instantané
            data = json.loads(cached)
            data["conversation_id"] = conversation_id
            # Reconstruire les SourceInfo depuis le cache
            data["sources"] = [SourceInfo(**s) for s in data.get("sources", [])]
            return ChatResponse(**data)

        # ── Étape 3 : RAG (recherche docs + LLM) ──
        print("[LLM] Génération de la réponse via RAG/LLM pour la question :", question)
        result = await self.rag_service.query(question)

        response = ChatResponse(
            answer=result["answer"],
            sources=result["sources"],
            conversation_id=conversation_id,
            disclaimer=result.get("disclaimer"),
        )

        # ── Étape 4 : Mettre en cache ──
        cache_data = {
            "answer": response.answer,
            "sources": [s.model_dump() for s in response.sources],
            "disclaimer": response.disclaimer,
        }
        await self.cache_service.set(cache_key, json.dumps(cache_data))

        return response

    async def stream_response(
        self, question: str, conversation_id: str | None = None
    ):
        """Traite une question et retourne la réponse en streaming SSE."""

        if not conversation_id:
            conversation_id = str(uuid.uuid4())

        # ── Étape 1 : Guardrails ──
        guardrail_result = check_guardrails(question)
        if guardrail_result:
            yield f"data: {json.dumps({'token': guardrail_result, 'done': True})}\n\n"
            return

        # ── Étape 2 : Streaming RAG ──
        sources_data = None
        disclaimer_data = None
        async for chunk_data in self.rag_service.stream_query(question):
            # chunk_data = {"token": "...", "sources": [...], "disclaimer": "..."}
            token = chunk_data["token"]
            sources_data = chunk_data.get("sources", [])
            disclaimer_data = chunk_data.get("disclaimer")
            yield f"data: {json.dumps({'token': token, 'done': False})}\n\n"

        # ── Signal de fin avec sources ──
        sources_json = [s.model_dump() for s in (sources_data or [])]
        yield f"data: {json.dumps({'token': '', 'done': True, 'sources': sources_json, 'disclaimer': disclaimer_data})}\n\n"

    @staticmethod
    def _build_cache_key(question: str) -> str:
        """
        Crée une clé de cache à partir de la question.
        
        On normalise la question (minuscule, sans espaces en trop)
        puis on la hash avec SHA-256 pour avoir une clé fixe.
        
        "Comment prévenir le VIH ?" → "chat:a1b2c3d4..."
        "comment prévenir le vih ?" → même hash (normalisée)
        """
        normalized = question.strip().lower()
        return f"chat:{hashlib.sha256(normalized.encode()).hexdigest()}"
