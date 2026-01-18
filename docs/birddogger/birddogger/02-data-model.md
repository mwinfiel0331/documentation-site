# BirdDogger - Data Model Documentation

## Overview

The BirdDogger data model is designed to track real estate wholesalers, their property listings, source attribution, media assets, and communication history. The schema uses PostgreSQL with Prisma ORM for type-safe database access.

## Entity-Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         WHOLESALER                                  │
│─────────────────────────────────────────────────────────────────────│
│ PK │ id (UUID)                                                      │
│    │ createdAt (DateTime)                                           │
│    │ updatedAt (DateTime)                                           │
│    │ fullName (String?)                                             │
│    │ companyName (String?)                                          │
│    │ primaryEmail (String?)                                         │
│    │ primaryPhone (String?)                                         │
│    │ websiteUrl (String?)                                           │
│    │ notes (Text?)                                                  │
│    │ markets (String[])                                             │
│    │ isActive (Boolean) = true                                      │
│    │ totalListingsTracked (Int) = 0                                 │
│    │ totalDealsClosedEstimate (Int) = 0                             │
│    │ avgAssignmentFeeEstimate (Decimal?)                            │
│    │ lastSeenAt (DateTime?)                                         │
└──┬──────────────────────────────────────────────────────────────────┘
   │
   │ 1:N
   │
   ├─────────────────────────────────────────────────────────────────┐
   │                                                                 │
   │                                                                 │
┌──▼──────────────────────────┐  ┌──▼──────────────────────────┐  ┌▼───────────────────────┐
│   WHOLESALER SOURCE         │  │        LISTING              │  │  CONTACT INTERACTION   │
│─────────────────────────────│  │─────────────────────────────│  │────────────────────────│
│ PK │ id (UUID)              │  │ PK │ id (UUID)              │  │ PK │ id (UUID)         │
│ FK │ wholesalerId           │  │ FK │ wholesalerId?          │  │ FK │ wholesalerId?     │
│    │ createdAt              │  │    │ createdAt              │  │    │ createdAt         │
│    │ updatedAt              │  │    │ updatedAt              │  │    │ channel           │
│    │ sourceType (Enum)      │  │    │ sourceType (Enum)      │  │    │ direction         │
│    │ sourceName             │  │    │ sourceName             │  │    │ summary           │
│    │ sourceDetails?         │  │    │ sourceUrl?             │  │    │ occurredAt        │
│    │ sourceUrl?             │  │    │ externalId?            │  │ FK │ listingId?        │
│    │ firstContactDate?      │  │    │ headline               │  └────────────────────────┘
│    │ lastContactDate?       │  │    │ description?           │
│    │ contactMethod?         │  │    │ addressLine1?          │
└─────────────────────────────┘  │    │ city?                  │
                                 │    │ state?                 │
                                 │    │ zip?                   │
                                 │    │ latitude?              │
                                 │    │ longitude?             │
                                 │    │ bedrooms?              │
                                 │    │ bathrooms?             │
                                 │    │ sqft?                  │
                                 │    │ yearBuilt?             │
                                 │    │ askingPrice?           │
                                 │    │ estimatedARV?          │
                                 │    │ estimatedRepairs?      │
                                 │    │ assignmentFee?         │
                                 │    │ dealStatus (Enum)      │
                                 │    │ myRole (Enum)          │
                                 │    │ score (Int) = 0        │
                                 │    │ hotness (Enum)         │
                                 │    │ keywordFlags[]         │
                                 │    │ market?                │
                                 └──┬─────────────────────────┘
                                    │
                                    │ 1:N
                                    │
                                 ┌──▼─────────────────────────┐
                                 │    LISTING MEDIA           │
                                 │────────────────────────────│
                                 │ PK │ id (UUID)             │
                                 │ FK │ listingId             │
                                 │    │ createdAt             │
                                 │    │ mediaType (Enum)      │
                                 │    │ url                   │
                                 │    │ caption?              │
                                 └────────────────────────────┘
```

## Relational Diagram with Cardinality

```
WHOLESALER ─────1:N─────> WHOLESALER_SOURCE
    │
    ├─────────1:N─────> LISTING
    │                      │
    │                      └─────1:N─────> LISTING_MEDIA
    │
    └─────────1:N─────> CONTACT_INTERACTION
                             │
    LISTING ─────1:N─────────┘
```

## Table Specifications

### 1. Wholesaler Table

**Purpose**: Store real estate wholesaler contact information and performance metrics.

| Column Name | Type | Nullable | Default | Description |
|------------|------|----------|---------|-------------|
| id | UUID | No | uuid() | Primary key |
| createdAt | DateTime | No | now() | Record creation timestamp |
| updatedAt | DateTime | No | now() | Last update timestamp |
| fullName | String | Yes | NULL | Wholesaler's full name |
| companyName | String | Yes | NULL | Business/company name |
| primaryEmail | String | Yes | NULL | Primary email address |
| primaryPhone | String | Yes | NULL | Primary phone number |
| websiteUrl | String | Yes | NULL | Business website URL |
| notes | Text | Yes | NULL | Free-form notes |
| markets | String\[] | No | \[] | Array of markets (e.g., "Tampa, FL") |
| isActive | Boolean | No | true | Active status flag |
| totalListingsTracked | Integer | No | 0 | Count of listings from this wholesaler |
| totalDealsClosedEstimate | Integer | No | 0 | Estimated number of closed deals |
| avgAssignmentFeeEstimate | Decimal(10,2) | Yes | NULL | Average estimated assignment fee |
| lastSeenAt | DateTime | Yes | NULL | Last activity timestamp |

**Indexes:**

* `primaryPhone` - For fast phone lookup
* `primaryEmail` - For fast email lookup
* `isActive` - For filtering active wholesalers

**Business Rules:**

* Either `fullName` or `companyName` should be provided
* `markets` array can contain multiple markets for multi-market wholesalers
* `totalListingsTracked` auto-increments when listings are added
* `isActive = false` represents soft delete

### 2. WholesalerSource Table

**Purpose**: Track how and where a wholesaler was discovered (multi-source attribution).

| Column Name | Type | Nullable | Default | Description |
|------------|------|----------|---------|-------------|
| id | UUID | No | uuid() | Primary key |
| createdAt | DateTime | No | now() | Record creation timestamp |
| updatedAt | DateTime | No | now() | Last update timestamp |
| wholesalerId | UUID | No | - | Foreign key to Wholesaler |
| sourceType | SourceType | No | - | Type of source (enum) |
| sourceName | String | No | - | Specific source name |
| sourceDetails | Text | Yes | NULL | Additional details |
| sourceUrl | String | Yes | NULL | URL where found |
| firstContactDate | DateTime | Yes | NULL | Date of first contact |
| lastContactDate | DateTime | Yes | NULL | Date of last contact |
| contactMethod | ContactMethod | Yes | NULL | How they were contacted |

**Indexes:**

* `wholesalerId` - For relationship queries
* `sourceType` - For filtering by source type

**Relationships:**

* `wholesalerId` → Wholesaler.id (CASCADE delete)

**Business Rules:**

* A wholesaler can have multiple sources
* Tracks complete attribution chain
* Supports duplicate detection across sources

### 3. Listing Table

**Purpose**: Store property listing details with automatic scoring and deal tracking.

| Column Name | Type | Nullable | Default | Description |
|------------|------|----------|---------|-------------|
| id | UUID | No | uuid() | Primary key |
| createdAt | DateTime | No | now() | Record creation timestamp |
| updatedAt | DateTime | No | now() | Last update timestamp |
| wholesalerId | UUID | Yes | NULL | Foreign key to Wholesaler |
| sourceType | SourceType | No | - | Where listing originated |
| sourceName | String | No | - | Specific source name |
| sourceUrl | String | Yes | NULL | URL of original listing |
| externalId | String | Yes | NULL | External system ID |
| headline | String | No | - | Listing headline/title |
| description | Text | Yes | NULL | Full description |
| addressLine1 | String | Yes | NULL | Street address |
| city | String | Yes | NULL | City name |
| state | String | Yes | NULL | State abbreviation |
| zip | String | Yes | NULL | ZIP code |
| latitude | Float | Yes | NULL | GPS latitude |
| longitude | Float | Yes | NULL | GPS longitude |
| bedrooms | Integer | Yes | NULL | Number of bedrooms |
| bathrooms | Float | Yes | NULL | Number of bathrooms |
| sqft | Integer | Yes | NULL | Square footage |
| yearBuilt | Integer | Yes | NULL | Year built |
| askingPrice | Decimal(12,2) | Yes | NULL | Asking price |
| estimatedARV | Decimal(12,2) | Yes | NULL | After Repair Value estimate |
| estimatedRepairs | Decimal(12,2) | Yes | NULL | Estimated repair costs |
| assignmentFee | Decimal(12,2) | Yes | NULL | Wholesaler's assignment fee |
| dealStatus | DealStatus | No | NEW | Current deal status |
| myRole | MyRole | No | UNSET | User's role in deal |
| score | Integer | No | 0 | Calculated deal score (0-100) |
| hotness | Hotness | No | LOW | Deal hotness level |
| keywordFlags | String\[] | No | \[] | Detected keywords |
| market | String | Yes | NULL | Market identifier |

**Indexes:**

* `wholesalerId` - For relationship queries
* `dealStatus` - For filtering by status
* `sourceType` - For filtering by source
* `score` - For sorting by score
* `hotness` - For filtering by hotness
* `market` - For market-based queries
* `city, state` - For location queries

**Relationships:**

* `wholesalerId` → Wholesaler.id (SET NULL on delete)

**Business Rules:**

* `score` automatically calculated on create/update
* `hotness` derived from score (LOW \&lt; 60, MEDIUM 60-79, HIGH ≥ 80)
* `keywordFlags` populated by scoring engine
* `dealStatus` tracks lifecycle (NEW → UNDER\_REVIEW → CONTACTED → UNDER\_CONTRACT → CLOSED/DEAD)

### 4. ListingMedia Table

**Purpose**: Store photos, videos, and documents associated with listings.

| Column Name | Type | Nullable | Default | Description |
|------------|------|----------|---------|-------------|
| id | UUID | No | uuid() | Primary key |
| createdAt | DateTime | No | now() | Record creation timestamp |
| listingId | UUID | No | - | Foreign key to Listing |
| mediaType | MediaType | No | - | Type of media (enum) |
| url | String | No | - | Media URL or path |
| caption | String | Yes | NULL | Optional caption |

**Indexes:**

* `listingId` - For relationship queries

**Relationships:**

* `listingId` → Listing.id (CASCADE delete)

**Business Rules:**

* Multiple media items per listing
* Supports images, videos, documents, and other types
* URLs can be relative paths or full URLs

### 5. ContactInteraction Table

**Purpose**: Log all communications with wholesalers and regarding specific listings.

| Column Name | Type | Nullable | Default | Description |
|------------|------|----------|---------|-------------|
| id | UUID | No | uuid() | Primary key |
| createdAt | DateTime | No | now() | Record creation timestamp |
| wholesalerId | UUID | Yes | NULL | Foreign key to Wholesaler |
| listingId | UUID | Yes | NULL | Foreign key to Listing |
| channel | InteractionChannel | No | - | Communication channel |
| direction | InteractionDirection | No | - | Inbound or outbound |
| summary | Text | No | - | Interaction summary |
| occurredAt | DateTime | No | now() | When interaction occurred |

**Indexes:**

* `wholesalerId` - For relationship queries
* `listingId` - For relationship queries
* `occurredAt` - For chronological sorting

**Relationships:**

* `wholesalerId` → Wholesaler.id (CASCADE delete)
* `listingId` → Listing.id (CASCADE delete)

**Business Rules:**

* At least one of `wholesalerId` or `listingId` should be set
* Supports interactions about wholesaler in general or specific listings
* Tracks complete communication history

## Enumeration Types

### SourceType (10 values)

| Value | Description |
|-------|-------------|
| FACEBOOK\_GROUP | Facebook real estate groups |
| INVESTOR\_WEBSITE | Sites like MyHouseDeals, BiggerPockets |
| REI\_MEETUP | Real Estate Investment Association meetups |
| WE\_BUY\_HOUSES\_SIGN | Physical "We Buy Houses" signage |
| PUBLIC\_RECORDS\_ASSIGNMENT | Public records of assignments |
| TITLE\_COMPANY | Referrals from title companies |
| HARD\_MONEY\_LENDER | Referrals from hard money lenders |
| COUNTY\_ASSIGNMENT\_LIST | County recorded assignments |
| MLS\_INVESTOR\_SPECIAL | MLS listings tagged for investors |
| BIRD\_DOG\_REFERRAL | Referrals from bird dogs |
| ZILLOW\_EXPORT | Imported from Zillow CSV exports |

### ContactMethod (5 values)

| Value | Description |
|-------|-------------|
| DM | Direct message (social media) |
| PHONE | Phone call |
| EMAIL | Email communication |
| IN\_PERSON | Face-to-face meeting |
| OTHER | Other methods |

### DealStatus (6 values)

| Value | Description |
|-------|-------------|
| NEW | Just added to system |
| UNDER\_REVIEW | Being evaluated |
| CONTACTED | Wholesaler contacted |
| UNDER\_CONTRACT | Contract signed |
| CLOSED | Deal completed |
| DEAD | Deal fell through |

### MyRole (4 values)

| Value | Description |
|-------|-------------|
| BUYER | End buyer of property |
| WHOLESALER\_PARTNER | Co-wholesaling |
| BIRD\_DOG | Referring for fee |
| UNSET | Role not yet determined |

### Hotness (3 values)

| Value | Score Range | Description |
|-------|-------------|-------------|
| LOW | 0-59 | Marginal deal |
| MEDIUM | 60-79 | Good deal |
| HIGH | 80-100 | Excellent deal |

### MediaType (4 values)

| Value | Description |
|-------|-------------|
| IMAGE | Photo/image file |
| VIDEO | Video file |
| DOC | Document (PDF, Word, etc.) |
| OTHER | Other media types |

### InteractionChannel (6 values)

| Value | Description |
|-------|-------------|
| PHONE | Phone call |
| SMS | Text message |
| EMAIL | Email |
| DM | Direct message |
| IN\_PERSON | Face-to-face |
| OTHER | Other channels |

### InteractionDirection (2 values)

| Value | Description |
|-------|-------------|
| INBOUND | Received from wholesaler |
| OUTBOUND | Sent to wholesaler |

## Database Indexes and Performance

### Index Strategy

1. **Primary Keys**: All tables have UUID primary keys with automatic indexing
2. **Foreign Keys**: All foreign key columns are indexed for join performance
3. **Filter Columns**: Commonly filtered columns (status, hotness, market) are indexed
4. **Composite Indexes**: `city, state` composite index for location queries

### Query Performance Optimization

```sql
-- Fast wholesaler lookup by phone (indexed)
SELECT * FROM "Wholesaler" WHERE "primaryPhone" = '+1-813-555-0100';

-- Fast listing filtering (indexed columns)
SELECT * FROM "Listing" 
WHERE "hotness" = 'HIGH' 
  AND "market" = 'Tampa, FL' 
  AND "dealStatus" = 'NEW'
ORDER BY "score" DESC;

-- Fast source attribution queries (indexed)
SELECT * FROM "WholesalerSource" 
WHERE "sourceType" = 'FACEBOOK_GROUP';

-- Efficient join queries
SELECT l.*, w.* 
FROM "Listing" l
LEFT JOIN "Wholesaler" w ON l."wholesalerId" = w.id
WHERE l."score" >= 80;
```

## Data Integrity Constraints

### Cascade Rules

| Parent Table | Child Table | Delete Action |
|--------------|-------------|---------------|
| Wholesaler | WholesalerSource | CASCADE |
| Wholesaler | Listing | SET NULL |
| Wholesaler | ContactInteraction | CASCADE |
| Listing | ListingMedia | CASCADE |
| Listing | ContactInteraction | CASCADE |

### Business Logic Constraints

1. **Wholesaler**:
   * At least one contact method (phone or email) recommended
   * Markets array should not be empty for active wholesalers

2. **Listing**:
   * Score must be between 0-100
   * If ARV is set, askingPrice/ARV should be \&lt; 1.0 for good deals
   * Hotness must match score range

3. **ContactInteraction**:
   * Must reference either wholesaler or listing (or both)

## Sample Data Relationships

### Example: Complete Wholesaler Record

```typescript
{
  id: "123e4567-e89b-12d3-a456-426614174000",
  fullName: "John Smith",
  companyName: "Tampa Wholesale Deals LLC",
  primaryEmail: "john@tampawholesale.com",
  primaryPhone: "+1-813-555-0100",
  markets: ["Tampa, FL", "St. Petersburg, FL"],
  isActive: true,
  totalListingsTracked: 15,
  totalDealsClosedEstimate: 8,
  avgAssignmentFeeEstimate: 7500.00,
  
  sources: [
    {
      sourceType: "FACEBOOK_GROUP",
      sourceName: "Tampa Real Estate Investors",
      firstContactDate: "2024-01-15",
      contactMethod: "DM"
    },
    {
      sourceType: "REI_MEETUP",
      sourceName: "Tampa REIA Monthly",
      firstContactDate: "2024-03-20",
      contactMethod: "IN_PERSON"
    }
  ],
  
  listings: [
    {
      headline: "3/2 Fixer Upper - Cash Only",
      city: "Tampa",
      state: "FL",
      askingPrice: 120000,
      estimatedARV: 200000,
      score: 85,
      hotness: "HIGH",
      dealStatus: "UNDER_REVIEW",
      keywordFlags: ["cash only", "fixer upper"]
    }
  ],
  
  contactInteractions: [
    {
      channel: "PHONE",
      direction: "OUTBOUND",
      summary: "Discussed new listing at 123 Main St",
      occurredAt: "2024-11-22T10:30:00Z"
    }
  ]
}
```

## Migration History

Located in `prisma/migrations/`:

1. **20251122224831\_init**: Initial schema creation
   * Created all 5 tables
   * Defined all 8 enums
   * Set up indexes and relationships
   * Configured cascade rules

## Schema Evolution Guidelines

When modifying the schema:

1. **Never edit existing migrations** - Create new migrations
2. **Always backup production data** before migrations
3. **Test migrations in development** environment first
4. **Use Prisma migrate commands**:
   ```bash
   npx prisma migrate dev --name description_of_change
   npx prisma migrate deploy  # Production
   ```
5. **Update TypeScript types** with `npx prisma generate`
6. **Document breaking changes** in migration notes

## Data Retention Policy

* **Active Records**: Retained indefinitely
* **Soft Deleted Wholesalers**: Retained for 2 years (isActive = false)
* **Dead Deal Listings**: Retained for 1 year
* **Contact Interactions**: Retained for 3 years
* **Media Files**: Retained while listing exists

## Backup and Recovery

* **Automated Daily Backups**: PostgreSQL dump to S3
* **Point-in-Time Recovery**: Enabled for production
* **Backup Retention**: 30 days
* **Recovery Time Objective (RTO)**: \&lt; 4 hours
* **Recovery Point Objective (RPO)**: \&lt; 1 hour
