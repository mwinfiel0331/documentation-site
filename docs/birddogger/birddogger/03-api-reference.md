# BirdDogger - API Reference

## Base URL

* **Development**: `http://localhost:3000`
* **Production**: `https://api.birddogger.com` (when deployed)

## API Version

Current version: **v1.0**

All endpoints are prefixed with `/api`.

## Authentication

**Current Status**: No authentication required (MVP)

**Future**: JWT-based authentication with Bearer tokens

```
Authorization: Bearer <token>
```

## Response Format

All API responses follow this structure:

### Success Response (200, 201)

```json
{
  "id": "uuid",
  "field1": "value1",
  "field2": "value2",
  ...
}
```

### Error Response (4xx, 5xx)

```json
{
  "error": "Error message description",
  "details": "Additional error details (optional)"
}
```

## Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input data |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error - Server error |

***

## Wholesalers API

### Create Wholesaler

Create a new wholesaler record.

**Endpoint**: `POST /api/wholesalers`

**Request Body**:

```json
{
  "fullName": "string (optional)",
  "companyName": "string (optional)",
  "primaryEmail": "string (optional)",
  "primaryPhone": "string (optional)",
  "websiteUrl": "string (optional)",
  "markets": ["string"],
  "notes": "string (optional)"
}
```

**Response**: `201 Created`

```json
{
  "id": "uuid",
  "createdAt": "2024-11-22T10:00:00.000Z",
  "updatedAt": "2024-11-22T10:00:00.000Z",
  "fullName": "John Smith",
  "companyName": "Tampa Wholesale Deals LLC",
  "primaryEmail": "john@tampawholesale.com",
  "primaryPhone": "+1-813-555-0100",
  "websiteUrl": "https://tampawholesale.com",
  "notes": "Met at REIA meetup",
  "markets": ["Tampa, FL", "St. Petersburg, FL"],
  "isActive": true,
  "totalListingsTracked": 0,
  "totalDealsClosedEstimate": 0,
  "avgAssignmentFeeEstimate": null,
  "lastSeenAt": null
}
```

**Example**:

```bash
curl -X POST http://localhost:3000/api/wholesalers \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Smith",
    "companyName": "Tampa Wholesale Deals LLC",
    "primaryEmail": "john@tampawholesale.com",
    "primaryPhone": "+1-813-555-0100",
    "markets": ["Tampa, FL"]
  }'
```

***

### List Wholesalers

Retrieve all wholesalers with optional filtering.

**Endpoint**: `GET /api/wholesalers`

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| market | string | Filter by market name |
| sourceType | SourceType | Filter by source type |
| isActive | boolean | Filter by active status (default: true) |
| minListingsTracked | number | Filter by minimum listings count |

**Response**: `200 OK`

```json
[
  {
    "id": "uuid",
    "fullName": "John Smith",
    "companyName": "Tampa Wholesale Deals LLC",
    "primaryEmail": "john@tampawholesale.com",
    "primaryPhone": "+1-813-555-0100",
    "markets": ["Tampa, FL"],
    "isActive": true,
    "totalListingsTracked": 15,
    "totalDealsClosedEstimate": 8
  }
]
```

**Examples**:

```bash
# All wholesalers
curl http://localhost:3000/api/wholesalers

# Filter by market
curl "http://localhost:3000/api/wholesalers?market=Tampa"

# Filter by active status
curl "http://localhost:3000/api/wholesalers?isActive=true"

# Filter by minimum listings
curl "http://localhost:3000/api/wholesalers?minListingsTracked=5"
```

***

### Get Wholesaler

Retrieve a specific wholesaler by ID.

**Endpoint**: `GET /api/wholesalers/:id`

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | UUID | Wholesaler ID |

**Response**: `200 OK`

```json
{
  "id": "uuid",
  "fullName": "John Smith",
  "companyName": "Tampa Wholesale Deals LLC",
  "primaryEmail": "john@tampawholesale.com",
  "primaryPhone": "+1-813-555-0100",
  "markets": ["Tampa, FL"],
  "isActive": true,
  "totalListingsTracked": 15,
  "sources": [
    {
      "id": "uuid",
      "sourceType": "FACEBOOK_GROUP",
      "sourceName": "Tampa Real Estate Investors"
    }
  ],
  "listings": [
    {
      "id": "uuid",
      "headline": "3/2 Fixer Upper",
      "score": 85
    }
  ]
}
```

**Example**:

```bash
curl http://localhost:3000/api/wholesalers/123e4567-e89b-12d3-a456-426614174000
```

***

### Update Wholesaler

Update an existing wholesaler.

**Endpoint**: `PATCH /api/wholesalers/:id`

**Request Body** (all fields optional):

```json
{
  "fullName": "string",
  "companyName": "string",
  "primaryEmail": "string",
  "primaryPhone": "string",
  "websiteUrl": "string",
  "markets": ["string"],
  "notes": "string",
  "totalDealsClosedEstimate": 10,
  "avgAssignmentFeeEstimate": 7500.00
}
```

**Response**: `200 OK` (updated wholesaler object)

**Example**:

```bash
curl -X PATCH http://localhost:3000/api/wholesalers/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "totalDealsClosedEstimate": 15,
    "avgAssignmentFeeEstimate": 7500
  }'
```

***

### Delete Wholesaler (Soft Delete)

Soft delete a wholesaler (sets isActive = false).

**Endpoint**: `DELETE /api/wholesalers/:id`

**Response**: `200 OK`

```json
{
  "message": "Wholesaler marked inactive"
}
```

**Example**:

```bash
curl -X DELETE http://localhost:3000/api/wholesalers/{id}
```

***

### Add Source to Wholesaler

Add a source attribution to a wholesaler.

**Endpoint**: `POST /api/wholesalers/:id/sources`

**Request Body**:

```json
{
  "sourceType": "FACEBOOK_GROUP | INVESTOR_WEBSITE | REI_MEETUP | ...",
  "sourceName": "string",
  "sourceDetails": "string (optional)",
  "sourceUrl": "string (optional)",
  "contactMethod": "DM | PHONE | EMAIL | IN_PERSON | OTHER (optional)"
}
```

**Response**: `201 Created`

```json
{
  "id": "uuid",
  "wholesalerId": "uuid",
  "sourceType": "FACEBOOK_GROUP",
  "sourceName": "Tampa Real Estate Investors",
  "sourceUrl": "https://facebook.com/groups/tamparei",
  "contactMethod": "DM"
}
```

**Example**:

```bash
curl -X POST http://localhost:3000/api/wholesalers/{id}/sources \
  -H "Content-Type: application/json" \
  -d '{
    "sourceType": "FACEBOOK_GROUP",
    "sourceName": "Tampa Real Estate Investors",
    "contactMethod": "DM"
  }'
```

***

## Listings API

### Create Listing

Create a new property listing.

**Endpoint**: `POST /api/listings`

**Request Body**:

```json
{
  "wholesalerId": "uuid (optional)",
  "sourceType": "SourceType enum (required)",
  "sourceName": "string (required)",
  "sourceUrl": "string (optional)",
  "externalId": "string (optional)",
  "headline": "string (required)",
  "description": "string (optional)",
  "addressLine1": "string (optional)",
  "city": "string (optional)",
  "state": "string (optional)",
  "zip": "string (optional)",
  "latitude": "number (optional)",
  "longitude": "number (optional)",
  "bedrooms": "number (optional)",
  "bathrooms": "number (optional)",
  "sqft": "number (optional)",
  "yearBuilt": "number (optional)",
  "askingPrice": "number (optional)",
  "estimatedARV": "number (optional)",
  "estimatedRepairs": "number (optional)",
  "assignmentFee": "number (optional)",
  "dealStatus": "DealStatus enum (optional, default: NEW)",
  "myRole": "MyRole enum (optional, default: UNSET)",
  "market": "string (optional)"
}
```

**Response**: `201 Created`

```json
{
  "id": "uuid",
  "wholesalerId": "uuid",
  "sourceType": "FACEBOOK_GROUP",
  "sourceName": "Tampa Off-Market Deals",
  "headline": "3/2 Block Home - Needs Work",
  "city": "Tampa",
  "state": "FL",
  "askingPrice": 120000,
  "estimatedARV": 220000,
  "score": 85,
  "hotness": "HIGH",
  "keywordFlags": ["cash only", "needs work"],
  "dealStatus": "NEW",
  "myRole": "UNSET"
}
```

**Example**:

```bash
curl -X POST http://localhost:3000/api/listings \
  -H "Content-Type: application/json" \
  -d '{
    "wholesalerId": "{wholesaler-id}",
    "sourceType": "FACEBOOK_GROUP",
    "sourceName": "Tampa Deals",
    "headline": "3/2 Fixer Upper - Cash Only",
    "description": "Needs work. Great opportunity!",
    "city": "Tampa",
    "state": "FL",
    "askingPrice": 120000,
    "estimatedARV": 220000,
    "market": "Tampa, FL"
  }'
```

***

### List Listings

Retrieve all listings with optional filtering.

**Endpoint**: `GET /api/listings`

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| market | string | Filter by market |
| minScore | number | Minimum score (0-100) |
| maxScore | number | Maximum score (0-100) |
| hotness | Hotness | Filter by hotness (LOW/MEDIUM/HIGH) |
| dealStatus | DealStatus | Filter by deal status |
| sourceType | SourceType | Filter by source type |
| wholesalerId | UUID | Filter by wholesaler |
| keywordFlag | string | Filter by keyword flag |

**Response**: `200 OK`

```json
[
  {
    "id": "uuid",
    "headline": "3/2 Fixer Upper",
    "city": "Tampa",
    "state": "FL",
    "askingPrice": 120000,
    "estimatedARV": 220000,
    "score": 85,
    "hotness": "HIGH",
    "dealStatus": "NEW"
  }
]
```

**Examples**:

```bash
# All listings
curl http://localhost:3000/api/listings

# High-scoring deals
curl "http://localhost:3000/api/listings?hotness=HIGH"

# Specific market
curl "http://localhost:3000/api/listings?market=Tampa"

# Score range
curl "http://localhost:3000/api/listings?minScore=60&maxScore=100"

# New deals only
curl "http://localhost:3000/api/listings?dealStatus=NEW"

# Keyword filtered
curl "http://localhost:3000/api/listings?keywordFlag=CASH_ONLY"
```

***

### Get Listing

Retrieve a specific listing by ID.

**Endpoint**: `GET /api/listings/:id`

**Response**: `200 OK`

```json
{
  "id": "uuid",
  "wholesalerId": "uuid",
  "headline": "3/2 Fixer Upper",
  "description": "Cash only. Needs work...",
  "city": "Tampa",
  "state": "FL",
  "askingPrice": 120000,
  "estimatedARV": 220000,
  "score": 85,
  "hotness": "HIGH",
  "keywordFlags": ["cash only", "needs work"],
  "wholesaler": {
    "id": "uuid",
    "fullName": "John Smith"
  },
  "media": [
    {
      "id": "uuid",
      "mediaType": "IMAGE",
      "url": "https://example.com/photo.jpg"
    }
  ]
}
```

**Example**:

```bash
curl http://localhost:3000/api/listings/{id}
```

***

### Update Listing

Update an existing listing.

**Endpoint**: `PATCH /api/listings/:id`

**Request Body** (all fields optional):

```json
{
  "dealStatus": "UNDER_CONTRACT",
  "myRole": "BUYER",
  "estimatedARV": 230000,
  "notes": "Contacted wholesaler, deal looks good"
}
```

**Response**: `200 OK` (updated listing object)

**Example**:

```bash
curl -X PATCH http://localhost:3000/api/listings/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "dealStatus": "UNDER_CONTRACT",
    "myRole": "BUYER"
  }'
```

***

### Delete Listing

Delete a listing.

**Endpoint**: `DELETE /api/listings/:id`

**Response**: `200 OK`

```json
{
  "message": "Listing deleted"
}
```

**Example**:

```bash
curl -X DELETE http://localhost:3000/api/listings/{id}
```

***

### Add Media to Listing

Add media (photo, video, document) to a listing.

**Endpoint**: `POST /api/listings/:id/media`

**Request Body**:

```json
{
  "mediaType": "IMAGE | VIDEO | DOC | OTHER",
  "url": "string",
  "caption": "string (optional)"
}
```

**Response**: `201 Created`

```json
{
  "id": "uuid",
  "listingId": "uuid",
  "mediaType": "IMAGE",
  "url": "https://example.com/photo.jpg",
  "caption": "Front view"
}
```

**Example**:

```bash
curl -X POST http://localhost:3000/api/listings/{id}/media \
  -H "Content-Type: application/json" \
  -d '{
    "mediaType": "IMAGE",
    "url": "https://example.com/property-front.jpg",
    "caption": "Front view of property"
  }'
```

***

## Data Ingestion API

### Ingest Facebook Post

Ingest a deal from a Facebook group post.

**Endpoint**: `POST /api/ingest/facebook-post`

**Request Body**:

```json
{
  "wholesalerName": "string (optional)",
  "wholesalerPhone": "string (optional)",
  "wholesalerEmail": "string (optional)",
  "fbGroupName": "string (required)",
  "postUrl": "string (optional)",
  "headline": "string (required)",
  "description": "string (optional)",
  "city": "string (optional)",
  "state": "string (optional)",
  "askingPrice": "number (optional)",
  "estimatedARV": "number (optional)",
  "bedrooms": "number (optional)",
  "bathrooms": "number (optional)",
  "sqft": "number (optional)"
}
```

**Response**: `201 Created` (listing object with score)

***

### Ingest Investor Website

Ingest a deal from an investor website (MyHouseDeals, BiggerPockets, etc.).

**Endpoint**: `POST /api/ingest/investor-website`

**Request Body**:

```json
{
  "websiteName": "string (required)",
  "externalId": "string (optional)",
  "wholesalerName": "string (optional)",
  "wholesalerEmail": "string (optional)",
  "wholesalerPhone": "string (optional)",
  "listingUrl": "string (optional)",
  "headline": "string (required)",
  "description": "string (optional)",
  "addressLine1": "string (optional)",
  "city": "string (optional)",
  "state": "string (optional)",
  "zip": "string (optional)",
  "bedrooms": "number (optional)",
  "bathrooms": "number (optional)",
  "sqft": "number (optional)",
  "yearBuilt": "number (optional)",
  "askingPrice": "number (optional)",
  "estimatedARV": "number (optional)",
  "estimatedRepairs": "number (optional)",
  "assignmentFee": "number (optional)"
}
```

**Response**: `201 Created`

***

### Ingest REIA Meetup

Record a wholesaler met at a REIA meetup.

**Endpoint**: `POST /api/ingest/reia-meetup`

**Request Body**:

```json
{
  "fullName": "string (required)",
  "companyName": "string (optional)",
  "phone": "string (optional)",
  "email": "string (optional)",
  "meetupName": "string (required)",
  "meetupUrl": "string (optional)",
  "market": "string (optional)",
  "notes": "string (optional)"
}
```

**Response**: `201 Created` (wholesaler object)

***

### Ingest "We Buy Houses" Sign

Record a wholesaler from a "We Buy Houses" sign.

**Endpoint**: `POST /api/ingest/we-buy-houses-sign`

**Request Body**:

```json
{
  "phone": "string (required)",
  "market": "string (optional)",
  "address": "string (optional)",
  "notes": "string (optional)"
}
```

**Response**: `201 Created`

***

### Ingest MLS Investor Special

Ingest an MLS listing tagged for investors.

**Endpoint**: `POST /api/ingest/mls-investor-special`

**Request Body**:

```json
{
  "mlsId": "string (required)",
  "agentName": "string (optional)",
  "agentPhone": "string (optional)",
  "agentEmail": "string (optional)",
  "headline": "string (required)",
  "description": "string (optional)",
  "addressLine1": "string (optional)",
  "city": "string (optional)",
  "state": "string (optional)",
  "zip": "string (optional)",
  "bedrooms": "number (optional)",
  "bathrooms": "number (optional)",
  "sqft": "number (optional)",
  "yearBuilt": "number (optional)",
  "askingPrice": "number (optional)",
  "estimatedARV": "number (optional)"
}
```

**Response**: `201 Created`

***

### Ingest Title Company Referral

Record a wholesaler referred by a title company.

**Endpoint**: `POST /api/ingest/title-company-referral`

**Request Body**:

```json
{
  "wholesalerName": "string (required)",
  "companyName": "string (optional)",
  "phone": "string (optional)",
  "email": "string (optional)",
  "titleCompanyName": "string (required)",
  "titleCompanyContact": "string (optional)",
  "notes": "string (optional)"
}
```

**Response**: `201 Created`

***

### Ingest Hard Money Lender Referral

Record a wholesaler referred by a hard money lender.

**Endpoint**: `POST /api/ingest/hard-money-lender-referral`

**Request Body**:

```json
{
  "wholesalerName": "string (required)",
  "companyName": "string (optional)",
  "phone": "string (optional)",
  "email": "string (optional)",
  "lenderName": "string (required)",
  "lenderContact": "string (optional)",
  "notes": "string (optional)"
}
```

**Response**: `201 Created`

***

### Ingest Bird Dog Referral

Record a wholesaler referred by another bird dog.

**Endpoint**: `POST /api/ingest/bird-dog-referral`

**Request Body**:

```json
{
  "wholesalerName": "string (required)",
  "companyName": "string (optional)",
  "phone": "string (optional)",
  "email": "string (optional)",
  "referredBy": "string (required)",
  "notes": "string (optional)"
}
```

**Response**: `201 Created`

***

## Zillow Ingestion API

### Upload Zillow CSV

Upload a CSV file with property data for bulk ingestion.

**Endpoint**: `POST /api/zillow/upload`

**Content-Type**: `multipart/form-data`

**Request Body**:

* `file`: CSV file

**CSV Format**:

```csv
address,city,state,zip,price,beds,baths,sqft,yearBuilt,url,description,daysOnZillow,status
123 Main St,Tampa,FL,33602,145000,3,2,1500,1950,https://zillow.com/...,Fixer upper,45,For Sale
```

**Response**: `200 OK`

```json
{
  "message": "CSV ingestion complete",
  "result": {
    "totalRows": 100,
    "inserted": 95,
    "updated": 5,
    "skipped": 0,
    "errors": []
  }
}
```

**Example**:

```bash
curl -X POST http://localhost:3000/api/zillow/upload \
  -F "file=@zillow_export.csv"
```

***

### Get Zillow Properties

List all properties imported from Zillow.

**Endpoint**: `GET /api/zillow/properties`

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| city | string | Filter by city |
| state | string | Filter by state |
| minScore | number | Minimum score |

**Response**: `200 OK` (array of listing objects)

***

## Enumerations

### SourceType

```
FACEBOOK_GROUP
INVESTOR_WEBSITE
REI_MEETUP
WE_BUY_HOUSES_SIGN
PUBLIC_RECORDS_ASSIGNMENT
TITLE_COMPANY
HARD_MONEY_LENDER
COUNTY_ASSIGNMENT_LIST
MLS_INVESTOR_SPECIAL
BIRD_DOG_REFERRAL
ZILLOW_EXPORT
```

### DealStatus

```
NEW
UNDER_REVIEW
CONTACTED
UNDER_CONTRACT
CLOSED
DEAD
```

### Hotness

```
LOW (score < 60)
MEDIUM (score 60-79)
HIGH (score ≥ 80)
```

### MyRole

```
BUYER
WHOLESALER_PARTNER
BIRD_DOG
UNSET
```

### ContactMethod

```
DM
PHONE
EMAIL
IN_PERSON
OTHER
```

### MediaType

```
IMAGE
VIDEO
DOC
OTHER
```

### InteractionChannel

```
PHONE
SMS
EMAIL
DM
IN_PERSON
OTHER
```

### InteractionDirection

```
INBOUND
OUTBOUND
```

***

## Deal Scoring Algorithm

Listings are automatically scored on a 0-100 scale:

**Base Score**: 50

**Keyword Bonuses** (+10 each):

* "cash only", "cash deal"
* "needs work", "fixer upper", "handyman special"
* "as-is", "as is"
* "motivated seller", "must sell"
* "below market", "wholesale"

**Price Ratio Bonus**:

* `< 0.60`: +20 points (excellent)
* `0.60-0.70`: +15 points (good)
* `0.70-0.80`: +10 points (okay)
* `> 0.80`: 0 points (marginal)

**Market Bonus**: +5 for preferred markets

**Hotness Classification**:

* `LOW`: score \&lt; 60
* `MEDIUM`: 60 ≤ score \&lt; 80
* `HIGH`: score ≥ 80

***

## Rate Limiting

**Current**: No rate limiting (MVP)

**Future**: 1000 requests/hour per IP address

***

## Error Handling

Common error responses:

**400 Bad Request**:

```json
{
  "error": "Validation failed",
  "details": "Missing required field: headline"
}
```

**404 Not Found**:

```json
{
  "error": "Wholesaler not found"
}
```

**500 Internal Server Error**:

```json
{
  "error": "Internal server error",
  "details": "Database connection failed"
}
```

***

## Health Check

**Endpoint**: `GET /health`

**Response**: `200 OK`

```json
{
  "status": "ok",
  "timestamp": "2024-11-22T18:00:00.000Z"
}
```

***

## Pagination

**Future Feature**: Pagination will be added using cursor-based pagination

Planned query parameters:

* `limit`: Number of results per page (default: 50, max: 100)
* `cursor`: Pagination cursor for next page

***

## Versioning

API versioning will be implemented via URL path:

* `/api/v1/wholesalers`
* `/api/v2/wholesalers` (future)

Current endpoints use implicit v1.
