#!/bin/bash

### Updating the server
sudo apt update && sudo apt upgrade -y

### Take backup of database
FOLDER_NAME="db-backup"
DB_NAME="spikeball-matches"
mkdir -p "$FOLDER_NAME"
# Export
mongodump --db "$DB_NAME" --out ./"$FOLDER_NAME"
ls -la ./${FOLDER_NAME}/"$DB_NAME"
nano ./backup_db.sh
./backup_db.sh

### Clean up previous project
pm2 stop all
pm2 delete all

pm2 list
pm2 save --force
pm2 flush

rm -rf /home/shayon/youthspike-nest-backend

### Setup from stratch
echo "Setup from stratch"
cd 
git clone git@github.com:MdSamsuzzohaShayon/youthspike-event-management.git
git log --oneline --graph --decorate --all -n 10

# Temp (Version before EID)
# cd /home/shayon/youthspike-event-management
# git checkout c36ec952df0a3aa48150c39ed42d6c8fee239507
# cd ..


# Backend
echo "Setting up backend"
mkdir /home/shayon/youthspike-nest-backend
mv /home/shayon/youthspike-event-management/youthspike-nest-backend/* /home/shayon/youthspike-nest-backend
rm -rf /home/shayon/youthspike-event-management

# Set temporary development
cd /home/shayon/youthspike-nest-backend
echo "#Environment variables for youthspike-nest-backend" > .env
nano .env
echo "Installing dependencies for youthspike-nest-backend"
npm install
nano src/main.ts
npm run build
export NODE_ENV="production"
pm2 start ecosystem.config.js
pm2 save

# Setup redis
sudo systemctl restart redis
sudo systemctl status redis
./redis_cluster.sh

cd



