#!/bin/bash

# Define Redis ports
PORTS=(7000 7001 7002 7003 7004 7005)

# Define the Redis cluster directory
REDIS_CLUSTER_DIR="redis-cluster"

# Ensure the Redis cluster directory exists
mkdir -p "$REDIS_CLUSTER_DIR"
chmod 777 "$REDIS_CLUSTER_DIR"  # Ensure write permissions

echo "🚀 Stopping Redis instances..."
for PORT in "${PORTS[@]}"; do
    redis-cli -p "$PORT" shutdown 2>/dev/null
done

echo "🗑 Deleting old Redis cluster files..."
rm -rf "$REDIS_CLUSTER_DIR"/nodes-*.conf "$REDIS_CLUSTER_DIR"/dump-*.rdb "$REDIS_CLUSTER_DIR"/appendonly-*.aof

echo "✅ Old Redis setup removed!"

echo "🔄 Restarting Redis instances..."
for PORT in "${PORTS[@]}"; do
    redis-server --port "$PORT" \
        --cluster-enabled yes \
        --cluster-config-file "nodes-$PORT.conf" \
        --cluster-node-timeout 5000 \
        --dir "$REDIS_CLUSTER_DIR" \
        --appendonly yes \
        --daemonize yes
done

echo "⏳ Waiting for Redis instances to start..."
sleep 3

echo "🔗 Creating Redis Cluster..."
yes "yes" | redis-cli --cluster create \
    127.0.0.1:7000 127.0.0.1:7001 127.0.0.1:7002 \
    127.0.0.1:7003 127.0.0.1:7004 127.0.0.1:7005 \
    --cluster-replicas 1

echo "✅ Redis Cluster setup complete!"

echo "🔍 Verifying Redis Cluster..."
redis-cli -p 7000 cluster nodes

echo "📊 Checking all Redis instances..."
for PORT in "${PORTS[@]}"; do
    echo "--------------------------------------"
    echo "🔎 Checking Redis node on port $PORT"
    redis-cli -p "$PORT" info replication | grep -E 'role|connected_slaves|master_replid'
    redis-cli -p "$PORT" cluster info
done

echo "🎉 Redis Cluster is now running successfully!"
