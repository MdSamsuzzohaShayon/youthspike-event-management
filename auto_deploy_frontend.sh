#!/bin/bash

# Enable strict mode
set -euo pipefail
trap 'echo -e "\033[1;31m[ERROR]\033[0m An error occurred. Exiting..."; exit 1' ERR

# Define colors
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
RED='\033[1;31m'
CYAN='\033[1;36m'
NC='\033[0m' # No color

# Variables
GIT_REPO="git@github.com:MdSamsuzzohaShayon/youthspike-event-management.git"
CLONE_DIR="/home/shayon/youthspike-event-management"
GIT_BRANCH="master"

function info() {
  echo -e "${CYAN}➤ $1${NC}"
}

function success() {
  echo -e "${GREEN}✔ $1${NC}"
}

function warn() {
  echo -e "${YELLOW}! $1${NC}"
}

function error_exit() {
  echo -e "${RED}✘ $1${NC}"
  exit 1
}

### Update & Upgrade System
info "Updating system packages..."
sudo apt update -y
sudo apt upgrade -y 
sudo apt autoremove -y
success "System updated."

### Stop and clean PM2
info "Cleaning PM2 processes..."
pm2 stop all || warn "No PM2 processes to stop."
pm2 delete all || warn "No PM2 processes to delete."
pm2 list
pm2 flush
pm2 save --force
success "PM2 cleaned."

### Remove old project
info "Removing previous project directory..."
rm -rf "$CLONE_DIR"
success "Old project removed."

### Clone and checkout repository
info "Cloning project from GitHub..."
git clone "$GIT_REPO" "$CLONE_DIR"
cd "$CLONE_DIR"
git switch "$GIT_BRANCH"
git log -n 10
# git log --oneline --graph --decorate --all
cd ~
success "Repository cloned and switched to branch '$GIT_BRANCH'."

### Setup youthspike-admin-frontend
info "Setting up youthspike-admin-frontend..."
cd "$CLONE_DIR/youthspike-admin-frontend"
export NODE_ENV="production"
npm install
nano src/utils/keys.ts

info "Copy environment variables..."
touch .env
echo "#Environment variables for youthspike-admin-frontend" > .env
nano .env
cat .env
success "Done copying environment variable."

info "Build before deployment..."
npm run build
success "Done building for production."

info "Deploying..."
pm2 start ecosystem.config.js
pm2 list
success "Admin frontend deployed."

### Setup youthspike-frontend
info "Setting up youthspike-frontend..."
cd "$CLONE_DIR/youthspike-frontend"
export NODE_ENV="production"
npm install
nano src/utils/keys.ts
info "Copy environment variables..."
touch .env
echo "#Environment variables for youthspike-frontend" > .env
nano .env
cat .env
success "Done copying environment variable."

npm run build
pm2 start ecosystem.config.js
success "User frontend deployed."

### PM2 startup config
info "Configuring PM2 to start on boot..."
pm2 save --force
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u shayon --hp /home/shayon
success "PM2 startup setup completed."

### Show logs
info "Showing PM2 logs..."
pm2 logs
