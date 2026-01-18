# Testing Strategy

## Overview

This document outlines the testing approach for Next Business Idea POC:

* **Unit Tests**: Core business logic (scoring, catalog) - Vitest
* **Integration Tests**: API endpoints and services - Vitest + test utils
* **E2E Tests**: User flows in real browser - Playwright
* **Manual Testing**: User interface and edge cases

***

## Unit Tests

### Testing Scoring Logic

File: `packages/core/src/__tests__/scoring.test.ts`

**Test Cases**:

1. **Demand Score Calculation**

```typescript
it('should increase demand score for matching interests', () => {
  const idea = createIdea({
    tags: ['marketing', 'service'],
    // ... other fields
  });

  const score = scoreIdea(idea, {
    userInputs: {
      location: { city: 'Austin', state: 'TX' },
      interests: ['marketing'],  // 1 match
      budget: 'MEDIUM',
      hoursPerWeek: 20,
      businessType: 'SERVICE',
      riskTolerance: 'MEDIUM',
    },
  });

  expect(score.demandScore).toBeGreaterThan(50);  // Base 50 + match bonus
});
```

2. **Competition Score Adjustment**

```typescript
it('should reduce competition score for digital/online ideas', () => {
  const idea1 = createIdea({
    tags: ['digital', 'saas'],
    targetCustomer: 'All developers',  // Very generic
    // ...
  });

  const idea2 = createIdea({
    tags: ['digital', 'saas'],
    targetCustomer: 'Enterprise SaaS CTOs in healthcare',  // Very specific
    // ...
  });

  const score1 = scoreIdea(idea1, { userInputs });
  const score2 = scoreIdea(idea2, { userInputs });

  expect(score2.competitionScore).toBeLessThan(score1.competitionScore);
});
```

3. **Feasibility Score vs Budget Mismatch**

```typescript
it('should penalize ideas exceeding user budget', () => {
  const expensiveIdea = createIdea({
    costRange: { min: 5000, max: 10000, currency: 'USD' },
    complexity: 'LOW',
    stepsToStart: ['Step 1', 'Step 2'],
    // ...
  });

  const score = scoreIdea(expensiveIdea, {
    userInputs: {
      budget: 'LOW',  // User can only spend $1,000
      hoursPerWeek: 20,
      riskTolerance: 'LOW',
      // ...
    },
  });

  expect(score.feasibilityScore).toBeLessThan(50);  // Below baseline
});
```

4. **Overall Score Composition**

```typescript
it('should calculate overall score as weighted sum', () => {
  const idea = createIdea({
    // Craft idea for predictable scores
    tags: ['marketing'],  // will score ~60 demand
    complexity: 'LOW',
    costRange: { min: 500, max: 1000, currency: 'USD' },
    // ...
  });

  const score = scoreIdea(idea, { userInputs });

  // Expected: 0.35×60 + 0.20×55 + 0.25×80 + 0.20×75
  //         = 21 + 11 + 20 + 15 = 67
  expect(score.overallScore).toBeCloseTo(67, { precision: 5 });
  expect(score.reasons).toHaveLength(3);
  expect(score.reasons[0]).toMatch(/Demand/);
});
```

### Testing Idea Catalog

File: `packages/core/src/__tests__/ideaCatalog.test.ts`

```typescript
describe('Idea Catalog', () => {
  it('should have at least 30 ideas', () => {
    const catalog = getIdeaCatalog();
    expect(catalog.length).toBeGreaterThanOrEqual(30);
  });

  it('should filter ideas by business type', () => {
    const serviceIdeas = filterIdeas([], 'SERVICE', 20);
    serviceIdeas.forEach((idea) => {
      expect(idea.tags).toContain('service');
    });
  });

  it('should match ideas by interests', () => {
    const marketingIdeas = filterIdeas(['marketing'], undefined, 10);
    expect(marketingIdeas.length).toBeGreaterThan(0);
    marketingIdeas.forEach((idea) => {
      expect(idea.tags.some((t) => t === 'marketing')).toBe(true);
    });
  });
});
```

### Testing Domain Models

File: `packages/core/src/__tests__/types.test.ts`

```typescript
describe('Idea Factory', () => {
  it('should generate UUID and timestamp', () => {
    const idea = createIdea({
      title: 'Test',
      summary: 'Test idea',
      // ... required fields
    });

    expect(idea.id).toMatch(/^[0-9a-f-]{36}$/);  // UUID v4 format
    expect(idea.createdAt).toBeInstanceOf(Date);
    expect(idea.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
  });
});
```

***

## Integration Tests

### Testing API Endpoints

File: `apps/web/src/__tests__/api/ideas.test.ts`

```typescript
import { POST as generateIdeas } from '@/app/api/ideas/generate/route';

describe('POST /api/ideas/generate', () => {
  it('should return 10 ranked ideas', async () => {
    const request = new NextRequest('http://localhost:3000/api/ideas/generate', {
      method: 'POST',
      body: JSON.stringify({
        location: { city: 'Austin', state: 'TX' },
        interests: ['marketing'],
        budget: 'MEDIUM',
        hoursPerWeek: 20,
        businessType: 'DIGITAL',
        riskTolerance: 'MEDIUM',
      }),
    });

    const response = await generateIdeas(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.ideas).toHaveLength(10);
    
    // Check ideas are sorted by score
    for (let i = 0; i < data.ideas.length - 1; i++) {
      expect(data.ideas[i].score.overallScore)
        .toBeGreaterThanOrEqual(data.ideas[i + 1].score.overallScore);
    }
  });

  it('should handle invalid user inputs', async () => {
    const request = new NextRequest('http://localhost:3000/api/ideas/generate', {
      method: 'POST',
      body: JSON.stringify({
        location: { city: 'Austin' },  // Missing state
        interests: ['marketing'],
        budget: 'INVALID',  // Invalid budget
        hoursPerWeek: -5,  // Negative hours
      }),
    });

    const response = await generateIdeas(request);
    expect(response.status).toBe(500);
  });
});
```

### Testing Integrations

File: `packages/integrations/src/__tests__/mocks.test.ts`

```typescript
describe('MockIdeaGenerator', () => {
  it('should generate deterministic ideas for same input', async () => {
    const gen = new MockIdeaGenerator();
    const userInputs = {
      location: { city: 'Austin', state: 'TX' },
      interests: ['marketing'],
      budget: 'MEDIUM' as const,
      hoursPerWeek: 20,
      businessType: 'SERVICE' as const,
      riskTolerance: 'MEDIUM' as const,
    };

    const ideas1 = await gen.generateIdeas(userInputs);
    const ideas2 = await gen.generateIdeas(userInputs);

    expect(ideas1.map((i) => i.id)).toEqual(ideas2.map((i) => i.id));
  });

  it('should respect count parameter', async () => {
    const gen = new MockIdeaGenerator();
    const ideas = await gen.generateIdeas(userInputs, 5);
    expect(ideas).toHaveLength(5);
  });
});

describe('MockIdeaRepository', () => {
  it('should persist and retrieve ideas', async () => {
    const repo = new MockIdeaRepository();
    const idea = createIdea({ ... });
    const score = createIdeaScore(idea.id, { ... });

    await repo.save(idea, score);
    const retrieved = await repo.findById(idea.id);

    expect(retrieved).not.toBeNull();
    expect(retrieved?.idea.id).toBe(idea.id);
    expect(retrieved?.score.overallScore).toBe(score.overallScore);
  });
});
```

***

## E2E Tests

### Testing Primary User Flow

File: `apps/web/__tests__/e2e/idea-generation.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Idea Generation Flow', () => {
  test('should generate, view, and save ideas', async ({ page }) => {
    // 1. Navigate to home
    await page.goto('http://localhost:3000');
    expect(await page.title()).toContain('Next Business Idea');

    // 2. Fill user profile
    await page.fill('input[placeholder*="City"]', 'Austin');
    await page.fill('input[placeholder*="State"]', 'TX');
    await page.fill('input[placeholder*="interests"]', 'marketing, tech');
    await page.selectOption('select:nth-of-type(1)', 'MEDIUM');  // Budget
    await page.fill('input[type="number"]', '20');  // Hours
    await page.selectOption('select:nth-of-type(2)', 'DIGITAL');  // Business type
    await page.selectOption('select:nth-of-type(3)', 'MEDIUM');  // Risk

    // 3. Generate ideas
    await page.click('button:has-text("Generate Ideas")');

    // 4. Wait for ideas to appear
    await page.waitForSelector('text=Generated Ideas', { timeout: 5000 });
    const ideaCards = page.locator('[class*="IdeaCard"]');
    expect(await ideaCards.count()).toBe(10);

    // 5. Verify scoring
    const firstIdea = ideaCards.first();
    expect(await firstIdea.locator('text=/Overall/').isVisible()).toBe(true);
    expect(await firstIdea.locator('text=/Demand/').isVisible()).toBe(true);

    // 6. Save first idea
    const saveButton = firstIdea.locator('button:has-text("Save")').first();
    await saveButton.click();
    await expect(page.locator('text=Idea saved!')).toBeVisible();

    // 7. Load saved ideas
    await page.click('button:has-text("Load Saved Ideas")');
    await page.waitForSelector('[class*="SavedIdeasSection"]', { timeout: 3000 });
    expect(await page.locator('[class*="SavedIdeasSection"] > *').count()).toBeGreaterThan(0);
  });

  test('should show idea details on expand', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Generate ideas
    await page.fill('input[placeholder*="interests"]', 'marketing');
    await page.click('button:has-text("Generate Ideas")');
    await page.waitForSelector('text=Generated Ideas');

    // Expand first idea
    const firstIdea = page.locator('[class*="IdeaCard"]').first();
    await firstIdea.locator('button:has-text("Show Details")').click();

    // Verify details visible
    expect(await firstIdea.locator('text=Target Customer').isVisible()).toBe(true);
    expect(await firstIdea.locator('text=Steps to Start').isVisible()).toBe(true);
    expect(await firstIdea.locator('text=Local Viability').isVisible()).toBe(true);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    await page.route('/api/ideas/generate', (route) =>
      route.abort('failed')
    );

    await page.goto('http://localhost:3000');
    await page.fill('input[placeholder*="interests"]', 'test');
    await page.click('button:has-text("Generate Ideas")');

    await expect(page.locator('text=Failed to generate ideas')).toBeVisible();
  });
});
```

### Running E2E Tests

```bash
# Start dev server
pnpm dev &

# Run Playwright tests
pnpm test:e2e

# Open Playwright Inspector
pnpm test:e2e --debug
```

***

## Manual Testing Checklist

* \[ ] Load http://localhost:3000
* \[ ] Submit form with various budget/hours/risk combinations
* \[ ] Verify 10 ideas returned in \&lt;5 seconds
* \[ ] Click "Show Details" on 3+ ideas
* \[ ] Verify scores are 0-100
* \[ ] Verify reasons are readable
* \[ ] Save 2-3 ideas
* \[ ] Click "Load Saved Ideas"
* \[ ] Verify saved ideas appear
* \[ ] Test edge cases:
  * \[ ] Zero hours available
  * \[ ] Very high budget
  * \[ ] Unusual interest combinations
  * \[ ] Different business types and risk tolerances

***

## Test Data

### Sample User Input (Low Risk)

```json
{
  "location": { "city": "Austin", "state": "TX" },
  "interests": ["fitness", "coaching"],
  "budget": "LOW",
  "hoursPerWeek": 10,
  "businessType": "SERVICE",
  "riskTolerance": "LOW"
}
```

**Expected**: Ideas should have:

* Low startup cost (\&lt;$1,000)
* LOW or MEDIUM complexity
* Service-focused
* Examples: Virtual trainer, Online coach, Pet sitting

### Sample User Input (High Risk Entrepreneur)

```json
{
  "location": { "city": "San Francisco", "state": "CA" },
  "interests": ["ai", "tech", "saas"],
  "budget": "HIGH",
  "hoursPerWeek": 50,
  "businessType": "DIGITAL",
  "riskTolerance": "HIGH"
}
```

**Expected**: Ideas should have:

* Higher startup cost ($2K-5K+)
* HIGH complexity OK
* Digital/SaaS focused
* Examples: AI chatbot, SaaS tool, ML service

***

## Coverage Goals

* **Core package**: >90% line coverage
* **Integrations package**: >80% line coverage
* **API routes**: >85% coverage (integration tests)
* **Components**: Snapshot testing only (UI changes often)

***

## Running All Tests

```bash
# Unit tests
pnpm -r test

# Type checking
pnpm -r type-check

# E2E tests (requires dev server running)
pnpm test:e2e

# All together
pnpm test:all
```

***

See [API Specification](02-api-spec.md) for endpoint testing examples.
