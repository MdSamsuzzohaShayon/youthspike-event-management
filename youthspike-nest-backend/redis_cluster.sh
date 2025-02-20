#!/bin/bash

set -e  # Exit on any error

# Define Redis ports and working directory
REDIS_PORTS=(7000 7001 7002 7003 7004 7005)
REDIS_DIR="$HOME/redis-cluster"  # Change this path if needed

# Logging function
log() {
    echo -e "[`date +'%Y-%m-%d %H:%M:%S'`] $1"
}

# Check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Ensure Redis is installed
check_redis_installed() {
    if ! command_exists redis-server || ! command_exists redis-cli; then
        log "❌ Error: Redis is not installed. Please install Redis before running this script."
        exit 1
    fi
}

# Create the Redis working directory
setup_redis_directory() {
    log "📁 Setting up Redis cluster directory at $REDIS_DIR..."
    mkdir -p "$REDIS_DIR"
}

# Stop running Redis instances
stop_redis_instances() {
    log "🔄 Stopping any existing Redis instances..."
    sudo pkill redis-server || log "ℹ️ No existing Redis instances found."
    sleep 2  # Ensure time for processes to stop
}

# Remove old cluster data
cleanup_old_data() {
    log "🧹 Removing old Redis cluster data..."
    rm -rf "$REDIS_DIR/nodes-700"*.conf "$REDIS_DIR/dump.rdb" "$REDIS_DIR/appendonly.aof" || log "ℹ️ No old files to remove."
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

        sleep 2  # Allow time for startup

        # Check if Redis instance is running
        if ! redis-cli -p $port ping | grep -q PONG; then
            log "❌ Error: Redis instance on port $port failed to start!"
            log "🛠 Debugging: Checking port usage..."
            netstat -tulnp | grep $port || log "ℹ️ Port $port is free."
            exit 1
        fi
        log "✅ Redis instance started on port $port"
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
            log "❌ Error: Redis instance on port $port is not responding!"
            exit 1
        fi
    done
    log "✅ All Redis instances are running."
}

# Create Redis cluster
create_redis_cluster() {
    log "🔗 Creating Redis cluster..."
    yes "yes" | redis-cli --cluster create \
        127.0.0.1:7000 127.0.0.1:7001 127.0.0.1:7002 \
        127.0.0.1:7003 127.0.0.1:7004 127.0.0.1:7005 \
        --cluster-replicas 1

    if [ $? -ne 0 ]; then
        log "❌ Error: Failed to create Redis cluster."
        exit 1
    fi
    log "✅ Redis cluster successfully created!"
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
}

# Execute the script
main
