# MyNextHome - Data Model Documentation

## Table of Contents
- [Database Schema Overview](#database-schema-overview)
- [Entity Relationship Diagram](#entity-relationship-diagram)
- [Dimension Tables](#dimension-tables)
- [Fact Tables](#fact-tables)
- [Enumerations](#enumerations)
- [Indexes and Constraints](#indexes-and-constraints)
- [Data Dictionary](#data-dictionary)

## Database Schema Overview

MyNextHome uses a **dimensional model** (star schema) optimized for analytics queries. The schema consists of:

- **2 Dimension Tables**: Geography, Date
- **3 Fact Tables**: Market Metrics, Demographics, Investment Scores
- **2 Enums**: Geography Type, Period Type

### Design Principles

1. **Denormalization for Performance**: Fact tables contain denormalized data for faster queries
2. **Type Safety**: Prisma ORM generates TypeScript types from schema
3. **Auditability**: All tables track created_at and updated_at timestamps
4. **Scalability**: UUID primary keys support distributed systems
5. **Data Integrity**: Foreign key constraints ensure referential integrity

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        DIMENSIONAL MODEL (STAR SCHEMA)                   │
└─────────────────────────────────────────────────────────────────────────┘

                            ┌──────────────────────┐
                            │    dim_geography     │
                            ├──────────────────────┤
                            │ id (PK)              │
                            │ geo_type             │◄────┐
                            │ country_code         │     │
                            │ state_code           │     │
                            │ state_fips           │     │ Self-Reference
                            │ county_fips          │     │ (Hierarchy)
                            │ zip_code             │     │
                            │ msa_code             │     │
                            │ name                 │     │
                            │ full_name            │     │
                            │ parent_geo_id (FK)   │─────┘
                            │ lat, lon             │
                            │ created_at           │
                            │ updated_at           │
                            └──────────┬───────────┘
                                       │
                                       │ 1
                                       │
                         ┌─────────────┼─────────────┬──────────────┐
                         │             │             │              │
                         │ N           │ N           │ N            │
                         │             │             │              │
         ┌───────────────▼─────┐  ┌───▼──────────────▼───┐  ┌──────▼──────────────────┐
         │ fact_market_metrics │  │ fact_demographics    │  │ fact_investment_score   │
         ├─────────────────────┤  ├──────────────────────┤  ├─────────────────────────┤
         │ id (PK)             │  │ id (PK)              │  │ id (PK)                 │
         │ geography_id (FK)   │  │ geography_id (FK)    │  │ geography_id (FK)       │
         │ period_start_date   │  │ acs_year             │  │ as_of_date              │
         │ period_end_date     │  │ source               │  │ period_type             │
         │ period_type         │  │                      │  │                         │
         │ source              │  │ population_total     │  │ score_overall           │
         │                     │  │ median_household_inc │  │ score_growth            │
         │ median_sale_price   │  │ median_gross_rent    │  │ score_affordability     │
         │ median_list_price   │  │ owner_occupied_share │  │ score_liquidity         │
         │ median_price_per_sf │  │ renter_occupied_shr  │  │ score_risk              │
         │ median_days_on_mkt  │  │ median_age           │  │                         │
         │ new_listings        │  │ bachelors_or_higher  │  │ growth_price_yoy        │
         │ homes_sold          │  │ mean_travel_time     │  │ growth_price_3y_cagr    │
         │ active_inventory    │  │                      │  │ inventory_trend         │
         │ months_of_supply    │  │ created_at           │  │ dom_trend               │
         │ price_drop_share    │  │ updated_at           │  │ sales_volume_trend      │
         │ sold_above_list_shr │  │                      │  │ price_to_income_ratio   │
         │ pending_sales       │  │                      │  │ rent_to_price_proxy     │
         │ off_market_2wk_shr  │  │                      │  │ renter_share            │
         │                     │  │                      │  │ volatility_proxy        │
         │ yoy_price_change_%  │  │                      │  │                         │
         │ mom_price_change_%  │  │                      │  │ created_at              │
         │ yoy_listings_chg_%  │  │                      │  │ updated_at              │
         │ yoy_inventory_chg_% │  │                      │  │                         │
         │ yoy_dom_change_%    │  │                      │  │                         │
         │                     │  │                      │  │                         │
         │ created_at          │  │                      │  │                         │
         │ updated_at          │  │                      │  │                         │
         └─────────────────────┘  └──────────────────────┘  └─────────────────────────┘

                                   ┌──────────────────┐
                                   │    dim_date      │
                                   ├──────────────────┤
                                   │ date (PK)        │
                                   │ year             │
                                   │ quarter          │
                                   │ month            │
                                   │ month_name       │
                                   │ week_of_year     │
                                   │ is_month_end     │
                                   │ is_quarter_end   │
                                   └──────────────────┘
                                   (Not yet actively used,
                                    available for analytics)
```

### Cardinality Legend
- **1** : One
- **N** : Many
- **FK** : Foreign Key
- **PK** : Primary Key

## Dimension Tables

### dim_geography

**Purpose**: Normalized geography entities supporting hierarchical relationships

**Hierarchy**: Nation → State → MSA/County → City → ZIP

```sql
CREATE TABLE dim_geography (
  id              TEXT PRIMARY KEY,        -- UUID
  geo_type        TEXT NOT NULL,           -- Enum: nation, state, msa, county, city, zip
  country_code    TEXT DEFAULT 'US',
  state_code      TEXT,                    -- 2-letter code (e.g., 'FL', 'CA')
  state_fips      TEXT,                    -- State FIPS code
  county_fips     TEXT,                    -- County FIPS code
  zip_code        TEXT,                    -- ZIP code
  msa_code        TEXT,                    -- Metropolitan Statistical Area code
  name            TEXT NOT NULL,           -- Short name (e.g., 'Miami')
  full_name       TEXT NOT NULL,           -- Full name (e.g., 'Miami, FL')
  parent_geo_id   TEXT,                    -- FK to parent geography
  lat             REAL,                    -- Latitude
  lon             REAL,                    -- Longitude
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (parent_geo_id) REFERENCES dim_geography(id)
);
```

**Indexes**:
- `idx_geo_type_state_zip` on (geo_type, state_code, zip_code)
- `idx_msa_code` on (msa_code)
- `idx_county_fips` on (county_fips)
- `idx_state_code` on (state_code)

**Example Records**:

| id | geo_type | state_code | zip_code | name | full_name | parent_geo_id |
|----|----------|------------|----------|------|-----------|---------------|
| uuid-1 | nation | - | - | United States | United States | NULL |
| uuid-2 | state | FL | - | Florida | Florida | uuid-1 |
| uuid-3 | county | FL | - | Miami-Dade County | Miami-Dade County, FL | uuid-2 |
| uuid-4 | zip | FL | 33101 | 33101 | Miami, FL 33101 | uuid-2 |

### dim_date

**Purpose**: Date dimension for time-based analytics

```sql
CREATE TABLE dim_date (
  date            TIMESTAMP PRIMARY KEY,
  year            INTEGER NOT NULL,
  quarter         INTEGER NOT NULL,      -- 1-4
  month           INTEGER NOT NULL,      -- 1-12
  month_name      TEXT NOT NULL,         -- 'January', 'February', etc.
  week_of_year    INTEGER NOT NULL,      -- 1-53
  is_month_end    BOOLEAN NOT NULL,
  is_quarter_end  BOOLEAN NOT NULL
);
```

**Usage**: Currently populated but not actively joined. Reserved for future analytics features like year-over-year comparisons, quarterly aggregations, etc.

## Fact Tables

### fact_market_metrics

**Purpose**: Core market statistics from Redfin (prices, inventory, sales activity)

**Grain**: One row per geography per period (week or month)

```sql
CREATE TABLE fact_market_metrics (
  id                              TEXT PRIMARY KEY,        -- UUID
  geography_id                    TEXT NOT NULL,           -- FK to dim_geography
  period_start_date               TIMESTAMP NOT NULL,
  period_end_date                 TIMESTAMP NOT NULL,
  period_type                     TEXT NOT NULL,           -- 'week' or 'month'
  source                          TEXT DEFAULT 'redfin',
  
  -- Core metrics from Redfin
  median_sale_price               REAL,                    -- Median home sale price ($)
  median_list_price               REAL,                    -- Median listing price ($)
  median_price_per_sqft           REAL,                    -- Median price per square foot ($/sqft)
  median_days_on_market           REAL,                    -- Median days on market
  new_listings                    INTEGER,                 -- Number of new listings
  homes_sold                      INTEGER,                 -- Number of homes sold
  active_inventory                INTEGER,                 -- Active listings count
  months_of_supply                REAL,                    -- Inventory months of supply
  price_drop_share                REAL,                    -- % of listings with price drops
  sold_above_list_share           REAL,                    -- % sold above list price
  pending_sales                   INTEGER,                 -- Pending sales count
  off_market_in_2_weeks_share     REAL,                    -- % going off-market in 2 weeks
  
  -- Derived metrics (precomputed)
  yoy_median_sale_price_change_pct    REAL,                -- YoY price change %
  mom_median_sale_price_change_pct    REAL,                -- MoM price change %
  yoy_new_listings_change_pct         REAL,                -- YoY new listings change %
  yoy_active_inventory_change_pct     REAL,                -- YoY inventory change %
  yoy_median_dom_change_pct           REAL,                -- YoY DOM change %
  
  created_at                      TIMESTAMP DEFAULT NOW(),
  updated_at                      TIMESTAMP DEFAULT NOW(),
  
  UNIQUE (geography_id, period_start_date, source),
  FOREIGN KEY (geography_id) REFERENCES dim_geography(id)
);
```

**Indexes**:
- `idx_period_start` on (period_start_date)
- `idx_geo_period` on (geography_id, period_start_date)

**Key Metrics Explained**:
- **median_sale_price**: The middle value of all home sale prices in the period
- **median_days_on_market**: How long homes typically stay on market before sale
- **months_of_supply**: Inventory ÷ sales rate (higher = buyer's market, lower = seller's market)
- **price_drop_share**: Indicator of market weakness (higher = more price reductions)
- **sold_above_list_share**: Indicator of market strength (higher = bidding wars)

### fact_demographics

**Purpose**: Demographic data from US Census Bureau ACS 5-year estimates

**Grain**: One row per geography per ACS year

```sql
CREATE TABLE fact_demographics (
  id                          TEXT PRIMARY KEY,        -- UUID
  geography_id                TEXT NOT NULL,           -- FK to dim_geography
  acs_year                    INTEGER NOT NULL,        -- ACS year (e.g., 2022)
  source                      TEXT DEFAULT 'census_acs5',
  
  -- Demographics
  population_total            INTEGER,                 -- Total population
  median_household_income     REAL,                    -- Median household income ($)
  median_gross_rent           REAL,                    -- Median gross rent ($/month)
  owner_occupied_share        REAL,                    -- % owner-occupied housing
  renter_occupied_share       REAL,                    -- % renter-occupied housing
  median_age                  REAL,                    -- Median age (years)
  bachelors_or_higher_share   REAL,                    -- % with bachelor's degree or higher
  mean_travel_time_to_work    REAL,                    -- Mean commute time (minutes)
  
  created_at                  TIMESTAMP DEFAULT NOW(),
  updated_at                  TIMESTAMP DEFAULT NOW(),
  
  UNIQUE (geography_id, acs_year),
  FOREIGN KEY (geography_id) REFERENCES dim_geography(id)
);
```

**Indexes**:
- `idx_acs_year` on (acs_year)

**Key Metrics Explained**:
- **median_household_income**: Used for affordability calculations (price-to-income ratio)
- **median_gross_rent**: Used to estimate rental yield
- **renter_occupied_share**: Indicates strength of rental market for investors
- **bachelors_or_higher_share**: Proxy for economic vitality and demand

### fact_investment_score

**Purpose**: Precomputed investment attractiveness scores for all geographies

**Grain**: One row per geography per calculation date

**Algorithm**: Multi-factor weighted scoring (0-100 scale)

```sql
CREATE TABLE fact_investment_score (
  id                      TEXT PRIMARY KEY,        -- UUID
  geography_id            TEXT NOT NULL,           -- FK to dim_geography
  as_of_date              TIMESTAMP NOT NULL,      -- Score calculation date
  period_type             TEXT DEFAULT 'month',    -- 'week' or 'month'
  
  -- Composite Scores (0-100)
  score_overall           REAL,                    -- Overall investment score
  score_growth            REAL,                    -- Growth potential score
  score_affordability     REAL,                    -- Affordability score
  score_liquidity         REAL,                    -- Market liquidity score
  score_risk              REAL,                    -- Risk/volatility score
  
  -- Raw Components (for transparency)
  growth_price_yoy        REAL,                    -- YoY price growth (%)
  growth_price_3y_cagr    REAL,                    -- 3-year price CAGR (%)
  inventory_trend         REAL,                    -- Inventory trend
  dom_trend               REAL,                    -- Days on market trend
  sales_volume_trend      REAL,                    -- Sales volume trend
  price_to_income_ratio   REAL,                    -- Median price / median income
  rent_to_price_proxy     REAL,                    -- Estimated rental yield
  renter_share            REAL,                    -- Renter-occupied share (%)
  volatility_proxy        REAL,                    -- Price volatility measure
  
  created_at              TIMESTAMP DEFAULT NOW(),
  updated_at              TIMESTAMP DEFAULT NOW(),
  
  UNIQUE (geography_id, as_of_date),
  FOREIGN KEY (geography_id) REFERENCES dim_geography(id)
);
```

**Indexes**:
- `idx_as_of_date` on (as_of_date)
- `idx_score_overall` on (score_overall) -- For top markets queries

**Scoring Methodology**:

1. **Growth Score** (45% weight)
   - Combines YoY price change and 3-year CAGR
   - Higher growth = higher score
   - Normalized across all geographies

2. **Affordability Score** (25% weight)
   - Inverted price-to-income ratio (lower is better)
   - Rent yield proxy
   - Normalized across all geographies

3. **Liquidity Score** (20% weight)
   - Inverted days on market (lower DOM = more liquid)
   - Sales volume growth
   - Normalized across all geographies

4. **Renter Market Score** (10% weight)
   - Higher renter share = better for rental investors
   - Normalized across all geographies

**Normalization**: All features use min-max scaling:
```
normalized_value = (value - min) / (max - min) * 100
```

**Overall Score Calculation**:
```
score_overall = (score_growth * 0.45) + 
                (score_affordability * 0.25) + 
                (score_liquidity * 0.20) + 
                (score_risk * 0.10)
```

## Enumerations

### GeoType

**Values**:
- `nation`: Country level (e.g., United States)
- `state`: State level (e.g., Florida, California)
- `msa`: Metropolitan Statistical Area (e.g., Miami-Fort Lauderdale-West Palm Beach)
- `county`: County level (e.g., Miami-Dade County)
- `city`: City level (e.g., Miami)
- `zip`: ZIP code level (e.g., 33101)

**Hierarchy**:
```
nation
  └─ state
      ├─ msa
      ├─ county
      │   └─ city
      │       └─ zip
      └─ zip
```

### PeriodType

**Values**:
- `week`: Weekly data (7-day period)
- `month`: Monthly data (calendar month)

**Usage**: Redfin provides both weekly and monthly data. Most analytics use monthly for stability.

## Indexes and Constraints

### Primary Keys
All tables use UUID primary keys generated by the database:
- Supports distributed systems
- No collision risk
- Obscures record count from external users

### Foreign Keys
Enforce referential integrity:
- `fact_market_metrics.geography_id` → `dim_geography.id`
- `fact_demographics.geography_id` → `dim_geography.id`
- `fact_investment_score.geography_id` → `dim_geography.id`
- `dim_geography.parent_geo_id` → `dim_geography.id` (self-reference)

### Unique Constraints
Prevent duplicate records:
- `fact_market_metrics`: (geography_id, period_start_date, source)
- `fact_demographics`: (geography_id, acs_year)
- `fact_investment_score`: (geography_id, as_of_date)

### Indexes for Performance
Query optimization indexes:
- Geography filters: geo_type, state_code, zip_code, county_fips, msa_code
- Time-based queries: period_start_date, as_of_date, acs_year
- Composite: (geography_id, period_start_date)
- Ranking queries: score_overall

## Data Dictionary

### Common Fields

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier (primary key) |
| created_at | TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | Record last update timestamp |

### Geography Fields

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| geo_type | ENUM | No | Geography level (nation, state, msa, county, city, zip) |
| country_code | TEXT | No | ISO 2-letter country code (default: 'US') |
| state_code | TEXT | Yes | 2-letter state abbreviation (e.g., 'FL', 'CA') |
| state_fips | TEXT | Yes | 2-digit state FIPS code |
| county_fips | TEXT | Yes | 5-digit county FIPS code (state + county) |
| zip_code | TEXT | Yes | 5-digit ZIP code |
| msa_code | TEXT | Yes | MSA/CBSA code |
| name | TEXT | No | Short name (e.g., 'Miami', '33101') |
| full_name | TEXT | No | Full descriptive name (e.g., 'Miami, FL 33101') |
| parent_geo_id | UUID | Yes | FK to parent geography (hierarchy) |
| lat | REAL | Yes | Latitude (decimal degrees) |
| lon | REAL | Yes | Longitude (decimal degrees) |

### Market Metrics Fields

| Field | Type | Unit | Description |
|-------|------|------|-------------|
| period_start_date | TIMESTAMP | - | Period start date (inclusive) |
| period_end_date | TIMESTAMP | - | Period end date (inclusive) |
| period_type | ENUM | - | 'week' or 'month' |
| source | TEXT | - | Data source (default: 'redfin') |
| median_sale_price | REAL | USD | Median home sale price |
| median_list_price | REAL | USD | Median listing price |
| median_price_per_sqft | REAL | USD/sqft | Median price per square foot |
| median_days_on_market | REAL | days | Median days from listing to sale |
| new_listings | INTEGER | count | New listings in period |
| homes_sold | INTEGER | count | Homes sold in period |
| active_inventory | INTEGER | count | Active listings at period end |
| months_of_supply | REAL | months | Inventory ÷ sales rate |
| price_drop_share | REAL | % | Listings with price reductions |
| sold_above_list_share | REAL | % | Sales above list price |
| pending_sales | INTEGER | count | Pending sales at period end |
| off_market_in_2_weeks_share | REAL | % | Listings off-market within 2 weeks |

### Demographics Fields

| Field | Type | Unit | Description |
|-------|------|------|-------------|
| acs_year | INTEGER | year | ACS dataset year (e.g., 2022) |
| source | TEXT | - | Data source (default: 'census_acs5') |
| population_total | INTEGER | persons | Total population |
| median_household_income | REAL | USD/year | Median household income |
| median_gross_rent | REAL | USD/month | Median gross rent |
| owner_occupied_share | REAL | % | Owner-occupied housing units |
| renter_occupied_share | REAL | % | Renter-occupied housing units |
| median_age | REAL | years | Median age of population |
| bachelors_or_higher_share | REAL | % | Population with bachelor's or higher |
| mean_travel_time_to_work | REAL | minutes | Average commute time |

### Investment Score Fields

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| as_of_date | TIMESTAMP | - | Score calculation date |
| score_overall | REAL | 0-100 | Overall investment score |
| score_growth | REAL | 0-100 | Growth potential score |
| score_affordability | REAL | 0-100 | Affordability score |
| score_liquidity | REAL | 0-100 | Market liquidity score |
| score_risk | REAL | 0-100 | Risk score (currently renter market) |
| growth_price_yoy | REAL | % | Year-over-year price growth |
| growth_price_3y_cagr | REAL | % | 3-year price CAGR |
| inventory_trend | REAL | - | Inventory trend indicator |
| dom_trend | REAL | - | Days on market trend |
| sales_volume_trend | REAL | - | Sales volume trend |
| price_to_income_ratio | REAL | ratio | Median price / median income |
| rent_to_price_proxy | REAL | % | Estimated annual rent yield |
| renter_share | REAL | % | Renter-occupied share |
| volatility_proxy | REAL | - | Price volatility measure |

## Data Quality Rules

### Validation Rules

1. **Geography**:
   - ZIP codes must be 5 digits
   - State codes must be valid 2-letter abbreviations
   - FIPS codes must match standard format
   - Parent-child relationships must be valid (ZIP → County → State → Nation)

2. **Market Metrics**:
   - Prices must be positive
   - Percentages must be 0-100
   - Counts must be non-negative
   - period_end_date must be >= period_start_date

3. **Demographics**:
   - Population must be positive
   - Percentages must sum to 100 where applicable (owner + renter = 100%)
   - Income and rent must be positive

4. **Investment Scores**:
   - All scores must be 0-100
   - as_of_date must not be in the future

### Null Handling

- **Required fields**: geography_id, dates, geo_type
- **Optional metrics**: May be NULL if data unavailable
- **Scoring**: NULLs in input metrics may result in NULL scores

## Future Schema Extensions

### Planned Additions

1. **dim_property**:
   - Property-level records
   - Characteristics (beds, baths, sqft)
   - Ownership history
   - Tax assessments

2. **fact_property_valuation**:
   - AVM (Automated Valuation Model) estimates
   - Comparable sales
   - Rental estimates

3. **dim_user**:
   - User accounts
   - Preferences and settings
   - Saved searches

4. **fact_user_activity**:
   - User behavior tracking
   - Search history
   - Watchlists

5. **bridge_geo_msa**:
   - Many-to-many relationship between cities/ZIPs and MSAs
   - Handle cross-state MSAs
