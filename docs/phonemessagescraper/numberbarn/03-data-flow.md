# Data Flow Documentation

## Overview

This document describes how data flows through the Phone Message Scraper application, including process flows, data transformations, and system interactions.

## High-Level Data Flow Diagram

```
┌──────────────┐
│ User Input   │
│ (URLs/Creds) │
└──────┬───────┘
       │
       ▼
┌────────────────────────────────────────────┐
│         Input Processing Layer             │
│  • URL Validation                          │
│  • Credential Handling (NumberBarn)        │
│  • Configuration Loading                   │
└──────┬─────────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────────┐
│         Scraping Strategy Selection        │
│  • General Web Scraping (BeautifulSoup)   │
│  • NumberBarn Scraping (Selenium)          │
└──────┬─────────────────────────────────────┘
       │
       ├─────────────────┬──────────────────┐
       ▼                 ▼                  ▼
┌─────────────┐  ┌──────────────┐  ┌──────────────┐
│  HTTP GET   │  │   Browser    │  │   Session    │
│  Request    │  │  Automation  │  │ Persistence  │
└─────┬───────┘  └──────┬───────┘  └──────┬───────┘
      │                 │                  │
      ▼                 ▼                  ▼
┌─────────────────────────────────────────────────┐
│         HTML Content Extraction                 │
│  • HTTP Response → HTML                         │
│  • Browser DOM → HTML                           │
│  • Dynamic Content Rendering                    │
└──────┬──────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│         Content Parsing & Analysis              │
│  • BeautifulSoup HTML Parsing                   │
│  • DOM Element Identification                   │
│  • Text Content Extraction                      │
└──────┬──────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│         Data Extraction                         │
│  • Phone Number Detection (Regex)              │
│  • Message Text Extraction                      │
│  • Metadata Extraction (timestamps, direction)  │
└──────┬──────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│         Data Transformation                     │
│  • Phone Number Normalization                   │
│  • Category Classification                      │
│  • Text Cleaning & Formatting                   │
└──────┬──────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│         Data Aggregation                        │
│  • Result Collection                            │
│  • Statistics Calculation                       │
│  • Deduplication                                │
└──────┬──────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│         Data Export                             │
│  • CSV Generation (Pandas)                      │
│  • File Writing                                 │
│  • Multiple Output Formats                      │
└──────┬──────────────────────────────────────────┘
       │
       ▼
┌──────────────┐
│ CSV Files    │
│ (Output)     │
└──────────────┘
```

## Detailed Process Flows

### 1. General Web Scraping Flow

```
START
  │
  ▼
[Parse Command Line Arguments]
  │
  ├─ URLs from arguments
  ├─ URLs from file
  └─ Configuration options
  │
  ▼
[Initialize PhoneNumberScraper]
  │
  ├─ Set delay between requests
  ├─ Set output directory
  └─ Initialize components (WebScraper, PhoneExtractor, CSVExporter)
  │
  ▼
[For Each URL] ──────────┐
  │                       │
  ▼                       │
[Validate URL]            │
  │                       │
  ├─ Valid? ──No─────────┤
  │                       │
  Yes                     │
  │                       │
  ▼                       │
[Fetch HTML Content]      │
  │                       │
  ├─ HTTP GET request     │
  ├─ Handle timeouts      │
  └─ Check status code    │
  │                       │
  ▼                       │
[Success?]                │
  │                       │
  No──[Log Error]────────┤
  │                       │
  Yes                     │
  │                       │
  ▼                       │
[Parse HTML with BeautifulSoup]
  │                       │
  ▼                       │
[Extract Text Content]    │
  │                       │
  ├─ Get visible text     │
  ├─ Remove scripts/styles│
  └─ Normalize whitespace │
  │                       │
  ▼                       │
[Extract Phone Numbers]   │
  │                       │
  ├─ Apply regex patterns │
  ├─ Find all matches     │
  └─ Extract context      │
  │                       │
  ▼                       │
[Categorize Phone Numbers]│
  │                       │
  ├─ Local vs toll-free   │
  ├─ International check  │
  └─ Format normalization │
  │                       │
  ▼                       │
[Aggregate Results]       │
  │                       │
  ├─ Store phone numbers  │
  ├─ Store text content   │
  └─ Update statistics    │
  │                       │
  ▼                       │
[Apply Delay] ────────────┤
  │                       │
  ▼                       │
[More URLs?] ──Yes────────┘
  │
  No
  │
  ▼
[Calculate Summary Statistics]
  │
  ├─ Total/unique phones
  ├─ Success/failure rates
  └─ Categorization stats
  │
  ▼
[Export to CSV Files]
  │
  ├─ phone_numbers.csv
  ├─ scraped_text.csv
  ├─ combined_data.csv
  └─ summary_stats.csv
  │
  ▼
[Display Summary Report]
  │
  ▼
END
```

### 2. NumberBarn Message Extraction Flow

```
START
  │
  ▼
[Initialize NumberBarnScraper]
  │
  ├─ Configure browser options
  ├─ Set headless mode
  └─ Initialize message list
  │
  ▼
[Setup Chrome WebDriver]
  │
  ├─ Load Chrome options
  ├─ Disable automation flags
  └─ Set user agent
  │
  ▼
[Navigate to Login Page]
  │
  └─ URL: https://www.numberbarn.com/login
  │
  ▼
[Wait for Manual Login] ◄─────────┐
  │                               │
  ├─ User enters credentials      │
  ├─ User solves CAPTCHA (if any) │
  └─ User submits form            │
  │                               │
  ▼                               │
[Verify Login Success]            │
  │                               │
  ├─ Check for login indicators   │
  ├─ Check for error messages     │
  │                               │
  └─ Not logged in? ──Yes─────────┘
  │
  No
  │
  ▼
[Navigate to Messages Page]
  │
  ├─ Try: /messages
  ├─ Try: /app/messages
  ├─ Try: /account/messages
  └─ Try: /dashboard/messages
  │
  ▼
[Analyze Page Structure]
  │
  ├─ Save HTML for debugging
  ├─ Identify message containers
  ├─ Test 20+ selector patterns
  └─ Display sample messages
  │
  ▼
[User Confirms Correct Elements?]
  │
  No ──[Manual Selector Entry]
  │
  Yes
  │
  ▼
[Initialize Pagination Loop] ──────┐
  │                                 │
  ▼                                 │
[Scroll to Load More]               │
  │                                 │
  ├─ Execute JavaScript scroll      │
  ├─ Wait for dynamic loading       │
  └─ Check for "Load More" button   │
  │                                 │
  ▼                                 │
[Extract Visible Messages]          │
  │                                 │
  ├─ Get message text               │
  ├─ Find phone numbers (regex)     │
  ├─ Extract timestamps             │
  ├─ Detect message direction       │
  ├─ Calculate length/word count    │
  └─ Store HTML element             │
  │                                 │
  ▼                                 │
[Mark Messages as Processed]        │
  │                                 │
  └─ Track by unique identifier     │
  │                                 │
  ▼                                 │
[Check for More Messages]           │
  │                                 │
  ├─ "Load More" button exists?     │
  ├─ New content after scroll?      │
  └─ Reached scroll bottom?         │
  │                                 │
  ▼                                 │
[More Messages Available?] ──Yes────┘
  │
  No
  │
  ▼
[Process Extracted Messages]
  │
  ├─ Deduplicate messages
  ├─ Parse phone numbers
  ├─ Standardize formats
  └─ Enrich metadata
  │
  ▼
[Calculate Statistics]
  │
  ├─ Total messages
  ├─ Unique phone numbers
  ├─ Average length/word count
  └─ Phone number frequency
  │
  ▼
[Export to Multiple CSV Files]
  │
  ├─ all_numberbarn_messages.csv
  ├─ phone_numbers_summary.csv
  └─ extraction_stats.csv
  │
  ▼
[Close Browser]
  │
  ▼
END
```

### 3. Phone Number Detection Flow

```
Input: Text Content
  │
  ▼
[Apply Primary Regex Pattern]
  │
  └─ Pattern: Complex phone number regex
  │
  ▼
[Get All Matches]
  │
  ├─ Match 1: "(123) 456-7890"
  ├─ Match 2: "800-555-0100"
  └─ Match 3: "+1-234-567-8901"
  │
  ▼
[For Each Match] ──────────────┐
  │                             │
  ▼                             │
[Extract Raw Number]            │
  │                             │
  ▼                             │
[Validate Match]                │
  │                             │
  ├─ Minimum 10 digits?         │
  ├─ Valid area code?           │
  └─ Not all same digit?        │
  │                             │
  ▼                             │
[Valid?]                        │
  │                             │
  No ─[Skip Match]──────────────┤
  │                             │
  Yes                           │
  │                             │
  ▼                             │
[Extract Context]               │
  │                             │
  ├─ Get 100 chars before       │
  └─ Get 100 chars after        │
  │                             │
  ▼                             │
[Categorize Number]             │
  │                             │
  ├─ Starts with 800/888/877?   │
  │   └─ Category: "toll-free"  │
  ├─ Has country code (+)?      │
  │   └─ Category: "international"
  └─ Otherwise                  │
      └─ Category: "local"      │
  │                             │
  ▼                             │
[Format Number]                 │
  │                             │
  ├─ Standardize separators     │
  ├─ Add parentheses for area   │
  └─ Format: "(123) 456-7890"   │
  │                             │
  ▼                             │
[Add to Results Collection]     │
  │                             │
  └─ More matches? ──Yes────────┘
  │
  No
  │
  ▼
Return: List of PhoneNumber objects
```

### 4. CSV Export Flow

```
Input: Aggregated Data
  │
  ▼
[Create Pandas DataFrames]
  │
  ├─ Phone Numbers DataFrame
  ├─ Scraped Text DataFrame
  ├─ Combined Data DataFrame
  └─ Summary Statistics DataFrame
  │
  ▼
[For Each DataFrame] ────────┐
  │                           │
  ▼                           │
[Apply Schema]                │
  │                           │
  ├─ Define columns           │
  ├─ Set data types           │
  └─ Order columns            │
  │                           │
  ▼                           │
[Format Data]                 │
  │                           │
  ├─ Format timestamps        │
  ├─ Escape special chars     │
  └─ Handle null values       │
  │                           │
  ▼                           │
[Generate Filename]           │
  │                           │
  ├─ Base name                │
  ├─ Timestamp suffix         │
  └─ .csv extension           │
  │                           │
  ▼                           │
[Create Output Directory]     │
  │                           │
  └─ mkdir if not exists      │
  │                           │
  ▼                           │
[Write CSV File]              │
  │                           │
  ├─ UTF-8 encoding           │
  ├─ Include header row       │
  └─ Handle write errors      │
  │                           │
  ▼                           │
[Verify File Written]         │
  │                           │
  ├─ Check file exists        │
  └─ Log success/failure      │
  │                           │
  └─ More DataFrames? ─Yes────┘
  │
  No
  │
  ▼
Return: List of file paths
```

## Data Transformation Details

### Phone Number Normalization

```
Input Examples:
  "123-456-7890"
  "(123) 456-7890"
  "123.456.7890"
  "1234567890"
  "+1-123-456-7890"

Transformation Steps:
  1. Extract digits only
     → "1234567890"
  
  2. Identify components
     - Country code: 1 (optional)
     - Area code: 123
     - Prefix: 456
     - Line number: 7890
  
  3. Apply standard format
     → "(123) 456-7890"
  
  4. For toll-free
     → "1-800-555-0100"
  
  5. For international
     → "+44 20 1234 5678"
```

### Message Direction Detection

```
Input: Message text content

Detection Logic:
  1. Check for outgoing indicators
     - Contains "You:" or "Me:"
     - Element class contains "sent" or "outgoing"
     - Aligned right (CSS analysis)
     → Direction: "outgoing"
  
  2. Check for incoming indicators
     - Contains phone number prefix
     - Element class contains "received" or "incoming"
     - Aligned left (CSS analysis)
     → Direction: "incoming"
  
  3. Default
     → Direction: "unknown"
```

### Timestamp Extraction

```
Input: Message text content

Patterns Checked:
  1. ISO 8601: "2024-10-24T14:30:00Z"
  2. US Format: "10/24/2024 2:30 PM"
  3. Long Format: "October 24, 2024 at 2:30 PM"
  4. Relative: "2 hours ago"
  5. Short: "Oct 24, 2:30 PM"

Extraction:
  - Apply regex patterns in order
  - Return first match found
  - Store as string (not parsed)
```

## Error Handling Data Flow

```
Error Occurs
  │
  ▼
[Identify Error Type]
  │
  ├─ Network Error
  │   ├─ Log error details
  │   ├─ Mark URL as failed
  │   └─ Continue to next URL
  │
  ├─ Parsing Error
  │   ├─ Log error details
  │   ├─ Save problematic HTML
  │   └─ Skip current page
  │
  ├─ Authentication Error
  │   ├─ Display error message
  │   ├─ Prompt for retry
  │   └─ Exit if critical
  │
  └─ File I/O Error
      ├─ Log error details
      ├─ Try alternative path
      └─ Fail gracefully if persistent
  │
  ▼
[Update Error Statistics]
  │
  ├─ Increment error count
  ├─ Store error message
  └─ Update success rate
  │
  ▼
[Continue Processing]
  │
  └─ Unless critical error
```

## Performance Optimization Data Flow

### Batch Processing

```
Large URL List (1000 URLs)
  │
  ▼
[Split into Batches]
  │
  └─ Batch size: 100 URLs
  │
  ▼
[For Each Batch] ────────┐
  │                       │
  ▼                       │
[Process URLs in Batch]   │
  │                       │
  ▼                       │
[Aggregate Batch Results] │
  │                       │
  ▼                       │
[Write Intermediate CSV]  │
  │                       │
  ▼                       │
[Clear Memory]            │
  │                       │
  └─ More batches? ─Yes───┘
  │
  No
  │
  ▼
[Merge All Results]
  │
  ▼
[Final Export]
```

### Deduplication Flow

```
Messages/Phone Numbers
  │
  ▼
[Create Hash Set]
  │
  └─ Use: text content + phone number
  │
  ▼
[For Each Item] ─────────┐
  │                       │
  ▼                       │
[Generate Hash]           │
  │                       │
  ▼                       │
[Hash Exists in Set?]     │
  │                       │
  Yes ─[Skip Item]────────┤
  │                       │
  No                      │
  │                       │
  ▼                       │
[Add Hash to Set]         │
  │                       │
  ▼                       │
[Add Item to Results]     │
  │                       │
  └─ More items? ─Yes─────┘
  │
  No
  │
  ▼
Return: Deduplicated Results
```

## Integration Points

### External System Interactions

```
┌─────────────────────┐
│  Application        │
└──────┬──────────────┘
       │
       ├─────► HTTP Web Servers (requests library)
       │       • GET requests
       │       • Response handling
       │
       ├─────► NumberBarn Web App (Selenium)
       │       • Browser automation
       │       • DOM manipulation
       │       • JavaScript execution
       │
       ├─────► Chrome Browser (ChromeDriver)
       │       • WebDriver protocol
       │       • Browser control
       │
       └─────► File System (OS/Pandas)
               • CSV file writing
               • Directory management
               • File permissions
```
