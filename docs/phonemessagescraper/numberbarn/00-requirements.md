# Requirements Documentation

## Project Overview

The Phone Message Scraper is a Python-based web scraping application designed to extract phone numbers and messages from various sources, with specialized support for NumberBarn messaging platform.

## MVP Deliverables

### Phase 1: Core Functionality (MVP)

#### 1. Web Scraping Engine
- [x] Basic web page scraping using BeautifulSoup
- [x] HTTP request handling with proper error management
- [x] Respectful scraping with configurable delays
- [x] Support for multiple URL processing

#### 2. Phone Number Extraction
- [x] Advanced regex patterns for phone number detection
- [x] Support for multiple phone number formats:
  - Standard US: 123-456-7890, (123) 456-7890, 123.456.7890
  - International: +1-123-456-7890, +44 20 1234 5678
  - Toll-free: 800-123-4567, 888-123-4567, 877-123-4567
  - Extensions: 123-456-7890 ext 123
  - No separators: 1234567890
- [x] Phone number categorization (local, toll-free, international)

#### 3. NumberBarn Integration
- [x] Selenium-based browser automation
- [x] Authenticated session handling
- [x] Message extraction from NumberBarn platform
- [x] Pagination support for complete message retrieval
- [x] Multiple scraping strategies (basic, persistent, bidirectional)

#### 4. Data Export
- [x] CSV export functionality
- [x] Multiple output formats:
  - Phone numbers with metadata
  - Scraped text content
  - Combined data with context
  - Summary statistics
- [x] Organized output directory structure
- [x] Timestamped file naming

#### 5. Command Line Interface
- [x] URL input from command line arguments
- [x] URL input from file
- [x] Configurable parameters (delay, output directory, filename)
- [x] Option to include/exclude text content

### Phase 2: Enhanced Features (Post-MVP)

#### 1. Advanced Message Extraction
- [x] Bidirectional message tracking (sent/received)
- [x] Message thread detection
- [x] Timestamp extraction
- [x] Message direction classification
- [x] Word and character count analytics

#### 2. Improved Automation
- [x] Smart element detection with multiple selector patterns (20+ patterns)
- [x] Automatic pagination with scroll and "Load More" detection
- [x] Error recovery and continuation
- [x] Session persistence
- [x] Debug page structure analysis

#### 3. Enhanced Data Analysis
- [x] Phone number frequency tracking
- [x] Message statistics (total, average length, word count)
- [x] Unique phone number identification
- [x] First-seen timestamp tracking

## Functional Requirements

### FR-1: Web Scraping
- **FR-1.1**: System shall support scraping multiple URLs in a single session
- **FR-1.2**: System shall implement rate limiting between requests
- **FR-1.3**: System shall handle HTTP errors gracefully
- **FR-1.4**: System shall parse HTML content using BeautifulSoup

### FR-2: Phone Number Detection
- **FR-2.1**: System shall detect phone numbers using regex patterns
- **FR-2.2**: System shall support multiple phone number formats
- **FR-2.3**: System shall categorize phone numbers by type
- **FR-2.4**: System shall format phone numbers consistently

### FR-3: NumberBarn Authentication
- **FR-3.1**: System shall support manual login workflow
- **FR-3.2**: System shall persist session state
- **FR-3.3**: System shall verify successful authentication
- **FR-3.4**: System shall handle session timeouts

### FR-4: Message Extraction
- **FR-4.1**: System shall extract complete message text
- **FR-4.2**: System shall identify phone numbers within messages
- **FR-4.3**: System shall detect message timestamps
- **FR-4.4**: System shall classify message direction (incoming/outgoing)
- **FR-4.5**: System shall handle pagination automatically

### FR-5: Data Export
- **FR-5.1**: System shall export data to CSV format
- **FR-5.2**: System shall generate multiple report types
- **FR-5.3**: System shall include metadata in exports
- **FR-5.4**: System shall create summary statistics

## Non-Functional Requirements

### NFR-1: Performance
- **NFR-1.1**: Page load timeout: 30 seconds maximum
- **NFR-1.2**: Configurable delay between requests (default: 1 second)
- **NFR-1.3**: Efficient memory usage for large data sets

### NFR-2: Reliability
- **NFR-2.1**: Graceful error handling for network failures
- **NFR-2.2**: Continue processing on individual page failures
- **NFR-2.3**: Data integrity validation before export

### NFR-3: Security
- **NFR-3.1**: No hardcoded credentials
- **NFR-3.2**: Manual authentication flow
- **NFR-3.3**: Secure session handling
- **NFR-3.4**: Compliance with website Terms of Service

### NFR-4: Usability
- **NFR-4.1**: Clear command-line interface
- **NFR-4.2**: Informative console output and progress indicators
- **NFR-4.3**: Comprehensive error messages
- **NFR-4.4**: Well-documented code and usage examples

### NFR-5: Maintainability
- **NFR-5.1**: Modular code architecture
- **NFR-5.2**: Separation of concerns (scraping, extraction, export)
- **NFR-5.3**: Comprehensive inline documentation
- **NFR-5.4**: Version-controlled codebase

## Technical Requirements

### TR-1: Dependencies
- Python 3.7+
- requests 2.31.0
- beautifulsoup4 4.12.2
- lxml 4.9.3
- pandas 2.1.1
- selenium (for NumberBarn automation)

### TR-2: Browser Requirements (for NumberBarn)
- Chrome browser
- ChromeDriver matching Chrome version
- Support for headless mode

### TR-3: Output Requirements
- UTF-8 encoded CSV files
- ISO 8601 timestamp format
- Organized directory structure

## Constraints

### C-1: Legal and Ethical
- Educational and research purposes only
- User must own/have permission for the account being scraped
- Must comply with website Terms of Service
- Respect robots.txt policies

### C-2: Technical
- Requires active internet connection
- Limited to websites with publicly accessible content
- NumberBarn features require valid credentials
- Chrome/ChromeDriver compatibility requirements

## User Stories

### US-1: Basic Phone Number Scraping
**As a** user  
**I want to** scrape phone numbers from websites  
**So that** I can collect contact information efficiently

**Acceptance Criteria:**
- Can provide URLs via command line or file
- Phone numbers are detected in various formats
- Results are exported to CSV

### US-2: NumberBarn Message Extraction
**As a** NumberBarn user  
**I want to** extract all my messages automatically  
**So that** I can analyze my communication history

**Acceptance Criteria:**
- Can log in to NumberBarn account
- All messages are extracted including pagination
- Messages include phone numbers and timestamps

### US-3: Data Analysis
**As a** data analyst  
**I want to** receive structured CSV output  
**So that** I can analyze the extracted data

**Acceptance Criteria:**
- Multiple CSV formats available
- Data includes metadata (timestamps, categories)
- Summary statistics provided

## Future Enhancements

See `08-future-features.md` for detailed future feature roadmap.
