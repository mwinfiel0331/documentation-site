# MyNextHome - Documentation

## Welcome to MyNextHome Documentation

MyNextHome is a real estate market analytics platform designed to help homebuyers and investors make data-driven decisions across the nationwide US real estate market.

## Documentation Structure

This documentation suite is organized into the following sections:

### Getting Started
- **[00-requirements.md](00-requirements.md)** - MVP deliverables, future features, roadmap, and success metrics
- **[04-local-development.md](04-local-development.md)** - Prerequisites, setup, testing, and development workflow
- **[../../GETTING_STARTED.md](../../GETTING_STARTED.md)** - Quick start guide (root level)

### Technical Documentation
- **[01-architecture.md](01-architecture.md)** - System architecture, component overview, and technology stack
- **[02-data-model.md](02-data-model.md)** - Database schema, ER diagrams, and data dictionary
- **[03-data-flows.md](03-data-flows.md)** - ETL pipeline flows, data transformations, and job scheduling

### Operations
- **[05-deployment.md](05-deployment.md)** - Production deployment, infrastructure setup, and monitoring
- **[07-application-flows.md](07-application-flows.md)** - Application flows, subprocess execution, and maintenance

### API Documentation
- **[06-api-reference.md](06-api-reference.md)** - Complete API documentation with examples and data models

## Quick Links

### For Developers
1. [Setup Development Environment](04-local-development.md#initial-setup)
2. [Run ETL Pipeline](04-local-development.md#running-etl-jobs)
3. [Start API Server](04-local-development.md#development-mode-recommended)
4. [API Reference](06-api-reference.md)

### For DevOps
1. [Infrastructure Setup](05-deployment.md#infrastructure-setup)
2. [Database Deployment](05-deployment.md#database-deployment)
3. [Application Deployment](05-deployment.md#application-deployment)
4. [Monitoring](05-deployment.md#monitoring-and-logging)

### For Business/Product
1. [Requirements & MVP](00-requirements.md#mvp-minimum-viable-product-deliverables)
2. [Future Features](00-requirements.md#post-mvp-features-future-enhancements)
3. [Roadmap](00-requirements.md#roadmap-timeline)

## Project Overview

### Tech Stack
- **Backend**: Node.js + TypeScript
- **Database**: PostgreSQL (SQLite for development)
- **ORM**: Prisma
- **API**: Fastify
- **ETL**: CSV parsing, Census API integration

### Data Sources
- **Redfin Data Center**: Historical market statistics
- **US Census Bureau**: American Community Survey (ACS) demographics

### Key Features
- ETL pipeline for data ingestion and processing
- Multi-factor investment scoring algorithm (0-100 scale)
- REST API serving market analytics
- Support for multiple geography levels (nation, state, MSA, county, city, ZIP)

## Getting Help

### Documentation
- Browse the documentation files listed above
- Check [Troubleshooting](04-local-development.md#troubleshooting)
- Review [Application Flows](07-application-flows.md)

### Additional Resources
- **Backend README**: `backend/README.md`
- **Implementation Summary**: `backend/IMPLEMENTATION_SUMMARY.md`
- **Security Summary**: `SECURITY_SUMMARY.md`

## Quick Start

```bash
# Clone repository
git clone https://github.com/mwinfiel0331/mynexthome.git
cd mynexthome/backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your settings

# Setup database
npm run prisma:generate
npm run prisma:migrate

# Load data
npm run etl:all

# Start API server
npm run dev
```

For detailed instructions, see [Local Development Guide](04-local-development.md).

## License

ISC
