#!/bin/bash

sudo systemctl start mongod
sudo systemctl start redis
./redis_cluster.sh


npm run dev:pm2:start


# Install packages
npm i @apollo/server @nestjs-modules/mailer @nestjs/apollo @nestjs/graphql @nestjs/jwt @nestjs/mapped-types
npm i @nestjs/mongoose @nestjs/passport @nestjs/platform-socket.io @nestjs/platform-ws @nestjs/websockets
npm i @socket.io/redis-adapter @types/graphql-upload @types/html-to-text apollo-server-express bcrypt class-validator
npm i cloudinary connect-redis cookie-parser express express-session express-socket.io-session graphql graphql-subscriptions
npm i graphql-upload handlebars html-to-text i ioredis mongoose nodemailer npm papaparse passport passport-jwt
npm i reflect-metadata rxjs socket.io socket.io-redis @nestjs/config apollo-server-core
npm i @types/bcrypt @types/passport-jwt concurrently cross-env eslint-config-nestjs http-proxy nodemon pm2 --save-dev



# Restore mongodb database
mongorestore --gzip --db spikeball_temp ./spikeball-matches
