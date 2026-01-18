# Architecture Documentation

## System Overview

The Phone Message Scraper is built with a modular architecture that separates concerns into distinct components for web scraping, data extraction, and export functionality.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface Layer                     │
│  ┌────────────────┐         ┌─────────────────────────┐     │
│  │ CLI Interface  │         │  Direct Python API      │     │
│  └────────────────┘         └─────────────────────────┘     │
└────────────────────┬────────────────────┬───────────────────┘
                     │                    │
┌────────────────────┴────────────────────┴───────────────────┐
│                  Application Layer                           │
│  ┌──────────────────┐     ┌──────────────────────────┐      │
│  │ PhoneNumberScraper│    │NumberBarnMessageScraper  │      │
│  │    (Main App)     │    │   (NumberBarn Specific)  │      │
│  └──────────────────┘     └──────────────────────────┘      │
└────────┬──────────────────────────┬──────────────────────────┘
         │                          │
┌────────┴──────────────────────────┴──────────────────────────┐
│                  Core Services Layer                          │
│  ┌──────────────┐ ┌──────────────┐ ┌───────────────────┐    │
│  │ WebScraper   │ │PhoneExtractor│ │  CSVExporter      │    │
│  │              │ │              │ │                   │    │
│  └──────────────┘ └──────────────┘ └───────────────────┘    │
└────────┬──────────────────────┬────────────────┬─────────────┘
         │                      │                │
┌────────┴──────────────────────┴────────────────┴─────────────┐
│                  Data Access Layer                            │
│  ┌──────────────┐ ┌──────────────┐ ┌───────────────────┐    │
│  │  HTTP Client │ │  Selenium    │ │  File System      │    │
│  │  (requests)  │ │  WebDriver   │ │  (CSV/Pandas)     │    │
│  └──────────────┘ └──────────────┘ └───────────────────┘    │
└───────────────────────────────────────────────────────────────┘
```

## Component Descriptions

### 1. User Interface Layer

#### CLI Interface (`phone_scraper.py` main)
- Command-line argument parsing
- User input validation
- Progress display and logging
- Error message presentation

#### Direct Python API
- Programmatic access to scraping functionality
- Import and use classes directly
- Custom configuration and workflows

### 2. Application Layer

#### PhoneNumberScraper
**Purpose:** Main application orchestrator for general web scraping

**Responsibilities:**
- Coordinate scraping workflow
- Manage URL queue
- Aggregate results
- Generate summary reports

**Key Methods:**
- `scrape_urls(urls, include_text=True)` - Process list of URLs
- `print_summary(results)` - Display statistics
- `export_results(results, filename=None, include_text=True)` - Save to CSV

#### NumberBarnMessageScraper
**Purpose:** Specialized scraper for NumberBarn platform

**Responsibilities:**
- Browser automation setup
- Authentication handling
- Message navigation
- Pagination management
- Message data extraction

**Key Methods:**
- `setup_driver()` - Initialize Selenium WebDriver
- `login()` - Handle authentication flow
- `navigate_to_messages()` - Navigate to message page
- `extract_messages()` - Extract all messages
- `export_to_csv(messages, filename)` - Save messages

**Variants:**
- `numberbarn_scraper.py` - Basic scraper
- `persistent_session_extractor.py` - Session persistence
- `bidirectional_extractor.py` - Enhanced bidirectional tracking
- `two_pane_extractor.py` - Two-pane interface support
- `complete_message_extractor.py` - Full-featured extractor

### 3. Core Services Layer

#### WebScraper (`web_scraper.py`)
**Purpose:** HTTP-based web content retrieval

**Responsibilities:**
- HTTP GET requests
- HTML content retrieval
- Response validation
- Error handling

**Key Methods:**
- `scrape(url)` - Fetch and parse URL
- `_is_valid_url(url)` - URL validation
- `_fetch_page(url)` - HTTP request execution
- `_parse_html(html_content)` - BeautifulSoup parsing

**Technology:**
- requests library for HTTP
- BeautifulSoup4 for HTML parsing
- lxml parser for performance

#### PhoneExtractor (`phone_extractor.py`)
**Purpose:** Phone number detection and parsing

**Responsibilities:**
- Regex-based phone number detection
- Format standardization
- Phone number categorization
- Context extraction

**Key Methods:**
- `extract_phone_numbers(text)` - Find all phone numbers
- `categorize_phone_number(phone)` - Classify number type
- `_format_phone_number(phone)` - Standardize format
- `extract_with_context(text, context_chars=100)` - Get surrounding text

**Regex Patterns:**
- US formats: Various separators and groupings
- International: Country code support
- Toll-free: 800/888/877 prefixes
- Extensions: ext/x notation

#### CSVExporter (`csv_exporter.py`)
**Purpose:** Data export to CSV format

**Responsibilities:**
- DataFrame creation
- CSV file writing
- Multiple export formats
- Metadata inclusion

**Key Methods:**
- `export_phone_numbers(results, filename)` - Phone number CSV
- `export_scraped_text(results, filename)` - Text content CSV
- `export_combined(results, filename)` - Combined data CSV
- `export_summary(results, filename)` - Statistics CSV

**Technology:**
- pandas for data manipulation
- CSV format with UTF-8 encoding

### 4. Data Access Layer

#### HTTP Client (requests)
- HTTP/HTTPS protocol handling
- Timeout management
- Connection pooling
- SSL verification

#### Selenium WebDriver
- Browser automation
- JavaScript execution
- Dynamic content handling
- User interaction simulation

#### File System (pandas/CSV)
- File I/O operations
- Directory management
- CSV encoding handling
- Data persistence

## Design Patterns

### 1. Strategy Pattern
**Used in:** Message extraction strategies
- Different scraping approaches (basic, persistent, bidirectional)
- Swappable extraction algorithms
- Consistent interface across strategies

### 2. Factory Pattern
**Used in:** WebDriver setup
- Browser configuration
- Options assembly
- Driver instantiation

### 3. Template Method Pattern
**Used in:** Scraping workflow
- Common scraping steps defined
- Customization points for specific sites
- Consistent error handling

### 4. Facade Pattern
**Used in:** PhoneNumberScraper
- Simplified interface to complex subsystems
- Coordinates multiple components
- Hides implementation details

## Data Flow

### General Web Scraping Flow

```
URLs Input
    ↓
URL Validation
    ↓
HTTP Request → BeautifulSoup Parse
    ↓
Text Extraction
    ↓
Phone Number Detection
    ↓
Data Aggregation
    ↓
CSV Export
```

### NumberBarn Scraping Flow

```
User Credentials (Manual)
    ↓
Browser Launch
    ↓
Login Page Navigation
    ↓
Authentication
    ↓
Message Page Navigation
    ↓
Page Analysis
    ↓
Message Element Detection
    ↓
Pagination Loop ──┐
    ↓             │
Message Extraction│
    ↓             │
Load More/Scroll ─┘
    ↓
Phone Number Parsing
    ↓
Data Enrichment
    ↓
CSV Export (Multiple Files)
```

## Technology Stack

### Core Languages
- **Python 3.7+**: Main programming language

### Web Scraping
- **requests 2.31.0**: HTTP client library
- **beautifulsoup4 4.12.2**: HTML parsing
- **lxml 4.9.3**: XML/HTML parser backend
- **selenium**: Browser automation

### Data Processing
- **pandas 2.1.1**: Data manipulation and CSV handling
- **re (built-in)**: Regular expression operations

### Browser Automation
- **Chrome/Chromium**: Browser engine
- **ChromeDriver**: WebDriver implementation

## Error Handling Strategy

### Levels of Error Handling

1. **Network Level**
   - Connection timeouts
   - DNS failures
   - SSL errors
   - HTTP status codes

2. **Parsing Level**
   - Malformed HTML
   - Missing elements
   - Unexpected structure
   - Encoding issues

3. **Data Level**
   - Invalid phone formats
   - Missing required fields
   - Data type mismatches

4. **Application Level**
   - Invalid configuration
   - File system errors
   - Permission issues

### Recovery Strategies

- **Continue on Failure**: Individual URL failures don't stop batch processing
- **Graceful Degradation**: Partial data extraction when complete extraction fails
- **Retry Logic**: Configurable retry for transient failures
- **Logging**: Comprehensive error logging for debugging

## Security Considerations

### Authentication
- No credential storage in code
- Manual login workflow
- Session-based authentication
- Timeout handling

### Data Protection
- Local data storage only
- No external API calls with sensitive data
- Secure file permissions recommended
- CSV files contain scraped data (user responsible for handling)

### Compliance
- Terms of Service adherence required
- Rate limiting to prevent abuse
- User agent identification
- robots.txt respect encouraged

## Scalability Considerations

### Current Limitations
- Single-threaded processing
- Memory-based data aggregation
- Local CSV storage
- No database integration

### Future Scalability Options
- Multi-threaded URL processing
- Database backend for large datasets
- Streaming CSV writing
- Cloud storage integration
- API endpoints for data access

## Configuration Management

### Environment-Based Configuration
- Command-line arguments
- Configuration files (future)
- Environment variables (future)

### Configurable Parameters
- Delay between requests
- Output directory
- File naming patterns
- Timeout values
- Browser options

## Deployment Architecture

### Local Development
- Direct Python execution
- Virtual environment
- Local ChromeDriver

### Production Deployment
- Containerization (Docker - future)
- Scheduled execution (cron)
- Cloud hosting options
- Headless browser mode

See `06-deployment.md` for detailed deployment instructions.
