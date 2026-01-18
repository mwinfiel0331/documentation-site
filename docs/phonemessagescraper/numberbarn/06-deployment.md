# Deployment Documentation

## Overview

This document provides instructions for deploying the Phone Message Scraper application to production environments. The application can be deployed in various configurations depending on use case requirements.

## Deployment Options

### 1. Local Production Deployment
### 2. Scheduled Execution (Cron/Task Scheduler)
### 3. Cloud Deployment (AWS/GCP/Azure)
### 4. Container Deployment (Docker)
### 5. Serverless Deployment (AWS Lambda)

## Pre-Deployment Checklist

Before deploying to production:

- [ ] All dependencies listed in `requirements.txt`
- [ ] Python 3.7+ available on target system
- [ ] ChromeDriver compatible with Chrome version (for NumberBarn)
- [ ] Sufficient disk space for output files
- [ ] Network access to target websites
- [ ] Credentials available (for NumberBarn)
- [ ] Output directory writable
- [ ] Backup strategy defined
- [ ] Monitoring plan established
- [ ] Error alerting configured

## 1. Local Production Deployment

### Setup on Production Server

#### On Linux/Ubuntu Server

```bash
# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Python 3
sudo apt-get install -y python3 python3-pip python3-venv

# Install Chrome (for NumberBarn)
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt-get install -f -y

# Install ChromeDriver
CHROME_VERSION=$(google-chrome --version | grep -oP '\d+\.\d+\.\d+')
CHROMEDRIVER_VERSION=$(curl -s "https://chromedriver.storage.googleapis.com/LATEST_RELEASE_${CHROME_VERSION%%.*}")
wget "https://chromedriver.storage.googleapis.com/${CHROMEDRIVER_VERSION}/chromedriver_linux64.zip"
unzip chromedriver_linux64.zip
sudo mv chromedriver /usr/local/bin/
sudo chmod +x /usr/local/bin/chromedriver

# Create application user
sudo useradd -m -s /bin/bash scraper
sudo su - scraper

# Clone repository
git clone https://github.com/mwinfiel0331/phonemessagescraper.git
cd phonemessagescraper

# Setup virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install selenium

# Test installation
python verify_chromedriver.py
```

#### On Windows Server

```powershell
# Install Python 3 from python.org
# Download and install Chrome
# Download ChromeDriver and add to PATH

# Clone repository
git clone https://github.com/mwinfiel0331/phonemessagescraper.git
cd phonemessagescraper

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install selenium

# Test
python verify_chromedriver.py
```

### Configuration

Create `config.py` (production settings):

```python
# config.py
import os

# Production settings
OUTPUT_DIR = os.getenv('SCRAPER_OUTPUT_DIR', '/var/scraper/output')
DELAY_BETWEEN_REQUESTS = float(os.getenv('SCRAPER_DELAY', '2.0'))
HEADLESS_MODE = os.getenv('SCRAPER_HEADLESS', 'true').lower() == 'true'
CHROME_DRIVER_PATH = os.getenv('CHROME_DRIVER_PATH', '/usr/local/bin/chromedriver')

# Logging
LOG_DIR = os.getenv('SCRAPER_LOG_DIR', '/var/log/scraper')
LOG_LEVEL = os.getenv('SCRAPER_LOG_LEVEL', 'INFO')

# Output retention
MAX_OUTPUT_AGE_DAYS = int(os.getenv('MAX_OUTPUT_AGE_DAYS', '30'))
```

Create systemd service (Linux):

```ini
# /etc/systemd/system/phone-scraper.service
[Unit]
Description=Phone Message Scraper
After=network.target

[Service]
Type=oneshot
User=scraper
Group=scraper
WorkingDirectory=/home/scraper/phonemessagescraper
Environment="PATH=/home/scraper/phonemessagescraper/.venv/bin"
ExecStart=/home/scraper/phonemessagescraper/.venv/bin/python phone_scraper.py --file /etc/scraper/urls.txt
StandardOutput=append:/var/log/scraper/scraper.log
StandardError=append:/var/log/scraper/scraper-error.log

[Install]
WantedBy=multi-user.target
```

Enable and test:
```bash
sudo systemctl daemon-reload
sudo systemctl enable phone-scraper.service
sudo systemctl start phone-scraper.service
sudo systemctl status phone-scraper.service
```

## 2. Scheduled Execution

### Using Cron (Linux/macOS)

```bash
# Edit crontab
crontab -e

# Add scheduled job (runs daily at 2 AM)
0 2 * * * cd /home/scraper/phonemessagescraper && .venv/bin/python phone_scraper.py --file /etc/scraper/urls.txt >> /var/log/scraper/cron.log 2>&1

# Weekly execution (Monday at 3 AM)
0 3 * * 1 cd /home/scraper/phonemessagescraper && .venv/bin/python complete_message_extractor.py >> /var/log/scraper/numberbarn.log 2>&1

# Cleanup old output files (monthly)
0 4 1 * * find /var/scraper/output -name "*.csv" -mtime +30 -delete
```

**Cron Schedule Examples**:
- `0 * * * *` - Every hour
- `*/30 * * * *` - Every 30 minutes
- `0 0 * * *` - Daily at midnight
- `0 0 * * 0` - Weekly on Sunday at midnight
- `0 0 1 * *` - Monthly on the 1st at midnight

### Using Task Scheduler (Windows)

**PowerShell script** (`run_scraper.ps1`):
```powershell
# run_scraper.ps1
$ErrorActionPreference = "Stop"

# Activate virtual environment
& "C:\scraper\phonemessagescraper\.venv\Scripts\Activate.ps1"

# Run scraper
cd C:\scraper\phonemessagescraper
python phone_scraper.py --file C:\scraper\config\urls.txt

# Log output
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content -Path "C:\scraper\logs\execution.log" -Value "$timestamp - Scraper completed"
```

**Create scheduled task**:
```powershell
# Create scheduled task (daily at 2 AM)
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File C:\scraper\run_scraper.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -RunLevel Highest
Register-ScheduledTask -Action $action -Trigger $trigger -Principal $principal -TaskName "PhoneScraper" -Description "Daily phone scraper execution"
```

## 3. Cloud Deployment

### AWS EC2 Deployment

**1. Launch EC2 Instance**:
- AMI: Ubuntu 22.04 LTS
- Instance Type: t3.small (or larger for heavy workloads)
- Storage: 20 GB gp3
- Security Group: Allow SSH (22), HTTPS (443)

**2. Setup Script**:
```bash
#!/bin/bash
# setup_aws.sh

# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install dependencies
sudo apt-get install -y python3 python3-pip python3-venv git

# Install Chrome and ChromeDriver
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt-get install -f -y

# Install application
git clone https://github.com/mwinfiel0331/phonemessagescraper.git /opt/scraper
cd /opt/scraper

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install selenium

# Create output directory
sudo mkdir -p /var/scraper/output
sudo chown ubuntu:ubuntu /var/scraper/output

# Setup log directory
sudo mkdir -p /var/log/scraper
sudo chown ubuntu:ubuntu /var/log/scraper

# Install as service
sudo cp deployment/phone-scraper.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable phone-scraper.service

echo "Setup complete!"
```

**3. CloudWatch Logging** (install CloudWatch agent):
```bash
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb

# Configure to send logs to CloudWatch
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -s \
  -c file:/opt/scraper/cloudwatch-config.json
```

### Google Cloud Platform Deployment

**Using Google Compute Engine**:

```bash
# Create instance
gcloud compute instances create phone-scraper \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --machine-type=e2-small \
  --zone=us-central1-a

# SSH to instance
gcloud compute ssh phone-scraper --zone=us-central1-a

# Run setup script (similar to AWS)
```

### Azure Deployment

**Using Azure VM**:

```bash
# Create resource group
az group create --name scraper-rg --location eastus

# Create VM
az vm create \
  --resource-group scraper-rg \
  --name phone-scraper \
  --image Ubuntu2204 \
  --size Standard_B1s \
  --admin-username azureuser \
  --generate-ssh-keys

# SSH and setup
ssh azureuser@<vm-ip-address>
# Run setup script
```

## 4. Container Deployment (Docker)

### Dockerfile

Create `Dockerfile`:

```dockerfile
# Dockerfile
FROM python:3.9-slim

# Install Chrome and dependencies
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    unzip \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# Install ChromeDriver
RUN CHROME_VERSION=$(google-chrome --version | grep -oP '\d+\.\d+\.\d+') && \
    CHROMEDRIVER_VERSION=$(wget -qO- "https://chromedriver.storage.googleapis.com/LATEST_RELEASE_${CHROME_VERSION%%.*}") && \
    wget -q "https://chromedriver.storage.googleapis.com/${CHROMEDRIVER_VERSION}/chromedriver_linux64.zip" && \
    unzip chromedriver_linux64.zip && \
    mv chromedriver /usr/local/bin/ && \
    chmod +x /usr/local/bin/chromedriver && \
    rm chromedriver_linux64.zip

# Set working directory
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir selenium

# Copy application code
COPY . .

# Create output directory
RUN mkdir -p /app/output

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV DISPLAY=:99

# Default command
CMD ["python", "phone_scraper.py", "--help"]
```

### docker-compose.yml

```yaml
# docker-compose.yml
version: '3.8'

services:
  scraper:
    build: .
    container_name: phone-scraper
    volumes:
      - ./output:/app/output
      - ./config:/app/config:ro
      - ./logs:/app/logs
    environment:
      - SCRAPER_OUTPUT_DIR=/app/output
      - SCRAPER_DELAY=2.0
      - SCRAPER_HEADLESS=true
    restart: unless-stopped
    command: python phone_scraper.py --file /app/config/urls.txt
```

### Build and Run

```bash
# Build image
docker build -t phone-scraper:latest .

# Run container
docker run -v $(pwd)/output:/app/output phone-scraper:latest python phone_scraper.py https://example.com

# Using docker-compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Kubernetes Deployment

Create `deployment.yaml`:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: phone-scraper
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: scraper
            image: phone-scraper:latest
            command:
            - python
            - phone_scraper.py
            - --file
            - /config/urls.txt
            volumeMounts:
            - name: output
              mountPath: /app/output
            - name: config
              mountPath: /config
          restartPolicy: OnFailure
          volumes:
          - name: output
            persistentVolumeClaim:
              claimName: scraper-output-pvc
          - name: config
            configMap:
              name: scraper-config
```

Deploy:
```bash
kubectl apply -f deployment.yaml
```

## 5. Serverless Deployment (AWS Lambda)

### Lambda Function

**Note**: Lambda has limitations for browser automation. Consider AWS Fargate for NumberBarn scraping.

**For basic web scraping only**:

Create `lambda_function.py`:

```python
# lambda_function.py
import json
import os
from phone_scraper import PhoneNumberScraper

def lambda_handler(event, context):
    """AWS Lambda handler for phone scraping."""
    
    # Get URLs from event
    urls = event.get('urls', [])
    
    if not urls:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'No URLs provided'})
        }
    
    # Initialize scraper
    scraper = PhoneNumberScraper(
        delay=float(os.getenv('SCRAPER_DELAY', '1.0')),
        output_dir='/tmp/output'
    )
    
    # Scrape URLs
    try:
        results = scraper.scrape_urls(urls, include_text=False)
        
        # Export to S3 (not local filesystem)
        # ... S3 upload logic ...
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'success': True,
                'phones_found': len(results.get('all_phones', [])),
                'urls_processed': results.get('successful_urls', 0)
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
```

## Production Best Practices

### 1. Logging

Implement comprehensive logging:

```python
# setup_logging.py
import logging
import logging.handlers
import os

def setup_logging():
    """Configure production logging."""
    log_dir = os.getenv('SCRAPER_LOG_DIR', '/var/log/scraper')
    os.makedirs(log_dir, exist_ok=True)
    
    # Configure root logger
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            # Rotating file handler
            logging.handlers.RotatingFileHandler(
                f'{log_dir}/scraper.log',
                maxBytes=10485760,  # 10MB
                backupCount=5
            ),
            # Console handler
            logging.StreamHandler()
        ]
    )
    
    # Separate error log
    error_handler = logging.handlers.RotatingFileHandler(
        f'{log_dir}/error.log',
        maxBytes=10485760,
        backupCount=5
    )
    error_handler.setLevel(logging.ERROR)
    logging.getLogger().addHandler(error_handler)
```

### 2. Error Notifications

Setup email alerts:

```python
# error_notifier.py
import smtplib
from email.mime.text import MIMEText

def send_error_alert(error_message):
    """Send email alert on error."""
    msg = MIMEText(error_message)
    msg['Subject'] = 'Phone Scraper Error Alert'
    msg['From'] = 'scraper@example.com'
    msg['To'] = 'admin@example.com'
    
    with smtplib.SMTP('localhost') as s:
        s.send_message(msg)
```

### 3. Monitoring

Health check endpoint:

```python
# health_check.py
from flask import Flask, jsonify
import os

app = Flask(__name__)

@app.route('/health')
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'output_dir_exists': os.path.exists('/var/scraper/output'),
        'disk_space_mb': get_disk_space('/var/scraper/output')
    })

def get_disk_space(path):
    """Get available disk space in MB."""
    stat = os.statvfs(path)
    return (stat.f_bavail * stat.f_frsize) / (1024 * 1024)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
```

### 4. Backup Strategy

Automated backup script:

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/var/backups/scraper"
OUTPUT_DIR="/var/scraper/output"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup
mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/output_$DATE.tar.gz" -C "$OUTPUT_DIR" .

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "output_*.tar.gz" -mtime +7 -delete

# Sync to S3 (if using AWS)
aws s3 sync "$BACKUP_DIR" s3://my-bucket/scraper-backups/
```

### 5. Security Hardening

```bash
# Restrict file permissions
chmod 750 /opt/scraper
chmod 640 /opt/scraper/*.py

# Use secrets management
# AWS Secrets Manager, HashiCorp Vault, etc.

# Network restrictions
# Use security groups/firewalls to limit access

# Regular updates
apt-get update && apt-get upgrade -y
pip install --upgrade -r requirements.txt
```

## Rollback Procedure

In case of deployment issues:

```bash
# 1. Stop service
sudo systemctl stop phone-scraper

# 2. Revert to previous version
cd /opt/scraper
git checkout <previous-commit-hash>

# 3. Reinstall dependencies
source .venv/bin/activate
pip install -r requirements.txt

# 4. Restart service
sudo systemctl start phone-scraper

# 5. Verify
sudo systemctl status phone-scraper
```

## Production Maintenance

### Regular Tasks

**Weekly**:
- Review logs for errors
- Check disk space
- Verify output quality

**Monthly**:
- Update dependencies
- Clean old output files
- Review and optimize cron schedules
- Check ChromeDriver compatibility

**Quarterly**:
- Security audit
- Performance review
- Capacity planning

### Monitoring Metrics

Track these metrics:
- Scraping success rate
- Average execution time
- Phone numbers extracted per run
- Error rate
- Disk space usage
- CPU/memory usage

## Troubleshooting Production Issues

See `05-local-development.md` troubleshooting section and:

- Check logs: `tail -f /var/log/scraper/scraper.log`
- Verify cron: `grep CRON /var/log/syslog`
- Check disk space: `df -h`
- Monitor processes: `ps aux | grep python`
- Review systemd: `journalctl -u phone-scraper -f`
