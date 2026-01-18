# MyNextHome - Production Deployment Guide

## Table of Contents
- [Deployment Overview](#deployment-overview)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Infrastructure Setup](#infrastructure-setup)
- [Database Deployment](#database-deployment)
- [Application Deployment](#application-deployment)
- [ETL Job Scheduling](#etl-job-scheduling)
- [Monitoring and Logging](#monitoring-and-logging)
- [Security Hardening](#security-hardening)
- [Backup and Disaster Recovery](#backup-and-disaster-recovery)

## Deployment Overview

### Architecture Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        Production Stack                          │
└─────────────────────────────────────────────────────────────────┘

Internet
   │
   ▼
┌─────────────────────┐
│  Load Balancer      │  ◄── SSL/TLS Termination
│  (ALB/NLB/HAProxy)  │  ◄── DDoS Protection
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    ▼             ▼
┌─────────┐   ┌─────────┐
│ API     │   │ API     │  ◄── Auto-scaling (2-10 instances)
│ Server  │   │ Server  │  ◄── Docker containers or VMs
│ Node 1  │   │ Node 2  │  ◄── Health checks
└────┬────┘   └────┬────┘
     │             │
     └──────┬──────┘
            │
            ▼
┌──────────────────────┐
│  PostgreSQL          │  ◄── Primary + Read Replicas
│  RDS/Cloud SQL       │  ◄── Automated backups
└──────────┬───────────┘  ◄── Point-in-time recovery
           │
           ▼
┌──────────────────────┐
│  Redis (Optional)    │  ◄── API response caching
│  ElastiCache         │  ◄── Job queue (BullMQ)
└──────────────────────┘
```

### Deployment Platforms

**Recommended Options**:

1. **AWS** (Amazon Web Services)
   - EC2 for API servers
   - RDS for PostgreSQL
   - ElastiCache for Redis
   - S3 for data storage
   - CloudWatch for monitoring

2. **GCP** (Google Cloud Platform)
   - Cloud Run for API (serverless)
   - Cloud SQL for PostgreSQL
   - Memorystore for Redis
   - Cloud Storage for data
   - Cloud Logging

3. **Azure** (Microsoft Azure)
   - App Service or AKS
   - Azure Database for PostgreSQL
   - Azure Cache for Redis
   - Blob Storage
   - Application Insights

4. **Heroku** (Simplest, higher cost)
   - Heroku Dynos for API
   - Heroku Postgres
   - Heroku Redis
   - Heroku Scheduler for ETL

5. **DigitalOcean** (Cost-effective)
   - Droplets for API servers
   - Managed PostgreSQL
   - Managed Redis
   - Spaces for storage

## Pre-Deployment Checklist

### Code Preparation

- [ ] All code committed to main/master branch
- [ ] Build succeeds: `npm run build`
- [ ] Linting passes: `npm run lint`
- [ ] No security vulnerabilities: `npm audit`
- [ ] Environment variables documented
- [ ] Secrets removed from code
- [ ] Version tagged in Git

### Database Preparation

- [ ] Schema finalized and tested
- [ ] Migrations tested locally
- [ ] Indexes optimized
- [ ] Sample data loaded and verified
- [ ] Backup strategy defined

### Infrastructure

- [ ] Domain name registered
- [ ] SSL certificate obtained
- [ ] Cloud account created
- [ ] Billing alerts configured
- [ ] Access controls configured

### Monitoring

- [ ] Error tracking service configured (Sentry)
- [ ] Log aggregation service configured
- [ ] Uptime monitoring configured
- [ ] Alert contacts defined

## Infrastructure Setup

### Option 1: AWS Deployment

#### 1. Create VPC and Networking

```bash
# Using AWS CLI
aws ec2 create-vpc --cidr-block 10.0.0.0/16

# Create subnets (public and private)
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.1.0/24 --availability-zone us-east-1a
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.2.0/24 --availability-zone us-east-1b
```

#### 2. Set Up RDS PostgreSQL

```bash
# Create database instance
aws rds create-db-instance \
  --db-instance-identifier mynexthome-prod \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 14.7 \
  --master-username postgres \
  --master-user-password YOUR_STRONG_PASSWORD \
  --allocated-storage 20 \
  --storage-type gp3 \
  --backup-retention-period 7 \
  --multi-az \
  --vpc-security-group-ids sg-xxx
```

#### 3. Create EC2 Instances

```bash
# Launch EC2 instance
aws ec2 run-instances \
  --image-id ami-xxx \
  --instance-type t3.medium \
  --key-name mynexthome-key \
  --security-group-ids sg-xxx \
  --subnet-id subnet-xxx \
  --user-data file://userdata.sh
```

**userdata.sh**:
```bash
#!/bin/bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install PM2 for process management
npm install -g pm2

# Clone repository (or pull from private registry)
cd /opt
git clone https://github.com/yourusername/mynexthome.git
cd mynexthome/backend

# Install dependencies
npm install

# Build
npm run build

# Set up environment
cat > .env << EOF
DATABASE_URL=postgresql://postgres:password@mynexthome-prod.xxx.rds.amazonaws.com:5432/mynexthome
CENSUS_API_KEY=your_key
PORT=3000
NODE_ENV=production
EOF

# Run migrations
npm run prisma:generate
npx prisma migrate deploy

# Start with PM2
pm2 start dist/api/index.js --name mynexthome-api
pm2 save
pm2 startup
```

#### 4. Set Up Application Load Balancer

```bash
# Create load balancer
aws elbv2 create-load-balancer \
  --name mynexthome-alb \
  --subnets subnet-xxx subnet-yyy \
  --security-groups sg-xxx \
  --scheme internet-facing

# Create target group
aws elbv2 create-target-group \
  --name mynexthome-targets \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxx \
  --health-check-path /health

# Register targets
aws elbv2 register-targets \
  --target-group-arn arn:xxx \
  --targets Id=i-instance1 Id=i-instance2
```

### Option 2: Docker Deployment

#### Dockerfile

Create `backend/Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Generate Prisma client
RUN npm run prisma:generate

# Build TypeScript
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy built app from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Expose port
EXPOSE 3000

# Start app
CMD ["npm", "start"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/mynexthome
      - CENSUS_API_KEY=${CENSUS_API_KEY}
      - NODE_ENV=production
    depends_on:
      - db
    restart: always

  db:
    image: postgres:14-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=mynexthome
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: always

  redis:
    image: redis:7-alpine
    restart: always

volumes:
  postgres-data:
```

#### Deploy with Docker

```bash
# Build and start
docker-compose up -d

# Run migrations
docker-compose exec api npm run prisma:migrate deploy

# View logs
docker-compose logs -f api

# Scale API servers
docker-compose up -d --scale api=3
```

### Option 3: Heroku Deployment

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create mynexthome-api

# Add PostgreSQL
heroku addons:create heroku-postgresql:standard-0

# Add Redis (optional)
heroku addons:create heroku-redis:premium-0

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set CENSUS_API_KEY=your_key

# Deploy
git push heroku main

# Run migrations
heroku run npm run prisma:migrate deploy

# Scale dynos
heroku ps:scale web=2

# View logs
heroku logs --tail
```

## Database Deployment

### PostgreSQL Setup

#### 1. Create Production Database

```sql
-- Connect as admin
psql -h your-db-host.rds.amazonaws.com -U postgres

-- Create database
CREATE DATABASE mynexthome;

-- Create application user
CREATE USER mynexthome_app WITH PASSWORD 'strong_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE mynexthome TO mynexthome_app;
```

#### 2. Run Migrations

```bash
# Set production DATABASE_URL
export DATABASE_URL="postgresql://mynexthome_app:password@your-db-host:5432/mynexthome"

# Generate Prisma client
npm run prisma:generate

# Deploy migrations (non-interactive)
npx prisma migrate deploy
```

#### 3. Verify Schema

```sql
-- List tables
\dt

-- Check indexes
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public';

-- Verify constraints
SELECT conname, contype 
FROM pg_constraint 
WHERE connamespace = 'public'::regnamespace;
```

### Database Configuration

#### Connection Pooling

Use PgBouncer for connection pooling:

```bash
# Install PgBouncer
sudo apt-get install pgbouncer

# Configure /etc/pgbouncer/pgbouncer.ini
[databases]
mynexthome = host=rds-endpoint port=5432 dbname=mynexthome

[pgbouncer]
listen_port = 6432
listen_addr = *
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20
```

Update DATABASE_URL:
```bash
DATABASE_URL="postgresql://user:pass@localhost:6432/mynexthome?pgbouncer=true"
```

#### Performance Tuning

```sql
-- Increase shared buffers (25% of RAM)
ALTER SYSTEM SET shared_buffers = '2GB';

-- Increase effective_cache_size (50-75% of RAM)
ALTER SYSTEM SET effective_cache_size = '6GB';

-- Increase work_mem for complex queries
ALTER SYSTEM SET work_mem = '64MB';

-- Enable parallel queries
ALTER SYSTEM SET max_parallel_workers_per_gather = 4;

-- Reload configuration
SELECT pg_reload_conf();
```

## Application Deployment

### Build Process

```bash
# Navigate to backend
cd backend

# Install production dependencies
npm ci --only=production

# Generate Prisma client
npm run prisma:generate

# Build TypeScript
npm run build

# Verify build
ls -la dist/
```

### Environment Variables

Create `.env.production`:

```bash
# Database
DATABASE_URL=postgresql://user:pass@prod-db-host:5432/mynexthome

# APIs
CENSUS_API_KEY=your_production_key

# Application
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Data
REDFIN_DATA_DIR=/opt/data/redfin

# Optional: Redis
REDIS_URL=redis://prod-redis-host:6379

# Optional: Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
```

### Process Management

#### Option 1: PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Create ecosystem.config.js
module.exports = {
  apps: [{
    name: 'mynexthome-api',
    script: './dist/api/index.js',
    instances: 2,  // Or 'max' for all CPUs
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/mynexthome/error.log',
    out_file: '/var/log/mynexthome/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G',
    autorestart: true,
    watch: false,
  }]
};

# Start
pm2 start ecosystem.config.js --env production

# Save process list
pm2 save

# Setup startup script
pm2 startup systemd

# Monitor
pm2 monit

# View logs
pm2 logs

# Restart
pm2 reload all
```

#### Option 2: systemd

Create `/etc/systemd/system/mynexthome.service`:

```ini
[Unit]
Description=MyNextHome API Server
After=network.target

[Service]
Type=simple
User=mynexthome
WorkingDirectory=/opt/mynexthome/backend
Environment="NODE_ENV=production"
Environment="PORT=3000"
EnvironmentFile=/opt/mynexthome/backend/.env
ExecStart=/usr/bin/node dist/api/index.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=mynexthome

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable mynexthome
sudo systemctl start mynexthome
sudo systemctl status mynexthome
```

### Load Balancing

#### Nginx Configuration

```nginx
upstream mynexthome_api {
    least_conn;
    server 10.0.1.10:3000 max_fails=3 fail_timeout=30s;
    server 10.0.1.11:3000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

server {
    listen 80;
    server_name api.mynexthome.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.mynexthome.com;
    
    # SSL certificates
    ssl_certificate /etc/ssl/certs/mynexthome.crt;
    ssl_certificate_key /etc/ssl/private/mynexthome.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Compression
    gzip on;
    gzip_types application/json text/plain;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;
    
    location / {
        proxy_pass http://mynexthome_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint (no rate limit)
    location /health {
        proxy_pass http://mynexthome_api;
        limit_req off;
    }
}
```

## ETL Job Scheduling

### Option 1: Cron Jobs

```bash
# Edit crontab
crontab -e

# Add ETL schedules
# Daily Redfin ETL at 2 AM UTC
0 2 * * * cd /opt/mynexthome/backend && npm run etl:redfin >> /var/log/mynexthome/etl.log 2>&1

# Daily Investment Scores at 4 AM UTC
0 4 * * * cd /opt/mynexthome/backend && npm run etl:scores zip >> /var/log/mynexthome/etl.log 2>&1

# Monthly Census ETL on 1st at 3 AM UTC
0 3 1 * * cd /opt/mynexthome/backend && npm run etl:census county >> /var/log/mynexthome/etl.log 2>&1
```

### Option 2: BullMQ with Redis

Create `backend/src/jobs/scheduler.ts`:

```typescript
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL);

// Create queue
const etlQueue = new Queue('etl-jobs', { connection });

// Schedule recurring jobs
export async function scheduleETLJobs() {
  // Daily Redfin ETL at 2 AM
  await etlQueue.add('redfin-etl', {}, {
    repeat: { pattern: '0 2 * * *' }
  });
  
  // Daily scores at 4 AM
  await etlQueue.add('scores-etl', { geoType: 'zip' }, {
    repeat: { pattern: '0 4 * * *' }
  });
  
  // Monthly Census on 1st at 3 AM
  await etlQueue.add('census-etl', { geoType: 'county' }, {
    repeat: { pattern: '0 3 1 * *' }
  });
}

// Worker to process jobs
const worker = new Worker('etl-jobs', async job => {
  console.log(`Processing ${job.name}...`);
  
  switch (job.name) {
    case 'redfin-etl':
      await runRedfinETL();
      break;
    case 'census-etl':
      await runCensusETL(job.data.geoType);
      break;
    case 'scores-etl':
      await runScoreCalculation(job.data.geoType);
      break;
  }
}, { connection });

worker.on('completed', job => {
  console.log(`Job ${job.name} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.name} failed:`, err);
});
```

### Option 3: AWS EventBridge

```bash
# Create Lambda function or ECS task for ETL
# Create EventBridge rule
aws events put-rule \
  --name mynexthome-redfin-etl \
  --schedule-expression "cron(0 2 * * ? *)"

# Add target (Lambda/ECS)
aws events put-targets \
  --rule mynexthome-redfin-etl \
  --targets "Id"="1","Arn"="arn:aws:lambda:xxx"
```

## Monitoring and Logging

### Application Monitoring

#### Sentry (Error Tracking)

```bash
npm install @sentry/node
```

```typescript
// backend/src/api/index.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

// Add to Fastify
server.addHook('onError', (request, reply, error, done) => {
  Sentry.captureException(error);
  done();
});
```

#### Logging

```bash
npm install pino pino-pretty
```

```typescript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: { colorize: true }
  }
});

// Use in code
logger.info('Server started on port 3000');
logger.error({ err }, 'Database connection failed');
```

### Health Checks

Ensure `/health` endpoint returns proper status:

```typescript
// Check database connection
server.get('/health', async (request, reply) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected'
    };
  } catch (error) {
    reply.status(503);
    return {
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected'
    };
  }
});
```

### Uptime Monitoring

Use external services:
- **UptimeRobot** (free tier available)
- **Pingdom**
- **New Relic**
- **Datadog**

Configure alerts for:
- API downtime
- Slow response times (> 1 second)
- High error rates (> 1%)
- Database connection issues

## Security Hardening

### API Security

1. **Rate Limiting**
   ```typescript
   import rateLimit from '@fastify/rate-limit';
   
   server.register(rateLimit, {
     max: 100,
     timeWindow: '1 minute'
   });
   ```

2. **CORS**
   ```typescript
   import cors from '@fastify/cors';
   
   server.register(cors, {
     origin: ['https://mynexthome.com'],
     credentials: true
   });
   ```

3. **Helmet (Security Headers)**
   ```typescript
   import helmet from '@fastify/helmet';
   
   server.register(helmet);
   ```

### Database Security

1. **Use SSL Connections**
   ```bash
   DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
   ```

2. **Least Privilege Access**
   ```sql
   -- Read-only user for analytics
   CREATE USER readonly WITH PASSWORD 'xxx';
   GRANT CONNECT ON DATABASE mynexthome TO readonly;
   GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;
   ```

3. **Encrypt Backups**
   ```bash
   pg_dump mynexthome | gpg --encrypt -r admin@mynexthome.com > backup.sql.gpg
   ```

### Secrets Management

Use environment-specific secrets:

```bash
# AWS Secrets Manager
aws secretsmanager create-secret \
  --name mynexthome/prod/database \
  --secret-string '{"url":"postgresql://..."}'

# Retrieve in application
aws secretsmanager get-secret-value \
  --secret-id mynexthome/prod/database \
  --query SecretString \
  --output text
```

## Backup and Disaster Recovery

### Database Backups

#### Automated Backups

```bash
# Backup script: /opt/scripts/backup-db.sh
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/opt/backups
S3_BUCKET=s3://mynexthome-backups

# Dump database
pg_dump $DATABASE_URL | gzip > $BACKUP_DIR/mynexthome_$DATE.sql.gz

# Upload to S3
aws s3 cp $BACKUP_DIR/mynexthome_$DATE.sql.gz $S3_BUCKET/

# Keep only last 30 days locally
find $BACKUP_DIR -name "mynexthome_*.sql.gz" -mtime +30 -delete

# Cron schedule (daily at 1 AM)
# 0 1 * * * /opt/scripts/backup-db.sh
```

#### Restore Process

```bash
# Download from S3
aws s3 cp s3://mynexthome-backups/mynexthome_20240118.sql.gz ./

# Restore
gunzip mynexthome_20240118.sql.gz
psql $DATABASE_URL < mynexthome_20240118.sql
```

### Application Recovery

1. **Version Control**: All code in Git
2. **Docker Images**: Versioned and stored in registry
3. **Infrastructure as Code**: Terraform/CloudFormation templates
4. **Runbooks**: Document recovery procedures

### Disaster Recovery Plan

**RTO (Recovery Time Objective)**: 4 hours
**RPO (Recovery Point Objective)**: 1 hour

**Recovery Steps**:
1. Provision new infrastructure (1 hour)
2. Restore database from backup (1 hour)
3. Deploy application (30 minutes)
4. Verify functionality (30 minutes)
5. Update DNS if needed (1 hour propagation)

## Post-Deployment

### Smoke Tests

```bash
# Health check
curl https://api.mynexthome.com/health

# Test API endpoints
curl "https://api.mynexthome.com/markets/top?limit=10"

# Check database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM dim_geography;"
```

### Performance Testing

```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Load test
ab -n 1000 -c 10 https://api.mynexthome.com/health
```

### Documentation

- [ ] Document production URLs
- [ ] Document access credentials (securely)
- [ ] Update runbooks
- [ ] Share deployment info with team

### Monitoring Dashboards

Set up dashboards for:
- API request rate
- Response times (p50, p95, p99)
- Error rates
- Database connection pool
- Memory/CPU usage
- ETL job success/failure

Congratulations! Your application is now deployed to production! 🎉
