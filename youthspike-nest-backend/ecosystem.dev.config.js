module.exports = {
  apps: [
    {
      name: 'BackendAPI_4001_DEV',
      script: 'nest',
      args: 'start --watch',
      env: {
        NODE_ENV: 'development',
        PORT: 4001,
        REDIS_HOST: '127.0.0.1', // shared for all
      },
    },
    {
      name: 'BackendAPI_4002_DEV',
      script: 'nest',
      args: 'start --watch',
      env: {
        NODE_ENV: 'development',
        PORT: 4002,
        REDIS_HOST: '127.0.0.1',
      },
    },
    {
      name: 'BackendAPI_4003_DEV',
      script: 'nest',
      args: 'start --watch',
      env: {
        NODE_ENV: 'development',
        PORT: 4003,
        REDIS_HOST: '127.0.0.1',
      },
    },
  ],
};
