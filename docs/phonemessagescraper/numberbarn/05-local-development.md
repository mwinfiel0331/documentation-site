# Local Development Guide

## Overview

This guide provides comprehensive instructions for setting up and running the Phone Message Scraper locally on your development machine.

## Prerequisites

### System Requirements

- **Operating System**: Windows 10+, macOS 10.14+, or Linux (Ubuntu 18.04+)
- **Python**: Version 3.7 or higher
- **RAM**: Minimum 4 GB (8 GB recommended for NumberBarn extraction)
- **Disk Space**: 500 MB for application and dependencies
- **Internet**: Active connection required for scraping

### Software Requirements

1. **Python 3.7+**
   - Download from [python.org](https://www.python.org/downloads/)
   - Verify installation:
     ```bash
     python --version
     # or
     python3 --version
     ```

2. **pip** (Python package manager)
   - Usually included with Python
   - Verify installation:
     ```bash
     pip --version
     ```

3. **Chrome Browser** (for NumberBarn automation)
   - Download from [google.com/chrome](https://www.google.com/chrome/)
   - Note your Chrome version (Help → About Google Chrome)

4. **ChromeDriver** (for NumberBarn automation)
   - Must match your Chrome version
   - Download from [chromedriver.chromium.org](https://chromedriver.chromium.org/)

## Initial Setup

### 1. Clone the Repository

```bash
# Using git
git clone https://github.com/mwinfiel0331/phonemessagescraper.git
cd phonemessagescraper

# Or download ZIP and extract
```

### 2. Create Virtual Environment (Recommended)

**On Windows**:
```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
.venv\Scripts\activate
```

**On macOS/Linux**:
```bash
# Create virtual environment
python3 -m venv .venv

# Activate virtual environment
source .venv/bin/activate
```

**Verify activation**:
```bash
# Your prompt should show (.venv)
which python  # Should point to .venv/bin/python
```

### 3. Install Dependencies

```bash
# Install core dependencies
pip install -r requirements.txt

# For NumberBarn automation, also install:
pip install selenium
```

**Verify installation**:
```bash
pip list
# Should show: requests, beautifulsoup4, lxml, pandas, selenium
```

### 4. Setup ChromeDriver (for NumberBarn)

**Option 1: Add to PATH**

**Windows**:
1. Download ChromeDriver matching your Chrome version
2. Extract `chromedriver.exe`
3. Move to `C:\Windows\System32\` or add folder to PATH
4. Verify:
   ```bash
   chromedriver --version
   ```

**macOS**:
```bash
# Using Homebrew
brew install chromedriver

# Or manually
# Download, extract, move to /usr/local/bin
sudo mv chromedriver /usr/local/bin/
chmod +x /usr/local/bin/chromedriver
```

**Linux**:
```bash
# Download appropriate version
wget https://chromedriver.storage.googleapis.com/LATEST_RELEASE
VERSION=$(cat LATEST_RELEASE)
wget https://chromedriver.storage.googleapis.com/$VERSION/chromedriver_linux64.zip

# Extract and install
unzip chromedriver_linux64.zip
sudo mv chromedriver /usr/local/bin/
sudo chmod +x /usr/local/bin/chromedriver
```

**Option 2: Place in Project Directory**
```bash
# Just place chromedriver(.exe) in the project root directory
# The application will find it automatically
```

**Verify ChromeDriver**:
```bash
python verify_chromedriver.py
```

### 5. Configure Output Directory

```bash
# Create output directory
mkdir output

# Or it will be created automatically on first run
```

## Running Locally

### Basic Web Scraping

#### Single URL

```bash
# Basic usage
python phone_scraper.py https://example.com

# With custom output directory
python phone_scraper.py https://example.com --output my_results

# With custom delay
python phone_scraper.py https://example.com --delay 2
```

#### Multiple URLs

```bash
# From command line
python phone_scraper.py https://example.com https://example.org

# From file
python phone_scraper.py --file urls.txt

# With all options
python phone_scraper.py --file urls.txt --delay 2 --output results --filename batch1
```

#### Example URL File

Create `urls.txt`:
```
https://example.com
https://example.org/contact
https://example.net/about
# This is a comment
https://example.info
```

Run:
```bash
python phone_scraper.py --file urls.txt
```

### NumberBarn Message Extraction

#### Basic NumberBarn Scraper

```bash
python numberbarn_scraper.py
```

**Process**:
1. Browser opens
2. Navigate to login page
3. **Manually login** (enter credentials)
4. Wait for script to navigate to messages
5. Messages extracted automatically
6. CSV files generated

#### Complete Message Extractor (Recommended)

```bash
python complete_message_extractor.py
```

**Features**:
- Automatic pagination
- "Load More" button detection
- Comprehensive data extraction
- Multiple output files

**Process**:
1. Browser launches
2. Manual login prompt
3. Automatic navigation to messages
4. Page structure analysis
5. Automatic element detection
6. Complete extraction with pagination
7. Multiple CSV outputs

#### Persistent Session Extractor

```bash
python persistent_session_extractor.py
```

**Benefits**:
- Saves browser session
- Faster subsequent runs
- Less manual intervention

#### Bidirectional Extractor

```bash
python bidirectional_extractor.py
```

**Features**:
- Tracks sent and received messages
- Better direction classification
- Enhanced metadata

### Using the Python API

#### Basic Scraping Example

Create `my_scraper.py`:
```python
#!/usr/bin/env python3
from phone_scraper import PhoneNumberScraper

# Initialize scraper
scraper = PhoneNumberScraper(
    delay=1.5,
    output_dir='my_output'
)

# Define URLs to scrape
urls = [
    'https://example.com',
    'https://example.org/contact'
]

# Scrape URLs
print("Starting scraping...")
results = scraper.scrape_urls(urls, include_text=True)

# Display summary
scraper.print_summary(results)

# Export results
scraper.export_results(results, filename='my_scrape', include_text=True)

print("Done! Check my_output/ directory")
```

Run:
```bash
python my_scraper.py
```

#### Advanced Example

```python
#!/usr/bin/env python3
from phone_scraper import PhoneNumberScraper
from phone_extractor import PhoneExtractor
import logging

# Enable logging
logging.basicConfig(level=logging.INFO)

# Custom configuration
scraper = PhoneNumberScraper(
    delay=2.0,
    output_dir='results'
)

# Read URLs from file
with open('urls.txt', 'r') as f:
    urls = [line.strip() for line in f if line.strip() and not line.startswith('#')]

print(f"Loaded {len(urls)} URLs")

# Scrape with error handling
try:
    results = scraper.scrape_urls(urls)
    
    # Custom analysis
    total_phones = sum(len(r.get('phone_numbers', [])) for r in results['scraped_data'])
    print(f"Total phone numbers found: {total_phones}")
    
    # Export
    scraper.export_results(results)
    
except Exception as e:
    print(f"Error during scraping: {e}")
    import traceback
    traceback.print_exc()
```

#### Phone Number Extraction Only

```python
#!/usr/bin/env python3
from phone_extractor import PhoneExtractor

# Initialize extractor
extractor = PhoneExtractor()

# Sample text
text = """
Contact our sales team at (555) 123-4567 or our
toll-free support line at 1-800-555-0100.
International customers can call +44 20 1234 5678.
"""

# Extract phone numbers
phones = extractor.extract_phone_numbers(text)

# Display results
for phone in phones:
    print(f"Found: {phone['formatted_phone']} ({phone['category']})")

# Extract with context
phones_with_context = extractor.extract_with_context(text, context_chars=50)

for phone in phones_with_context:
    print(f"\nNumber: {phone['phone_number']}")
    print(f"Before: ...{phone['context_before']}")
    print(f"After: {phone['context_after']}...")
```

## Development Workflow

### Typical Development Session

```bash
# 1. Activate virtual environment
source .venv/bin/activate  # or .venv\Scripts\activate on Windows

# 2. Pull latest changes (if using git)
git pull origin main

# 3. Install/update dependencies
pip install -r requirements.txt

# 4. Make code changes
# ... edit files ...

# 5. Test changes
python phone_scraper.py https://example.com --output test_output

# 6. Verify output
ls -la test_output/
cat test_output/summary_stats_*.csv

# 7. Clean up test output
rm -rf test_output/

# 8. Commit changes (if satisfied)
git add .
git commit -m "Description of changes"
git push
```

### Directory Structure

```
phonemessagescraper/
├── .venv/                          # Virtual environment (not in git)
├── .git/                           # Git repository
├── .gitignore                      # Git ignore file
├── README.md                       # Main documentation
├── requirements.txt                # Python dependencies
│
├── docs/                           # Documentation
│   └── numberbarn/                 # NumberBarn-specific docs
│       ├── 00-requirements.md
│       ├── 01-architecture.md
│       └── ...
│
├── output/                         # Default output directory
│   ├── phone_numbers_*.csv
│   ├── scraped_text_*.csv
│   └── ...
│
├── chrome_user_data/               # Chrome profile data
├── screenshots/                    # Screenshots (if any)
├── example_output/                 # Example outputs
├── readmes/                        # Additional guides
│   ├── COMPLETE_EXTRACTION_GUIDE.md
│   ├── AUTOMATION_GUIDE.md
│   └── BROWSER_AUTOMATION_GUIDE.md
│
├── phone_scraper.py               # Main CLI application
├── web_scraper.py                 # Web scraping module
├── phone_extractor.py             # Phone extraction module
├── csv_exporter.py                # CSV export module
│
├── numberbarn_scraper.py          # NumberBarn scraper (basic)
├── complete_message_extractor.py  # Complete extractor
├── persistent_session_extractor.py
├── bidirectional_extractor.py
├── two_pane_extractor.py
│
├── examples.py                    # Usage examples
├── simple_automation_test.py      # Simple automation test
├── verify_chromedriver.py         # ChromeDriver verification
└── diagnostic_extractor.py        # Diagnostic tools
```

## Environment Variables (Optional)

Create `.env` file (future enhancement):
```bash
# .env
SCRAPER_DELAY=1.5
SCRAPER_OUTPUT_DIR=output
CHROME_DRIVER_PATH=/usr/local/bin/chromedriver
HEADLESS_MODE=true
```

**Note**: Currently not implemented, but planned for future versions.

## Common Development Tasks

### Adding New Phone Number Patterns

Edit `phone_extractor.py`:
```python
# Add to regex pattern
PHONE_PATTERN = r'...'  # Add new pattern

# Test extraction
extractor = PhoneExtractor()
test_text = "New format: 555.1234"
results = extractor.extract_phone_numbers(test_text)
print(results)
```

### Customizing CSV Output

Edit `csv_exporter.py`:
```python
# Modify export_phone_numbers method
def export_phone_numbers(self, results, filename):
    # Add custom columns
    data['custom_field'] = ...
    
    # Modify order
    df = df[['phone_number', 'custom_field', ...]]
```

### Adding New Scraping Strategies

Create new file (e.g., `custom_scraper.py`):
```python
from numberbarn_scraper.py import NumberBarnMessageScraper

class CustomScraper(NumberBarnMessageScraper):
    def custom_extraction_method(self):
        # Your custom logic
        pass
```

### Debugging

#### Enable Debug Logging

```python
import logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

#### Save HTML for Analysis

```python
# In your scraper
with open('debug_page.html', 'w', encoding='utf-8') as f:
    f.write(driver.page_source)
```

#### Interactive Debugging

```python
# Add breakpoint
import pdb; pdb.set_trace()

# Or use IPython
from IPython import embed; embed()
```

## Troubleshooting

### Issue: Virtual Environment Not Activating

**Windows**:
```bash
# May need to enable scripts
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue: pip install fails

**Solution**:
```bash
# Update pip
python -m pip install --upgrade pip

# Try installing again
pip install -r requirements.txt
```

### Issue: ChromeDriver version mismatch

**Solution**:
```bash
# Check Chrome version: chrome://version
# Download matching ChromeDriver
# Replace old ChromeDriver with new one
```

### Issue: Browser doesn't open for NumberBarn

**Check**:
1. ChromeDriver installed and accessible
2. Chrome browser installed
3. No conflicting Chrome instances
4. Run `python verify_chromedriver.py`

### Issue: No phone numbers found

**Debug**:
```python
from phone_extractor import PhoneExtractor

extractor = PhoneExtractor()
text = "Your test text here"
results = extractor.extract_phone_numbers(text)
print(f"Found {len(results)} numbers: {results}")
```

### Issue: Permission denied on output

**Solution**:
```bash
# Check directory permissions
ls -la output/

# Create with correct permissions
mkdir -p output
chmod 755 output
```

### Issue: Module not found

**Solution**:
```bash
# Ensure virtual environment is activated
which python  # Should point to .venv

# Reinstall dependencies
pip install -r requirements.txt
```

## Performance Optimization

### Faster Scraping

```python
# Reduce delay for trusted sites
scraper = PhoneNumberScraper(delay=0.5)

# Exclude text content to save memory
results = scraper.scrape_urls(urls, include_text=False)
```

### Memory Management

```python
# Process in batches for large URL lists
def scrape_in_batches(urls, batch_size=100):
    for i in range(0, len(urls), batch_size):
        batch = urls[i:i+batch_size]
        scraper = PhoneNumberScraper()
        results = scraper.scrape_urls(batch)
        scraper.export_results(results, filename=f'batch_{i}')
```

### Headless Mode (Faster)

```python
# In numberbarn_scraper.py
scraper = NumberBarnMessageScraper(headless=True)
```

## Code Quality Tools

### Linting (Recommended)

```bash
# Install linting tools
pip install pylint black flake8

# Run linter
pylint phone_scraper.py

# Auto-format code
black phone_scraper.py

# Check style
flake8 phone_scraper.py
```

### Type Checking (Future)

```bash
# Install mypy
pip install mypy

# Check types
mypy phone_scraper.py
```

## Hot Reload for Development

For iterative development:

```bash
# Install watchdog
pip install watchdog

# Run with auto-reload (create dev script)
# watchmedo auto-restart --patterns="*.py" python phone_scraper.py https://example.com
```

## Next Steps

- See `04-testing.md` for testing procedures
- See `06-deployment.md` for production deployment
- See `07-application-flow.md` for detailed process flows
- See `08-future-features.md` for enhancement opportunities
