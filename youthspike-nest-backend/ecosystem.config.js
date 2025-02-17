module.exports = {
  apps: [
    {
      name: 'BackendAPI_4001',
      script: '/home/shayon/youthspike-nest-backend/dist/main.js',
      watch: true,
      ignore_watch: ['node_modules', 'logs'],
      exec_mode: 'fork',
      instances: 1,
      max_memory_restart: '1G',
      autorestart: true,
      restart_delay: 3000,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      error_file: 'logs/error.log',
      out_file: 'logs/out.log',
      env: {
        NODE_ENV: 'production',
        PORT: 4001,
      },
    },
    {
      name: 'BackendAPI_4002',
      script: '/home/shayon/youthspike-nest-backend/dist/main.js',
      watch: true,
      ignore_watch: ['node_modules', 'logs'],
      exec_mode: 'fork',
      instances: 1,
      max_memory_restart: '1G',
      autorestart: true,
      restart_delay: 3000,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      error_file: 'logs/error.log',
      out_file: 'logs/out.log',
      env: {
        NODE_ENV: 'production',
        PORT: 4002,
      },
    },
    {
      name: 'BackendAPI_4003',
      script: '/home/shayon/youthspike-nest-backend/dist/main.js',
      watch: true,
      ignore_watch: ['node_modules', 'logs'],
      exec_mode: 'fork',
      instances: 1,
      max_memory_restart: '1G',
      autorestart: true,
      restart_delay: 3000,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      error_file: 'logs/error.log',
      out_file: 'logs/out.log',
      env: {
        NODE_ENV: 'production',
        PORT: 4003,
      },
    },
  ],
};

/*
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
*/
