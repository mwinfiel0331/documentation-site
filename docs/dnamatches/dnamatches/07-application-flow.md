# Application Flow

## Overview

This document describes the detailed application workflow, subprocess execution, and operational sequences of the DNA Matches Scraper.

## Main Application Flow

### Complete Execution Sequence

```
┌─────────────────────────────────────────┐
│         Program Start                   │
│      python dna_scraper.py              │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│      if __name__ == "__main__"          │
│           main() called                 │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         Load Configuration              │
│      config = load_config()             │
└────────────────┬────────────────────────┘
                 │
                 ├──Error?──→ Log error & exit(1)
                 │
                 ▼
┌─────────────────────────────────────────┐
│      Extract Configuration Values       │
│      - email                            │
│      - password                         │
│      - delay                            │
│      - max_matches                      │
│      - output_dir                       │
└────────────────┬────────────────────────┘
                 │
                 ├──Missing/Invalid?──→ Log error & exit(1)
                 │
                 ▼
┌─────────────────────────────────────────┐
│      Validate Credentials               │
│      - Check not placeholder values     │
│      - Check not empty                  │
└────────────────┬────────────────────────┘
                 │
                 ├──Invalid?──→ Log error & exit(1)
                 │
                 ▼
┌─────────────────────────────────────────┐
│    Create DNAMatchesScraper Instance    │
│    scraper = DNAMatchesScraper(...)     │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         Execute scraper.run()           │
│  scrape_relatives=True                  │
│  max_matches=from_config                │
└────────────────┬────────────────────────┘
                 │
                 ├──Error?──→ Log error & exit(1)
                 │
                 ▼
┌─────────────────────────────────────────┐
│       Scraping Completed                │
│          exit(0)                        │
└─────────────────────────────────────────┘
```

## scraper.run() Flow

### Main Run Method Workflow

```
┌─────────────────────────────────────────┐
│          run() method called            │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│              try block                  │
└────────────────┬────────────────────────┘
                 │
                 ▼
        ┌────────────────────┐
        │  start_browser()   │
        └────────┬───────────┘
                 │
                 ├──Error?──→ Raise exception → finally block
                 │
                 ▼
        ┌────────────────────┐
        │     login()        │
        └────────┬───────────┘
                 │
                 ├──Error?──→ Raise exception → finally block
                 │
                 ▼
        ┌────────────────────────┐
        │ navigate_to_dna_       │
        │    relatives()         │
        └────────┬───────────────┘
                 │
                 ├──Error?──→ Raise exception → finally block
                 │
                 ▼
        ┌────────────────────────┐
        │ scrape_all_matches()   │
        │ → returns matches list │
        └────────┬───────────────┘
                 │
                 ├──Empty?──→ Continue (no matches to save)
                 │
                 ▼
        ┌────────────────────────┐
        │ save_matches_to_csv()  │
        └────────┬───────────────┘
                 │
                 ├──Error?──→ Raise exception → finally block
                 │
                 ▼
        ┌────────────────────────┐
        │ if scrape_relatives    │
        │    and matches:        │
        └────────┬───────────────┘
                 │
                 ├──False?──→ Skip relatives scraping
                 │
                 ▼
        ┌────────────────────────┐
        │ Apply max_matches      │
        │ limit to matches list  │
        └────────┬───────────────┘
                 │
                 ▼
        ┌─────────────────────────────┐
        │ For each match in list:     │
        │  1. Log progress            │
        │  2. scrape_relatives_       │
        │     in_common()             │
        │  3. if relatives exist:     │
        │     save_relatives_to_csv() │
        └────────┬────────────────────┘
                 │
                 ├──Error on match?──→ Log warning, continue next
                 │
                 ▼
        ┌────────────────────────┐
        │ Log completion message │
        └────────┬───────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         except Exception:               │
│         Log error & raise               │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│           finally block                 │
│       close_browser()                   │
└─────────────────────────────────────────┘
```

## Browser Lifecycle Flow

### Browser Management Subprocess

```
┌─────────────────────────────────────────┐
│       start_browser() called            │
└────────────────┬────────────────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ Log: "Starting         │
        │       browser..."      │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ playwright =           │
        │  sync_playwright()     │
        │    .start()            │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ browser =              │
        │  playwright.chromium   │
        │    .launch(            │
        │      headless=True)    │
        └────────┬───────────────┘
                 │
                 ├──Launch fails?──→ Raise exception
                 │
                 ▼
        ┌────────────────────────┐
        │ page =                 │
        │  browser.new_page()    │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ Log: "Browser started  │
        │    successfully"       │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ Return (browser &      │
        │  page now available)   │
        └────────────────────────┘

Later...

┌─────────────────────────────────────────┐
│       close_browser() called            │
└────────────────┬────────────────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ if page exists:        │
        │    page.close()        │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ if browser exists:     │
        │    browser.close()     │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ if playwright exists:  │
        │    playwright.stop()   │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ Log: "Browser closed"  │
        └────────────────────────┘
```

## Authentication Flow

### Login Subprocess Details

```
┌─────────────────────────────────────────┐
│         login() called                  │
└────────────────┬────────────────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ Log: "Logging in to    │
        │       23andMe..."      │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ try:                   │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────────┐
        │ page.goto(                 │
        │   "https://you.23andme.com │
        │    /user/login/",          │
        │   timeout=60000)           │
        └────────┬───────────────────┘
                 │
                 ├──Timeout?──→ Log error & raise
                 │
                 ▼
        ┌────────────────────────────┐
        │ page.fill(                 │
        │   'input[name="email"]',   │
        │   self.email)              │
        └────────┬───────────────────┘
                 │
                 ▼
        ┌────────────────────────────┐
        │ page.fill(                 │
        │   'input[name="password"]',│
        │   self.password)           │
        └────────┬───────────────────┘
                 │
                 ▼
        ┌────────────────────────────┐
        │ page.click(                │
        │   'button[type="submit"]') │
        └────────┬───────────────────┘
                 │
                 ▼
        ┌────────────────────────────┐
        │ page.wait_for_load_state(  │
        │   "networkidle",           │
        │   timeout=60000)           │
        └────────┬───────────────────┘
                 │
                 ├──Timeout?──→ Log error & raise
                 │
                 ▼
        ┌────────────────────────┐
        │ Log: "Login            │
        │    successful"         │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ time.sleep(self.delay) │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ Return (authenticated) │
        └────────────────────────┘
```

## Match Scraping Flow

### scrape\_all\_matches() Subprocess

```
┌─────────────────────────────────────────┐
│    scrape_all_matches() called          │
└────────────────┬────────────────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ matches = []           │
        │ (initialize empty)     │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ try:                   │
        └────────┬───────────────┘
                 │
                 ▼
        ┌─────────────────────────────┐
        │ page.wait_for_selector(     │
        │   '.relative-card, ...',    │
        │   timeout=30000)            │
        └────────┬────────────────────┘
                 │
                 ├──Timeout?──→ Log warning & return empty list
                 │
                 ▼
        ┌────────────────────────┐
        │ _scroll_to_load_all()  │
        │ (trigger lazy loading) │
        └────────┬───────────────┘
                 │
                 ▼
        ┌─────────────────────────────┐
        │ match_elements =            │
        │   page.query_selector_all(  │
        │     '.relative-card, ...')  │
        └────────┬────────────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ Log: Found N matches   │
        └────────┬───────────────┘
                 │
                 ▼
        ┌─────────────────────────────┐
        │ For idx, element in         │
        │   enumerate(match_elements):│
        └────────┬────────────────────┘
                 │
                 ▼
        ┌─────────────────────────────┐
        │   try:                      │
        │     Extract match data:     │
        │       - match_id = f"match_ │
        │         {idx+1}"            │
        │       - name = _safe_text_  │
        │         content(...)        │
        │       - relationship = ...  │
        │       - shared_dna = ...    │
        │       - shared_segments =..│
        └────────┬────────────────────┘
                 │
                 ├──Error extracting?──→ Log warning, continue next
                 │
                 ▼
        ┌────────────────────────┐
        │   matches.append(      │
        │     match_data)        │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ Continue for all       │
        │ elements               │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ Log: Successfully      │
        │   scraped N matches    │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ return matches         │
        └────────────────────────┘
```

## Relatives Scraping Flow

### scrape\_relatives\_in\_common() Subprocess

```
┌─────────────────────────────────────────┐
│  scrape_relatives_in_common()           │
│    (match_id, match_name)               │
└────────────────┬────────────────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ relatives = []         │
        │ (initialize empty)     │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ try:                   │
        └────────┬───────────────┘
                 │
                 ▼
        ┌─────────────────────────────┐
        │ Try to click match:         │
        │   match_link = page.get_by_ │
        │     text(match_name,        │
        │            exact=True)      │
        │   match_link.click()        │
        └────────┬────────────────────┘
                 │
                 ├──Fails?──→ Fallback to partial match
                 │
                 ▼
        ┌────────────────────────┐
        │ time.sleep(self.delay) │
        └────────┬───────────────┘
                 │
                 ▼
        ┌─────────────────────────────┐
        │ page.wait_for_selector(     │
        │   '.relatives-in-common,    │
        │    ...',                    │
        │   timeout=10000)            │
        └────────┬────────────────────┘
                 │
                 ├──Timeout?──→ Log warning, skip
                 │
                 ▼
        ┌─────────────────────────────┐
        │ relative_elements =         │
        │   page.query_selector_all(  │
        │     '.relative-card, ...')  │
        └────────┬────────────────────┘
                 │
                 ▼
        ┌─────────────────────────────┐
        │ For idx, element in         │
        │   enumerate(relative_       │
        │            elements):       │
        └────────┬────────────────────┘
                 │
                 ▼
        ┌─────────────────────────────┐
        │   try:                      │
        │     Extract relative data:  │
        │       - relative_id = ...   │
        │       - name = ...          │
        │       - relationship_to_    │
        │         match = ...         │
        │       - shared_dna_with_    │
        │         relative = ...      │
        └────────┬────────────────────┘
                 │
                 ├──Error?──→ Log warning, continue next
                 │
                 ▼
        ┌────────────────────────┐
        │   relatives.append(    │
        │     relative_data)     │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ page.go_back()         │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ time.sleep(self.delay) │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ Log: Found N relatives │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ return relatives       │
        └────────────────────────┘
```

## CSV Export Flow

### save\_matches\_to\_csv() Subprocess

```
┌─────────────────────────────────────────┐
│   save_matches_to_csv(matches)          │
└────────────────┬────────────────────────┘
                 │
                 ▼
        ┌────────────────────────────┐
        │ output_file = join(        │
        │   output_dir,              │
        │   "all_dna_matches.csv")   │
        └────────┬───────────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ if not matches:        │
        │   Log warning & return │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ try:                   │
        └────────┬───────────────┘
                 │
                 ▼
        ┌─────────────────────────────┐
        │ open(output_file, 'w',      │
        │      newline='',            │
        │      encoding='utf-8')      │
        └────────┬────────────────────┘
                 │
                 ▼
        ┌─────────────────────────────┐
        │ writer = csv.DictWriter(    │
        │   csvfile,                  │
        │   fieldnames=matches[0].    │
        │              keys())        │
        └────────┬────────────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ writer.writeheader()   │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ writer.writerows(      │
        │   matches)             │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ Close file             │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ Log success            │
        └────────┬───────────────┘
                 │
                 ├──Error?──→ Log error & raise
                 │
                 ▼
        ┌────────────────────────┐
        │ Return                 │
        └────────────────────────┘
```

### save\_relatives\_to\_csv() Subprocess

```
┌─────────────────────────────────────────┐
│  save_relatives_to_csv(                 │
│    match_id, match_name, relatives)     │
└────────────────┬────────────────────────┘
                 │
                 ▼
        ┌─────────────────────────────┐
        │ Sanitize match_name:        │
        │   safe_name = keep only     │
        │     alphanumeric, space,    │
        │     _, -                    │
        └────────┬────────────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ if safe_name empty:    │
        │   safe_name =          │
        │     "unnamed_match"    │
        └────────┬───────────────┘
                 │
                 ▼
        ┌─────────────────────────────┐
        │ output_file =               │
        │   f"relatives_in_common_    │
        │    {safe_name}_{match_id}   │
        │    .csv"                    │
        └────────┬────────────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ if not relatives:      │
        │   Log info & return    │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ try:                   │
        └────────┬───────────────┘
                 │
                 ▼
        ┌─────────────────────────────┐
        │ open(output_file, 'w', ...) │
        └────────┬────────────────────┘
                 │
                 ▼
        ┌─────────────────────────────┐
        │ writer = csv.DictWriter(...)│
        └────────┬────────────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ writer.writeheader()   │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ writer.writerows(      │
        │   relatives)           │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ Close file             │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ Log success            │
        └────────┬───────────────┘
                 │
                 ├──Error?──→ Log error & raise
                 │
                 ▼
        ┌────────────────────────┐
        │ Return                 │
        └────────────────────────┘
```

## Error Handling Flow

### Error Propagation

```
Error occurs in subprocess
        ↓
Caught in try/except block?
        ↓
    YES ──→ Log error
        ↓
    Recoverable?
        ↓
    YES ──→ Continue execution
        ↓
    NO ──→ Raise exception
        ↓
Propagates up call stack
        ↓
Caught in run() except block?
        ↓
    YES ──→ Log error
        ↓
        finally block executes
        ↓
        close_browser()
        ↓
        Raise exception
        ↓
Caught in main()?
        ↓
    YES ──→ Log fatal error
        ↓
        return 1 (error code)
        ↓
Program exits with code 1
```

## State Transitions

### Application State Machine

```
[INITIALIZED]
    ↓ start_browser()
[BROWSER_STARTED]
    ↓ login()
[AUTHENTICATED]
    ↓ navigate_to_dna_relatives()
[ON_DNA_RELATIVES_PAGE]
    ↓ scrape_all_matches()
[MATCHES_SCRAPED]
    ↓ save_matches_to_csv()
[MATCHES_SAVED]
    ↓ scrape_relatives_in_common() (for each match)
[RELATIVES_SCRAPED]
    ↓ save_relatives_to_csv() (for each match)
[RELATIVES_SAVED]
    ↓ close_browser()
[BROWSER_CLOSED]
    ↓
[COMPLETE]

Any state ──error──→ [ERROR] ──→ close_browser() ──→ [TERMINATED]
```

## Timing and Delays

### Rate Limiting Points

```
After login() → time.sleep(self.delay)
    ↓
After navigate_to_dna_relatives() → time.sleep(self.delay)
    ↓
During _scroll_to_load_all() → time.sleep(1) per scroll
    ↓
After clicking match → time.sleep(self.delay)
    ↓
After going back from match → time.sleep(self.delay)
    ↓
[Repeat for each match]
```

**Default delay**: 2 seconds (configurable)

## Parallel Processing (Future)

### Current Sequential Flow

```
Match 1 ──→ Relatives 1 ──→ Save 1 ──→ Match 2 ──→ Relatives 2 ──→ ...
```

**Total Time**: O(n × m) where n = matches, m = avg relatives per match

### Potential Parallel Flow

```
Match 1 ──→ Relatives 1 ──→ Save 1 ──┐
                                      │
Match 2 ──→ Relatives 2 ──→ Save 2 ──┼──→ All Complete
                                      │
Match 3 ──→ Relatives 3 ──→ Save 3 ──┘
```

**Total Time**: O(max(individual\_match\_times))

**Implementation**: Would require async Playwright and concurrent execution

## Command-Line Execution

### Direct Execution

```bash
python dna_scraper.py
```

**Flow**:

1. Reads config.ini from current directory
2. Executes with configured settings
3. Outputs to configured output\_dir
4. Logs to stdout

### With Environment Variables (Future)

```bash
DNA_EMAIL=user@example.com DNA_PASSWORD=secret python dna_scraper.py
```

**Flow**:

1. Reads environment variables first
2. Falls back to config.ini if not set
3. Executes as normal

## Integration Points

### External System Interactions

```
┌─────────────────────────────────────────┐
│         DNA Scraper                     │
└──────┬──────────────────────┬───────────┘
       │                      │
       │                      │
       ▼                      ▼
┌─────────────┐      ┌──────────────────┐
│  23andMe    │      │  File System     │
│  Website    │      │  (CSV files)     │
│  (HTTPS)    │      │  (Local storage) │
└─────────────┘      └──────────────────┘
```

**No other external dependencies or API calls**

## Subprocess Summary

| Subprocess | Trigger | Duration | Can Fail? | Recovery |
|------------|---------|----------|-----------|----------|
| load\_config() | Program start | \&lt;1s | Yes | Exit program |
| start\_browser() | After config | 2-5s | Yes | Exit program |
| login() | After browser start | 5-10s | Yes | Exit program |
| navigate\_to\_dna\_relatives() | After login | 3-5s | Yes | Exit program |
| scrape\_all\_matches() | After navigation | 10-60s | Partial | Continue with partial data |
| save\_matches\_to\_csv() | After scraping matches | \&lt;1s | Yes | Exit program |
| scrape\_relatives\_in\_common() | Per match | 5-15s | Yes | Skip match, continue |
| save\_relatives\_to\_csv() | Per match with relatives | \&lt;1s | Yes | Skip match, continue |
| close\_browser() | End/error | 1-2s | No | Always succeeds |

## Execution Examples

### Minimal Configuration (10 matches)

```
Total execution time ≈ 2-5 minutes

Breakdown:
- Browser startup: 5s
- Login: 10s
- Navigation: 5s
- Scrape 10 matches: 20s
- Save matches: 1s
- Scrape 10 × relatives (avg 3 each): 10 × 10s = 100s
- Save 10 × relatives: 10s
- Cleanup: 2s
Total: ~153 seconds
```

### Large Dataset (1000 matches, first 100 processed)

```
Total execution time ≈ 30-40 minutes

Breakdown:
- Browser startup: 5s
- Login: 10s
- Navigation: 5s
- Scrape 1000 matches: 60s (scrolling)
- Save matches: 2s
- Scrape 100 × relatives (avg 3 each): 100 × 10s = 1000s
- Save 100 × relatives: 20s
- Cleanup: 2s
Total: ~1104 seconds ≈ 18 minutes
```
