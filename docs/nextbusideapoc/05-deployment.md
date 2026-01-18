# Deployment Guide

## Local Development Setup

### Prerequisites

* Node.js 18+ (LTS recommended)
* pnpm 8.0+

### Quick Start (5 minutes)

```bash
# 1. Clone and install
git clone <repo>
cd next-business-idea-poc
pnpm install

# 2. Run development server
pnpm dev

# 3. Open browser
open http://localhost:3000
```

**Expected Output**:

```
> next-business-idea-poc dev

  ▲ Next.js 14.0.4
  - Local:        http://localhost:3000

✓ Ready in 2s
```

***

## Development Environment

### .env.local (Create in repo root)

```bash
# No configuration needed for POC
# All defaults use mock implementations

# Optional: Real integrations (see Architecture doc)
# OPENAI_API_KEY=sk-...
# DATABASE_URL=file:./dev.db
# ML_ENDPOINT_URL=http://localhost:5000
```

### Seed Data

Idea catalog is embedded in code (`packages/core/src/ideaCatalog.ts`). No database seeding needed.

### Database (Optional for Production)

For now, ideas are stored in memory and lost on restart. To persist locally:

```bash
# 1. Install Prisma
pnpm add -D prisma @prisma/client

# 2. Initialize
npx prisma init

# 3. Set DATABASE_URL in .env
DATABASE_URL="file:./dev.db"

# 4. Run migrations
npx prisma migrate dev --name init

# 5. Open Prisma Studio
npx prisma studio
```

***

## Building for Production

### Single-Command Build

```bash
pnpm build
```

**What it does**:

1. Builds all packages in dependency order
2. Exports type definitions
3. Builds Next.js with optimizations
4. Output in `apps/web/.next/`

### Build Size Analysis

```bash
cd apps/web
next build --analyze
```

**Expected bundle size**: \&lt;100KB (excluding node\_modules)

***

## Production Deployment Options

### Option 1: Vercel (Recommended for Next.js)

**Pros**: Automatic deployments, built-in CDN, edge functions

**Steps**:

```bash
# 1. Push to GitHub
git push origin main

# 2. Connect in Vercel dashboard
# - Import repo from GitHub
# - Set root directory: `apps/web`
# - Build command: `pnpm -r build`
# - Install command: `pnpm install`

# 3. Set environment variables
# OPENAI_API_KEY=sk-...
# DATABASE_URL=postgresql://...

# 4. Deploy
vercel deploy --prod
```

**Cost**: Free tier up to 100K requests/month

### Option 2: Railway

**Pros**: Simple, pay-as-you-go, PostgreSQL included

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Connect project
railway link

# 3. Add PostgreSQL
railway add postgres

# 4. Deploy
railway up
```

### Option 3: Docker + Self-Hosted

**Dockerfile**:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy monorepo files
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY package.json ./
COPY packages ./packages
COPY apps ./apps

# Install
RUN npm install -g pnpm
RUN pnpm install --prod

# Build
RUN pnpm -r build

# Run
EXPOSE 3000
CMD ["node", "apps/web/.next/standalone/server.js"]
```

**Build & run**:

```bash
docker build -t next-business-idea .
docker run -p 3000:3000 next-business-idea
```

***

## Production Configuration

### Environment Variables

```bash
# Backend API
NEXT_PUBLIC_API_URL=https://api.example.com

# Real integrations (optional)
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://user:pass@host:5432/db
ML_ENDPOINT_URL=https://ml-api.example.com

# Monitoring (optional)
SENTRY_DSN=https://...
ANALYTICS_TOKEN=...

# Security
NEXTAUTH_SECRET=...  # If adding auth later
NEXTAUTH_URL=https://example.com
```

### Performance Optimization

**Next.js Config** (`apps/web/next.config.js`):

```javascript
module.exports = {
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  
  // Image optimization
  images: {
    domains: ['cdn.example.com'],
  },
  
  // API routes caching
  headers: [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=60' },
      ],
    },
  ],
};
```

### Security Headers

**middleware.ts**:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  );

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|favicon.ico).*)'],
};
```

***

## Monitoring & Logging

### Sentry (Error Tracking)

```typescript
// apps/web/src/sentry.server.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### Custom Logging

```typescript
// apps/web/src/lib/logger.ts
export function logRequest(endpoint: string, duration: number, status: number) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    endpoint,
    durationMs: duration,
    status,
  }));
}
```

***

## Scaling Strategy

### Phase 1: MVP (Current - POC)

* Single Next.js server
* In-memory repository
* Mock integrations
* \&lt;100 users/day

### Phase 2: Beta (with Real Services)

* Upgrade to PostgreSQL
* Integrate OpenAI API for idea generation
* Add ML scoring model
* Authentication with NextAuth
* \~1,000 users/day

### Phase 3: Production

* CDN (Cloudflare)
* Database replication
* Redis caching layer
* Separate API service
* Monitoring & alerting
* 10K+ users/day

### Caching Strategy

**In-memory**:

```typescript
const ideasCache = new Map<string, Idea[]>();

// In /api/ideas/generate
const cacheKey = JSON.stringify(userInputs);
if (ideasCache.has(cacheKey)) {
  return ideasCache.get(cacheKey);
}
```

**Redis**:

```typescript
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

const cached = await redis.get(`ideas:${userId}`);
if (cached) return JSON.parse(cached);

// Generate, then cache
await redis.setex(`ideas:${userId}`, 3600, JSON.stringify(ideas));
```

***

## Database Migrations

### Prisma Workflow

```bash
# 1. Create migration
npx prisma migrate dev --name add_user_table

# 2. Review generated SQL
cat prisma/migrations/*/migration.sql

# 3. Deploy to production
npx prisma migrate deploy

# 4. Verify
npx prisma db seed
```

### Database Backup

```bash
# PostgreSQL
pg_dump -h localhost -U user dbname > backup.sql

# Restore
psql -h localhost -U user dbname < backup.sql

# SQLite
cp dev.db dev.db.backup
```

***

## CI/CD Pipeline

### GitHub Actions Workflow

File: `.github/workflows/ci.yml`

```yaml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm -r type-check
      - run: pnpm -r test
      - run: pnpm -r build

  e2e:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm -r build
      - run: pnpm test:e2e

  deploy:
    needs: [test, e2e]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: curl -X POST ${{ secrets.VERCEL_WEBHOOK }}
```

***

## Troubleshooting

### Port 3000 Already in Use

```bash
# Find process
lsof -i :3000

# Kill it
kill -9 <PID>

# Or use different port
pnpm dev -- -p 3001
```

### Dependencies Not Installing

```bash
# Clear cache
rm -rf node_modules pnpm-lock.yaml

# Reinstall
pnpm install

# Verify
pnpm -r type-check
```

### Build Failures

```bash
# Clean build
rm -rf apps/web/.next packages/*/dist

# Rebuild
pnpm build

# Check for TypeScript errors
pnpm type-check
```

### API Errors

```bash
# Enable debug logging
DEBUG=* pnpm dev

# Check API response
curl http://localhost:3000/api/ideas/generate \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"location":{"city":"Austin","state":"TX"},"interests":["tech"],"budget":"MEDIUM","hoursPerWeek":20,"businessType":"SERVICE","riskTolerance":"MEDIUM"}'
```

***

## Performance Benchmarks

### Local (Development)

```
Metric                  Target    Current
─────────────────────────────────────
Idea Generation        <2s       ~300ms
Scoring                <1s/idea  ~100ms
Page Load              <1s       ~400ms
Bundle Size            <100KB    ~45KB
```

### Production (Vercel)

```
Metric                  Target    
─────────────────────────────────
Idea Generation        <2s (API)
First Contentful Paint <1.5s
Cumulative Layout Shift <0.1
Core Web Vitals        All Green
```

***

## Rollback Strategy

### If Deployment Fails

```bash
# Vercel
vercel rollback

# Self-hosted
docker run -p 3000:3000 next-business-idea:previous-tag
```

### Data Integrity

* Always backup database before deployment
* Use migrations with `-- transaction` for safety
* Test migrations in staging first

***

## Maintenance

### Regular Tasks

* \[ ] Monitor error rates (Sentry)
* \[ ] Review performance metrics weekly
* \[ ] Update dependencies monthly
* \[ ] Run security scan (`npm audit`)
* \[ ] Backup database daily
* \[ ] Review user feedback and feature requests

### Dependency Updates

```bash
pnpm update --interactive

# Or
pnpm up

# Check for breaking changes
pnpm outdated
```

***

See [Architecture Guide](01-architecture.md) for integration options and upgrade paths.
