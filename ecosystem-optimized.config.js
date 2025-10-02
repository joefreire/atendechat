module.exports = {
  apps: [
    {
      name: 'wzchat-backend-optimized',
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
        HEAP_SNAPSHOT_INTERVAL: 3600000,
        // Configurações de otimização do WhatsApp
        WHATSAPP_RECONNECTION_MAX_RETRIES: 10,
        WHATSAPP_RECONNECTION_BASE_DELAY: 2000,
        WHATSAPP_RECONNECTION_MAX_DELAY: 300000,
        WHATSAPP_CIRCUIT_BREAKER_THRESHOLD: 5,
        WHATSAPP_CIRCUIT_BREAKER_TIMEOUT: 600000,
        WHATSAPP_PERFORMANCE_MONITORING: true,
        WHATSAPP_HEALTH_CHECK_INTERVAL: 30000,
        WHATSAPP_MEMORY_THRESHOLD: 0.8,
        WHATSAPP_CPU_THRESHOLD: 0.9,
        WHATSAPP_ERROR_RATE_THRESHOLD: 0.1,
        WHATSAPP_RESPONSE_TIME_THRESHOLD: 5000
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '32G',
      node_args: '--max-old-space-size=28672 --max-semi-space-size=512 --max-http-header-size=16384 --optimize-for-size --gc-interval=100 --expose-gc',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      kill_timeout: 5000,
      listen_timeout: 10000,
      wait_ready: true,
      error_file: '/root/.pm2/logs/wzchat-backend-optimized-error.log',
      out_file: '/root/.pm2/logs/wzchat-backend-optimized-out.log',
      log_file: '/root/.pm2/logs/wzchat-backend-optimized-combined.log',
      time: true,
      // Configurações de monitoramento
      monitoring: true,
      pmx: true,
      // Configurações de cluster (se necessário)
      cluster: {
        instances: 1,
        exec_mode: 'fork'
      }
    },
    {
      name: 'wzchat-frontend-optimized',
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
        MAX_CONNECTIONS: 1000,
        // Configurações de otimização do frontend
        FRONTEND_OPTIMIZATION: true,
        FRONTEND_CACHE_ENABLED: true,
        FRONTEND_COMPRESSION_ENABLED: true,
        FRONTEND_GZIP_LEVEL: 6
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '16G',
      node_args: '--max-old-space-size=8192 --max-semi-space-size=256 --optimize-for-size --gc-interval=200 --expose-gc',
      error_file: '/root/.pm2/logs/wzchat-frontend-optimized-error.log',
      out_file: '/root/.pm2/logs/wzchat-frontend-optimized-out.log',
      log_file: '/root/.pm2/logs/wzchat-frontend-optimized-combined.log',
      time: true,
      // Configurações de monitoramento
      monitoring: true,
      pmx: true
    }
  ],
  
  // Configurações globais do PM2
  deploy: {
    production: {
      user: 'root',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'git@github.com:your-repo/wzchat.git',
      path: '/home/deploy/wzchat',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem-optimized.config.js --env production'
    }
  }
};
