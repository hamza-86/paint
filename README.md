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
# Set BACKEND_API_URL=https://paint-shop-backend-xgjz.onrender.com/api
npm run dev
```

Frontend will run on `http://localhost:3000`.

For a deployed frontend, set the server-only `BACKEND_API_URL` environment
variable to `https://paint-shop-backend-xgjz.onrender.com/api`. Browser requests
continue to use the Next.js BFF at `/api/backend/*`.

---

## Deployment Strategy

- **Backend**: Deploy as a Web Service on **Render** (`Root Directory: backend`, `Build Command: npm install`, `Start Command: npm start`).
- **Frontend**: Deploy on **Vercel** or Render Static/Node (`Root Directory: frontend`).

### Production Environment Variables

Set this server-only variable in Vercel for the frontend:

| Variable | Purpose | Secret |
|---|---|---|
| `BACKEND_API_URL` | Render API base URL used by the Next.js BFF | No |

Set these variables in Render for the backend:

| Variable | Purpose | Secret |
|---|---|---|
| `NODE_ENV` | Set to `production` | No |
| `PORT` | Render-provided HTTP port | No |
| `MONGODB_URI` | Production MongoDB Atlas connection string | Yes |
| `JWT_SECRET` | Signs and verifies authentication tokens | Yes |
| `JWT_EXPIRES_IN` | JWT lifetime, such as `1d` | No |
| `JWT_COOKIE_EXPIRES_DAYS` | Authentication cookie lifetime | No |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account name | No |
| `CLOUDINARY_API_KEY` | Cloudinary upload API key | Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary upload secret | Yes |
| `FRONTEND_URL` | Deployed Vercel origin allowed by CORS | No |
| `RESEND_API_KEY` | Resend HTTPS API key for OTP email | Yes |
| `EMAIL_FROM` | Verified OTP sender identity | No |

The browser calls `/api/backend/*`; it never calls the Render URL directly.
Do not add backend secrets or `NEXT_PUBLIC_` backend URLs to Vercel.
