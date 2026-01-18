# MyNextHome - System Architecture

## Table of Contents

* [High-Level Architecture](#high-level-architecture)
* [Component Overview](#component-overview)
* [Technology Stack](#technology-stack)
* [Architecture Patterns](#architecture-patterns)
* [Infrastructure](#infrastructure)
* [Security Architecture](#security-architecture)

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          External Data Sources                       │
├─────────────────────────────────────────────────────────────────────┤
│  • Redfin Data Center (CSV Downloads)                               │
│  • US Census Bureau ACS API                                         │
│  • Future: Zillow, Realtor.com, Walk Score, Crime Data             │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│                          ETL Pipeline Layer                          │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │  Redfin ETL      │  │  Census ETL      │  │  Score ETL       │ │
│  │  - Parse CSVs    │  │  - API Fetch     │  │  - Calculate     │ │
│  │  - Map Geos      │  │  - Map Geos      │  │  - Normalize     │ │
│  │  - Load Metrics  │  │  - Load Demos    │  │  - Persist       │ │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘ │
│                            │                                         │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Job Scheduler (BullMQ / Cron)                               │  │
│  │  - Daily: Redfin ETL (2 AM)                                  │  │
│  │  - Monthly: Census ETL (1st of month)                        │  │
│  │  - Daily: Investment Scores (4 AM)                           │  │
│  └──────────────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         Data Storage Layer                           │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  PostgreSQL Database (Prisma ORM)                            │  │
│  │                                                               │  │
│  │  Dimensions:                                                  │  │
│  │  • dim_geography (nation, state, MSA, county, city, ZIP)     │  │
│  │  • dim_date (time dimension)                                 │  │
│  │                                                               │  │
│  │  Facts:                                                       │  │
│  │  • fact_market_metrics (prices, inventory, sales)            │  │
│  │  • fact_demographics (population, income, housing)           │  │
│  │  • fact_investment_score (calculated scores)                 │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Future: Redis Cache                                         │  │
│  │  • API response caching                                      │  │
│  │  • Session storage                                           │  │
│  │  • Job queue backend                                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│                        Application Layer                             │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  REST API (Fastify)                                          │  │
│  │                                                               │  │
│  │  Routes:                                                      │  │
│  │  • GET /health                                               │  │
│  │  • GET /markets/top                                          │  │
│  │  • GET /markets/:id/timeseries                               │  │
│  │  • GET /markets/:id/profile                                  │  │
│  │  • GET /markets/compare                                      │  │
│  │                                                               │  │
│  │  Middleware:                                                  │  │
│  │  • CORS                                                       │  │
│  │  • Rate Limiting                                             │  │
│  │  • Request Validation                                        │  │
│  │  • Error Handling                                            │  │
│  │  • Logging                                                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Future: GraphQL API                                         │  │
│  │  • Flexible queries                                          │  │
│  │  • Type-safe schema                                          │  │
│  │  • Real-time subscriptions                                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│                       Client Applications                            │
├─────────────────────────────────────────────────────────────────────┤
│  • Future: React/Next.js Web App                                    │
│  • Future: iOS Native App                                           │
│  • Future: Android Native App                                       │
│  • API Consumers (Third-Party Integrations)                         │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Overview

### 1. ETL Pipeline Components

#### Redfin Market Metrics ETL

**Purpose**: Ingest and process market statistics from Redfin CSV files

**Responsibilities**:

* Read CSV files from configured directory
* Parse market data (prices, inventory, days on market, etc.)
* Create or update geography records (state, county, city, ZIP)
* Upsert market metrics with deduplication
* Handle multiple geography levels and period types

**Key Features**:

* Idempotent operations (safe to re-run)
* Batch processing for efficiency
* Comprehensive error handling
* Progress logging

**Location**: `backend/src/etl/redfin_market_metrics.ts`

#### Census Demographics ETL

**Purpose**: Fetch and process demographic data from US Census Bureau

**Responsibilities**:

* Fetch data from Census ACS 5-year API
* Map Census geography codes to internal geography IDs
* Calculate derived metrics (tenure shares, education percentages)
* Load demographic facts into database
* Support county and ZIP code levels

**Key Features**:

* API integration with rate limiting
* Geography mapping and matching
* Derived metric calculation
* Year-based versioning

**Location**: `backend/src/etl/census_acs.ts`

#### Investment Score Calculator

**Purpose**: Calculate multi-factor investment scores for all geographies

**Responsibilities**:

* Fetch 36 months of historical market data
* Fetch latest demographic data
* Calculate growth metrics (YoY, CAGR)
* Calculate affordability metrics (price-to-income, rent yield)
* Calculate liquidity metrics (DOM trend, sales volume)
* Normalize features using min-max scaling
* Compute weighted composite scores
* Persist scores to database

**Algorithm Components**:

1. **Growth Score** (45% weight)
   * YoY median sale price change (60%)
   * 3-year price CAGR (40%)

2. **Affordability Score** (25% weight)
   * Inverted price-to-income ratio (70%)
   * Rent yield proxy (30%)

3. **Liquidity Score** (20% weight)
   * Inverted DOM trend (60%)
   * Sales volume growth (40%)

4. **Renter Market Score** (10% weight)
   * Renter-occupied share

**Location**: `backend/src/etl/investment_scores.ts`

#### Job Scheduler

**Purpose**: Orchestrate ETL pipeline execution

**Responsibilities**:

* Run ETL jobs in proper sequence
* Handle job dependencies
* Support manual triggers for development
* Log job execution status
* Future: Schedule recurring jobs with BullMQ

**Location**: `backend/src/jobs/schedule.ts`

### 2. Data Storage Components

#### PostgreSQL Database

**Purpose**: Primary data store for all application data

**Design Pattern**: Star Schema (dimensional modeling)

**Tables**:

* **Dimensions**: Geography, Date
* **Facts**: Market Metrics, Demographics, Investment Scores

**Key Features**:

* Referential integrity with foreign keys
* Optimized indexes for query performance
* UUID primary keys for distributed systems
* Timestamp tracking (created\_at, updated\_at)
* Unique constraints for deduplication

**ORM**: Prisma

* Type-safe database access
* Automatic migration management
* Schema-first approach
* Excellent TypeScript integration

**Location**: `backend/prisma/schema.prisma`

#### Future: Redis Cache

**Purpose**: Improve API response times and reduce database load

**Use Cases**:

* Cache frequently accessed API responses
* Store session data for authenticated users
* Backend for BullMQ job queue
* Rate limiting counters

### 3. Application Layer Components

#### REST API Server

**Purpose**: Serve market analytics data to clients

**Framework**: Fastify

* High performance (3x faster than Express)
* Schema validation built-in
* TypeScript-first design
* Plugin ecosystem

**Endpoints**:

1. **GET /health**: Health check
2. **GET /markets/top**: Top-ranked markets
3. **GET /markets/:id/timeseries**: Historical data
4. **GET /markets/:id/profile**: Complete profile
5. **GET /markets/compare**: Compare markets

**Features**:

* Query parameter validation
* JSON response format
* Error handling with proper status codes
* CORS support
* Rate limiting (configurable)
* Request/response logging

**Location**: `backend/src/api/`

### 4. Database Client

#### Prisma Client

**Purpose**: Type-safe database access layer

**Features**:

* Auto-generated TypeScript types
* Query builder with IDE autocomplete
* Connection pooling
* Prepared statements (SQL injection protection)
* Transaction support

**Location**: `backend/src/db/client.ts`

## Technology Stack

### Backend (Current)

* **Runtime**: Node.js 18+ LTS
* **Language**: TypeScript 5.x
* **Framework**: Fastify 5.x
* **ORM**: Prisma 6.x
* **Database**: PostgreSQL 14+ (SQLite for development)
* **Job Queue**: BullMQ 5.x (future)
* **CSV Parsing**: Papa Parse
* **Date Utilities**: date-fns

### Development Tools

* **Package Manager**: npm
* **Linter**: ESLint with TypeScript plugin
* **Type Checking**: TypeScript strict mode
* **Hot Reload**: tsx (development)
* **Build Tool**: TypeScript compiler (tsc)

### Future Technologies

* **Caching**: Redis 7+
* **Message Queue**: Redis with BullMQ
* **Monitoring**: Datadog, Sentry, CloudWatch
* **Frontend**: React, Next.js, TypeScript
* **Mobile**: React Native
* **GraphQL**: Apollo Server
* **Testing**: Jest, Supertest, Playwright

## Architecture Patterns

### 1. Dimensional Modeling (Star Schema)

**Pattern**: Organize data into facts and dimensions for analytics

**Benefits**:

* Query performance optimization
* Easy to understand and maintain
* Supports time-based analytics
* Scalable for large datasets

**Implementation**:

* **Dimensions**: Geography hierarchy, date dimension
* **Facts**: Market metrics, demographics, scores

### 2. ETL Pipeline Pattern

**Pattern**: Extract-Transform-Load for data integration

**Benefits**:

* Separation of concerns
* Reusable components
* Easy to test and debug
* Supports multiple data sources

**Stages**:

1. **Extract**: Read from CSV files or APIs
2. **Transform**: Clean, map, calculate derived metrics
3. **Load**: Upsert into database with deduplication

### 3. Repository Pattern

**Pattern**: Abstract database operations behind interfaces

**Benefits**:

* Testable (can mock database)
* Database-agnostic (easier to switch databases)
* Centralized data access logic

**Implementation**:

* Prisma client as repository
* Type-safe queries
* Transaction support

### 4. RESTful API Design

**Pattern**: Resource-based URL structure with HTTP verbs

**Benefits**:

* Standard and predictable
* Cacheable responses
* Stateless
* Easy to consume

**Implementation**:

* Resource: `/markets`
* Operations: GET (read only for MVP)
* Query parameters for filtering
* JSON responses

### 5. Dependency Injection

**Pattern**: Inject dependencies rather than hard-code them

**Benefits**:

* Testable components
* Loose coupling
* Configuration flexibility

**Implementation**:

* Environment variables via dotenv
* Database client as singleton
* Configuration objects passed to functions

### 6. Error Handling Strategy

**Pattern**: Centralized error handling with typed errors

**Benefits**:

* Consistent error responses
* Proper HTTP status codes
* Error logging
* User-friendly messages

**Implementation**:

* Try-catch blocks in routes
* Fastify error handlers
* Custom error types (future)
* Error logging to console/monitoring service

## Infrastructure

### Development Environment

```
Developer Machine
├── Node.js 18+ (runtime)
├── PostgreSQL 14+ (local or Docker)
├── VS Code / IDE (development)
└── Git (version control)
```

### Production Environment (Future)

```
Cloud Provider (AWS/GCP/Azure)
├── Application Tier
│   ├── Load Balancer (ALB/Cloud Load Balancing)
│   ├── Auto Scaling Group (2-10 instances)
│   └── Container Platform (ECS/GKE/AKS) or VMs
│
├── Data Tier
│   ├── PostgreSQL (RDS/Cloud SQL/Azure Database)
│   │   ├── Primary instance (write)
│   │   └── Read replicas (read-heavy queries)
│   └── Redis (ElastiCache/Memorystore)
│       ├── Cache cluster
│       └── Job queue backend
│
├── Storage Tier
│   └── Object Storage (S3/GCS/Blob Storage)
│       ├── Raw CSV files
│       └── Backups and archives
│
├── Monitoring & Logging
│   ├── Application logs (CloudWatch/Stackdriver)
│   ├── Metrics (Datadog/Prometheus)
│   ├── Error tracking (Sentry)
│   └── Uptime monitoring (Pingdom/UptimeRobot)
│
└── CI/CD Pipeline
    ├── Source Control (GitHub)
    ├── CI (GitHub Actions/CircleCI)
    ├── Build (Docker)
    ├── Test (automated tests)
    └── Deploy (blue-green deployment)
```

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Internet                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Load Balancer                               │
│                  (SSL Termination, DDoS Protection)              │
└────────────┬──────────────────────────┬─────────────────────────┘
             │                          │
             ↓                          ↓
┌─────────────────────┐      ┌─────────────────────┐
│  API Server 1       │      │  API Server 2       │
│  (Docker Container) │      │  (Docker Container) │
│  - Node.js App      │      │  - Node.js App      │
│  - Prisma Client    │      │  - Prisma Client    │
└──────────┬──────────┘      └──────────┬──────────┘
           │                            │
           └──────────┬─────────────────┘
                      │
                      ↓
           ┌──────────────────────┐
           │   PostgreSQL         │
           │   Primary + Replica  │
           └──────────┬───────────┘
                      │
                      ↓
           ┌──────────────────────┐
           │   Backups            │
           │   (Daily Automated)  │
           └──────────────────────┘
```

## Security Architecture

### Current Security Measures

1. **SQL Injection Protection**
   * Prisma ORM with prepared statements
   * No raw SQL queries

2. **Environment Variables**
   * Sensitive data in .env file
   * .env excluded from version control
   * Separate configs for dev/staging/prod

3. **Input Validation**
   * Query parameter validation
   * Type checking with TypeScript
   * Fastify schema validation

4. **Error Handling**
   * No sensitive data in error messages
   * Stack traces only in development
   * Proper HTTP status codes

### Future Security Enhancements

1. **Authentication & Authorization**
   * JWT tokens for API access
   * OAuth 2.0 for third-party integrations
   * Role-based access control (RBAC)
   * API keys for developers

2. **Rate Limiting**
   * Per-IP rate limiting
   * Per-user rate limiting
   * DDoS protection

3. **Encryption**
   * TLS/SSL for all connections
   * Encryption at rest for database
   * Secret management (AWS Secrets Manager, Vault)

4. **Monitoring & Auditing**
   * Security event logging
   * Failed authentication tracking
   * Anomaly detection
   * Regular security audits

5. **Compliance**
   * GDPR compliance for user data
   * SOC 2 Type II certification
   * Regular penetration testing
   * Vulnerability scanning

## Scalability Considerations

### Horizontal Scaling

* Stateless API servers (can run multiple instances)
* Load balancing across instances
* Database read replicas for read-heavy workloads
* Redis for distributed caching

### Vertical Scaling

* Optimize database queries with indexes
* Batch processing in ETL
* Efficient data structures
* Connection pooling

### Data Partitioning

* Partition fact tables by date (monthly/yearly)
* Archive old data to cold storage
* Separate OLTP and OLAP workloads

### Caching Strategy

* Cache API responses (TTL: 5-15 minutes)
* Cache investment scores (TTL: 1 hour)
* Cache demographics (TTL: 24 hours)
* Invalidate on data updates

## Performance Optimization

### Database

* Indexes on all foreign keys and filter columns
* Analyze query plans regularly
* Use EXPLAIN for slow queries
* Consider materialized views for complex analytics

### API

* Response compression (gzip)
* Pagination for large result sets
* Field selection (only return requested fields)
* Batching support for bulk operations

### ETL

* Batch inserts (100-1000 records)
* Parallel processing where possible
* Incremental updates vs full refresh
* Schedule during off-peak hours

## Disaster Recovery

### Backup Strategy

* Daily automated database backups
* 30-day retention period
* Backups stored in different region
* Regular restore testing

### Recovery Procedures

* RTO (Recovery Time Objective): \&lt; 4 hours
* RPO (Recovery Point Objective): \&lt; 1 hour
* Documented recovery procedures
* Regular disaster recovery drills

### High Availability

* Multi-AZ database deployment
* Auto-healing for failed instances
* Health checks and automatic failover
* Circuit breakers for external dependencies
