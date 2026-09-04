# Paint Shop Painter Management Platform

A **multi-tenant SaaS** platform for managing paint shop operations, painter onboarding, work scheduling, job tracking, and billing.

The project is structured as a clean monorepo with an independent **Frontend** and **Backend**.

---

## Architecture Overview

```
paint/
├── frontend/             # Next.js 16 (App Router, Tailwind CSS v4)
│   ├── app/              # App router pages & layouts
│   ├── components/       # Shared UI components
│   ├── lib/              # Frontend utilities (API client, helpers)
│   └── package.json
│
├── backend/              # Standalone Node.js + Express + Mongoose API
│   ├── src/
│   │   ├── config/       # MongoDB & Cloudinary configuration
│   │   ├── controllers/  # API business logic
│   │   ├── middleware/   # JWT authentication & tenant checks
│   │   ├── models/       # Multi-tenant Mongoose models
│   │   └── routes/       # Express route handlers
│   ├── server.js         # Backend entry point
│   └── package.json
│
├── README.md
└── .gitignore
```

---

## Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secrets
npm run dev
```

Backend will run on `http://localhost:5000` (Health check: `GET http://localhost:5000/api/health`).

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm run dev
```

Frontend will run on `http://localhost:3000`.

---

## Deployment Strategy

- **Backend**: Deploy as a Web Service on **Render** (`Root Directory: backend`, `Build Command: npm install`, `Start Command: npm start`).
- **Frontend**: Deploy on **Vercel** or Render Static/Node (`Root Directory: frontend`).
