from functools import lru_cache
from app.services.chat_service import ChatService
from app.services.rag_service import RAGService
from app.services.llm_service import LLMService
from app.services.cache_service import CacheService
from app.services.vector_store import VectorStoreService


@lru_cache()  # Crée les services UNE SEULE FOIS puis les réutilise
def get_chat_service() -> ChatService:
    """
    Crée et câble tous les services ensemble.
    
    Le câblage :
    VectorStoreService (Qdrant + Embeddings)
           ↓
    LLMService (Ollama / Mistral 7B)
           ↓
    RAGService (combine VectorStore + LLM)
           ↓
    CacheService (Redis)
           ↓
    ChatService (orchestre tout : guardrails → cache → RAG)
    
    @lru_cache() = les services sont créés 1 seule fois au démarrage,
    puis réutilisés pour chaque requête (pas de gaspillage).
    """
    vector_store = VectorStoreService()
    llm_service = LLMService()
    rag_service = RAGService(vector_store=vector_store, llm_service=llm_service)
    cache_service = CacheService()
    return ChatService(rag_service=rag_service, cache_service=cache_service)
