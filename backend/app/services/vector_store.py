"""
Vector Store Service — Qdrant + Embeddings (multilingual-e5-small, 384 dims).
"""

from langchain_huggingface import HuggingFaceEmbeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from app.core.config import settings

# Module-level singleton: the embedding model is heavy (~470 MB). Loading it
# once and reusing it across all VectorStoreService instances avoids redundant
# memory usage and repeated warm-up calls.
_embeddings: HuggingFaceEmbeddings | None = None


def _get_embeddings() -> HuggingFaceEmbeddings:
    global _embeddings
    if _embeddings is None:
        _embeddings = HuggingFaceEmbeddings(
            model_name=settings.EMBEDDING_MODEL,
            model_kwargs={"device": "cpu"},
            encode_kwargs={
                "batch_size": 32,
                "normalize_embeddings": True,
            },
        )
        _embeddings.embed_query("init")
    return _embeddings


class VectorStoreService:
    def __init__(self):
        self.embeddings = _get_embeddings()


        # Connexion à Qdrant : mode fichier local (HF Spaces) ou serveur distant (dev)
        if settings.QDRANT_LOCAL_PATH:
            self.client = QdrantClient(path=settings.QDRANT_LOCAL_PATH)
        else:
            self.client = QdrantClient(
                host=settings.QDRANT_HOST,
                port=settings.QDRANT_PORT,
            )

        # L'interface LangChain pour parler à Qdrant
        self.vector_store = QdrantVectorStore(
            client=self.client,
            collection_name=settings.QDRANT_COLLECTION,  # "unicef_documents"
            embedding=self.embeddings,
        )

    async def similarity_search(self, query: str, k: int = None):
        k = k or settings.TOP_K_RESULTS
        results = await self.vector_store.asimilarity_search_with_score(query, k=k)
        # Drop chunks whose cosine similarity is below threshold — prevents
        # injecting irrelevant context that leads the LLM off-topic.
        return [doc for doc, score in results if score >= settings.SIMILARITY_THRESHOLD]
