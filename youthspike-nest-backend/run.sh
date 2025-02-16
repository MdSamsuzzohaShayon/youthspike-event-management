#!/bin/bash


# Redis 
 1004  redis-cli -c ping
 1005  redis-cli
 1006  npm run dev
 1007  redis-cli
 1008  redis-cli cluster info
 1009  redis-server --cluster-enabled yes --cluster-config-file nodes.conf --cluster-node-timeout 5000 --appendonly yes
 1010  redis-cli cluster info
 1011  npm install ioredis @socket.io/redis-adapter
 1012  ps aux | grep redis
 1013  sudo kill -9 8725
 1014  redis-server --port 7000 --cluster-enabled yes --cluster-config-file nodes-7000.conf --daemonize yes
 1015  redis-server --port 7001 --cluster-enabled yes --cluster-config-file nodes-7001.conf --daemonize yes
 1016  redis-server --port 7002 --cluster-enabled yes --cluster-config-file nodes-7002.conf --daemonize yes
 1017  redis-server --port 7003 --cluster-enabled yes --cluster-config-file nodes-7003.conf --daemonize yes
 1018  redis-server --port 7004 --cluster-enabled yes --cluster-config-file nodes-7004.conf --daemonize yes
 1019  redis-server --port 7005 --cluster-enabled yes --cluster-config-file nodes-7005.conf --daemonize yes
 1020  redis-cli --cluster create 127.0.0.1:7000 127.0.0.1:7001 127.0.0.1:7002 127.0.0.1:7003 127.0.0.1:7004 127.0.0.1:7005 --cluster-replicas 1
 1021  redis-cli -c
 1022  redis-cli -p 7000 cluster nodes
 1023  redis-server --port 7000 --cluster-enabled yes --cluster-config-file nodes-7000.conf --daemonize yes
 1024  redis-server --port 7001 --cluster-enabled yes --cluster-config-file nodes-7001.conf --daemonize yes
 1025  redis-server --port 7002 --cluster-enabled yes --cluster-config-file nodes-7002.conf --daemonize yes
 1026  redis-server --port 7003 --cluster-enabled yes --cluster-config-file nodes-7003.conf --daemonize yes
 1027  redis-server --port 7004 --cluster-enabled yes --cluster-config-file nodes-7004.conf --daemonize yes
 1028  redis-server --port 7005 --cluster-enabled yes --cluster-config-file nodes-7005.conf --daemonize yes
 1029  redis-cli --cluster create 127.0.0.1:7000 127.0.0.1:7001 127.0.0.1:7002 127.0.0.1:7003 127.0.0.1:7004 127.0.0.1:7005 --cluster-replicas 1
 1030  redis-cli -c -p 7000