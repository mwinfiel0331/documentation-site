# MyNextHome - Data Flows and ETL Pipeline

## Table of Contents

* [ETL Pipeline Overview](#etl-pipeline-overview)
* [Data Flow Diagrams](#data-flow-diagrams)
* [ETL Process Details](#etl-process-details)
* [Job Scheduling](#job-scheduling)
* [Error Handling](#error-handling)
* [Monitoring and Logging](#monitoring-and-logging)

## ETL Pipeline Overview

The MyNextHome ETL pipeline consists of three main jobs that run in sequence:

1. **Redfin Market Metrics ETL**: Ingest market data from CSV files
2. **Census Demographics ETL**: Fetch demographic data from Census API
3. **Investment Score Calculation**: Calculate investment scores from market + demographic data

### Pipeline Execution Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ETL PIPELINE FLOW                             │
└─────────────────────────────────────────────────────────────────────┘

START
  │
  ├─► [1] REDFIN MARKET METRICS ETL
  │     │
  │     ├─► Read CSV Files from data/raw/redfin/
  │     │     │
  │     │     ├─► Parse CSV rows
  │     │     ├─► Extract geography data
  │     │     ├─► Extract market metrics
  │     │     └─► Validate data types
  │     │
  │     ├─► Create/Update Geographies
  │     │     │
  │     │     ├─► Check if geography exists (by type + code)
  │     │     ├─► If exists: Fetch ID
  │     │     ├─► If not exists: Create new geography record
  │     │     └─► Return geography_id
  │     │
  │     ├─► Upsert Market Metrics
  │     │     │
  │     │     ├─► Check for duplicates (geography_id, period_start, source)
  │     │     ├─► If exists: UPDATE
  │     │     ├─► If not exists: INSERT
  │     │     └─► Batch process (100 records at a time)
  │     │
  │     └─► Success: Geographies + Market Metrics loaded
  │
  ├─► [2] CENSUS DEMOGRAPHICS ETL
  │     │
  │     ├─► Fetch Geography IDs from Database
  │     │     │
  │     │     └─► Get all geographies of requested type (county or ZIP)
  │     │
  │     ├─► Call Census API
  │     │     │
  │     │     ├─► Build API URL with variables
  │     │     ├─► For county: /acs/acs5?get=...&for=county:*&in=state:*
  │     │     ├─► For ZIP: /acs/acs5?get=...&for=zip%20code%20tabulation%20area:*
  │     │     ├─► Respect rate limits (batch by state, delay between calls)
  │     │     └─► Parse JSON response
  │     │
  │     ├─► Map Census Data to Geographies
  │     │     │
  │     │     ├─► Match FIPS codes or ZIP codes
  │     │     ├─► Calculate derived metrics (shares, percentages)
  │     │     └─► Handle missing/null values
  │     │
  │     ├─► Upsert Demographics
  │     │     │
  │     │     ├─► Check for duplicates (geography_id, acs_year)
  │     │     ├─► If exists: UPDATE
  │     │     └─► If not exists: INSERT
  │     │
  │     └─► Success: Demographics loaded
  │
  └─► [3] INVESTMENT SCORE CALCULATION
        │
        ├─► Fetch Geographies to Score
        │     │
        │     └─► Get all geographies of requested type with market data
        │
        ├─► For Each Geography:
        │     │
        │     ├─► Fetch 36 Months of Market Metrics
        │     │     │
        │     │     ├─► Query fact_market_metrics
        │     │     ├─► Filter: geography_id, period_type=month
        │     │     ├─► Order by period_start_date DESC
        │     │     └─► Limit 36 records
        │     │
        │     ├─► Fetch Latest Demographics
        │     │     │
        │     │     ├─► Query fact_demographics
        │     │     ├─► Filter: geography_id
        │     │     └─► Order by acs_year DESC, limit 1
        │     │
        │     ├─► Calculate Raw Features
        │     │     │
        │     │     ├─► YoY Price Growth: (price_now - price_12mo_ago) / price_12mo_ago
        │     │     ├─► 3-Year CAGR: ((price_now / price_36mo_ago)^(1/3)) - 1
        │     │     ├─► DOM Trend: Average DOM last 3 months
        │     │     ├─► Sales Volume Trend: Average sales last 3 months
        │     │     ├─► Price-to-Income: median_sale_price / median_household_income
        │     │     ├─► Rent Yield Proxy: (median_gross_rent * 12) / median_sale_price
        │     │     └─► Renter Share: renter_occupied_share
        │     │
        │     └─► Store Raw Features for Normalization
        │
        ├─► Normalize Features Across All Geographies
        │     │
        │     ├─► Min-Max Scaling: (value - min) / (max - min) * 100
        │     ├─► Invert where appropriate (DOM, price-to-income)
        │     └─► Handle edge cases (divide by zero, nulls)
        │
        ├─► Calculate Component Scores
        │     │
        │     ├─► Growth Score = (norm_yoy * 0.6) + (norm_cagr * 0.4)
        │     ├─► Affordability Score = (norm_inv_price_to_income * 0.7) + (norm_rent_yield * 0.3)
        │     ├─► Liquidity Score = (norm_inv_dom * 0.6) + (norm_sales_volume * 0.4)
        │     └─► Risk Score = norm_renter_share
        │
        ├─► Calculate Overall Score
        │     │
        │     └─► Overall = (Growth * 0.45) + (Affordability * 0.25) + (Liquidity * 0.20) + (Risk * 0.10)
        │
        ├─► Upsert Investment Scores
        │     │
        │     ├─► Check for duplicates (geography_id, as_of_date)
        │     ├─► If exists: UPDATE
        │     └─► If not exists: INSERT
        │
        └─► Success: Investment Scores calculated

END
```

## Data Flow Diagrams

### 1. Redfin Market Metrics ETL Data Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    REDFIN ETL DATA FLOW                                   │
└──────────────────────────────────────────────────────────────────────────┘

[CSV Files]                    [Database: dim_geography]
    │                                    │
    │  ┌──────────────────────────┐     │
    └─►│  Read CSV Files          │     │
       │  - County files          │     │
       │  - ZIP files             │     │
       │  - State files           │     │
       │  - MSA files             │     │
       └────────────┬─────────────┘     │
                    │                    │
                    ▼                    │
       ┌──────────────────────────┐     │
       │  Parse CSV Rows          │     │
       │  - Extract columns       │     │
       │  - Parse dates           │     │
       │  - Parse numbers         │     │
       │  - Clean strings         │     │
       └────────────┬─────────────┘     │
                    │                    │
                    ▼                    │
       ┌──────────────────────────┐     │
       │  Extract Geography Info  │     │
       │  - region_type           │     │
       │  - region name           │     │
       │  - state_code            │     │
       │  - county_fips (if any)  │     │
       │  - zip_code (if any)     │     │
       └────────────┬─────────────┘     │
                    │                    │
                    ▼                    │
       ┌──────────────────────────┐     │
       │  Lookup/Create Geography │◄────┘
       │  - Search by type+code   │
       │  - If not found: CREATE  │
       │  - Return geography_id   │─────┐
       └────────────┬─────────────┘     │
                    │                    │
                    ▼                    │
       ┌──────────────────────────┐     │
       │  Build Market Metric     │     │
       │  - geography_id (FK)     │◄────┘
       │  - period_start_date     │
       │  - period_end_date       │
       │  - period_type           │
       │  - median_sale_price     │
       │  - median_list_price     │
       │  - median_dom            │
       │  - homes_sold            │
       │  - active_inventory      │
       │  - ... (all metrics)     │
       └────────────┬─────────────┘
                    │
                    ▼
       ┌──────────────────────────┐
       │  Upsert to Database      │
       │  ON CONFLICT:            │────────►[Database: fact_market_metrics]
       │  (geography_id,          │
       │   period_start, source)  │
       │  DO UPDATE               │
       └──────────────────────────┘
```

### 2. Census Demographics ETL Data Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    CENSUS ETL DATA FLOW                                   │
└──────────────────────────────────────────────────────────────────────────┘

[Database: dim_geography]
         │
         ▼
┌──────────────────────────┐
│  Fetch Geographies       │
│  - Filter by geo_type    │
│  - Get FIPS or ZIP codes │
│  - Build lookup map      │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐        [Census ACS API]
│  Build API Requests      │               │
│  - Group by state        │               │
│  - Build variable list   │               │
│  - For county: counties  │               │
│  - For ZIP: ZCTAs        │               │
└────────────┬─────────────┘               │
             │                              │
             └─────────► API Request ──────►│
                              │             │
                              ◄─────────────┘
                              │  JSON Response
                              ▼
                   ┌──────────────────────────┐
                   │  Parse Census Response   │
                   │  - Extract header row    │
                   │  - Map data rows         │
                   │  - Extract FIPS/ZIP      │
                   │  - Extract variables     │
                   └────────────┬─────────────┘
                                │
                                ▼
                   ┌──────────────────────────┐
                   │  Map to Geography IDs    │
                   │  - Match FIPS codes      │
                   │  - Match ZIP codes       │
                   │  - Lookup geography_id   │
                   └────────────┬─────────────┘
                                │
                                ▼
                   ┌──────────────────────────┐
                   │  Calculate Derived       │
                   │  - owner_share %         │
                   │  - renter_share %        │
                   │  - bachelors_share %     │
                   │  - Handle nulls          │
                   └────────────┬─────────────┘
                                │
                                ▼
                   ┌──────────────────────────┐
                   │  Build Demographics      │
                   │  - geography_id (FK)     │
                   │  - acs_year              │
                   │  - population_total      │
                   │  - median_income         │
                   │  - median_rent           │
                   │  - owner_occupied_share  │
                   │  - ... (all metrics)     │
                   └────────────┬─────────────┘
                                │
                                ▼
                   ┌──────────────────────────┐
                   │  Upsert to Database      │
                   │  ON CONFLICT:            │────►[Database: fact_demographics]
                   │  (geography_id, acs_year)│
                   │  DO UPDATE               │
                   └──────────────────────────┘
```

### 3. Investment Score Calculation Data Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                 INVESTMENT SCORE CALCULATION FLOW                         │
└──────────────────────────────────────────────────────────────────────────┘

[Database: dim_geography]          [Database: fact_market_metrics]
         │                                      │
         ▼                                      │
┌──────────────────────────┐                   │
│  Fetch Geographies       │                   │
│  - Filter by geo_type    │                   │
│  - Only those with data  │                   │
└────────────┬─────────────┘                   │
             │                                  │
             │  For each geography:             │
             │                                  │
             ├─────────► Fetch Market Data ────►│
             │           - Last 36 months       │
             │           - period_type = month  │
             │           ◄──────────────────────┘
             │           │  Market Metrics
             │           │
             │           ▼
             │  ┌──────────────────────────┐
             │  │  Calculate Growth        │
             │  │  - YoY price change      │
             │  │  - 3-year CAGR           │
             │  │  - Sales volume trend    │
             │  └────────────┬─────────────┘
             │               │
             │               │              [Database: fact_demographics]
             │               │                        │
             ├───────────────┴──► Fetch Demographics ┤
             │                    - Latest acs_year   │
             │                    ◄───────────────────┘
             │                    │  Demographics
             │                    │
             │                    ▼
             │           ┌──────────────────────────┐
             │           │  Calculate Affordability │
             │           │  - Price-to-income       │
             │           │  - Rent yield proxy      │
             │           └────────────┬─────────────┘
             │                        │
             │                        ▼
             │           ┌──────────────────────────┐
             │           │  Calculate Liquidity     │
             │           │  - DOM trend             │
             │           │  - Sales velocity        │
             │           └────────────┬─────────────┘
             │                        │
             │                        ▼
             │           ┌──────────────────────────┐
             │           │  Extract Risk Metrics    │
             │           │  - Renter share          │
             │           │  - Volatility proxy      │
             │           └────────────┬─────────────┘
             │                        │
             │                        ▼
             │           ┌──────────────────────────┐
             │           │  Store Raw Features      │
             │           │  - growth_price_yoy      │
             │           │  - growth_price_3y_cagr  │
             │           │  - price_to_income_ratio │
             │           │  - rent_to_price_proxy   │
             │           │  - dom_trend             │
             │           │  - sales_volume_trend    │
             │           │  - renter_share          │
             └───────────┴──────────┬───────────────┘
                                    │  Accumulate for all geographies
                                    │
                                    ▼
                         ┌──────────────────────────┐
                         │  Min-Max Normalization   │
                         │  For each feature:       │
                         │    min = MIN(all values) │
                         │    max = MAX(all values) │
                         │    norm = (v-min)/(max-min) * 100 │
                         └────────────┬─────────────┘
                                      │
                                      ▼
                         ┌──────────────────────────┐
                         │  Calculate Scores        │
                         │  - Growth (45%)          │
                         │  - Affordability (25%)   │
                         │  - Liquidity (20%)       │
                         │  - Risk (10%)            │
                         │  - Overall (weighted)    │
                         └────────────┬─────────────┘
                                      │
                                      ▼
                         ┌──────────────────────────┐
                         │  Upsert Scores           │
                         │  ON CONFLICT:            │────►[Database: fact_investment_score]
                         │  (geography_id, as_of)   │
                         │  DO UPDATE               │
                         └──────────────────────────┘
```

## ETL Process Details

### 1. Redfin Market Metrics ETL

**Location**: `backend/src/etl/redfin_market_metrics.ts`

**Input**: CSV files in `backend/data/raw/redfin/`

**Expected CSV Columns**:

```
region_type, region, state, state_code, 
period_begin, period_end, period_duration,
median_sale_price, median_list_price, median_ppsf,
median_days_on_market, homes_sold, new_listings, inventory,
months_of_supply, price_drop_share, sold_above_list,
pending_sales, off_market_in_2_weeks
```

**Process Steps**:

1. **File Discovery**
   ```typescript
   const files = fs.readdirSync(dataDir)
     .filter(f => f.endsWith('.csv'));
   ```

2. **CSV Parsing**
   ```typescript
   const records = await parseCSV(filePath);
   // Uses Papa Parse library
   ```

3. **Geography Resolution**
   ```typescript
   // For each record:
   const geography = await findOrCreateGeography({
     type: record.region_type,
     name: record.region,
     stateCode: record.state_code,
     zipCode: record.zip_code // if type is ZIP
   });
   ```

4. **Metric Upsert**
   ```typescript
   await prisma.factMarketMetrics.upsert({
     where: {
       geographyId_periodStartDate_source: {
         geographyId: geography.id,
         periodStartDate: periodStart,
         source: 'redfin'
       }
     },
     update: { /* all fields */ },
     create: { /* all fields */ }
   });
   ```

**Error Handling**:

* Invalid date formats: Skip record, log warning
* Missing required fields: Skip record, log warning
* Duplicate records: Update existing (idempotent)
* File not found: Graceful exit with message

**Performance**:

* Batch processing: 100 records per log message
* Transaction per file for consistency
* Indexes on lookup columns for speed

### 2. Census Demographics ETL

**Location**: `backend/src/etl/census_acs.ts`

**Input**:

* Geography type (county or zip)
* ACS year (default: 2022)

**Census API Variables Fetched**:

```
B01003_001E: Total population
B19013_001E: Median household income
B25064_001E: Median gross rent
B25003_001E: Total occupied housing units
B25003_002E: Owner-occupied units
B25003_003E: Renter-occupied units
B15003_022E: Bachelor's degree
B15003_023E: Master's degree
B15003_024E: Professional degree
B15003_025E: Doctorate degree
B15003_001E: Total population 25+
B01002_001E: Median age
B08303_001E: Mean travel time to work
```

**Process Steps**:

1. **Geography Lookup**
   ```typescript
   const geographies = await prisma.dimGeography.findMany({
     where: { geoType: geoType },
     select: { id: true, countyFips: true, zipCode: true }
   });
   ```

2. **API Request Construction**
   ```typescript
   const url = `https://api.census.gov/data/${year}/acs/acs5?` +
     `get=${variables.join(',')}&` +
     `for=county:*&in=state:${stateFips}&` +
     `key=${apiKey}`;
   ```

3. **API Call with Rate Limiting**
   ```typescript
   for (const state of states) {
     const data = await fetchCensusData(state);
     await sleep(200); // Rate limit: 5 requests/second
   }
   ```

4. **Data Mapping**
   ```typescript
   // Match Census geography to our geography_id
   const geography = geographyMap.get(countyFips);

   // Calculate derived metrics
   const totalOccupied = ownerOccupied + renterOccupied;
   const ownerShare = (ownerOccupied / totalOccupied) * 100;
   const renterShare = (renterOccupied / totalOccupied) * 100;
   ```

5. **Demographic Upsert**
   ```typescript
   await prisma.factDemographics.upsert({
     where: {
       geographyId_acsYear: {
         geographyId: geography.id,
         acsYear: year
       }
     },
     update: { /* all fields */ },
     create: { /* all fields */ }
   });
   ```

**Error Handling**:

* API rate limit: Retry with exponential backoff
* Missing API key: Fail fast with error message
* Geography not found: Skip, log warning
* Null values: Store as NULL in database

**Performance**:

* State-by-state batching to avoid timeout
* Sleep between requests to respect rate limits
* Connection pooling for database operations

### 3. Investment Score Calculation

**Location**: `backend/src/etl/investment_scores.ts`

**Input**: Geography type (zip, county, state)

**Process Steps**:

1. **Data Collection**
   ```typescript
   for (const geography of geographies) {
     // Fetch 36 months of market data
     const metrics = await prisma.factMarketMetrics.findMany({
       where: {
         geographyId: geography.id,
         periodType: 'month'
       },
       orderBy: { periodStartDate: 'desc' },
       take: 36
     });
     
     // Fetch latest demographics
     const demo = await prisma.factDemographics.findFirst({
       where: { geographyId: geography.id },
       orderBy: { acsYear: 'desc' }
     });
   }
   ```

2. **Feature Calculation**
   ```typescript
   // YoY price growth
   const priceNow = metrics[0].medianSalePrice;
   const price12moAgo = metrics[11].medianSalePrice;
   const yoyGrowth = ((priceNow - price12moAgo) / price12moAgo) * 100;

   // 3-year CAGR
   const price36moAgo = metrics[35].medianSalePrice;
   const cagr = (Math.pow(priceNow / price36moAgo, 1/3) - 1) * 100;

   // Price-to-income ratio
   const priceToIncome = priceNow / demo.medianHouseholdIncome;

   // Rent yield proxy
   const rentYield = (demo.medianGrossRent * 12) / priceNow * 100;
   ```

3. **Feature Collection & Normalization**
   ```typescript
   // Collect all values across geographies
   const allYoyGrowth = features.map(f => f.yoyGrowth);

   // Min-max normalization
   const min = Math.min(...allYoyGrowth);
   const max = Math.max(...allYoyGrowth);
   const normalized = allYoyGrowth.map(v => 
     ((v - min) / (max - min)) * 100
   );
   ```

4. **Score Calculation**
   ```typescript
   // Component scores
   const growthScore = (normYoy * 0.6) + (normCagr * 0.4);
   const affordScore = (normInvPriceToIncome * 0.7) + (normRentYield * 0.3);
   const liquidityScore = (normInvDom * 0.6) + (normSalesVolume * 0.4);
   const riskScore = normRenterShare;

   // Overall score
   const overallScore = 
     (growthScore * 0.45) +
     (affordScore * 0.25) +
     (liquidityScore * 0.20) +
     (riskScore * 0.10);
   ```

5. **Score Persistence**
   ```typescript
   await prisma.factInvestmentScore.upsert({
     where: {
       geographyId_asOfDate: {
         geographyId: geography.id,
         asOfDate: new Date()
       }
     },
     update: { /* scores and components */ },
     create: { /* scores and components */ }
   });
   ```

**Error Handling**:

* Insufficient data (\&lt; 36 months): Skip, log warning
* Missing demographics: Skip, log warning
* Division by zero: Handle with NULL or default value
* Extreme outliers: Cap at reasonable limits

## Job Scheduling

### Manual Execution (Development)

```bash
# Run individual jobs
npm run etl:redfin
npm run etl:census county
npm run etl:scores zip

# Run full pipeline
npm run etl:all
```

### Automated Scheduling (Production)

**Recommended Schedule**:

```
Daily at 2:00 AM UTC:
  - Redfin Market Metrics ETL
  
Daily at 4:00 AM UTC:
  - Investment Score Calculation
  
Monthly on 1st at 3:00 AM UTC:
  - Census Demographics ETL
```

**Implementation Options**:

1. **Cron Jobs** (Simple)
   ```cron
   0 2 * * * cd /app && npm run etl:redfin
   0 4 * * * cd /app && npm run etl:scores zip
   0 3 1 * * cd /app && npm run etl:census county
   ```

2. **BullMQ** (Recommended for production)
   ```typescript
   import { Queue, Worker } from 'bullmq';

   const etlQueue = new Queue('etl-jobs', {
     connection: redisConnection
   });

   // Schedule recurring jobs
   await etlQueue.add('redfin-etl', {}, {
     repeat: { pattern: '0 2 * * *' }
   });
   ```

3. **Cloud Scheduler** (AWS/GCP/Azure)
   * AWS EventBridge: Trigger Lambda or ECS task
   * GCP Cloud Scheduler: Trigger Cloud Run or Cloud Functions
   * Azure Logic Apps: Trigger Azure Functions or Container Instances

### Job Dependencies

Jobs must run in sequence:

1. Redfin ETL must complete before Census ETL (creates geographies)
2. Both Redfin and Census must complete before Score Calculation

```typescript
// Job orchestration
async function runFullETL() {
  console.log('Starting Redfin ETL...');
  await runRedfinETL();
  
  console.log('Starting Census ETL...');
  await runCensusETL('county');
  await runCensusETL('zip');
  
  console.log('Starting Score Calculation...');
  await runScoreCalculation('zip');
  await runScoreCalculation('county');
  
  console.log('ETL pipeline complete!');
}
```

## Error Handling

### Strategy

1. **Fail Fast**: Critical errors stop the job immediately
2. **Continue on Warning**: Non-critical errors are logged but job continues
3. **Idempotent**: Jobs can be safely re-run

### Error Types

**Critical Errors** (stop job):

* Database connection failure
* API key missing/invalid
* File system permissions
* Out of memory

**Warnings** (log and continue):

* Single record parse error
* Geography not found for Census data
* Insufficient historical data for scoring
* Null values in optional fields

### Logging

```typescript
// Info logging
console.log(`Processing ${fileName}: ${recordCount} records`);

// Warning logging
console.warn(`Geography not found for FIPS ${fips}, skipping`);

// Error logging
console.error(`Failed to parse CSV: ${error.message}`);

// Success logging
console.log(`✓ Loaded ${count} market metrics`);
```

### Retry Logic

```typescript
async function fetchWithRetry(url: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetch(url);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(1000 * Math.pow(2, i)); // Exponential backoff
    }
  }
}
```

## Monitoring and Logging

### Metrics to Track

1. **Job Execution**:
   * Job start time
   * Job end time
   * Duration
   * Success/failure status

2. **Data Volume**:
   * Records processed
   * Records inserted
   * Records updated
   * Records skipped

3. **Data Quality**:
   * Parse errors
   * Validation errors
   * Missing values
   * Outliers

4. **Performance**:
   * Database query time
   * API response time
   * Memory usage
   * CPU usage

### Logging Best Practices

```typescript
// Start of job
console.log(`[${new Date().toISOString()}] Starting Redfin ETL`);

// Progress updates
console.log(`Processed ${count}/1000 records (${Math.round(count/1000*100)}%)`);

// Summary at end
console.log(`
ETL Summary:
- Duration: ${duration}ms
- Files processed: ${fileCount}
- Records processed: ${recordCount}
- Geographies created: ${geoCreated}
- Metrics inserted: ${metricsInserted}
- Metrics updated: ${metricsUpdated}
- Errors: ${errorCount}
`);
```

### Future: Monitoring Integration

* **Datadog**: Custom metrics and dashboards
* **Sentry**: Error tracking and alerting
* **CloudWatch**: AWS-native monitoring
* **Prometheus + Grafana**: Open-source option

### Alerting

Set up alerts for:

* Job failures
* Long-running jobs (> expected duration)
* High error rates (> 5%)
* Data freshness (stale data)
* API rate limits exceeded
