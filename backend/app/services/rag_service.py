"""
RAG Service — Retrieval-Augmented Generation.

Flux :
  1. Chercher les documents pertinents dans Qdrant
  2. Construire le contexte (chunks filtrés)
  3. Envoyer au LLM avec le system prompt + historique + question
  4. Retourner réponse + sources + disclaimer
"""

import logging
import re

from app.core.prompts import SYSTEM_PROMPT, RAG_PROMPT_TEMPLATE
from app.services.llm_service import LLMService
from app.services.vector_store import VectorStoreService
from app.services.guardrails import is_medical_question, MEDICAL_DISCLAIMER
from app.api.schemas import SourceInfo


def _is_toc_chunk(text: str) -> bool:
    return len(re.findall(r'(?:\. ){3,}|\.{4,}', text)) >= 2


def _clean_excerpt(text: str, max_len: int = 280) -> str:
    lines = text.split('\n')
    clean_lines = [
        l.strip() for l in lines
        if l.strip() and not re.search(r'(?:\. ){3,}|\.{4,}', l)
    ]
    clean = ' '.join(clean_lines).strip() or text.strip()
    if len(clean) <= max_len:
        return clean
    truncated = clean[:max_len]
    last_dot = max(truncated.rfind('. '), truncated.rfind('? '), truncated.rfind('! '))
    if last_dot > max_len // 2:
        return truncated[:last_dot + 1]
    return truncated.rstrip() + '…'


def _build_sources(docs) -> list[SourceInfo]:
    sources: list[SourceInfo] = []
    seen: dict[str, int] = {}
    for doc in docs:
        raw_name = doc.metadata.get("source", "Document inconnu")
        source_name = raw_name.split("/")[-1].split("\\")[-1]
        page = doc.metadata.get("page")
        excerpt = _clean_excerpt(doc.page_content)
        if source_name not in seen:
            seen[source_name] = len(sources)
            sources.append(SourceInfo(document=source_name, page=page, excerpt=excerpt))
        else:
            existing = sources[seen[source_name]]
            if len(excerpt) > len(existing.excerpt or ""):
                sources[seen[source_name]] = SourceInfo(
                    document=source_name,
                    page=page or existing.page,
                    excerpt=excerpt,
                )
    return sources


async def _retrieve(vector_store: VectorStoreService, question: str):
    docs = await vector_store.similarity_search(question)
    return [d for d in docs if not _is_toc_chunk(d.page_content)]


class RAGService:
    def __init__(self, vector_store: VectorStoreService, llm_service: LLMService):
        self.vector_store = vector_store
        self.llm_service = llm_service

    async def query(self, question: str, history: list[dict] | None = None) -> dict:
        try:
            docs = await _retrieve(self.vector_store, question)
            context = "\n\n".join(d.page_content for d in docs)
            sources = _build_sources(docs)
            user_prompt = RAG_PROMPT_TEMPLATE.format(context=context, question=question)
            answer = await self.llm_service.generate(
                user_prompt, system_prompt=SYSTEM_PROMPT, history=history or []
            )
            disclaimer = MEDICAL_DISCLAIMER if is_medical_question(question) else None
            return {"answer": answer, "sources": sources, "disclaimer": disclaimer}
        except Exception as e:
            logging.error(f"[RAGService] Erreur query : {e}", exc_info=True)
            return {
                "answer": "Une erreur est survenue, veuillez réessayer.",
                "sources": [],
                "disclaimer": None,
            }

    async def stream_query(self, question: str, history: list[dict] | None = None):
        docs = await _retrieve(self.vector_store, question)
        context = "\n\n".join(d.page_content for d in docs)
        sources = _build_sources(docs)
        disclaimer = MEDICAL_DISCLAIMER if is_medical_question(question) else None
        user_prompt = RAG_PROMPT_TEMPLATE.format(context=context, question=question)

        async for chunk in self.llm_service.stream(
            user_prompt, system_prompt=SYSTEM_PROMPT, history=history or []
        ):
            yield {"token": chunk, "sources": sources, "disclaimer": disclaimer}
