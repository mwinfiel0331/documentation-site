# MyNextHome - API Reference

## Table of Contents
- [API Overview](#api-overview)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Examples](#examples)

## API Overview

### Base URL

```
Development: http://localhost:3000
Production:  https://api.mynexthome.com
```

### API Version

Current version: **v1** (implicit, no version prefix in URLs)

### Response Format

All responses are in JSON format with appropriate HTTP status codes.

### Request Headers

```http
Content-Type: application/json
Accept: application/json
```

## Authentication

**Current**: No authentication required (public read-only API)

**Future**: JWT token-based authentication for write operations and user-specific features.

```http
Authorization: Bearer <token>
```

## Endpoints

### 1. Health Check

Check API server health status.

**Endpoint**: `GET /health`

**Parameters**: None

**Response**:

```json
{
  "status": "ok",
  "timestamp": "2024-01-18T12:34:56.789Z"
}
```

**Status Codes**:
- `200 OK`: Server is healthy
- `503 Service Unavailable`: Server has issues (database disconnected, etc.)

**Example**:

```bash
curl http://localhost:3000/health
```

---

### 2. Get Top Markets

Retrieve top-ranked geographies by investment score.

**Endpoint**: `GET /markets/top`

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| geo_type | string | No | zip | Geography type: `zip`, `county`, or `state` |
| limit | integer | No | 50 | Maximum number of results (1-500) |
| state | string | No | - | Filter by 2-letter state code (e.g., `FL`, `CA`) |
| min_population | integer | No | - | Minimum population threshold |

**Response**:

```json
[
  {
    "geography": {
      "id": "uuid-123",
      "geoType": "zip",
      "name": "33139",
      "fullName": "Miami Beach, FL 33139",
      "stateCode": "FL"
    },
    "score": {
      "overall": 87.5,
      "growth": 92.3,
      "affordability": 78.2,
      "liquidity": 88.9,
      "risk": 75.5,
      "asOfDate": "2024-01-18T00:00:00.000Z"
    },
    "latestMetrics": {
      "medianSalePrice": 625000,
      "medianListPrice": 649000,
      "medianDaysOnMarket": 35,
      "homesSold": 47,
      "activeInventory": 156,
      "monthsOfSupply": 3.3,
      "periodStartDate": "2024-01-01T00:00:00.000Z"
    },
    "demographics": {
      "populationTotal": 12450,
      "medianHouseholdIncome": 85000,
      "medianGrossRent": 2100,
      "renterOccupiedShare": 62.5,
      "acsYear": 2022
    }
  }
]
```

**Status Codes**:
- `200 OK`: Success
- `400 Bad Request`: Invalid parameters
- `500 Internal Server Error`: Server error

**Examples**:

```bash
# Top 20 ZIP codes nationwide
curl "http://localhost:3000/markets/top?geo_type=zip&limit=20"

# Top 10 ZIP codes in Florida
curl "http://localhost:3000/markets/top?geo_type=zip&limit=10&state=FL"

# Top counties with population > 100,000
curl "http://localhost:3000/markets/top?geo_type=county&min_population=100000"

# Top states
curl "http://localhost:3000/markets/top?geo_type=state"
```

---

### 3. Get Market Time Series

Retrieve historical market data for a specific geography.

**Endpoint**: `GET /markets/:geographyId/timeseries`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| geographyId | string | Yes | Geography UUID |

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| period_type | string | No | month | Period type: `month` or `week` |
| from | string | No | - | Start date (ISO format: YYYY-MM-DD) |
| to | string | No | - | End date (ISO format: YYYY-MM-DD) |

**Response**:

```json
{
  "geography": {
    "id": "uuid-123",
    "geoType": "zip",
    "name": "33139",
    "fullName": "Miami Beach, FL 33139",
    "stateCode": "FL"
  },
  "timeseries": [
    {
      "periodStartDate": "2024-01-01T00:00:00.000Z",
      "periodEndDate": "2024-01-31T23:59:59.999Z",
      "periodType": "month",
      "medianSalePrice": 625000,
      "medianListPrice": 649000,
      "medianPricePerSqft": 450,
      "medianDaysOnMarket": 35,
      "newListings": 89,
      "homesSold": 47,
      "activeInventory": 156,
      "monthsOfSupply": 3.3,
      "priceDropShare": 12.5,
      "soldAboveListShare": 35.2,
      "yoyMedianSalePriceChangePct": 8.5,
      "momMedianSalePriceChangePct": 1.2
    },
    {
      "periodStartDate": "2023-12-01T00:00:00.000Z",
      "periodEndDate": "2023-12-31T23:59:59.999Z",
      "periodType": "month",
      "medianSalePrice": 617000,
      // ... more fields
    }
    // ... more periods
  ],
  "stats": {
    "count": 36,
    "earliestDate": "2021-01-01T00:00:00.000Z",
    "latestDate": "2024-01-01T00:00:00.000Z"
  }
}
```

**Status Codes**:
- `200 OK`: Success
- `400 Bad Request`: Invalid parameters or date format
- `404 Not Found`: Geography not found
- `500 Internal Server Error`: Server error

**Examples**:

```bash
# All available monthly data
curl "http://localhost:3000/markets/uuid-123/timeseries"

# Monthly data for 2023
curl "http://localhost:3000/markets/uuid-123/timeseries?from=2023-01-01&to=2023-12-31"

# Weekly data for last 6 months
curl "http://localhost:3000/markets/uuid-123/timeseries?period_type=week&from=2023-07-01"

# Last 12 months
curl "http://localhost:3000/markets/uuid-123/timeseries?from=2023-01-01&to=2024-01-01"
```

---

### 4. Get Market Profile

Get complete profile (metrics, demographics, scores) for a geography.

**Endpoint**: `GET /markets/:geographyId/profile`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| geographyId | string | Yes | Geography UUID |

**Query Parameters**: None

**Response**:

```json
{
  "geography": {
    "id": "uuid-123",
    "geoType": "zip",
    "name": "33139",
    "fullName": "Miami Beach, FL 33139",
    "stateCode": "FL",
    "countyFips": "12086",
    "lat": 25.7907,
    "lon": -80.1300,
    "parentGeo": {
      "id": "uuid-parent",
      "geoType": "state",
      "name": "Florida",
      "stateCode": "FL"
    }
  },
  "latestMetrics": {
    "periodStartDate": "2024-01-01T00:00:00.000Z",
    "periodEndDate": "2024-01-31T23:59:59.999Z",
    "periodType": "month",
    "source": "redfin",
    "medianSalePrice": 625000,
    "medianListPrice": 649000,
    "medianPricePerSqft": 450,
    "medianDaysOnMarket": 35,
    "newListings": 89,
    "homesSold": 47,
    "activeInventory": 156,
    "monthsOfSupply": 3.3,
    "priceDropShare": 12.5,
    "soldAboveListShare": 35.2,
    "pendingSales": 23,
    "offMarketIn2WeeksShare": 45.8,
    "yoyMedianSalePriceChangePct": 8.5,
    "momMedianSalePriceChangePct": 1.2,
    "yoyNewListingsChangePct": -5.2,
    "yoyActiveInventoryChangePct": 15.3,
    "yoyMedianDomChangePct": -8.7
  },
  "demographics": {
    "acsYear": 2022,
    "source": "census_acs5",
    "populationTotal": 12450,
    "medianHouseholdIncome": 85000,
    "medianGrossRent": 2100,
    "ownerOccupiedShare": 37.5,
    "renterOccupiedShare": 62.5,
    "medianAge": 38.5,
    "bachelorsOrHigherShare": 45.2,
    "meanTravelTimeToWork": 22.5
  },
  "investmentScore": {
    "asOfDate": "2024-01-18T00:00:00.000Z",
    "scoreOverall": 87.5,
    "scoreGrowth": 92.3,
    "scoreAffordability": 78.2,
    "scoreLiquidity": 88.9,
    "scoreRisk": 75.5,
    "growthPriceYoy": 8.5,
    "growthPrice3yCagr": 12.3,
    "inventoryTrend": 3.3,
    "domTrend": 35.0,
    "salesVolumeTrend": 47.0,
    "priceToIncomeRatio": 7.35,
    "rentToPriceProxy": 4.03,
    "renterShare": 62.5,
    "volatilityProxy": 0.15
  }
}
```

**Status Codes**:
- `200 OK`: Success
- `404 Not Found`: Geography not found
- `500 Internal Server Error`: Server error

**Examples**:

```bash
# Get full profile
curl "http://localhost:3000/markets/uuid-123/profile"
```

---

### 5. Compare Markets

Compare multiple geographies side-by-side.

**Endpoint**: `GET /markets/compare`

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| ids | string | Yes | Comma-separated geography UUIDs (max 10) |

**Response**:

```json
{
  "markets": [
    {
      "geography": {
        "id": "uuid-123",
        "geoType": "zip",
        "name": "33139",
        "fullName": "Miami Beach, FL 33139",
        "stateCode": "FL"
      },
      "latestMetrics": {
        "medianSalePrice": 625000,
        "medianDaysOnMarket": 35,
        "homesSold": 47,
        // ... more fields
      },
      "demographics": {
        "populationTotal": 12450,
        "medianHouseholdIncome": 85000,
        // ... more fields
      },
      "investmentScore": {
        "scoreOverall": 87.5,
        "scoreGrowth": 92.3,
        // ... more fields
      }
    },
    {
      "geography": {
        "id": "uuid-456",
        "geoType": "zip",
        "name": "33101",
        // ... more fields
      },
      // ... similar structure
    }
  ],
  "comparisonStats": {
    "count": 2,
    "avgOverallScore": 84.2,
    "avgMedianPrice": 587500,
    "avgDaysOnMarket": 38.5
  }
}
```

**Status Codes**:
- `200 OK`: Success
- `400 Bad Request`: Missing or invalid IDs, too many IDs (> 10)
- `404 Not Found`: One or more geographies not found
- `500 Internal Server Error`: Server error

**Examples**:

```bash
# Compare 3 ZIP codes
curl "http://localhost:3000/markets/compare?ids=uuid-123,uuid-456,uuid-789"

# Compare 2 counties
curl "http://localhost:3000/markets/compare?ids=uuid-county1,uuid-county2"
```

---

## Data Models

### Geography

```typescript
interface Geography {
  id: string;                    // UUID
  geoType: 'nation' | 'state' | 'msa' | 'county' | 'city' | 'zip';
  countryCode: string;           // "US"
  stateCode?: string;            // "FL", "CA"
  stateFips?: string;            // "12"
  countyFips?: string;           // "12086"
  zipCode?: string;              // "33139"
  msaCode?: string;              // MSA/CBSA code
  name: string;                  // "33139", "Miami"
  fullName: string;              // "Miami Beach, FL 33139"
  lat?: number;                  // Latitude
  lon?: number;                  // Longitude
  parentGeoId?: string;          // Parent geography UUID
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp
}
```

### Market Metrics

```typescript
interface MarketMetrics {
  id: string;
  geographyId: string;
  periodStartDate: string;       // ISO timestamp
  periodEndDate: string;         // ISO timestamp
  periodType: 'week' | 'month';
  source: string;                // "redfin"
  
  // Pricing
  medianSalePrice?: number;      // USD
  medianListPrice?: number;      // USD
  medianPricePerSqft?: number;   // USD/sqft
  
  // Market activity
  medianDaysOnMarket?: number;   // Days
  newListings?: number;          // Count
  homesSold?: number;            // Count
  activeInventory?: number;      // Count
  monthsOfSupply?: number;       // Months
  pendingSales?: number;         // Count
  
  // Market indicators
  priceDropShare?: number;       // Percentage (0-100)
  soldAboveListShare?: number;   // Percentage (0-100)
  offMarketIn2WeeksShare?: number; // Percentage (0-100)
  
  // YoY changes
  yoyMedianSalePriceChangePct?: number;
  momMedianSalePriceChangePct?: number;
  yoyNewListingsChangePct?: number;
  yoyActiveInventoryChangePct?: number;
  yoyMedianDomChangePct?: number;
  
  createdAt: string;
  updatedAt: string;
}
```

### Demographics

```typescript
interface Demographics {
  id: string;
  geographyId: string;
  acsYear: number;               // e.g., 2022
  source: string;                // "census_acs5"
  
  populationTotal?: number;
  medianHouseholdIncome?: number;  // USD/year
  medianGrossRent?: number;        // USD/month
  ownerOccupiedShare?: number;     // Percentage (0-100)
  renterOccupiedShare?: number;    // Percentage (0-100)
  medianAge?: number;              // Years
  bachelorsOrHigherShare?: number; // Percentage (0-100)
  meanTravelTimeToWork?: number;   // Minutes
  
  createdAt: string;
  updatedAt: string;
}
```

### Investment Score

```typescript
interface InvestmentScore {
  id: string;
  geographyId: string;
  asOfDate: string;              // ISO timestamp
  periodType: 'week' | 'month';
  
  // Composite scores (0-100)
  scoreOverall?: number;
  scoreGrowth?: number;
  scoreAffordability?: number;
  scoreLiquidity?: number;
  scoreRisk?: number;
  
  // Raw components
  growthPriceYoy?: number;       // Percentage
  growthPrice3yCagr?: number;    // Percentage
  inventoryTrend?: number;
  domTrend?: number;
  salesVolumeTrend?: number;
  priceToIncomeRatio?: number;
  rentToPriceProxy?: number;     // Percentage
  renterShare?: number;          // Percentage (0-100)
  volatilityProxy?: number;
  
  createdAt: string;
  updatedAt: string;
}
```

## Error Handling

### Error Response Format

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Invalid geo_type. Must be one of: zip, county, state"
}
```

### Common Error Codes

| Status Code | Error | Description |
|-------------|-------|-------------|
| 400 | Bad Request | Invalid parameters or request format |
| 404 | Not Found | Resource not found (geography, data, etc.) |
| 500 | Internal Server Error | Server-side error |
| 503 | Service Unavailable | Server is down or database is disconnected |

### Error Examples

**400 Bad Request**:
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "limit must be between 1 and 500"
}
```

**404 Not Found**:
```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Geography with ID uuid-123 not found"
}
```

**500 Internal Server Error**:
```json
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

## Rate Limiting

**Current**: No rate limiting (public beta)

**Future**: Rate limits will be enforced:

- **Anonymous**: 100 requests/minute
- **Authenticated**: 1,000 requests/minute
- **Enterprise**: 10,000 requests/minute

**Rate Limit Headers**:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1705584000
```

**Rate Limit Exceeded Response**:
```json
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again in 45 seconds."
}
```

## Examples

### Complete Workflow Example

```bash
#!/bin/bash

# 1. Check API health
echo "Checking API health..."
curl -s http://localhost:3000/health | jq

# 2. Get top 10 ZIP codes in Florida
echo -e "\nGetting top ZIP codes in FL..."
TOP_MARKETS=$(curl -s "http://localhost:3000/markets/top?geo_type=zip&limit=10&state=FL")
echo $TOP_MARKETS | jq

# 3. Extract first geography ID
GEOGRAPHY_ID=$(echo $TOP_MARKETS | jq -r '.[0].geography.id')
echo -e "\nAnalyzing geography: $GEOGRAPHY_ID"

# 4. Get full profile
echo -e "\nGetting market profile..."
curl -s "http://localhost:3000/markets/$GEOGRAPHY_ID/profile" | jq

# 5. Get time series data
echo -e "\nGetting time series (last 12 months)..."
curl -s "http://localhost:3000/markets/$GEOGRAPHY_ID/timeseries?from=2023-01-01&to=2024-01-01" | jq

# 6. Compare top 3 markets
GEOGRAPHY_IDS=$(echo $TOP_MARKETS | jq -r '.[0:3] | map(.geography.id) | join(",")')
echo -e "\nComparing top 3 markets..."
curl -s "http://localhost:3000/markets/compare?ids=$GEOGRAPHY_IDS" | jq
```

### Python Example

```python
import requests

BASE_URL = "http://localhost:3000"

# Get top markets
response = requests.get(f"{BASE_URL}/markets/top", params={
    "geo_type": "zip",
    "limit": 20,
    "state": "FL"
})

if response.status_code == 200:
    markets = response.json()
    for market in markets[:5]:
        geo = market['geography']
        score = market['score']
        print(f"{geo['fullName']}: Score {score['overall']:.1f}")
else:
    print(f"Error: {response.status_code}")

# Get market profile
geography_id = markets[0]['geography']['id']
profile = requests.get(f"{BASE_URL}/markets/{geography_id}/profile").json()
print(f"\nMedian Price: ${profile['latestMetrics']['medianSalePrice']:,}")
print(f"Population: {profile['demographics']['populationTotal']:,}")
```

### JavaScript Example

```javascript
const BASE_URL = 'http://localhost:3000';

// Get top markets
async function getTopMarkets() {
  const response = await fetch(`${BASE_URL}/markets/top?geo_type=zip&limit=10&state=CA`);
  const markets = await response.json();
  
  markets.forEach(market => {
    console.log(`${market.geography.fullName}: ${market.score.overall.toFixed(1)}`);
  });
  
  return markets;
}

// Get market timeseries
async function getTimeSeries(geographyId) {
  const params = new URLSearchParams({
    from: '2023-01-01',
    to: '2024-01-01'
  });
  
  const response = await fetch(`${BASE_URL}/markets/${geographyId}/timeseries?${params}`);
  const data = await response.json();
  
  return data.timeseries;
}

// Run
getTopMarkets()
  .then(markets => getTimeSeries(markets[0].geography.id))
  .then(timeseries => console.log(`${timeseries.length} months of data`));
```

### Excel/Google Sheets Integration

You can import API data into spreadsheets:

**Google Sheets (using IMPORTDATA)**:
```
=IMPORTDATA("http://localhost:3000/markets/top?geo_type=zip&limit=100")
```

**Excel (Power Query)**:
1. Data → Get Data → From Web
2. Enter URL: `http://localhost:3000/markets/top?geo_type=zip&limit=100`
3. Transform and load data

---

For more information, see the main documentation or contact support.
