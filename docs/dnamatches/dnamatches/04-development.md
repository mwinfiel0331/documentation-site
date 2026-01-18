# Development Guide

## Overview

This guide provides instructions for setting up a development environment, running the application locally, executing tests, and contributing to the project.

## Development Environment Setup

### Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.8 or higher**
  - Check version: `python --version` or `python3 --version`
  - Download from: https://www.python.org/downloads/

- **pip** (Python package installer)
  - Usually comes with Python
  - Check version: `pip --version` or `pip3 --version`

- **git** (version control)
  - Check version: `git --version`
  - Download from: https://git-scm.com/

### Initial Setup

#### 1. Clone the Repository

```bash
git clone https://github.com/mwinfiel0331/dnamatches.git
cd dnamatches
```

#### 2. Create a Virtual Environment (Recommended)

**On macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

**On Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

You should see `(venv)` in your command prompt when the virtual environment is active.

#### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

This will install:
- `playwright==1.40.0` - Web automation framework

#### 4. Install Playwright Browsers

Playwright requires browser binaries to be installed:

```bash
playwright install chromium
```

This downloads and installs the Chromium browser used for automation.

**Optional**: Install all browsers (Chromium, Firefox, WebKit):
```bash
playwright install
```

#### 5. Create Configuration File

Copy the example configuration file:

```bash
cp config.ini.example config.ini
```

Edit `config.ini` with your 23andMe credentials:

```ini
[23andme]
email = your_email@example.com
password = your_password_here

[scraper]
delay = 2
max_matches = 0
output_dir = output
```

**⚠️ Security Warning**: Never commit `config.ini` to version control. It's already in `.gitignore`.

## Running Locally

### Basic Execution

Run the scraper with default settings:

```bash
python dna_scraper.py
```

### Execution with Virtual Environment

If using a virtual environment, ensure it's activated first:

```bash
# Activate virtual environment
source venv/bin/activate  # macOS/Linux
# or
venv\Scripts\activate     # Windows

# Run scraper
python dna_scraper.py

# Deactivate when done
deactivate
```

### Configuration Options

Modify `config.ini` to customize behavior:

#### Limit Number of Matches

Process only the first 10 matches:
```ini
[scraper]
max_matches = 10
```

#### Increase Delay Between Requests

For slower networks or to be more conservative:
```ini
[scraper]
delay = 5
```

#### Change Output Directory

```ini
[scraper]
output_dir = my_dna_data
```

### Example Output

When running successfully, you'll see output like:

```
2024-01-18 10:30:00 - INFO - Starting browser...
2024-01-18 10:30:02 - INFO - Browser started successfully
2024-01-18 10:30:02 - INFO - Logging in to 23andMe...
2024-01-18 10:30:05 - INFO - Login successful
2024-01-18 10:30:05 - INFO - Navigating to DNA Relatives page...
2024-01-18 10:30:08 - INFO - Successfully navigated to DNA Relatives page
2024-01-18 10:30:08 - INFO - Scraping all DNA matches...
2024-01-18 10:30:15 - INFO - Found 150 matches
2024-01-18 10:30:15 - INFO - Successfully scraped 150 matches
2024-01-18 10:30:15 - INFO - Saving 150 matches to output/all_dna_matches.csv
2024-01-18 10:30:15 - INFO - Successfully saved matches to output/all_dna_matches.csv
2024-01-18 10:30:15 - INFO - Processing match 1/150
2024-01-18 10:30:15 - INFO - Scraping relatives in common for John Smith...
...
```

## Testing

### Current Test Status

**Note**: This project currently does not have a formal test suite. Testing is performed manually.

### Manual Testing

#### Test 1: Configuration Loading

```bash
# Remove config.ini temporarily
mv config.ini config.ini.backup

# Run scraper (should fail with clear error message)
python dna_scraper.py

# Restore config
mv config.ini.backup config.ini
```

Expected output:
```
ERROR - Configuration file config.ini not found!
INFO - Please create config.ini from config.ini.example
```

#### Test 2: Invalid Credentials

Edit `config.ini` with invalid credentials and run:

```bash
python dna_scraper.py
```

Expected: Login failure with timeout or authentication error.

#### Test 3: Example Output Generation

Test CSV generation without scraping:

```bash
python create_example_output.py
```

Expected output:
```
Created: output/all_dna_matches.csv
Created: output/relatives_in_common_John_Smith_match_1.csv
Created: output/relatives_in_common_Jane_Doe_match_2.csv

Example CSV files created successfully!
```

Verify files exist:
```bash
ls -la output/
```

#### Test 4: Limited Scraping

Set `max_matches = 1` in `config.ini` and run:

```bash
python dna_scraper.py
```

Expected: Only process first match and its relatives.

### Adding Tests (Future)

To add a proper test suite, consider:

#### Install Test Dependencies

```bash
pip install pytest pytest-cov pytest-mock
```

#### Create Test Structure

```
tests/
├── __init__.py
├── test_scraper.py
├── test_config.py
└── fixtures/
    └── sample_config.ini
```

#### Example Test (test_config.py)

```python
import pytest
from dna_scraper import load_config

def test_load_config_file_not_found():
    with pytest.raises(FileNotFoundError):
        load_config("nonexistent.ini")

def test_load_config_success():
    config = load_config("config.ini.example")
    assert config.has_section('23andme')
    assert config.has_section('scraper')
```

#### Run Tests

```bash
pytest tests/
```

## Linting and Code Quality

### Install Development Tools

```bash
pip install flake8 black pylint mypy
```

### Code Formatting with Black

Format all Python files:

```bash
black dna_scraper.py create_example_output.py
```

Check without modifying:

```bash
black --check dna_scraper.py
```

### Linting with Flake8

Check code style:

```bash
flake8 dna_scraper.py --max-line-length=100
```

### Type Checking with MyPy

Check type hints:

```bash
mypy dna_scraper.py
```

### Static Analysis with Pylint

```bash
pylint dna_scraper.py
```

## Debugging

### Verbose Logging

Modify logging level in `dna_scraper.py`:

```python
logging.basicConfig(
    level=logging.DEBUG,  # Changed from INFO
    format='%(asctime)s - %(levelname)s - %(message)s'
)
```

### Headful Browser Mode

For visual debugging, run browser in headful mode:

Edit `dna_scraper.py`, line 52:

```python
self.browser = self.playwright.chromium.launch(headless=False)  # Changed from True
```

Now you can see the browser window during execution.

### Slow Down Execution

Increase delay for easier observation:

```ini
[scraper]
delay = 10  # Wait 10 seconds between operations
```

### Python Debugger

Add breakpoints in code:

```python
import pdb

def scrape_all_matches(self):
    logger.info("Scraping all DNA matches...")
    pdb.set_trace()  # Debugger will pause here
    matches = []
    # ...
```

Run and interact with debugger:
```bash
python dna_scraper.py
```

Common pdb commands:
- `n` - Next line
- `c` - Continue
- `l` - List code
- `p variable` - Print variable
- `q` - Quit

### VS Code Debugging

Create `.vscode/launch.json`:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Python: DNA Scraper",
            "type": "python",
            "request": "launch",
            "program": "${workspaceFolder}/dna_scraper.py",
            "console": "integratedTerminal"
        }
    ]
}
```

Press F5 to start debugging with breakpoints.

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/my-new-feature
```

### 2. Make Changes

Edit code, add features, fix bugs.

### 3. Test Changes

```bash
# Run the scraper with test configuration
python dna_scraper.py

# Run example output generator
python create_example_output.py

# Run linter
flake8 dna_scraper.py
```

### 4. Commit Changes

```bash
git add dna_scraper.py
git commit -m "Add feature: description of changes"
```

### 5. Push to GitHub

```bash
git push origin feature/my-new-feature
```

### 6. Create Pull Request

Go to GitHub and create a pull request from your branch.

## Common Development Tasks

### Update Dependencies

```bash
# Update requirements.txt after adding packages
pip freeze > requirements.txt

# Update a specific package
pip install --upgrade playwright
pip freeze > requirements.txt
```

### Clean Output Directory

```bash
rm -rf output/
mkdir output
```

Or on Windows:
```bash
rmdir /s /q output
mkdir output
```

### Check for Security Issues

```bash
pip install safety
safety check
```

### Profile Performance

```bash
python -m cProfile -o profile.stats dna_scraper.py
```

View results:
```bash
python -m pstats profile.stats
```

## Environment Variables (Alternative to config.ini)

For CI/CD or cloud deployment, use environment variables:

```python
# Add to dna_scraper.py
import os

email = os.getenv('TWENTYTHREEANDME_EMAIL', config.get('23andme', 'email'))
password = os.getenv('TWENTYTHREEANDME_PASSWORD', config.get('23andme', 'password'))
```

Usage:
```bash
export TWENTYTHREEANDME_EMAIL="user@example.com"
export TWENTYTHREEANDME_PASSWORD="secret"
python dna_scraper.py
```

## Troubleshooting

### Issue: Playwright not found

**Solution**:
```bash
pip install playwright
playwright install
```

### Issue: Permission denied on output directory

**Solution**:
```bash
chmod 755 output/
```

### Issue: Python version too old

**Solution**: Install Python 3.8 or higher from python.org

### Issue: Module not found errors

**Solution**: Ensure virtual environment is activated and dependencies are installed:
```bash
source venv/bin/activate
pip install -r requirements.txt
```

### Issue: Browser crashes

**Solutions**:
- Increase system memory
- Run in headless mode
- Update Playwright: `pip install --upgrade playwright`
- Reinstall browsers: `playwright install --force`

## Performance Optimization Tips

1. **Use max_matches for testing**: Don't scrape all matches during development
2. **Reduce delay**: Use `delay = 1` for faster development cycles (but respect rate limits in production)
3. **Use headless mode**: Faster than headful mode
4. **Process in batches**: For large datasets, scrape in multiple sessions

## Code Style Guidelines

Follow PEP 8 Python style guidelines:

- **Indentation**: 4 spaces
- **Line length**: Max 100 characters
- **Imports**: Group standard library, third-party, local
- **Naming**:
  - Classes: `PascalCase`
  - Functions/methods: `snake_case`
  - Constants: `UPPER_CASE`
- **Docstrings**: Use for all classes and public methods
- **Type hints**: Use for function parameters and return values

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request with clear description

## Additional Resources

- [Playwright Python Docs](https://playwright.dev/python/)
- [Python ConfigParser](https://docs.python.org/3/library/configparser.html)
- [Python CSV Module](https://docs.python.org/3/library/csv.html)
- [PEP 8 Style Guide](https://www.python.org/dev/peps/pep-0008/)
