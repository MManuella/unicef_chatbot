"""
LLM Service — Interface multi-provider (Ollama local, Mistral API, HF Inference).

Providers supportés (LLM_PROVIDER dans .env) :
  - "ollama"       → Ollama local (dev)
  - "mistral_api"  → API Mistral.ai (production)
  - "hf_inference" → HuggingFace Inference API (alternative)

history : list[dict] au format [{"role": "user"|"assistant", "content": "..."}]
  - Chat models (Mistral) : injecté comme messages LangChain (HumanMessage/AIMessage)
  - Non-chat models (Ollama) : préfixé en texte avant le prompt
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
        return result.content if hasattr(result, "content") else str(result)

    def _build_chat_messages(self, prompt: str, system_prompt: str, history: list[dict]):
        from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
        messages = [SystemMessage(content=system_prompt)]
        for msg in history:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "assistant" and msg["content"]:
                messages.append(AIMessage(content=msg["content"]))
        messages.append(HumanMessage(content=prompt))
        return messages

    def _build_text_prompt(self, prompt: str, system_prompt: str, history: list[dict]) -> str:
        parts = []
        if system_prompt:
            parts.append(system_prompt)
        if history:
            lines = []
            for msg in history:
                role = "Utilisateur" if msg["role"] == "user" else "Assistant"
                if msg["content"]:
                    lines.append(f"{role}: {msg['content']}")
            if lines:
                parts.append("Historique de la conversation :\n" + "\n".join(lines))
        parts.append(prompt)
        return "\n\n".join(parts)

    async def generate(self, prompt: str, system_prompt: str = "", history: list[dict] | None = None) -> str:
        try:
            history = history or []
            if self._is_chat_model and system_prompt:
                messages = self._build_chat_messages(prompt, system_prompt, history)
                result = await self.llm.ainvoke(messages)
            else:
                full = self._build_text_prompt(prompt, system_prompt, history)
                result = await self.llm.ainvoke(full)
            return self._extract_text(result)
        except Exception as e:
            logging.error(f"[LLMService] Erreur generate : {e}")
            raise RuntimeError("Erreur lors de l'appel au modèle LLM.") from e

    async def stream(self, prompt: str, system_prompt: str = "", history: list[dict] | None = None):
        try:
            history = history or []
            if self._is_chat_model and system_prompt:
                messages = self._build_chat_messages(prompt, system_prompt, history)
                async for chunk in self.llm.astream(messages):
                    token = self._extract_text(chunk)
                    if token:
                        yield token
            else:
                full = self._build_text_prompt(prompt, system_prompt, history)
                async for chunk in self.llm.astream(full):
                    token = self._extract_text(chunk)
                    if token:
                        yield token
        except Exception as e:
            logging.error(f"[LLMService] Erreur stream : {e}")
            raise RuntimeError("Erreur lors du streaming du modèle LLM.") from e
