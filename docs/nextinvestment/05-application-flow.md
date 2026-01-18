# 🔄 Application Flow - Next Investment Platform

## Document Information
- **Version**: 1.0.0
- **Last Updated**: January 2026
- **Status**: Current Production Flow

## Table of Contents
1. [User Journey Flows](#user-journey-flows)
2. [Stock Analysis Flow](#stock-analysis-flow)
3. [Portfolio Comparison Flow](#portfolio-comparison-flow)
4. [Watchlist Management Flow](#watchlist-management-flow)
5. [Data Processing Flow](#data-processing-flow)
6. [Subprocess Execution](#subprocess-execution)
7. [Error Handling Flow](#error-handling-flow)
8. [Caching Strategy Flow](#caching-strategy-flow)

---

## 1. User Journey Flows

### 1.1 Main Application Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    USER ENTRY POINT                           │
│                  https://nextinvestment.ai                    │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│                 APPLICATION INITIALIZATION                    │
│  • Load environment variables                                │
│  • Initialize database connection                            │
│  • Set up API clients                                        │
│  • Configure Streamlit page                                  │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│                   NAVIGATION SIDEBAR                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Options:                                               │ │
│  │  1. 📈 Stock Analysis                                  │ │
│  │  2. 📊 Portfolio Comparison                            │ │
│  │  3. ⭐ Watchlist Management                            │ │
│  │  4. 🌐 Market Overview                                 │ │
│  │  5. ⚙️ Settings                                        │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
         ↓          ↓          ↓          ↓          ↓
    Analysis   Comparison  Watchlist   Market    Settings
      Flow        Flow       Flow      Overview    Flow
```

### 1.2 Page Selection Flow

```python
# app.py main navigation
def main():
    """Main application entry point"""
    
    # Initialize components
    data_ingestion, db_manager, scorer, visualizer = initialize_components()
    
    # Sidebar navigation
    st.sidebar.title("📈 Next Investment")
    page = st.sidebar.radio(
        "Navigate to:",
        ["Stock Analysis", "Portfolio Comparison", "Watchlist", "Market Overview"]
    )
    
    # Route to appropriate page
    if page == "Stock Analysis":
        render_stock_analysis_page(data_ingestion, db_manager, scorer, visualizer)
    elif page == "Portfolio Comparison":
        render_portfolio_comparison_page(data_ingestion, scorer, visualizer)
    elif page == "Watchlist":
        render_watchlist_page(db_manager, data_ingestion, scorer)
    elif page == "Market Overview":
        render_market_overview_page(data_ingestion, scorer, visualizer)
```

---

## 2. Stock Analysis Flow

### 2.1 Stock Analysis Process Flow

```
┌──────────────────────────────────────────────────────────────┐
│               STOCK ANALYSIS WORKFLOW                         │
└──────────────────────────────────────────────────────────────┘

User enters stock symbol
        ↓
┌─────────────────────────┐
│ Input Validation        │
│ • Check format (A-Z)    │
│ • Convert to uppercase  │
│ • Trim whitespace       │
└─────────────────────────┘
        ↓
     Valid?
    ╱      ╲
  Yes       No → Display error message
   ↓
┌─────────────────────────┐
│ Show Loading State      │
│ • "Fetching data..."    │
│ • Loading spinner       │
└─────────────────────────┘
        ↓
┌─────────────────────────┐
│ Data Fetching           │
│ • Check cache first     │
│ • Fetch from APIs       │
│ • Normalize data        │
└─────────────────────────┘
        ↓
   Data Found?
    ╱      ╲
  Yes       No → Display "Stock not found"
   ↓
┌─────────────────────────┐
│ Calculate Score         │
│ • Valuation score       │
│ • Growth score          │
│ • Profitability score   │
│ • Financial health      │
│ • Sentiment score       │
└─────────────────────────┘
        ↓
┌─────────────────────────┐
│ Generate Visualizations │
│ • Price chart           │
│ • Score radar chart     │
│ • Metrics table         │
│ • News cards            │
└─────────────────────────┘
        ↓
┌─────────────────────────┐
│ Display Results         │
│ • Stock header          │
│ • Investment score      │
│ • Recommendation        │
│ • Charts & metrics      │
│ • News & sentiment      │
└─────────────────────────┘
        ↓
┌─────────────────────────┐
│ User Actions            │
│ • Add to watchlist      │
│ • Compare with others   │
│ • View detailed metrics │
│ • Refresh data          │
└─────────────────────────┘
```

### 2.2 Stock Analysis Code Flow

```python
# app.py - Stock Analysis Page
def render_stock_analysis_page(data_ingestion, db_manager, scorer, visualizer):
    """
    Render stock analysis page.
    
    Flow:
    1. User Input
    2. Data Fetching
    3. Score Calculation
    4. Visualization
    5. Display Results
    """
    
    # Step 1: User Input
    st.header("📈 Stock Analysis")
    symbol = st.text_input(
        "Enter Stock Symbol",
        placeholder="e.g., AAPL, GOOGL, MSFT",
        key="stock_symbol_input"
    ).upper().strip()
    
    if not symbol:
        st.info("👆 Enter a stock symbol to begin analysis")
        return
    
    # Step 2: Validate Input
    if not validate_symbol(symbol):
        st.error("❌ Invalid stock symbol format")
        return
    
    # Step 3: Fetch Data with Loading State
    with st.spinner(f"Fetching data for {symbol}..."):
        stock_data = load_stock_data(symbol)  # Cached function
    
    # Step 4: Check Data Availability
    if not stock_data:
        st.error(f"❌ No data found for {symbol}")
        st.info("Please check the symbol and try again")
        return
    
    # Step 5: Calculate Investment Score
    with st.spinner("Calculating investment score..."):
        score = scorer.calculate_total_score(stock_data)
    
    # Step 6: Display Stock Header
    display_stock_header(stock_data, score)
    
    # Step 7: Create Layout Columns
    col1, col2 = st.columns([2, 1])
    
    with col1:
        # Step 8: Display Price Chart
        st.subheader("📊 Price History")
        chart = visualizer.create_candlestick_chart(
            stock_data['price_history'], 
            symbol
        )
        st.plotly_chart(chart, use_container_width=True)
    
    with col2:
        # Step 9: Display Score Breakdown
        st.subheader("🎯 Investment Score")
        radar_chart = visualizer.create_score_radar_chart(score)
        st.plotly_chart(radar_chart, use_container_width=True)
    
    # Step 10: Display Metrics
    display_key_metrics(stock_data)
    
    # Step 11: Display News & Sentiment
    display_news_section(stock_data)
    
    # Step 12: Action Buttons
    display_action_buttons(symbol, db_manager)
```

---

## 3. Portfolio Comparison Flow

### 3.1 Portfolio Comparison Workflow

```
User enters comma-separated symbols
        ↓
┌─────────────────────────┐
│ Parse Input             │
│ • Split by comma        │
│ • Trim each symbol      │
│ • Convert to uppercase  │
│ • Validate count (≤10)  │
└─────────────────────────┘
        ↓
┌─────────────────────────┐
│ Parallel Data Fetch     │
│ ┌─────┬─────┬─────┐    │
│ │AAPL │GOOGL│MSFT │    │
│ └─────┴─────┴─────┘    │
│ • Fetch concurrently    │
│ • Handle failures       │
└─────────────────────────┘
        ↓
┌─────────────────────────┐
│ Calculate Scores        │
│ • Score each stock      │
│ • Collect metrics       │
│ • Rank by score         │
└─────────────────────────┘
        ↓
┌─────────────────────────┐
│ Generate Comparisons    │
│ • Side-by-side table    │
│ • Comparison bar chart  │
│ • Rankings              │
│ • Recommendations       │
└─────────────────────────┘
        ↓
┌─────────────────────────┐
│ Display Results         │
│ • Comparison table      │
│ • Visual charts         │
│ • Best pick highlight   │
│ • Detailed breakdown    │
└─────────────────────────┘
```

### 3.2 Parallel Data Fetching

```python
def fetch_multiple_stocks(symbols: List[str]) -> Dict[str, dict]:
    """
    Fetch data for multiple stocks in parallel.
    
    Flow:
    1. Validate symbols
    2. Create tasks for parallel execution
    3. Fetch data concurrently
    4. Aggregate results
    5. Handle failures gracefully
    """
    from concurrent.futures import ThreadPoolExecutor, as_completed
    
    results = {}
    failed = []
    
    # Create progress bar
    progress_bar = st.progress(0)
    status_text = st.empty()
    
    # Parallel fetching
    with ThreadPoolExecutor(max_workers=5) as executor:
        # Submit all tasks
        future_to_symbol = {
            executor.submit(load_stock_data, symbol): symbol 
            for symbol in symbols
        }
        
        # Process completed tasks
        completed = 0
        total = len(symbols)
        
        for future in as_completed(future_to_symbol):
            symbol = future_to_symbol[future]
            completed += 1
            
            try:
                data = future.result()
                if data:
                    results[symbol] = data
                else:
                    failed.append(symbol)
            except Exception as e:
                logger.error(f"Error fetching {symbol}: {e}")
                failed.append(symbol)
            
            # Update progress
            progress = completed / total
            progress_bar.progress(progress)
            status_text.text(f"Loaded {completed}/{total} stocks...")
    
    # Clear progress indicators
    progress_bar.empty()
    status_text.empty()
    
    # Report failures
    if failed:
        st.warning(f"⚠️ Could not load: {', '.join(failed)}")
    
    return results
```

---

## 4. Watchlist Management Flow

### 4.1 Watchlist Operations

```
┌──────────────────────────────────────────────────────────────┐
│                 WATCHLIST MANAGEMENT                          │
└──────────────────────────────────────────────────────────────┘

Load Watchlist
        ↓
┌─────────────────────────┐
│ Fetch from Database     │
│ • Query by user_id      │
│ • Get all symbols       │
│ • Order by added_at     │
└─────────────────────────┘
        ↓
┌─────────────────────────┐
│ Display Watchlist       │
│ • Show symbol           │
│ • Current price         │
│ • Daily change          │
│ • Quick actions         │
└─────────────────────────┘
        ↓
User Action?
    ╱   |   ╲
  Add  View  Remove
   ↓    ↓     ↓
  
Add Symbol:
┌─────────────────────────┐
│ 1. Validate symbol      │
│ 2. Check not duplicate  │
│ 3. Insert to database   │
│ 4. Refresh display      │
│ 5. Show confirmation    │
└─────────────────────────┘

View Details:
┌─────────────────────────┐
│ 1. Redirect to analysis │
│ 2. Load stock data      │
│ 3. Display full details │
└─────────────────────────┘

Remove Symbol:
┌─────────────────────────┐
│ 1. Confirm action       │
│ 2. Delete from database │
│ 3. Refresh display      │
│ 4. Show confirmation    │
└─────────────────────────┘
```

### 4.2 Watchlist Code Flow

```python
def render_watchlist_page(db_manager, data_ingestion, scorer):
    """
    Render watchlist management page.
    
    Flow:
    1. Load watchlist from database
    2. Fetch current data for symbols
    3. Display watchlist table
    4. Handle user actions (add/remove/view)
    """
    
    st.header("⭐ Watchlist")
    
    # Get user ID (from session or default)
    user_id = get_user_id()
    
    # Load watchlist
    watchlist = db_manager.get_watchlist(user_id)
    
    if not watchlist:
        st.info("Your watchlist is empty. Add stocks to get started!")
        display_add_to_watchlist_form(db_manager, user_id)
        return
    
    # Fetch current data for watchlist stocks
    with st.spinner("Loading watchlist data..."):
        watchlist_data = {}
        for item in watchlist:
            symbol = item['symbol']
            data = load_stock_data(symbol)
            if data:
                watchlist_data[symbol] = data
    
    # Display watchlist table
    st.subheader(f"📋 Your Watchlist ({len(watchlist_data)} stocks)")
    
    # Create table data
    table_data = []
    for symbol, data in watchlist_data.items():
        price_data = get_price_data(data)
        table_data.append({
            "Symbol": symbol,
            "Price": f"${price_data['current_price']:.2f}",
            "Change": f"{price_data['change_percent']:+.2f}%",
            "Score": f"{data.get('score', {}).get('total', 0):.1f}",
            "Recommendation": data.get('score', {}).get('recommendation', 'N/A')
        })
    
    # Display table
    df = pd.DataFrame(table_data)
    st.dataframe(df, use_container_width=True)
    
    # Action buttons for each stock
    for symbol in watchlist_data.keys():
        col1, col2, col3 = st.columns([3, 1, 1])
        with col1:
            st.write(f"**{symbol}**")
        with col2:
            if st.button("View Details", key=f"view_{symbol}"):
                st.session_state['selected_symbol'] = symbol
                st.rerun()
        with col3:
            if st.button("Remove", key=f"remove_{symbol}"):
                db_manager.remove_from_watchlist(user_id, symbol)
                st.success(f"Removed {symbol} from watchlist")
                st.rerun()
    
    # Add new stock section
    st.divider()
    display_add_to_watchlist_form(db_manager, user_id)
```

---

## 5. Data Processing Flow

### 5.1 Complete Data Pipeline

```
┌──────────────────────────────────────────────────────────────┐
│                  DATA PROCESSING PIPELINE                     │
└──────────────────────────────────────────────────────────────┘

User Request (symbol)
        ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 1: Cache Check                                    │
│  • Query PostgreSQL stock_cache                         │
│  • Check timestamp (< 60 min?)                          │
│  • Return if fresh                                      │
└─────────────────────────────────────────────────────────┘
        ↓ (if cache miss or stale)
┌─────────────────────────────────────────────────────────┐
│ Layer 2: Primary API (Yahoo Finance)                   │
│  • Fetch price data                                     │
│  • Get historical OHLCV                                 │
│  • Get company info                                     │
│  • Get dividends/splits                                 │
└─────────────────────────────────────────────────────────┘
        ↓ (if Yahoo fails)
┌─────────────────────────────────────────────────────────┐
│ Layer 3: Backup API (Polygon.io)                       │
│  • Fetch from Polygon                                   │
│  • Normalize to standard format                         │
│  • Log fallback event                                   │
└─────────────────────────────────────────────────────────┘
        ↓ (enhance with fundamentals)
┌─────────────────────────────────────────────────────────┐
│ Layer 4: Fundamentals API (Finnhub)                    │
│  • Company profile                                      │
│  • Financial metrics                                    │
│  • Recent news                                          │
│  • Analyst estimates                                    │
└─────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 5: Data Normalization                            │
│  • Standardize field names                              │
│  • Convert types                                        │
│  • Handle missing values                                │
│  • Validate integrity                                   │
└─────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 6: Data Enrichment                               │
│  • Calculate derived metrics                            │
│  • Add technical indicators                             │
│  • Compute growth rates                                 │
└─────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 7: Scoring                                        │
│  • Valuation analysis                                   │
│  • Growth analysis                                      │
│  • Profitability analysis                               │
│  • Financial health check                               │
│  • Sentiment analysis                                   │
│  • Aggregate scores                                     │
└─────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 8: Cache Update                                  │
│  • Store complete data in PostgreSQL                    │
│  • Update timestamp                                     │
│  • Commit transaction                                   │
└─────────────────────────────────────────────────────────┘
        ↓
Return Complete Stock Data
```

### 5.2 Data Transformation Steps

```python
class DataProcessor:
    """
    Process and transform stock data through pipeline.
    
    Pipeline stages:
    1. Fetch raw data
    2. Normalize formats
    3. Enrich with calculations
    4. Calculate scores
    5. Cache results
    """
    
    def process_stock_data(self, symbol: str) -> dict:
        """Execute complete data processing pipeline"""
        
        # Stage 1: Fetch raw data
        raw_data = self._fetch_raw_data(symbol)
        
        # Stage 2: Normalize
        normalized = self._normalize_data(raw_data)
        
        # Stage 3: Enrich
        enriched = self._enrich_data(normalized)
        
        # Stage 4: Score
        scored = self._calculate_scores(enriched)
        
        # Stage 5: Cache
        self._cache_data(symbol, scored)
        
        return scored
    
    def _fetch_raw_data(self, symbol: str) -> dict:
        """Fetch from APIs with failover"""
        # Try Yahoo Finance
        data = self.yahoo_client.get_data(symbol)
        if not data:
            # Fallback to Polygon
            data = self.polygon_client.get_data(symbol)
        
        # Enhance with Finnhub
        fundamentals = self.finnhub_client.get_fundamentals(symbol)
        data['fundamentals'] = fundamentals
        
        return data
    
    def _normalize_data(self, raw_data: dict) -> dict:
        """Standardize field names and formats"""
        return {
            'symbol': raw_data.get('symbol', '').upper(),
            'current_price': float(raw_data.get('price', 0)),
            'price_history': self._normalize_price_history(raw_data),
            'fundamentals': self._normalize_fundamentals(raw_data),
            # ... more fields
        }
    
    def _enrich_data(self, data: dict) -> dict:
        """Add calculated fields"""
        data['metrics'] = {
            'moving_average_50': self._calc_ma(data, 50),
            'moving_average_200': self._calc_ma(data, 200),
            'volatility': self._calc_volatility(data),
            'beta': self._calc_beta(data),
        }
        return data
    
    def _calculate_scores(self, data: dict) -> dict:
        """Calculate investment scores"""
        scorer = StockScorer()
        score = scorer.calculate_total_score(data)
        data['score'] = score.to_dict()
        return data
    
    def _cache_data(self, symbol: str, data: dict):
        """Store in cache"""
        db = DatabaseManager()
        db.cache_stock_data(symbol, data)
```

---

## 6. Subprocess Execution

### 6.1 Background Tasks

```python
# Subprocess execution for long-running tasks

import subprocess
import threading
from queue import Queue

class BackgroundTaskManager:
    """
    Manage background tasks and subprocess execution.
    
    Use cases:
    - Historical data backfill
    - Bulk stock analysis
    - Report generation
    - Data cleanup
    """
    
    def __init__(self):
        self.task_queue = Queue()
        self.results = {}
    
    def execute_async(self, task_id: str, function, *args, **kwargs):
        """Execute function asynchronously"""
        
        def worker():
            try:
                result = function(*args, **kwargs)
                self.results[task_id] = {
                    'status': 'completed',
                    'result': result
                }
            except Exception as e:
                self.results[task_id] = {
                    'status': 'failed',
                    'error': str(e)
                }
        
        thread = threading.Thread(target=worker)
        thread.start()
        
        self.results[task_id] = {'status': 'running'}
        return task_id
    
    def get_status(self, task_id: str) -> dict:
        """Get task status"""
        return self.results.get(task_id, {'status': 'not_found'})

# Usage example
task_manager = BackgroundTaskManager()

# Start background task
task_id = task_manager.execute_async(
    'bulk_analysis',
    analyze_multiple_stocks,
    symbols=['AAPL', 'GOOGL', 'MSFT']
)

# Check status
status = task_manager.get_status(task_id)
```

### 6.2 Batch Processing

```python
def batch_process_stocks(symbols: List[str], batch_size: int = 10):
    """
    Process stocks in batches to avoid rate limits.
    
    Flow:
    1. Split symbols into batches
    2. Process each batch sequentially
    3. Wait between batches
    4. Aggregate results
    """
    import time
    
    results = {}
    batches = [symbols[i:i + batch_size] for i in range(0, len(symbols), batch_size)]
    
    for i, batch in enumerate(batches):
        st.write(f"Processing batch {i+1}/{len(batches)}...")
        
        # Process batch
        for symbol in batch:
            try:
                data = load_stock_data(symbol)
                results[symbol] = data
            except Exception as e:
                logger.error(f"Error processing {symbol}: {e}")
        
        # Wait between batches (rate limiting)
        if i < len(batches) - 1:
            time.sleep(2)  # 2 second delay
    
    return results
```

---

## 7. Error Handling Flow

### 7.1 Error Handling Strategy

```
┌──────────────────────────────────────────────────────────────┐
│                  ERROR HANDLING FLOW                          │
└──────────────────────────────────────────────────────────────┘

Exception Occurs
        ↓
┌─────────────────────────┐
│ Identify Error Type     │
│ • API Error             │
│ • Database Error        │
│ • Validation Error      │
│ • System Error          │
└─────────────────────────┘
        ↓
┌─────────────────────────┐
│ Log Error               │
│ • Error message         │
│ • Stack trace           │
│ • Context data          │
│ • Timestamp             │
└─────────────────────────┘
        ↓
┌─────────────────────────┐
│ Attempt Recovery        │
│ • Retry (with backoff)  │
│ • Fallback data source  │
│ • Use cached data       │
│ • Default values        │
└─────────────────────────┘
        ↓
   Recovered?
    ╱      ╲
  Yes       No
   ↓         ↓
Success   ┌─────────────────────────┐
          │ User-Friendly Error     │
          │ • Clear message         │
          │ • Suggested actions     │
          │ • Contact info          │
          └─────────────────────────┘
```

### 7.2 Error Handling Implementation

```python
class ErrorHandler:
    """
    Centralized error handling with recovery strategies.
    """
    
    def handle_api_error(self, error: Exception, symbol: str):
        """Handle API errors with fallback"""
        logger.error(f"API error for {symbol}: {error}")
        
        # Try fallback data source
        try:
            return self._try_fallback_api(symbol)
        except Exception as fallback_error:
            # Try cache
            cached = self.db.get_stock_data(symbol, max_age_minutes=1440)  # 24 hours
            if cached:
                st.warning("⚠️ Using cached data (API temporarily unavailable)")
                return cached
            else:
                st.error(f"❌ Unable to fetch data for {symbol}. Please try again later.")
                return None
    
    def handle_database_error(self, error: Exception):
        """Handle database errors"""
        logger.error(f"Database error: {error}")
        st.warning("⚠️ Database temporarily unavailable. Running in API-only mode.")
        # Continue without database
    
    def handle_validation_error(self, error: Exception, field: str):
        """Handle validation errors"""
        logger.warning(f"Validation error for {field}: {error}")
        st.error(f"❌ Invalid {field}. Please check your input and try again.")
```

---

## 8. Caching Strategy Flow

### 8.1 Multi-Level Cache Flow

```
┌──────────────────────────────────────────────────────────────┐
│                   CACHING STRATEGY                            │
└──────────────────────────────────────────────────────────────┘

Data Request
        ↓
┌─────────────────────────┐
│ Level 1: Streamlit Cache│
│ • @st.cache_data        │
│ • In-memory             │
│ • Session-based         │
│ • TTL: 1 hour           │
└─────────────────────────┘
        ↓ (cache miss)
┌─────────────────────────┐
│ Level 2: Database Cache │
│ • PostgreSQL table      │
│ • Persistent            │
│ • Shared across users   │
│ • TTL: 60 minutes       │
└─────────────────────────┘
        ↓ (cache miss)
┌─────────────────────────┐
│ Level 3: API Fetch      │
│ • Yahoo Finance         │
│ • Polygon.io (backup)   │
│ • Finnhub (fundamentals)│
│ • Fresh data            │
└─────────────────────────┘
        ↓
┌─────────────────────────┐
│ Update All Cache Levels │
│ • Store in database     │
│ • Update Streamlit cache│
│ • Set timestamps        │
└─────────────────────────┘
```

### 8.2 Cache Implementation

```python
@st.cache_data(ttl=3600)  # 1 hour TTL
def load_stock_data(symbol: str) -> dict:
    """
    Load stock data with multi-level caching.
    
    Cache levels:
    1. Streamlit cache (memory)
    2. Database cache (PostgreSQL)
    3. API fetch (fresh data)
    """
    
    # Level 2: Check database cache
    db = DatabaseManager()
    cached_data = db.get_stock_data(symbol, max_age_minutes=60)
    
    if cached_data:
        logger.info(f"Cache hit for {symbol} (database)")
        return cached_data
    
    # Level 3: Fetch from API
    logger.info(f"Cache miss for {symbol}, fetching from API")
    data_ingestion = DataIngestion()
    fresh_data = data_ingestion.get_complete_stock_data(symbol)
    
    # Update database cache
    if fresh_data:
        db.cache_stock_data(symbol, fresh_data)
    
    return fresh_data
```

---

**Document Control**:
- Created: January 2026
- Owner: Next Investment Team
- Review Cycle: Quarterly
- Next Review: April 2026
