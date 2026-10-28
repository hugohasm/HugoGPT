"""Run locally, loading only recognized variables from the ignored backend/.env."""
import os
from pathlib import Path
import sys

root = Path(__file__).resolve().parents[1]
env_file = root / "backend" / ".env"
if env_file.exists():
    for line in env_file.read_text().splitlines():
        key, sep, value = line.partition("=")
        if sep and key in {"OPENAI_API_KEY", "CV_AGENT_API_KEY", "CV_MODEL"}:
            os.environ.setdefault(key, value.strip().strip('"').strip("'"))
sys.path.insert(0, str(root / "backend"))
import uvicorn

if __name__ == "__main__":
    uvicorn.run("cv_app:app", host="127.0.0.1", port=int(os.getenv("PORT", "8000")))
