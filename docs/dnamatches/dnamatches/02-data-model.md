# Data Model

## Overview

The DNA Matches Scraper uses a simple, flat data model optimized for CSV export and analysis in spreadsheet applications. The model consists of two primary entities: DNA Matches and Relatives in Common.

## Entity Relationship Diagram

```
┌─────────────────────────────────────┐
│          DNA Match                  │
├─────────────────────────────────────┤
│ PK  match_id: string                │
│     name: string                    │
│     relationship: string            │
│     shared_dna: string              │
│     shared_segments: string         │
└─────────────────┬───────────────────┘
                  │
                  │ 1
                  │
                  │ has
                  │
                  │ 0..*
                  │
┌─────────────────┴───────────────────┐
│      Relative in Common             │
├─────────────────────────────────────┤
│ PK  relative_id: string             │
│ FK  match_id: string (implicit)     │
│     name: string                    │
│     relationship_to_match: string   │
│     shared_dna_with_relative: string│
└─────────────────────────────────────┘
```

### Relationship Description

- **One DNA Match has zero or more Relatives in Common**
  - A DNA match may have no relatives in common (new match, privacy settings, etc.)
  - A DNA match typically has one or more relatives in common
  - The relationship is implicit through filename mapping in the file system

## Data Entities

### 1. DNA Match

Represents a person who shares DNA with the user on 23andMe.

#### Attributes

| Attribute | Type | Description | Example | Constraints |
|-----------|------|-------------|---------|-------------|
| `match_id` | string | Unique identifier for the match | "match_1" | Primary Key, Not Null, Auto-generated |
| `name` | string | Display name of the DNA match | "John Smith" | Not Null, May be empty string |
| `relationship` | string | Predicted relationship type | "First Cousin" | May be empty |
| `shared_dna` | string | Percentage of shared DNA | "12.5%" | May be empty |
| `shared_segments` | string | Number of DNA segments shared | "23" | May be empty |

#### Data Source

- Scraped from the DNA Relatives page on 23andMe
- Each match card contains these attributes
- CSS selectors: `.relative-card`, `.match-card`, `[data-testid="relative-card"]`

#### Business Rules

1. **Unique Identification**: Each match is assigned a sequential ID during scraping
2. **Name Handling**: Names are displayed as shown on 23andMe (may be pseudonyms)
3. **Empty Values**: If data cannot be extracted, empty string is used
4. **No Duplicates**: Each match appears once per scraping session

### 2. Relative in Common

Represents a person who is related to both the user and a DNA match.

#### Attributes

| Attribute | Type | Description | Example | Constraints |
|-----------|------|-------------|---------|-------------|
| `relative_id` | string | Unique identifier for the relative | "relative_1" | Primary Key, Not Null, Auto-generated |
| `name` | string | Display name of the relative | "Mary Smith" | Not Null, May be empty |
| `relationship_to_match` | string | Relationship to the DNA match | "Mother" | May be empty |
| `shared_dna_with_relative` | string | DNA shared with this relative | "25%" | May be empty |

#### Implicit Foreign Key

- The `match_id` is implicitly stored in the filename
- Format: `relatives_in_common_{match_name}_{match_id}.csv`
- This links relatives back to their DNA match

#### Data Source

- Scraped from individual match detail pages
- Accessed by clicking on a match from the main page
- CSS selectors: `.relatives-in-common`, `.shared-relatives`, `[data-testid="relatives-in-common"]`

#### Business Rules

1. **Per-Match Files**: Each match gets its own file for relatives in common
2. **Optional Data**: A match may have zero relatives in common
3. **Uniqueness**: Relative IDs are unique within a match's file only
4. **Same Person Different IDs**: The same person appearing as relative for multiple matches gets different IDs in each file

## Data Storage

### File System Structure

```
output/
├── all_dna_matches.csv
├── relatives_in_common_John_Smith_match_1.csv
├── relatives_in_common_Jane_Doe_match_2.csv
└── relatives_in_common_Bob_Johnson_match_3.csv
```

### CSV Format Specifications

#### All DNA Matches CSV

**Filename**: `all_dna_matches.csv`

**Headers**:
```csv
match_id,name,relationship,shared_dna,shared_segments
```

**Example Data**:
```csv
match_id,name,relationship,shared_dna,shared_segments
match_1,John Smith,First Cousin,12.5%,23
match_2,Jane Doe,Second Cousin,3.1%,15
match_3,Bob Johnson,Third Cousin,1.2%,8
```

**Characteristics**:
- UTF-8 encoding
- Standard CSV format (comma-delimited)
- Header row included
- One row per DNA match

#### Relatives in Common CSV

**Filename Pattern**: `relatives_in_common_{sanitized_name}_{match_id}.csv`

**Headers**:
```csv
relative_id,name,relationship_to_match,shared_dna_with_relative
```

**Example Data**:
```csv
relative_id,name,relationship_to_match,shared_dna_with_relative
relative_1,Mary Smith,Mother,25%
relative_2,Tom Smith,Uncle,15%
```

**Characteristics**:
- UTF-8 encoding
- Standard CSV format (comma-delimited)
- Header row included
- One row per relative in common
- Filename sanitized (alphanumeric, spaces, underscores, hyphens only)

## Data Types and Formats

### String Formats

All data is stored as strings to preserve original formatting from 23andMe.

#### Match/Relative IDs

- **Format**: `{prefix}_{sequential_number}`
- **Match ID Example**: `match_1`, `match_2`, `match_3`
- **Relative ID Example**: `relative_1`, `relative_2`
- **Generation**: Auto-incremented during scraping

#### Names

- **Format**: Free text as provided by 23andMe
- **Encoding**: UTF-8 to support international characters
- **Examples**: "John Smith", "María García", "李明"

#### Relationships

- **Format**: Free text relationship description
- **Examples**: "First Cousin", "Second Cousin Once Removed", "Distant Cousin"
- **Note**: Provided by 23andMe's prediction algorithm

#### DNA Percentages

- **Format**: Numeric value with % symbol
- **Examples**: "12.5%", "3.1%", "0.8%"
- **Note**: Stored as string to preserve exact formatting

#### Segment Counts

- **Format**: Numeric string
- **Examples**: "23", "15", "8"
- **Note**: Stored as string for consistency

## Data Constraints and Validation

### Required Fields

All fields are required to be present in the CSV, but may contain empty strings if data is unavailable.

### Unique Constraints

- **Match IDs**: Unique within a scraping session
- **Relative IDs**: Unique within a single match's relatives file
- **No Database Constraints**: As files are independent CSVs

### Data Integrity

#### Referential Integrity

- **Implicit**: Through filename convention
- **Match ID** in relatives filename refers to match in all_dna_matches.csv
- **No Enforcement**: System does not validate or enforce referential integrity

#### Filename Sanitization

```python
safe_name = "".join(c for c in match_name if c.isalnum() or c in (' ', '_', '-')).strip()
if not safe_name:
    safe_name = "unnamed_match"
```

**Rules**:
- Allow: alphanumeric characters, spaces, underscores, hyphens
- Remove: special characters that may cause file system issues
- Fallback: Use "unnamed_match" if name becomes empty after sanitization

## Data Lifecycle

### Data Creation

1. **Scraping Session**: Data is collected from 23andMe
2. **In-Memory Storage**: Matches and relatives stored in Python lists/dicts
3. **CSV Export**: Data written to files in output directory

### Data Updates

- **No Update Mechanism**: Each scraping session creates new files
- **Overwrite Behavior**: New scraping overwrites existing files
- **No Incremental Updates**: Complete re-scrape each time

### Data Retention

- **User Controlled**: Data persists until user manually deletes files
- **No Automatic Cleanup**: Files remain indefinitely
- **Backup Responsibility**: User responsible for backup/archival

## Sample Data

### Complete Example Dataset

#### all_dna_matches.csv
```csv
match_id,name,relationship,shared_dna,shared_segments
match_1,John Smith,First Cousin,12.5%,23
match_2,Jane Doe,Second Cousin,3.1%,15
match_3,Bob Johnson,Third Cousin,1.2%,8
```

#### relatives_in_common_John_Smith_match_1.csv
```csv
relative_id,name,relationship_to_match,shared_dna_with_relative
relative_1,Mary Smith,Mother,25%
relative_2,Tom Smith,Uncle,15%
```

#### relatives_in_common_Jane_Doe_match_2.csv
```csv
relative_id,name,relationship_to_match,shared_dna_with_relative
relative_1,Susan Williams,Grandmother,12.5%
```

_Note: Bob Johnson (match_3) has no relatives in common, so no file is created._

## Future Data Model Enhancements

### Potential Improvements

1. **Database Storage**
   - SQLite for single-user local storage
   - PostgreSQL for multi-user cloud deployment
   - Enable complex queries and relationships

2. **Additional Attributes**
   - Profile URLs
   - Last contact date
   - User notes/tags
   - Match acceptance status
   - Shared ancestor information

3. **Normalized Schema**
   - Separate Person table (avoid duplication)
   - Relationship table for many-to-many
   - Match history tracking

4. **Data Enrichment**
   - Calculated relationship confidence scores
   - Family tree integration
   - Geographic data (if available)

5. **Versioning**
   - Track changes over time
   - Historical snapshots
   - Audit trail

## Data Dictionary

### Quick Reference

| Field Name | Entity | Data Type | Max Length | Nullable | Description |
|------------|--------|-----------|------------|----------|-------------|
| match_id | DNA Match | string | - | No | Unique match identifier |
| name | DNA Match | string | - | No* | Match display name |
| relationship | DNA Match | string | - | Yes | Predicted relationship |
| shared_dna | DNA Match | string | - | Yes | DNA percentage shared |
| shared_segments | DNA Match | string | - | Yes | Number of segments |
| relative_id | Relative | string | - | No | Unique relative identifier |
| name | Relative | string | - | No* | Relative display name |
| relationship_to_match | Relative | string | - | Yes | Relative's relationship to match |
| shared_dna_with_relative | Relative | string | - | Yes | DNA shared with relative |

_*Not null but may be empty string_
