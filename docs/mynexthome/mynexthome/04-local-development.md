# MyNextHome - Local Development Guide

## Table of Contents

* [Prerequisites](#prerequisites)
* [Initial Setup](#initial-setup)
* [Running Locally](#running-locally)
* [Testing](#testing)
* [Development Workflow](#development-workflow)
* [Database Management](#database-management)
* [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

1. **Node.js** (v18 or higher)
   ```bash
   # Check version
   node --version  # Should be >= 18.0.0

   # Install via nvm (recommended)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 18
   nvm use 18
   ```

2. **PostgreSQL** (v14 or higher) OR **SQLite** (for development)

   **Option A: PostgreSQL (Production-like)**

   ```bash
   # macOS
   brew install postgresql@14
   brew services start postgresql@14

   # Ubuntu/Debian
   sudo apt-get install postgresql-14
   sudo systemctl start postgresql

   # Windows
   # Download from https://www.postgresql.org/download/windows/
   ```

   **Option B: SQLite (Simpler for development)**

   ```bash
   # SQLite comes pre-installed on most systems
   # No setup needed
   ```

3. **Git**
   ```bash
   git --version
   ```

4. **Code Editor** (VS Code recommended)
   * VS Code: https://code.visualstudio.com/
   * Recommended extensions:
     * Prisma (Prisma.prisma)
     * ESLint (dbaeumer.vscode-eslint)
     * TypeScript (built-in)

### Optional Software

* **Docker** (for running PostgreSQL in container)
  ```bash
  docker --version
  ```

* **Postman** or **Insomnia** (for API testing)

* **pgAdmin** or **DBeaver** (for database GUI)

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/mwinfiel0331/mynexthome.git
cd mynexthome
```

### 2. Install Dependencies

```bash
cd backend
npm install
```

This will install all dependencies including:

* TypeScript
* Fastify (API framework)
* Prisma (ORM)
* ESLint (linting)
* And all other packages from package.json

### 3. Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your configuration
nano .env  # or use your preferred editor
```

**Environment Variables Explained**:

```bash
# Database connection
# For SQLite (development):
DATABASE_URL="file:./dev.db"

# For PostgreSQL (production-like):
DATABASE_URL="postgresql://username:password@localhost:5432/mynexthome"

# Census API (optional for MVP, required for demographics)
# Get free key from: https://api.census.gov/data/key_signup.html
CENSUS_API_KEY="your_census_api_key_here"

# ACS dataset year (default: 2022)
ACS_YEAR=2022

# Directory containing Redfin CSV files
REDFIN_DATA_DIR="./data/raw/redfin"

# API server configuration
PORT=3000
NODE_ENV=development

# Logging level
LOG_LEVEL=info  # debug, info, warn, error
```

### 4. Set Up the Database

```bash
# Generate Prisma client (TypeScript types from schema)
npm run prisma:generate

# Run database migrations (create tables)
npm run prisma:migrate

# Verify tables were created
npx prisma studio
```

This will:

1. Generate TypeScript types from your Prisma schema
2. Create all database tables based on schema
3. Open Prisma Studio (database GUI) in your browser

### 5. Verify Installation

```bash
# Check TypeScript compilation
npm run build

# Check linting
npm run lint

# You should see no errors
```

## Running Locally

### Development Mode (Recommended)

Development mode includes hot reloading - changes to source files automatically restart the server.

```bash
# Start the API server in development mode
npm run dev
```

You should see:

```
Server listening on http://localhost:3000
```

**Test the API**:

```bash
# Health check
curl http://localhost:3000/health

# Should return:
# {"status":"ok","timestamp":"2024-01-18T..."}
```

### Production Mode

Build and run in production mode (no hot reload):

```bash
# Build TypeScript to JavaScript
npm run build

# Start the production server
npm start
```

### Running ETL Jobs

Before you can use the API effectively, you need to load data:

#### Step 1: Download Redfin Data

1. Visit [Redfin Data Center](https://www.redfin.com/news/data-center/)
2. Download CSV files for desired geography levels:
   * State-level data
   * County-level data
   * ZIP code-level data
3. Place CSV files in `backend/data/raw/redfin/`

```bash
# Example structure:
backend/data/raw/redfin/
├── state_market_tracker.tsv000.csv
├── county_market_tracker.tsv000.csv
└── zip_code_market_tracker.tsv000.csv
```

#### Step 2: Run Redfin ETL

```bash
npm run etl:redfin
```

Expected output:

```
Starting Redfin Market Metrics ETL...
Processing state_market_tracker.tsv000.csv
- Created 50 state geographies
- Loaded 12,000 market metrics
Processing county_market_tracker.tsv000.csv
- Created 3,143 county geographies
- Loaded 94,290 market metrics
...
ETL complete!
```

#### Step 3: Run Census ETL (Optional)

Get a Census API key first: https://api.census.gov/data/key\_signup.html

Add to `.env`:

```bash
CENSUS_API_KEY=your_key_here
```

Run the ETL:

```bash
# Load county demographics
npm run etl:census county

# Load ZIP code demographics
npm run etl:census zip
```

#### Step 4: Calculate Investment Scores

```bash
# Calculate scores for ZIP codes
npm run etl:scores zip

# Calculate scores for counties
npm run etl:scores county
```

#### Run Full ETL Pipeline

To run all ETL jobs in sequence:

```bash
npm run etl:all
```

This runs:

1. Redfin ETL
2. Census ETL (county)
3. Census ETL (zip)
4. Investment Scores (county)
5. Investment Scores (zip)

### Using Docker (Optional)

If you prefer to run PostgreSQL in Docker:

```bash
# Start PostgreSQL container
docker run --name mynexthome-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=mynexthome \
  -p 5432:5432 \
  -d postgres:14

# Update .env with Docker connection
DATABASE_URL="postgresql://postgres:password@localhost:5432/mynexthome"

# Run migrations
npm run prisma:migrate
```

## Testing

### Manual API Testing

#### Using curl

```bash
# Health check
curl http://localhost:3000/health

# Top 10 ZIP codes
curl "http://localhost:3000/markets/top?geo_type=zip&limit=10"

# Top 10 ZIPs in Florida
curl "http://localhost:3000/markets/top?geo_type=zip&limit=10&state=FL"

# Time series for a specific geography (replace {id} with actual geography_id)
curl "http://localhost:3000/markets/{geography_id}/timeseries?from=2023-01-01&to=2024-01-01"

# Full profile for a geography
curl "http://localhost:3000/markets/{geography_id}/profile"

# Compare multiple geographies
curl "http://localhost:3000/markets/compare?ids={id1},{id2},{id3}"
```

#### Using Postman or Insomnia

1. Import the following collection:

**GET /health**

```
http://localhost:3000/health
```

**GET /markets/top**

```
http://localhost:3000/markets/top
?geo_type=zip
&limit=20
&state=FL
&min_population=10000
```

**GET /markets/:id/timeseries**

```
http://localhost:3000/markets/{{geography_id}}/timeseries
?period_type=month
&from=2023-01-01
&to=2024-01-01
```

**GET /markets/:id/profile**

```
http://localhost:3000/markets/{{geography_id}}/profile
```

**GET /markets/compare**

```
http://localhost:3000/markets/compare
?ids={{id1}},{{id2}},{{id3}}
```

### Automated Testing (Future)

Currently, there are no automated tests. The `test` script in package.json is a placeholder:

```bash
npm test
# Output: "No tests specified yet"
```

**Planned testing approach**:

* Unit tests: Jest
* Integration tests: Supertest for API endpoints
* E2E tests: Playwright
* Test coverage target: 80%+

### ETL Testing

Test ETL jobs with sample data:

```bash
# Test with a small CSV file first
# Create a test file with 10-20 rows
head -n 20 backend/data/raw/redfin/large_file.csv > backend/data/raw/redfin/test_small.csv

# Run ETL on test file
npm run etl:redfin

# Verify in database
npx prisma studio
```

### Database Inspection

Use Prisma Studio to inspect data:

```bash
npm run prisma:studio
```

This opens a web interface at http://localhost:5555 where you can:

* Browse all tables
* Filter and search records
* Edit data manually
* Export data

## Development Workflow

### Typical Development Session

1. **Start the dev server**
   ```bash
   npm run dev
   ```

2. **Make code changes**
   * Edit files in `backend/src/`
   * Server automatically restarts on save

3. **Test your changes**
   ```bash
   curl http://localhost:3000/your-endpoint
   ```

4. **Check for errors**
   * Watch terminal for TypeScript errors
   * Check browser/Postman for API errors

5. **Run linter**
   ```bash
   npm run lint
   ```

6. **Fix any issues**
   ```bash
   npm run lint:fix
   ```

7. **Commit your changes**
   ```bash
   git add .
   git commit -m "Description of changes"
   git push
   ```

### Code Style

The project uses ESLint for code quality:

```bash
# Check for linting errors
npm run lint

# Auto-fix linting errors
npm run lint:fix
```

ESLint configuration is in `eslint.config.js`:

* TypeScript support
* Recommended rules
* No unused variables
* Consistent formatting

### TypeScript Best Practices

1. **Use strict mode** (already enabled in tsconfig.json)

2. **Avoid `any` type** - use specific types

3. **Leverage Prisma types**:
   ```typescript
   import { DimGeography } from '@prisma/client';

   function processGeography(geo: DimGeography) {
     // Type-safe access to all fields
   }
   ```

4. **Use async/await** instead of callbacks:
   ```typescript
   // Good
   const data = await prisma.dimGeography.findMany();

   // Avoid
   prisma.dimGeography.findMany().then(data => { ... });
   ```

### Working with Prisma

#### Common Prisma Commands

```bash
# Generate Prisma client after schema changes
npm run prisma:generate

# Create a new migration
npm run prisma:migrate

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Reset database (warning: deletes all data)
npx prisma migrate reset

# Format schema file
npx prisma format
```

#### Schema Changes Workflow

1. Edit `prisma/schema.prisma`
2. Generate client: `npm run prisma:generate`
3. Create migration: `npm run prisma:migrate`
4. Name your migration (e.g., "add\_user\_table")
5. Restart dev server to pick up new types

Example:

```bash
# Edit schema.prisma
nano prisma/schema.prisma

# Generate updated types
npm run prisma:generate

# Create migration
npm run prisma:migrate
# Enter migration name: "add_last_updated_field"

# Restart dev server (Ctrl+C then npm run dev)
```

### Hot Reload

The dev server uses `tsx watch` for hot reloading:

* **Restarts on**: Changes to `.ts` files
* **Doesn't restart on**: Changes to `.env` (restart manually)
* **Performance**: Fast restart (\&lt; 1 second)

If hot reload isn't working:

1. Check for syntax errors in terminal
2. Restart manually: Ctrl+C, then `npm run dev`
3. Clear TypeScript cache: `rm -rf dist/`

### Debugging

#### Using Console Logs

```typescript
// Quick debugging
console.log('Debug:', variable);
console.log('Query result:', JSON.stringify(result, null, 2));
```

#### Using Node.js Debugger

Add to VS Code's `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug API Server",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "skipFiles": ["<node_internals>/**"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

Then:

1. Set breakpoints in VS Code
2. Press F5 to start debugging
3. Make API requests
4. Debugger pauses at breakpoints

#### Logging Queries

Enable Prisma query logging in `backend/src/db/client.ts`:

```typescript
export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'], // Log all queries
});
```

## Database Management

### SQLite (Development)

**Advantages**:

* No setup required
* Fast for development
* File-based (easy to backup/share)

**Location**: `backend/dev.db` (or as specified in DATABASE\_URL)

**Backup**:

```bash
cp backend/dev.db backend/dev.db.backup
```

**Reset**:

```bash
rm backend/dev.db
npm run prisma:migrate
```

### PostgreSQL (Production-like)

**Create Database**:

```bash
# Using psql
createdb mynexthome

# Or via SQL
psql -c "CREATE DATABASE mynexthome;"
```

**Connect**:

```bash
psql mynexthome
```

**Useful Commands**:

```sql
-- List tables
\dt

-- Describe table
\d dim_geography

-- Count records
SELECT COUNT(*) FROM fact_market_metrics;

-- Check latest data
SELECT * FROM fact_market_metrics ORDER BY created_at DESC LIMIT 10;
```

**Backup**:

```bash
pg_dump mynexthome > backup.sql
```

**Restore**:

```bash
psql mynexthome < backup.sql
```

### Migrations

Prisma migrations are stored in `prisma/migrations/`:

```bash
# View migration history
ls -la prisma/migrations/

# Apply migrations to a different database
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

## Troubleshooting

### Common Issues

#### 1. "Cannot find module '@prisma/client'"

**Solution**:

```bash
npm run prisma:generate
```

#### 2. "Port 3000 already in use"

**Solution**:

```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill

# Or use a different port
PORT=3001 npm run dev
```

#### 3. "Database connection error"

**Causes**:

* PostgreSQL not running
* Wrong DATABASE\_URL
* Database doesn't exist

**Solutions**:

```bash
# Check PostgreSQL status
brew services list  # macOS
sudo systemctl status postgresql  # Linux

# Verify DATABASE_URL in .env
cat .env | grep DATABASE_URL

# Create database if missing
createdb mynexthome
```

#### 4. "No CSV files found"

**Solution**:

```bash
# Verify CSV files exist
ls backend/data/raw/redfin/

# Check REDFIN_DATA_DIR in .env
cat .env | grep REDFIN_DATA_DIR
```

#### 5. "Census API rate limit exceeded"

**Solution**:

* Get a Census API key: https://api.census.gov/data/key\_signup.html
* Add to .env: `CENSUS_API_KEY=your_key`
* With a key, limit increases from 500/day to 500/minute

#### 6. "TypeScript compilation errors"

**Solution**:

```bash
# Check for errors
npm run build

# Clear TypeScript cache
rm -rf dist/

# Regenerate Prisma client
npm run prisma:generate

# Rebuild
npm run build
```

#### 7. "Geography not found" during Census ETL

**Cause**: Census ETL needs geographies to exist first

**Solution**:

```bash
# Always run Redfin ETL before Census ETL
npm run etl:redfin
npm run etl:census county
```

### Performance Issues

#### Slow Queries

1. **Check query execution**:
   ```typescript
   // Enable query logging
   export const prisma = new PrismaClient({
     log: ['query'],
   });
   ```

2. **Add indexes** (if missing):
   ```prisma
   model FactMarketMetrics {
     // ...
     @@index([geographyId, periodStartDate])
   }
   ```

3. **Use pagination**:
   ```typescript
   const results = await prisma.factMarketMetrics.findMany({
     take: 100,  // Limit results
     skip: 0,    // Offset for pagination
   });
   ```

#### Slow ETL

1. **Process in smaller batches**
2. **Use database transactions** for bulk inserts
3. **Add indexes** before loading large datasets
4. **Consider async processing** with BullMQ

### Getting Help

1. **Check Documentation**:
   * This guide
   * backend/README.md
   * Prisma docs: https://www.prisma.io/docs

2. **Check Logs**:
   * Terminal output
   * Database logs
   * Application logs

3. **Debug with Prisma Studio**:
   ```bash
   npm run prisma:studio
   ```

4. **Search Issues**:
   * GitHub Issues
   * Stack Overflow
   * Prisma GitHub Discussions

### Resetting Everything

If you need to start fresh:

```bash
# 1. Stop all running servers
# Press Ctrl+C

# 2. Delete database
rm backend/dev.db  # SQLite
# OR
dropdb mynexthome && createdb mynexthome  # PostgreSQL

# 3. Delete node_modules
rm -rf backend/node_modules

# 4. Reinstall
cd backend
npm install

# 5. Regenerate Prisma client
npm run prisma:generate

# 6. Run migrations
npm run prisma:migrate

# 7. Reload data
npm run etl:all

# 8. Restart server
npm run dev
```

## Development Tips

### Useful Aliases

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
alias mnh="cd ~/mynexthome/backend"
alias mnhdev="cd ~/mynexthome/backend && npm run dev"
alias mnhetl="cd ~/mynexthome/backend && npm run etl:all"
alias mnhstudio="cd ~/mynexthome/backend && npm run prisma:studio"
```

### Watch Mode for TypeScript

For pure TypeScript development (no server):

```bash
npx tsc --watch
```

### Quick Data Inspection

```bash
# Count records in each table
npx prisma db execute --stdin <<EOF
SELECT 
  (SELECT COUNT(*) FROM dim_geography) as geographies,
  (SELECT COUNT(*) FROM fact_market_metrics) as metrics,
  (SELECT COUNT(*) FROM fact_demographics) as demographics,
  (SELECT COUNT(*) FROM fact_investment_score) as scores;
EOF
```

### Environment Switching

Use different .env files for different environments:

```bash
# Development
cp .env.development .env

# Staging
cp .env.staging .env

# Production (local)
cp .env.production .env
```

Or use environment variables:

```bash
DATABASE_URL="postgresql://..." npm run dev
```
