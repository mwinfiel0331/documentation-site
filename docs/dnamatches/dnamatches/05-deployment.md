# Deployment Guide

## Overview

This guide covers deploying the DNA Matches Scraper to production environments. Since this is a personal-use scraper tool, "production" typically means a reliable, scheduled execution environment rather than a traditional web application deployment.

## Deployment Options

### Option 1: Local Scheduled Execution (Recommended)

**Best for**: Personal use on a home computer or laptop

**Pros**:

* Simple setup
* No hosting costs
* Full control over execution
* Data stays local

**Cons**:

* Requires computer to be running
* Manual maintenance
* No remote access

### Option 2: Cloud Virtual Machine

**Best for**: Scheduled execution without keeping local machine running

**Pros**:

* Always available
* Automated scheduling
* Remote access

**Cons**:

* Hosting costs ($5-10/month)
* Requires cloud account
* More complex setup

### Option 3: Serverless Function

**Best for**: Infrequent, scheduled scraping

**Pros**:

* Pay per execution
* No server management
* Highly scalable

**Cons**:

* More complex setup
* Cold start delays
* Execution time limits

## Production Environment Setup

### Prerequisites

1. **Secure Credentials Storage**
2. **Automated Scheduling**
3. **Log Management**
4. **Error Notifications**
5. **Data Backup Strategy**

## Option 1: Local Scheduled Execution

### On macOS/Linux with Cron

#### 1. Create Deployment Directory

```bash
mkdir -p ~/dna-scraper
cd ~/dna-scraper
git clone https://github.com/mwinfiel0331/dnamatches.git
cd dnamatches
```

#### 2. Set Up Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
playwright install chromium
```

#### 3. Create Production Config

```bash
cp config.ini.example config.ini
chmod 600 config.ini  # Secure the file
nano config.ini
```

Add your credentials:

```ini
[23andme]
email = your_email@example.com
password = your_password_here

[scraper]
delay = 3
max_matches = 0
output_dir = /home/username/dna-scraper/dnamatches/output
```

#### 4. Create Wrapper Script

Create `run_scraper.sh`:

```bash
#!/bin/bash

# Wrapper script for running DNA scraper in production

# Navigate to project directory
cd /home/username/dna-scraper/dnamatches

# Activate virtual environment
source venv/bin/activate

# Run scraper with output logging
python dna_scraper.py >> logs/scraper.log 2>&1

# Deactivate virtual environment
deactivate

# Optional: Compress old logs
find logs/ -name "*.log" -mtime +30 -exec gzip {} \;

# Optional: Backup output files
tar -czf backups/dna-data-$(date +%Y%m%d).tar.gz output/

# Optional: Send completion email
# echo "DNA scraper completed at $(date)" | mail -s "DNA Scraper Status" you@example.com
```

Make it executable:

```bash
chmod +x run_scraper.sh
```

#### 5. Create Logs and Backup Directories

```bash
mkdir -p logs backups
```

#### 6. Set Up Cron Job

Edit crontab:

```bash
crontab -e
```

Add scheduled execution (runs weekly on Sunday at 2 AM):

```cron
0 2 * * 0 /home/username/dna-scraper/dnamatches/run_scraper.sh
```

Cron schedule examples:

* Daily at 2 AM: `0 2 * * *`
* Weekly on Sunday at 2 AM: `0 2 * * 0`
* Monthly on 1st at 2 AM: `0 2 1 * *`
* Every 6 hours: `0 */6 * * *`

#### 7. Test Cron Setup

Run the script manually first:

```bash
./run_scraper.sh
```

Check logs:

```bash
tail -f logs/scraper.log
```

### On Windows with Task Scheduler

#### 1. Set Up Project

Same as above, but use Windows paths:

```
C:\Users\YourName\dna-scraper\dnamatches
```

#### 2. Create Batch Script

Create `run_scraper.bat`:

```batch
@echo off
cd C:\Users\YourName\dna-scraper\dnamatches
call venv\Scripts\activate
python dna_scraper.py >> logs\scraper.log 2>&1
call deactivate
```

#### 3. Create Scheduled Task

1. Open Task Scheduler
2. Create Basic Task
3. Name: "DNA Scraper"
4. Trigger: Weekly
5. Action: Start a program
6. Program: `C:\Users\YourName\dna-scraper\dnamatches\run_scraper.bat`
7. Finish

## Option 2: Cloud VM Deployment (AWS/GCP/Azure)

### AWS EC2 Example

#### 1. Launch EC2 Instance

* Instance type: t3.micro (free tier eligible)
* OS: Ubuntu 22.04 LTS
* Storage: 8 GB
* Security group: No inbound rules needed (outbound only)

#### 2. Connect to Instance

```bash
ssh -i your-key.pem ubuntu@your-instance-ip
```

#### 3. Install Dependencies

```bash
sudo apt update
sudo apt install -y python3 python3-pip python3-venv git

# Install Playwright system dependencies
sudo apt install -y libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 \
    libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2
```

#### 4. Clone and Setup

```bash
cd ~
git clone https://github.com/mwinfiel0331/dnamatches.git
cd dnamatches
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
playwright install chromium
```

#### 5. Configure

```bash
cp config.ini.example config.ini
chmod 600 config.ini
nano config.ini
```

#### 6. Set Up Cron

Same as local setup above.

#### 7. Configure AWS CloudWatch (Optional)

For log monitoring and alerts:

```bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb
```

Configure agent to send logs to CloudWatch.

### DigitalOcean Droplet Example

#### 1. Create Droplet

* Size: Basic ($4-6/month)
* OS: Ubuntu 22.04
* Datacenter: Nearest to you

#### 2. Setup

Same as AWS EC2 steps above.

## Option 3: Serverless Deployment

### AWS Lambda Example

#### Limitations

* 15-minute execution timeout
* May not be suitable for large scraping jobs

#### Setup

##### 1. Create Lambda Layer for Dependencies

```bash
mkdir python
pip install playwright -t python/
zip -r playwright-layer.zip python
```

Upload to AWS Lambda as a layer.

##### 2. Create Lambda Function

```python
# lambda_function.py
import json
import os
from dna_scraper import DNAMatchesScraper

def lambda_handler(event, context):
    """AWS Lambda handler for DNA scraper."""
    
    # Get credentials from environment variables
    email = os.environ['DNA_EMAIL']
    password = os.environ['DNA_PASSWORD']
    
    # Initialize scraper
    scraper = DNAMatchesScraper(
        email=email,
        password=password,
        output_dir='/tmp/output',
        delay=2
    )
    
    try:
        # Run scraper
        scraper.run(scrape_relatives=True, max_matches=10)
        
        # Upload results to S3 (implementation needed)
        # upload_to_s3('/tmp/output')
        
        return {
            'statusCode': 200,
            'body': json.dumps('Scraping completed successfully')
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error: {str(e)}')
        }
```

##### 3. Configure Environment Variables

* `DNA_EMAIL`: Your 23andMe email
* `DNA_PASSWORD`: Your 23andMe password

##### 4. Set Up EventBridge Trigger

Schedule the Lambda function to run periodically.

## Security Best Practices

### Credentials Management

#### Option 1: Environment Variables

```bash
# On Linux/macOS
export DNA_EMAIL="your_email@example.com"
export DNA_PASSWORD="your_password"
```

Modify code to read from environment:

```python
email = os.getenv('DNA_EMAIL', config.get('23andme', 'email'))
password = os.getenv('DNA_PASSWORD', config.get('23andme', 'password'))
```

#### Option 2: AWS Secrets Manager

```python
import boto3
import json

def get_secret():
    secret_name = "dna-scraper-credentials"
    region_name = "us-east-1"
    
    session = boto3.session.Session()
    client = session.client(
        service_name='secretsmanager',
        region_name=region_name
    )
    
    get_secret_value_response = client.get_secret_value(
        SecretId=secret_name
    )
    
    secret = json.loads(get_secret_value_response['SecretString'])
    return secret['email'], secret['password']
```

#### Option 3: Encrypted Config File

```bash
# Encrypt config.ini
gpg -c config.ini

# Decrypt before running
gpg -d config.ini.gpg > config.ini
python dna_scraper.py
rm config.ini  # Remove after execution
```

### File Permissions

```bash
# Secure config file
chmod 600 config.ini

# Secure output directory
chmod 700 output/

# Secure scripts
chmod 700 run_scraper.sh
```

### Firewall Configuration

For cloud VMs:

* No inbound ports needed
* Only allow outbound HTTPS (443)
* Restrict SSH (22) to your IP only

## Monitoring and Logging

### Log Rotation

Create `/etc/logrotate.d/dna-scraper`:

```
/home/username/dna-scraper/dnamatches/logs/*.log {
    weekly
    rotate 8
    compress
    delaycompress
    missingok
    notifempty
}
```

### Error Notifications

#### Email Notifications

Install mailutils:

```bash
sudo apt install mailutils
```

Modify `run_scraper.sh`:

```bash
if python dna_scraper.py >> logs/scraper.log 2>&1; then
    echo "Scraping completed successfully at $(date)" | \
        mail -s "DNA Scraper: Success" you@example.com
else
    echo "Scraping failed at $(date). Check logs." | \
        mail -s "DNA Scraper: FAILED" you@example.com
fi
```

#### Slack Notifications

```bash
# Add to run_scraper.sh
SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

if python dna_scraper.py >> logs/scraper.log 2>&1; then
    curl -X POST -H 'Content-type: application/json' \
        --data '{"text":"DNA Scraper completed successfully"}' \
        $SLACK_WEBHOOK
else
    curl -X POST -H 'Content-type: application/json' \
        --data '{"text":"DNA Scraper FAILED - check logs"}' \
        $SLACK_WEBHOOK
fi
```

## Data Backup Strategy

### Local Backups

```bash
#!/bin/bash
# backup_data.sh

BACKUP_DIR="/home/username/backups"
DATA_DIR="/home/username/dna-scraper/dnamatches/output"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup
tar -czf "$BACKUP_DIR/dna-data-$DATE.tar.gz" "$DATA_DIR"

# Remove backups older than 90 days
find "$BACKUP_DIR" -name "dna-data-*.tar.gz" -mtime +90 -delete
```

### Cloud Backups

#### Sync to AWS S3

```bash
# Install AWS CLI
sudo apt install awscli

# Configure credentials
aws configure

# Sync output directory to S3
aws s3 sync output/ s3://your-bucket/dna-data/
```

Add to cron:

```cron
0 3 * * 0 aws s3 sync /home/ubuntu/dnamatches/output/ s3://your-bucket/dna-data/
```

#### Sync to Google Drive

```bash
# Install rclone
curl https://rclone.org/install.sh | sudo bash

# Configure Google Drive
rclone config

# Sync to Google Drive
rclone sync output/ gdrive:dna-data/
```

## Performance Tuning

### For Large Datasets

```ini
[scraper]
delay = 1  # Reduce delay if 23andMe allows
max_matches = 0  # Process all
```

### Memory Optimization

For very large datasets (thousands of matches), modify code to write to CSV incrementally instead of storing all in memory.

## Health Checks

Create `healthcheck.sh`:

```bash
#!/bin/bash

# Check if scraper ran in last 7 days
LAST_RUN=$(find logs/ -name "scraper.log" -mtime -7)

if [ -z "$LAST_RUN" ]; then
    echo "WARNING: Scraper hasn't run in 7 days"
    exit 1
fi

# Check if output files exist
if [ ! -f "output/all_dna_matches.csv" ]; then
    echo "ERROR: Output file missing"
    exit 1
fi

echo "Health check passed"
exit 0
```

## Rollback Procedure

If deployment fails:

```bash
# Stop any running scraper processes
pkill -f dna_scraper.py

# Remove cron job
crontab -e
# Delete the scraper line

# Revert to previous version
cd ~/dna-scraper/dnamatches
git log --oneline
git checkout <previous-commit-hash>

# Reinstall dependencies
source venv/bin/activate
pip install -r requirements.txt

# Re-add cron job
crontab -e
```

## Disaster Recovery

### Backup Configuration

```bash
# Backup entire setup
tar -czf dna-scraper-backup.tar.gz \
    ~/dna-scraper/dnamatches \
    --exclude=venv \
    --exclude=output \
    --exclude=logs
```

### Restore from Backup

```bash
# Extract backup
tar -xzf dna-scraper-backup.tar.gz

# Recreate virtual environment
cd dnamatches
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
playwright install chromium

# Restore cron job
crontab -e
```

## Production Checklist

* \[ ] Credentials secured (not in version control)
* \[ ] File permissions set correctly (600 for config, 700 for scripts)
* \[ ] Virtual environment created and activated
* \[ ] All dependencies installed
* \[ ] Playwright browsers installed
* \[ ] Output and log directories created
* \[ ] Wrapper script created and tested
* \[ ] Cron job configured and tested
* \[ ] Logging configured
* \[ ] Error notifications set up
* \[ ] Backup strategy implemented
* \[ ] Health checks in place
* \[ ] Documentation updated with deployment details

## Troubleshooting Production Issues

### Issue: Cron job not running

```bash
# Check cron service
sudo systemctl status cron

# Check cron logs
grep CRON /var/log/syslog

# Verify crontab
crontab -l
```

### Issue: Permission denied

```bash
# Fix permissions
chmod 600 config.ini
chmod 700 run_scraper.sh
chmod 755 output/
```

### Issue: Out of disk space

```bash
# Check disk usage
df -h

# Clean old logs
find logs/ -name "*.log" -mtime +30 -delete

# Clean old backups
find backups/ -name "*.tar.gz" -mtime +90 -delete
```

### Issue: Playwright fails in headless mode

Ensure all dependencies are installed:

```bash
playwright install-deps
```

## Cost Estimation

### Local Deployment

* **Cost**: $0 (uses existing hardware)
* **Electricity**: Negligible

### AWS EC2 t3.micro

* **Instance**: $0.0104/hour × 730 hours = ~$7.50/month
* **Storage**: 8 GB × $0.10/GB = $0.80/month
* **Total**: ~$8.30/month

### DigitalOcean Droplet

* **Basic Droplet**: $4-6/month
* **Storage**: Included

### AWS Lambda

* **Execution**: Free tier covers most personal use
* **Storage (S3)**: ~$0.50/month for data storage
* **Total**: \&lt;$1/month
