#!/bin/bash

### Updating the server
sudo apt update 
sudo apt upgrade -y
sudo apt autoremove -y

### Clean up previous project
pm2 stop all
pm2 delete all

pm2 list
pm2 save --force
pm2 flush

rm -rf /home/shayon/youthspike-event-management

### Setup from stratch
echo "Setup from stratch"
cd 
git clone git@github.com:MdSamsuzzohaShayon/youthspike-event-management.git
cd /home/shayon/youthspike-event-management
git checkout f1fe65e9007029dc63a4fdce86d8e2b1f657e443
git log -n 10
git log --oneline --graph --decorate --all 
cd


echo "Installing dependencies for youthspike-admin-frontend"
cd /home/shayon/youthspike-event-management/youthspike-admin-frontend
# Set temporary development
export NODE_ENV="development"
npm install
nano src/utils/keys.ts
npm run build
pm2 start ecosystem.config.js

echo "Installing dependencies for youthspike-frontend"
cd /home/shayon/youthspike-event-management/youthspike-frontend
# Set temporary development
export NODE_ENV="development"
npm install
nano src/utils/keys.ts
npm run build
pm2 start ecosystem.config.js

pm2 save --force
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u shayon --hp /home/shayon
pm2 logs
