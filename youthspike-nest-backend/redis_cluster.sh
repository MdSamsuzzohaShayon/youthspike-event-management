#!/bin/bash

set -e  # Exit on any error

# Define Redis ports and working directory
REDIS_PORTS=(7000 7001 7002 7003 7004 7005)
REDIS_DIR="$HOME/redis-cluster"  # Change this path if needed

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[1;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[`date +'%Y-%m-%d %H:%M:%S'`]${NC} $1"
}

success() {
    echo -e "${GREEN}$1${NC}"
}

warn() {
    echo -e "${YELLOW}$1${NC}"
}

error() {
    echo -e "${RED}$1${NC}"
}

# Check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Ensure Redis is installed
check_redis_installed() {
    if ! command_exists redis-server || ! command_exists redis-cli; then
        error "❌ Redis is not installed. Please install Redis before running this script."
        echo -e "${YELLOW}👉 On Ubuntu: sudo apt install redis-server${NC}"
        echo -e "${YELLOW}👉 On Fedora: sudo dnf install redis${NC}"
        exit 1
    fi
    success "✅ Redis is installed."
}

# Create the Redis working directory
setup_redis_directory() {
    log "📁 Setting up Redis cluster directory at $REDIS_DIR..."
    mkdir -p "$REDIS_DIR"
}

# Stop running Redis instances
stop_redis_instances() {
    log "🔄 Stopping Redis system service (if running)..."

    # Detect service name based on OS
    if command_exists systemctl; then
        if systemctl list-units --full -all | grep -q redis-server.service; then
            REDIS_SERVICE="redis-server"
        elif systemctl list-units --full -all | grep -q redis.service; then
            REDIS_SERVICE="redis"
        else
            REDIS_SERVICE=""
        fi
    fi

    if [ -n "$REDIS_SERVICE" ]; then
        sudo systemctl stop "$REDIS_SERVICE" || warn "ℹ️ Redis system service not found or not active."
        sudo systemctl disable "$REDIS_SERVICE" || warn "ℹ️ Redis system service already disabled."
    else
        warn "ℹ️ Redis system service not found."
    fi

    sleep 2  

    log "🔄 Stopping any existing Redis instances..."
    sudo pkill redis-server || warn "ℹ️ No existing Redis instances found."
    sleep 2  

    # Force kill any remaining Redis processes
    for pid in $(pgrep redis-server); do
        warn "⚠️ Killing Redis process $pid..."
        sudo kill -9 $pid
    done
    sleep 2  

    # Verify Redis is fully stopped
    if pgrep redis-server > /dev/null; then
        error "❌ Redis instances are still running!"
        ps aux | grep redis
        exit 1
    else
        success "✅ All Redis instances stopped successfully."
    fi
}


# Remove old cluster data
cleanup_old_data() {
    log "🧹 Removing old Redis cluster data..."
    rm -rf "$REDIS_DIR/nodes-"*.conf "$REDIS_DIR/dump.rdb" "$REDIS_DIR/appendonly.aof" "$REDIS_DIR/data-"* || warn "ℹ️ No old files to remove."
    sleep 1
}

# Start Redis instances
start_redis_instances() {
    log "🚀 Starting Redis instances..."
    for port in "${REDIS_PORTS[@]}"; do
        CONFIG_FILE="$REDIS_DIR/nodes-$port.conf"
        DATA_DIR="$REDIS_DIR/data-$port"
        mkdir -p "$DATA_DIR"

        log "🔄 Starting Redis on port $port..."
        redis-server --port $port \
            --cluster-enabled yes \
            --cluster-config-file "$CONFIG_FILE" \
            --dir "$DATA_DIR" \
            --daemonize yes

        sleep 2

        # Check if Redis instance is running
        if ! redis-cli -p $port ping | grep -q PONG; then
            error "❌ Redis instance on port $port failed to start!"
            warn "🛠 Debugging: Checking port usage..."
            netstat -tulnp | grep $port || warn "ℹ️ Port $port is free."
            exit 1
        fi
        success "✅ Redis instance started on port $port"
    done
}

# Wait for Redis instances to stabilize
wait_for_stabilization() {
    log "⏳ Waiting for Redis instances to stabilize..."
    sleep 5
}

# Verify Redis instances are running
verify_redis_instances() {
    for port in "${REDIS_PORTS[@]}"; do
        if ! redis-cli -p $port ping | grep -q PONG; then
            error "❌ Redis instance on port $port is not responding!"
            exit 1
        fi
    done
    success "✅ All Redis instances are running."
}

# Create Redis cluster
create_redis_cluster() {
    log "🔗 Creating Redis cluster..."
    yes "yes" | redis-cli --cluster create \
        127.0.0.1:7000 127.0.0.1:7001 127.0.0.1:7002 \
        127.0.0.1:7003 127.0.0.1:7004 127.0.0.1:7005 \
        --cluster-replicas 1

    if [ $? -ne 0 ]; then
        error "❌ Error: Failed to create Redis cluster."
        exit 1
    fi
    success "✅ Redis cluster successfully created!"
}

# Verify cluster nodes
verify_cluster_nodes() {
    log "📌 Redis cluster nodes:"
    redis-cli -p 7000 cluster nodes
}

# Run all functions
main() {
    check_redis_installed
    setup_redis_directory
    stop_redis_instances
    cleanup_old_data
    start_redis_instances
    wait_for_stabilization
    verify_redis_instances
    create_redis_cluster
    verify_cluster_nodes

    echo -e "${YELLOW}\n🔁 To ensure Redis starts on reboot:"
    echo -e "👉 Ubuntu: sudo systemctl enable redis-server"
    echo -e "👉 Fedora: sudo systemctl enable redis\n${NC}"
}

# Execute the script
main
