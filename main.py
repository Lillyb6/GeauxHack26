"""Vercel entrypoint: one origin for the existing API and built React app.

Local Vite/FastAPI development still uses backend/app/main.py directly.
"""
from fastapi import FastAPI
from backend.app.main import app as simulation_api

app = FastAPI(title="Beyond Earth deployment", docs_url=None, redoc_url=None, openapi_url=None)
app.mount("/api", simulation_api)
# Vercel promotes this built frontend to its CDN. The same declaration also
# serves it locally with `uvicorn main:app` after `npm run build` in frontend.
app.frontend("/", directory="frontend/dist", fallback="index.html", check_dir=False)
