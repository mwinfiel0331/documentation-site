# Testing Documentation

## Overview

This document describes how to execute tests for the Phone Message Scraper application. Currently, the project has minimal automated testing infrastructure, with testing primarily performed through manual execution and validation.

## Test Infrastructure

### Current State

The project currently includes:
- **Manual testing scripts**: `simple_automation_test.py`
- **Example usage scripts**: `examples.py`, `web_scraper_examples.py`
- **Diagnostic tools**: `diagnostic_extractor.py`, `verify_chromedriver.py`

### Test Types

#### 1. Unit Testing (Future)
Currently not implemented. Future unit tests should cover:
- Phone number regex patterns
- URL validation
- Data formatting functions
- CSV export functions

#### 2. Integration Testing
Manual integration testing through example scripts:
- Web scraping functionality
- Phone number extraction
- CSV export generation
- NumberBarn automation

#### 3. End-to-End Testing
Manual E2E testing through full workflow execution:
- Complete scraping sessions
- NumberBarn message extraction
- Output validation

## Running Tests

### Prerequisites

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **For NumberBarn Tests (Additional Requirements)**
   ```bash
   pip install selenium
   ```

3. **ChromeDriver Setup**
   - Download ChromeDriver matching your Chrome version
   - Place in PATH or project directory
   - Verify installation:
     ```bash
     python verify_chromedriver.py
     ```

### Manual Test Execution

#### Test 1: Basic Web Scraping

**Purpose**: Validate general web scraping functionality

**Steps**:
1. Run the basic scraper test:
   ```bash
   python phone_scraper.py https://example.com
   ```

2. **Expected Output**:
   - Console output showing scraping progress
   - CSV files created in `output/` directory:
     - `phone_numbers_*.csv`
     - `scraped_text_*.csv`
     - `combined_data_*.csv`
     - `summary_stats_*.csv`

3. **Validation**:
   - Check CSV files are created
   - Verify CSV files contain data
   - Confirm phone numbers detected (if any on page)
   - Review summary statistics

**Example**:
```bash
python phone_scraper.py https://example.com --output test_output
# Check output
ls -la test_output/
cat test_output/summary_stats_*.csv
```

#### Test 2: Multiple URL Scraping

**Purpose**: Validate batch processing

**Steps**:
1. Create test URL file:
   ```bash
   echo "https://example.com" > test_urls.txt
   echo "https://python.org" >> test_urls.txt
   echo "https://github.com" >> test_urls.txt
   ```

2. Run scraper:
   ```bash
   python phone_scraper.py --file test_urls.txt --delay 2
   ```

3. **Validation**:
   - Verify all URLs processed
   - Check delay between requests
   - Confirm aggregated results
   - Review success/failure statistics

#### Test 3: Phone Number Extraction

**Purpose**: Validate phone number detection patterns

**Steps**:
1. Run phone extractor examples:
   ```bash
   python examples.py
   ```

2. **Expected Output**:
   - Various phone number formats detected
   - Proper categorization (local, toll-free, international)
   - Formatted output displayed

3. **Test Cases**:
   - Standard format: `(123) 456-7890`
   - Dashed format: `123-456-7890`
   - Dotted format: `123.456.7890`
   - No separators: `1234567890`
   - Toll-free: `800-555-0100`
   - International: `+1-234-567-8901`
   - With extension: `123-456-7890 ext 123`

#### Test 4: CSV Export Functionality

**Purpose**: Validate data export formats

**Steps**:
1. Run scraper with custom options:
   ```bash
   python phone_scraper.py https://example.com --filename custom_test --no-text
   ```

2. **Validation**:
   - Check custom filename used
   - Verify `--no-text` excludes text content
   - Confirm UTF-8 encoding
   - Validate CSV structure

**Validation Script**:
```python
import pandas as pd

# Load and validate CSV
df = pd.read_csv('output/phone_numbers_custom_test_*.csv')
print(f"Rows: {len(df)}")
print(f"Columns: {list(df.columns)}")
print(df.head())
```

#### Test 5: ChromeDriver Verification

**Purpose**: Ensure ChromeDriver is correctly installed

**Steps**:
```bash
python verify_chromedriver.py
```

**Expected Output**:
- ChromeDriver version information
- Browser launch successful
- Navigation test passed

#### Test 6: NumberBarn Simple Automation

**Purpose**: Test basic NumberBarn automation

**Steps**:
1. Run simple automation test:
   ```bash
   python simple_automation_test.py
   ```

2. **Manual Steps**:
   - Browser will open
   - Navigate to NumberBarn login
   - Manually enter credentials
   - Manually navigate to messages
   - Confirm automation proceeds

3. **Validation**:
   - Browser automation works
   - Login page accessible
   - Manual intervention points work

#### Test 7: Complete Message Extraction

**Purpose**: Test full NumberBarn message extraction

**Steps**:
1. Run complete extractor:
   ```bash
   python complete_message_extractor.py
   ```

2. **Process**:
   - Browser opens automatically
   - Login manually when prompted
   - System detects message elements
   - Automatic pagination and extraction
   - Multiple CSV files generated

3. **Expected Output**:
   - `all_numberbarn_messages_*.csv`
   - `phone_numbers_summary_*.csv`
   - `extraction_stats_*.csv`
   - Debug HTML files

4. **Validation**:
   - All messages extracted (compare with web UI count)
   - Phone numbers correctly identified
   - Statistics match expectations
   - No duplicate messages

### Diagnostic Testing

#### Page Structure Analysis

**Purpose**: Debug NumberBarn page structure issues

**Steps**:
```bash
python diagnostic_extractor.py
```

**Output**:
- Saves HTML snapshot
- Tests multiple selectors
- Reports element counts
- Provides selector recommendations

**Use When**:
- Message extraction failing
- New NumberBarn UI updates
- Selector debugging needed

#### Browser Automation Guide

**Purpose**: Learn browser automation patterns

**Steps**:
```bash
python browser_automation_guide.py
```

**Provides**:
- Example automation patterns
- Best practices
- Common pitfalls
- Debugging techniques

## Test Data

### Sample URLs for Testing

**Test with Known Phone Numbers**:
```
https://www.example.com/contact
https://www.example.org/about
```

**Test Edge Cases**:
- Pages with no phone numbers
- Pages with multiple formats
- Pages with malformed numbers
- Pages with 404 errors
- Pages with slow loading

### Sample Phone Numbers for Pattern Testing

Create test file `test_phone_patterns.txt`:
```
(123) 456-7890
123-456-7890
123.456.7890
1234567890
+1-123-456-7890
1-800-555-0100
800-555-0100
888.555.0100
(877) 555-0100
123-456-7890 ext 123
123-456-7890 x456
+44 20 1234 5678
```

## Test Results Validation

### Automated Validation Script

Create `validate_output.py`:
```python
#!/usr/bin/env python3
"""Validate test output files."""

import pandas as pd
import os
import sys
from pathlib import Path

def validate_csv_files(output_dir='output'):
    """Validate CSV output files."""
    print("🔍 Validating CSV output files...")
    
    issues = []
    
    # Check directory exists
    if not os.path.exists(output_dir):
        issues.append(f"❌ Output directory '{output_dir}' not found")
        return issues
    
    # Expected file patterns
    expected_patterns = [
        'phone_numbers_*.csv',
        'scraped_text_*.csv',
        'summary_stats_*.csv'
    ]
    
    # Check each pattern
    for pattern in expected_patterns:
        files = list(Path(output_dir).glob(pattern))
        if not files:
            issues.append(f"⚠️  No files matching '{pattern}'")
        else:
            print(f"✅ Found {len(files)} file(s) matching '{pattern}'")
            
            # Validate first file of each type
            try:
                df = pd.read_csv(files[0])
                print(f"   - Rows: {len(df)}, Columns: {len(df.columns)}")
                
                # Check for empty dataframes
                if len(df) == 0:
                    issues.append(f"⚠️  Empty dataframe in {files[0].name}")
                    
            except Exception as e:
                issues.append(f"❌ Error reading {files[0].name}: {e}")
    
    return issues

def validate_phone_numbers(output_dir='output'):
    """Validate phone number format and content."""
    print("\n🔍 Validating phone number data...")
    
    issues = []
    phone_files = list(Path(output_dir).glob('phone_numbers_*.csv'))
    
    if not phone_files:
        issues.append("⚠️  No phone number files to validate")
        return issues
    
    try:
        df = pd.read_csv(phone_files[0])
        
        # Check required columns
        required_cols = ['phone_number', 'source_url', 'category']
        for col in required_cols:
            if col not in df.columns:
                issues.append(f"❌ Missing required column: {col}")
        
        # Check categories
        if 'category' in df.columns:
            valid_categories = ['local', 'toll-free', 'international']
            invalid_cats = df[~df['category'].isin(valid_categories)]
            if len(invalid_cats) > 0:
                issues.append(f"⚠️  {len(invalid_cats)} invalid categories")
        
        # Check phone number format
        if 'phone_number' in df.columns:
            # Basic validation: at least 10 digits
            import re
            for idx, number in enumerate(df['phone_number']):
                digits = re.sub(r'\D', '', str(number))
                if len(digits) < 10:
                    issues.append(f"⚠️  Row {idx}: Invalid phone '{number}'")
                    if len(issues) > 10:  # Limit issue reporting
                        issues.append("⚠️  ... and more validation issues")
                        break
        
        print(f"✅ Validated {len(df)} phone number records")
        
    except Exception as e:
        issues.append(f"❌ Error validating phone numbers: {e}")
    
    return issues

def main():
    """Run all validations."""
    print("=" * 50)
    print("📋 Phone Message Scraper - Output Validation")
    print("=" * 50)
    
    all_issues = []
    
    # Run validations
    all_issues.extend(validate_csv_files())
    all_issues.extend(validate_phone_numbers())
    
    # Report results
    print("\n" + "=" * 50)
    if not all_issues:
        print("✅ All validations passed!")
        return 0
    else:
        print(f"⚠️  Found {len(all_issues)} issue(s):")
        for issue in all_issues:
            print(f"  {issue}")
        return 1

if __name__ == '__main__':
    sys.exit(main())
```

**Usage**:
```bash
python validate_output.py
```

## Performance Testing

### Benchmarking Script

Create `benchmark_scraping.py`:
```python
#!/usr/bin/env python3
"""Benchmark scraping performance."""

import time
from phone_scraper import PhoneNumberScraper

def benchmark_scraping(num_urls=10):
    """Benchmark scraping multiple URLs."""
    print(f"🚀 Benchmarking {num_urls} URLs...")
    
    # Create test URLs
    test_urls = ['https://example.com'] * num_urls
    
    scraper = PhoneNumberScraper(delay=0.5)
    
    start_time = time.time()
    results = scraper.scrape_urls(test_urls, include_text=False)
    end_time = time.time()
    
    duration = end_time - start_time
    avg_per_url = duration / num_urls
    
    print(f"\n📊 Results:")
    print(f"  Total time: {duration:.2f}s")
    print(f"  Average per URL: {avg_per_url:.2f}s")
    print(f"  Success rate: {results['successful_urls']}/{num_urls}")

if __name__ == '__main__':
    benchmark_scraping(10)
```

## Regression Testing

### Test Checklist

Before each release, verify:

- [ ] Basic web scraping works
- [ ] Phone number extraction accurate
- [ ] All CSV files generated correctly
- [ ] Multiple URL processing works
- [ ] Error handling works (invalid URLs)
- [ ] ChromeDriver compatibility
- [ ] NumberBarn login successful
- [ ] Message extraction complete
- [ ] Pagination works correctly
- [ ] Output files valid UTF-8
- [ ] Summary statistics accurate

### Known Issues Tracking

**Current Known Issues**:
1. NumberBarn UI changes may break selectors
2. CAPTCHA may block automated login
3. Large message volumes may cause memory issues
4. Some phone formats may not be detected

**Workarounds**:
1. Use `diagnostic_extractor.py` to find new selectors
2. Manual CAPTCHA solving required
3. Process in batches for large datasets
4. Extend regex patterns as needed

## Test Automation (Future)

### Planned Test Framework

**Framework**: pytest

**Structure**:
```
tests/
├── unit/
│   ├── test_phone_extractor.py
│   ├── test_web_scraper.py
│   └── test_csv_exporter.py
├── integration/
│   ├── test_full_scraping.py
│   └── test_numberbarn_automation.py
└── fixtures/
    ├── sample_html.html
    └── sample_phone_numbers.txt
```

**Example Unit Test**:
```python
# tests/unit/test_phone_extractor.py
import pytest
from phone_extractor import PhoneExtractor

def test_extract_standard_format():
    """Test extraction of standard phone format."""
    extractor = PhoneExtractor()
    text = "Call us at (123) 456-7890"
    
    results = extractor.extract_phone_numbers(text)
    
    assert len(results) == 1
    assert results[0]['phone_number'] == '(123) 456-7890'
    assert results[0]['category'] == 'local'

def test_extract_toll_free():
    """Test extraction of toll-free numbers."""
    extractor = PhoneExtractor()
    text = "Customer service: 1-800-555-0100"
    
    results = extractor.extract_phone_numbers(text)
    
    assert len(results) == 1
    assert results[0]['category'] == 'toll-free'

def test_extract_multiple_formats():
    """Test extraction of multiple formats."""
    extractor = PhoneExtractor()
    text = "Office: 123-456-7890, Toll-free: (800) 555-0100"
    
    results = extractor.extract_phone_numbers(text)
    
    assert len(results) == 2
```

**Run Tests** (future):
```bash
pytest tests/ -v
pytest tests/unit/ -v --cov=.
pytest tests/integration/ -v
```

## Continuous Integration (Future)

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Python
      uses: actions/setup-python@v2
      with:
        python-version: '3.9'
    
    - name: Install dependencies
      run: |
        pip install -r requirements.txt
        pip install pytest pytest-cov
    
    - name: Run tests
      run: |
        pytest tests/ -v --cov=.
    
    - name: Upload coverage
      uses: codecov/codecov-action@v2
```

## Troubleshooting Tests

### Common Test Failures

**Issue**: `ImportError: No module named 'selenium'`
**Solution**: 
```bash
pip install selenium
```

**Issue**: `ChromeDriver not found`
**Solution**:
```bash
# Download ChromeDriver
# https://chromedriver.chromium.org/
# Add to PATH or place in project directory
```

**Issue**: `CSV file not found`
**Solution**: 
- Check output directory exists
- Verify scraping completed successfully
- Check file permissions

**Issue**: `No phone numbers detected`
**Solution**:
- Verify test page contains phone numbers
- Check regex patterns cover format
- Review extraction logs

### Debug Mode

Enable verbose logging:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

Save debug output:
```bash
python phone_scraper.py https://example.com 2>&1 | tee debug.log
```

## Test Reporting

### Generate Test Report

After running tests, generate a summary:

```bash
# Validation report
python validate_output.py > test_report.txt

# Include in documentation
cat test_report.txt
```

### Test Metrics

Track over time:
- Test execution time
- Success rate
- Coverage percentage
- Number of test cases
- Issues found vs fixed
