# 🚀 Deployment Guide - Next Investment Platform

## Document Information
- **Version**: 1.0.0
- **Last Updated**: January 2026
- **Status**: Production Deployment Active

## Table of Contents
1. [Deployment Overview](#deployment-overview)
2. [Railway Platform Deployment](#railway-platform-deployment)
3. [Alternative Deployment Options](#alternative-deployment-options)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [Custom Domain & SSL](#custom-domain--ssl)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Rollback Procedures](#rollback-procedures)

---

## 1. Deployment Overview

### 1.1 Production Environment

**Current Production**: [nextinvestment.ai](https://nextinvestment.ai)

- **Platform**: Railway.app
- **Runtime**: Python 3.8+
- **Database**: PostgreSQL 13+ (managed)
- **SSL/TLS**: Let's Encrypt (auto-renewed)
- **Deployment**: Continuous deployment from GitHub

### 1.2 Deployment Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                       PRODUCTION STACK                        │
└──────────────────────────────────────────────────────────────┘

GitHub Repository (main branch)
        ↓ (webhook trigger)
Railway Platform
        ├─→ Web Service (Streamlit app)
        ├─→ PostgreSQL Database (managed)
        └─→ Environment Variables
        ↓
nextinvestment.ai (custom domain)
        └─→ SSL/TLS (Let's Encrypt)
```

### 1.3 Deployment Requirements

```yaml
Required:
  - GitHub repository access
  - Railway.app account (free tier available)
  - Domain name (optional, for custom domain)

Optional:
  - Finnhub API key (60 req/min free tier)
  - Polygon.io API key (5 req/min free tier)
  - Custom domain DNS access
```

---

## 2. Railway Platform Deployment

### 2.1 Initial Railway Setup

#### Step 1: Create Railway Account

```
1. Visit https://railway.app
2. Click "Sign Up with GitHub"
3. Authorize Railway to access your GitHub account
4. Complete account setup
```

#### Step 2: Create New Project

```
1. Click "New Project" on Railway dashboard
2. Select "Deploy from GitHub repo"
3. Choose "nextinvestment" repository
4. Railway will automatically detect Python project
```

#### Step 3: Add PostgreSQL Service

```
1. In your Railway project, click "New"
2. Select "Database" → "Add PostgreSQL"
3. Railway creates managed PostgreSQL instance
4. DATABASE_URL is automatically set in environment
```

### 2.2 Environment Variables Configuration

Navigate to your project → Variables tab:

```bash
# Required Environment Variables

# API Keys (optional but recommended)
FINNHUB_API_KEY=your_finnhub_key_here
POLYGON_API_KEY=your_polygon_key_here

# Application Settings
SECRET_KEY=railway_production_secret_2024
DEBUG=False
STREAMLIT_SERVER_FILE_WATCHER_TYPE=none

# Server Configuration
STREAMLIT_SERVER_PORT=8501
STREAMLIT_SERVER_ADDRESS=0.0.0.0
STREAMLIT_SERVER_HEADLESS=true

# Database URL (auto-configured by Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

### 2.3 Deployment Configuration Files

#### railway.toml

```toml
# Railway deployment configuration
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "streamlit run app.py --server.port=$PORT --server.address=0.0.0.0"
healthcheckPath = "/"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

#### Procfile

```
web: streamlit run app.py --server.port=$PORT --server.address=0.0.0.0 --server.headless=true
```

#### .railwayignore

```
# Exclude from deployment
__pycache__/
*.py[cod]
*$py.class
.env
.env.local
venv/
.venv/
.git/
.pytest_cache/
.coverage
htmlcov/
dist/
build/
*.egg-info/
.DS_Store
*.log
.streamlit/secrets.toml
screenshots/
.github/
.vscode/
```

#### requirements-railway.txt

```
# Production dependencies (without PyTorch)
streamlit>=1.28.0
yfinance>=0.2.28
pandas>=2.0.0
numpy>=1.24.0
plotly>=5.17.0
matplotlib>=3.7.0
seaborn>=0.12.0
finnhub-python>=2.4.0
polygon-api-client>=1.14.0
vaderSentiment>=3.3.2
sqlalchemy>=2.0.0
psycopg2-binary>=2.9.0
python-dotenv>=1.0.0
```

### 2.4 Deployment Process

#### Manual Deployment

```bash
# 1. Commit and push changes to GitHub
git add .
git commit -m "deploy: Update for production"
git push origin main

# 2. Railway automatically detects push
# 3. Build process starts
# 4. Health check runs
# 5. Traffic switches to new deployment
```

#### Deployment Steps (Railway performs automatically):

```
┌─────────────────────────────────────────────────────────┐
│                 DEPLOYMENT PIPELINE                      │
└─────────────────────────────────────────────────────────┘

1. GitHub Webhook Triggered
        ↓
2. Railway Pulls Latest Code
        ↓
3. Build Environment Created
        ↓
4. Install Dependencies (requirements-railway.txt)
        ↓
5. Build Application Container
        ↓
6. Start Application
        ↓
7. Health Check (GET /)
        ↓
8. Traffic Switched (Zero Downtime)
        ↓
9. Deployment Complete ✅
```

### 2.5 Monitoring Deployment

```
Railway Dashboard:
  - Deployments tab: View deployment history
  - Logs tab: Real-time application logs
  - Metrics tab: CPU, memory, network usage
  - Settings tab: Environment variables, custom domain

View Logs:
  1. Go to Railway project
  2. Click on web service
  3. Click "Logs" tab
  4. View real-time logs
```

### 2.6 Health Checks

#### Health Check Endpoint

```python
# app.py or health_check.py
def health_check():
    """
    Health check endpoint for deployment monitoring.
    
    Returns:
        dict: Status of application components
    """
    status = {
        "status": "healthy",
        "database": "connected",
        "apis": {
            "yahoo_finance": "available",
            "finnhub": "available" if settings.finnhub_api_key else "not_configured",
            "polygon": "available" if settings.polygon_api_key else "not_configured"
        }
    }
    return status
```

#### Monitor Health

```bash
# Check health endpoint
curl https://nextinvestment.ai/

# Should return: HTTP 200 OK
# If app is healthy

# Check specific API status
curl https://nextinvestment.ai/health
```

---

## 3. Alternative Deployment Options

### 3.1 Streamlit Cloud

**Pros**: Free, optimized for Streamlit, easy setup  
**Cons**: Limited resources on free tier

```
Steps:
1. Visit https://share.streamlit.io
2. Sign in with GitHub
3. Click "New app"
4. Select repository: nextinvestment
5. Set main file: app.py
6. Deploy

Secrets Management:
1. Go to app settings
2. Add secrets in TOML format:
   FINNHUB_API_KEY = "your_key"
   POLYGON_API_KEY = "your_key"
```

### 3.2 Heroku

**Pros**: Robust platform, PostgreSQL add-on available  
**Cons**: No longer has free tier

```bash
# 1. Install Heroku CLI
brew install heroku/brew/heroku  # macOS
# or download from https://devcenter.heroku.com/articles/heroku-cli

# 2. Login to Heroku
heroku login

# 3. Create Heroku app
heroku create nextinvestment

# 4. Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# 5. Set environment variables
heroku config:set FINNHUB_API_KEY=your_key
heroku config:set POLYGON_API_KEY=your_key
heroku config:set SECRET_KEY=production_secret

# 6. Deploy
git push heroku main

# 7. Open app
heroku open
```

**Configuration**:

```
# Procfile
web: sh setup.sh && streamlit run app.py

# setup.sh
mkdir -p ~/.streamlit/
echo "\
[server]\n\
headless = true\n\
port = $PORT\n\
enableCORS = false\n\
\n\
" > ~/.streamlit/config.toml

# runtime.txt
python-3.8.18
```

### 3.3 Google Cloud Run

**Pros**: Serverless, pay per use, auto-scaling  
**Cons**: More complex setup

```dockerfile
# Dockerfile
FROM python:3.8-slim

WORKDIR /app

COPY requirements-railway.txt .
RUN pip install --no-cache-dir -r requirements-railway.txt

COPY . .

EXPOSE 8080

CMD streamlit run app.py \
    --server.port=8080 \
    --server.address=0.0.0.0 \
    --server.headless=true
```

```bash
# Deploy to Cloud Run
gcloud run deploy nextinvestment \
    --source . \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated
```

### 3.4 DigitalOcean App Platform

**Pros**: Simple deployment, managed services  
**Cons**: Costs can add up

```yaml
# .do/app.yaml
name: nextinvestment
services:
  - name: web
    github:
      repo: mwinfiel0331/nextinvestment
      branch: main
      deploy_on_push: true
    run_command: streamlit run app.py --server.port=8080
    environment_slug: python
    instance_count: 1
    instance_size_slug: basic-xxs
    envs:
      - key: FINNHUB_API_KEY
        value: ${FINNHUB_API_KEY}
      - key: POLYGON_API_KEY
        value: ${POLYGON_API_KEY}
databases:
  - name: db
    engine: PG
    version: "13"
```

---

## 4. Environment Configuration

### 4.1 Environment Variables Reference

| Variable | Description | Required | Example |
|---------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes (auto) | `postgresql://user:pass@host:5432/db` |
| `FINNHUB_API_KEY` | Finnhub API key | No | `d3t8aopr01qigeg1tv6g...` |
| `POLYGON_API_KEY` | Polygon.io API key | No | `MeJilhkdrDXRzD7_...` |
| `SECRET_KEY` | Application secret key | Yes | `production_secret_2024` |
| `DEBUG` | Enable debug mode | No | `False` |
| `STREAMLIT_SERVER_PORT` | Server port | No | `8501` |
| `STREAMLIT_SERVER_ADDRESS` | Server address | No | `0.0.0.0` |
| `STREAMLIT_SERVER_HEADLESS` | Headless mode | No | `true` |
| `STREAMLIT_SERVER_FILE_WATCHER_TYPE` | File watcher | No | `none` |

### 4.2 Production Environment Template

```bash
# .env.production
# Copy to Railway environment variables

# Database (auto-configured by Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# API Keys
FINNHUB_API_KEY=your_production_finnhub_key
POLYGON_API_KEY=your_production_polygon_key

# Security
SECRET_KEY=generate_random_secret_key_here
DEBUG=False

# Streamlit Server Configuration
STREAMLIT_SERVER_PORT=8501
STREAMLIT_SERVER_ADDRESS=0.0.0.0
STREAMLIT_SERVER_HEADLESS=true
STREAMLIT_SERVER_FILE_WATCHER_TYPE=none
STREAMLIT_SERVER_ENABLE_CORS=false

# Caching
CACHE_TTL_MINUTES=60

# Logging
LOG_LEVEL=INFO
```

### 4.3 Secret Key Generation

```bash
# Generate secure secret key
python3 << EOF
import secrets
secret_key = secrets.token_urlsafe(32)
print(f"SECRET_KEY={secret_key}")
EOF

# Output example:
# SECRET_KEY=xJf3kP9mNqR7tYvZ2wC4eH6gK8jL0nM5oQ1rU3vX7yA9bD0fG2
```

---

## 5. Database Setup

### 5.1 Railway PostgreSQL Configuration

```bash
# Railway automatically provides:
DATABASE_URL=postgresql://postgres:password@hostname:5432/railway

# Connection pooling is handled by Railway
# Automatic backups enabled
# SSL/TLS encryption enabled
```

### 5.2 Database Initialization

```python
# Run after first deployment to create tables
# Can be run from Railway console or locally with production DATABASE_URL

from data.database import DatabaseManager

def initialize_database():
    """Initialize database schema"""
    db = DatabaseManager()
    
    # Create tables
    db.create_tables()
    print("✅ Tables created")
    
    # Create indexes
    db.create_indexes()
    print("✅ Indexes created")
    
    # Verify setup
    db.verify_connection()
    print("✅ Database initialized successfully!")

if __name__ == "__main__":
    initialize_database()
```

### 5.3 Database Migrations

```sql
-- Migration scripts stored in migrations/
-- migrations/001_initial_schema.sql

CREATE TABLE IF NOT EXISTS stock_cache (
    symbol VARCHAR(10) PRIMARY KEY,
    data JSONB NOT NULL,
    last_updated TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_symbol ON stock_cache(symbol);
CREATE INDEX IF NOT EXISTS idx_stock_updated ON stock_cache(last_updated);

CREATE TABLE IF NOT EXISTS watchlists (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    added_at TIMESTAMP DEFAULT NOW(),
    notes TEXT,
    FOREIGN KEY (symbol) REFERENCES stock_cache(symbol) ON DELETE CASCADE,
    UNIQUE (user_id, symbol)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_symbol ON watchlists(symbol);
```

```bash
# Apply migration
psql $DATABASE_URL -f migrations/001_initial_schema.sql
```

### 5.4 Database Backup

```bash
# Railway provides automatic backups
# Manual backup from Railway:
# 1. Go to PostgreSQL service
# 2. Click "Data" tab
# 3. Click "Create Backup"

# Manual backup via CLI
# Get DATABASE_URL from Railway
export DATABASE_URL="postgresql://..."

# Create backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Compress backup
gzip backup_$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup_20240115.sql
```

---

## 6. Custom Domain & SSL

### 6.1 Railway Custom Domain Setup

#### Step 1: Add Custom Domain in Railway

```
1. Go to Railway project
2. Click on web service
3. Go to "Settings" tab
4. Scroll to "Domains" section
5. Click "Custom Domain"
6. Enter: nextinvestment.ai
```

#### Step 2: Configure DNS Records

Railway will provide DNS configuration:

```
Type: CNAME
Name: @ (or nextinvestment.ai)
Value: [railway-provided-domain].up.railway.app

Type: CNAME
Name: www
Value: [railway-provided-domain].up.railway.app
```

#### Step 3: Update DNS at Domain Registrar

```
# Example for Cloudflare, Namecheap, GoDaddy, etc.

1. Login to your domain registrar
2. Go to DNS management
3. Add CNAME records as provided by Railway
4. Save changes
5. Wait for DNS propagation (5-30 minutes)
```

### 6.2 SSL/TLS Certificate

Railway automatically provisions SSL certificates:

```
1. After DNS propagation, Railway detects custom domain
2. Let's Encrypt certificate requested
3. Certificate provisioned (usually within 15-30 minutes)
4. HTTPS automatically enabled
5. HTTP automatically redirects to HTTPS
```

### 6.3 Verify SSL Configuration

```bash
# Check SSL certificate
curl -I https://nextinvestment.ai

# Expected headers:
# HTTP/2 200
# server: railway
# strict-transport-security: max-age=31536000; includeSubDomains

# Test SSL grade
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=nextinvestment.ai
# Expected: A or A+ rating
```

### 6.4 Force HTTPS

```python
# Streamlit automatically handles HTTPS
# Additional security headers can be configured

# .streamlit/config.toml
[server]
enableCORS = false
enableXsrfProtection = true

[browser]
gatherUsageStats = false
```

---

## 7. Monitoring & Maintenance

### 7.1 Application Monitoring

#### Railway Metrics

```
Railway Dashboard → Web Service → Metrics

Available Metrics:
  • CPU usage (%)
  • Memory usage (MB)
  • Network I/O (MB)
  • Request count
  • Response time (ms)
  • Error rate (%)
```

#### Application Logs

```bash
# View logs in Railway
Railway Dashboard → Web Service → Logs

# Filter logs
# Click on log entry to expand
# Use search to filter by keyword

# Log levels:
INFO: Normal operations
WARNING: Potential issues
ERROR: Application errors
CRITICAL: System failures
```

#### Custom Monitoring

```python
# app.py - Add monitoring
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

def log_request(symbol: str, response_time: float):
    """Log API request metrics"""
    logger.info(f"Stock lookup: {symbol}, Response time: {response_time:.2f}s")

def log_error(error: Exception, context: dict):
    """Log application errors"""
    logger.error(f"Error: {error}", extra=context)
```

### 7.2 Performance Monitoring

```python
# Monitor performance metrics
import time

class PerformanceMonitor:
    def __init__(self):
        self.metrics = []
    
    def track_request(self, operation: str):
        """Track request performance"""
        start_time = time.time()
        
        def end_tracking():
            elapsed = time.time() - start_time
            self.metrics.append({
                "operation": operation,
                "duration": elapsed,
                "timestamp": datetime.now()
            })
            
            if elapsed > 3.0:
                logger.warning(f"Slow request: {operation} took {elapsed:.2f}s")
        
        return end_tracking
```

### 7.3 Database Maintenance

```sql
-- Run periodically to maintain performance

-- Update statistics
ANALYZE stock_cache;
ANALYZE watchlists;

-- Vacuum to reclaim space
VACUUM ANALYZE stock_cache;
VACUUM ANALYZE watchlists;

-- Check table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### 7.4 Scheduled Maintenance

```python
# Scheduled tasks (can be added later)

# 1. Clear old cache entries (daily)
def cleanup_old_cache():
    """Remove cache entries older than 30 days"""
    db = DatabaseManager()
    db.execute("""
        DELETE FROM stock_cache
        WHERE last_updated < NOW() - INTERVAL '30 days'
        AND symbol NOT IN (SELECT DISTINCT symbol FROM watchlists)
    """)

# 2. Database optimization (weekly)
def optimize_database():
    """Run VACUUM ANALYZE"""
    db = DatabaseManager()
    db.execute("VACUUM ANALYZE")

# 3. Health check (hourly)
def health_check():
    """Verify system components"""
    checks = {
        "database": check_database_connection(),
        "apis": check_api_availability(),
        "storage": check_disk_space()
    }
    return all(checks.values())
```

---

## 8. Rollback Procedures

### 8.1 Emergency Rollback

```bash
# Railway automatic rollback on health check failure

# Manual rollback via Railway:
1. Go to Railway Dashboard
2. Click on web service
3. Go to "Deployments" tab
4. Find previous successful deployment
5. Click "..." menu
6. Click "Redeploy"
```

### 8.2 Git-Based Rollback

```bash
# Rollback to previous commit
git log --oneline  # Find commit hash to rollback to

# Option 1: Revert specific commit
git revert <commit-hash>
git push origin main

# Option 2: Reset to previous state (use carefully)
git reset --hard <previous-commit-hash>
git push --force origin main

# Railway will automatically deploy reverted code
```

### 8.3 Database Rollback

```bash
# Restore from backup
export DATABASE_URL="postgresql://..."

# Stop application (Railway → Pause Service)

# Restore database
psql $DATABASE_URL < backup_before_deployment.sql

# Verify restoration
psql $DATABASE_URL -c "SELECT COUNT(*) FROM stock_cache"

# Resume application (Railway → Resume Service)
```

### 8.4 Incident Response Plan

```
1. Detect Issue
   ├─ Monitoring alerts
   ├─ User reports
   └─ Health check failures

2. Assess Impact
   ├─ Check error rates
   ├─ Review logs
   └─ Identify affected users

3. Immediate Action
   ├─ Rollback deployment (if needed)
   ├─ Disable problematic feature
   └─ Switch to fallback mode

4. Fix & Verify
   ├─ Identify root cause
   ├─ Implement fix
   ├─ Test in staging
   └─ Deploy fix

5. Post-Mortem
   ├─ Document incident
   ├─ Update procedures
   └─ Prevent recurrence
```

---

**Document Control**:
- Created: January 2026
- Owner: Next Investment Team
- Review Cycle: Quarterly
- Next Review: April 2026

**Deployment Checklist**: See DEPLOYMENT_CHECKLIST.md for step-by-step guide
