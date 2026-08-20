# Vercel Deployment Guide

## Services Configured for Vercel

### ✅ Suitable for Vercel

- **casuya-design-system** - Component library docs
- **casuya-docs** - Documentation site
- **casuya-editor** - Frontend editor (if Vite-based)
- **casuya-runtime** - Client-side runtime
- **casuya-platform** - Frontend (already configured)

### ⚠️ Backend Services (Limited Vercel Support)

- **casuya-api** - API gateway (needs Vercel Functions)
- **casuya-auth** - Authentication (needs database)
- **casuya-analytics** - Analytics (needs database)

### ❌ Not Suitable for Vercel

- **casuya-ai** - Needs GPU, long-running processes
- **casuya-bridge** - Needs persistent connections
- **casuya-content** - Needs database, file storage
- **casuya-core** - Backend services
- **casuya-exams** - Needs database, stateful sessions
- **casuya-math** - Computational backend
- **casuya-media** - File storage, processing
- **casuya-notifications** - Needs message queues
- **casuya-payments** - Needs secure payment processing
- **casuya-search** - Needs database, indexing
- **casuya-services-bridge** - Persistent connections

## Deployment Steps

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Deploy Each Service

```bash
# Deploy design system docs
cd casuya-design-system
vercel

# Deploy main docs
cd ../casuya-docs
vercel

# Deploy platform frontend
cd ../casuya-platform
vercel

# Deploy editor
cd ../casuya-editor
vercel

# Deploy runtime
cd ../casuya-runtime
vercel
```

### 4. Configure Environment Variables

In Vercel dashboard, add these for each service:

- `DATABASE_URL` (for backend services)
- `REDIS_URL` (for backend services)
- `API_BASE_URL` (for frontend services)
- `JWT_SECRET` (for auth services)

## Limitations

### Vercel Functions Limitations

- Max execution time: 60 seconds (Hobby), 900 seconds (Pro)
- No persistent file storage
- No WebSocket support
- Limited database connection pooling

### Recommended Architecture

- **Frontend:** Vercel (casuya-platform, docs, design-system)
- **Backend:** VPS/Docker (api, auth, payments, etc.)
- **Database:** Managed PostgreSQL (Render, Railway, AWS RDS)
- **Storage:** CDN + Object Storage (AWS S3, Cloudflare R2)

## Alternative: Full Vercel Deployment

To deploy backend services on Vercel, you need to:

1. Convert to serverless functions
2. Use managed databases (Neon, Supabase)
3. Implement connection pooling
4. Handle stateless operations
5. Use Vercel KV for Redis alternative

## Hybrid Approach (Recommended)

**Deploy on Vercel:**

- casuya-platform (frontend)
- casuya-design-system (docs)
- casuya-docs (documentation)
- casuya-editor (if frontend-only)
- casuya-runtime (if frontend-only)

**Deploy on VPS/Docker:**

- casuya-api (backend API)
- casuya-auth (authentication)
- casuya-payments (payments)
- casuya-bridge (service bridge)
- Other backend services

This gives you the best of both worlds: fast frontend deployment on Vercel and reliable backend services on traditional hosting.
