module.exports = {
  apps: [
    {
      name: 'wzchat-backend',
      script: 'dist/server.js',
      cwd: '/home/deploy/wzchat/backend',
      env_file: '/home/deploy/wzchat/backend/.env',
      env: {
        NODE_ENV: 'production',
        UV_THREADPOOL_SIZE: 32,
        NODE_NO_WARNINGS: 1,
        CONNECTIONS_LIMIT: 9999,
        USER_LIMIT: 9999,
        MESSAGE_QUEUE_SIZE: 1000,
        MESSAGE_BATCH_SIZE: 50,
        GC_FREQUENCY: 100,
        MEMORY_PRESSURE_THRESHOLD: 0.8,
        CONNECTION_POOL_SIZE: 100,
        SESSION_TIMEOUT: 300000,
        HEAP_SNAPSHOT_INTERVAL: 3600000
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '32G',
      node_args: '--max-old-space-size=28672 --max-semi-space-size=512 --max-http-header-size=16384 --optimize-for-size --gc-interval=100 --expose-gc --max-executable-size=4096',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      kill_timeout: 5000,
      listen_timeout: 10000,
      wait_ready: true,
      error_file: '/root/.pm2/logs/wzchat-backend-error.log',
      out_file: '/root/.pm2/logs/wzchat-backend-out.log',
      log_file: '/root/.pm2/logs/wzchat-backend-combined.log',
      time: true
    },
    {
      name: 'wzchat-frontend',
      script: 'server.js',
      cwd: '/home/deploy/wzchat/frontend',
      env_file: '/home/deploy/wzchat/frontend/.env',
      env: {
        NODE_ENV: 'production',
        UV_THREADPOOL_SIZE: 16,
        NODE_NO_WARNINGS: 1,
        CACHE_SIZE: 1000,
        STATIC_CACHE_TTL: 3600000,
        COMPRESSION_LEVEL: 6,
        MAX_CONNECTIONS: 1000
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '16G',
      node_args: '--max-old-space-size=8192 --max-semi-space-size=256 --optimize-for-size --gc-interval=200 --expose-gc',
      error_file: '/root/.pm2/logs/wzchat-frontend-error.log',
      out_file: '/root/.pm2/logs/wzchat-frontend-out.log',
      log_file: '/root/.pm2/logs/wzchat-frontend-combined.log',
      time: true
    }
  ]
};
