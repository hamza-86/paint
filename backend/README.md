# Paint Shop Painter Management Platform — Backend API

Standalone Express.js REST API backend for the Paint Shop Painter Management Platform.  
This service is **deployed independently** on [Render](https://render.com) and consumed by the Next.js frontend via HTTP.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ESM) |
| Framework | Express.js v4 |
| Database | MongoDB via Mongoose v9 |
| Auth *(Phase 2)* | JWT (jsonwebtoken) |
| File Storage *(Phase 2)* | Cloudinary v2 |
| CORS | Configurable via `FRONTEND_URL` env var |
| Dev Tooling | nodemon |

---

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js            # Mongoose connection (exits on failure)
│   │   └── cloudinary.js    # Cloudinary SDK config placeholder
│   ├── middleware/
│   │   └── auth.js          # JWT auth middleware placeholder (Phase 2)
│   ├── models/              # Mongoose models (Phase 2)
│   ├── routes/              # Express routers (Phase 2)
│   ├── controllers/         # Route handler functions (Phase 2)
│   └── app.js               # Express app: CORS, body parser, routes, error handler
├── server.js                # Entry point: loads .env, connects DB, starts server
├── .env.example             # Environment variable template
├── .gitignore
└── package.json
```

---

## Getting Started

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your real credentials:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/paintshop
JWT_SECRET=<generate a strong secret — see below>
CLOUDINARY_CLOUD_NAME=<your cloud name>
CLOUDINARY_API_KEY=<your api key>
CLOUDINARY_API_SECRET=<your api secret>
FRONTEND_URL=http://localhost:3000
```

> **Generate a strong JWT secret:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### 3. Run the Development Server

```bash
npm run dev
```

nodemon will watch `/src` and `server.js` and restart on every save.

### 4. Verify the Server is Running

```bash
curl http://localhost:5000/api/health
# → { "status": "ok", "service": "Paint Shop Painter Management API", "timestamp": "..." }
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with nodemon (hot-reload) |
| `npm run start` | Start production server (`node server.js`) |

---

## Deploying to Render

1. Push this `backend/` folder to a Git repository (or use the monorepo root).
2. Create a new **Web Service** on Render.
3. Set **Root Directory** to `backend` (if using the monorepo).
4. Set **Build Command**: `npm install`
5. Set **Start Command**: `npm start`
6. Add all environment variables from `.env.example` in the Render dashboard.
7. Set `FRONTEND_URL` to your deployed Next.js URL (e.g. `https://your-app.vercel.app`).

> **Important:** Render sets `PORT` automatically — do not hardcode it.

---

## Environment Variables Reference

| Variable | Description |
|---|---|
| `PORT` | Port to listen on (Render sets this automatically) |
| `NODE_ENV` | `development` or `production` |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret for signing/verifying JWTs |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `FRONTEND_URL` | Frontend origin allowed by CORS |

---

## Roadmap

- **Phase 1 — Scaffold** *(current)*: Express setup, folder structure, config stubs
- **Phase 2 — Data Layer**: Mongoose models (User, Shop, Painter, Job)
- **Phase 3 — Auth**: JWT login/register routes, token refresh, role middleware
- **Phase 4 — Business Routes**: Shop management, painter CRUD, job assignment APIs
- **Phase 5 — File Uploads**: Cloudinary integration for painter photos, job images
