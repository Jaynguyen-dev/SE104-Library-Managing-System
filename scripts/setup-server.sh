#!/bin/bash
set -euo pipefail

echo "=== Setting up production server ==="

# System updates
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential nginx

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install SQL Server (Ubuntu 22.04)
curl -s https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -
curl -s https://packages.microsoft.com/config/ubuntu/22.04/mssql-server-2022.list | sudo tee /etc/apt/sources.list.d/mssql-server-2022.list
sudo apt update
sudo apt install -y mssql-server

# Configure SQL Server (set SA password when prompted)
sudo /opt/mssql/bin/mssql-conf setup

# Install SQL Server tools
curl -s https://packages.microsoft.com/config/ubuntu/22.04/prod.list | sudo tee /etc/apt/sources.list.d/msprod.list
sudo apt update
sudo apt install -y mssql-tools unixodbc-dev
echo 'export PATH="$PATH:/opt/mssql-tools/bin"' >> ~/.bashrc

# Create deploy user
sudo useradd -m -s /bin/bash deploy || true
sudo usermod -aG sudo deploy

# Setup app directory
sudo mkdir -p /home/deploy/library-lms
sudo chown -R deploy:deploy /home/deploy/library-lms

# Setup nginx
sudo cp /home/deploy/library-lms/nginx.conf /etc/nginx/sites-available/library-lms
sudo ln -sf /etc/nginx/sites-available/library-lms /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# Setup SSL with Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

echo "=== Server setup complete ==="
echo ""
echo "Next steps:"
echo "1. Copy .env.production to /home/deploy/library-lms/.env and fill in values"
echo "2. Configure firewall: sudo ufw allow 22,80,443/tcp"
echo "3. Clone your repo: git clone <repo> /home/deploy/library-lms"
echo "4. Run: cd /home/deploy/library-lms && bash scripts/deploy.sh"
