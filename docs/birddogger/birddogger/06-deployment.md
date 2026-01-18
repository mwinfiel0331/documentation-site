# BirdDogger - Production Deployment Guide

## Deployment Overview

This guide covers deploying the BirdDogger application to production environments including cloud platforms, containerization, monitoring, and best practices.

**Recommended Platforms**:
- AWS (Amazon Web Services) - Primary recommendation
- Azure - Alternative option
- Google Cloud Platform - Alternative option
- Railway / Render - Quick deployment option

---

## Pre-Deployment Checklist

### Code Preparation

- [ ] All tests passing (`npm run lint`, `npm run build`)
- [ ] TypeScript compilation successful
- [ ] Environment variables documented
- [ ] Database migrations tested
- [ ] No hardcoded secrets or credentials
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] API documentation up to date

### Infrastructure Planning

- [ ] Cloud platform account created
- [ ] Domain name registered (optional)
- [ ] SSL/TLS certificate obtained
- [ ] Database hosting decided
- [ ] Backup strategy defined
- [ ] Monitoring tools selected
- [ ] Budget approved

---

## Deployment Option 1: AWS (Recommended)

### Architecture Overview

```
                    ┌─────────────────┐
                    │   Route 53      │
                    │   (DNS)         │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  CloudFront     │
                    │  (CDN)          │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  ALB            │
                    │  (Load Balancer)│
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
    ┌─────────▼─────────┐         ┌────────▼────────┐
    │   ECS/Fargate     │         │   ECS/Fargate   │
    │   API Server 1    │         │   API Server 2  │
    └─────────┬─────────┘         └────────┬────────┘
              │                             │
              └──────────────┬──────────────┘
                             │
                    ┌────────▼────────┐
                    │   RDS           │
                    │   PostgreSQL    │
                    │   (Multi-AZ)    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   S3            │
                    │   (Backups)     │
                    └─────────────────┘
```

### Step 1: Set Up RDS PostgreSQL

**1.1. Create RDS Instance**:

Navigate to AWS Console → RDS → Create database

**Settings**:
- Engine: PostgreSQL 15
- Template: Production
- DB Instance Class: db.t3.micro (start small, scale up)
- Storage: 20 GB SSD (auto-scaling enabled)
- Multi-AZ: Yes (for production)
- VPC: Default or custom
- Public access: No
- Database name: `birddogger`
- Master username: `birddogger_admin`
- Master password: [generate strong password]

**Security Group**: Allow PostgreSQL (5432) from API servers only

**1.2. Note Connection Details**:
```
Endpoint: birddogger.xxxxx.us-east-1.rds.amazonaws.com
Port: 5432
Database: birddogger
```

**1.3. Create DATABASE_URL**:
```
postgresql://birddogger_admin:PASSWORD@birddogger.xxxxx.us-east-1.rds.amazonaws.com:5432/birddogger?schema=public
```

### Step 2: Build Docker Image

**2.1. Create Dockerfile**:

```dockerfile
# Production Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Expose port
EXPOSE 8080

# Run migrations and start
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
```

**2.2. Build and Test Locally**:
```bash
docker build -t birddogger:latest .

docker run -p 8080:8080 \
  -e DATABASE_URL="your-database-url" \
  -e PORT=8080 \
  -e NODE_ENV=production \
  birddogger:latest
```

### Step 3: Push to Amazon ECR

**3.1. Create ECR Repository**:
```bash
aws ecr create-repository --repository-name birddogger
```

**3.2. Authenticate Docker**:
```bash
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  123456789012.dkr.ecr.us-east-1.amazonaws.com
```

**3.3. Tag and Push**:
```bash
docker tag birddogger:latest \
  123456789012.dkr.ecr.us-east-1.amazonaws.com/birddogger:latest

docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/birddogger:latest
```

### Step 4: Deploy to ECS Fargate

**4.1. Create ECS Cluster**:
```bash
aws ecs create-cluster --cluster-name birddogger-cluster
```

**4.2. Create Task Definition** (`task-definition.json`):
```json
{
  "family": "birddogger-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "birddogger-api",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/birddogger:latest",
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "PORT",
          "value": "8080"
        },
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:birddogger/db-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/birddogger",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "api"
        }
      }
    }
  ]
}
```

**4.3. Register Task Definition**:
```bash
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

**4.4. Create ECS Service**:
```bash
aws ecs create-service \
  --cluster birddogger-cluster \
  --service-name birddogger-service \
  --task-definition birddogger-task \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-12345,subnet-67890],securityGroups=[sg-12345],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/birddogger-tg,containerName=birddogger-api,containerPort=8080"
```

### Step 5: Configure Application Load Balancer

**5.1. Create ALB**:
- Navigate to EC2 → Load Balancers → Create Load Balancer
- Type: Application Load Balancer
- Scheme: Internet-facing
- Listeners: HTTP (80) and HTTPS (443)

**5.2. Create Target Group**:
- Target type: IP
- Protocol: HTTP
- Port: 8080
- Health check path: `/health`

**5.3. Add SSL Certificate**:
- Request certificate via AWS Certificate Manager
- Attach to HTTPS listener

### Step 6: Set Up CloudWatch Monitoring

**6.1. Create Log Group**:
```bash
aws logs create-log-group --log-group-name /ecs/birddogger
```

**6.2. Create CloudWatch Alarms**:

**High CPU Alarm**:
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name birddogger-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

**High Memory Alarm**:
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name birddogger-high-memory \
  --alarm-description "Alert when memory exceeds 80%" \
  --metric-name MemoryUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

### Step 7: Configure Auto Scaling

**7.1. Register Scalable Target**:
```bash
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/birddogger-cluster/birddogger-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10
```

**7.2. Create Scaling Policy**:
```bash
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/birddogger-cluster/birddogger-service \
  --policy-name birddogger-cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

**scaling-policy.json**:
```json
{
  "TargetValue": 70.0,
  "PredefinedMetricSpecification": {
    "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
  },
  "ScaleInCooldown": 300,
  "ScaleOutCooldown": 60
}
```

---

## Deployment Option 2: Railway (Quick Deployment)

### Advantages
- Extremely simple deployment
- Free tier available
- Automatic HTTPS
- GitHub integration

### Steps

**1. Create Railway Account**: https://railway.app

**2. Create New Project** → Deploy from GitHub

**3. Add PostgreSQL Database**:
- Click "New" → Database → PostgreSQL
- Railway automatically provides DATABASE_URL

**4. Configure Service**:
- Root Directory: `/`
- Build Command: `npm install && npm run build && npx prisma generate`
- Start Command: `npm run start:prod`

**5. Add Environment Variables**:
```
NODE_ENV=production
PORT=8080
```

**6. Deploy**:
- Push to GitHub → Automatic deployment
- Railway provides a URL: `birddogger.railway.app`

**Cost**: ~$5-20/month depending on usage

---

## Deployment Option 3: Azure

### Step 1: Create Azure Resources

**1.1. Create Resource Group**:
```bash
az group create --name birddogger-rg --location eastus
```

**1.2. Create PostgreSQL**:
```bash
az postgres flexible-server create \
  --resource-group birddogger-rg \
  --name birddogger-db \
  --location eastus \
  --admin-user birddogger_admin \
  --admin-password [PASSWORD] \
  --sku-name Standard_B1ms \
  --version 15 \
  --storage-size 32
```

**1.3. Create Container Registry**:
```bash
az acr create \
  --resource-group birddogger-rg \
  --name birddoggeracr \
  --sku Basic
```

**1.4. Build and Push Image**:
```bash
az acr build \
  --registry birddoggeracr \
  --image birddogger:latest \
  .
```

**1.5. Create App Service**:
```bash
az webapp create \
  --resource-group birddogger-rg \
  --plan birddogger-plan \
  --name birddogger-api \
  --deployment-container-image-name birddoggeracr.azurecr.io/birddogger:latest
```

**1.6. Configure Environment Variables**:
```bash
az webapp config appsettings set \
  --resource-group birddogger-rg \
  --name birddogger-api \
  --settings DATABASE_URL="postgresql://..." NODE_ENV=production
```

---

## Database Migrations in Production

### Strategy 1: Automated Migrations (Recommended for MVP)

**In Dockerfile**:
```dockerfile
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
```

**Pros**: Simple, automatic
**Cons**: Downtime during migrations

### Strategy 2: Manual Migrations (Production Best Practice)

**Before Deployment**:
```bash
# SSH to production server or run in container
npx prisma migrate deploy
```

**Then Deploy** new application version

### Strategy 3: Blue-Green Deployment

1. Run migrations on database
2. Deploy new version alongside old version
3. Switch traffic to new version
4. Shut down old version

---

## Environment Variables Management

### AWS Secrets Manager

**Store DATABASE_URL**:
```bash
aws secretsmanager create-secret \
  --name birddogger/db-url \
  --secret-string "postgresql://..."
```

**Reference in ECS Task Definition**:
```json
{
  "secrets": [
    {
      "name": "DATABASE_URL",
      "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:birddogger/db-url"
    }
  ]
}
```

### Railway

Environment variables set in UI are automatically encrypted and injected.

### Azure Key Vault

```bash
az keyvault create \
  --name birddogger-vault \
  --resource-group birddogger-rg

az keyvault secret set \
  --vault-name birddogger-vault \
  --name database-url \
  --value "postgresql://..."
```

---

## Backup and Disaster Recovery

### Automated Database Backups (RDS)

**Configure Backup Retention**:
- Backup retention: 7 days (minimum)
- Backup window: 03:00-04:00 UTC
- Maintenance window: Sunday 04:00-05:00 UTC

**Manual Backup**:
```bash
aws rds create-db-snapshot \
  --db-instance-identifier birddogger-db \
  --db-snapshot-identifier birddogger-backup-$(date +%Y%m%d)
```

### Point-in-Time Recovery

Enable PITR in RDS settings (enabled by default).

**Restore to point in time**:
```bash
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier birddogger-db \
  --target-db-instance-identifier birddogger-restored \
  --restore-time 2024-11-22T10:00:00Z
```

### Backup to S3

**Create backup script**:
```bash
#!/bin/bash
# backup.sh

PGPASSWORD=PASSWORD pg_dump \
  -h birddogger.xxxxx.rds.amazonaws.com \
  -U birddogger_admin \
  -d birddogger \
  | gzip > backup-$(date +%Y%m%d).sql.gz

aws s3 cp backup-$(date +%Y%m%d).sql.gz \
  s3://birddogger-backups/
```

**Schedule with cron** (on EC2 or ECS scheduled task):
```
0 2 * * * /path/to/backup.sh
```

---

## Monitoring and Alerting

### CloudWatch Dashboards

**Create Dashboard**:
```bash
aws cloudwatch put-dashboard \
  --dashboard-name birddogger \
  --dashboard-body file://dashboard.json
```

**dashboard.json**:
```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ECS", "CPUUtilization", {"stat": "Average"}],
          [".", "MemoryUtilization", {"stat": "Average"}]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "ECS Performance"
      }
    }
  ]
}
```

### Application Monitoring

**Log All Requests**:
```typescript
// src/index.ts
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});
```

**Error Tracking** (future):
- Sentry
- Rollbar
- Datadog

### Uptime Monitoring

**Use Services**:
- UptimeRobot (free)
- Pingdom
- StatusCake

**Monitor**: `https://api.birddogger.com/health`

---

## SSL/TLS Configuration

### AWS Certificate Manager

**Request Certificate**:
```bash
aws acm request-certificate \
  --domain-name api.birddogger.com \
  --validation-method DNS
```

**Validate** via DNS records in Route 53

**Attach to ALB** in HTTPS listener

### Let's Encrypt (Self-Hosted)

```bash
sudo certbot --nginx -d api.birddogger.com
```

---

## Performance Optimization

### Database Connection Pooling

**Prisma Configuration**:
```typescript
// src/utils/prisma.ts
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
});

// Connection pool size (set in DATABASE_URL)
// postgresql://user:pass@host:5432/db?connection_limit=10
```

### CDN for Static Assets

Use CloudFront for:
- API documentation
- Static files (future)
- Media files

### Database Optimization

**Enable Query Performance Insights** in RDS

**Add Indexes** (already configured in schema):
```sql
CREATE INDEX idx_listing_score ON "Listing" (score DESC);
CREATE INDEX idx_listing_hotness ON "Listing" (hotness);
```

**Analyze Query Performance**:
```sql
EXPLAIN ANALYZE SELECT * FROM "Listing" WHERE hotness = 'HIGH' ORDER BY score DESC LIMIT 20;
```

---

## Security Hardening

### Network Security

- **VPC**: Deploy in private subnets
- **Security Groups**: Restrict access to necessary ports only
- **Network ACLs**: Additional layer of security

### Application Security

**Rate Limiting** (add middleware):
```bash
npm install express-rate-limit
```

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

**CORS Configuration**:
```typescript
import cors from 'cors';

app.use(cors({
  origin: ['https://birddogger.com', 'https://app.birddogger.com'],
  credentials: true,
}));
```

**Helmet.js** (security headers):
```bash
npm install helmet
```

```typescript
import helmet from 'helmet';
app.use(helmet());
```

### Database Security

- **Encryption at Rest**: Enable in RDS
- **Encryption in Transit**: Require SSL connections
- **IAM Authentication**: Use IAM roles instead of passwords (AWS)
- **Least Privilege**: Grant minimal permissions

---

## CI/CD Pipeline

### GitHub Actions

**.github/workflows/deploy.yml**:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build, tag, and push image to Amazon ECR
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: birddogger
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
      
      - name: Update ECS service
        run: |
          aws ecs update-service \
            --cluster birddogger-cluster \
            --service birddogger-service \
            --force-new-deployment
```

---

## Cost Optimization

### AWS Cost Estimates (Monthly)

| Service | Configuration | Estimated Cost |
|---------|--------------|----------------|
| RDS PostgreSQL | db.t3.micro, 20GB | $15-25 |
| ECS Fargate | 2 tasks, 0.25 vCPU, 0.5 GB | $15-20 |
| ALB | 1 load balancer | $16 |
| CloudWatch | Logs, metrics | $5-10 |
| **Total** | | **$51-71/month** |

### Railway Cost Estimate

| Service | Configuration | Estimated Cost |
|---------|--------------|----------------|
| App + Database | Starter | $5-20/month |

### Cost Reduction Tips

1. **Use Reserved Instances** for predictable workloads
2. **Enable auto-scaling** to scale down during low traffic
3. **Use spot instances** for non-critical tasks
4. **Clean up unused resources** regularly
5. **Monitor costs** with AWS Budgets

---

## Rollback Strategy

### Quick Rollback (ECS)

**Revert to previous task definition**:
```bash
aws ecs update-service \
  --cluster birddogger-cluster \
  --service birddogger-service \
  --task-definition birddogger-task:PREVIOUS_VERSION
```

### Database Rollback

**Restore from snapshot**:
```bash
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier birddogger-restored \
  --db-snapshot-identifier birddogger-backup-20241122
```

---

## Post-Deployment Validation

### Smoke Tests

```bash
# Health check
curl https://api.birddogger.com/health

# Create test wholesaler
curl -X POST https://api.birddogger.com/api/wholesalers \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test","markets":["Tampa"]}'

# List wholesalers
curl https://api.birddogger.com/api/wholesalers

# Delete test wholesaler
curl -X DELETE https://api.birddogger.com/api/wholesalers/{id}
```

### Performance Check

```bash
# Response time
time curl https://api.birddogger.com/api/listings

# Load test
ab -n 100 -c 10 https://api.birddogger.com/api/wholesalers
```

---

## Maintenance Windows

**Schedule**: Every Sunday, 3:00-5:00 AM UTC

**Activities**:
- Database maintenance (automated)
- Security patches (automated)
- Performance optimization
- Backup verification

**Communication**: Notify users 48 hours in advance

---

## Documentation for Operations

### Runbook

Create `docs/runbooks/production.md` with:
- Deployment procedures
- Rollback procedures
- Incident response
- Common issues and solutions

### Contact Information

- **On-call engineer**: [phone/email]
- **AWS Support**: [account number]
- **Database admin**: [contact]

---

## Compliance and Legal

### Data Privacy

- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] GDPR compliance (if applicable)
- [ ] Data retention policy implemented
- [ ] User data export capability

### Security Compliance

- [ ] Regular security audits
- [ ] Penetration testing (annual)
- [ ] Dependency updates (monthly)
- [ ] Access logs retained

---

## Next Steps After Deployment

1. **Monitor for 24 hours**: Watch logs and metrics
2. **Performance tuning**: Optimize based on real traffic
3. **User feedback**: Collect and address issues
4. **Scale as needed**: Adjust resources based on usage
5. **Iterate**: Plan next features and improvements

For issues during deployment, refer to troubleshooting in [04-local-development.md](./04-local-development.md).
