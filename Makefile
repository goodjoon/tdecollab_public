.PHONY: setup dev dev-backend dev-frontend test

setup:
	pnpm install
	cd backend && python3 -m venv venv && . venv/bin/activate && pip install -r requirements.txt

dev:
	pnpm run dev & make dev-backend & make dev-frontend

dev-backend:
	cd backend && . venv/bin/activate && uvicorn app.main:app --reload --port 8000

dev-frontend:
	cd frontend && pnpm dev
