import json
import sys
from pathlib import Path
from urllib import request

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import config


for index, api_key in enumerate(config.NVIDIA_API_KEYS):
    req = request.Request(
        f"{config.NVIDIA_BASE_URL}/models",
        headers={"Authorization": f"Bearer {api_key}"},
        method="GET",
    )
    try:
        with request.urlopen(req, timeout=60) as response:
            data = json.loads(response.read().decode("utf-8"))
        ids = [item.get("id", "") for item in data.get("data", [])]
        matches = [
            model_id for model_id in ids
            if any(token in model_id.lower() for token in ("glm", "deepseek", "minimax", "kimi"))
        ]
        print(f"key {index + 1}: {matches[:40]}")
    except Exception as exc:
        print(f"key {index + 1}: error {exc}")
