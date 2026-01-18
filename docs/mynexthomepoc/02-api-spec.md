# API Specification

## Base URL

```
http://localhost:3000/api
```

## Authentication

**Not required for POC**. Future: Add `Authorization: Bearer less thantoken>` header.

---

## Endpoints

### 1. Generate Ideas

**Endpoint**: `POST /ideas/generate`

**Description**: Generate 10 personalized business ideas for the given user profile.

**Request**:

```json
{
  "location": {
    "city": "Austin",
    "state": "TX"
  },
  "interests": ["marketing", "technology", "design"],
  "budget": "MEDIUM",
  "hoursPerWeek": 20,
  "businessType": "DIGITAL",
  "riskTolerance": "MEDIUM"
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "ideas": [
    {
      "id": "uuid-1234",
      "title": "Social Media Management for Local Businesses",
      "summary": "Create and manage social media content for 5-10 local SMBs",
      "targetCustomer": "Small restaurants, salons, plumbers, local services",
      "stepsToStart": [
        "Master Instagram, TikTok, LinkedIn content",
        "Create sample content calendars",
        "Network with 20 local business owners",
        "Land first 3 clients at reduced rate"
      ],
      "costRange": {
        "min": 200,
        "max": 1000,
        "currency": "USD"
      },
      "complexity": "LOW",
      "localViabilityNotes": "Highly local-focused; ideal for face-to-face B2B relationships (Localized for Austin: Consider local competition and demographics).",
      "tags": ["marketing", "service", "local"],
      "whyNowSignals": [
        "SMBs need social presence",
        "Influencer economy growth",
        "Content hungry platforms"
      ],
      "createdAt": "2024-01-17T10:30:00Z",
      "score": {
        "ideaId": "uuid-1234",
        "demandScore": 85,
        "competitionScore": 65,
        "feasibilityScore": 90,
        "profitabilityScore": 75,
        "overallScore": 81,
        "reasons": [
          "Demand potential: 85/100",
          "Low competition advantage: 35/100",
          "Feasibility to execute: 90/100"
        ]
      }
    },
    // ... 9 more ideas, sorted by overallScore descending
  ]
}
```

**Error Response** (500):

```json
{
  "success": false,
  "error": "Failed to generate ideas"
}
```

**Implementation Notes**:
- See `packages/integrations/src/interfaces.ts` for `IdeaGenerator` interface
- Default: `MockIdeaGenerator` (deterministic, fast)
- Replace with `OpenAIIdeaGenerator` if `OPENAI_API_KEY` env var is set
- Response time SLA: less than 2 seconds

---

### 2. Save Idea

**Endpoint**: `POST /ideas/save`

**Description**: Save an idea to the user's saved ideas list.

**Request**:

```json
{
  "ideaId": "uuid-1234"
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "idea": {
    "id": "uuid-1234",
    "title": "Social Media Management for Local Businesses",
    "summary": "...",
    // ... full idea + score
  }
}
```

**Error Response** (500):

```json
{
  "success": false,
  "error": "Failed to save idea"
}
```

**Implementation Notes**:
- Calls `IdeaRepository.save(idea, score)`
- Default: `MockIdeaRepository` (in-memory)
- Replace with `PrismaIdeaRepository` if `DATABASE_URL` env var is set
- Response time SLA: less than 500ms

---

### 3. Get Saved Ideas

**Endpoint**: `GET /ideas/saved`

**Description**: Retrieve all saved ideas for the user.

**Request**: No body

**Response** (200 OK):

```json
{
  "success": true,
  "ideas": [
    {
      "id": "uuid-1234",
      "title": "Social Media Management for Local Businesses",
      "summary": "...",
      // ... full ideas with scores
    },
    // ... more saved ideas
  ]
}
```

**Error Response** (500):

```json
{
  "success": false,
  "error": "Failed to fetch saved ideas"
}
```

**Implementation Notes**:
- Calls `IdeaRepository.findAll()`
- Default: `MockIdeaRepository.store.values()`
- Replace with `PrismaIdeaRepository.findAll()` for real DB
- Response time SLA: less than500ms

---

## Request/Response Models

### UserInputs

```typescript
interface UserInputs {
  location: {
    city: string;     // e.g., "Austin"
    state: string;    // e.g., "TX"
  };
  interests: string[];         // e.g., ["marketing", "tech"]
  budget: "LOW" | "MEDIUM" | "HIGH";
  hoursPerWeek: number;        // 0-168
  businessType: "SERVICE" | "PRODUCT" | "DIGITAL";
  riskTolerance: "LOW" | "MEDIUM" | "HIGH";
}
```

### Idea

```typescript
interface Idea {
  id: string;  // UUID
  title: string;
  summary: string;
  targetCustomer: string;
  stepsToStart: string[];
  costRange: {
    min: number;
    max: number;
    currency: "USD";
  };
  complexity: "LOW" | "MEDIUM" | "HIGH";
  localViabilityNotes: string;
  tags: string[];
  whyNowSignals: string[];
  createdAt: Date;
}
```

### IdeaScore

```typescript
interface IdeaScore {
  ideaId: string;
  demandScore: number;      // 0-100
  competitionScore: number; // 0-100 (lower is better)
  feasibilityScore: number; // 0-100
  profitabilityScore: number; // 0-100
  overallScore: number;     // 0-100
  reasons: [string, string, string];  // Top 3 reasons
}
```

### IdeaWithScore

```typescript
interface IdeaWithScore extends Idea {
  score: IdeaScore;
}
```

---

## Error Codes

| Code | Message | Cause |
|------|---------|-------|
| 500 | Failed to generate ideas | IdeaGenerator or ScoringService error |
| 500 | Failed to save idea | IdeaRepository error |
| 500 | Failed to fetch saved ideas | IdeaRepository error |

---

## Rate Limiting

**Current**: None (POC)

**Future**: Implement in Next.js middleware:

```typescript
// middleware.ts
import { rateLimit } from '@/lib/rate-limit';

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const limited = await rateLimit(request);
    if (limited) {
      return new NextResponse('Too many requests', { status: 429 });
    }
  }
}
```

---

## Monitoring

Log all requests with:
- Timestamp
- Endpoint
- Request body (sanitized)
- Response status
- Response time
- User agent (future)

Example:

```typescript
console.log({
  timestamp: new Date().toISOString(),
  endpoint: 'POST /api/ideas/generate',
  status: 200,
  durationMs: 1234,
});
```

---

## Testing Examples

### cURL

```bash
# Generate ideas
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

# Save idea
curl -X POST http://localhost:3000/api/ideas/save \
  -H "Content-Type: application/json" \
  -d '{"ideaId": "uuid-1234"}'

# Get saved ideas
curl -X GET http://localhost:3000/api/ideas/saved
```

### JavaScript/Fetch

```javascript
// Generate ideas
const response = await fetch('/api/ideas/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    location: { city: 'Austin', state: 'TX' },
    interests: ['marketing'],
    budget: 'MEDIUM',
    hoursPerWeek: 20,
    businessType: 'DIGITAL',
    riskTolerance: 'MEDIUM',
  }),
});
const data = await response.json();
console.log(data.ideas);
```

### Test Client

See `apps/web/__tests__/e2e/ideas.spec.ts` for Playwright examples.
