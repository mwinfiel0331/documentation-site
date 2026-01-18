# Next Business Idea POC - Quick Reference

## 📦 Project Structure Summary

```
next-business-idea-poc/
├── apps/web/                    # Next.js 14 + React + Tailwind
├── packages/
│   ├── core/                    # Domain logic (types, scoring, catalog)
│   └── integrations/            # Service adapters (mocks + interfaces)
├── docs/                        # 6 production-grade design docs
├── .github/workflows/           # GitHub Actions CI/CD
└── README.md                    # Main overview
```

---

## 🚀 Getting Started (< 10 minutes)

```bash
# 1. Install
pnpm install

# 2. Run dev server
pnpm dev

# 3. Open http://localhost:3000

# 4. (Optional) Run tests
pnpm test                # Unit tests
pnpm test:e2e           # E2E tests (requires dev running)
pnpm type-check         # TypeScript checking
```

---

## 📚 Key Files to Understand

### Core Domain Logic

| File | Purpose | Key Exports |
|------|---------|------------|
| `packages/core/src/types.ts` | All domain models | `UserInputs`, `Idea`, `IdeaScore`, factories |
| `packages/core/src/ideaCatalog.ts` | 30+ idea templates | `getIdeaCatalog()`, `filterIdeas()` |
| `packages/core/src/scoring.ts` | Scoring algorithm | `scoreIdea()`, `scoreIdeas()` |

### Service Integrations

| File | Purpose | Key Classes |
|------|---------|------------|
| `packages/integrations/src/interfaces.ts` | Integration contracts | `IdeaGenerator`, `ScoringService`, `IdeaRepository` |
| `packages/integrations/src/mocks.ts` | Mock implementations | `MockIdeaGenerator`, `MockScoringService`, `MockIdeaRepository` |

### Web Application

| File | Purpose |
|------|---------|
| `apps/web/src/app/page.tsx` | Home page (loads IdeaGenerator component) |
| `apps/web/src/components/IdeaGenerator.tsx` | Main component orchestrating flow |
| `apps/web/src/components/IdeaCard.tsx` | Individual idea display + scoring |
| `apps/web/src/app/api/ideas/generate/route.ts` | Idea generation endpoint |
| `apps/web/src/app/api/ideas/save/route.ts` | Save idea endpoint |
| `apps/web/src/app/api/ideas/saved/route.ts` | Retrieve saved ideas endpoint |

### Documentation

| File | When to Read | Contains |
|------|--------------|----------|
| `docs/00-requirements.md` | Functional specs | User flows, requirements, success criteria |
| `docs/01-architecture.md` | System design | Data flows, real integration examples, scaling |
| `docs/02-api-spec.md` | API usage | Endpoint specs, request/response models |
| `docs/03-data-model.md` | Data structure | Entity schemas, validation, scoring rules |
| `docs/04-testing.md` | Testing approach | Unit test examples, E2E strategies |
| `docs/05-deployment.md` | Going to prod | Setup, deployment, monitoring, scaling |

---

## 🎯 User Flow

```
1. User lands on /
2. Fills profile form (location, interests, budget, hours, type, risk)
3. Clicks "Generate Ideas"
   ↓
   POST /api/ideas/generate
   ├─ IdeaGenerator.generateIdeas() → 10 Idea objects
   ├─ ScoringService.scoreIdeas() → IdeaScore for each
   └─ Returns combined IdeaWithScore[]
4. Client displays 10 ranked ideas (sorted by overallScore DESC)
5. User can:
   - Click "Show Details" on each idea → expand to see more
   - Click "Save" → POST /api/ideas/save → stored in repository
   - Click "Load Saved Ideas" → GET /api/ideas/saved → display saved list
```

---

## 🧠 Scoring Explained

### Quick Version

Each idea gets 4 dimension scores (0-100):
- **Demand**: Does the user want this? (0-100, higher better)
- **Competition**: How crowded is this market? (0-100, lower better)
- **Feasibility**: Can the user execute this? (0-100, higher better)
- **Profitability**: Will they make money? (0-100, higher better)

**Overall Score** = 0.35×demand + 0.20×(100−competition) + 0.25×feasibility + 0.20×profitability

### Detailed Rules

See `docs/03-data-model.md` "Scoring Rules" section for:
- Demand score calculation (interest matching, why-now signals)
- Competition score (category saturation map)
- Feasibility score (budget alignment, time availability, complexity)
- Profitability score (startup cost, category margins)

---

## 🔌 Real Integrations (Upgrade Path)

All three core services have mock implementations. Replace with real:

### 1. Replace IdeaGenerator (LLM)

**Mock**: `MockIdeaGenerator` uses static catalog

**Real Option**: OpenAI ChatGPT
```typescript
// packages/integrations/src/real/openai-generator.ts
export class OpenAIIdeaGenerator implements IdeaGenerator {
  async generateIdeas(userInputs: UserInputs): Promise<Idea[]> {
    // Call OpenAI API, parse JSON response
  }
}

// Set in API route if env var present:
const generator = process.env.OPENAI_API_KEY
  ? new OpenAIIdeaGenerator(process.env.OPENAI_API_KEY)
  : getIdeaGenerator();
```

See `docs/01-architecture.md` section "6.1 Replace IdeaGenerator (LLM)" for full examples.

### 2. Replace ScoringService (ML Model)

**Mock**: `MockScoringService` uses hardcoded rules

**Real Option**: ML model endpoint (SageMaker, local FastAPI, etc.)
```typescript
// packages/integrations/src/real/ml-scoring-service.ts
export class MLScoringService implements ScoringService {
  async scoreIdea(idea: Idea, userInputs: UserInputs): Promise<IdeaScore> {
    const response = await fetch(process.env.ML_ENDPOINT_URL, {
      method: 'POST',
      body: JSON.stringify({ idea, userInputs }),
    });
    // Parse predictions → IdeaScore
  }
}
```

### 3. Replace IdeaRepository (Database)

**Mock**: `MockIdeaRepository` uses in-memory Map (data lost on restart)

**Real Option**: PostgreSQL via Prisma
```bash
pnpm add @prisma/client
npx prisma init
# Set DATABASE_URL=postgresql://...
npx prisma migrate dev
```

```typescript
// packages/integrations/src/real/prisma-repository.ts
export class PrismaRepository implements IdeaRepository {
  async save(idea: Idea, score: IdeaScore): Promise<void> {
    await this.prisma.savedIdea.create({
      data: { ideaId: idea.id, ideaData: JSON.stringify(idea), ... }
    });
  }
}
```

See `docs/05-deployment.md` "Database Migrations" section for full setup.

---

## 🧪 Testing Commands

```bash
# Unit tests (Vitest) - fast, in-process
pnpm test

# Type checking
pnpm type-check

# E2E tests (Playwright) - real browser
pnpm dev &                # Start dev server first
pnpm test:e2e             # Run tests

# Watch mode
pnpm test -- --watch

# Coverage
pnpm test -- --coverage
```

### Test Files

- `packages/core/src/__tests__/` - Scoring, catalog, types
- `apps/web/src/__tests__/e2e/` - User flows

---

## 📊 API Endpoints (Quick Reference)

### Generate Ideas

```bash
curl -X POST http://localhost:3000/api/ideas/generate \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"city": "Austin", "state": "TX"},
    "interests": ["marketing"],
    "budget": "MEDIUM",
    "hoursPerWeek": 20,
    "businessType": "DIGITAL",
    "riskTolerance": "MEDIUM"
  }'
```

Returns 10 ideas with scores, sorted by overall score descending.

### Save Idea

```bash
curl -X POST http://localhost:3000/api/ideas/save \
  -H "Content-Type: application/json" \
  -d '{"ideaId": "uuid-1234"}'
```

### Get Saved Ideas

```bash
curl http://localhost:3000/api/ideas/saved
```

See `docs/02-api-spec.md` for full specs.

---

## 🌍 Environment Variables

Create `.env.local` (or `.env.local.example` provided):

```bash
# No env vars needed for POC! All defaults use mocks.

# Optional: Enable real services
OPENAI_API_KEY=sk-...         # Enable LLM
DATABASE_URL=file:./dev.db    # Enable DB
ML_ENDPOINT_URL=http://...    # Enable ML scoring
```

---

## 📈 Idea Catalog

30+ templates built into code at `packages/core/src/ideaCatalog.ts`.

Categories:
- **Service**: Social media, bookkeeping, pet sitting, coaching, organizing, etc.
- **Product**: Dropshipping, candles, merchandise, handmade goods, etc.
- **Digital**: Courses, templates, SaaS, AI bots, newsletters, YouTube, etc.

All automatically filtered by user's:
- Business type preference (SERVICE/PRODUCT/DIGITAL)
- Interest tags
- Budget constraints
- Time availability
- Risk tolerance

Filtering happens in `filterIdeas()` → scoring applied → returned sorted.

---

## 🚢 Deployment

### Local Development

```bash
pnpm install
pnpm dev
# http://localhost:3000
```

### Vercel (Production)

```bash
# Push to GitHub
git push

# In Vercel dashboard:
# - Import repo
# - Root: apps/web
# - Build: pnpm -r build
# - Env vars: OPENAI_API_KEY, DATABASE_URL, etc.
# - Deploy
```

### Self-Hosted (Docker)

```bash
docker build -t next-business-idea .
docker run -p 3000:3000 next-business-idea
```

See `docs/05-deployment.md` for detailed setup.

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 3000 in use | `lsof -i :3000` then `kill -9 <PID>` or `pnpm dev -- -p 3001` |
| Dependencies fail | `rm -rf node_modules pnpm-lock.yaml && pnpm install` |
| Build errors | `pnpm type-check` to find TS errors |
| Tests fail | Run `pnpm test -- --reporter=verbose` for details |

---

## 📖 Doc Navigation

```
Want to...                          → Read...
────────────────────────────────────────────────────────
Understand requirements            → docs/00-requirements.md
Learn system architecture          → docs/01-architecture.md
Use API endpoints                  → docs/02-api-spec.md
Understand data model/scoring      → docs/03-data-model.md
Write tests                        → docs/04-testing.md
Deploy to production               → docs/05-deployment.md
Integrate real LLM/ML/DB           → docs/01-architecture.md (section 6)
```

---

## ✅ Success Criteria

- [ ] `pnpm install` completes (dependency resolution)
- [ ] `pnpm dev` starts dev server on :3000
- [ ] Page loads with form
- [ ] Form submission generates 10 ideas in <5s
- [ ] Ideas display with scores (0-100)
- [ ] Ideas are ranked (highest overall score first)
- [ ] Each idea shows top 3 reasons for score
- [ ] "Show Details" expands to reveal full idea
- [ ] "Save" button persists idea (in memory or DB)
- [ ] "Load Saved Ideas" retrieves saved list
- [ ] `pnpm test` passes all unit tests
- [ ] `pnpm type-check` finds zero TypeScript errors
- [ ] Documentation explains how to add real integrations

---

## 🎓 Next Steps

After POC validation:

1. **Integrate Real LLM**: Replace `MockIdeaGenerator` with OpenAI/Claude API (see docs/01-architecture.md)
2. **Add Database**: Replace `MockIdeaRepository` with PostgreSQL + Prisma (see docs/05-deployment.md)
3. **Improve Scoring**: Integrate ML model endpoint (see docs/01-architecture.md)
4. **Add Authentication**: Use NextAuth for user accounts (optional)
5. **Scale**: Deploy to Vercel or self-hosted with CDN (see docs/05-deployment.md)

---

## 📞 Questions?

- **Architecture questions**: See `docs/01-architecture.md`
- **Scoring logic**: See `docs/03-data-model.md` "Scoring Rules"
- **Real integrations**: See `docs/01-architecture.md` section 6
- **Deployment**: See `docs/05-deployment.md`
- **Testing**: See `docs/04-testing.md`

---

**Happy building! 🚀**

