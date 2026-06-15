from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()


@router.get("/health")
async def health_check():
    return {
        "status": "ok",
        "llm_provider": settings.LLM_PROVIDER,
        "llm_model": settings.MISTRAL_MODEL if settings.LLM_PROVIDER == "mistral_api" else settings.LLM_MODEL,
        "similarity_threshold": settings.SIMILARITY_THRESHOLD,
        "min_relevance_score": settings.MIN_RELEVANCE_SCORE,
    }
