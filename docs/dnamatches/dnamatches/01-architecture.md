# Architecture

## System Overview

The 23andMe DNA Matches Scraper follows a modular, class-based architecture designed for reliability, maintainability, and extensibility. The system uses a synchronous, single-threaded execution model optimized for web scraping workflows.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User                                  │
│                          │                                   │
│                          ▼                                   │
│                    config.ini                                │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   dna_scraper.py                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              main() Function                          │  │
│  │  - Load configuration                                 │  │
│  │  - Validate credentials                               │  │
│  │  - Initialize scraper                                 │  │
│  └───────────────────────────────────────────────────────┘  │
│                           │                                  │
│                           ▼                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │          DNAMatchesScraper Class                      │  │
│  │  - Browser management                                 │  │
│  │  - Authentication                                     │  │
│  │  - Navigation                                         │  │
│  │  - Data extraction                                    │  │
│  │  - CSV export                                         │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │ Playwright│    │ 23andMe  │    │   CSV    │
    │  Browser │    │  Website │    │  Files   │
    └──────────┘    └──────────┘    └──────────┘
```

## Component Architecture

### 1. Configuration Module

**Responsibility**: Load and validate application configuration

**Components**:
- `load_config()` function
- ConfigParser (Python standard library)

**Configuration Sections**:
- `[23andme]`: Authentication credentials
- `[scraper]`: Scraping behavior settings

### 2. DNAMatchesScraper Class

**Responsibility**: Core scraping orchestration and execution

**Key Attributes**:
```python
- email: str                    # 23andMe account email
- password: str                 # 23andMe account password
- output_dir: str              # Output directory for CSV files
- delay: int                   # Delay between requests
- browser: Optional[Browser]   # Playwright browser instance
- page: Optional[Page]         # Active page instance
- playwright: Playwright       # Playwright context manager
```

**Key Methods**:

| Method | Purpose | Dependencies |
|--------|---------|--------------|
| `__init__()` | Initialize scraper with configuration | None |
| `start_browser()` | Launch Playwright browser | Playwright |
| `close_browser()` | Clean up browser resources | Playwright |
| `login()` | Authenticate with 23andMe | Browser, Page |
| `navigate_to_dna_relatives()` | Navigate to DNA Relatives page | Browser, Page |
| `scrape_all_matches()` | Extract all DNA matches | Page |
| `scrape_relatives_in_common()` | Extract relatives for a match | Page |
| `save_matches_to_csv()` | Export matches to CSV | CSV module |
| `save_relatives_to_csv()` | Export relatives to CSV | CSV module |
| `run()` | Execute complete scraping workflow | All of the above |

**Helper Methods**:
- `_scroll_to_load_all()`: Handle lazy-loaded content
- `_safe_text_content()`: Safe DOM element text extraction

### 3. Browser Automation Layer

**Technology**: Playwright for Python

**Responsibilities**:
- Browser lifecycle management
- Page navigation and interaction
- DOM element selection and data extraction
- Screenshot and debugging capabilities (future)

**Configuration**:
```python
Browser: Chromium
Mode: Headless
Timeout: 60 seconds for navigation
         30 seconds for element waiting
         10 seconds for relatives section
```

### 4. Data Export Layer

**Technology**: Python CSV module

**Responsibilities**:
- Format data for CSV export
- Handle file I/O operations
- Filename sanitization
- UTF-8 encoding

## Design Patterns

### 1. Facade Pattern

The `DNAMatchesScraper` class acts as a facade, providing a simple interface to complex browser automation and data extraction operations.

### 2. Template Method Pattern

The `run()` method defines the skeleton of the scraping algorithm:
1. Start browser
2. Login
3. Navigate to DNA Relatives
4. Scrape all matches
5. Save matches
6. For each match, scrape and save relatives
7. Close browser

### 3. Resource Acquisition Is Initialization (RAII)

Browser resources are properly managed with cleanup in `finally` blocks to ensure resources are released even on error.

## Data Flow

### Authentication Flow

```
User Credentials (config.ini)
        ↓
    login()
        ↓
Navigate to login page
        ↓
Fill email & password
        ↓
Submit form
        ↓
Wait for navigation
        ↓
    Authenticated
```

### Match Scraping Flow

```
Navigate to DNA Relatives
        ↓
Wait for match cards to load
        ↓
Scroll to load all matches
        ↓
Query all match elements
        ↓
For each element:
    Extract: ID, Name, Relationship, DNA%, Segments
        ↓
Return list of match dictionaries
        ↓
Save to all_dna_matches.csv
```

### Relatives Scraping Flow

```
For each match:
        ↓
    Click on match
        ↓
Wait for relatives section
        ↓
Extract relative elements
        ↓
For each relative:
    Extract: ID, Name, Relationship, DNA%
        ↓
Go back to matches page
        ↓
Save to relatives_in_common_[name]_[id].csv
```

## Error Handling Strategy

### Error Categories

1. **Configuration Errors**
   - Missing config file → Raise FileNotFoundError
   - Invalid credentials → Log error and exit
   - Missing config sections → Use fallback defaults

2. **Network Errors**
   - Timeout errors → Log warning, continue if possible
   - Connection failures → Raise exception, stop execution

3. **Scraping Errors**
   - Element not found → Log warning, skip element
   - Invalid data → Use empty string, continue
   - Page structure changed → Log warning, return partial data

4. **File I/O Errors**
   - Cannot create directory → Raise exception
   - Cannot write file → Raise exception

### Error Recovery

- **Individual Match Failures**: Continue to next match
- **Individual Relative Failures**: Continue to next relative
- **Critical Failures**: Clean up resources and exit gracefully

## Logging Strategy

### Log Levels

| Level | Usage |
|-------|-------|
| INFO | Normal operation progress, success messages |
| WARNING | Recoverable errors, missing optional data |
| ERROR | Serious errors that may require user intervention |

### Log Format

```
%(asctime)s - %(levelname)s - %(message)s
```

### Key Log Points

- Browser lifecycle events
- Authentication status
- Navigation progress
- Data extraction counts
- File save operations
- Errors and warnings

## Security Architecture

### Credential Management

1. **Configuration File**:
   - Stored in `config.ini`
   - Excluded from version control via `.gitignore`
   - Never logged or displayed

2. **Runtime Security**:
   - Credentials only in memory during execution
   - No credential caching
   - Browser closed after each run

3. **Data Security**:
   - All data stored locally
   - No transmission to third parties
   - User controls data lifecycle

### Input Sanitization

- Filename sanitization removes special characters
- Prevents directory traversal attacks
- Ensures cross-platform compatibility

## Extensibility Points

### Future Architecture Enhancements

1. **Plugin System**:
   - Allow custom data extractors
   - Support for different DNA services

2. **Storage Backends**:
   - Abstract CSV export into interface
   - Support database storage (SQLite, PostgreSQL)

3. **Authentication Methods**:
   - Support 2FA
   - Support SSO

4. **Parallel Processing**:
   - Process multiple matches concurrently
   - Requires thread-safe browser instances

5. **Scheduling**:
   - Periodic scraping
   - Incremental updates

## Technology Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.8+ | Primary language |
| Playwright | 1.40.0 | Browser automation |
| Chromium | Latest | Web browser |

### Standard Library Usage

- `configparser` - Configuration management
- `csv` - Data export
- `logging` - Application logging
- `os` - File system operations
- `time` - Rate limiting
- `typing` - Type safety

## Deployment Architecture

### Current Model

**Single-User, Local Execution**:
- Runs on user's local machine
- Direct file system access
- No server required
- No external dependencies except 23andMe

### Potential Cloud Architecture (Future)

```
┌──────────────┐
│    User      │
│   Browser    │
└──────┬───────┘
       │ HTTPS
       ▼
┌──────────────┐      ┌──────────────┐
│  Web Server  │──────│   Scraper    │
│   (Flask)    │      │   Service    │
└──────────────┘      └──────┬───────┘
                             │
                      ┌──────┴───────┐
                      │   Database   │
                      │  (PostgreSQL)│
                      └──────────────┘
```

## Performance Considerations

### Current Performance

- **Sequential Processing**: One match at a time
- **Rate Limiting**: 2-second default delay between requests
- **Memory Usage**: Minimal (stores all matches in memory before export)

### Bottlenecks

1. Network latency (major factor)
2. Page load times
3. Sequential processing

### Optimization Strategies

1. **Reduce Network Calls**: Batch operations where possible
2. **Parallel Processing**: Use async Playwright for concurrent operations
3. **Caching**: Cache frequently accessed data
4. **Selective Scraping**: Only fetch new/updated matches
