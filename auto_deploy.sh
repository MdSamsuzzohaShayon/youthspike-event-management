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
FOLDER_NAME="db-backup"
DB_NAME="spikeball-matches"
PROJECT_NAME="youthspike-nest-backend"
GIT_REPO="git@github.com:MdSamsuzzohaShayon/youthspike-event-management.git"
PROJECT_DIR="/home/shayon/$PROJECT_NAME"
CLONE_DIR="/home/shayon/youthspike-event-management"

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
info "Updating system..."
sudo apt update && sudo apt upgrade -y && sudo apt autoremove -y
success "System updated."

### Backup MongoDB Database
nano backup_db.sh
./backup_db.sh

### Stop and clean previous PM2 processes
info "Stopping previous PM2 processes..."
pm2 stop all || warn "No processes to stop."
pm2 delete all || warn "No processes to delete."
pm2 flush
pm2 save --force
success "PM2 cleaned up."

### Remove old project
info "Removing old project directory..."
rm -rf "$PROJECT_DIR"

### Clone project from Git
info "Cloning project from GitHub..."
rm -rf "$CLONE_DIR"
git clone "$GIT_REPO" "$CLONE_DIR"
success "Git repository cloned."

### Check project status
info "Project details..."
cd "$CLONE_DIR"
ls -la
git log -n 10
# git log --oneline --graph --all --decorate
cd "$HOME"
success "Checked status of latest commits."

### Move backend code
info "Setting up backend directory..."
mkdir -p "$PROJECT_DIR"
mv "$CLONE_DIR/$PROJECT_NAME/"* "$PROJECT_DIR"
rm -rf "$CLONE_DIR"
success "Backend moved to $PROJECT_DIR"

### Setup Redis
# info "Restarting Redis..."
# sudo systemctl restart redis-server
# sudo systemctl status redis-server --no-pager || warn "Redis might not be running properly."
# cd "$PROJECT_DIR"
# [ -f ./redis_cluster.sh ] && ./redis_cluster.sh || warn "redis_cluster.sh not found."
# success "Redis setup completed."


### Environment setup
info "Setting up environment variables..."
ENV_FILE="$PROJECT_DIR/.env"
echo "# Environment variables for $PROJECT_NAME" > "$ENV_FILE"
nano "$ENV_FILE"
success ".env file created."

### Install dependencies
info "Installing dependencies..."
cd "$PROJECT_DIR"
npm install --force
success "Dependencies installed."

### Optional manual review
nano src/util/keys.ts

### Build and run with PM2
info "Building the app..."
npm run build

info "Starting PM2..."
export NODE_ENV="production"
pm2 start ecosystem.config.js
pm2 save
success "PM2 process started."

### Test the deployment
info "Testing API with GraphQL query..."
curl -s -X POST 'https://api.aslsquads.com/graphql' \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ getAbout { app author mode version } }"}' 

info "Showing PM2 logs..."
pm2 logs
