# Application Flow Documentation

## Overview

This document provides detailed application flow diagrams and process documentation for executing various sub-processes within the Phone Message Scraper application.

## Main Application Flows

### 1. General Web Scraping Application Flow

```
┌─────────────────────────────────────────────────┐
│             APPLICATION START                    │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│         Parse Command Line Arguments             │
│  • URLs or --file parameter                     │
│  • --delay (optional)                           │
│  • --output (optional)                          │
│  • --filename (optional)                        │
│  • --no-text (optional)                         │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
              ┌──────────────┐
              │  Validation  │
              └──────┬───────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
    [Valid URLs?]           [Invalid]
         │                       │
         │                       ▼
         │              [Display Error & Exit]
         │
         ▼
┌─────────────────────────────────────────────────┐
│    Initialize PhoneNumberScraper                │
│  • Create WebScraper instance                   │
│  • Create PhoneExtractor instance               │
│  • Create CSVExporter instance                  │
│  • Set configuration (delay, output dir)        │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│         Prepare URL List                        │
│  • Load from command line OR                    │
│  • Load from file (filter comments)             │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│    scrape_urls() - Main Processing Loop         │
│                                                  │
│  FOR EACH URL in url_list:                      │
│    1. Call WebScraper.scrape(url)               │
│    2. Extract text content                      │
│    3. Call PhoneExtractor.extract_phone_numbers │
│    4. Aggregate results                         │
│    5. Apply delay                               │
│    6. Handle errors gracefully                  │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│         Calculate Summary Statistics            │
│  • Total URLs processed                         │
│  • Success/failure counts                       │
│  • Total phone numbers found                    │
│  • Unique phone numbers                         │
│  • Category distribution                        │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│         print_summary() - Console Output        │
│  Display statistics to user                     │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│    export_results() - CSV Generation            │
│  • Create phone_numbers CSV                     │
│  • Create scraped_text CSV (if include_text)    │
│  • Create combined_data CSV                     │
│  • Create summary_stats CSV                     │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│         Display Export Success Message          │
│  Show file paths created                        │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
              [APPLICATION END]
```

### 2. NumberBarn Message Extraction Flow

```
┌─────────────────────────────────────────────────┐
│        NumberBarn Scraper START                 │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│    Initialize NumberBarnMessageScraper          │
│  • Set headless mode (True/False)               │
│  • Initialize empty message list                │
│  • Configure browser options                    │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│         setup_driver() - Browser Setup          │
│  • Configure Chrome options                     │
│    - Disable automation detection               │
│    - Set user agent                             │
│    - Configure headless mode                    │
│  • Initialize WebDriver                         │
│  • Override navigator.webdriver property        │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
              ┌──────────────┐
              │   Success?   │
              └──────┬───────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
       [Yes]                   [No]
         │                       │
         │                       ▼
         │              [Display Error & Exit]
         │
         ▼
┌─────────────────────────────────────────────────┐
│    login_and_navigate() - Authentication        │
│                                                  │
│  Step 1: Navigate to Login Page                │
│    • URL: https://numberbarn.com/login          │
│    • Wait for page load                         │
│                                                  │
│  Step 2: Pause for Manual Login                │
│    • Display instructions to user               │
│    • Wait for user to enter credentials         │
│    • Wait for user to solve CAPTCHA (if any)    │
│    • Wait for user to submit form               │
│    • Pause execution (input required)           │
│                                                  │
│  Step 3: Verify Login Success                  │
│    • Check for login indicators                 │
│    • Check URL changed from /login              │
│    • Look for user-specific elements            │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
              ┌──────────────┐
              │   Logged in? │
              └──────┬───────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
       [Yes]                   [No]
         │                       │
         │                       ▼
         │              [Retry or Exit]
         │
         ▼
┌─────────────────────────────────────────────────┐
│    Navigate to Messages Page                    │
│                                                  │
│  Try multiple potential URLs:                   │
│    1. /messages                                 │
│    2. /app/messages                             │
│    3. /account/messages                         │
│    4. /dashboard/messages                       │
│                                                  │
│  For each URL:                                  │
│    • Navigate and wait                          │
│    • Check for message indicators               │
│    • Return if successful                       │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│    analyze_page_structure() - Element Discovery │
│                                                  │
│  Step 1: Save HTML Snapshot                    │
│    • Save to debug_page_structure_*.html        │
│                                                  │
│  Step 2: Test Multiple Selectors               │
│    Try 20+ CSS selector patterns:               │
│      • .message-container                       │
│      • .message-item                            │
│      • [class*="message"]                       │
│      • .conversation-message                    │
│      • ... and more                             │
│                                                  │
│  Step 3: Display Sample Messages                │
│    • Show first few messages from each pattern  │
│    • Display element count                      │
│    • Help user identify correct selector        │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│    User Confirmation or Manual Selector Input   │
│  • Display detected patterns                    │
│  • Ask user to confirm or provide selector      │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│    extract_messages() - Message Extraction      │
│                                                  │
│  Initialize:                                     │
│    • Processed message IDs set                  │
│    • Previous message count = 0                 │
│    • Consecutive no-change count = 0            │
│                                                  │
│  PAGINATION LOOP:                               │
│  ┌──────────────────────────────────────┐       │
│  │                                      │       │
│  │  1. Scroll Page                      │       │
│  │     • executeScript(window.scrollTo) │       │
│  │     • Wait for dynamic loading       │       │
│  │                                      │       │
│  │  2. Check for "Load More" Button     │       │
│  │     • Find by various selectors      │       │
│  │     • Click if found and visible     │       │
│  │     • Wait for new content           │       │
│  │                                      │       │
│  │  3. Extract Visible Messages         │       │
│  │     • Find all message elements      │       │
│  │     • For each message:              │       │
│  │       - Generate unique ID           │       │
│  │       - Skip if already processed    │       │
│  │       - Extract text content         │       │
│  │       - Find phone numbers (regex)   │       │
│  │       - Extract timestamps           │       │
│  │       - Detect direction             │       │
│  │       - Calculate stats              │       │
│  │       - Store HTML snippet           │       │
│  │       - Mark as processed            │       │
│  │                                      │       │
│  │  4. Check for Completion             │       │
│  │     • Message count unchanged?       │       │
│  │     • At bottom of page?             │       │
│  │     • No "Load More" button?         │       │
│  │     • Max iterations reached?        │       │
│  │                                      │       │
│  │  5. Continue or Exit Loop            │       │
│  │     • If more messages: continue     │       │
│  │     • If complete: break             │       │
│  └──────────────────┬───────────────────┘       │
│                     │                            │
│                     ▼                            │
│              [Loop Complete]                     │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│    process_extracted_data() - Post-Processing   │
│                                                  │
│  1. Deduplicate Messages                        │
│     • Based on content + phone number hash      │
│                                                  │
│  2. Parse and Normalize Phone Numbers           │
│     • Apply formatting                          │
│     • Categorize numbers                        │
│                                                  │
│  3. Enrich Metadata                             │
│     • Calculate word counts                     │
│     • Identify primary phone per message        │
│                                                  │
│  4. Generate Statistics                         │
│     • Total messages                            │
│     • Unique phone numbers                      │
│     • Phone number frequency                    │
│     • Average message length                    │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│    export_to_csv() - Multi-File Export          │
│                                                  │
│  File 1: all_numberbarn_messages_*.csv          │
│    • All message data with metadata             │
│                                                  │
│  File 2: phone_numbers_summary_*.csv            │
│    • Unique phone numbers                       │
│    • Message count per phone                    │
│    • First seen timestamp                       │
│                                                  │
│  File 3: extraction_stats_*.csv                 │
│    • Summary statistics                         │
│    • Extraction metadata                        │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│         close_browser() - Cleanup               │
│  • Quit WebDriver                               │
│  • Release resources                            │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│         Display Completion Summary              │
│  • Total messages extracted                     │
│  • Files created                                │
│  • Execution time                               │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
              [APPLICATION END]
```

## Sub-Process Details

### Sub-Process 1: URL Validation

**Process Name**: `_is_valid_url(url)`

**Purpose**: Validate URL format before scraping

**Flow**:
```
Input: URL string
    │
    ▼
[Check URL Format]
    │
    ├─ Starts with http:// or https://?
    │   └─ No → Return False
    │
    ├─ Contains valid domain?
    │   └─ No → Return False
    │
    └─ Valid URL structure?
        └─ No → Return False
    │
    ▼
Return True
```

**Usage**:
```python
if self._is_valid_url(url):
    # Proceed with scraping
else:
    # Skip URL and log warning
```

### Sub-Process 2: HTML Content Fetching

**Process Name**: `_fetch_page(url)`

**Purpose**: Retrieve HTML content from URL

**Flow**:
```
Input: URL
    │
    ▼
[Make HTTP GET Request]
    │
    ├─ Set timeout: 30 seconds
    ├─ Set headers (User-Agent)
    └─ Verify SSL: True
    │
    ▼
[Check Response]
    │
    ├─ Status Code 200?
    │   └─ No → Raise Exception
    │
    ├─ Content-Type is HTML?
    │   └─ Warning if not
    │
    └─ Response has content?
        └─ No → Return empty
    │
    ▼
[Return HTML Content]
```

**Error Handling**:
- Timeout → Log and return None
- Connection Error → Log and return None
- HTTP Error (404, 500) → Log and return None
- SSL Error → Log and return None

### Sub-Process 3: Phone Number Extraction

**Process Name**: `extract_phone_numbers(text)`

**Purpose**: Extract all phone numbers from text

**Flow**:
```
Input: Text content
    │
    ▼
[Apply Regex Pattern]
    │
    └─ Pattern: Complex phone regex
    │
    ▼
[Get All Matches]
    │
    ▼
FOR EACH Match:
    │
    ├─ [Extract Raw Number]
    │
    ├─ [Validate]
    │   ├─ Minimum 10 digits?
    │   ├─ Valid area code?
    │   └─ Not all same digit?
    │
    ├─ [Extract Context]
    │   ├─ 100 chars before
    │   └─ 100 chars after
    │
    ├─ [Categorize]
    │   ├─ Toll-free (800/888/877)?
    │   ├─ International (+country)?
    │   └─ Local (default)
    │
    ├─ [Format]
    │   └─ Apply standard format
    │
    └─ [Add to Results]
    │
    ▼
Return: List of phone objects
```

**Phone Object Structure**:
```python
{
    'phone_number': '(123) 456-7890',
    'formatted_phone': '(123) 456-7890',
    'category': 'local',
    'context_before': '...',
    'context_after': '...',
    'position': 45  # Character position in text
}
```

### Sub-Process 4: Message Direction Detection

**Process Name**: `detect_message_direction(element)`

**Purpose**: Classify message as incoming or outgoing

**Flow**:
```
Input: Message element (HTML/DOM)
    │
    ▼
[Check Element Classes]
    │
    ├─ Contains "sent" or "outgoing"?
    │   └─ Yes → Return "outgoing"
    │
    ├─ Contains "received" or "incoming"?
    │   └─ Yes → Return "incoming"
    │
    ▼
[Check Element Text]
    │
    ├─ Starts with "You:" or "Me:"?
    │   └─ Yes → Return "outgoing"
    │
    ├─ Contains phone number prefix?
    │   └─ Yes → Return "incoming"
    │
    ▼
[Check Element Position/Style]
    │
    ├─ Aligned right (CSS)?
    │   └─ Yes → Return "outgoing"
    │
    ├─ Aligned left (CSS)?
    │   └─ Yes → Return "incoming"
    │
    ▼
Return "unknown"
```

### Sub-Process 5: Pagination Handling

**Process Name**: `handle_pagination()`

**Purpose**: Load all messages through pagination

**Flow**:
```
Initialize:
    │
    ├─ processed_ids = set()
    ├─ no_change_count = 0
    └─ max_iterations = 100
    │
    ▼
LOOP (max 100 iterations):
    │
    ▼
[1. Scroll Page]
    │
    ├─ Execute: window.scrollTo(0, document.body.scrollHeight)
    └─ Wait: 2 seconds for loading
    │
    ▼
[2. Find "Load More" Button]
    │
    ├─ Try selector: button.load-more
    ├─ Try selector: a.show-more
    └─ Try selector: [data-action="load-more"]
    │
    ▼
[3. Click if Found]
    │
    ├─ Check if visible and enabled
    ├─ Click element
    └─ Wait: 3 seconds for new content
    │
    ▼
[4. Extract Current Messages]
    │
    └─ Get count of message elements
    │
    ▼
[5. Check Progress]
    │
    ├─ Message count increased?
    │   ├─ Yes → no_change_count = 0
    │   └─ No → no_change_count++
    │
    ├─ no_change_count >= 3?
    │   └─ Yes → BREAK LOOP
    │
    ├─ At scroll bottom?
    │   └─ Yes → BREAK LOOP
    │
    └─ No "Load More" button?
        └─ Yes → BREAK LOOP
    │
    ▼
[Continue Loop]
    │
    ▼
LOOP END
    │
    ▼
Return: All loaded messages
```

### Sub-Process 6: CSV Export Generation

**Process Name**: `export_results()`

**Purpose**: Generate multiple CSV files from results

**Flow**:
```
Input: Results dictionary
    │
    ▼
[Create DataFrames]
    │
    ├─ phone_numbers_df
    ├─ scraped_text_df
    ├─ combined_df
    └─ summary_df
    │
    ▼
[Format Data]
    │
    ├─ Convert timestamps to ISO 8601
    ├─ Escape special characters
    └─ Handle null values
    │
    ▼
[Generate Filenames]
    │
    ├─ Base name (from parameter)
    ├─ Timestamp suffix
    └─ .csv extension
    │
    ▼
[Create Output Directory]
    │
    └─ os.makedirs(output_dir, exist_ok=True)
    │
    ▼
FOR EACH DataFrame:
    │
    ├─ [Generate Full Path]
    │
    ├─ [Write CSV]
    │   ├─ UTF-8 encoding
    │   ├─ Include header
    │   └─ Quote strings
    │
    ├─ [Verify Written]
    │   └─ Check file exists
    │
    └─ [Log Success]
    │
    ▼
Return: List of file paths
```

## Execution Examples

### Example 1: Basic Scraping Execution

```bash
# Command
python phone_scraper.py https://example.com --output results

# Process Flow:
# 1. Parse args → output_dir = "results"
# 2. Validate URL → Valid
# 3. Initialize scraper
# 4. Scrape URL:
#    - Fetch HTML
#    - Extract text
#    - Find phone numbers
# 5. Generate statistics
# 6. Print summary
# 7. Export 4 CSV files to results/
# 8. Display file paths
# 9. Exit
```

### Example 2: Batch Processing from File

```bash
# Command
python phone_scraper.py --file urls.txt --delay 2

# Process Flow:
# 1. Parse args → file = "urls.txt", delay = 2
# 2. Read file → Load URLs, filter comments
# 3. Initialize scraper with delay=2
# 4. For each URL:
#    - Scrape
#    - Extract
#    - Aggregate
#    - Wait 2 seconds
# 5. Calculate aggregate statistics
# 6. Export results
# 7. Exit
```

### Example 3: NumberBarn Complete Extraction

```bash
# Command
python complete_message_extractor.py

# Process Flow:
# 1. Initialize scraper
# 2. Setup Chrome driver
# 3. Navigate to login → PAUSE for manual login
# 4. User logs in manually
# 5. Navigate to messages
# 6. Analyze page structure → Display selectors
# 7. User confirms selector
# 8. Begin extraction loop:
#    - Scroll down
#    - Click "Load More"
#    - Extract messages
#    - Repeat until complete
# 9. Process extracted data
# 10. Export 3 CSV files
# 11. Close browser
# 12. Display summary
# 13. Exit
```

## Integration Points

### External System Calls

**HTTP Requests**:
```
Application → requests.get() → Web Server
                             ← HTML Response
```

**Browser Automation**:
```
Application → Selenium WebDriver → ChromeDriver → Chrome Browser
                                                 ← DOM Access
```

**File System**:
```
Application → pandas.to_csv() → File System
                               ← CSV File
```

## State Management

### Application State

**In-Memory State**:
- Current URL being processed
- Accumulated results list
- Statistics counters
- Configuration settings

**Session State** (NumberBarn):
- Browser session
- Authentication status
- Current page
- Processed message IDs

**Persistent State**:
- CSV output files
- Debug HTML snapshots
- Log files

## Error Recovery

### Retry Logic

```
Operation Failed
    │
    ▼
[Identify Error Type]
    │
    ├─ Transient (timeout, temp unavailable)?
    │   │
    │   ├─ Retry count < max_retries?
    │   │   ├─ Yes → Wait and retry
    │   │   └─ No → Log and continue
    │   │
    │   └─ Return result or None
    │
    └─ Permanent (404, auth error)?
        └─ Log error and skip
```

### Graceful Degradation

```
Feature Failed
    │
    ▼
[Can Continue Without?]
    │
    ├─ Yes → Log warning, use fallback
    │        Continue processing
    │
    └─ No → Log error, abort operation
            Return partial results
```

## Performance Considerations

### Optimization Points

1. **Delay Management**: Configurable delays to balance speed vs. respect
2. **Memory Usage**: Streaming for large datasets (future)
3. **Parallel Processing**: Future enhancement for multiple URLs
4. **Caching**: Session persistence for NumberBarn

### Bottlenecks

- Network latency (HTTP requests)
- Browser automation overhead
- Regex processing on large text
- CSV writing for large datasets

See `01-architecture.md` for architectural details and `03-data-flow.md` for data transformation details.
