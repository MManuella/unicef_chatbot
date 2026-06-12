from pydantic import model_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "UNICEF Advisory Chatbot"
    DEBUG: bool = False

    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:3001"]

    LLM_PROVIDER: str = "ollama"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    LLM_MODEL: str = "mistral:7b"
    LLM_TEMPERATURE: float = 0.3
    LLM_MAX_TOKENS: int = 1500

    MISTRAL_API_KEY: str = ""
    MISTRAL_MODEL: str = "mistral-small-latest"

    HF_API_KEY: str = ""
    HF_INFERENCE_MODEL: str = "mistralai/Mistral-7B-Instruct-v0.3"

    # multilingual-e5-small : ~470 Mo, 384 dimensions, multilingue (FR/EN)
    EMBEDDING_MODEL: str = "intfloat/multilingual-e5-small"

    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_COLLECTION: str = "unicef_documents"
    QDRANT_LOCAL_PATH: str = ""

    REDIS_URL: str = "redis://localhost:6379/0"
    CACHE_TTL: int = 3600

    CHUNK_SIZE: int = 512
    CHUNK_OVERLAP: int = 50
    TOP_K_RESULTS: int = 5
    SIMILARITY_THRESHOLD: float = 0.84

    # SEC-7 : valider les clés API au démarrage selon le provider choisi
    @model_validator(mode="after")
    def validate_api_keys(self):
        if self.LLM_PROVIDER == "mistral_api" and not self.MISTRAL_API_KEY:
            raise ValueError(
                "MISTRAL_API_KEY est requis quand LLM_PROVIDER=mistral_api. "
                "Ajoutez-la dans le fichier .env."
            )
        if self.LLM_PROVIDER == "hf_inference" and not self.HF_API_KEY:
            raise ValueError(
                "HF_API_KEY est requis quand LLM_PROVIDER=hf_inference. "
                "Ajoutez-la dans le fichier .env."
            )
        return self

    class Config:
        env_file = ".env"


settings = Settings()
