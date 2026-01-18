# Data Flow

## Overview

This document describes the data flow through the DNA Matches Scraper system, from user configuration through data extraction to final CSV export.

## High-Level Data Flow Diagram

```
┌──────────────┐
│    User      │
│              │
└──────┬───────┘
       │
       │ Creates/Edits
       ▼
┌──────────────┐
│  config.ini  │ ◄─────────────────────┐
└──────┬───────┘                       │
       │                               │
       │ Read by                       │
       ▼                               │
┌──────────────┐                       │
│    main()    │                       │
│   Function   │                       │
└──────┬───────┘                       │
       │                               │
       │ Load config                   │
       │ Validate credentials          │
       │ Initialize                    │
       ▼                               │
┌──────────────────────────────────┐   │
│    DNAMatchesScraper             │   │
│         .run()                   │   │
└──────┬───────────────────────────┘   │
       │                               │
       │ 1. start_browser()            │
       ▼                               │
┌──────────────┐                       │
│  Playwright  │                       │
│   Browser    │                       │
└──────┬───────┘                       │
       │                               │
       │ 2. login()                    │
       ▼                               │
┌──────────────┐                       │
│  23andMe     │                       │
│  Login Page  │                       │
└──────┬───────┘                       │
       │                               │
       │ 3. navigate_to_dna_relatives()│
       ▼                               │
┌──────────────┐                       │
│  23andMe     │                       │
│  DNA Page    │                       │
└──────┬───────┘                       │
       │                               │
       │ 4. scrape_all_matches()       │
       ▼                               │
┌──────────────────────────────────┐   │
│  List of Match Dictionaries      │   │
│  [{match_id, name, ...}, ...]    │   │
└──────┬───────────────────────────┘   │
       │                               │
       │ 5. save_matches_to_csv()      │
       ▼                               │
┌──────────────────────────────────┐   │
│  all_dna_matches.csv             │   │
└──────────────────────────────────┘   │
       │                               │
       │ 6. For each match:            │
       │    scrape_relatives_in_common()│
       ▼                               │
┌──────────────────────────────────┐   │
│  Match Detail Page               │   │
│  (Relatives Section)             │   │
└──────┬───────────────────────────┘   │
       │                               │
       │ Extract relatives             │
       ▼                               │
┌──────────────────────────────────┐   │
│  List of Relative Dictionaries   │   │
│  [{relative_id, name, ...}, ...] │   │
└──────┬───────────────────────────┘   │
       │                               │
       │ 7. save_relatives_to_csv()    │
       ▼                               │
┌──────────────────────────────────┐   │
│  relatives_in_common_*.csv       │   │
└──────────────────────────────────┘   │
       │                               │
       │ 8. close_browser()            │
       ▼                               │
┌──────────────┐                       │
│ Cleanup &    │                       │
│   Complete   │───────────────────────┘
└──────────────┘
```

## Detailed Data Flow

### 1. Configuration Data Flow

```
User edits config.ini
        ↓
┌─────────────────────────────────┐
│ [23andme]                       │
│ email = user@example.com        │
│ password = secret123            │
│                                 │
│ [scraper]                       │
│ delay = 2                       │
│ max_matches = 0                 │
│ output_dir = output             │
└─────────────────────────────────┘
        ↓
load_config() reads file
        ↓
ConfigParser object
        ↓
main() extracts values
        ↓
┌─────────────────────────────────┐
│ Variables:                      │
│ - email: str                    │
│ - password: str                 │
│ - delay: int                    │
│ - max_matches: int              │
│ - output_dir: str               │
└─────────────────────────────────┘
        ↓
Passed to DNAMatchesScraper()
```

### 2. Authentication Data Flow

```
Credentials from config
        ↓
┌─────────────────────────────────┐
│ email: "user@example.com"       │
│ password: "secret123"           │
└─────────────────────────────────┘
        ↓
login() method
        ↓
Browser navigates to login page
        ↓
Form fields populated:
    input[name="email"] ← email
    input[name="password"] ← password
        ↓
Form submitted
        ↓
Browser receives response
        ↓
┌─────────────────────────────────┐
│ Session Cookie Set              │
│ Authentication Token Stored     │
└─────────────────────────────────┘
        ↓
Authenticated session active
        ↓
Used for all subsequent requests
```

### 3. Match Data Extraction Flow

```
Navigate to DNA Relatives page
        ↓
Page loads with match cards
        ↓
┌─────────────────────────────────┐
│ HTML DOM Structure:             │
│ <div class="relative-card">     │
│   <span class="name">John</span>│
│   <span class="relationship">   │
│     First Cousin                │
│   </span>                       │
│   <span class="shared-dna">     │
│     12.5%                       │
│   </span>                       │
│   ...                           │
│ </div>                          │
└─────────────────────────────────┘
        ↓
scrape_all_matches() queries DOM
        ↓
For each .relative-card element:
        ↓
    Extract text content from child elements
        ↓
    ┌─────────────────────────────┐
    │ match_data = {              │
    │   'match_id': 'match_1',    │
    │   'name': 'John Smith',     │
    │   'relationship': 'First    │
    │                   Cousin',  │
    │   'shared_dna': '12.5%',    │
    │   'shared_segments': '23'   │
    │ }                           │
    └─────────────────────────────┘
        ↓
    Append to matches list
        ↓
Complete matches list
        ↓
┌─────────────────────────────────┐
│ matches = [                     │
│   {match_id: 'match_1', ...},   │
│   {match_id: 'match_2', ...},   │
│   {match_id: 'match_3', ...}    │
│ ]                               │
└─────────────────────────────────┘
        ↓
Return to caller
```

### 4. Relatives Data Extraction Flow

```
For each match in matches:
        ↓
Click on match link
        ↓
Navigate to match detail page
        ↓
Wait for relatives section to load
        ↓
┌─────────────────────────────────┐
│ HTML DOM Structure:             │
│ <div class="relatives-in-common">│
│   <div class="relative-card">   │
│     <span class="name">Mary</span>│
│     <span class="relationship"> │
│       Mother                    │
│     </span>                     │
│     <span class="shared-dna">   │
│       25%                       │
│     </span>                     │
│   </div>                        │
│   ...                           │
│ </div>                          │
└─────────────────────────────────┘
        ↓
scrape_relatives_in_common() queries DOM
        ↓
For each .relative-card element:
        ↓
    Extract text content
        ↓
    ┌─────────────────────────────┐
    │ relative_data = {           │
    │   'relative_id':            │
    │     'relative_1',           │
    │   'name': 'Mary Smith',     │
    │   'relationship_to_match':  │
    │     'Mother',               │
    │   'shared_dna_with_relative':│
    │     '25%'                   │
    │ }                           │
    └─────────────────────────────┘
        ↓
    Append to relatives list
        ↓
Go back to matches page
        ↓
Return relatives list for this match
```

### 5. CSV Export Data Flow

#### Match Export

```
matches list from memory
        ↓
┌─────────────────────────────────┐
│ matches = [                     │
│   {'match_id': 'match_1',       │
│    'name': 'John Smith',        │
│    'relationship': 'First       │
│                    Cousin',     │
│    'shared_dna': '12.5%',       │
│    'shared_segments': '23'},    │
│   ...                           │
│ ]                               │
└─────────────────────────────────┘
        ↓
save_matches_to_csv()
        ↓
Open file: output/all_dna_matches.csv
        ↓
CSV Writer initialized with fieldnames
        ↓
Write header row
        ↓
For each match dict:
    Write row with values
        ↓
Close file
        ↓
┌─────────────────────────────────┐
│ all_dna_matches.csv             │
│                                 │
│ match_id,name,relationship,...  │
│ match_1,John Smith,First        │
│ Cousin,12.5%,23                 │
│ match_2,Jane Doe,Second         │
│ Cousin,3.1%,15                  │
│ ...                             │
└─────────────────────────────────┘
```

#### Relatives Export

```
relatives list for specific match
        ↓
┌─────────────────────────────────┐
│ relatives = [                   │
│   {'relative_id': 'relative_1', │
│    'name': 'Mary Smith',        │
│    'relationship_to_match':     │
│      'Mother',                  │
│    'shared_dna_with_relative':  │
│      '25%'},                    │
│   ...                           │
│ ]                               │
└─────────────────────────────────┘
        ↓
Sanitize match name for filename
        ↓
"John Smith" → "John_Smith"
        ↓
Generate filename:
"relatives_in_common_John_Smith_match_1.csv"
        ↓
save_relatives_to_csv()
        ↓
Open file: output/relatives_in_common_John_Smith_match_1.csv
        ↓
CSV Writer initialized
        ↓
Write header row
        ↓
For each relative dict:
    Write row with values
        ↓
Close file
        ↓
┌─────────────────────────────────┐
│ relatives_in_common_John_       │
│ Smith_match_1.csv               │
│                                 │
│ relative_id,name,relationship...│
│ relative_1,Mary Smith,Mother,25%│
│ relative_2,Tom Smith,Uncle,15%  │
│ ...                             │
└─────────────────────────────────┘
```

## Error Data Flow

### Configuration Error Flow

```
load_config() called
        ↓
config.ini not found
        ↓
FileNotFoundError raised
        ↓
main() catches exception
        ↓
Log error message
        ↓
Exit with code 1
```

### Network Error Flow

```
login() navigates to page
        ↓
Network timeout (60s exceeded)
        ↓
PlaywrightTimeoutError raised
        ↓
login() catches exception
        ↓
Log error
        ↓
Re-raise exception
        ↓
run() catches in finally block
        ↓
close_browser() called
        ↓
Exit with error
```

### Scraping Error Flow

```
scrape_all_matches() executing
        ↓
Try to extract match element
        ↓
Element not found / selector changed
        ↓
Exception caught in try/except
        ↓
Log warning
        ↓
Continue to next element
        ↓
Return partial matches list
```

## Data Transformation Flow

### Name Sanitization

```
Original match name from 23andMe
        ↓
"John O'Brien-Smith (Jr.)"
        ↓
Sanitization function
        ↓
Filter: keep only alphanumeric, space, _, -
        ↓
"John OBrien-Smith Jr"
        ↓
Strip whitespace
        ↓
Check if empty
        ↓
If empty: "unnamed_match"
If not empty: Use sanitized name
        ↓
"John_OBrien-Smith_Jr"
        ↓
Used in filename
```

### ID Generation

```
Start scraping matches
        ↓
Initialize counter: idx = 0
        ↓
For each match element:
        ↓
    Increment counter: idx += 1
        ↓
    Generate ID: f"match_{idx}"
        ↓
    Assign to match_data['match_id']
        ↓
Continue for all matches
        ↓
Result: Sequential IDs
"match_1", "match_2", "match_3", ...
```

## Parallel vs Sequential Flow

### Current Implementation (Sequential)

```
Match 1 → Relatives → Save → Match 2 → Relatives → Save → Match 3 → ...
```

**Characteristics**:
- Simple, predictable
- One browser page at a time
- Easy to debug
- Slower for large datasets

### Potential Future (Parallel)

```
        ┌─→ Match 1 → Relatives → Save ─┐
        │                                │
Start ──┼─→ Match 2 → Relatives → Save ─┼─→ Complete
        │                                │
        └─→ Match 3 → Relatives → Save ─┘
```

**Characteristics**:
- Faster execution
- Complex error handling
- Requires async Playwright
- Higher resource usage

## State Management Flow

### Browser State

```
Application Start
        ↓
browser = None
page = None
playwright = None
        ↓
start_browser()
        ↓
browser = playwright.chromium.launch()
page = browser.new_page()
        ↓
[Browser operations]
        ↓
close_browser()
        ↓
page.close()
browser.close()
playwright.stop()
        ↓
browser = None (implicitly)
page = None (implicitly)
```

### Session State

```
Login
        ↓
Session cookie stored in browser
        ↓
All requests use this session
        ↓
Navigate between pages
        ↓
Session maintained
        ↓
Browser closed
        ↓
Session lost
```

## Rate Limiting Flow

```
Complete operation (e.g., navigate)
        ↓
time.sleep(self.delay)
        ↓
Continue to next operation
```

**Default delay**: 2 seconds between operations

**Configurable**: Via `delay` parameter in config.ini

## Complete End-to-End Flow

```
1. User creates config.ini with credentials
        ↓
2. User runs: python dna_scraper.py
        ↓
3. main() loads configuration
        ↓
4. main() validates credentials
        ↓
5. DNAMatchesScraper instantiated with config
        ↓
6. scraper.run() called
        ↓
7. Playwright browser started
        ↓
8. Login to 23andMe with credentials
        ↓
9. Navigate to DNA Relatives page
        ↓
10. Scrape all match elements from page
        ↓
11. Transform DOM elements to match dictionaries
        ↓
12. Save all matches to CSV
        ↓
13. For each match (up to max_matches):
        ↓
    a. Click on match
        ↓
    b. Scrape relatives section
        ↓
    c. Transform to relative dictionaries
        ↓
    d. Go back to main page
        ↓
    e. Save relatives to CSV
        ↓
14. Close browser
        ↓
15. Log completion
        ↓
16. Exit with code 0
```

## Data Persistence

### Temporary Data (In-Memory)

- Configuration values
- Match lists
- Relatives lists
- Browser state

**Lifetime**: Duration of script execution

### Permanent Data (On-Disk)

- CSV files in output directory

**Lifetime**: Until manually deleted by user

### No Data (Not Stored)

- Session cookies (browser-only)
- Credentials (config file, not in memory after use)
- HTML content (scraped but not saved)
- Browser cache
