#!/bin/bash

# Access to Root
ssh root@104.248.112.37

# Create a new user with a user group with sudo permission
sudo adduser shayon
sudo usermod -aG sudo shayon
su - shayon


# Create a new directory for the user
sudo mkdir /home/shayon

# Change ownership of the user's home directory
sudo chown -R shayon:shayon /home/shayon

# Set up SSH key authentication
chmod 700 ~/.ssh
mkdir ~/.ssh
chmod 700 ~/.ssh
touch ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
nano ~/.ssh/authorized_keys
sudo systemctl restart ssh

# Clone a Git repository
git clone git@github.com:MdSamsuzzohaShayon/youthspike-event-management.git

# Update system and install Node.js
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
NODE_MAJOR=20
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list
sudo apt-get update
sudo apt-get install nodejs -y
npm install -g npm@10.8.3

# Install PM2
npm install pm2 -g

# Install MongoDB and start the service
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Install PM2 for managing Node.js processes
sudo npm install pm2 -g

# Start the Node.js application with PM2
pm2 startOrRestart ecosystem.config.js --env production

# Save PM2 configurations
pm2 save --force
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u shayon --hp /home/shayon

# Firewall setup
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable

# Additional Apache and SSL setup
sudo apt install apache2
sudo systemctl enable apache2
sudo ufw allow 'Apache Full'
sudo nano /var/www/html/index.html
sudo systemctl restart apache2

# Configure Apache Virtual Host
sudo systemctl status apache2
hostname -I
sudo nano /etc/apache2/sites-available/aslsquads.conf
# Add content of aslsquads.conf file

# Enable site configuration
sudo a2enmod proxy proxy_http proxy_wstunnel
sudo a2ensite aslsquads.conf
sudo a2dissite 000-default.conf
sudo systemctl reload apache2
sudo systemctl restart apache2
sudo apache2ctl configtest
ls /etc/apache2/sites-enabled/

# Configure Apache with Let's Encrypt SSL certificate (Optional)
# Note: Certbot installation and SSL configuration steps are optional and depend on your specific requirements.
sudo apt-get install certbot python3-certbot-apache
sudo certbot --apache



