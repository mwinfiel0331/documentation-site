# MyNextHome - Application Flows and Process Execution

## Table of Contents
- [Application Flow Overview](#application-flow-overview)
- [ETL Process Flows](#etl-process-flows)
- [API Request Flows](#api-request-flows)
- [Subprocess Execution](#subprocess-execution)
- [User Scenarios](#user-scenarios)
- [System Maintenance Flows](#system-maintenance-flows)

## Application Flow Overview

MyNextHome follows a data pipeline architecture where data flows from external sources through ETL processes into a database, which is then served via a REST API.

### High-Level Flow

```
┌────────────────────────────────────────────────────────────────────┐
│                    APPLICATION FLOW OVERVIEW                        │
└────────────────────────────────────────────────────────────────────┘

[External Data Sources]
         │
         ├─► Redfin CSV Files
         └─► Census API
                │
                ▼
         [ETL Pipeline]
                │
                ├─► Parse & Transform
                ├─► Validate & Clean
                └─► Calculate Metrics
                       │
                       ▼
                [PostgreSQL Database]
                       │
                       ▼
                  [REST API]
                       │
                       ▼
                 [API Consumers]
                       │
                       ├─► Web App (Future)
                       ├─► Mobile Apps (Future)
                       └─► Third-Party Integrations
```

## ETL Process Flows

### 1. Redfin Market Metrics ETL Flow

**Trigger**: Manual execution or scheduled job (daily at 2 AM)

**Command**: `npm run etl:redfin`

**Process Flow**:

```
START
  │
  ├─► [Initialize]
  │     └─► Load environment variables
  │     └─► Connect to database
  │     └─► Read REDFIN_DATA_DIR
  │
  ├─► [Discover CSV Files]
  │     └─► Scan directory for .csv files
  │     └─► Filter valid files
  │     └─► Sort by filename
  │     └─► Log file count
  │
  ├─► [Process Each File]
  │     │
  │     ├─► Read CSV file
  │     │     └─► Parse with Papa Parse
  │     │     └─► Extract headers
  │     │     └─► Validate structure
  │     │
  │     ├─► [For Each Row]
  │     │     │
  │     │     ├─► Extract Geography Info
  │     │     │     └─► region_type (state/county/city/zip)
  │     │     │     └─► region (name)
  │     │     │     └─► state_code
  │     │     │     └─► FIPS codes or ZIP code
  │     │     │
  │     │     ├─► Find or Create Geography
  │     │     │     │
  │     │     │     ├─► Query: Check if exists
  │     │     │     │     WHERE geo_type = ? AND
  │     │     │     │     (state_code = ? AND zip_code = ?)
  │     │     │     │
  │     │     │     ├─► IF EXISTS:
  │     │     │     │     └─► Return geography_id
  │     │     │     │
  │     │     │     └─► IF NOT EXISTS:
  │     │     │           └─► INSERT new geography
  │     │     │           └─► Return new geography_id
  │     │     │
  │     │     ├─► Extract Market Metrics
  │     │     │     └─► period_start, period_end
  │     │     │     └─► median_sale_price
  │     │     │     └─► median_list_price
  │     │     │     └─► median_dom
  │     │     │     └─► homes_sold
  │     │     │     └─► inventory
  │     │     │     └─► ... (all metrics)
  │     │     │
  │     │     └─► Upsert Market Metrics
  │     │           │
  │     │           ├─► ON CONFLICT (geography_id, period_start, source)
  │     │           │     DO UPDATE SET
  │     │           │       median_sale_price = EXCLUDED.median_sale_price,
  │     │           │       ... (update all fields)
  │     │           │
  │     │           └─► Log progress every 100 records
  │     │
  │     └─► Log file completion
  │           └─► Records processed
  │           └─► Geographies created
  │           └─► Metrics upserted
  │
  └─► [Complete]
        └─► Log total summary
        └─► Close database connection
        └─► Exit with success code

END
```

**Error Handling**:

```
[At Any Step]
   │
   ├─► Database Error
   │     └─► Log error details
   │     └─► Rollback transaction (if in transaction)
   │     └─► Exit with error code
   │
   ├─► Parse Error
   │     └─► Log row number and error
   │     └─► Skip row
   │     └─► Continue processing
   │
   └─► File Not Found
         └─► Log warning
         └─► Continue to next file
```

### 2. Census Demographics ETL Flow

**Trigger**: Manual execution or scheduled job (monthly)

**Command**: `npm run etl:census county` or `npm run etl:census zip`

**Process Flow**:

```
START (with geo_type parameter: county or zip)
  │
  ├─► [Initialize]
  │     └─► Load environment variables
  │     └─► Check CENSUS_API_KEY
  │     └─► Connect to database
  │     └─► Determine ACS_YEAR (default: 2022)
  │
  ├─► [Fetch Geographies]
  │     └─► Query dim_geography
  │     └─► WHERE geo_type = geo_type
  │     └─► Build lookup map: FIPS/ZIP → geography_id
  │     └─► Log geography count
  │
  ├─► [Build Census API Request]
  │     │
  │     ├─► Define variables to fetch
  │     │     └─► B01003_001E (Population)
  │     │     └─► B19013_001E (Median Income)
  │     │     └─► B25064_001E (Median Rent)
  │     │     └─► B25003_002E (Owner Occupied)
  │     │     └─► B25003_003E (Renter Occupied)
  │     │     └─► ... (all demographic variables)
  │     │
  │     ├─► IF geo_type = county:
  │     │     └─► For each state FIPS:
  │     │           └─► Build URL: /acs/acs5?get=...&for=county:*&in=state:{fips}
  │     │
  │     └─► IF geo_type = zip:
  │           └─► Build URL: /acs/acs5?get=...&for=zip%20code%20tabulation%20area:*
  │
  ├─► [Make API Calls]
  │     │
  │     ├─► [For Each Request]
  │     │     │
  │     │     ├─► Fetch from Census API
  │     │     │     └─► Include API key
  │     │     │     └─► Set timeout (30s)
  │     │     │
  │     │     ├─► Check Response Status
  │     │     │     ├─► 200: Parse JSON
  │     │     │     ├─► 429: Rate limit → Wait and retry
  │     │     │     └─► Other: Log error and skip
  │     │     │
  │     │     ├─► Rate Limit Delay
  │     │     │     └─► Sleep 200ms between requests
  │     │     │
  │     │     └─► Parse Response
  │     │           └─► First row = headers
  │     │           └─► Remaining rows = data
  │     │
  │     └─► Accumulate results
  │
  ├─► [Process Census Data]
  │     │
  │     ├─► [For Each Record]
  │     │     │
  │     │     ├─► Extract FIPS/ZIP from response
  │     │     │
  │     │     ├─► Map to Geography ID
  │     │     │     └─► Lookup in geography map
  │     │     │     └─► IF NOT FOUND: Log warning and skip
  │     │     │
  │     │     ├─► Extract Raw Values
  │     │     │     └─► population_total
  │     │     │     └─► median_household_income
  │     │     │     └─► median_gross_rent
  │     │     │     └─► owner_occupied_units
  │     │     │     └─► renter_occupied_units
  │     │     │     └─► bachelor_count
  │     │     │     └─► total_25plus
  │     │     │     └─► ... (all variables)
  │     │     │
  │     │     ├─► Calculate Derived Metrics
  │     │     │     └─► total_occupied = owner + renter
  │     │     │     └─► owner_share = (owner / total) * 100
  │     │     │     └─► renter_share = (renter / total) * 100
  │     │     │     └─► bachelors_share = (bachelor_count / total_25plus) * 100
  │     │     │
  │     │     └─► Upsert Demographics
  │     │           │
  │     │           └─► ON CONFLICT (geography_id, acs_year)
  │     │                 DO UPDATE SET
  │     │                   population_total = EXCLUDED.population_total,
  │     │                   ... (update all fields)
  │     │
  │     └─► Log progress every 100 records
  │
  └─► [Complete]
        └─► Log total summary
        └─► Close database connection
        └─► Exit with success code

END
```

### 3. Investment Score Calculation Flow

**Trigger**: Manual execution or scheduled job (daily at 4 AM)

**Command**: `npm run etl:scores zip` or `npm run etl:scores county`

**Process Flow**:

```
START (with geo_type parameter)
  │
  ├─► [Initialize]
  │     └─► Load environment variables
  │     └─► Connect to database
  │     └─► Set as_of_date = today
  │
  ├─► [Fetch Geographies]
  │     └─► Query dim_geography
  │     └─► WHERE geo_type = geo_type
  │     └─► AND has market data (via JOIN)
  │     └─► Store in array for processing
  │
  ├─► [Collect Raw Features]
  │     │
  │     ├─► [For Each Geography]
  │     │     │
  │     │     ├─► Fetch Market Metrics
  │     │     │     └─► Query fact_market_metrics
  │     │     │     └─► WHERE geography_id = geo.id
  │     │     │     └─► AND period_type = 'month'
  │     │     │     └─► ORDER BY period_start_date DESC
  │     │     │     └─► LIMIT 36 (3 years)
  │     │     │
  │     │     ├─► IF insufficient data (< 36 months):
  │     │     │     └─► Log warning
  │     │     │     └─► Skip geography
  │     │     │     └─► Continue to next
  │     │     │
  │     │     ├─► Fetch Demographics
  │     │     │     └─► Query fact_demographics
  │     │     │     └─► WHERE geography_id = geo.id
  │     │     │     └─► ORDER BY acs_year DESC
  │     │     │     └─► LIMIT 1 (latest year)
  │     │     │
  │     │     ├─► IF demographics missing:
  │     │     │     └─► Log warning
  │     │     │     └─► Use partial scoring (skip affordability)
  │     │     │
  │     │     ├─► Calculate Growth Features
  │     │     │     └─► price_now = metrics[0].medianSalePrice
  │     │     │     └─► price_12mo = metrics[11].medianSalePrice
  │     │     │     └─► price_36mo = metrics[35].medianSalePrice
  │     │     │     └─► yoy_growth = (price_now - price_12mo) / price_12mo * 100
  │     │     │     └─► cagr_3y = ((price_now / price_36mo)^(1/3) - 1) * 100
  │     │     │
  │     │     ├─► Calculate Affordability Features
  │     │     │     └─► price_to_income = price_now / demographics.medianHouseholdIncome
  │     │     │     └─► rent_yield = (demographics.medianGrossRent * 12) / price_now * 100
  │     │     │
  │     │     ├─► Calculate Liquidity Features
  │     │     │     └─► dom_recent = AVG(metrics[0:2].medianDaysOnMarket)
  │     │     │     └─► sales_recent = AVG(metrics[0:2].homesSold)
  │     │     │
  │     │     ├─► Calculate Risk Features
  │     │     │     └─► renter_share = demographics.renterOccupiedShare
  │     │     │
  │     │     └─► Store Features
  │     │           └─► features[geo.id] = {
  │     │                 yoy_growth,
  │     │                 cagr_3y,
  │     │                 price_to_income,
  │     │                 rent_yield,
  │     │                 dom_recent,
  │     │                 sales_recent,
  │     │                 renter_share,
  │     │                 // ... all features
  │     │               }
  │     │
  │     └─► Log collection summary
  │
  ├─► [Normalize Features]
  │     │
  │     ├─► [For Each Feature Type]
  │     │     │
  │     │     ├─► Extract all values
  │     │     │     └─► values = features.map(f => f.yoy_growth)
  │     │     │
  │     │     ├─► Calculate min and max
  │     │     │     └─► min = MIN(values)
  │     │     │     └─► max = MAX(values)
  │     │     │
  │     │     ├─► Normalize (0-100 scale)
  │     │     │     └─► FOR EACH value:
  │     │     │           normalized = (value - min) / (max - min) * 100
  │     │     │
  │     │     └─► Invert if needed
  │     │           └─► IF feature is "lower is better" (DOM, price-to-income):
  │     │                 normalized = 100 - normalized
  │     │
  │     └─► Store normalized features
  │
  ├─► [Calculate Scores]
  │     │
  │     ├─► [For Each Geography]
  │     │     │
  │     │     ├─► Get normalized features
  │     │     │
  │     │     ├─► Growth Score (45% weight)
  │     │     │     └─► score = (norm_yoy * 0.6) + (norm_cagr_3y * 0.4)
  │     │     │
  │     │     ├─► Affordability Score (25% weight)
  │     │     │     └─► score = (norm_inv_price_to_income * 0.7) + (norm_rent_yield * 0.3)
  │     │     │
  │     │     ├─► Liquidity Score (20% weight)
  │     │     │     └─► score = (norm_inv_dom * 0.6) + (norm_sales_volume * 0.4)
  │     │     │
  │     │     ├─► Risk Score (10% weight)
  │     │     │     └─► score = norm_renter_share
  │     │     │
  │     │     └─► Overall Score
  │     │           └─► score = (growth * 0.45) + 
  │     │                       (affordability * 0.25) + 
  │     │                       (liquidity * 0.20) + 
  │     │                       (risk * 0.10)
  │     │
  │     └─► Validate scores (0-100 range)
  │
  ├─► [Persist Scores]
  │     │
  │     ├─► [For Each Geography]
  │     │     │
  │     │     └─► Upsert Investment Score
  │     │           │
  │     │           └─► ON CONFLICT (geography_id, as_of_date)
  │     │                 DO UPDATE SET
  │     │                   score_overall = EXCLUDED.score_overall,
  │     │                   score_growth = EXCLUDED.score_growth,
  │     │                   ... (all scores and components)
  │     │
  │     └─► Log progress every 100 records
  │
  └─► [Complete]
        └─► Log total summary
        └─► Close database connection
        └─► Exit with success code

END
```

## API Request Flows

### 1. GET /markets/top

**User Action**: Request top-ranked markets

**Flow**:

```
CLIENT REQUEST
  │
  └─► GET /markets/top?geo_type=zip&limit=20&state=FL
        │
        ▼
    [API SERVER]
        │
        ├─► Parse Query Parameters
        │     └─► geo_type = 'zip' (default if not provided)
        │     └─► limit = 20 (default 50 if not provided)
        │     └─► state = 'FL' (optional)
        │     └─► min_population (optional)
        │
        ├─► Validate Parameters
        │     └─► geo_type in ['zip', 'county', 'state']
        │     └─► limit between 1 and 500
        │     └─► state is 2-letter code (if provided)
        │     └─► IF INVALID: Return 400 Bad Request
        │
        ├─► Query Database
        │     │
        │     └─► SELECT 
        │           geography.*,
        │           investment_score.*,
        │           latest_metrics.*,
        │           demographics.*
        │         FROM dim_geography
        │         INNER JOIN fact_investment_score
        │           ON geography.id = investment_score.geography_id
        │         LEFT JOIN fact_market_metrics AS latest_metrics
        │           ON geography.id = latest_metrics.geography_id
        │         LEFT JOIN fact_demographics
        │           ON geography.id = demographics.geography_id
        │         WHERE geography.geo_type = 'zip'
        │           AND geography.state_code = 'FL'  (if state provided)
        │           AND demographics.population_total >= X  (if min_population)
        │         ORDER BY investment_score.score_overall DESC
        │         LIMIT 20
        │
        ├─► Transform Results
        │     │
        │     └─► Map database rows to API format
        │           └─► geography { id, geoType, name, ... }
        │           └─► score { overall, growth, affordability, ... }
        │           └─► latestMetrics { medianSalePrice, ... }
        │           └─► demographics { populationTotal, ... }
        │
        ├─► Return Response
        │     └─► Status: 200 OK
        │     └─► Content-Type: application/json
        │     └─► Body: JSON array of markets
        │
        └─► Error Handling
              ├─► Database error → 500 Internal Server Error
              ├─► Invalid params → 400 Bad Request
              └─► No results → 200 OK with empty array

CLIENT RECEIVES
  └─► JSON array of top markets
```

### 2. GET /markets/:id/timeseries

**User Action**: View historical trends for a market

**Flow**:

```
CLIENT REQUEST
  │
  └─► GET /markets/uuid-123/timeseries?from=2023-01-01&to=2024-01-01
        │
        ▼
    [API SERVER]
        │
        ├─► Parse Parameters
        │     └─► geographyId = 'uuid-123' (from URL path)
        │     └─► period_type = 'month' (default)
        │     └─► from = '2023-01-01' (optional)
        │     └─► to = '2024-01-01' (optional)
        │
        ├─► Validate Parameters
        │     └─► geographyId is valid UUID
        │     └─► period_type in ['month', 'week']
        │     └─► from/to are valid ISO dates
        │     └─► from <= to
        │
        ├─► Query Geography
        │     └─► SELECT * FROM dim_geography WHERE id = 'uuid-123'
        │     └─► IF NOT FOUND: Return 404 Not Found
        │
        ├─► Query Time Series
        │     │
        │     └─► SELECT *
        │         FROM fact_market_metrics
        │         WHERE geography_id = 'uuid-123'
        │           AND period_type = 'month'
        │           AND period_start_date >= '2023-01-01'  (if from provided)
        │           AND period_start_date <= '2024-01-01'  (if to provided)
        │         ORDER BY period_start_date DESC
        │
        ├─► Calculate Statistics
        │     └─► count = metrics.length
        │     └─► earliestDate = MIN(period_start_date)
        │     └─► latestDate = MAX(period_start_date)
        │
        ├─► Transform Results
        │     └─► Map to API format
        │
        └─► Return Response
              └─► Status: 200 OK
              └─► Body: { geography, timeseries[], stats }

CLIENT RECEIVES
  └─► Time series data with statistics
```

### 3. GET /markets/:id/profile

**User Action**: View complete market profile

**Flow**:

```
CLIENT REQUEST
  │
  └─► GET /markets/uuid-123/profile
        │
        ▼
    [API SERVER]
        │
        ├─► Validate Parameters
        │     └─► geographyId is valid UUID
        │
        ├─► Parallel Database Queries
        │     │
        │     ├─► Query 1: Geography
        │     │     └─► SELECT * FROM dim_geography
        │     │         WHERE id = 'uuid-123'
        │     │
        │     ├─► Query 2: Latest Market Metrics
        │     │     └─► SELECT * FROM fact_market_metrics
        │     │         WHERE geography_id = 'uuid-123'
        │     │         ORDER BY period_start_date DESC
        │     │         LIMIT 1
        │     │
        │     ├─► Query 3: Demographics
        │     │     └─► SELECT * FROM fact_demographics
        │     │         WHERE geography_id = 'uuid-123'
        │     │         ORDER BY acs_year DESC
        │     │         LIMIT 1
        │     │
        │     └─► Query 4: Investment Score
        │           └─► SELECT * FROM fact_investment_score
        │               WHERE geography_id = 'uuid-123'
        │               ORDER BY as_of_date DESC
        │               LIMIT 1
        │
        ├─► Check Results
        │     └─► IF geography NOT FOUND: Return 404
        │     └─► Other tables may be null (return partial data)
        │
        ├─► Transform Results
        │     └─► Combine all data into profile object
        │
        └─► Return Response
              └─► Status: 200 OK
              └─► Body: Complete profile

CLIENT RECEIVES
  └─► Comprehensive market profile
```

## Subprocess Execution

### How to Run ETL Subprocesses

#### 1. Run Redfin ETL Only

```bash
cd backend
npm run etl:redfin
```

**Use Case**:
- New Redfin data available
- Initial data load
- Fixing data quality issues

#### 2. Run Census ETL for Specific Geography Type

```bash
# Counties only
npm run etl:census county

# ZIP codes only
npm run etl:census zip
```

**Use Case**:
- Census data updated annually
- Adding new geography level
- Refreshing demographic data

#### 3. Calculate Scores for Specific Geography Type

```bash
# ZIP codes
npm run etl:scores zip

# Counties
npm run etl:scores county

# States
npm run etl:scores state
```

**Use Case**:
- Daily score updates
- After loading new market data
- Recalculating with new algorithm

#### 4. Run Complete ETL Pipeline

```bash
npm run etl:all
```

**What it does**:
1. Runs Redfin ETL
2. Runs Census ETL for counties
3. Runs Census ETL for ZIPs
4. Calculates scores for counties
5. Calculates scores for ZIPs

**Use Case**:
- Initial setup
- Complete data refresh
- Weekly/monthly full reload

### ETL Job Monitoring

```bash
# View real-time logs
tail -f /var/log/mynexthome/etl.log

# Check job status
ps aux | grep "npm run etl"

# Check database record counts
psql $DATABASE_URL -c "
  SELECT 
    'geographies' as table, COUNT(*) as count FROM dim_geography
  UNION ALL
  SELECT 'metrics', COUNT(*) FROM fact_market_metrics
  UNION ALL
  SELECT 'demographics', COUNT(*) FROM fact_demographics
  UNION ALL
  SELECT 'scores', COUNT(*) FROM fact_investment_score;
"
```

## User Scenarios

### Scenario 1: Investor Finding Best ZIP Codes

**Goal**: Find top investment opportunities in Florida

**Steps**:

1. **Request Top Markets**
   ```bash
   curl "http://localhost:3000/markets/top?geo_type=zip&limit=20&state=FL&min_population=5000"
   ```

2. **Review Results**
   - Sort by overall score
   - Note top 5 ZIP codes

3. **Deep Dive on Top ZIP**
   ```bash
   # Get full profile
   curl "http://localhost:3000/markets/{top-zip-id}/profile"
   ```

4. **View Historical Trends**
   ```bash
   # Last 3 years
   curl "http://localhost:3000/markets/{top-zip-id}/timeseries?from=2021-01-01"
   ```

5. **Compare Top 3 ZIPs**
   ```bash
   curl "http://localhost:3000/markets/compare?ids={id1},{id2},{id3}"
   ```

6. **Decision**
   - Compare growth trends
   - Evaluate affordability
   - Check liquidity (days on market)
   - Choose best investment

### Scenario 2: Homebuyer Researching Relocation

**Goal**: Find affordable, growing markets in California

**Steps**:

1. **Find Top Counties**
   ```bash
   curl "http://localhost:3000/markets/top?geo_type=county&state=CA&limit=15"
   ```

2. **Filter by Affordability**
   - Review `score.affordability`
   - Review `latestMetrics.medianSalePrice`
   - Review `demographics.medianHouseholdIncome`

3. **Check ZIP Codes in Top County**
   ```bash
   # Get county details
   curl "http://localhost:3000/markets/{county-id}/profile"
   
   # Find ZIPs in that county
   curl "http://localhost:3000/markets/top?geo_type=zip&state=CA" | \
     jq '.[] | select(.geography.fullName | contains("County Name"))'
   ```

4. **Analyze Trends**
   ```bash
   curl "http://localhost:3000/markets/{zip-id}/timeseries?from=2022-01-01"
   ```

5. **Decision**
   - Balance price and growth
   - Consider demographics (schools, etc.)
   - Check market health (months of supply)

### Scenario 3: Data Analyst Building Dashboard

**Goal**: Create real-time market dashboard

**Steps**:

1. **Set Up Data Pipeline**
   ```python
   import requests
   import pandas as pd
   
   BASE_URL = "http://localhost:3000"
   
   # Fetch top 50 markets
   response = requests.get(f"{BASE_URL}/markets/top", params={
       "geo_type": "zip",
       "limit": 50
   })
   markets = response.json()
   
   # Convert to DataFrame
   df = pd.DataFrame([{
       'zip': m['geography']['name'],
       'state': m['geography']['stateCode'],
       'score': m['score']['overall'],
       'price': m['latestMetrics']['medianSalePrice'],
       'growth': m['score']['growth']
   } for m in markets])
   ```

2. **Fetch Time Series for Visualization**
   ```python
   def get_timeseries(geography_id):
       response = requests.get(
           f"{BASE_URL}/markets/{geography_id}/timeseries",
           params={'from': '2022-01-01'}
       )
       return response.json()['timeseries']
   
   # Get data for top market
   top_id = markets[0]['geography']['id']
   timeseries = get_timeseries(top_id)
   ```

3. **Create Visualizations**
   ```python
   import matplotlib.pyplot as plt
   
   # Price trend
   dates = [t['periodStartDate'] for t in timeseries]
   prices = [t['medianSalePrice'] for t in timeseries]
   plt.plot(dates, prices)
   plt.title('Median Sale Price Trend')
   plt.show()
   ```

4. **Schedule Updates**
   ```python
   # Run daily to refresh dashboard
   import schedule
   
   def update_dashboard():
       markets = fetch_markets()
       save_to_database(markets)
       regenerate_charts()
   
   schedule.every().day.at("06:00").do(update_dashboard)
   ```

## System Maintenance Flows

### Daily Maintenance

```bash
#!/bin/bash
# daily-maintenance.sh

# 1. Run Redfin ETL (if new data available)
cd /opt/mynexthome/backend
npm run etl:redfin

# 2. Calculate updated scores
npm run etl:scores zip
npm run etl:scores county

# 3. Backup database
pg_dump $DATABASE_URL | gzip > /backups/mynexthome-$(date +%Y%m%d).sql.gz

# 4. Clean old backups (keep 30 days)
find /backups -name "mynexthome-*.sql.gz" -mtime +30 -delete

# 5. Check API health
curl -f http://localhost:3000/health || echo "API health check failed!" | mail -s "Alert" admin@example.com
```

### Monthly Maintenance

```bash
#!/bin/bash
# monthly-maintenance.sh

# 1. Run Census ETL (new ACS data)
cd /opt/mynexthome/backend
npm run etl:census county
npm run etl:census zip

# 2. Recalculate all scores
npm run etl:scores county
npm run etl:scores zip
npm run etl:scores state

# 3. Database maintenance
psql $DATABASE_URL <<EOF
  VACUUM ANALYZE;
  REINDEX DATABASE mynexthome;
EOF

# 4. Archive old data (older than 5 years)
psql $DATABASE_URL <<EOF
  DELETE FROM fact_market_metrics 
  WHERE period_start_date < NOW() - INTERVAL '5 years';
EOF

# 5. Generate monthly report
curl "http://localhost:3000/markets/top?geo_type=state&limit=50" > /reports/monthly-$(date +%Y%m).json
```

### Troubleshooting Flow

**Problem**: API returns empty results

**Debug Steps**:

```bash
# 1. Check API health
curl http://localhost:3000/health

# 2. Check database connection
psql $DATABASE_URL -c "SELECT 1"

# 3. Check data exists
psql $DATABASE_URL -c "SELECT COUNT(*) FROM fact_investment_score"

# 4. Check recent scores
psql $DATABASE_URL -c "
  SELECT as_of_date, COUNT(*) 
  FROM fact_investment_score 
  GROUP BY as_of_date 
  ORDER BY as_of_date DESC 
  LIMIT 5"

# 5. If no recent scores, run score calculation
npm run etl:scores zip

# 6. Check API logs
tail -f /var/log/mynexthome/api.log

# 7. Restart API server
pm2 restart mynexthome-api
```

---

This completes the application flows documentation. For more details, refer to the other documentation files or contact support.
