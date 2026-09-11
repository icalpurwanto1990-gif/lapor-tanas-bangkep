module.exports = {
  apps: [
    {
      name: 'lapor-tanas',
      script: 'app.js',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
