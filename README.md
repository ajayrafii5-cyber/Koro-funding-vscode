# 🏦 Koro Funding — Full Stack Prop Firm Platform

> Enterprise-grade Forex Prop Firm platform. Run locally in under 5 minutes.

---

## 📁 Project Structure

```
koro-funding/
├── frontend/          # Next.js 14 — Website + Client Dashboard
├── backend/           # Node.js + Express — REST API + Webhooks
├── risk-engine/       # Background service — Breach detection
├── shared/            # Shared types & utilities
├── docker-compose.yml # Full stack with Postgres + Redis
└── README.md
```

---

## ⚡ Quick Start (5 menit)

### Option A — Tanpa Docker (Recommended untuk development)

**Step 1: Install dependencies**
```bash
# Frontend
cd frontend && npm install

# Backend
cd ../backend && npm install

# Risk Engine
cd ../risk-engine && npm install
```

**Step 2: Setup environment**
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

**Step 3: Setup database (butuh PostgreSQL lokal)**
```bash
cd backend
npx prisma migrate dev --name init
npx prisma db seed
```

**Step 4: Run semua service**

Buka 3 terminal di VSCode:

```bash
# Terminal 1 — Frontend
cd frontend && npm run dev        # → http://localhost:3000

# Terminal 2 — Backend API
cd backend && npm run dev         # → http://localhost:4000

# Terminal 3 — Risk Engine
cd risk-engine && npm run dev     # Background service
```

---

### Option B — Docker (Semua sekaligus, tidak perlu install Postgres/Redis)

```bash
docker-compose up -d
docker-compose logs -f
```

---

## 🌐 URLs

| Service | URL |
|---------|-----|
| Homepage | http://localhost:3000 |
| Dashboard | http://localhost:3000/dashboard |
| Challenge | http://localhost:3000/challenge |
| Legal | http://localhost:3000/legal |
| API | http://localhost:4000 |
| API Docs | http://localhost:4000/api-docs |

## 🔑 Demo Login (setelah seed)

| Role | Email | Password |
|------|-------|----------|
| Trader | trader@demo.com | Demo1234! |
| Admin | admin@korofunding.com | Admin1234! |
