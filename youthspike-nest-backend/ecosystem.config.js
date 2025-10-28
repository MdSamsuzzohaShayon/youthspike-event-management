// Online Javascript Editor for free
// Write, Edit and Run your Javascript code using JS Online Compiler

module.exports = {
  apps: [
    {
      name: 'BackendAPI',             // Single app name for all instances
      script: '/home/shayon/youthspike-nest-backend/dist/main.js',
      instances: 'max',               // Auto-detect CPU cores
      exec_mode: 'cluster',           // Cluster mode
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        REDIS_CLUSTER_NODES: '127.0.0.1:7000,127.0.0.1:7001,127.0.0.1:7002,127.0.0.1:7003,127.0.0.1:7004,127.0.0.1:7005',
      },
    },
  ],
};

/*
module.exports = {
  apps: [
    {
      name: 'BackendAPI_4001',
      script: '/home/shayon/youthspike-nest-backend/dist/main.js',
      env: {
        NODE_ENV: 'production',
        PORT: 4001,
        REDIS_CLUSTER_NODES: '127.0.0.1:7000,127.0.0.1:7001,127.0.0.1:7002,127.0.0.1:7003,127.0.0.1:7004,127.0.0.1:7005',
      },
    },
    {
      name: 'BackendAPI_4002',
      script: '/home/shayon/youthspike-nest-backend/dist/main.js',
      env: {
        NODE_ENV: 'production',
        PORT: 4002,
        REDIS_CLUSTER_NODES: '127.0.0.1:7000,127.0.0.1:7001,127.0.0.1:7002,127.0.0.1:7003,127.0.0.1:7004,127.0.0.1:7005',
      },
    },
    {
      name: 'BackendAPI_4003',
      script: '/home/shayon/youthspike-nest-backend/dist/main.js',
      env: {
        NODE_ENV: 'production',
        PORT: 4003,
        REDIS_CLUSTER_NODES: '127.0.0.1:7000,127.0.0.1:7001,127.0.0.1:7002,127.0.0.1:7003,127.0.0.1:7004,127.0.0.1:7005',
      },
    },
  ],
};
*/