# 📊 Data Model - Next Investment Platform

## Document Information

* **Version**: 1.0.0
* **Last Updated**: January 2026
* **Status**: Active Development

## Table of Contents

1. [Database Schema](#database-schema)
2. [Data Models](#data-models)
3. [Data Relationships](#data-relationships)
4. [Data Types & Formats](#data-types--formats)
5. [Indexes & Performance](#indexes--performance)
6. [Data Lifecycle](#data-lifecycle)
7. [Migration Strategy](#migration-strategy)

***

## 1. Database Schema

### 1.1 Overview

The Next Investment platform uses **PostgreSQL 13+** with **SQLAlchemy ORM** for data persistence. The schema is designed for:

* **Flexibility**: JSONB storage for semi-structured stock data
* **Performance**: Strategic indexes on frequently queried columns
* **Scalability**: Efficient queries with proper normalization
* **Maintainability**: Clear table relationships and constraints

### 1.2 Schema Diagram

```sql
┌────────────────────────────────────────────────────────────────┐
│                    DATABASE: nextinvestment                     │
└────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  Table: stock_cache                                              │
├──────────────────────────────────────────────────────────────────┤
│  PK  symbol           VARCHAR(10)     NOT NULL                   │
│      data             JSONB           NOT NULL                   │
│      last_updated     TIMESTAMP       NOT NULL                   │
│      created_at       TIMESTAMP       DEFAULT NOW()              │
│                                                                   │
│  Constraints:                                                    │
│    PRIMARY KEY (symbol)                                          │
│    CHECK (symbol ~ '^[A-Z]{1,10}$')  -- Valid ticker format     │
│                                                                   │
│  Indexes:                                                        │
│    idx_stock_symbol ON symbol USING btree                        │
│    idx_stock_updated ON last_updated USING btree                 │
│    idx_stock_data_gin ON data USING gin                          │
└──────────────────────────────────────────────────────────────────┘
                              ↓
                    (1:N relationship)
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│  Table: watchlists                                               │
├──────────────────────────────────────────────────────────────────┤
│  PK  id               SERIAL          NOT NULL                   │
│  FK  symbol           VARCHAR(10)     NOT NULL                   │
│      user_id          VARCHAR(100)    NOT NULL                   │
│      added_at         TIMESTAMP       DEFAULT NOW()              │
│      notes            TEXT            NULL                       │
│                                                                   │
│  Constraints:                                                    │
│    PRIMARY KEY (id)                                              │
│    FOREIGN KEY (symbol) REFERENCES stock_cache(symbol)           │
│      ON DELETE CASCADE ON UPDATE CASCADE                         │
│    UNIQUE (user_id, symbol)  -- One entry per user per stock     │
│                                                                   │
│  Indexes:                                                        │
│    idx_watchlist_user ON user_id USING btree                     │
│    idx_watchlist_symbol ON symbol USING btree                    │
│    idx_watchlist_composite ON (user_id, symbol)                  │
└──────────────────────────────────────────────────────────────────┘
                              ↓
                    (N:1 relationship)
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│  Table: user_preferences                                         │
├──────────────────────────────────────────────────────────────────┤
│  PK  user_id          VARCHAR(100)    NOT NULL                   │
│      preferences      JSONB           NOT NULL DEFAULT '{}'      │
│      updated_at       TIMESTAMP       DEFAULT NOW()              │
│      created_at       TIMESTAMP       DEFAULT NOW()              │
│                                                                   │
│  Constraints:                                                    │
│    PRIMARY KEY (user_id)                                         │
│                                                                   │
│  Indexes:                                                        │
│    idx_user_prefs_gin ON preferences USING gin                   │
└──────────────────────────────────────────────────────────────────┘
```

### 1.3 Table Definitions

#### 1.3.1 stock\_cache

**Purpose**: Caches complete stock data to minimize API calls and improve performance.

```sql
CREATE TABLE stock_cache (
    symbol VARCHAR(10) PRIMARY KEY,
    data JSONB NOT NULL,
    last_updated TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_symbol CHECK (symbol ~ '^[A-Z]{1,10}$')
);

-- Indexes
CREATE INDEX idx_stock_symbol ON stock_cache(symbol);
CREATE INDEX idx_stock_updated ON stock_cache(last_updated);
CREATE INDEX idx_stock_data_gin ON stock_cache USING gin(data);

-- Comments
COMMENT ON TABLE stock_cache IS 'Caches stock data from external APIs';
COMMENT ON COLUMN stock_cache.symbol IS 'Stock ticker symbol (e.g., AAPL, GOOGL)';
COMMENT ON COLUMN stock_cache.data IS 'Complete stock data in JSONB format';
COMMENT ON COLUMN stock_cache.last_updated IS 'Timestamp of last data update';
```

**JSONB Data Structure**:

```json
{
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "current_price": 182.52,
  "change": 2.35,
  "change_percent": 1.31,
  "volume": 58420000,
  "market_cap": 2850000000000,
  "sector": "Technology",
  "industry": "Consumer Electronics",
  "price_history": {
    "dates": ["2024-01-01", "2024-01-02", ...],
    "open": [180.00, 181.50, ...],
    "high": [183.00, 184.20, ...],
    "low": [179.50, 180.80, ...],
    "close": [182.50, 183.40, ...],
    "volume": [58420000, 62340000, ...]
  },
  "fundamentals": {
    "pe_ratio": 28.5,
    "pb_ratio": 42.3,
    "ps_ratio": 7.2,
    "peg_ratio": 2.1,
    "debt_to_equity": 1.8,
    "current_ratio": 1.1,
    "quick_ratio": 0.9,
    "roe": 0.15,
    "roa": 0.27,
    "net_margin": 0.26,
    "operating_margin": 0.30,
    "revenue_growth": 0.08,
    "earnings_growth": 0.11
  },
  "news": [
    {
      "headline": "Apple announces new product line",
      "source": "Bloomberg",
      "published_at": "2024-01-15T10:30:00Z",
      "sentiment": "positive",
      "sentiment_score": 0.75
    }
  ],
  "score": {
    "total": 78.5,
    "valuation": 82,
    "growth": 75,
    "profitability": 80,
    "financial_health": 78,
    "sentiment": 77,
    "recommendation": "BUY",
    "confidence": "HIGH"
  },
  "source": "yahoo_finance",
  "fetched_at": "2024-01-15T14:23:45Z"
}
```

#### 1.3.2 watchlists

**Purpose**: Stores user watchlists for quick access to favorite stocks.

```sql
CREATE TABLE watchlists (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    added_at TIMESTAMP DEFAULT NOW(),
    notes TEXT,
    
    -- Foreign key
    CONSTRAINT fk_stock
        FOREIGN KEY (symbol)
        REFERENCES stock_cache(symbol)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    -- Unique constraint (one entry per user per stock)
    CONSTRAINT unique_user_stock UNIQUE (user_id, symbol)
);

-- Indexes
CREATE INDEX idx_watchlist_user ON watchlists(user_id);
CREATE INDEX idx_watchlist_symbol ON watchlists(symbol);
CREATE INDEX idx_watchlist_composite ON watchlists(user_id, symbol);

-- Comments
COMMENT ON TABLE watchlists IS 'User stock watchlists';
COMMENT ON COLUMN watchlists.user_id IS 'User identifier (session ID or auth user ID)';
COMMENT ON COLUMN watchlists.notes IS 'User notes about the stock';
```

**Example Data**:

```sql
id | symbol | user_id      | added_at            | notes
---+--------+--------------+---------------------+------------------------
1  | AAPL   | user_12345   | 2024-01-10 09:30:00 | Watch for earnings
2  | GOOGL  | user_12345   | 2024-01-11 14:20:00 | Strong buy candidate
3  | MSFT   | user_12345   | 2024-01-12 10:15:00 | NULL
4  | TSLA   | user_67890   | 2024-01-13 16:45:00 | High volatility
```

#### 1.3.3 user\_preferences

**Purpose**: Stores user-specific settings and preferences.

```sql
CREATE TABLE user_preferences (
    user_id VARCHAR(100) PRIMARY KEY,
    preferences JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index
CREATE INDEX idx_user_prefs_gin ON user_preferences USING gin(preferences);

-- Auto-update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE user_preferences IS 'User application preferences and settings';
```

**JSONB Preferences Structure**:

```json
{
  "display": {
    "theme": "dark",
    "chart_type": "candlestick",
    "default_period": "1Y"
  },
  "scoring": {
    "weights": {
      "valuation": 0.25,
      "growth": 0.25,
      "profitability": 0.20,
      "financial_health": 0.15,
      "sentiment": 0.15
    }
  },
  "notifications": {
    "email": "user@example.com",
    "price_alerts": true,
    "news_alerts": false
  },
  "dashboard": {
    "default_view": "stock_analysis",
    "show_news": true,
    "stocks_per_page": 10
  }
}
```

***

## 2. Data Models

### 2.1 Stock Model

**File**: `models/stock.py`

```python
from dataclasses import dataclass
from typing import Optional, Dict, List
from datetime import datetime

@dataclass
class Stock:
    """
    Core stock data model representing a publicly traded security.
    
    Attributes:
        symbol: Stock ticker symbol (e.g., "AAPL")
        name: Company name (e.g., "Apple Inc.")
        current_price: Latest stock price
        change: Price change from previous close
        change_percent: Percentage price change
        volume: Trading volume
        market_cap: Market capitalization
        sector: Company sector
        industry: Company industry
        price_52_week_high: 52-week high price
        price_52_week_low: 52-week low price
    """
    symbol: str
    name: str
    current_price: float
    change: Optional[float] = None
    change_percent: Optional[float] = None
    volume: Optional[int] = None
    market_cap: Optional[float] = None
    sector: Optional[str] = None
    industry: Optional[str] = None
    price_52_week_high: Optional[float] = None
    price_52_week_low: Optional[float] = None
    
    def __post_init__(self):
        """Validate stock data after initialization"""
        if not self.symbol or not self.symbol.isupper():
            raise ValueError(f"Invalid symbol: {self.symbol}")
        if self.current_price is not None and self.current_price < 0:
            raise ValueError(f"Price cannot be negative: {self.current_price}")
```

### 2.2 PriceHistory Model

```python
@dataclass
class PriceHistory:
    """
    Historical price data for a stock.
    
    Attributes:
        symbol: Stock ticker symbol
        dates: List of dates for price data
        open: Opening prices
        high: Daily high prices
        low: Daily low prices
        close: Closing prices
        volume: Trading volumes
    """
    symbol: str
    dates: List[datetime]
    open: List[float]
    high: List[float]
    low: List[float]
    close: List[float]
    volume: List[int]
    
    def __len__(self) -> int:
        """Return number of data points"""
        return len(self.dates)
    
    def get_latest_price(self) -> float:
        """Get most recent closing price"""
        return self.close[-1] if self.close else 0.0
    
    def get_price_range(self) -> tuple[float, float]:
        """Get (min, max) price range"""
        all_prices = self.high + self.low
        return (min(all_prices), max(all_prices)) if all_prices else (0.0, 0.0)
```

### 2.3 Fundamentals Model

```python
@dataclass
class Fundamentals:
    """
    Fundamental financial metrics for a stock.
    
    Valuation Metrics:
        pe_ratio: Price-to-Earnings ratio
        pb_ratio: Price-to-Book ratio
        ps_ratio: Price-to-Sales ratio
        peg_ratio: PEG ratio
    
    Profitability Metrics:
        roe: Return on Equity
        roa: Return on Assets
        net_margin: Net profit margin
        operating_margin: Operating margin
        gross_margin: Gross margin
    
    Financial Health:
        debt_to_equity: Debt-to-Equity ratio
        current_ratio: Current ratio
        quick_ratio: Quick ratio
        
    Growth Metrics:
        revenue_growth: Revenue growth rate
        earnings_growth: Earnings growth rate
        eps_growth: EPS growth rate
    """
    # Valuation
    pe_ratio: Optional[float] = None
    pb_ratio: Optional[float] = None
    ps_ratio: Optional[float] = None
    peg_ratio: Optional[float] = None
    
    # Profitability
    roe: Optional[float] = None
    roa: Optional[float] = None
    net_margin: Optional[float] = None
    operating_margin: Optional[float] = None
    gross_margin: Optional[float] = None
    
    # Financial Health
    debt_to_equity: Optional[float] = None
    current_ratio: Optional[float] = None
    quick_ratio: Optional[float] = None
    
    # Growth
    revenue_growth: Optional[float] = None
    earnings_growth: Optional[float] = None
    eps_growth: Optional[float] = None
    
    def is_complete(self) -> bool:
        """Check if all key metrics are available"""
        required_fields = [
            self.pe_ratio, self.pb_ratio, self.roe, 
            self.debt_to_equity, self.current_ratio
        ]
        return all(field is not None for field in required_fields)
```

### 2.4 InvestmentScore Model

```python
@dataclass
class InvestmentScore:
    """
    Investment analysis score and recommendation.
    
    Attributes:
        total_score: Overall score (0-100)
        valuation: Valuation score (0-100)
        growth: Growth score (0-100)
        profitability: Profitability score (0-100)
        financial_health: Financial health score (0-100)
        sentiment: Sentiment score (0-100)
        recommendation: Investment recommendation
        confidence: Confidence level (HIGH, MEDIUM, LOW)
    """
    total_score: float
    valuation: float
    growth: float
    profitability: float
    financial_health: float
    sentiment: float
    recommendation: str
    confidence: str
    
    def get_recommendation_emoji(self) -> str:
        """Get emoji for recommendation"""
        emoji_map = {
            "STRONG BUY": "🟢",
            "BUY": "🟢",
            "HOLD": "🟡",
            "SELL": "🟠",
            "STRONG SELL": "🔴"
        }
        return emoji_map.get(self.recommendation, "⚪")
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for serialization"""
        return {
            "total_score": round(self.total_score, 2),
            "breakdown": {
                "valuation": round(self.valuation, 2),
                "growth": round(self.growth, 2),
                "profitability": round(self.profitability, 2),
                "financial_health": round(self.financial_health, 2),
                "sentiment": round(self.sentiment, 2)
            },
            "recommendation": self.recommendation,
            "confidence": self.confidence
        }
```

### 2.5 NewsArticle Model

```python
@dataclass
class NewsArticle:
    """
    News article with sentiment analysis.
    
    Attributes:
        headline: Article headline
        source: News source
        published_at: Publication timestamp
        url: Article URL
        summary: Article summary/description
        sentiment: Sentiment label (positive, neutral, negative)
        sentiment_score: Numerical sentiment (-1 to 1)
    """
    headline: str
    source: str
    published_at: datetime
    url: Optional[str] = None
    summary: Optional[str] = None
    sentiment: Optional[str] = None
    sentiment_score: Optional[float] = None
    
    def get_sentiment_emoji(self) -> str:
        """Get emoji representing sentiment"""
        if self.sentiment == "positive":
            return "😊"
        elif self.sentiment == "negative":
            return "😞"
        else:
            return "😐"
```

***

## 3. Data Relationships

### 3.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                  ENTITY RELATIONSHIPS                            │
└─────────────────────────────────────────────────────────────────┘

Stock (1) ──────────── (1) PriceHistory
  │                          "has historical data"
  │
  │ (1)
  │
  ├────────────── (1) Fundamentals
  │                    "has financial metrics"
  │
  │ (1)
  │
  ├────────────── (1) InvestmentScore
  │                    "generates score"
  │
  │ (1)
  │
  └────────────── (N) NewsArticle
                       "has news articles"


Watchlist (N) ──────── (1) User
  │                        "belongs to user"
  │
  │ (N)
  │
  └────────────── (1) Stock
                       "tracks stock"


User (1) ──────────── (1) UserPreferences
                           "has preferences"
```

### 3.2 Data Flow Relationships

```
External APIs
    ↓
Stock Cache (PostgreSQL)
    ↓
Stock Model
    ├─→ PriceHistory Model
    ├─→ Fundamentals Model
    ├─→ NewsArticle Models
    └─→ InvestmentScore Model
         ↓
    Presentation Layer
```

***

## 4. Data Types & Formats

### 4.1 Standard Data Types

| Field Type | PostgreSQL Type | Python Type | JSON Type | Validation |
|-----------|----------------|-------------|-----------|------------|
| Symbol | VARCHAR(10) | str | string | ^\[A-Z]{1,10}$ |
| Price | NUMERIC(10,2) | float | number | >= 0 |
| Percentage | NUMERIC(5,2) | float | number | -100 to 100 |
| Volume | BIGINT | int | number | >= 0 |
| Market Cap | BIGINT | int | number | >= 0 |
| Ratio | NUMERIC(10,4) | float | number | >= 0 |
| Timestamp | TIMESTAMP | datetime | string (ISO 8601) | Valid datetime |
| User ID | VARCHAR(100) | str | string | Not empty |
| Notes | TEXT | str | string | \&lt;= 1000 chars |

### 4.2 Date/Time Formats

```python
# Timestamp format (ISO 8601)
"2024-01-15T14:23:45Z"  # UTC timezone
"2024-01-15T09:23:45-05:00"  # With timezone

# Date format
"2024-01-15"  # YYYY-MM-DD

# Python datetime handling
from datetime import datetime, timezone

# Store as UTC
now_utc = datetime.now(timezone.utc)

# Format for JSON
iso_string = now_utc.isoformat()

# Parse from JSON
parsed = datetime.fromisoformat(iso_string)
```

### 4.3 Financial Data Formats

```python
# Price formatting
price = 182.52  # Always 2 decimal places
formatted = f"${price:.2f}"  # "$182.52"

# Percentage formatting
change_pct = 1.31  # Store as decimal (not 0.0131)
formatted = f"{change_pct:+.2f}%"  # "+1.31%"

# Large numbers (market cap, volume)
market_cap = 2850000000000  # 2.85 trillion
formatted = f"${market_cap / 1e12:.2f}T"  # "$2.85T"

# Ratios
pe_ratio = 28.5
formatted = f"{pe_ratio:.2f}x"  # "28.50x"
```

***

## 5. Indexes & Performance

### 5.1 Index Strategy

```sql
-- Stock Cache Indexes
CREATE INDEX idx_stock_symbol ON stock_cache(symbol);
-- Purpose: Fast lookup by symbol (most common query)
-- Type: B-tree
-- Usage: WHERE symbol = 'AAPL'

CREATE INDEX idx_stock_updated ON stock_cache(last_updated);
-- Purpose: Find stale cache entries
-- Type: B-tree
-- Usage: WHERE last_updated < NOW() - INTERVAL '60 minutes'

CREATE INDEX idx_stock_data_gin ON stock_cache USING gin(data);
-- Purpose: Fast JSONB queries
-- Type: GIN
-- Usage: WHERE data @> '{"sector": "Technology"}'

-- Watchlist Indexes
CREATE INDEX idx_watchlist_user ON watchlists(user_id);
-- Purpose: Get all stocks for a user
-- Type: B-tree
-- Usage: WHERE user_id = 'user_12345'

CREATE INDEX idx_watchlist_symbol ON watchlists(symbol);
-- Purpose: Find users watching a stock
-- Type: B-tree
-- Usage: WHERE symbol = 'AAPL'

CREATE INDEX idx_watchlist_composite ON watchlists(user_id, symbol);
-- Purpose: Check if user watches stock
-- Type: B-tree
-- Usage: WHERE user_id = 'user_12345' AND symbol = 'AAPL'
```

### 5.2 Query Performance

```sql
-- Fast: Uses idx_stock_symbol
SELECT data FROM stock_cache WHERE symbol = 'AAPL';

-- Fast: Uses idx_stock_updated
SELECT symbol FROM stock_cache 
WHERE last_updated < NOW() - INTERVAL '60 minutes';

-- Fast: Uses idx_stock_data_gin
SELECT symbol FROM stock_cache 
WHERE data @> '{"sector": "Technology"}';

-- Fast: Uses idx_watchlist_user
SELECT symbol FROM watchlists WHERE user_id = 'user_12345';

-- Slow: Full table scan (add index if needed)
SELECT * FROM stock_cache WHERE data->>'name' LIKE '%Apple%';
```

### 5.3 Performance Optimization

```sql
-- Vacuum and analyze for statistics
VACUUM ANALYZE stock_cache;
VACUUM ANALYZE watchlists;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Identify slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
WHERE query LIKE '%stock_cache%'
ORDER BY total_time DESC
LIMIT 10;
```

***

## 6. Data Lifecycle

### 6.1 Data Creation

```
1. User requests stock data (symbol)
        ↓
2. Check if symbol exists in stock_cache
        ↓
3. If not exists, create new cache entry:
   - Fetch from external APIs
   - Normalize and validate data
   - Calculate investment score
   - INSERT INTO stock_cache
        ↓
4. Return data to application
```

### 6.2 Data Updates

```
1. Check cache freshness (last_updated < 60 min ago?)
        ↓
2. If stale:
   - Fetch fresh data from APIs
   - Recalculate scores
   - UPDATE stock_cache SET data = ..., last_updated = NOW()
        ↓
3. Return updated data
```

### 6.3 Data Deletion

```sql
-- Automatic deletion via foreign key CASCADE
DELETE FROM stock_cache WHERE symbol = 'INVALID';
-- This also deletes from watchlists

-- Manual cleanup of old cache entries
DELETE FROM stock_cache 
WHERE last_updated < NOW() - INTERVAL '30 days'
AND symbol NOT IN (SELECT DISTINCT symbol FROM watchlists);

-- Cleanup orphaned watchlist entries (shouldn't happen due to FK)
DELETE FROM watchlists 
WHERE symbol NOT IN (SELECT symbol FROM stock_cache);
```

### 6.4 Data Archival

```sql
-- Future: Archive old data to separate table
CREATE TABLE stock_cache_archive (
    LIKE stock_cache INCLUDING ALL
);

-- Move old data to archive (quarterly)
INSERT INTO stock_cache_archive
SELECT * FROM stock_cache
WHERE last_updated < NOW() - INTERVAL '90 days'
AND symbol NOT IN (SELECT DISTINCT symbol FROM watchlists);

DELETE FROM stock_cache
WHERE last_updated < NOW() - INTERVAL '90 days'
AND symbol NOT IN (SELECT DISTINCT symbol FROM watchlists);
```

***

## 7. Migration Strategy

### 7.1 Schema Versioning

```sql
-- Track schema version
CREATE TABLE schema_version (
    version INTEGER PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT NOW(),
    description TEXT
);

INSERT INTO schema_version (version, description)
VALUES (1, 'Initial schema creation');
```

### 7.2 Migration Example

```sql
-- Migration: Add earnings_date column to stock_cache data
-- Version: 2
-- Date: 2024-02-01

BEGIN;

-- Update existing records to add earnings_date field
UPDATE stock_cache
SET data = data || '{"earnings_date": null}'::jsonb
WHERE NOT (data ? 'earnings_date');

-- Record migration
INSERT INTO schema_version (version, description)
VALUES (2, 'Add earnings_date field to stock data');

COMMIT;
```

### 7.3 Data Migration Tools

```python
# SQLAlchemy Alembic for migrations
from alembic import op
import sqlalchemy as sa

def upgrade():
    """Add earnings_date to stock data"""
    op.execute("""
        UPDATE stock_cache
        SET data = data || '{"earnings_date": null}'::jsonb
        WHERE NOT (data ? 'earnings_date')
    """)

def downgrade():
    """Remove earnings_date from stock data"""
    op.execute("""
        UPDATE stock_cache
        SET data = data - 'earnings_date'
    """)
```

### 7.4 Backup & Recovery

```bash
# Backup entire database
pg_dump -U postgres nextinvestment > backup_$(date +%Y%m%d).sql

# Backup specific table
pg_dump -U postgres -t stock_cache nextinvestment > stock_cache_backup.sql

# Restore from backup
psql -U postgres nextinvestment < backup_20240115.sql

# Backup to compressed format
pg_dump -U postgres -Fc nextinvestment > backup_20240115.dump

# Restore from compressed backup
pg_restore -U postgres -d nextinvestment backup_20240115.dump
```

***

**Document Control**:

* Created: January 2026
* Owner: Next Investment Team
* Review Cycle: Quarterly
* Next Review: April 2026
