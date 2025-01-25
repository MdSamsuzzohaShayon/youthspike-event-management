/*
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
*/

// Clustering -> use this is there is no PM2 -> PM@ provides the same features
module.exports = {
  apps: [
    {
      name: 'nest_backend', // Your app name
      script: 'dist/main.js', // Path to the compiled app file
      exec_mode: 'cluster', // Run in cluster mode
      instances: 'max', // Use all available CPU cores
      autorestart: true,
      watch: false,
      max_memory_restart: '1G', // Restart workers that exceed 1GB memory usage
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
