from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Classe qui charge automatiquement les variables du fichier .env
    et les rend accessibles partout dans le code via: settings.NOM_VARIABLE
    """

    # --- Application ---
    APP_NAME: str = "UNICEF Advisory Chatbot"
    DEBUG: bool = False

    # --- CORS ---
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]

    # --- LLM Provider ---
    # "ollama"       → Ollama local (développement)
    # "mistral_api"  → API Mistral.ai (production / HF Spaces)
    # "hf_inference" → HuggingFace Inference API
    LLM_PROVIDER: str = "ollama"

    # --- Ollama / LLM ---
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    LLM_MODEL: str = "mistral:7b"
    LLM_TEMPERATURE: float = 0.3
    LLM_MAX_TOKENS: int = 1500

    # --- Mistral API (production) ---
    MISTRAL_API_KEY: str = ""
    MISTRAL_MODEL: str = "mistral-small-latest"

    # --- HuggingFace Inference API (alternative) ---
    HF_API_KEY: str = ""
    HF_INFERENCE_MODEL: str = "mistralai/Mistral-7B-Instruct-v0.3"

    # --- Embeddings ---
    # multilingual-e5-small : ~470 Mo, 384 dimensions, multilingue (FR/EN)
    # (multilingual-e5-large était ~2 Go → trop lourd pour HF Spaces free tier)
    EMBEDDING_MODEL: str = "intfloat/multilingual-e5-small"

    # --- Qdrant ---
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_COLLECTION: str = "unicef_documents"
    # Si défini, utilise le mode fichier local au lieu d'un serveur distant
    # (utilisé pour HF Spaces : pas de serveur Qdrant séparé)
    QDRANT_LOCAL_PATH: str = ""

    # --- Redis ---
    REDIS_URL: str = "redis://localhost:6379/0"
    CACHE_TTL: int = 3600  # 1 heure en secondes

    # --- RAG ---
    CHUNK_SIZE: int = 512
    CHUNK_OVERLAP: int = 50
    TOP_K_RESULTS: int = 5

    class Config:
        env_file = ".env"  # Indique à Pydantic de lire le fichier .env


# On crée UNE SEULE instance qu'on importera partout
settings = Settings()
