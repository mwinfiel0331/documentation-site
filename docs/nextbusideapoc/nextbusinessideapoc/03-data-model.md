# Data Model & Schema

## Entity Relationship Diagram

```
┌──────────────────┐
│      Idea        │
├──────────────────┤
│ id (PK)          │
│ title            │
│ summary          │
│ targetCustomer   │
│ stepsToStart[]   │
│ costRange{}      │
│ complexity       │
│ localViability   │
│ tags[]           │
│ whyNowSignals[]  │
│ createdAt        │
└──────────────────┘
        │
        │ 1:1
        │
┌──────────────────┐
│   IdeaScore      │
├──────────────────┤
│ ideaId (FK)      │
│ demandScore      │
│ competitionScore │
│ feasibilityScore │
│ profitabilityScore│
│ overallScore     │
│ reasons[]        │
└──────────────────┘
```

---

## Domain Models

### Idea

The core business idea entity.

```typescript
interface Idea {
  // Identity
  id: string;                    // UUID v4, generated at creation
  createdAt: Date;               // ISO 8601 timestamp

  // Core Content
  title: string;                 // Max 100 chars, e.g., "Pet Sitting"
  summary: string;               // Max 500 chars, brief overview
  targetCustomer: string;        // Max 200 chars, who should buy?
  
  // Actionable
  stepsToStart: string[];        // 3-8 steps, each &lt;100 chars
  
  // Economics
  costRange: {
    min: number;                 // Minimum startup cost in USD
    max: number;                 // Maximum startup cost in USD
    currency: "USD";             // Always "USD" for POC
  };
  
  // Feasibility
  complexity: "LOW" | "MEDIUM" | "HIGH";
  
  // Localization
  localViabilityNotes: string;   // Max 300 chars, location-specific insights
  
  // Classification
  tags: string[];                // 2-5 tags, lowercase, hyphenated
  whyNowSignals: string[];       // 2-4 reasons this is timely
}
```

**Validation Rules**:
- `title`: required, 10-100 chars
- `summary`: required, 50-500 chars
- `targetCustomer`: required, 20-200 chars
- `stepsToStart`: required, 3-8 items, each 10-100 chars
- `costRange.min`: required, 0-100000
- `costRange.max`: required, must be > min
- `complexity`: required, one of enum
- `localViabilityNotes`: required, 20-300 chars
- `tags`: required, 2-5 items, must be in predefined list
- `whyNowSignals`: required, 2-4 items, each 10-100 chars

**Example**:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2024-01-17T10:30:00Z",
  "title": "Social Media Management for Local Businesses",
  "summary": "Create and manage social media content for 5-10 local SMBs, handling posting, engagement, and strategy.",
  "targetCustomer": "Small restaurants, salons, plumbers, local services (10-50 employees, <$1M revenue)",
  "stepsToStart": [
    "Master Instagram, TikTok, LinkedIn content strategy",
    "Create 5 sample content calendars for different industries",
    "Network with 20+ local business owners through Chamber of Commerce",
    "Land first 3 clients at $500/month rate"
  ],
  "costRange": {
    "min": 200,
    "max": 1000,
    "currency": "USD"
  },
  "complexity": "LOW",
  "localViabilityNotes": "Highly local-focused ideal for Austin face-to-face B2B relationships. High SMB density in tech and hospitality sectors.",
  "tags": ["marketing", "service", "local", "social-media"],
  "whyNowSignals": [
    "SMBs increasingly recognize need for social presence",
    "Influencer economy and creator trends growing",
    "Social platforms hunger for content and favor agencies"
  ]
}
```

---

### IdeaScore

Scoring result for an idea against a user's profile.

```typescript
interface IdeaScore {
  // Identity
  ideaId: string;                // References Idea.id
  
  // Dimension Scores (0-100)
  demandScore: number;           // Market demand + user interest alignment
  competitionScore: number;      // Market saturation (lower is better)
  feasibilityScore: number;      // User's ability to execute (higher is better)
  profitabilityScore: number;    // Profit margin potential (higher is better)
  
  // Composite
  overallScore: number;          // Weighted blend of above
  
  // Explainability
  reasons: [string, string, string];  // Exactly 3 top reasons
}
```

**Scoring Rules**:

#### Demand Score (0-100)

Measures market demand + alignment with user interests.

**Rules**:
- Base: 50
- +10 per matching interest tag (max +50) → range 50-100
- +10 if ≥2 why-now signals
- +5 location bonus
- Cap: 100

**Example**:
- User interests: ["marketing", "design"]
- Idea tags: ["marketing", "service", "local"]
- Matching tags: 1 → +10
- Why-now signals: 3 ≥ 2 → +10
- Location bonus: +5
- Score: 50 + 10 + 10 + 5 = 75

#### Competition Score (0-100, lower is better)

Market saturation assumptions by category.

**Hardcoded Map**:
- social-media: 85 (very saturated)
- dropshipping: 80
- fitness: 75
- content: 70
- marketing: 65
- design: 70
- saas: 72
- ai: 75
- service: 60 (moderate)
- default: 55

**Adjustments**:
- -5 if target customer is very specific (>60 chars)
- -3 if tagged with "digital" or "online"

**Example**:
- Idea: "Virtual Interior Design Consultant" (digital + service-ish)
- Base (service): 60
- Specific customer: -5
- Digital tag: -3
- Score: 60 - 5 - 3 = 52

#### Feasibility Score (0-100)

User's ability to execute based on budget, time, complexity, risk.

**Rules**:

Budget alignment:
- If `max_cost ≤ budget_tier_max`: +15
- If `max_cost ≤ budget_tier_max * 1.5`: +5
- If `max_cost > budget_tier_max * 1.5`: -10

Where `budget_tier_max`:
- LOW: $1,000
- MEDIUM: $3,000
- HIGH: $10,000

Time availability (hours/week):
- If `available ≥ hours_needed`: +15
- If `available ≥ hours_needed * 0.7`: +5
- If `available < hours_needed * 0.7`: -10

Where `hours_needed` by complexity:
- LOW: 5 hours/week
- MEDIUM: 15 hours/week
- HIGH: 30 hours/week

Steps to start:
- If ≤3 steps: +10
- If >6 steps: -5

Risk alignment:
- LOW risk + LOW complexity: +15
- HIGH risk + HIGH complexity: +10
- HIGH risk + LOW complexity: -20

**Example**:
- User: budget=MEDIUM ($3,000), hoursPerWeek=20, riskTolerance=LOW
- Idea: costRange.max=$1,000, complexity=LOW, steps=4

Calculation:
- Base: 50
- Cost alignment: $1,000 ≤ $3,000 → +15
- Time: 20h ≥ 5h needed → +15
- Steps: 4 steps → no bonus/penalty
- Risk: LOW risk + LOW complexity → +15
- Score: 50 + 15 + 15 + 15 = 95

#### Profitability Score (0-100)

Profit margin potential based on cost and category.

**Rules**:

Startup cost factor:
- If `costRange.max < $1,000`: +20
- If `costRange.max < $3,000`: +10
- If `costRange.max > $5,000`: -5

Margin by category:
- service: 70% gross margin
- digital: 85%
- saas: 80%
- coaching: 75%
- product: 40%
- ecommerce: 30%
- affiliate: 20%

Scalability bonus:
- If tagged "service" or "digital": +5

**Example**:
- Idea: costRange.max=$500, tags=["service"]
- Base: 50
- Low cost: +20
- Service margin (70%): contribute ~35 points
- Service scalability: +5
- Score: ~70-75

#### Overall Score (0-100)

Weighted composite.

```
Overall = 
  0.35 × demand +
  0.20 × (100 - competition) +
  0.25 × feasibility +
  0.20 × profitability
```

**Weights** (configurable in env):
- Demand: 0.35 (highest) - market pull is king
- Competition (inverted): 0.20 - less weight but matters
- Feasibility: 0.25 - execution ability critical
- Profitability: 0.20 - revenue potential matters

**Example**:
- Demand: 80
- Competition: 40 (100 - 40 = 60)
- Feasibility: 90
- Profitability: 70

Overall = 0.35×80 + 0.20×60 + 0.25×90 + 0.20×70
        = 28 + 12 + 22.5 + 14
        = 76.5 → 77 (rounded)

---

### UserInputs

User's profile for personalization.

```typescript
interface UserInputs {
  location: {
    city: string;      // e.g., "Austin"
    state: string;     // e.g., "TX", 2-letter code
  };
  interests: string[]; // Lowercase, hyphenated, e.g., ["social-media", "tech"]
  budget: "LOW" | "MEDIUM" | "HIGH";
  hoursPerWeek: number; // 0-168
  businessType: "SERVICE" | "PRODUCT" | "DIGITAL";
  riskTolerance: "LOW" | "MEDIUM" | "HIGH";
}
```

**Validation**:
- `location.city`: required, 2-50 chars
- `location.state`: required, 2 chars, US state code
- `interests`: required, 1-10 items
- `budget`: required, one of enum
- `hoursPerWeek`: required, 0-168
- `businessType`: required, one of enum
- `riskTolerance`: required, one of enum

---

## Persistence (POC vs Production)

### Mock (Current POC)

```typescript
// In-memory Map in @next-business-idea/integrations
class MockIdeaRepository {
  private store: Map<string, { idea: Idea; score: IdeaScore }> = new Map();

  async save(idea: Idea, score: IdeaScore): Promise<void> {
    this.store.set(idea.id, { idea, score });
  }

  async findById(id: string): Promise<...> {
    return this.store.get(id) || null;
  }

  async findAll(limit?: number) {
    const all = Array.from(this.store.values());
    return limit ? all.slice(0, limit) : all;
  }
}
```

**Data lost on server restart.**

### Production: Prisma Schema

```prisma
// prisma/schema.prisma
datasource db {
  provider = "sqlite"  // or "postgresql"
  url      = env("DATABASE_URL")
}

model SavedIdea {
  id        String   @id @default(cuid())
  ideaId    String   @unique
  
  // Denormalized for simplicity (could normalize)
  ideaData  String   // JSON serialized Idea
  scoreData String   // JSON serialized IdeaScore
  
  // Metadata
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Future: userId, notes, tags
}
```

**To upgrade from Mock to Prisma**:

1. Install Prisma:
   ```bash
   pnpm add -D prisma @prisma/client
   ```

2. Create schema:
   ```bash
   pnpm prisma init
   ```

3. Implement `PrismaIdeaRepository`:
   ```typescript
   // packages/integrations/src/real/prisma-repository.ts
   export class PrismaIdeaRepository implements IdeaRepository {
     constructor(private prisma: PrismaClient) {}
     async save(idea, score) { ... }
   }
   ```

4. Use in API routes:
   ```typescript
   const prisma = new PrismaClient();
   const repo = new PrismaIdeaRepository(prisma);
   ```

---

## Tag Taxonomy

Predefined tags for consistent categorization.

```
Business Type:
- service
- product
- digital
- hybrid

Industry/Domain:
- marketing
- design
- finance
- tech
- health
- fitness
- education
- content
- coaching
- consulting
- sales
- automation

Target Market:
- b2b (business to business)
- b2c (business to consumer)
- local
- remote
- global

Format:
- ecommerce
- saas
- course
- newsletter
- podcast
- dropshipping
- affiliate
- print-on-demand
- resale
- marketplace

Niche:
- pets
- home
- productivity
- sustainability
- wellness
```

---

## Scoring Configuration (Env Variables)

```bash
# .env.local

# Scoring weights (sum should = 1.0)
NEXT_PUBLIC_SCORE_WEIGHT_DEMAND=0.35
NEXT_PUBLIC_SCORE_WEIGHT_COMPETITION=0.20
NEXT_PUBLIC_SCORE_WEIGHT_FEASIBILITY=0.25
NEXT_PUBLIC_SCORE_WEIGHT_PROFITABILITY=0.20

# Idea catalog
NEXT_PUBLIC_IDEA_CATALOG_COUNT=30

# Integrations
OPENAI_API_KEY=sk-...  # Optional: enable real LLM
DATABASE_URL=...       # Optional: enable real DB
ML_ENDPOINT_URL=...    # Optional: enable real scoring model
```

---

See [API Specification](02-api-spec.md) for request/response examples.
