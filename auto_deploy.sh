#!/bin/bash

### Clean up previous project
pm2 stop nest_backend
pm2 delete nest_backend

pm2 stop next_frontend_admin
pm2 delete next_frontend_admin

pm2 stop next_frontend
pm2 delete next_frontend

pm2 list
pm2 save --force
pm2 flush

rm -rf youthspike-event-management

### Setup from stratch
echo "Setup from stratch"
cd 
git clone git@github.com:MdSamsuzzohaShayon/youthspike-event-management.git

# Temp (Version before EID)
# cd /home/shayon/youthspike-event-management
# git checkout c36ec952df0a3aa48150c39ed42d6c8fee239507
# cd ..


# Backend
echo "Installing dependencies for youthspike-nest-backend"
cd /home/shayon/youthspike-event-management/youthspike-nest-backend
nano .env
npm install
nano src/main.ts
npm run build
export NODE_ENV="production"
pm2 start ecosystem.config.js


echo "Installing dependencies for youthspike-admin-frontend"
cd /home/shayon/youthspike-event-management/youthspike-admin-frontend
npm install
nano src/utils/keys.ts
npm run build
pm2 start ecosystem.config.js

echo "Installing dependencies for youthspike-frontend"
cd /home/shayon/youthspike-event-management/youthspike-frontend
npm install
nano src/utils/keys.ts
npm run build
pm2 start ecosystem.config.js

pm2 save --force
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u shayon --hp /home/shayon
pm2 logs




