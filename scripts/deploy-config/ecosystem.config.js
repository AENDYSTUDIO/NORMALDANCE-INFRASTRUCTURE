// PM2 Ecosystem Configuration for NORMALDANCE
// Production-ready cluster mode with auto-restart

module.exports = {
  apps: [{
    name: 'normaldance',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/normaldance',
    
    // Cluster mode для использования всех CPU
    instances: 'max',
    exec_mode: 'cluster',
    
    // Auto-restart при превышении лимита памяти
    max_memory_restart: '1G',
    
    // Environment variables
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    
    // Логи
    error_file: '/var/log/pm2/normaldance-error.log',
    out_file: '/var/log/pm2/normaldance-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // Auto-restart настройки
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s',
    
    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    
    // Задержка между рестартами
    restart_delay: 4000,
    
    // Exponential backoff при частых падениях
    exp_backoff_restart_delay: 100,
    
    // Cron для рестарта (опционально, каждую ночь в 4:00)
    // cron_restart: '0 4 * * *',
    
    // Source map support
    source_map_support: true,
    
    // Instance var для различия логов
    instance_var: 'INSTANCE_ID'
  }]
};
