# BirdDogger - System Architecture

## Overview

BirdDogger is built as a three-tier architecture consisting of a RESTful API backend, PostgreSQL database, and optional client applications. The system is designed for modularity, scalability, and maintainability.

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Web Frontend │  │ Mobile Apps  │  │ External API Clients │  │
│  │  (Future)    │  │  (Future)    │  │  (curl, Postman)     │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│         │                  │                      │              │
└─────────┼──────────────────┼──────────────────────┼──────────────┘
          │                  │                      │
          └──────────────────┴──────────────────────┘
                             │
                    HTTPS/TLS (Production)
                             │
┌────────────────────────────┼─────────────────────────────────────┐
│                    APPLICATION LAYER                              │
│                            │                                      │
│  ┌─────────────────────────▼──────────────────────────────────┐  │
│  │              Express.js HTTP Server                         │  │
│  │                    (Port 3000)                              │  │
│  └──────────────────────────┬──────────────────────────────────┘  │
│                             │                                     │
│  ┌──────────────────────────┼──────────────────────────────────┐  │
│  │                    Middleware Stack                         │  │
│  │  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌───────────┐  │  │
│  │  │   CORS   │  │  Logger  │  │   JSON    │  │   Error   │  │  │
│  │  │  Handler │  │          │  │  Parser   │  │  Handler  │  │  │
│  │  └──────────┘  └──────────┘  └───────────┘  └───────────┘  │  │
│  └──────────────────────────┬──────────────────────────────────┘  │
│                             │                                     │
│  ┌──────────────────────────▼──────────────────────────────────┐  │
│  │                     Route Layer                              │  │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐  │  │
│  │  │ Wholesaler │  │  Listing   │  │  Ingestion Routes    │  │  │
│  │  │   Routes   │  │   Routes   │  │  (8 endpoints)       │  │  │
│  │  └─────┬──────┘  └─────┬──────┘  └──────────┬───────────┘  │  │
│  └────────┼───────────────┼────────────────────┼──────────────┘  │
│           │               │                    │                 │
│  ┌────────▼───────────────▼────────────────────▼──────────────┐  │
│  │                    Service Layer                            │  │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐  │  │
│  │  │ Wholesaler │  │  Listing   │  │  Ingestion Service   │  │  │
│  │  │  Service   │  │  Service   │  │  (Multi-source)      │  │  │
│  │  └─────┬──────┘  └─────┬──────┘  └──────────┬───────────┘  │  │
│  └────────┼───────────────┼────────────────────┼──────────────┘  │
│           │               │                    │                 │
│  ┌────────▼───────────────▼────────────────────▼──────────────┐  │
│  │                    Utility Layer                            │  │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐  │  │
│  │  │   Prisma   │  │   Scoring  │  │  Zillow Scoring      │  │  │
│  │  │   Client   │  │   Engine   │  │  Engine              │  │  │
│  │  └─────┬──────┘  └────────────┘  └──────────────────────┘  │  │
│  └────────┼──────────────────────────────────────────────────┘  │
└───────────┼───────────────────────────────────────────────────────┘
            │
            │ Prisma ORM
            │
┌───────────▼───────────────────────────────────────────────────────┐
│                       DATA LAYER                                  │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │              PostgreSQL Database (v13+)                     │  │
│  │                                                             │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐ │  │
│  │  │Wholesaler│  │Wholesaler│  │ Listing  │  │  Listing   │ │  │
│  │  │          │  │  Source  │  │          │  │   Media    │ │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────────┘ │  │
│  │                                                             │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │           ContactInteraction                          │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│                    EXTERNAL DATA SOURCES                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Facebook │  │ Investor │  │   REIA   │  │  Zillow CSV      │  │
│  │  Groups  │  │ Websites │  │  Meetups │  │  Exports         │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘  │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │   MLS    │  │  Title   │  │   Hard   │  │  Craigslist      │  │
│  │ Specials │  │Companies │  │  Money   │  │  (Scraper)       │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. Application Entry Point (`src/index.ts`)

**Responsibilities:**
- Initialize Express server
- Load environment variables
- Configure middleware stack
- Register route handlers
- Start HTTP server
- Handle graceful shutdown

**Key Technologies:**
- Express.js 5.x
- dotenv for configuration
- CORS for cross-origin requests

### 2. Route Layer

#### 2.1 Wholesaler Routes (`src/routes/wholesaler.routes.ts`)
- `POST /api/wholesalers` - Create wholesaler
- `GET /api/wholesalers` - List with filtering
- `GET /api/wholesalers/:id` - Get details
- `PATCH /api/wholesalers/:id` - Update
- `DELETE /api/wholesalers/:id` - Soft delete
- `POST /api/wholesalers/:id/sources` - Add source

#### 2.2 Listing Routes (`src/routes/listing.routes.ts`)
- `POST /api/listings` - Create listing
- `GET /api/listings` - List with filtering
- `GET /api/listings/:id` - Get details
- `PATCH /api/listings/:id` - Update
- `DELETE /api/listings/:id` - Delete
- `POST /api/listings/:id/media` - Add media

#### 2.3 Ingestion Routes (`src/routes/ingestion.routes.ts`)
- `POST /api/ingest/facebook-post`
- `POST /api/ingest/investor-website`
- `POST /api/ingest/reia-meetup`
- `POST /api/ingest/we-buy-houses-sign`
- `POST /api/ingest/mls-investor-special`
- `POST /api/ingest/title-company-referral`
- `POST /api/ingest/hard-money-lender-referral`
- `POST /api/ingest/bird-dog-referral`

#### 2.4 Zillow Ingest Routes (`src/routes/zillowIngest.routes.ts`)
- `POST /api/zillow/upload` - Upload CSV file
- `GET /api/zillow/properties` - List properties

### 3. Service Layer

#### 3.1 Wholesaler Service (`src/services/wholesaler.service.ts`)
**Business Logic:**
- Wholesaler CRUD operations
- Source attribution management
- Performance metrics calculation
- Market filtering and aggregation

**Database Operations:**
- Prisma queries for wholesalers
- Relationship management (sources, listings, interactions)
- Soft delete implementation

#### 3.2 Listing Service (`src/services/listing.service.ts`)
**Business Logic:**
- Listing CRUD operations
- Deal scoring invocation
- Media management
- Status tracking

**Database Operations:**
- Prisma queries for listings
- Complex filtering (score, hotness, market, keywords)
- Relation loading (wholesaler, media)

#### 3.3 Ingestion Service (`src/services/ingestion.service.ts`)
**Business Logic:**
- Multi-source data normalization
- Wholesaler creation or lookup
- Duplicate detection
- Automatic deal scoring

**Data Processing:**
- Parse and validate incoming data
- Extract property details
- Normalize addresses and markets
- Set source attribution

#### 3.4 Zillow Ingestion Service (`src/services/zillowIngestion.service.ts`)
**Business Logic:**
- CSV parsing and validation
- Zillow-specific data transformation
- Zillow scoring algorithm
- Batch property creation

### 4. Utility Layer

#### 4.1 Prisma Client (`src/utils/prisma.ts`)
**Responsibilities:**
- Singleton Prisma client instance
- Connection pool management
- Transaction support
- Query optimization

#### 4.2 Scoring Engine (`src/utils/scoring.ts`)
**Algorithm:**
```typescript
Score (0-100) = baseScore + keywordBonus + priceRatioBonus + marketBonus

- baseScore = 50 (all deals start here)
- keywordBonus: +10 per high-value keyword (cash only, needs work, etc.)
- priceRatioBonus: Based on askingPrice/ARV ratio
  - < 0.60: +20 points (excellent deal)
  - 0.60-0.70: +15 points (good deal)
  - 0.70-0.80: +10 points (okay deal)
  - > 0.80: 0 points (marginal deal)
- marketBonus: +5 for preferred markets

Hotness Classification:
- LOW: score < 60
- MEDIUM: 60 ≤ score < 80
- HIGH: score ≥ 80
```

**Keyword Detection:**
- "cash only", "cash deal"
- "needs work", "fixer upper", "handyman special"
- "as-is", "as is"
- "motivated seller", "must sell"
- "below market", "wholesale"

#### 4.3 Zillow Scoring Engine (`src/utils/zillowScoring.ts`)
**Zillow-Specific Scoring:**
- Emphasizes property characteristics from Zillow data
- Factors in Zestimate vs asking price
- Considers days on market
- Property type weighting

### 5. Data Layer (Prisma + PostgreSQL)

**Models:**
- Wholesaler (contacts and performance)
- WholesalerSource (attribution)
- Listing (property details and scoring)
- ListingMedia (photos, videos, documents)
- ContactInteraction (communication history)

**Enums:**
- SourceType (10 values)
- ContactMethod (5 values)
- DealStatus (6 values)
- MyRole (4 values)
- Hotness (3 values)
- MediaType (4 values)
- InteractionChannel (6 values)
- InteractionDirection (2 values)

## Data Flow Diagrams

### Deal Ingestion Flow

```
┌─────────────┐
│  External   │
│   Source    │
│ (Facebook,  │
│  Website,   │
│  etc.)      │
└──────┬──────┘
       │
       │ HTTP POST
       │
┌──────▼─────────────────────────────────────────────────────┐
│              Ingestion Route Handler                       │
│  - Validate request body                                   │
│  - Extract source information                              │
└──────┬─────────────────────────────────────────────────────┘
       │
       │ Call service
       │
┌──────▼─────────────────────────────────────────────────────┐
│              Ingestion Service                             │
│  Step 1: Find or create wholesaler                         │
│  Step 2: Extract property details                          │
│  Step 3: Normalize address and market                      │
│  Step 4: Create listing record                             │
└──────┬─────────────────────────────────────────────────────┘
       │
       │ Trigger scoring
       │
┌──────▼─────────────────────────────────────────────────────┐
│              Scoring Engine                                │
│  Step 1: Calculate base score (50)                         │
│  Step 2: Add keyword bonuses                               │
│  Step 3: Add price ratio bonus                             │
│  Step 4: Add market bonus                                  │
│  Step 5: Determine hotness (LOW/MEDIUM/HIGH)               │
└──────┬─────────────────────────────────────────────────────┘
       │
       │ Save to database
       │
┌──────▼─────────────────────────────────────────────────────┐
│              Prisma ORM                                    │
│  - Insert listing record                                   │
│  - Update wholesaler metrics                               │
│  - Create source attribution                               │
└──────┬─────────────────────────────────────────────────────┘
       │
       │ Store data
       │
┌──────▼─────────────────────────────────────────────────────┐
│              PostgreSQL Database                           │
│  - Listings table                                          │
│  - Wholesalers table                                       │
│  - WholesalerSource table                                  │
└────────────────────────────────────────────────────────────┘
```

### Listing Retrieval Flow

```
┌─────────────┐
│   Client    │
│ Application │
└──────┬──────┘
       │
       │ GET /api/listings?market=Tampa&hotness=HIGH
       │
┌──────▼─────────────────────────────────────────────────────┐
│              Listing Route Handler                         │
│  - Parse query parameters                                  │
│  - Validate filters                                        │
└──────┬─────────────────────────────────────────────────────┘
       │
       │ Call service
       │
┌──────▼─────────────────────────────────────────────────────┐
│              Listing Service                               │
│  - Build Prisma query with filters                         │
│  - Apply pagination                                        │
│  - Include relations (wholesaler, media)                   │
└──────┬─────────────────────────────────────────────────────┘
       │
       │ Execute query
       │
┌──────▼─────────────────────────────────────────────────────┐
│              Prisma ORM                                    │
│  - Generate SQL query                                      │
│  - Use indexes for performance                             │
│  - Fetch related data                                      │
└──────┬─────────────────────────────────────────────────────┘
       │
       │ Query database
       │
┌──────▼─────────────────────────────────────────────────────┐
│              PostgreSQL Database                           │
│  - Execute indexed query                                   │
│  - Join related tables                                     │
│  - Return result set                                       │
└──────┬─────────────────────────────────────────────────────┘
       │
       │ Return data
       │
┌──────▼─────────────────────────────────────────────────────┐
│              Listing Service                               │
│  - Format response                                         │
│  - Apply any business logic                                │
└──────┬─────────────────────────────────────────────────────┘
       │
       │ JSON response
       │
┌──────▼─────────────────────────────────────────────────────┐
│              Listing Route Handler                         │
│  - Set HTTP status                                         │
│  - Send JSON response                                      │
└──────┬─────────────────────────────────────────────────────┘
       │
       │ HTTP 200 + JSON
       │
┌──────▼──────┐
│   Client    │
│ Application │
└─────────────┘
```

## Technology Stack

### Backend Runtime
- **Node.js 18+**: JavaScript runtime
- **TypeScript 5.9+**: Type-safe JavaScript
- **Express 5.x**: Web application framework

### Database
- **PostgreSQL 13+**: Primary data store
- **Prisma 5.22**: ORM and migration tool

### Development Tools
- **ts-node-dev**: Development server with hot reload
- **ESLint 9**: Code quality and linting
- **Docker Compose**: Local development environment

### Supporting Libraries
- **dotenv**: Environment variable management
- **cors**: Cross-origin resource sharing
- **zod**: Runtime type validation
- **multer**: File upload handling
- **csv-parse**: CSV parsing for imports

### Python Tools (Scrapers)
- **Python 3.8+**: Script runtime
- **requests**: HTTP client
- **BeautifulSoup4**: HTML parsing
- **PyYAML**: Configuration management

## Deployment Architecture (Production)

```
                    ┌─────────────────┐
                    │   Load Balancer │
                    │    (AWS ALB)    │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
    ┌─────────▼─────────┐         ┌────────▼────────┐
    │   API Server 1    │         │   API Server 2  │
    │  (ECS/Fargate)    │         │  (ECS/Fargate)  │
    └─────────┬─────────┘         └────────┬────────┘
              │                             │
              └──────────────┬──────────────┘
                             │
                    ┌────────▼────────┐
                    │   PostgreSQL    │
                    │   (AWS RDS)     │
                    │   Multi-AZ      │
                    └─────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Backup Storage │
                    │   (S3 Bucket)   │
                    └─────────────────┘
```

### Scalability Considerations

1. **Horizontal Scaling**: Stateless API design allows multiple instances
2. **Database Connection Pooling**: Prisma manages connections efficiently
3. **Read Replicas**: Future support for read-heavy workloads
4. **Caching Layer**: Redis/ElastiCache for frequently accessed data (future)
5. **CDN**: CloudFront for static assets (future)

### High Availability

1. **Multi-AZ Database**: Automatic failover for database
2. **Health Checks**: ALB monitors API server health
3. **Auto-scaling**: Scale API servers based on CPU/memory
4. **Backup Strategy**: Daily automated backups to S3
5. **Monitoring**: CloudWatch for metrics and alerts

## Security Architecture

### API Security
- **HTTPS/TLS**: All production traffic encrypted
- **CORS**: Configured allowed origins
- **Input Validation**: Zod schemas for request validation
- **SQL Injection Prevention**: Prisma parameterized queries
- **Rate Limiting**: Future implementation (express-rate-limit)

### Data Security
- **Environment Variables**: Secrets stored in .env (not committed)
- **Database Encryption**: At-rest encryption in RDS
- **Backup Encryption**: S3 bucket encryption
- **Access Control**: IAM roles for AWS resources

### Monitoring and Logging
- **Request Logging**: All API requests logged
- **Error Tracking**: Centralized error logging
- **Audit Trail**: ContactInteraction table tracks user actions
- **Performance Metrics**: Response time tracking

## Future Architecture Enhancements

### Phase 2
- Authentication service (JWT-based)
- Background job processing (Bull + Redis)
- WebSocket support for real-time notifications
- Message queue for async operations (SQS)

### Phase 3
- Microservices architecture (separate services for scoring, ingestion)
- Event-driven architecture (EventBridge)
- GraphQL API layer
- Service mesh (Istio) for inter-service communication
