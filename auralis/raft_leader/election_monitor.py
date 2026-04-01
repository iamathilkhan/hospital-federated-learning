import asyncio
import time
import logging
from typing import List, Optional

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger("ElectionMonitor")

class ElectionMonitor:
    def __init__(self, self_addr: str, partners: List[str], timeout_ms: int = 1500):
        self.self_addr = self_addr
        self.partners = partners
        self.timeout_ms = timeout_ms / 1000.0  # Convert to seconds
        self.last_leader: Optional[str] = None
        self._running = False

    async def watch(self, node_instance):
        """
        Monitors the leader status of the provided SyncObj node instance.
        """
        self._running = True
        logger.info(f"Starting monitor on {self.self_addr} for cluster {self.partners}")
        
        while self._running:
            try:
                current_leader = node_instance.get_leader()
                
                if current_leader != self.last_leader:
                    if current_leader is None:
                        logger.warning(f"[{time.time()}] Leader timeout detected! No leader currently available.")
                    else:
                        logger.info(f"[{time.time()}] Election event: New leader elected -> {current_leader}")
                    
                    self.last_leader = current_leader
                
                await asyncio.sleep(0.1) # Check frequently
            except Exception as e:
                logger.error(f"Monitor error: {e}")
                await asyncio.sleep(1)

    def stop(self):
        self._running = False

def start_monitor(node_instance, self_addr: str, partners: List[str], timeout_ms: int = 1500):
    monitor = ElectionMonitor(self_addr, partners, timeout_ms)
    asyncio.create_task(monitor.watch(node_instance))
    return monitor
