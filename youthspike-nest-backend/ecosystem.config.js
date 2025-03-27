// Online Javascript Editor for free
// Write, Edit and Run your Javascript code using JS Online Compiler

module.exports = {
  apps: [
    {
      name: 'BackendAPI_4001',
      script: '/home/shayon/youthspike-nest-backend/dist/main.js',
      env: {
        NODE_ENV: 'production',
        PORT: 4001,
        REDIS_HOST: '127.0.0.1',
        REDIS_PORT: '7000',
      },
    },
    {
      name: 'BackendAPI_4002',
      script: '/home/shayon/youthspike-nest-backend/dist/main.js',
      env: {
        NODE_ENV: 'production',
        PORT: 4002,
        REDIS_HOST: '127.0.0.1',
        REDIS_PORT: '7001',
      },
    },
    {
      name: 'BackendAPI_4003',
      script: '/home/shayon/youthspike-nest-backend/dist/main.js',
      env: {
        NODE_ENV: 'production',
        PORT: 4003,
        REDIS_HOST: '127.0.0.1',
        REDIS_PORT: '7002',
      },
    },
  ],
};