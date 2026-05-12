"""
RAG Service — Retrieval-Augmented Generation.

C'est LE service central. Il fait le lien entre :
- Les documents (via VectorStoreService / Qdrant)
- Le LLM (via LLMService / Ollama)

Flux d'une question :
  1. "Comment prévenir le VIH ?"
  2. → VectorStore cherche les 5 meilleurs morceaux de documents
  3. → On construit le prompt : System + Contexte (documents) + Question
  4. → Le LLM génère la réponse basée sur le contexte
  5. → On retourne : réponse + sources + disclaimer éventuel

SANS le RAG : le LLM invente des réponses (hallucinations)
AVEC le RAG : le LLM se base sur vos documents UNICEF (fiable)
"""

import re

from app.core.prompts import SYSTEM_PROMPT, RAG_PROMPT_TEMPLATE
from app.services.llm_service import LLMService
from app.services.vector_store import VectorStoreService
from app.services.guardrails import is_medical_question, MEDICAL_DISCLAIMER
from app.api.schemas import SourceInfo


def _is_toc_chunk(text: str) -> bool:
    """Détecte un chunk de type table des matières (lignes avec points de suite '. . .')."""
    return len(re.findall(r'(?:\. ){3,}|\.{4,}', text)) >= 2


def _clean_excerpt(text: str, max_len: int = 280) -> str:
    """Retourne un extrait propre coupé à la fin d'une phrase."""
    lines = text.split('\n')
    clean_lines = [
        l.strip() for l in lines
        if l.strip() and not re.search(r'(?:\. ){3,}|\.{4,}', l)
    ]
    clean = ' '.join(clean_lines).strip() or text.strip()
    if len(clean) <= max_len:
        return clean
    # Couper à la dernière phrase complète dans la limite
    truncated = clean[:max_len]
    last_dot = max(truncated.rfind('. '), truncated.rfind('? '), truncated.rfind('! '))
    if last_dot > max_len // 2:
        return truncated[:last_dot + 1]
    return truncated.rstrip() + '…' 


class RAGService:
    def __init__(self, vector_store: VectorStoreService, llm_service: LLMService):
        self.vector_store = vector_store
        self.llm_service = llm_service

    async def query(self, question: str) -> dict:
        """
        Pipeline RAG complet (réponse d'un coup).
        Retourne un dict avec :
        - answer : la réponse du LLM
        - sources : liste des documents utilisés (pour le bouton Sources)
        - disclaimer : avertissement médical (ou None)
        """
        try:
            # Étape 1 : Chercher les documents pertinents dans Qdrant
            docs = await self.vector_store.similarity_search(question)

            # Filtrer les chunks de type table des matières
            docs = [d for d in docs if not _is_toc_chunk(d.page_content)]

            # Étape 2 : Construire le contexte à partir des documents trouvés
            context = "\n\n".join([doc.page_content for doc in docs])

            # Étape 3 : Construire les infos de sources (pour le bouton Sources)
            sources = []
            seen: dict = {}  # source_name -> index dans sources
            for doc in docs:
                raw_name = doc.metadata.get("source", "Document inconnu")
                source_name = raw_name.split("/")[-1].split("\\")[-1]
                page = doc.metadata.get("page")
                excerpt = _clean_excerpt(doc.page_content)
                if source_name not in seen:
                    seen[source_name] = len(sources)
                    sources.append(SourceInfo(
                        document=source_name,
                        page=page,
                        excerpt=excerpt,
                    ))
                else:
                    existing = sources[seen[source_name]]
                    if len(excerpt) > len(existing.excerpt or ""):
                        sources[seen[source_name]] = SourceInfo(
                            document=source_name,
                            page=page or existing.page,
                            excerpt=excerpt,
                        )

            # Étape 4 : Construire le prompt complet
            prompt = (
                f"{SYSTEM_PROMPT}\n\n"
                f"{RAG_PROMPT_TEMPLATE.format(context=context, question=question)}"
            )

            # Étape 5 : Envoyer au LLM et récupérer la réponse
            answer = await self.llm_service.generate(prompt)

            # Étape 6 : Ajouter le disclaimer si c'est une question médicale
            disclaimer = MEDICAL_DISCLAIMER if is_medical_question(question) else None

            return {
                "answer": answer,
                "sources": sources,
                "disclaimer": disclaimer,
            }
        except Exception as e:
            import traceback
            print("[LLM ERROR]", e)
            traceback.print_exc()
            return {
                "answer": f"[ERREUR LLM] {e}",
                "sources": [],
                "disclaimer": None,
            }

    async def stream_query(self, question: str):
        """
        Pipeline RAG en streaming (token par token).
        
        Même chose que query() mais au lieu de retourner la réponse
        d'un coup, on yield chaque token au fur et à mesure.
        
        Retourne: (chunks générateur, sources, disclaimer)
        """
        # Étapes 1-4 identiques
        docs = await self.vector_store.similarity_search(question)
        # Filtrer les chunks de type table des matières
        docs = [d for d in docs if not _is_toc_chunk(d.page_content)]
        context = "\n\n".join([doc.page_content for doc in docs])
        prompt = (
            f"{SYSTEM_PROMPT}\n\n"
            f"{RAG_PROMPT_TEMPLATE.format(context=context, question=question)}"
        )

        # Construire les sources (on les aura besoin à la fin)
        # Pour chaque document, garder la page la plus pertinente (premier chunk trouvé)
        sources = []
        seen: dict = {}  # source_name -> index dans sources
        for doc in docs:
            raw_name = doc.metadata.get("source", "Document inconnu")
            # Nettoyer le nom : garder seulement le nom de fichier sans chemin
            source_name = raw_name.split("/")[-1].split("\\")[-1]
            page = doc.metadata.get("page")
            excerpt = _clean_excerpt(doc.page_content)
            if source_name not in seen:
                seen[source_name] = len(sources)
                sources.append(SourceInfo(
                    document=source_name,
                    page=page,
                    excerpt=excerpt,
                ))
            else:
                # Si un autre chunk du même doc a un meilleur extrait, mettre à jour
                existing = sources[seen[source_name]]
                if len(excerpt) > len(existing.excerpt or ""):
                    sources[seen[source_name]] = SourceInfo(
                        document=source_name,
                        page=page or existing.page,
                        excerpt=excerpt,
                    )

        disclaimer = MEDICAL_DISCLAIMER if is_medical_question(question) else None

        # Étape 5 : Stream les tokens
        async for chunk in self.llm_service.stream(prompt):
            yield {"token": chunk, "sources": sources, "disclaimer": disclaimer}
