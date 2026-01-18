# Data Model Documentation

## Overview

This document describes the data structures and schemas used throughout the Phone Message Scraper application.

## Entity-Relationship Diagram

```
┌─────────────────────────┐
│      ScrapingSession    │
│─────────────────────────│
│ session_id (PK)         │
│ start_time              │
│ end_time                │
│ total_urls              │
│ successful_urls         │
│ failed_urls             │
└───────────┬─────────────┘
            │
            │ 1:N
            │
┌───────────┴─────────────┐
│      ScrapedPage        │
│─────────────────────────│
│ page_id (PK)            │
│ session_id (FK)         │
│ url                     │
│ scraped_at              │
│ text_content            │
│ text_length             │
│ phone_count             │
│ success                 │
│ error_message           │
└───────────┬─────────────┘
            │
            │ 1:N
            │
┌───────────┴─────────────┐
│      PhoneNumber        │
│─────────────────────────│
│ phone_id (PK)           │
│ page_id (FK)            │
│ phone_number (raw)      │
│ formatted_phone         │
│ category                │
│ context_before          │
│ context_after           │
│ extracted_at            │
└─────────────────────────┘


┌─────────────────────────┐
│  NumberBarnSession      │
│─────────────────────────│
│ session_id (PK)         │
│ extraction_start        │
│ extraction_end          │
│ total_messages          │
│ unique_phone_numbers    │
└───────────┬─────────────┘
            │
            │ 1:N
            │
┌───────────┴─────────────┐
│      Message            │
│─────────────────────────│
│ message_id (PK)         │
│ session_id (FK)         │
│ full_text               │
│ primary_phone           │
│ direction               │
│ timestamps_found        │
│ message_length          │
│ word_count              │
│ extracted_at            │
│ page_url                │
│ element_html            │
└───────────┬─────────────┘
            │
            │ M:N
            │
┌───────────┴─────────────┐
│  MessagePhoneNumber     │
│─────────────────────────│
│ message_id (FK)         │
│ phone_number            │
│ position_in_message     │
└─────────────────────────┘
```

## Data Models

### 1. General Web Scraping Models

#### ScrapedPage

Represents a single web page that has been scraped.

**Attributes:**
| Field | Type | Description | Required | Example |
|-------|------|-------------|----------|---------|
| url | string | Source webpage URL | Yes | "https://example.com" |
| text\_content | string | Extracted text content | No | "Contact us at..." |
| text\_length | integer | Character count | Yes | 1500 |
| phone\_count | integer | Number of phones found | Yes | 3 |
| scraped\_at | datetime | Timestamp of scraping | Yes | "2024-10-24T14:30:00Z" |
| success | boolean | Scraping success flag | Yes | true |
| error\_message | string | Error if failed | No | "Connection timeout" |

**Data Format (CSV):**

```csv
url,text_content,text_length,phone_count,scraped_at
https://example.com,"Contact us...",1500,3,2024-10-24T14:30:00Z
```

#### PhoneNumber

Represents an extracted phone number with metadata.

**Attributes:**
| Field | Type | Description | Required | Example |
|-------|------|-------------|----------|---------|
| phone\_number | string | Raw extracted number | Yes | "123-456-7890" |
| formatted\_phone | string | Standardized format | Yes | "(123) 456-7890" |
| source\_url | string | Source webpage | Yes | "https://example.com" |
| category | enum | Number category | Yes | "local" |
| context\_before | string | Text before number | No | "Call us at " |
| context\_after | string | Text after number | No | " for more info" |
| extracted\_at | datetime | Extraction timestamp | Yes | "2024-10-24T14:30:00Z" |

**Category Values:**

* `local`: Standard local phone number
* `toll-free`: 800/888/877/866/855/844 numbers
* `international`: Numbers with country codes

**Data Format (CSV):**

```csv
phone_number,formatted_phone,source_url,category,extracted_at
123-456-7890,(123) 456-7890,https://example.com,local,2024-10-24T14:30:00Z
+1-800-555-0100,1-800-555-0100,https://example.com,toll-free,2024-10-24T14:30:00Z
```

#### SummaryStatistics

Aggregated statistics for a scraping session.

**Attributes:**
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| total\_urls | integer | URLs processed | 10 |
| successful\_urls | integer | Successfully scraped | 8 |
| failed\_urls | integer | Failed to scrape | 2 |
| total\_phone\_numbers | integer | Total phones found | 24 |
| unique\_phone\_numbers | integer | Unique phones | 15 |
| local\_numbers | integer | Local phone count | 12 |
| toll\_free\_numbers | integer | Toll-free count | 3 |
| international\_numbers | integer | International count | 0 |
| total\_characters | integer | Total text chars | 45000 |
| average\_phones\_per\_page | float | Avg phones/page | 3.0 |
| extraction\_timestamp | datetime | When generated | "2024-10-24T14:30:00Z" |

**Data Format (CSV):**

```csv
metric,value
total_urls,10
successful_urls,8
total_phone_numbers,24
unique_phone_numbers,15
```

### 2. NumberBarn Message Models

#### Message

Represents a single message extracted from NumberBarn.

**Attributes:**
| Field | Type | Description | Required | Example |
|-------|------|-------------|----------|---------|
| message\_id | integer | Sequential ID | Yes | 1 |
| full\_text | string | Complete message text | Yes | "Hello, this is..." |
| phone\_numbers | string | All phones (comma-sep) | No | "123-456-7890,987-654-3210" |
| primary\_phone | string | Main phone number | No | "123-456-7890" |
| direction | enum | Message direction | No | "incoming" |
| timestamps\_found | string | Found timestamps | No | "2024-10-20 14:30" |
| message\_length | integer | Character count | Yes | 150 |
| word\_count | integer | Word count | Yes | 25 |
| extracted\_at | datetime | Extraction time | Yes | "2024-10-24T14:30:00Z" |
| page\_url | string | Source page URL | Yes | "https://numberbarn.com/messages" |
| element\_html | string | HTML snippet | No | "\&lt;div class='message'>..." |

**Direction Values:**

* `incoming`: Received message
* `outgoing`: Sent message
* `unknown`: Cannot determine

**Data Format (CSV):**

```csv
message_id,full_text,phone_numbers,primary_phone,direction,timestamps_found,message_length,word_count,extracted_at,page_url,element_html
1,"Hello, this is...","123-456-7890",123-456-7890,incoming,"2024-10-20 14:30",150,25,2024-10-24T14:30:00Z,https://numberbarn.com/messages,"<div>...</div>"
```

#### PhoneNumberSummary

Summary of phone numbers found in messages.

**Attributes:**
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| phone\_number | string | Unique phone number | "123-456-7890" |
| message\_count | integer | Messages from this number | 5 |
| first\_seen | datetime | First encounter | "2024-10-24T14:30:00Z" |

**Data Format (CSV):**

```csv
phone_number,message_count,first_seen
123-456-7890,5,2024-10-24T14:30:00Z
987-654-3210,3,2024-10-24T15:00:00Z
```

#### ExtractionStatistics

Statistics for NumberBarn extraction session.

**Attributes:**
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| total\_messages | integer | Total extracted | 150 |
| unique\_phone\_numbers | integer | Unique phones | 25 |
| total\_characters | integer | Total chars | 45000 |
| total\_words | integer | Total words | 7500 |
| average\_message\_length | float | Avg chars/message | 300.0 |
| average\_word\_count | float | Avg words/message | 50.0 |
| extraction\_timestamp | datetime | When generated | "2024-10-24T14:30:00Z" |

## Data Validation Rules

### Phone Number Validation

**Format Rules:**

1. Must contain at least 10 digits
2. May include country code (+1, etc.)
3. Valid separators: `-`, `.`, space, `(`, `)`
4. Extensions allowed: `ext`, `x`, `#`

**Regex Pattern:**

```regex
(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x|ext\.?)\s*(\d+))?
```

### URL Validation

**Format Rules:**

1. Must start with http:// or https://
2. Must contain valid domain
3. Optional path and query parameters

### Text Content Validation

**Rules:**

1. UTF-8 encoding
2. Newlines normalized to \n
3. Maximum length: unlimited (stored in full)
4. Empty strings allowed (no text found)

## Data Transformation Pipeline

### Phone Number Normalization

```
Input: "Call us at (123) 456-7890 or 800.555.0100"
    ↓
Regex Detection
    ↓
Extracted: ["(123) 456-7890", "800.555.0100"]
    ↓
Categorization
    ↓
Formatted: ["(123) 456-7890" (local), "1-800-555-0100" (toll-free)]
```

### Message Text Processing

```
Raw HTML
    ↓
Element Selection
    ↓
Text Extraction (innerText/textContent)
    ↓
Whitespace Normalization
    ↓
Phone Number Detection
    ↓
Word Count Calculation
    ↓
Structured Message Object
```

## Storage Format

### CSV Encoding

* **Character Set**: UTF-8 with BOM
* **Line Endings**: LF (\n) on Unix, CRLF (\r\n) on Windows
* **Delimiter**: Comma (,)
* **Quote Character**: Double quote (")
* **Escape Character**: Double quote ("") for embedded quotes

### File Naming Conventions

**General Scraping:**

* `phone_numbers_{timestamp}.csv`
* `scraped_text_{timestamp}.csv`
* `combined_data_{timestamp}.csv`
* `summary_stats_{timestamp}.csv`

**NumberBarn Scraping:**

* `all_numberbarn_messages_{timestamp}.csv`
* `phone_numbers_summary_{timestamp}.csv`
* `extraction_stats_{timestamp}.csv`
* `debug_page_structure_{timestamp}.html`

**Timestamp Format**: `YYYYMMDD_HHMMSS`

## Data Size Considerations

### Typical Data Volumes

**General Scraping (10 URLs):**

* Phone numbers CSV: ~5 KB
* Scraped text CSV: ~50 KB
* Combined CSV: ~30 KB
* Summary CSV: ~1 KB

**NumberBarn (100 messages):**

* Messages CSV: ~100 KB
* Phone summary CSV: ~2 KB
* Statistics CSV: ~1 KB

### Scalability Notes

* In-memory processing suitable for \&lt; 10,000 messages
* Large datasets may require streaming processing
* CSV files can grow significantly with text content
* Consider compression for archival

## Data Privacy Considerations

### Sensitive Data

* Phone numbers are PII (Personally Identifiable Information)
* Message content may contain sensitive information
* User credentials never stored

### Recommendations

1. Store output files securely
2. Limit access to CSV files
3. Delete files when no longer needed
4. Consider encryption at rest
5. Comply with data protection regulations (GDPR, CCPA, etc.)

## Schema Evolution

### Version 1.0 (Current)

* Initial schema with basic fields
* Support for multiple phone formats
* Message metadata

### Future Enhancements (Planned)

* Database schema (SQLite/PostgreSQL)
* Relational integrity constraints
* Full-text search indexing
* Attachment metadata
* User/contact relationships
* Conversation threading

## Data Quality Metrics

### Completeness

* % of messages with phone numbers
* % of messages with timestamps
* % of messages with direction classification

### Accuracy

* Phone number format validation rate
* URL validation success rate
* Duplicate detection rate

### Consistency

* Format standardization success
* Category classification agreement
* Timestamp format uniformity
