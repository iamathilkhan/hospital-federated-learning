import threading
from typing import Dict, Any

class GradientCache:
    def __init__(self):
        self._lock = threading.Lock()
        # Structure: {round_id: {node_id: gradient}}
        self._cache: Dict[str, Dict[str, Any]] = {}

    def store_gradient(self, node_id: str, gradient: Any, round_id: str):
        with self._lock:
            if round_id not in self._cache:
                self._cache[round_id] = {}
            self._cache[round_id][node_id] = gradient

    def get_cached(self, round_id: str) -> Dict[str, Any]:
        with self._lock:
            return self._cache.get(round_id, {}).copy()

    def clear_round(self, round_id: str):
        with self._lock:
            if round_id in self._cache:
                del self._cache[round_id]

# Singleton instance for accessibility
_global_cache = GradientCache()

def store_gradient(node_id: str, gradient: Any, round_id: str):
    _global_cache.store_gradient(node_id, gradient, round_id)

def get_cached(round_id: str) -> Dict[str, Any]:
    return _global_cache.get_cached(round_id)
