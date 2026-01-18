# Architecture & Design Document

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Next Business Idea POC                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐          ┌──────────────────────────────┐ │
│  │   Next.js Web    │          │   Core Package (Domain)      │ │
│  │   (apps/web)     │◄────────►│ - Types & Models             │ │
│  │                  │          │ - Idea Catalog (30+ ideas)   │ │
│  │ - Pages          │          │ - Scoring Logic              │ │
│  │ - Components     │          │ - Deterministic Rules        │ │
│  │ - API Routes     │          └──────────────────────────────┘ │
│  └──────────────────┘                    ▲                       │
│         │                                 │                       │
│         │                    ┌────────────┴─────────────────┐    │
│         │                    │                              │    │
│         └──────────────────►│  Integrations Package         │    │
│                             │  - IdeaGenerator (interface)  │    │
│                             │  - ScoringService (interface) │    │
│                             │  - IdeaRepository (interface) │    │
│                             │                              │    │
│                             │  Mock Implementations:        │    │
│                             │  - MockIdeaGenerator ✓        │    │
│                             │  - MockScoringService ✓       │    │
│                             │  - MockIdeaRepository ✓       │    │
│                             │                              │    │
│                             │  [Real Integrations Below]    │    │
│                             └──────────────────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Directory Structure

```
next-business-idea-poc/
├── apps/
│   └── web/                       # Next.js app (React Server Components)
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.tsx      # Root layout
│       │   │   ├── page.tsx        # Home page
│       │   │   ├── globals.css     # Global styles (Tailwind)
│       │   │   └── api/
│       │   │       └── ideas/
│       │   │           ├── generate/route.ts     # POST /api/ideas/generate
│       │   │           ├── save/route.ts         # POST /api/ideas/save
│       │   │           └── saved/route.ts        # GET /api/ideas/saved
│       │   └── components/
│       │       ├── IdeaGenerator.tsx
│       │       ├── UserProfileForm.tsx
│       │       ├── IdeasList.tsx
│       │       ├── IdeaCard.tsx
│       │       └── SavedIdeasSection.tsx
│       ├── package.json
│       ├── tsconfig.json
│       ├── next.config.js
│       ├── tailwind.config.js
│       └── postcss.config.js
│
├── packages/
│   ├── core/                      # Domain logic (pure TypeScript)
│   │   ├── src/
│   │   │   ├── types.ts           # All domain models
│   │   │   ├── ideaCatalog.ts     # 30+ idea templates + filtering
│   │   │   ├── scoring.ts         # Scoring algorithm
│   │   │   ├── index.ts           # Public exports
│   │   │   └── __tests__/         # Unit tests
│   │   │       ├── types.test.ts
│   │   │       ├── ideaCatalog.test.ts
│   │   │       └── scoring.test.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── integrations/               # Integration adapters
│       ├── src/
│       │   ├── interfaces.ts       # Integration contracts
│       │   ├── mocks.ts            # Mock implementations
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── docs/
│   ├── 00-requirements.md          # Functional & non-functional requirements
│   ├── 01-architecture.md          # This file
│   ├── 02-api-spec.md              # API endpoint specs
│   ├── 03-data-model.md            # Entity schemas & relationships
│   ├── 04-testing.md               # Testing strategy & examples
│   └── 05-deployment.md            # Production deployment guide
│
├── .github/
│   └── workflows/
│       └── ci.yml                  # GitHub Actions CI/CD
│
├── .gitignore
├── .prettierrc.json
├── pnpm-workspace.yaml
├── package.json
└── README.md                        # Quick start & overview
```

## 3. Data Flow

### Idea Generation Flow

```
User Input (UserInputs)
    ↓
[POST /api/ideas/generate]
    ↓
IdeaGenerator.generateIdeas(userInputs)
    ├─ filterIdeas() from catalog by businessType + interests
    ├─ Personalize with localization
    └─ Return 10 Idea objects
    ↓
ScoringService.scoreIdeas(ideas, userInputs)
    ├─ scoreIdea() for each:
    │   ├─ calculateDemandScore()
    │   ├─ calculateCompetitionScore()
    │   ├─ calculateFeasibilityScore()
    │   ├─ calculateProfitabilityScore()
    │   ├─ Blend into overallScore
    │   └─ Generate 3 reasons
    └─ Return IdeaScore[] 
    ↓
Combine Idea + IdeaScore = IdeaWithScore[]
    ↓
Return JSON response to client
    ↓
Client displays IdeasList (sorted by score)
```

### Save Idea Flow

```
User clicks "Save" on an idea
    ↓
[POST /api/ideas/save { ideaId }]
    ↓
IdeaRepository.save(idea, score)
    └─ MockIdeaRepository.store.set(id, { idea, score })
    ↓
Response: { success: true, idea: IdeaWithScore }
    ↓
UI: Save button changes to "✓ Saved" or shows toast
```

### Retrieve Saved Ideas Flow

```
User clicks "Load Saved Ideas"
    ↓
[GET /api/ideas/saved]
    ↓
IdeaRepository.findAll()
    └─ MockIdeaRepository.store.values()
    ↓
Return JSON: { ideas: IdeaWithScore[] }
    ↓
Client displays SavedIdeasSection (grid layout)
```

## 4. Key Design Decisions

### 4.1 Monorepo with pnpm Workspaces

**Why**:

* Share types across packages without duplication
* Independent builds and testing
* Single tsconfig base that can be extended

**Trade-offs**:

* More complex setup than single-package
* Better for teams and scaling

### 4.2 Packages vs Apps

**Core Package** (@next-business-idea/core)

* Pure TypeScript, no dependencies on web frameworks
* Contains all domain logic and business rules
* Can be used by CLI, backend, mobile, etc.

**Integrations Package** (@next-business-idea/integrations)

* Defines interfaces for all external services
* Provides mock implementations
* Can have real implementations plugged in

**Web App** (apps/web)

* Only orchestrates components and API routes
* Consumes core + integrations
* Thin layer, no business logic

### 4.3 Deterministic Scoring

**Why**:

* Makes tests stable and predictable
* No need for seeding ML models
* Perfect for POC to verify logic

**Rules**:

* Demand: tag matching + why-now signals + location bonus
* Competition: category saturation assumptions (hardcoded map)
* Feasibility: budget alignment + hours available + complexity
* Profitability: startup cost + category margins

**See docs/04-testing.md for examples**

### 4.4 Idea Catalog (Not LLM)

**Why**:

* No API costs or latency
* Deterministic results for testing
* Easy to iterate on ideas

**How to Replace with LLM** (docs/01-architecture.md):

* Replace `MockIdeaGenerator` with `LLMIdeaGenerator`
* Use OpenAI API, Claude, or local LLM
* See integrations/src/interfaces.ts for contract

### 4.5 Mock Repository (Not DB)

**Why**:

* No database setup needed
* Works out of the box
* Clear interface for real DB later

**How to Upgrade** (docs/05-deployment.md):

* Replace `MockIdeaRepository` with `PrismaRepository`
* Initialize SQLite locally, Postgres in production
* See integrations/src/interfaces.ts for contract

## 5. Technology Choices

| Layer | Technology | Why |
|-------|-----------|-----|
| Language | TypeScript | Type safety, catches errors early |
| Frontend Framework | Next.js 14 (App Router) | Server components, built-in API routes, zero config |
| Styling | Tailwind CSS | Utility-first, fast, minimal CSS |
| Monorepo | pnpm workspaces | Fast, strict, npm-compatible |
| Testing | Vitest + Playwright | Fast unit tests, real browser E2E |
| Database | Mock (SQLite ready) | Fast local development, easy upgrade path |
| Build | tsc + Next.js | TypeScript native, no Webpack overhead |

## 6. Real Integration Points

### 6.1 Replace IdeaGenerator (LLM)

**Current**: `MockIdeaGenerator` uses static catalog

**Real Option 1**: OpenAI (ChatGPT)

```typescript
// packages/integrations/src/real/llm-idea-generator.ts
export class OpenAIIdeaGenerator implements IdeaGenerator {
  constructor(private apiKey: string) {}

  async generateIdeas(userInputs: UserInputs, count: number = 10): Promise<Idea[]> {
    const prompt = `Generate ${count} business ideas for: ${JSON.stringify(userInputs)}`;
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const json = await response.json();
    // Parse response and return Idea[]
  }
}

// In apps/web/src/app/api/ideas/generate/route.ts:
// const generator = process.env.OPENAI_API_KEY
//   ? new OpenAIIdeaGenerator(process.env.OPENAI_API_KEY)
//   : getIdeaGenerator();
```

**Real Option 2**: Anthropic Claude

```typescript
export class ClaudeIdeaGenerator implements IdeaGenerator {
  async generateIdeas(userInputs: UserInputs, count: number = 10): Promise<Idea[]> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': this.apiKey },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    // Parse and return Idea[]
  }
}
```

### 6.2 Replace ScoringService (ML Model)

**Current**: `MockScoringService` uses hardcoded rules

**Real Option 1**: SageMaker Endpoint

```typescript
export class SageMakerScoringService implements ScoringService {
  async scoreIdea(idea: Idea, userInputs: UserInputs): Promise<IdeaScore> {
    const response = await fetch(process.env.SAGEMAKER_ENDPOINT_URL, {
      method: 'POST',
      body: JSON.stringify({ idea, userInputs }),
    });
    const predictions = await response.json();
    return createIdeaScore(idea.id, predictions);
  }
}
```

**Real Option 2**: Local Python + FastAPI

```typescript
export class PythonScoringService implements ScoringService {
  async scoreIdea(idea: Idea, userInputs: UserInputs): Promise<IdeaScore> {
    const response = await fetch('http://localhost:5000/score', {
      method: 'POST',
      body: JSON.stringify({ idea, userInputs }),
    });
    const predictions = await response.json();
    return createIdeaScore(idea.id, predictions);
  }
}
```

### 6.3 Replace IdeaRepository (Database)

**Current**: `MockIdeaRepository` uses in-memory Map

**Real Option 1**: Prisma + SQLite (Local) or PostgreSQL (Production)

```typescript
// packages/integrations/src/real/prisma-repository.ts
import { PrismaClient } from '@prisma/client';

export class PrismaIdeaRepository implements IdeaRepository {
  constructor(private prisma: PrismaClient) {}

  async save(idea: Idea, score: IdeaScore): Promise<void> {
    await this.prisma.savedIdea.create({
      data: {
        ideaId: idea.id,
        ideaData: JSON.stringify(idea),
        scoreData: JSON.stringify(score),
      },
    });
  }

  async findAll(limit?: number): Promise<Array<{ idea: Idea; score: IdeaScore }>> {
    const records = await this.prisma.savedIdea.findMany({ take: limit });
    return records.map((r) => ({
      idea: JSON.parse(r.ideaData),
      score: JSON.parse(r.scoreData),
    }));
  }
}

// Schema in prisma/schema.prisma:
// model SavedIdea {
//   id        String    @id @default(cuid())
//   ideaId    String
//   ideaData  String
//   scoreData String
//   createdAt DateTime  @default(now())
// }
```

**Real Option 2**: Firebase/Firestore

```typescript
export class FirestoreRepository implements IdeaRepository {
  constructor(private db: Firestore) {}

  async save(idea: Idea, score: IdeaScore): Promise<void> {
    await this.db.collection('savedIdeas').doc(idea.id).set({
      idea,
      score,
      createdAt: new Date(),
    });
  }
}
```

## 7. Environment-Based Integration Selection

```typescript
// apps/web/src/lib/integrations.ts
import { 
  getIdeaGenerator, 
  getScoringService, 
  getIdeaRepository,
  setIdeaGenerator,
  setScoringService,
  setIdeaRepository
} from '@next-business-idea/integrations';

// Optional: inject real implementations if env vars present
if (process.env.OPENAI_API_KEY) {
  setIdeaGenerator(new OpenAIIdeaGenerator(process.env.OPENAI_API_KEY));
}

if (process.env.ML_ENDPOINT_URL) {
  setScoringService(new MLScoringService(process.env.ML_ENDPOINT_URL));
}

if (process.env.DATABASE_URL) {
  const prisma = new PrismaClient();
  setIdeaRepository(new PrismaIdeaRepository(prisma));
}

export { getIdeaGenerator, getScoringService, getIdeaRepository };
```

## 8. Security Considerations

1. **API Keys**: Store in `.env.local`, never in code
2. **Input Validation**: Validate UserInputs in API routes
3. **Rate Limiting**: Add later with middleware
4. **CORS**: Configure for production domain
5. **CSP**: Add Content Security Policy headers

## 9. Performance Targets

* Idea generation: \&lt;2s (200ms mock + 100ms per idea)
* Scoring: \&lt;100ms per idea (deterministic)
* Saved ideas retrieval: \&lt;500ms
* Page load: \&lt;1s (Next.js optimized)
* Core bundle: \&lt;50KB

## 10. Monitoring & Observability

Future additions:

* Sentry for error tracking
* Vercel Analytics for performance
* CloudWatch for production logs
* Custom dashboard for idea trends

***

See other documentation files:

* [API Specification](02-api-spec.md)
* [Data Model](03-data-model.md)
* [Testing Strategy](04-testing.md)
* [Deployment Guide](05-deployment.md)
