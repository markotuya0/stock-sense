import structlog
from typing import Any, Dict, List

log = structlog.get_logger()


class NairametricsSource:
    source_name = "NAIRAMETRICS"

    def fetch_headlines(self) -> List[Dict[str, Any]]:
        """
        Placeholder source for NGX news/sentiment ingestion.
        Can be replaced with RSS ingestion or a publisher API integration.
        """
        log.info("Nairametrics source not configured yet; returning empty headline list")
        return []
