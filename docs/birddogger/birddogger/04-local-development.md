# BirdDogger - Local Development Guide

## Prerequisites

Before you begin, ensure you have the following installed on your development machine:

### Required Software

| Software | Minimum Version | Recommended Version | Download |
|----------|----------------|---------------------|----------|
| Node.js | 18.0.0 | 18.x LTS or 20.x LTS | https://nodejs.org/ |
| npm | 9.0.0 | Latest (comes with Node.js) | - |
| PostgreSQL | 13.0 | 15.x or 16.x | https://www.postgresql.org/download/ |
| Git | 2.30.0 | Latest | https://git-scm.com/downloads |

### Optional Software

| Software | Purpose | Download |
|----------|---------|----------|
| Docker Desktop | Alternative to local PostgreSQL | https://www.docker.com/products/docker-desktop |
| Postman | API testing | https://www.postman.com/downloads/ |
| DBeaver / pgAdmin | Database GUI | https://dbeaver.io/ or https://www.pgadmin.org/ |
| VS Code | Recommended IDE | https://code.visualstudio.com/ |

### Python (for Scrapers - Optional)

| Software | Version | Download |
|----------|---------|----------|
| Python | 3.8+ | https://www.python.org/downloads/ |
| pip | Latest | Comes with Python |

---

## Quick Start (5 Minutes)

### Option 1: Using Docker Compose (Recommended)

**1. Clone the repository**:
```bash
git clone https://github.com/mwinfiel0331/birddogger.git
cd birddogger
```

**2. Install dependencies**:
```bash
npm install
```

**3. Start PostgreSQL with Docker**:
```bash
docker-compose up -d
```

This starts PostgreSQL on port 5432 with:
- Database: `birddogger`
- Username: `devuser`
- Password: `devpass`

**4. Set up environment variables**:
```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

Edit `.env` and verify the database URL:
```env
DATABASE_URL="postgresql://devuser:devpass@localhost:5432/birddogger?schema=public"
PORT=3000
NODE_ENV=development
```

**5. Run database migrations**:
```bash
npm run prisma:migrate
```

**6. Generate Prisma Client**:
```bash
npm run prisma:generate
```

**7. Start the development server**:
```bash
npm run dev
```

**8. Verify the server is running**:
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{"status":"ok","timestamp":"2024-11-22T18:00:00.000Z"}
```

✅ **You're ready to develop!**

---

### Option 2: Using Local PostgreSQL

**1-2. Clone and install dependencies** (same as Option 1)

**3. Start PostgreSQL locally**:

**Windows**:
```powershell
# PostgreSQL should start automatically if installed via installer
# Verify it's running:
Get-Service -Name postgresql*
```

**Linux**:
```bash
sudo systemctl start postgresql
sudo systemctl status postgresql
```

**macOS**:
```bash
brew services start postgresql@15
```

**4. Create database and user**:
```bash
# Connect to PostgreSQL
psql -U postgres

# In PostgreSQL prompt:
CREATE DATABASE birddogger;
CREATE USER devuser WITH PASSWORD 'devpass';
GRANT ALL PRIVILEGES ON DATABASE birddogger TO devuser;
\q
```

**5-8. Continue with steps 4-8 from Option 1**

---

## Project Structure

```
birddogger/
├── docs/                      # Documentation
│   └── birddogger/           # Project-specific docs
├── prisma/                   # Database schema and migrations
│   ├── schema.prisma         # Prisma schema definition
│   └── migrations/           # Database migration files
├── src/                      # TypeScript source code
│   ├── index.ts             # Application entry point
│   ├── routes/              # API route handlers
│   │   ├── ingestion.routes.ts
│   │   ├── listing.routes.ts
│   │   ├── wholesaler.routes.ts
│   │   └── zillowIngest.routes.ts
│   ├── services/            # Business logic layer
│   │   ├── ingestion.service.ts
│   │   ├── listing.service.ts
│   │   ├── wholesaler.service.ts
│   │   └── zillowIngestion.service.ts
│   └── utils/               # Utility functions
│       ├── prisma.ts        # Prisma client instance
│       ├── scoring.ts       # Deal scoring algorithm
│       └── zillowScoring.ts # Zillow-specific scoring
├── craigslist/              # Python scraper scripts
│   ├── craigslist_scraper.py
│   └── config_example.yaml
├── .env                     # Environment variables (create from .env.example)
├── .env.example             # Environment template
├── docker-compose.yml       # Docker PostgreSQL setup
├── package.json             # Node.js dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── eslint.config.mjs        # ESLint configuration
└── README.md                # Main documentation
```

---

## NPM Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `npm run dev` | Start development server with hot reload |
| `build` | `npm run build` | Compile TypeScript to JavaScript |
| `start` | `npm start` | Run production build |
| `start:prod` | `npm run start:prod` | Run migrations and start production server |
| `lint` | `npm run lint` | Run ESLint to check code quality |
| `lint:fix` | `npm run lint:fix` | Auto-fix ESLint issues |
| `prisma:generate` | `npm run prisma:generate` | Generate Prisma Client |
| `prisma:migrate` | `npm run prisma:migrate` | Run database migrations (dev) |
| `prisma:deploy` | `npm run prisma:deploy` | Deploy migrations (production) |
| `prisma:studio` | `npm run prisma:studio` | Open Prisma Studio (database GUI) |

---

## Development Workflow

### 1. Starting Development

**Daily startup**:
```bash
# Start PostgreSQL (if using Docker)
docker-compose up -d

# Start development server
npm run dev
```

The server will:
- Start on `http://localhost:3000`
- Auto-reload on file changes
- Display TypeScript compilation errors
- Log all incoming requests

### 2. Making Changes

**Typical development cycle**:

1. **Modify code** in `src/` directory
2. **Save file** - server auto-reloads
3. **Test endpoint** using curl, Postman, or browser
4. **Check logs** in terminal for errors
5. **Repeat**

**Example**:
```bash
# Terminal 1: Development server running
npm run dev

# Terminal 2: Test your changes
curl http://localhost:3000/api/wholesalers
```

### 3. Database Changes

**When modifying the Prisma schema**:

1. **Edit** `prisma/schema.prisma`
2. **Create migration**:
   ```bash
   npx prisma migrate dev --name describe_your_change
   ```
3. **Regenerate Prisma Client**:
   ```bash
   npm run prisma:generate
   ```

**Example - Adding a new field**:
```prisma
model Wholesaler {
  // ... existing fields
  linkedInUrl String? // New field
}
```

```bash
npx prisma migrate dev --name add_linkedin_url
npm run prisma:generate
```

### 4. Viewing Database

**Prisma Studio** (Recommended):
```bash
npm run prisma:studio
```

Opens a web UI at `http://localhost:5555` to browse and edit data.

**psql CLI**:
```bash
psql postgresql://devuser:devpass@localhost:5432/birddogger
```

**DBeaver / pgAdmin**:
- Host: `localhost`
- Port: `5432`
- Database: `birddogger`
- Username: `devuser`
- Password: `devpass`

---

## Environment Variables

### Required Variables

Create a `.env` file in the project root:

```env
# Database Connection
DATABASE_URL="postgresql://devuser:devpass@localhost:5432/birddogger?schema=public"

# Server Configuration
PORT=3000
NODE_ENV=development

# Future: Authentication
# JWT_SECRET=your-secret-key-here
# JWT_EXPIRES_IN=7d

# Future: External APIs
# ZILLOW_API_KEY=your-key-here
# GOOGLE_MAPS_API_KEY=your-key-here
# TWILIO_ACCOUNT_SID=your-sid-here
# TWILIO_AUTH_TOKEN=your-token-here
```

### Environment-Specific Settings

**Development** (`.env`):
```env
DATABASE_URL="postgresql://devuser:devpass@localhost:5432/birddogger?schema=public"
PORT=3000
NODE_ENV=development
```

**Testing** (`.env.test`):
```env
DATABASE_URL="postgresql://devuser:devpass@localhost:5432/birddogger_test?schema=public"
PORT=3001
NODE_ENV=test
```

**Production** (set in hosting platform):
```env
DATABASE_URL="postgresql://user:pass@prod-host:5432/birddogger?schema=public"
PORT=8080
NODE_ENV=production
```

---

## Testing API Endpoints

### Using curl

**Health check**:
```bash
curl http://localhost:3000/health
```

**Create wholesaler**:
```bash
curl -X POST http://localhost:3000/api/wholesalers \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test Wholesaler",
    "primaryPhone": "+1-813-555-1111",
    "markets": ["Tampa, FL"]
  }'
```

**List wholesalers**:
```bash
curl http://localhost:3000/api/wholesalers
```

### Using Postman

1. Import the API examples from `API_EXAMPLES.md`
2. Create a new environment with:
   - `baseUrl`: `http://localhost:3000`
3. Use `{{baseUrl}}/api/wholesalers` in requests

### Using VS Code REST Client

Install the "REST Client" extension and create `test.http`:

```http
### Health Check
GET http://localhost:3000/health

### Create Wholesaler
POST http://localhost:3000/api/wholesalers
Content-Type: application/json

{
  "fullName": "Test Wholesaler",
  "primaryPhone": "+1-813-555-1111",
  "markets": ["Tampa, FL"]
}

### List Wholesalers
GET http://localhost:3000/api/wholesalers
```

Click "Send Request" above each section.

---

## Code Quality

### Running Linter

**Check for issues**:
```bash
npm run lint
```

**Auto-fix issues**:
```bash
npm run lint:fix
```

### TypeScript Type Checking

**Check types without building**:
```bash
npx tsc --noEmit
```

### Code Style Guidelines

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Required
- **Naming**:
  - camelCase for variables/functions
  - PascalCase for classes/interfaces
  - UPPER_CASE for constants

---

## Debugging

### VS Code Debugging

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Dev Server",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "console": "integratedTerminal",
      "restart": true,
      "protocol": "inspector",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

**Usage**:
1. Set breakpoints in VS Code
2. Press F5 or click "Run > Start Debugging"
3. Trigger API endpoint
4. Debugger pauses at breakpoints

### Console Logging

Add debug logs:
```typescript
console.log('Debugging wholesaler creation:', data);
console.error('Error occurred:', error);
```

View in terminal where `npm run dev` is running.

### Database Query Logging

Enable Prisma query logging in `src/utils/prisma.ts`:

```typescript
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

---

## Python Scraper Setup (Optional)

### Installation

**1. Navigate to scraper directory**:
```bash
cd craigslist
```

**2. Install Python dependencies**:
```bash
pip install -r ../requirements.txt
```

Or manually:
```bash
pip install requests beautifulsoup4 pyyaml
```

### Configuration

**1. Copy example config**:
```bash
# Windows
copy config_example.yaml craigslist-config.yaml

# Linux/Mac
cp config_example.yaml craigslist-config.yaml
```

**2. Edit configuration**:
```yaml
craigslist:
  locations:
    - tampa
    - stpete
  search_terms:
    - "investor special"
    - "wholesale"
    - "cash only"
  output_file: "../craigslist_listings.csv"
```

### Running the Scraper

**Execute scraper**:
```bash
python craigslist_scraper.py
```

**Output**: Creates `craigslist_listings.csv` in project root.

**Import to database**: Use Zillow CSV ingestion endpoint (accepts similar format).

---

## Common Issues and Solutions

### Issue: Port 3000 Already in Use

**Error**: `EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Windows - Find and kill process
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

Or change port in `.env`:
```env
PORT=3001
```

### Issue: Database Connection Failed

**Error**: `Can't reach database server`

**Solution**:
1. Verify PostgreSQL is running:
   ```bash
   docker-compose ps
   # or
   Get-Service postgresql*  # Windows
   sudo systemctl status postgresql  # Linux
   ```

2. Check DATABASE_URL in `.env`:
   ```env
   DATABASE_URL="postgresql://devuser:devpass@localhost:5432/birddogger?schema=public"
   ```

3. Test connection manually:
   ```bash
   psql postgresql://devuser:devpass@localhost:5432/birddogger
   ```

### Issue: Prisma Client Not Found

**Error**: `Cannot find module '@prisma/client'`

**Solution**:
```bash
npm run prisma:generate
```

### Issue: Migration Failed

**Error**: `Migration failed to apply`

**Solution**:
```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Or rollback and reapply
npx prisma migrate dev
```

### Issue: TypeScript Compilation Errors

**Error**: Various TS errors on startup

**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Regenerate Prisma types
npm run prisma:generate
```

### Issue: Hot Reload Not Working

**Solution**:
1. Restart development server: Ctrl+C, then `npm run dev`
2. Check file watchers limit (Linux):
   ```bash
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

---

## Performance Optimization Tips

### Database Indexing

Ensure proper indexes exist (already configured in schema):
- Primary keys (automatic)
- Foreign keys (indexed)
- Frequently filtered columns (score, hotness, market)

### Query Optimization

Use `include` and `select` to fetch only needed data:

```typescript
// Good - Only fetch what you need
const wholesalers = await prisma.wholesaler.findMany({
  select: {
    id: true,
    fullName: true,
    totalListingsTracked: true,
  },
});

// Better - Include relations selectively
const listing = await prisma.listing.findUnique({
  where: { id },
  include: {
    wholesaler: { select: { fullName: true } },
    media: { take: 5 },
  },
});
```

### Batch Operations

Use transactions for multiple operations:

```typescript
await prisma.$transaction([
  prisma.wholesaler.create({ data: wholesalerData }),
  prisma.listing.createMany({ data: listingsData }),
]);
```

---

## Git Workflow

### Branch Strategy

```bash
# Create feature branch
git checkout -b feature/add-sms-notifications

# Make changes and commit
git add .
git commit -m "feat: add SMS notification service"

# Push to remote
git push origin feature/add-sms-notifications

# Create pull request on GitHub
```

### Commit Message Convention

Follow conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

**Examples**:
```bash
git commit -m "feat: add wholesaler rating system"
git commit -m "fix: correct deal scoring calculation"
git commit -m "docs: update API documentation"
```

---

## Next Steps

Once your local environment is set up:

1. **Explore the API**: Use Postman or curl to test endpoints
2. **Review the code**: Start with `src/index.ts` and follow the flow
3. **Make changes**: Implement a small feature to understand the architecture
4. **Read the docs**: Check `API_EXAMPLES.md` for detailed API usage
5. **Run the scraper**: Test the Craigslist scraper (optional)

Happy coding! 🚀
