# 🛠️ Development Guide - Next Investment Platform

## Document Information
- **Version**: 1.0.0
- **Last Updated**: January 2026
- **Status**: Active Development

## Table of Contents
1. [Development Environment Setup](#development-environment-setup)
2. [Running Locally](#running-locally)
3. [Testing Guide](#testing-guide)
4. [Code Quality & Linting](#code-quality--linting)
5. [Debugging](#debugging)
6. [Development Workflow](#development-workflow)
7. [Troubleshooting](#troubleshooting)

---

## 1. Development Environment Setup

### 1.1 Prerequisites

```bash
# Required Software
- Python 3.8 or higher
- pip (Python package manager)
- Git
- PostgreSQL 13+ (optional for local database)
- Modern web browser (Chrome, Firefox, Safari, Edge)

# Optional Software
- Python virtual environment (venv or conda)
- Docker (for containerized database)
- VS Code or PyCharm (recommended IDEs)
```

### 1.2 Initial Setup

#### Step 1: Clone the Repository

```bash
# Clone from GitHub
git clone https://github.com/mwinfiel0331/nextinvestment.git
cd nextinvestment

# Verify you're in the correct directory
ls -la
# You should see: app.py, requirements.txt, README.md, etc.
```

#### Step 2: Create Virtual Environment (Recommended)

```bash
# Using venv (Python built-in)
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate

# Verify activation (you should see (venv) in your prompt)
which python  # Should point to venv/bin/python
```

#### Step 3: Install Dependencies

```bash
# Option 1: Full features (includes PyTorch/FinBERT - ~2.5GB)
pip install -r requirements.txt

# Option 2: Local development without PyTorch (recommended for development)
pip install -r requirements-local.txt

# Option 3: Minimal installation (lightweight)
pip install -r requirements-railway-simple.txt

# Verify installation
python -c "import streamlit; print(f'Streamlit {streamlit.__version__} installed')"
python -c "import yfinance; print('yfinance installed')"
```

#### Step 4: Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit .env file with your settings
# On macOS/Linux:
nano .env

# On Windows:
notepad .env
```

**Minimal .env Configuration**:
```env
# Required for app to run (optional features)
FINNHUB_API_KEY=your_finnhub_key_here
POLYGON_API_KEY=your_polygon_key_here

# Optional: Database URL (leave empty to run without database)
DATABASE_URL=

# Application settings
DEBUG=True
SECRET_KEY=dev_secret_key_change_in_production
STREAMLIT_SERVER_FILE_WATCHER_TYPE=none
```

**Note**: The app will work with Yahoo Finance data only if API keys are not provided.

#### Step 5: Set Up PostgreSQL (Optional)

```bash
# Option 1: Local PostgreSQL installation
# Install PostgreSQL from https://www.postgresql.org/download/

# Create database and user
psql postgres
CREATE DATABASE nextinvestment;
CREATE USER nextinvestment_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE nextinvestment TO nextinvestment_user;
\q

# Update .env file
DATABASE_URL=postgresql://nextinvestment_user:your_password@localhost:5432/nextinvestment

# Option 2: Docker PostgreSQL
docker run -d \
  --name nextinvestment-postgres \
  -e POSTGRES_DB=nextinvestment \
  -e POSTGRES_USER=nextinvestment_user \
  -e POSTGRES_PASSWORD=your_password \
  -p 5432:5432 \
  postgres:13

# Update .env file
DATABASE_URL=postgresql://nextinvestment_user:your_password@localhost:5432/nextinvestment
```

#### Step 6: Initialize Database (If Using PostgreSQL)

```python
# Run Python to initialize schema
python3 << EOF
from data.database import DatabaseManager
db = DatabaseManager()
db.create_tables()
print("✅ Database initialized successfully!")
EOF
```

### 1.3 API Keys Setup

#### Finnhub API Key (Free Tier)

```bash
# 1. Visit https://finnhub.io
# 2. Sign up for free account
# 3. Get API key from dashboard (60 requests/minute)
# 4. Add to .env file:
FINNHUB_API_KEY=your_actual_key_here
```

#### Polygon.io API Key (Optional)

```bash
# 1. Visit https://polygon.io
# 2. Sign up for account
# 3. Free tier: 5 requests/minute
# 4. Add to .env file:
POLYGON_API_KEY=your_actual_key_here
```

**Note**: Yahoo Finance requires no API key.

### 1.4 Verify Installation

```bash
# Run verification script
python3 << EOF
from data.ingestion import DataIngestion
from config.settings import settings

print("🔍 Checking installation...")
print(f"✅ Python modules imported successfully")

# Check API configuration
api_status = settings.get_api_status()
for api, configured in api_status.items():
    status = "✅" if configured else "❌"
    print(f"{status} {api.upper()}: {'Configured' if configured else 'Not configured'}")

print("\n✅ Installation verified!")
EOF
```

---

## 2. Running Locally

### 2.1 Quick Start

```bash
# Simplest way to run
streamlit run app.py

# With recommended settings
streamlit run app.py --server.fileWatcherType=none

# With custom port
streamlit run app.py --server.port=8502

# The app will automatically open in your browser at:
# http://localhost:8501
```

### 2.2 Using the Run Script

```bash
# Use the provided run.py script
python run.py

# This will:
# - Check requirements
# - Verify API configuration
# - Start the Streamlit app
# - Open in default browser
```

### 2.3 Advanced Run Options

```bash
# Run with verbose logging
streamlit run app.py --logger.level=debug

# Run without auto-opening browser
streamlit run app.py --server.headless=true

# Run with custom host (for network access)
streamlit run app.py --server.address=0.0.0.0

# Disable file watcher (recommended for development)
streamlit run app.py --server.fileWatcherType=none

# Combined options
streamlit run app.py \
  --server.port=8501 \
  --server.headless=false \
  --server.fileWatcherType=none \
  --logger.level=info
```

### 2.4 Development Mode

```bash
# Enable debug mode in .env
DEBUG=True

# Run with auto-reload on code changes
streamlit run app.py --server.runOnSave=true

# View detailed error messages
# Errors will be shown in the browser with full stack traces
```

### 2.5 Testing Data Sources

```bash
# Test all data source connections
python test_polygon.py

# Expected output:
# 🚀 Testing Next Investment Data Sources
# ==================================================
# 📊 API Configuration Status:
#   ✅ Finnhub: Configured
#   ✅ Polygon: Configured
# 
# 🔍 Testing data for AAPL...
# 1️⃣ Testing Yahoo Finance...
#    ✅ Yahoo Finance: Latest price $182.52
# 2️⃣ Testing Polygon.io...
#    ✅ Polygon.io: Latest price $182.50
# 3️⃣ Testing Fallback System...
#    ✅ Fallback system used: Yahoo Finance
#    💰 Latest price: $182.52
```

---

## 3. Testing Guide

### 3.1 Testing Overview

The Next Investment platform includes multiple levels of testing:

1. **Integration Tests**: API connectivity and data fetching
2. **Unit Tests**: Individual component testing
3. **Manual Tests**: UI/UX and end-to-end workflows

### 3.2 Running Integration Tests

#### Test Data Sources

```bash
# Test all data source integrations
python test_polygon.py

# Expected behaviors:
# ✅ Yahoo Finance should always work (no API key)
# ✅ Polygon.io works if API key configured
# ✅ Finnhub works if API key configured
# ✅ Failover system switches to backup sources
```

#### Test Database Connection

```python
# test_database.py
from data.database import DatabaseManager

def test_database_connection():
    """Test PostgreSQL database connection"""
    try:
        db = DatabaseManager()
        print("✅ Database connection successful")
        
        # Test table creation
        db.create_tables()
        print("✅ Database tables created")
        
        # Test cache operations
        test_data = {
            "symbol": "TEST",
            "price": 100.00,
            "data": {"test": True}
        }
        db.cache_stock_data("TEST", test_data)
        print("✅ Cache write successful")
        
        cached = db.get_stock_data("TEST", max_age_minutes=60)
        assert cached is not None
        print("✅ Cache read successful")
        
        print("\n✅ All database tests passed!")
        
    except Exception as e:
        print(f"❌ Database test failed: {e}")

if __name__ == "__main__":
    test_database_connection()
```

```bash
# Run database tests
python test_database.py
```

### 3.3 Unit Testing

#### Create Unit Tests

```python
# tests/test_scoring.py
import unittest
from analysis.scoring import StockScorer
from models.stock import Fundamentals

class TestStockScorer(unittest.TestCase):
    
    def setUp(self):
        """Set up test fixtures"""
        self.scorer = StockScorer(use_finbert=False)
    
    def test_valuation_score_calculation(self):
        """Test valuation score calculation"""
        fundamentals = Fundamentals(
            pe_ratio=15.0,
            pb_ratio=3.0,
            ps_ratio=2.0,
            peg_ratio=1.5
        )
        
        score = self.scorer._calculate_valuation_score(fundamentals)
        
        self.assertIsNotNone(score)
        self.assertGreaterEqual(score, 0)
        self.assertLessEqual(score, 100)
    
    def test_total_score_range(self):
        """Test that total score is between 0 and 100"""
        # Create test data with all fields
        test_data = {
            "fundamentals": Fundamentals(
                pe_ratio=20.0,
                roe=0.15,
                debt_to_equity=0.5,
                revenue_growth=0.10
            )
        }
        
        score = self.scorer.calculate_total_score(test_data)
        
        self.assertGreaterEqual(score, 0)
        self.assertLessEqual(score, 100)
    
    def test_recommendation_mapping(self):
        """Test score to recommendation mapping"""
        test_cases = [
            (95, "STRONG BUY"),
            (75, "BUY"),
            (55, "HOLD"),
            (35, "SELL"),
            (15, "STRONG SELL")
        ]
        
        for score, expected_rec in test_cases:
            recommendation = self.scorer._get_recommendation(score)
            self.assertEqual(recommendation, expected_rec)

if __name__ == '__main__':
    unittest.main()
```

```bash
# Run unit tests
python -m unittest tests/test_scoring.py

# Run all tests in tests directory
python -m unittest discover tests/

# Run with verbose output
python -m unittest discover tests/ -v
```

#### Test Data Ingestion

```python
# tests/test_ingestion.py
import unittest
from data.ingestion import DataIngestion

class TestDataIngestion(unittest.TestCase):
    
    def setUp(self):
        """Set up test fixtures"""
        self.ingestion = DataIngestion()
    
    def test_yahoo_finance_data_fetch(self):
        """Test Yahoo Finance data fetching"""
        data = self.ingestion.get_yahoo_finance_data("AAPL", period="1mo")
        
        self.assertIsNotNone(data)
        self.assertIn("price_history", data)
        self.assertIn("Close", data["price_history"])
    
    def test_symbol_validation(self):
        """Test invalid symbol handling"""
        data = self.ingestion.get_complete_stock_data("INVALID_SYMBOL_123")
        
        # Should return None or raise appropriate exception
        self.assertIsNone(data)
    
    def test_data_normalization(self):
        """Test data normalization across sources"""
        yahoo_data = self.ingestion.get_yahoo_finance_data("AAPL")
        normalized = self.ingestion._normalize_data(yahoo_data, "yahoo_finance")
        
        # Check required fields exist
        required_fields = ["symbol", "current_price", "price_history"]
        for field in required_fields:
            self.assertIn(field, normalized)

if __name__ == '__main__':
    unittest.main()
```

### 3.4 Manual Testing Checklist

#### Basic Functionality Tests

```
Stock Analysis:
□ Enter valid stock symbol (e.g., AAPL)
□ Verify current price displays
□ Check price chart renders
□ Confirm investment score shows (0-100)
□ Verify recommendation appears
□ Check score breakdown radar chart
□ Confirm news section displays (if Finnhub configured)

Portfolio Comparison:
□ Enter multiple symbols (AAPL,GOOGL,MSFT)
□ Verify all stocks load
□ Check side-by-side comparison
□ Confirm ranking by score
□ Verify comparison charts render

Watchlist:
□ Add stock to watchlist
□ Verify stock appears in list
□ Remove stock from watchlist
□ Confirm removal

Market Overview:
□ Check top gainers display
□ Verify sector breakdown
□ Confirm market trends load
```

#### Error Handling Tests

```
Invalid Inputs:
□ Enter invalid symbol (e.g., "INVALID123")
□ Enter empty symbol
□ Enter special characters
□ Enter lowercase symbols
□ Expected: Graceful error messages

API Failures:
□ Disable internet connection temporarily
□ Expected: Fallback to cache or error message
□ Re-enable connection, verify recovery

Database Tests (if using PostgreSQL):
□ Stop database service
□ Expected: App continues with API-only mode
□ Restart database, verify reconnection
```

### 3.5 Performance Testing

```bash
# Test application startup time
time streamlit run app.py --server.headless=true &
# Should start in < 5 seconds

# Test data fetch performance
python3 << EOF
import time
from data.ingestion import DataIngestion

di = DataIngestion()

# Test Yahoo Finance speed
start = time.time()
data = di.get_yahoo_finance_data("AAPL")
yahoo_time = time.time() - start
print(f"Yahoo Finance fetch: {yahoo_time:.2f}s")

# Test cache performance
start = time.time()
data = di.get_complete_stock_data("AAPL")
first_fetch = time.time() - start
print(f"First fetch (no cache): {first_fetch:.2f}s")

start = time.time()
data = di.get_complete_stock_data("AAPL")
cached_fetch = time.time() - start
print(f"Cached fetch: {cached_fetch:.2f}s")

print(f"\n✅ Cache speedup: {first_fetch/cached_fetch:.1f}x faster")
EOF
```

---

## 4. Code Quality & Linting

### 4.1 Code Style (PEP 8)

```bash
# Install linting tools (optional, not in requirements)
pip install flake8 black isort

# Run flake8 linter
flake8 app.py data/ analysis/ models/

# Format code with black
black app.py data/ analysis/ models/

# Sort imports with isort
isort app.py data/ analysis/ models/

# Check type hints
pip install mypy
mypy app.py --ignore-missing-imports
```

### 4.2 Code Quality Standards

```python
# Example: Good code style

def calculate_investment_score(
    fundamentals: Fundamentals, 
    price_history: PriceHistory
) -> InvestmentScore:
    """
    Calculate comprehensive investment score for a stock.
    
    Args:
        fundamentals: Stock fundamental data
        price_history: Historical price data
    
    Returns:
        InvestmentScore with total score and breakdown
    
    Raises:
        ValueError: If fundamentals are invalid
    """
    # Validate inputs
    if not fundamentals or not price_history:
        raise ValueError("Missing required data")
    
    # Calculate component scores
    valuation_score = _calculate_valuation_score(fundamentals)
    growth_score = _calculate_growth_score(fundamentals)
    profitability_score = _calculate_profitability_score(fundamentals)
    health_score = _calculate_financial_health_score(fundamentals)
    sentiment_score = _calculate_sentiment_score(price_history)
    
    # Aggregate with weights
    total_score = (
        valuation_score * 0.25 +
        growth_score * 0.25 +
        profitability_score * 0.20 +
        health_score * 0.15 +
        sentiment_score * 0.15
    )
    
    # Generate recommendation
    recommendation = _get_recommendation(total_score)
    confidence = _get_confidence_level(fundamentals)
    
    return InvestmentScore(
        total_score=total_score,
        valuation=valuation_score,
        growth=growth_score,
        profitability=profitability_score,
        financial_health=health_score,
        sentiment=sentiment_score,
        recommendation=recommendation,
        confidence=confidence
    )
```

### 4.3 Pre-commit Hooks (Optional)

```bash
# Install pre-commit
pip install pre-commit

# Create .pre-commit-config.yaml
cat > .pre-commit-config.yaml << EOF
repos:
  - repo: https://github.com/psf/black
    rev: 23.3.0
    hooks:
      - id: black
        language_version: python3.8

  - repo: https://github.com/pycqa/isort
    rev: 5.12.0
    hooks:
      - id: isort

  - repo: https://github.com/pycqa/flake8
    rev: 6.0.0
    hooks:
      - id: flake8
        args: ['--max-line-length=100', '--ignore=E203,W503']
EOF

# Install hooks
pre-commit install

# Run manually
pre-commit run --all-files
```

---

## 5. Debugging

### 5.1 Enable Debug Mode

```bash
# In .env file
DEBUG=True

# Run with debug logging
streamlit run app.py --logger.level=debug
```

### 5.2 Debugging in VS Code

```json
// .vscode/launch.json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Streamlit",
            "type": "python",
            "request": "launch",
            "module": "streamlit",
            "args": [
                "run",
                "app.py",
                "--server.fileWatcherType=none"
            ],
            "console": "integratedTerminal",
            "justMyCode": true
        }
    ]
}
```

### 5.3 Common Debugging Techniques

```python
# Add debug prints
import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def fetch_stock_data(symbol: str):
    logger.debug(f"Fetching data for symbol: {symbol}")
    
    try:
        data = api_call(symbol)
        logger.debug(f"Received data: {data}")
        return data
    except Exception as e:
        logger.error(f"Error fetching data: {e}", exc_info=True)
        raise

# Use Streamlit debugging
import streamlit as st

st.write("Debug info:", {
    "symbol": symbol,
    "data_available": data is not None,
    "data_fields": list(data.keys()) if data else None
})

# Inspect variables
import pdb; pdb.set_trace()  # Python debugger breakpoint
```

---

## 6. Development Workflow

### 6.1 Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: Add new feature"

# Push to GitHub
git push origin feature/new-feature

# Create pull request on GitHub
```

### 6.2 Development Cycle

```
1. Create feature branch
2. Make code changes
3. Test locally (manual + automated)
4. Run linters and formatters
5. Commit changes
6. Push to GitHub
7. Create pull request
8. Review and merge
9. Deploy to production
```

### 6.3 Code Review Checklist

```
Before Submitting PR:
□ Code follows PEP 8 style guide
□ All functions have docstrings
□ Type hints added for function parameters
□ Unit tests added/updated
□ Manual testing completed
□ No debug print statements left in code
□ Error handling implemented
□ Documentation updated
□ Commit messages are clear
□ No secrets or API keys in code
```

---

## 7. Troubleshooting

### 7.1 Common Issues

#### Issue: Module Not Found

```bash
# Error: ModuleNotFoundError: No module named 'streamlit'
# Solution:
pip install -r requirements.txt

# Verify virtual environment is activated
which python  # Should point to venv
```

#### Issue: PyTorch/Streamlit Compatibility

```bash
# Error: Warnings about torch module
# Solution 1: Use requirements-local.txt
pip uninstall torch transformers
pip install -r requirements-local.txt

# Solution 2: Disable file watcher
streamlit run app.py --server.fileWatcherType=none
```

#### Issue: Database Connection Failed

```bash
# Error: Could not connect to PostgreSQL
# Solution: Check DATABASE_URL is correct
echo $DATABASE_URL

# Test PostgreSQL is running
psql -U nextinvestment_user -d nextinvestment -c "SELECT 1"

# Or run without database
# Comment out DATABASE_URL in .env
```

#### Issue: API Rate Limit Exceeded

```bash
# Error: 429 Too Many Requests
# Solution: Wait for rate limit reset or use cache
# Finnhub: 60 req/min
# Polygon: 5 req/min (free tier)

# Check cache is working
python3 << EOF
from data.database import DatabaseManager
db = DatabaseManager()
cached = db.get_stock_data("AAPL", max_age_minutes=60)
print(f"Cache hit: {cached is not None}")
EOF
```

### 7.2 Performance Issues

```bash
# Slow startup
# - Use requirements-local.txt instead of requirements.txt
# - Disable file watcher: --server.fileWatcherType=none

# Slow data fetching
# - Check internet connection
# - Verify API keys are configured
# - Check database cache is working

# Memory issues
# - Don't use requirements.txt (PyTorch is large)
# - Use requirements-local.txt or requirements-railway-simple.txt
```

### 7.3 Getting Help

```bash
# Check logs
# Streamlit logs are shown in terminal where app is running

# Enable verbose logging
streamlit run app.py --logger.level=debug

# Check Python errors
python app.py  # Will show import errors

# Verify installation
pip list | grep streamlit
pip list | grep yfinance
```

---

**Document Control**:
- Created: January 2026
- Owner: Next Investment Team
- Review Cycle: Quarterly
- Next Review: April 2026
