# 🚀 Production Deployment Guide

## Pre-Deployment Checklist

- [ ] MongoDB production instance ready
- [ ] Domain name configured
- [ ] SSL certificate obtained
- [ ] Server with Node.js installed
- [ ] Firewall configured
- [ ] Environment variables secured

---

## 1. Server Setup (Ubuntu/Debian)

### Install Node.js

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (v18 LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### Install MongoDB

```bash
# Import MongoDB GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install MongoDB
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

---

## 2. Deploy Application

### Clone and Setup

```bash
# Create app directory
sudo mkdir -p /var/www/webrtc-call-server
cd /var/www/webrtc-call-server

# Upload your code (via git or scp)
git clone your-repo-url .

# Or upload via SCP
# scp -r ./webrtc-call-server user@server:/var/www/

# Install dependencies
npm install --production

# Create recordings directory
mkdir -p recordings
chmod 755 recordings
```

### Configure Environment

```bash
# Create production .env file
nano .env
```

Add production values:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/webrtc_call_db
JWT_SECRET=GENERATE_STRONG_RANDOM_SECRET_HERE
RECORDING_PATH=/var/www/webrtc-call-server/recordings
NODE_ENV=production
```

**Generate secure JWT secret:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 3. Configure PM2

### Create PM2 Configuration

```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'webrtc-call-server',
    script: './src/server.js',
    instances: 2,
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '500M',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### Start with PM2

```bash
# Create logs directory
mkdir -p logs

# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it outputs

# Monitor
pm2 monit
```

---

## 4. Nginx Reverse Proxy

### Install Nginx

```bash
sudo apt install -y nginx
```

### Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/webrtc-call-server
```

```nginx
upstream webrtc_backend {
    server localhost:3000;
}

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy settings
    location / {
        proxy_pass http://webrtc_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.io specific
    location /socket.io/ {
        proxy_pass http://webrtc_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Increase timeouts for long-lived connections
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
```

### Enable Site

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/webrtc-call-server /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## 5. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## 6. Firewall Configuration

```bash
# Allow SSH
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## 7. MongoDB Security

### Create Admin User

```bash
mongosh
```

```javascript
use admin
db.createUser({
  user: "admin",
  pwd: "STRONG_PASSWORD_HERE",
  roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase"]
})

use webrtc_call_db
db.createUser({
  user: "webrtc_user",
  pwd: "STRONG_PASSWORD_HERE",
  roles: ["readWrite"]
})

exit
```

### Enable Authentication

```bash
sudo nano /etc/mongod.conf
```

Add:

```yaml
security:
  authorization: enabled
```

Restart MongoDB:

```bash
sudo systemctl restart mongod
```

### Update Connection String

```env
MONGODB_URI=mongodb://webrtc_user:PASSWORD@localhost:27017/webrtc_call_db?authSource=webrtc_call_db
```

---

## 8. Monitoring & Logs

### View PM2 Logs

```bash
# Real-time logs
pm2 logs

# Last 100 lines
pm2 logs --lines 100

# Specific app logs
pm2 logs webrtc-call-server
```

### View Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### Setup Log Rotation

```bash
sudo nano /etc/logrotate.d/webrtc-call-server
```

```
/var/www/webrtc-call-server/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
}
```

---

## 9. Backup Strategy

### Database Backup Script

```bash
nano /root/backup-mongo.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

mongodump --db webrtc_call_db --out $BACKUP_DIR/backup_$DATE

# Keep only last 7 days
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} +
```

```bash
chmod +x /root/backup-mongo.sh
```

### Setup Cron Job

```bash
crontab -e
```

Add:

```
# Backup database daily at 2 AM
0 2 * * * /root/backup-mongo.sh
```

### Backup Recordings

```bash
nano /root/backup-recordings.sh
```

```bash
#!/bin/bash
RECORDING_DIR="/var/www/webrtc-call-server/recordings"
BACKUP_DIR="/var/backups/recordings"
DATE=$(date +%Y%m%d)

mkdir -p $BACKUP_DIR

tar -czf $BACKUP_DIR/recordings_$DATE.tar.gz -C $RECORDING_DIR .

# Keep only last 30 days
find $BACKUP_DIR -type f -mtime +30 -delete
```

---

## 10. Performance Optimization

### Update Node.js Configuration

```bash
# Increase file descriptors
echo "fs.file-max = 65536" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### PM2 Cluster Mode

Already configured in ecosystem.config.js (2 instances)

### MongoDB Indexing

```javascript
// Connect to MongoDB
use webrtc_call_db

// Create indexes
db.agents.createIndex({ email: 1 }, { unique: true })
db.agents.createIndex({ status: 1 })
db.calls.createIndex({ callId: 1 }, { unique: true })
db.calls.createIndex({ agent: 1, startTime: -1 })
db.calls.createIndex({ customer: 1, startTime: -1 })
```

---

## 11. Health Monitoring

### Setup Monitoring Script

```bash
nano /root/check-health.sh
```

```bash
#!/bin/bash
HEALTH_URL="https://your-domain.com/health"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $STATUS -ne 200 ]; then
    echo "Server down! Status: $STATUS"
    # Send alert (email, SMS, Slack, etc.)
    # pm2 restart webrtc-call-server
fi
```

---

## 12. Useful Commands

```bash
# Restart application
pm2 restart webrtc-call-server

# View application status
pm2 status

# View resource usage
pm2 monit

# Reload with zero downtime
pm2 reload webrtc-call-server

# Stop application
pm2 stop webrtc-call-server

# Delete from PM2
pm2 delete webrtc-call-server

# View environment variables
pm2 env 0

# Update code
cd /var/www/webrtc-call-server
git pull
npm install
pm2 reload webrtc-call-server
```

---

## 🔒 Security Checklist

- [x] MongoDB authentication enabled
- [x] Strong JWT secret
- [x] HTTPS/SSL configured
- [x] Firewall enabled
- [x] Rate limiting implemented
- [x] Input validation
- [x] CORS properly configured
- [x] Security headers added
- [x] Regular backups scheduled
- [x] Log rotation configured

---

## 📊 Monitoring Tools (Optional)

- **New Relic** - Application performance monitoring
- **Datadog** - Infrastructure monitoring
- **Sentry** - Error tracking
- **LogRocket** - User session replay
- **UptimeRobot** - Uptime monitoring

---

## 🆘 Troubleshooting

### Server not starting:

```bash
pm2 logs --err
```

### Port already in use:

```bash
sudo lsof -i :3000
sudo kill -9 PID
```

### MongoDB connection issues:

```bash
sudo systemctl status mongod
sudo journalctl -u mongod
```

### SSL certificate issues:

```bash
sudo certbot certificates
sudo certbot renew
```

---

Your WebRTC Call Server is now production-ready! 🎉