# BirdDogger - Application Flows and Processes

## Overview

This document describes the key workflows, data flows, and subprocess execution patterns within the BirdDogger application. Understanding these flows is essential for developers, QA engineers, and operations teams.

***

## Table of Contents

1. [Deal Ingestion Workflows](#deal-ingestion-workflows)
2. [Listing Scoring Process](#listing-scoring-process)
3. [Wholesaler Management Workflows](#wholesaler-management-workflows)
4. [Zillow CSV Import Process](#zillow-csv-import-process)
5. [Deal Lifecycle Management](#deal-lifecycle-management)
6. [Search and Filtering Flow](#search-and-filtering-flow)
7. [Data Synchronization Processes](#data-synchronization-processes)
8. [Error Handling Flows](#error-handling-flows)

***

## Deal Ingestion Workflows

### 1. Facebook Group Post Ingestion

**Endpoint**: `POST /api/ingest/facebook-post`

**Flow Diagram**:

```
┌─────────────┐
│   Client    │
│ (User/Bot)  │
└──────┬──────┘
       │
       │ POST request with Facebook post data
       │
┌──────▼─────────────────────────────────────────────────────────────┐
│                    Ingestion Route Handler                         │
│  - Validate request body (required: fbGroupName, headline)         │
│  - Extract wholesaler and listing data                             │
└──────┬─────────────────────────────────────────────────────────────┘
       │
       │ Call ingestion service
       │
┌──────▼─────────────────────────────────────────────────────────────┐
│              Ingestion Service: handleFacebookPost()               │
│                                                                    │
│  Step 1: Find or Create Wholesaler                                │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ - Check if wholesaler exists by phone or email             │   │
│  │ - If exists: Update lastSeenAt, increment listings count   │   │
│  │ - If not exists: Create new wholesaler record             │   │
│  └────────────────────────────────────────────────────────────┘   │
│                          │                                         │
│  Step 2: Create WholesalerSource                                  │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ - sourceType: FACEBOOK_GROUP                               │   │
│  │ - sourceName: fbGroupName                                  │   │
│  │ - sourceUrl: postUrl                                       │   │
│  └────────────────────────────────────────────────────────────┘   │
│                          │                                         │
│  Step 3: Create Listing                                           │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ - Set wholesalerId (from step 1)                           │   │
│  │ - Set sourceType: FACEBOOK_GROUP                           │   │
│  │ - Extract property details from request                    │   │
│  │ - Set dealStatus: NEW                                      │   │
│  └────────────────────────────────────────────────────────────┘   │
│                          │                                         │
└──────────────────────────┼─────────────────────────────────────────┘
                           │
                           │ Trigger scoring
                           │
┌──────────────────────────▼─────────────────────────────────────────┐
│                    Scoring Engine                                  │
│  - Calculate base score (50)                                       │
│  - Detect keywords → Add bonuses                                   │
│  - Calculate price ratio → Add bonus                               │
│  - Determine hotness (LOW/MEDIUM/HIGH)                             │
│  - Return scored listing                                           │
└──────────────────────────┬─────────────────────────────────────────┘
                           │
                           │ Save to database
                           │
┌──────────────────────────▼─────────────────────────────────────────┐
│                    Database (PostgreSQL)                           │
│  - Wholesaler record (created or updated)                          │
│  - WholesalerSource record (created)                               │
│  - Listing record (created with score)                             │
└──────────────────────────┬─────────────────────────────────────────┘
                           │
                           │ Return response
                           │
┌──────────────────────────▼─────────────────────────────────────────┐
│                    Client Response                                 │
│  {                                                                 │
│    "id": "listing-uuid",                                           │
│    "score": 85,                                                    │
│    "hotness": "HIGH",                                              │
│    "keywordFlags": ["cash only", "needs work"]                     │
│  }                                                                 │
└────────────────────────────────────────────────────────────────────┘
```

**Execution Steps**:

1. **Validate Input**: Check required fields (fbGroupName, headline)
2. **Find/Create Wholesaler**:
   * Search by phone or email
   * Create if not found
   * Update lastSeenAt if found
3. **Create Source Attribution**: Link wholesaler to Facebook group
4. **Create Listing**: With property details
5. **Score Listing**: Automatic scoring based on keywords and price
6. **Return Result**: Scored listing object

**Error Handling**:

* Invalid enum values → 400 Bad Request
* Missing required fields → 400 Bad Request
* Database errors → 500 Internal Server Error

***

### 2. Multi-Source Ingestion Pattern

**Common Pattern for All Sources**:

```
Input Data → Validate → Find/Create Wholesaler → Create Source → Create Listing → Score → Return
```

**Source-Specific Variations**:

| Source Type | Unique Fields | Special Processing |
|-------------|---------------|-------------------|
| FACEBOOK\_GROUP | fbGroupName, postUrl | Extract from post URL |
| INVESTOR\_WEBSITE | websiteName, externalId | Check external ID for duplicates |
| REI\_MEETUP | meetupName | Wholesaler-only (no listing) |
| WE\_BUY\_HOUSES\_SIGN | address (of sign) | Phone number is primary identifier |
| MLS\_INVESTOR\_SPECIAL | mlsId | Agent is wholesaler |
| TITLE\_COMPANY | titleCompanyName | Referral metadata |
| HARD\_MONEY\_LENDER | lenderName | Referral metadata |
| BIRD\_DOG\_REFERRAL | referredBy | Track referrer |

***

## Listing Scoring Process

### Automatic Scoring Algorithm

**Trigger**: Every time a listing is created or updated

**Flow**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Listing Data Input                               │
│  - description (text)                                               │
│  - askingPrice (number)                                             │
│  - estimatedARV (number)                                            │
│  - market (string)                                                  │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Step 1: Initialize Base Score                          │
│              baseScore = 50                                         │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Step 2: Keyword Detection                              │
│                                                                     │
│  Keywords Array = []                                                │
│  keywordBonus = 0                                                   │
│                                                                     │
│  Check description for:                                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ "cash only" OR "cash deal" → +10, add to flags              │  │
│  │ "needs work" OR "fixer upper" OR "handyman" → +10, add      │  │
│  │ "as-is" OR "as is" → +10, add                               │  │
│  │ "motivated seller" OR "must sell" → +10, add                │  │
│  │ "below market" OR "wholesale" → +10, add                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Result: keywordBonus (0-50), keywordFlags array                    │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Step 3: Price Ratio Analysis                           │
│                                                                     │
│  IF askingPrice AND estimatedARV are set:                           │
│    ratio = askingPrice / estimatedARV                               │
│                                                                     │
│    IF ratio < 0.60:   priceBonus = +20 (excellent deal)             │
│    ELSE IF ratio < 0.70: priceBonus = +15 (good deal)               │
│    ELSE IF ratio < 0.80: priceBonus = +10 (okay deal)               │
│    ELSE:              priceBonus = 0 (marginal deal)                │
│  ELSE:                                                              │
│    priceBonus = 0 (no ARV data)                                     │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Step 4: Market Bonus (Future)                          │
│                                                                     │
│  IF market in preferredMarkets:                                     │
│    marketBonus = +5                                                 │
│  ELSE:                                                              │
│    marketBonus = 0                                                  │
│                                                                     │
│  (Currently all markets treated equally)                            │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Step 5: Calculate Final Score                          │
│                                                                     │
│  finalScore = baseScore + keywordBonus + priceBonus + marketBonus   │
│                                                                     │
│  Clamp score to 0-100 range                                         │
│  finalScore = Math.min(100, Math.max(0, finalScore))                │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Step 6: Determine Hotness                              │
│                                                                     │
│  IF finalScore >= 80:   hotness = HIGH                              │
│  ELSE IF finalScore >= 60: hotness = MEDIUM                         │
│  ELSE:                  hotness = LOW                               │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Step 7: Return Scored Data                             │
│  {                                                                  │
│    score: finalScore,                                               │
│    hotness: hotness,                                                │
│    keywordFlags: keywordsArray                                      │
│  }                                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

**Example Calculation**:

**Input**:

```json
{
  "description": "Cash only investor special. Needs work. Motivated seller!",
  "askingPrice": 100000,
  "estimatedARV": 200000
}
```

**Processing**:

* Base score: 50
* Keywords detected:
  * "cash only" → +10
  * "needs work" → +10
  * "motivated seller" → +10
  * Total keyword bonus: +30
* Price ratio: 100000/200000 = 0.50
  * Ratio \&lt; 0.60 → +20
* Market bonus: 0 (no preferred market set)

**Final Score**: 50 + 30 + 20 = 100
**Hotness**: HIGH
**Keyword Flags**: \["cash only", "needs work", "motivated seller"]

***

## Wholesaler Management Workflows

### Creating a Wholesaler with Multiple Sources

```
┌─────────────┐
│  Client     │
└──────┬──────┘
       │
       │ 1. Create wholesaler
       │
┌──────▼──────────────────────────────────────────────────────────────┐
│ POST /api/wholesalers                                               │
│ {                                                                   │
│   "fullName": "John Smith",                                         │
│   "primaryPhone": "+1-813-555-1234",                                │
│   "markets": ["Tampa, FL"]                                          │
│ }                                                                   │
└──────┬──────────────────────────────────────────────────────────────┘
       │
       │ Returns: wholesaler object with ID
       │
┌──────▼──────────────────────────────────────────────────────────────┐
│  Wholesaler Created                                                 │
│  ID: abc-123                                                        │
└──────┬──────────────────────────────────────────────────────────────┘
       │
       │ 2. Add first source (Facebook)
       │
┌──────▼──────────────────────────────────────────────────────────────┐
│ POST /api/wholesalers/abc-123/sources                               │
│ {                                                                   │
│   "sourceType": "FACEBOOK_GROUP",                                   │
│   "sourceName": "Tampa Real Estate Investors",                      │
│   "contactMethod": "DM"                                             │
│ }                                                                   │
└──────┬──────────────────────────────────────────────────────────────┘
       │
       │ 3. Add second source (REIA Meetup)
       │
┌──────▼──────────────────────────────────────────────────────────────┐
│ POST /api/wholesalers/abc-123/sources                               │
│ {                                                                   │
│   "sourceType": "REI_MEETUP",                                       │
│   "sourceName": "Tampa REIA Monthly",                               │
│   "contactMethod": "IN_PERSON"                                      │
│ }                                                                   │
└──────┬──────────────────────────────────────────────────────────────┘
       │
       │ 4. Retrieve wholesaler with all sources
       │
┌──────▼──────────────────────────────────────────────────────────────┐
│ GET /api/wholesalers/abc-123                                        │
│                                                                     │
│ Returns:                                                            │
│ {                                                                   │
│   "id": "abc-123",                                                  │
│   "fullName": "John Smith",                                         │
│   "sources": [                                                      │
│     {                                                               │
│       "sourceType": "FACEBOOK_GROUP",                               │
│       "sourceName": "Tampa Real Estate Investors"                   │
│     },                                                              │
│     {                                                               │
│       "sourceType": "REI_MEETUP",                                   │
│       "sourceName": "Tampa REIA Monthly"                            │
│     }                                                               │
│   ]                                                                 │
│ }                                                                   │
└─────────────────────────────────────────────────────────────────────┘
```

***

## Zillow CSV Import Process

### Complete Import Workflow

**Endpoint**: `POST /api/zillow/upload`

```
┌─────────────────────┐
│  User Prepares CSV  │
│  File Locally       │
└──────────┬──────────┘
           │
           │ Upload file via multipart/form-data
           │
┌──────────▼──────────────────────────────────────────────────────────┐
│             Zillow Ingest Route Handler                             │
│  - Receive file upload (multer middleware)                          │
│  - Validate file exists and is CSV                                  │
└──────────┬──────────────────────────────────────────────────────────┘
           │
           │ Pass file buffer to service
           │
┌──────────▼──────────────────────────────────────────────────────────┐
│          Zillow Ingestion Service: processCSV()                     │
│                                                                     │
│  Step 1: Parse CSV                                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ - Use csv-parse library                                     │  │
│  │ - Convert to array of objects                               │  │
│  │ - Validate required columns (address, city, state, zip)     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Step 2: Process Each Row                                          │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ FOR EACH row in CSV:                                         │  │
│  │                                                              │  │
│  │   2a. Check for Duplicates                                  │  │
│  │   ┌──────────────────────────────────────────────────────┐  │  │
│  │   │ - Check if listing exists by URL                     │  │  │
│  │   │ - OR by address + city + state                       │  │  │
│  │   │ - If exists: Update existing listing                 │  │  │
│  │   │ - If not: Continue to create new                     │  │  │
│  │   └──────────────────────────────────────────────────────┘  │  │
│  │                                                              │  │
│  │   2b. Extract Property Details                              │  │
│  │   ┌──────────────────────────────────────────────────────┐  │  │
│  │   │ - Parse address, city, state, zip                    │  │  │
│  │   │ - Parse price, beds, baths, sqft, yearBuilt          │  │  │
│  │   │ - Parse description, daysOnZillow, status            │  │  │
│  │   └──────────────────────────────────────────────────────┘  │  │
│  │                                                              │  │
│  │   2c. Apply Zillow-Specific Scoring                         │  │
│  │   ┌──────────────────────────────────────────────────────┐  │  │
│  │   │ baseScore = 50                                        │  │  │
│  │   │                                                       │  │  │
│  │   │ Keyword Detection (+20 each):                        │  │  │
│  │   │ - "fixer", "needs work", "handyman"                  │  │  │
│  │   │ - "cash only", "investor"                            │  │  │
│  │   │ - "as-is", "distressed"                              │  │  │
│  │   │ - "motivated seller", "must sell"                    │  │  │
│  │   │                                                       │  │  │
│  │   │ Stale Listing Bonus:                                 │  │  │
│  │   │ - IF daysOnZillow > 30: +10                          │  │  │
│  │   │                                                       │  │  │
│  │   │ Price Bonus:                                         │  │  │
│  │   │ - IF price < $150,000: +20                           │  │  │
│  │   │                                                       │  │  │
│  │   │ Retail Penalty:                                      │  │  │
│  │   │ - "turnkey", "new construction": -20                 │  │  │
│  │   └──────────────────────────────────────────────────────┘  │  │
│  │                                                              │  │
│  │   2d. Create/Update Listing                                 │  │
│  │   ┌──────────────────────────────────────────────────────┐  │  │
│  │   │ - sourceType: ZILLOW_EXPORT                          │  │  │
│  │   │ - sourceName: "Zillow CSV Import"                    │  │  │
│  │   │ - Set all property details                           │  │  │
│  │   │ - Set calculated score and hotness                   │  │  │
│  │   └──────────────────────────────────────────────────────┘  │  │
│  │                                                              │  │
│  │   2e. Track Results                                         │  │
│  │   ┌──────────────────────────────────────────────────────┐  │  │
│  │   │ - Increment inserted/updated counter                 │  │  │
│  │   │ - Add to highScoringListings if score >= 70          │  │  │
│  │   │ - Catch and log errors                               │  │  │
│  │   └──────────────────────────────────────────────────────┘  │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Step 3: Compile Results                                           │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ - Sort highScoringListings by score (descending)            │  │
│  │ - Return summary: totalRows, inserted, updated, errors      │  │
│  └──────────────────────────────────────────────────────────────┘  │
└──────────┬──────────────────────────────────────────────────────────┘
           │
           │ Return results
           │
┌──────────▼──────────────────────────────────────────────────────────┐
│                   Client Response                                   │
│  {                                                                  │
│    "message": "CSV ingestion complete",                             │
│    "result": {                                                      │
│      "totalRows": 100,                                              │
│      "inserted": 95,                                                │
│      "updated": 5,                                                  │
│      "skipped": 0,                                                  │
│      "errors": [],                                                  │
│      "highScoringListings": [                                       │
│        {                                                            │
│          "address": "123 Main St",                                  │
│          "city": "Tampa",                                           │
│          "state": "FL",                                             │
│          "score": 90,                                               │
│          "price": 95000                                             │
│        }                                                            │
│      ]                                                              │
│    }                                                                │
│  }                                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

**Error Scenarios**:

* **Invalid CSV format**: Return 400 with error details
* **Missing required columns**: Skip row, add to errors array
* **Database errors**: Skip row, add to errors array, continue processing
* **Duplicate URL/address**: Update existing listing instead of creating

***

## Deal Lifecycle Management

### Status Progression Flow

```
       NEW
        │
        │ User reviews listing
        ▼
   UNDER_REVIEW
        │
        │ User contacts wholesaler
        ▼
    CONTACTED
        │
        ├──────────► DEAD (Deal fell through)
        │
        │ Agreement reached
        ▼
 UNDER_CONTRACT
        │
        ├──────────► DEAD (Deal fell through)
        │
        │ Transaction completes
        ▼
      CLOSED
```

**Status Update Process**:

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ PATCH /api/listings/{id}
       │ { "dealStatus": "CONTACTED" }
       │
┌──────▼──────────────────────────────────────────────────────────────┐
│              Listing Service: updateListing()                       │
│                                                                     │
│  1. Validate new status (must be valid DealStatus enum)             │
│  2. Update listing.dealStatus                                       │
│  3. Update listing.updatedAt timestamp                              │
│  4. Optionally log status change to ContactInteraction table        │
│  5. Return updated listing                                          │
└──────┬──────────────────────────────────────────────────────────────┘
       │
       │ Success response
       │
┌──────▼──────────────────────────────────────────────────────────────┐
│  Updated Listing                                                    │
│  {                                                                  │
│    "id": "listing-123",                                             │
│    "dealStatus": "CONTACTED",                                       │
│    "updatedAt": "2024-11-22T15:30:00Z"                              │
│  }                                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

***

## Search and Filtering Flow

### Complex Query Processing

**Request**: `GET /api/listings?market=Tampa&hotness=HIGH&minScore=80&dealStatus=NEW`

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ GET request with query parameters
       │
┌──────▼──────────────────────────────────────────────────────────────┐
│            Listing Route Handler                                    │
│                                                                     │
│  1. Parse Query Parameters                                          │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ market: "Tampa"                                              │  │
│  │ hotness: "HIGH"                                              │  │
│  │ minScore: 80                                                 │  │
│  │ dealStatus: "NEW"                                            │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  2. Validate Parameters                                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ - Verify enum values are valid                               │  │
│  │ - Ensure numbers are valid                                   │  │
│  │ - Return 400 if invalid                                      │  │
│  └──────────────────────────────────────────────────────────────┘  │
└──────┬──────────────────────────────────────────────────────────────┘
       │
       │ Pass to service
       │
┌──────▼──────────────────────────────────────────────────────────────┐
│            Listing Service: getListings()                           │
│                                                                     │
│  3. Build Prisma Query                                              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ const where = {                                              │  │
│  │   market: { contains: "Tampa", mode: "insensitive" },        │  │
│  │   hotness: "HIGH",                                           │  │
│  │   score: { gte: 80 },                                        │  │
│  │   dealStatus: "NEW"                                          │  │
│  │ };                                                           │  │
│  │                                                              │  │
│  │ const listings = await prisma.listing.findMany({            │  │
│  │   where,                                                     │  │
│  │   orderBy: { score: 'desc' },                               │  │
│  │   include: {                                                 │  │
│  │     wholesaler: {                                            │  │
│  │       select: { id: true, fullName: true }                  │  │
│  │     }                                                        │  │
│  │   }                                                          │  │
│  │ });                                                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
└──────┬──────────────────────────────────────────────────────────────┘
       │
       │ Execute query
       │
┌──────▼──────────────────────────────────────────────────────────────┐
│                  PostgreSQL Database                                │
│                                                                     │
│  Executes optimized query using indexes:                            │
│  - Index on market column                                           │
│  - Index on hotness column                                          │
│  - Index on score column                                            │
│  - Index on dealStatus column                                       │
│                                                                     │
│  Returns matching rows (e.g., 15 listings)                          │
└──────┬──────────────────────────────────────────────────────────────┘
       │
       │ Format and return
       │
┌──────▼──────────────────────────────────────────────────────────────┐
│                  Client Response                                    │
│  [                                                                  │
│    {                                                                │
│      "id": "abc-123",                                               │
│      "headline": "3/2 Fixer Upper - Cash Only",                     │
│      "market": "Tampa, FL",                                         │
│      "score": 90,                                                   │
│      "hotness": "HIGH",                                             │
│      "dealStatus": "NEW",                                           │
│      "wholesaler": {                                                │
│        "id": "xyz-789",                                             │
│        "fullName": "John Smith"                                     │
│      }                                                              │
│    },                                                               │
│    ...                                                              │
│  ]                                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

**Performance Optimization**:

* All filter columns are indexed
* Query returns only needed fields
* Ordering by indexed column (score)
* Efficient JOIN with wholesaler table

***

## Data Synchronization Processes

### Wholesaler Metrics Update

**Trigger**: When a listing is created or deleted

```
┌─────────────────────────────────────────────────────────────────────┐
│              Event: Listing Created/Deleted                         │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│         Update Wholesaler.totalListingsTracked                      │
│                                                                     │
│  1. Get current count of listings for wholesaler                    │
│     const count = await prisma.listing.count({                      │
│       where: { wholesalerId: wholesaler.id }                        │
│     });                                                             │
│                                                                     │
│  2. Update wholesaler record                                        │
│     await prisma.wholesaler.update({                                │
│       where: { id: wholesaler.id },                                 │
│       data: { totalListingsTracked: count }                         │
│     });                                                             │
└─────────────────────────────────────────────────────────────────────┘
```

### LastSeenAt Timestamp Update

**Trigger**: Any interaction with wholesaler or their listing

```
Interaction → Update wholesaler.lastSeenAt → Current timestamp
```

***

## Error Handling Flows

### Request Validation Error

```
Client Request
    │
    ├── Invalid JSON → 400 Bad Request
    ├── Missing required field → 400 Bad Request
    ├── Invalid enum value → 400 Bad Request
    ├── Type mismatch → 400 Bad Request
    └── Valid → Proceed to service
```

### Database Error Handling

```
Service Layer
    │
    ├── Prisma Query
    │     │
    │     ├── Foreign key violation → 400 Bad Request
    │     ├── Unique constraint violation → 409 Conflict
    │     ├── Connection error → 500 Internal Server Error
    │     └── Success → Return data
    │
    └── Error logged to console/monitoring
```

### Ingestion Error Resilience

**CSV Import Error Handling**:

```
FOR EACH row in CSV:
    TRY:
        Process row
        Create/update listing
        Increment success counter
    CATCH error:
        Log error with row number
        Add to errors array
        Continue to next row (don't fail entire import)

Return summary with:
    - Successful rows
    - Failed rows
    - Error details
```

***

## Subprocess Execution Guide

### How to Execute: Craigslist Scraper

**Location**: `craigslist/craigslist_scraper.py`

**Prerequisites**:

```bash
pip install requests beautifulsoup4 pyyaml
```

**Configuration**:

```bash
cd craigslist
cp config_example.yaml craigslist-config.yaml
# Edit craigslist-config.yaml
```

**Execution**:

```bash
python craigslist_scraper.py
```

**Output**: Creates `craigslist_listings.csv`

**Import to Database**:

```bash
curl -X POST http://localhost:3000/api/zillow/upload \
  -F "file=@craigslist_listings.csv"
```

***

### How to Execute: Database Backup

**Manual Backup**:

```bash
# PostgreSQL dump
pg_dump -h localhost -U devuser -d birddogger > backup.sql

# Compressed backup
pg_dump -h localhost -U devuser -d birddogger | gzip > backup.sql.gz
```

**Automated Backup Script** (`scripts/backup.sh`):

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

pg_dump -h localhost -U devuser -d birddogger | \
  gzip > $BACKUP_DIR/birddogger_$DATE.sql.gz

echo "Backup created: $BACKUP_DIR/birddogger_$DATE.sql.gz"
```

**Run Backup**:

```bash
chmod +x scripts/backup.sh
./scripts/backup.sh
```

***

### How to Execute: Data Seeding

**Create Seed Script** (`scripts/seed.ts`):

```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Create test wholesalers
  const wholesaler = await prisma.wholesaler.create({
    data: {
      fullName: 'Test Wholesaler',
      primaryPhone: '+1-813-555-0000',
      markets: ['Tampa, FL'],
    },
  });

  // Create test listings
  await prisma.listing.create({
    data: {
      wholesalerId: wholesaler.id,
      sourceType: 'FACEBOOK_GROUP',
      sourceName: 'Test Group',
      headline: 'Test Listing',
      city: 'Tampa',
      state: 'FL',
    },
  });

  console.log('Seed data created!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Execute Seeding**:

```bash
npx ts-node scripts/seed.ts
```

***

### How to Execute: Database Reset

**Reset and Re-migrate**:

```bash
# WARNING: This deletes all data!
npx prisma migrate reset --force
```

**Steps Performed**:

1. Drop all tables
2. Run all migrations from scratch
3. Optionally run seed script

***

## Summary

This document covered the major application flows including:

* ✅ Multi-source deal ingestion patterns
* ✅ Automatic scoring algorithm details
* ✅ Wholesaler management workflows
* ✅ Zillow CSV import processing
* ✅ Deal lifecycle management
* ✅ Search and filtering mechanics
* ✅ Data synchronization processes
* ✅ Error handling strategies
* ✅ Subprocess execution guides

For implementation details, refer to the source code in:

* [src/services/](../../../src/services/)
* [src/routes/](../../../src/routes/)
* [src/utils/](../../../src/utils/)
