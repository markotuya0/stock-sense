import json
import os
import sys
from typing import Any

import requests


BANNED_MARKERS = ("mock", "stub", "placeholder")


def contains_marker(data: Any) -> bool:
    serialized = json.dumps(data).lower()
    return any(marker in serialized for marker in BANNED_MARKERS)


def check_endpoint(base_url: str, path: str, token: str) -> tuple[bool, str]:
    response = requests.get(
        f"{base_url.rstrip('/')}{path}",
        headers={"Authorization": f"Bearer {token}"},
        timeout=20,
    )
    response.raise_for_status()
    payload = response.json()
    if contains_marker(payload):
        return False, f"{path} contains banned markers"
    return True, f"{path} ok"


def main() -> int:
    base_url = os.getenv("ZERO_MOCK_BASE_URL", "http://localhost:8000/api/v1")
    token = os.getenv("ZERO_MOCK_TOKEN")
    if not token:
        print("Missing ZERO_MOCK_TOKEN")
        return 1

    endpoints = [
        "/accuracy/",
        "/accuracy/leaderboard",
        "/search/?q=NVDA",
        "/portfolio/",
        "/signals",
    ]

    failed = False
    for endpoint in endpoints:
        try:
            ok, message = check_endpoint(base_url, endpoint, token)
            print(message)
            failed = failed or not ok
        except Exception as exc:
            print(f"{endpoint} failed: {exc}")
            failed = True

    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
