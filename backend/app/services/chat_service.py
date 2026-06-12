"""
Chat Service — Orchestrateur principal.

Flux :
  Question → Guardrails → Cache → RAG+LLM → Cache write → Réponse
"""

import hashlib
import json
import logging
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
        self,
        question: str,
        conversation_id: str | None = None,
        history: list[dict] | None = None,
    ) -> ChatResponse:
        if not conversation_id:
            conversation_id = str(uuid.uuid4())

        guardrail_result = check_guardrails(question)
        if guardrail_result:
            return ChatResponse(answer=guardrail_result, sources=[], conversation_id=conversation_id)

        cache_key = self._build_cache_key(question)
        cached = await self.cache_service.get(cache_key)
        if cached:
            logging.debug("[CACHE] Hit pour : %s", question[:60])
            data = json.loads(cached)
            data["conversation_id"] = conversation_id
            data["sources"] = [SourceInfo(**s) for s in data.get("sources", [])]
            return ChatResponse(**data)

        logging.info("[LLM] Appel RAG pour : %s", question[:60])
        result = await self.rag_service.query(question, history=history or [])

        response = ChatResponse(
            answer=result["answer"],
            sources=result["sources"],
            conversation_id=conversation_id,
            disclaimer=result.get("disclaimer"),
        )

        cache_data = {
            "answer": response.answer,
            "sources": [s.model_dump() for s in response.sources],
            "disclaimer": response.disclaimer,
        }
        await self.cache_service.set(cache_key, json.dumps(cache_data))
        return response

    async def stream_response(
        self,
        question: str,
        conversation_id: str | None = None,
        history: list[dict] | None = None,
    ):
        if not conversation_id:
            conversation_id = str(uuid.uuid4())

        guardrail_result = check_guardrails(question)
        if guardrail_result:
            yield f"data: {json.dumps({'token': guardrail_result, 'done': True})}\n\n"
            return

        # Vérifier le cache — si hit, streamer la réponse en un seul chunk
        cache_key = self._build_cache_key(question)
        cached = await self.cache_service.get(cache_key)
        if cached:
            logging.debug("[CACHE] Hit streaming pour : %s", question[:60])
            data = json.loads(cached)
            yield f"data: {json.dumps({'token': data['answer'], 'done': False})}\n\n"
            yield f"data: {json.dumps({'token': '', 'done': True, 'sources': data.get('sources', []), 'disclaimer': data.get('disclaimer')})}\n\n"
            return

        logging.info("[LLM] Stream RAG pour : %s", question[:60])
        sources_data = None
        disclaimer_data = None
        accumulated = ""

        async for chunk_data in self.rag_service.stream_query(question, history=history or []):
            token = chunk_data["token"]
            sources_data = chunk_data.get("sources", [])
            disclaimer_data = chunk_data.get("disclaimer")
            accumulated += token
            yield f"data: {json.dumps({'token': token, 'done': False})}\n\n"

        sources_json = [s.model_dump() for s in (sources_data or [])]
        yield f"data: {json.dumps({'token': '', 'done': True, 'sources': sources_json, 'disclaimer': disclaimer_data})}\n\n"

        # Mettre en cache pour les prochaines fois
        if accumulated:
            cache_data = {
                "answer": accumulated,
                "sources": sources_json,
                "disclaimer": disclaimer_data,
            }
            await self.cache_service.set(cache_key, json.dumps(cache_data))

    @staticmethod
    def _build_cache_key(question: str) -> str:
        normalized = question.strip().lower()
        return f"chat:{hashlib.sha256(normalized.encode()).hexdigest()}"
