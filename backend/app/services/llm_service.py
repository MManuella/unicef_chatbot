"""
LLM Service — Interface multi-provider (Ollama local, Mistral API, HF Inference).

Ce service ne sait rien du RAG ni des documents.
Son seul rôle : envoyer un texte (prompt) au LLM et récupérer la réponse.

Providers supportés (variable LLM_PROVIDER dans .env) :
  - "ollama"       → Ollama local, pour le développement
  - "mistral_api"  → API Mistral.ai (gratuit : 1B tokens/mois), pour la production
  - "hf_inference" → HuggingFace Inference API (alternative gratuite)

2 modes :
- generate() → envoie le prompt, attend la réponse COMPLÈTE, la retourne
- stream()   → envoie le prompt, retourne les tokens UN PAR UN au fur et à mesure
"""

import logging
from app.core.config import settings


class LLMService:
    def __init__(self):
        provider = settings.LLM_PROVIDER.lower()
        try:
            if provider == "mistral_api":
                self._init_mistral_api()
            elif provider == "hf_inference":
                self._init_hf_inference()
            else:
                self._init_ollama()
            logging.info(f"[LLMService] Provider actif : {provider}")
        except Exception as e:
            logging.error(f"[LLMService] Erreur d'initialisation ({provider}) : {e}")
            raise RuntimeError(f"LLM ({provider}) n'a pas pu être initialisé.") from e

    def _init_ollama(self):
        from langchain_ollama import OllamaLLM
        self.llm = OllamaLLM(
            base_url=settings.OLLAMA_BASE_URL,
            model=settings.LLM_MODEL,
            temperature=settings.LLM_TEMPERATURE,
            num_predict=settings.LLM_MAX_TOKENS,
            keep_alive=-1,
        )
        self._is_chat_model = False

    def _init_mistral_api(self):
        from langchain_mistralai import ChatMistralAI
        self.llm = ChatMistralAI(
            model=settings.MISTRAL_MODEL,
            mistral_api_key=settings.MISTRAL_API_KEY,
            temperature=settings.LLM_TEMPERATURE,
            max_tokens=settings.LLM_MAX_TOKENS,
        )
        self._is_chat_model = True

    def _init_hf_inference(self):
        from langchain_huggingface import HuggingFaceEndpoint
        self.llm = HuggingFaceEndpoint(
            repo_id=settings.HF_INFERENCE_MODEL,
            huggingfacehub_api_token=settings.HF_API_KEY,
            temperature=settings.LLM_TEMPERATURE,
            max_new_tokens=settings.LLM_MAX_TOKENS,
        )
        self._is_chat_model = False

    def _extract_text(self, result) -> str:
        """Extrait le texte d'une réponse LLM (str ou AIMessage)."""
        return result.content if hasattr(result, "content") else str(result)

    async def generate(self, prompt: str, system_prompt: str = "") -> str:
        try:
            if self._is_chat_model and system_prompt:
                from langchain_core.messages import SystemMessage, HumanMessage
                messages = [SystemMessage(content=system_prompt), HumanMessage(content=prompt)]
                result = await self.llm.ainvoke(messages)
            else:
                full = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
                result = await self.llm.ainvoke(full)
            return self._extract_text(result)
        except Exception as e:
            logging.error(f"[LLMService] Erreur generate : {e}")
            raise RuntimeError("Erreur lors de l'appel au modèle LLM.") from e

    async def stream(self, prompt: str, system_prompt: str = ""):
        try:
            if self._is_chat_model and system_prompt:
                from langchain_core.messages import SystemMessage, HumanMessage
                messages = [SystemMessage(content=system_prompt), HumanMessage(content=prompt)]
                async for chunk in self.llm.astream(messages):
                    token = self._extract_text(chunk)
                    if token:
                        yield token
            else:
                full = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
                async for chunk in self.llm.astream(full):
                    token = self._extract_text(chunk)
                    if token:
                        yield token
        except Exception as e:
            logging.error(f"[LLMService] Erreur stream : {e}")
            raise RuntimeError("Erreur lors du streaming du modèle LLM.") from e
