# AI-Powered Multi-Agent Inventory Reconciliation System

> Enterprise-grade inventory reconciliation platform powered by LangGraph multi-agent AI, Gemini 2.5 Flash, FastAPI, React, and PostgreSQL — fully containerized with Docker.

## 📁 Project Structure

```
Project/
├── backend/          # FastAPI + SQLAlchemy + LangGraph
├── frontend/         # React + Vite + Tailwind CSS
├── docker-compose.yml
└── .env.example      # Environment variable template
```

## 🚀 Quick Start

```bash
cd Project

# 1. Copy environment template
cp .env.example backend/.env
# Edit backend/.env and add your GEMINI_API_KEY

# 2. Start all services
docker compose up -d

# 3. Access the app
#    Frontend:  http://localhost:80
#    API Docs:  http://localhost:8001/docs
```

**Default login:** `admin` / `Admin@123`

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, Recharts |
| Backend | FastAPI, SQLAlchemy, Pydantic v2, python-jose |
| AI | LangGraph, Google Gemini 2.5 Flash, langchain-google-genai |
| Database | PostgreSQL 15 |
| Reports | ReportLab (PDF generation) |
| Container | Docker, Docker Compose, Nginx |

## 🤖 AI Multi-Agent Pipeline

The reconciliation runs a 4-agent LangGraph pipeline:

1. **Validation Agent** — Data quality assessment
2. **Analysis Agent** — Root cause & risk analysis  
3. **Recommendation Agent** — Prioritized corrective actions
4. **Executive Summary Agent** — C-level PDF report content

## 👥 Role-Based Access Control

| Role | Capabilities |
|---|---|
| `ADMIN` | Full access — users, audit logs, all features |
| `INFRASTRUCTURE_ENGINEER` | Upload, reconcile, generate reports, chatbot |
| `AUDITOR` | View reports, chatbot |
| `READ_ONLY` | Dashboard only |

## 📋 Environment Variables

See `Project/.env.example` for all required variables. Key ones:

```env
GEMINI_API_KEY=your_key_from_aistudio.google.com
JWT_SECRET_KEY=your_secure_random_secret
DATABASE_URL=postgresql://postgres:postgres@db:5432/inventory_db
```

## 📄 License

MIT