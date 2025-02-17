
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


