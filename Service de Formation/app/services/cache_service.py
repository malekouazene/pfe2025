from redis import Redis
from redis.exceptions import RedisError
from app.core.config import settings
import pickle
from functools import wraps
import hashlib
import cachetools
from typing import Optional, Callable, Any
import logging

# Configuration du logger
logger = logging.getLogger(__name__)

# Cache mémoire local (fallback)
local_cache = cachetools.TTLCache(maxsize=1000, ttl=settings.CACHE_TTL)

class CacheService:
    def __init__(self):
        """Initialise le service de cache avec Redis et un cache local de fallback"""
        self.redis_enabled = settings.REDIS_ENABLED
        self.redis = None
        
        if self.redis_enabled:
            try:
                self.redis = Redis.from_url(
                    settings.REDIS_URL,
                    socket_connect_timeout=2,  # 2 secondes de timeout
                    socket_timeout=2,
                    retry_on_timeout=True,
                    decode_responses=False
                )
                # Test de connexion
                self.redis.ping()
                logger.info("Connected to Redis successfully")
            except RedisError as e:
                self.redis_enabled = False
                logger.warning(f"Failed to connect to Redis: {str(e)}. Falling back to local cache only.")
    
    def _make_key(self, func: Callable, *args, **kwargs) -> str:
        """
        Génère une clé de cache unique basée sur:
        - le module de la fonction
        - le nom de la fonction
        - les arguments passés
        """
        args_str = pickle.dumps(args) + pickle.dumps(kwargs)
        return f"{func.__module__}:{func.__name__}:{hashlib.md5(args_str).hexdigest()}"
    
    def cached(self, ttl: Optional[int] = None) -> Callable:
        """
        Décorateur pour mettre en cache le résultat d'une fonction
        
        Args:
            ttl: Time To Live en secondes (None pour utiliser la valeur par défaut)
        
        Returns:
            Un décorateur qui gère le caching
        """
        def decorator(func: Callable) -> Callable:
            @wraps(func)
            def wrapper(*args, **kwargs) -> Any:
                key = self._make_key(func, *args, **kwargs)
                
                # 1. Essayer Redis si activé
                if self.redis_enabled:
                    try:
                        cached = self.redis.get(key)
                        if cached is not None:
                            logger.debug(f"Cache hit (Redis) for key: {key}")
                            return pickle.loads(cached)
                    except RedisError as e:
                        logger.warning(f"Redis error for key {key}: {str(e)}")
                
                # 2. Essayer le cache local
                if key in local_cache:
                    logger.debug(f"Cache hit (local) for key: {key}")
                    return local_cache[key]
                
                # 3. Cache miss - exécuter la fonction
                logger.debug(f"Cache miss for key: {key}")
                result = func(*args, **kwargs)
                
                # 4. Mettre à jour les caches
                # 4.1 Mise à jour Redis
                if self.redis_enabled:
                    try:
                        self.redis.setex(
                            key,
                            ttl if ttl is not None else settings.CACHE_TTL,
                            pickle.dumps(result)
                        )
                    except RedisError as e:
                        logger.warning(f"Failed to update Redis cache for key {key}: {str(e)}")
                
                # 4.2 Mise à jour cache local
                local_cache[key] = result
                
                return result
            return wrapper
        return decorator

# Instance singleton du service de cache
cache_service = CacheService()