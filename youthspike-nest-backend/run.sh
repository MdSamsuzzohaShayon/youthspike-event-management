#!/bin/bash

sudo systemctl start mongod
sudo systemctl start redis
./redis_cluster.sh


npm run dev:pm2:start