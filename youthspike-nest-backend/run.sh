#!/bin/bash


# Enable clustering
sudo nano /etc/redis/redis.conf

# Redis 
sudo systemctl restart redis
redis-cli -c ping
redis-cli
redis-cli cluster info
ps aux | grep redis

# Remove All Existing Cluster Data
pkill redis-server
rm -rf nodes-700*.conf
rm -rf dump.rdb
rm -rf appendonly.aof


redis-server --port 7000 --cluster-enabled yes --cluster-config-file nodes-7000.conf --daemonize yes
redis-server --port 7001 --cluster-enabled yes --cluster-config-file nodes-7001.conf --daemonize yes
redis-server --port 7002 --cluster-enabled yes --cluster-config-file nodes-7002.conf --daemonize yes
redis-server --port 7003 --cluster-enabled yes --cluster-config-file nodes-7003.conf --daemonize yes
redis-server --port 7004 --cluster-enabled yes --cluster-config-file nodes-7004.conf --daemonize yes
redis-server --port 7005 --cluster-enabled yes --cluster-config-file nodes-7005.conf --daemonize yes
redis-cli --cluster create 127.0.0.1:7000 127.0.0.1:7001 127.0.0.1:7002 127.0.0.1:7003 127.0.0.1:7004 127.0.0.1:7005 --cluster-replicas 1
redis-cli -p 7000 cluster nodes
redis-cli -c -p 7000




curl -X POST 'http://localhost:4000/graphql' -H 'Content-Type: application/json' -d '{"query":"{ getAbout { app author details mode version } }"}'
