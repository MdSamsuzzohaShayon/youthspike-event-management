module.exports = {
    apps: [
      {
        name: 'nest_backend', // Replace with your app name
        script: 'dist/main.js', // Replace with the path to your compiled main file
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
          NODE_ENV: 'development',
        },
        env_production: {
          NODE_ENV: 'production',
        },
      },
    ],
  };
