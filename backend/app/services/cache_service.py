"""
Cache Service — Stocke les réponses fréquentes (Redis ou mémoire).

Pourquoi un cache ?
- Le LLM met 5-10 secondes pour répondre
- Si 50 personnes posent "Comment prévenir le VIH ?", 
  on génère la réponse 1 fois puis on la sert du cache 49 fois
- Le cache a un TTL (Time To Live) : après 1h, la réponse expire
  et sera re-générée (pour rester à jour)

Fallback automatique :
  Si Redis n'est pas disponible (HF Spaces free tier, dev sans Docker),
  on utilise un dict Python en mémoire. Les données sont perdues au redémarrage
  mais c'est suffisant pour les démonstrations.

Flux :
  Question → cache.get(clé) → trouvé ? → retour immédiat (< 1ms)
                              → pas trouvé ? → LLM génère → cache.set(clé, réponse)
"""

import logging
from collections import OrderedDict
import redis.asyncio as redis
from app.core.config import settings

_MEMORY_MAX_ENTRIES = 256


class CacheService:
    def __init__(self):
        self._redis: redis.Redis | None = None
        # Bounded LRU dict: prevents unbounded RAM growth when Redis is down.
        self._memory: OrderedDict[str, str] = OrderedDict()
        try:
            self._redis = redis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=2,
            )
            logging.info("[CacheService] Cache Redis activé.")
        except Exception:
            logging.warning("[CacheService] Redis indisponible — fallback mémoire.")

    async def get(self, key: str) -> str | None:
        """
        Récupère une valeur du cache.
        Retourne None si la clé n'existe pas ou a expiré.
        """
        if self._redis:
            try:
                return await self._redis.get(key)
            except Exception:
                pass
        value = self._memory.get(key)
        if value is not None:
            self._memory.move_to_end(key)
        return value

    async def set(self, key: str, value: str, ttl: int = None) -> None:
        """
        Stocke une valeur dans le cache avec un TTL (durée de vie).
        Par défaut TTL = 3600 secondes (1 heure).
        Après cette durée, la valeur est automatiquement supprimée.
        """
        ttl = ttl or settings.CACHE_TTL
        if self._redis:
            try:
                await self._redis.set(key, value, ex=ttl)
                return
            except Exception:
                pass
        self._memory[key] = value
        self._memory.move_to_end(key)
        if len(self._memory) > _MEMORY_MAX_ENTRIES:
            self._memory.popitem(last=False)

    async def delete(self, key: str) -> None:
        """Supprime une valeur du cache (utile pour forcer un refresh)."""
        if self._redis:
            try:
                await self._redis.delete(key)
                return
            except Exception:
                pass
        self._memory.pop(key, None)
