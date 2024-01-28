module.exports = {
    apps: [
      {
        name: 'next_frontend_admin', // Change this to your app's name
        script: 'npm',
        args: 'start',
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
          NODE_ENV: 'production',
          PORT: 3000, // Change this to the port your app listens on
        },
      },
    ],
  };