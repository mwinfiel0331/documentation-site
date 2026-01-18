# BirdDogger - Testing Guide

## Testing Overview

This guide covers testing strategies, test execution, and quality assurance for the BirdDogger application.

**Current Testing Status**:

* ✅ Manual API testing via curl/Postman
* ✅ Database schema validation
* ✅ Code quality (ESLint, TypeScript)
* ⏳ Automated unit tests (planned)
* ⏳ Integration tests (planned)
* ⏳ E2E tests (planned)

***

## Manual Testing

### Prerequisites

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Verify server is running**:

   ```bash
   curl http://localhost:3000/health
   ```

   Expected response:

   ```json
   {"status":"ok","timestamp":"2024-11-22T18:00:00.000Z"}
   ```

***

## API Testing

### Testing Tools

#### Option 1: curl (Command Line)

**Advantages**: Fast, scriptable, no installation
**Best for**: Quick tests, CI/CD pipelines

#### Option 2: Postman

**Advantages**: GUI, collections, environment variables
**Best for**: Exploratory testing, documentation

Download: https://www.postman.com/downloads/

#### Option 3: VS Code REST Client

**Advantages**: Tests in version control, easy to run
**Best for**: Developer testing

Install: "REST Client" extension in VS Code

***

### Test Scenarios

#### 1. Health Check Test

**Purpose**: Verify server is running

**Test**:

```bash
curl http://localhost:3000/health
```

**Expected Result**:

* Status: 200 OK
* Response: `{"status":"ok","timestamp":"..."}`

**Pass Criteria**: ✅ Returns status "ok"

***

#### 2. Create Wholesaler Test

**Purpose**: Test wholesaler creation and validation

**Test**:

```bash
curl -X POST http://localhost:3000/api/wholesalers \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test Wholesaler",
    "companyName": "Test Company LLC",
    "primaryEmail": "test@example.com",
    "primaryPhone": "+1-813-555-1234",
    "markets": ["Tampa, FL", "Orlando, FL"],
    "notes": "This is a test wholesaler"
  }'
```

**Expected Result**:

* Status: 201 Created
* Response includes:
  * `id` (UUID)
  * `createdAt` (timestamp)
  * `isActive` (true)
  * `totalListingsTracked` (0)

**Pass Criteria**:

* ✅ Wholesaler created successfully
* ✅ ID is valid UUID
* ✅ Default values set correctly

**Test Variations**:

**Minimal data**:

```bash
curl -X POST http://localhost:3000/api/wholesalers \
  -H "Content-Type: application/json" \
  -d '{"fullName": "John Doe", "markets": ["Tampa, FL"]}'
```

**Missing required data** (should fail gracefully):

```bash
curl -X POST http://localhost:3000/api/wholesalers \
  -H "Content-Type: application/json" \
  -d '{}'
```

***

#### 3. List Wholesalers Test

**Purpose**: Test filtering and retrieval

**Test - Get all**:

```bash
curl http://localhost:3000/api/wholesalers
```

**Test - Filter by market**:

```bash
curl "http://localhost:3000/api/wholesalers?market=Tampa"
```

**Test - Filter by active status**:

```bash
curl "http://localhost:3000/api/wholesalers?isActive=true"
```

**Test - Filter by minimum listings**:

```bash
curl "http://localhost:3000/api/wholesalers?minListingsTracked=5"
```

**Expected Results**:

* Status: 200 OK
* Response: Array of wholesaler objects
* Filters apply correctly

**Pass Criteria**:

* ✅ Returns array (even if empty)
* ✅ Filters work as expected
* ✅ No duplicate results

***

#### 4. Create Listing with Scoring Test

**Purpose**: Test automatic deal scoring

**Setup**: First create a wholesaler (or use existing ID)

**Test - High-scoring deal**:

```bash
curl -X POST http://localhost:3000/api/listings \
  -H "Content-Type: application/json" \
  -d '{
    "sourceType": "FACEBOOK_GROUP",
    "sourceName": "Test Group",
    "headline": "3/2 Fixer Upper - Cash Only - Motivated Seller",
    "description": "Investor special! Property needs work. Sold as-is. Great opportunity!",
    "city": "Tampa",
    "state": "FL",
    "askingPrice": 100000,
    "estimatedARV": 200000,
    "market": "Tampa, FL"
  }'
```

**Expected Result**:

* Status: 201 Created
* `score` ≥ 80 (HIGH hotness)
* `hotness` = "HIGH"
* `keywordFlags` includes: \["cash only", "fixer upper", "motivated seller", "needs work", "as-is"]

**Test - Low-scoring deal**:

```bash
curl -X POST http://localhost:3000/api/listings \
  -H "Content-Type: application/json" \
  -d '{
    "sourceType": "FACEBOOK_GROUP",
    "sourceName": "Test Group",
    "headline": "Turnkey Rental Property",
    "description": "Ready to rent. No work needed.",
    "city": "Tampa",
    "state": "FL",
    "askingPrice": 250000,
    "estimatedARV": 250000,
    "market": "Tampa, FL"
  }'
```

**Expected Result**:

* Status: 201 Created
* `score` \&lt; 60 (LOW hotness)
* `hotness` = "LOW"
* `keywordFlags` = \[] or minimal

**Pass Criteria**:

* ✅ Score calculated correctly
* ✅ Hotness matches score range
* ✅ Keywords detected properly

***

#### 5. Listing Filtering Test

**Purpose**: Test complex filtering

**Test - High hotness only**:

```bash
curl "http://localhost:3000/api/listings?hotness=HIGH"
```

**Test - Score range**:

```bash
curl "http://localhost:3000/api/listings?minScore=70&maxScore=90"
```

**Test - Market + status**:

```bash
curl "http://localhost:3000/api/listings?market=Tampa&dealStatus=NEW"
```

**Test - Multiple filters**:

```bash
curl "http://localhost:3000/api/listings?market=Tampa&hotness=HIGH&dealStatus=NEW&minScore=80"
```

**Expected Results**:

* Only matching listings returned
* Filters combine with AND logic
* Results sorted by score (descending)

**Pass Criteria**:

* ✅ All returned listings match ALL filters
* ✅ No false positives
* ✅ Sorted correctly

***

#### 6. Update Listing Test

**Purpose**: Test listing updates and status changes

**Setup**: Create a listing first and note its ID

**Test - Update status**:

```bash
curl -X PATCH http://localhost:3000/api/listings/{listing_id} \
  -H "Content-Type: application/json" \
  -d '{
    "dealStatus": "UNDER_CONTRACT",
    "myRole": "BUYER"
  }'
```

**Expected Result**:

* Status: 200 OK
* `dealStatus` = "UNDER\_CONTRACT"
* `myRole` = "BUYER"
* `updatedAt` timestamp changed

**Pass Criteria**:

* ✅ Fields updated correctly
* ✅ Other fields unchanged
* ✅ Timestamp updated

***

#### 7. Data Ingestion Test

**Purpose**: Test multi-source ingestion

**Test - Facebook post**:

```bash
curl -X POST http://localhost:3000/api/ingest/facebook-post \
  -H "Content-Type: application/json" \
  -d '{
    "wholesalerName": "Facebook Wholesaler",
    "wholesalerPhone": "+1-813-555-9999",
    "fbGroupName": "Tampa Real Estate Investors",
    "postUrl": "https://facebook.com/groups/test/posts/123",
    "headline": "Great Deal - Cash Only",
    "description": "Investor special needs work",
    "city": "Tampa",
    "state": "FL",
    "askingPrice": 120000,
    "estimatedARV": 220000
  }'
```

**Expected Result**:

* Status: 201 Created
* Wholesaler created or found
* Listing created with proper source attribution
* Score calculated automatically
* Source set to "FACEBOOK\_GROUP"

**Test - REIA meetup**:

```bash
curl -X POST http://localhost:3000/api/ingest/reia-meetup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "REIA Wholesaler",
    "companyName": "REIA Properties LLC",
    "phone": "+1-813-555-8888",
    "email": "reia@example.com",
    "meetupName": "Tampa REIA Monthly",
    "market": "Tampa, FL"
  }'
```

**Expected Result**:

* Status: 201 Created
* Wholesaler created with REI\_MEETUP source
* Source details include meetup name

**Pass Criteria**:

* ✅ Data normalized correctly
* ✅ Source attribution set
* ✅ No duplicate wholesalers created for same phone/email

***

#### 8. Zillow CSV Ingestion Test

**Purpose**: Test bulk CSV import

**Setup**: Create test CSV file `test_zillow.csv`:

```csv
address,city,state,zip,price,beds,baths,sqft,yearBuilt,url,description,daysOnZillow,status
123 Test St,Tampa,FL,33602,95000,3,2,1500,1950,https://zillow.com/test1,Fixer upper needs work cash only,45,For Sale
456 Test Ave,Tampa,FL,33603,145000,4,2,1800,1960,https://zillow.com/test2,Handyman special investor opportunity,60,For Sale
789 Test Blvd,Tampa,FL,33604,200000,3,2,1600,1970,https://zillow.com/test3,Turnkey rental property,10,For Sale
```

**Test**:

```bash
curl -X POST http://localhost:3000/api/zillow/upload \
  -F "file=@test_zillow.csv"
```

**Expected Result**:

* Status: 200 OK
* Response includes:
  * `totalRows`: 3
  * `inserted`: 3
  * `updated`: 0
  * `errors`: \[]
  * `highScoringListings`: Array with deals sorted by score

**Re-run test** (test deduplication):

```bash
curl -X POST http://localhost:3000/api/zillow/upload \
  -F "file=@test_zillow.csv"
```

**Expected Result**:

* `totalRows`: 3
* `inserted`: 0
* `updated`: 3 (existing listings updated)

**Pass Criteria**:

* ✅ All valid rows processed
* ✅ Scoring applied correctly
* ✅ Duplicates handled (by URL or address)
* ✅ Errors reported for invalid rows

***

#### 9. Delete Operations Test

**Purpose**: Test soft delete and hard delete

**Test - Soft delete wholesaler**:

```bash
curl -X DELETE http://localhost:3000/api/wholesalers/{id}
```

**Expected Result**:

* Status: 200 OK
* Wholesaler `isActive` set to false
* Still retrievable by ID
* Not in default listings (filtered by isActive)

**Test - Hard delete listing**:

```bash
curl -X DELETE http://localhost:3000/api/listings/{id}
```

**Expected Result**:

* Status: 200 OK
* Listing completely removed
* GET request returns 404

**Pass Criteria**:

* ✅ Soft delete maintains data
* ✅ Hard delete removes record
* ✅ Cascade deletes work (media, interactions)

***

## Testing Checklist

Use this checklist for comprehensive manual testing:

### Wholesaler API

* \[ ] Create wholesaler with full data
* \[ ] Create wholesaler with minimal data
* \[ ] List all wholesalers
* \[ ] Filter by market
* \[ ] Filter by active status
* \[ ] Get wholesaler by ID
* \[ ] Update wholesaler
* \[ ] Add source to wholesaler
* \[ ] Soft delete wholesaler

### Listing API

* \[ ] Create listing with high score (good deal)
* \[ ] Create listing with low score (bad deal)
* \[ ] Verify keyword detection
* \[ ] List all listings
* \[ ] Filter by hotness
* \[ ] Filter by score range
* \[ ] Filter by market
* \[ ] Filter by status
* \[ ] Get listing by ID
* \[ ] Update listing status
* \[ ] Add media to listing
* \[ ] Delete listing

### Ingestion API

* \[ ] Ingest Facebook post
* \[ ] Ingest investor website listing
* \[ ] Ingest REIA meetup contact
* \[ ] Ingest "We Buy Houses" sign
* \[ ] Ingest MLS investor special
* \[ ] Ingest title company referral
* \[ ] Ingest hard money lender referral
* \[ ] Ingest bird dog referral

### Zillow API

* \[ ] Upload valid CSV
* \[ ] Upload CSV with errors
* \[ ] Re-upload same CSV (test deduplication)
* \[ ] Get Zillow properties

### Edge Cases

* \[ ] Invalid JSON in request body
* \[ ] Missing required fields
* \[ ] Invalid enum values
* \[ ] Non-existent IDs (404 errors)
* \[ ] Duplicate phone numbers
* \[ ] Duplicate emails
* \[ ] Very long text fields
* \[ ] Special characters in text
* \[ ] Negative numbers for prices
* \[ ] Zero values
* \[ ] Null vs undefined vs empty string

***

## Automated Testing (Future)

### Unit Testing Framework

**Planned Stack**:

* Jest (testing framework)
* Supertest (HTTP assertions)
* Prisma test client

**Installation** (when implementing):

```bash
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
```

**Example Unit Test** (future):

```typescript
// src/__tests__/services/scoring.test.ts
import { calculateScore } from '../../utils/scoring';

describe('Scoring Engine', () => {
  test('should score high for good deals', () => {
    const listing = {
      description: 'Cash only investor special needs work',
      askingPrice: 100000,
      estimatedARV: 200000,
    };
    const score = calculateScore(listing);
    expect(score).toBeGreaterThanOrEqual(80);
  });

  test('should score low for retail deals', () => {
    const listing = {
      description: 'Turnkey rental property',
      askingPrice: 250000,
      estimatedARV: 250000,
    };
    const score = calculateScore(listing);
    expect(score).toBeLessThan(60);
  });
});
```

**Running Tests** (future):

```bash
npm test
npm run test:watch  # Watch mode
npm run test:coverage  # Coverage report
```

***

### Integration Testing (Future)

**Purpose**: Test API endpoints with real database

**Example Integration Test**:

```typescript
// src/__tests__/api/wholesalers.test.ts
import request from 'supertest';
import app from '../../index';
import { prisma } from '../../utils/prisma';

describe('Wholesaler API', () => {
  beforeAll(async () => {
    // Setup test database
    await prisma.$connect();
  });

  afterAll(async () => {
    // Cleanup
    await prisma.wholesaler.deleteMany();
    await prisma.$disconnect();
  });

  test('POST /api/wholesalers creates wholesaler', async () => {
    const response = await request(app)
      .post('/api/wholesalers')
      .send({
        fullName: 'Test Wholesaler',
        markets: ['Tampa, FL'],
      });

    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
    expect(response.body.fullName).toBe('Test Wholesaler');
  });

  test('GET /api/wholesalers returns array', async () => {
    const response = await request(app)
      .get('/api/wholesalers');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
```

***

### E2E Testing (Future)

**Planned Stack**:

* Playwright or Cypress (when frontend exists)

**Purpose**: Test complete user workflows

**Example Scenario**:

1. User creates wholesaler
2. User adds listing for that wholesaler
3. System calculates score
4. User filters for high-scoring deals
5. User updates deal status
6. User marks deal as closed

***

## Performance Testing

### Load Testing

**Tool**: Apache Bench or Artillery

**Test - API throughput**:

```bash
# Install Apache Bench (comes with Apache)
# Windows: Install via Apache
# Linux: sudo apt-get install apache2-utils

# Test 1000 requests, 10 concurrent
ab -n 1000 -c 10 http://localhost:3000/api/listings
```

**Expected Results**:

* Requests per second: > 100 rps
* Average response time: \&lt; 200ms
* 99th percentile: \&lt; 500ms

**Test - Database performance**:

```bash
# Create many listings
for i in {1..1000}; do
  curl -X POST http://localhost:3000/api/listings \
    -H "Content-Type: application/json" \
    -d "{\"sourceType\":\"FACEBOOK_GROUP\",\"sourceName\":\"Test\",\"headline\":\"Deal $i\",\"city\":\"Tampa\",\"state\":\"FL\"}"
done

# Test filtering performance
time curl "http://localhost:3000/api/listings?hotness=HIGH&market=Tampa"
```

**Pass Criteria**:

* ✅ Response time \&lt; 200ms with 1000 listings
* ✅ Response time \&lt; 500ms with 10,000 listings
* ✅ No memory leaks

***

## Database Testing

### Schema Validation

**Test migrations**:

```bash
# Reset database
npx prisma migrate reset --force

# Run migrations
npx prisma migrate deploy

# Verify schema
npx prisma validate
```

**Expected**: All migrations apply successfully

### Data Integrity

**Test - Foreign key constraints**:

```sql
-- Try to create listing with invalid wholesaler ID (should fail)
INSERT INTO "Listing" (id, "wholesalerId", "sourceType", "sourceName", headline)
VALUES ('123e4567-e89b-12d3-a456-426614174999', 'invalid-uuid', 'FACEBOOK_GROUP', 'Test', 'Test');
```

**Expected**: Error - foreign key violation

**Test - Cascade deletes**:

```sql
-- Create test data
INSERT INTO "Wholesaler" (id, markets) VALUES ('test-id', ARRAY['Tampa']);
INSERT INTO "WholesalerSource" (id, "wholesalerId", "sourceType", "sourceName") 
VALUES ('source-id', 'test-id', 'FACEBOOK_GROUP', 'Test');

-- Delete wholesaler
DELETE FROM "Wholesaler" WHERE id = 'test-id';

-- Verify source deleted (should return 0 rows)
SELECT COUNT(*) FROM "WholesalerSource" WHERE "wholesalerId" = 'test-id';
```

**Expected**: Cascade delete removes source

***

## Code Quality Testing

### ESLint

**Run linter**:

```bash
npm run lint
```

**Expected**: 0 errors, 0 warnings

**Auto-fix**:

```bash
npm run lint:fix
```

### TypeScript

**Type checking**:

```bash
npx tsc --noEmit
```

**Expected**: No type errors

### Code Coverage (Future)

**Generate coverage report**:

```bash
npm run test:coverage
```

**Target Coverage**:

* Statements: > 80%
* Branches: > 75%
* Functions: > 80%
* Lines: > 80%

***

## Security Testing

### Input Validation

**Test - SQL injection attempt** (should be prevented by Prisma):

```bash
curl -X POST http://localhost:3000/api/wholesalers \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test'; DROP TABLE Wholesaler;--",
    "markets": ["Tampa"]
  }'
```

**Expected**: Wholesaler created with literal string, no SQL execution

**Test - XSS attempt**:

```bash
curl -X POST http://localhost:3000/api/listings \
  -H "Content-Type: application/json" \
  -d '{
    "sourceType": "FACEBOOK_GROUP",
    "sourceName": "Test",
    "headline": "<script>alert(\"XSS\")</script>",
    "city": "Tampa",
    "state": "FL"
  }'
```

**Expected**: Data stored as-is, sanitization happens on output (frontend responsibility)

### Authentication (Future)

When authentication is implemented:

* \[ ] Test invalid tokens
* \[ ] Test expired tokens
* \[ ] Test missing tokens
* \[ ] Test token refresh

***

## Continuous Integration (Future)

### GitHub Actions Workflow

**Planned CI Pipeline** (`.github/workflows/test.yml`):

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: testuser
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: birddogger_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run type check
        run: npx tsc --noEmit
      
      - name: Run migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://testuser:testpass@localhost:5432/birddogger_test
      
      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: postgresql://testuser:testpass@localhost:5432/birddogger_test
```

***

## Test Data Management

### Sample Data Script

Create `scripts/seed.ts` (future):

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  // Create test wholesalers
  const wholesaler = await prisma.wholesaler.create({
    data: {
      fullName: 'Test Wholesaler',
      primaryPhone: '+1-813-555-1111',
      markets: ['Tampa, FL'],
    },
  });

  // Create test listings
  await prisma.listing.createMany({
    data: [
      {
        wholesalerId: wholesaler.id,
        sourceType: 'FACEBOOK_GROUP',
        sourceName: 'Test Group',
        headline: 'Test Deal 1',
        city: 'Tampa',
        state: 'FL',
        askingPrice: 100000,
        estimatedARV: 200000,
      },
      // ... more test data
    ],
  });

  console.log('Test data seeded!');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Run seeding**:

```bash
npx ts-node scripts/seed.ts
```

***

## Bug Reporting Template

When you find a bug during testing:

```markdown
### Bug Description
Clear description of the issue

### Steps to Reproduce
1. Step one
2. Step two
3. Step three

### Expected Behavior
What should happen

### Actual Behavior
What actually happens

### Environment
- OS: Windows 11 / macOS / Linux
- Node version: 18.x
- Database: PostgreSQL 15

### Additional Context
Screenshots, logs, error messages
```

***

## Test Reporting

### Manual Test Report Template

```markdown
# Test Report - [Date]

## Summary
- Tests Executed: 50
- Passed: 48
- Failed: 2
- Blocked: 0

## Failed Tests
1. **Test Name**: Update listing with invalid status
   - **Issue**: Accepts invalid enum value
   - **Severity**: Medium
   - **Action**: Add validation

2. **Test Name**: CSV with special characters
   - **Issue**: Fails to parse UTF-8 characters
   - **Severity**: Low
   - **Action**: Update CSV parser

## Recommendations
- Add input validation for enum fields
- Improve error messages for CSV parsing
- Consider pagination for large result sets
```

***

## Next Steps

1. **Implement automated tests**: Set up Jest and write unit tests
2. **Set up CI/CD**: Configure GitHub Actions
3. **Add test coverage**: Aim for 80%+ coverage
4. **Performance testing**: Load test with realistic data
5. **Security audit**: Third-party security scan

For questions or issues, refer to the troubleshooting section in [04-local-development.md](./04-local-development.md).
