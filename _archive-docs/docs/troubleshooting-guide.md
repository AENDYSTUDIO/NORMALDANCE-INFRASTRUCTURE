# 🔧 Инструкции по troubleshooting для распространенных проблем

## 📋 Введение

Это руководство содержит инструкции по диагностике и решению распространенных проблем, с которыми могут столкнуться пользователи и администраторы платформы NORMAL DANCE v1.0.1. Руководство структурировано по категориям проблем для быстрого поиска решений.

### 🎯 Цели
- Предоставление пошаговых инструкций по решению проблем
- Сокращение времени простоя платформы
- Повышение качества технической поддержки
- Документирование лучших практик решения проблем

### 📊 Категории проблем
1. **Проблемы подключения** - проблемы с доступом к платформе
2. **Проблемы аудио** - проблемы с воспроизведением звука
3. **Проблемы кошелька** - проблемы с Web3 интеграцией
4. **Проблемы базы данных** - проблемы с хранением данных
5. **Проблемы производительности** - проблемы с производительностью
6. **Проблемы безопасности** - проблемы безопасности
7. **Проблемы развертывания** - проблемы с развертыванием

## 🔌 Проблемы подключения

### Проблема 1: Сайт не загружается

**Симптомы:**
- Пользователь видит ошибку "Сайт недоступен"
- Время ожидания загрузки превышает 30 секунд
- Браузер показывает ошибку соединения

**Диагностика:**
```bash
# Проверка доступности сайта
curl -I https://normaldance.com

# Проверка DNS
nslookup normaldance.com

# Проверка ping
ping normaldance.com

# Проверка портов
telnet normaldance.com 443
```

**Решение:**
1. **Проверка сервера**
   ```bash
   # Проверка статуса сервисов
   sudo systemctl status nginx
   sudo systemctl status normaldance-api
   
   # Проверка логов
   sudo tail -f /var/log/nginx/error.log
   sudo tail -f /var/log/normaldance/error.log
   ```

2. **Перезапуск сервисов**
   ```bash
   sudo systemctl restart nginx
   sudo systemctl restart normaldance-api
   ```

3. **Проверка SSL сертификата**
   ```bash
   openssl s_client -connect normaldance.com:443 -servername normaldance.com
   ```

4. **Проверка CDN**
   ```bash
   # Проверка кеша CDN
   curl -H "Cache-Control: no-cache" https://normaldance.com
   ```

### Проблема 2: WebSocket соединение не устанавливается

**Симптомы:**
- Не работает чат в реальном времени
- Не обновляются онлайн статусы
- Ошибки в консоли браузера

**Диагностика:**
```javascript
// Проверка WebSocket соединения в консоли браузера
const socket = new WebSocket('wss://normaldance.com/socket.io');
socket.onopen = () => console.log('WebSocket connected');
socket.onerror = (error) => console.log('WebSocket error:', error);
```

**Решение:**
1. **Проверка WebSocket сервера**
   ```bash
   # Проверка статуса
   sudo systemctl status normaldance-websocket
   
   # Проверка логов
   sudo tail -f /var/log/normaldance/websocket.log
   ```

2. **Проверка портов**
   ```bash
   # Проверка открытых портов
   sudo netstat -tlnp | grep 3001
   
   # Проверка брандмауэра
   sudo ufw status
   sudo ufw allow 3001
   ```

3. **Проверка конфигурации Nginx**
   ```nginx
   # /etc/nginx/sites-available/normaldance
   location /socket.io/ {
       proxy_pass http://localhost:3001;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
   }
   ```

4. **Тестирование WebSocket**
   ```bash
   # Использование wscat для тестирования
   npm install -g wscat
   wscat -c wss://normaldance.com/socket.io
   ```

## 🎵 Проблемы аудио

### Проблема 1: Трек не воспроизводится

**Симптомы:**
- Плеер показывает загрузку, но трек не начинается
- Звук не слышен
- Ошибка в консоли браузера

**Диагностика:**
```javascript
// Проверка аудио элемента
const audio = document.querySelector('audio');
console.log(audio.error);
console.log(audio.src);
console.log(audio.readyState);
```

**Решение:**
1. **Проверка аудио файла**
   ```bash
   # Проверка существования файла
   ls -la /var/normaldance/uploads/tracks/
   
   # Проверка прав доступа
   ls -la /var/normaldance/uploads/tracks/track_123.mp3
   
   # Проверка целостности файла
   file /var/normaldance/uploads/tracks/track_123.mp3
   ```

2. **Проверка аудио сервиса**
   ```bash
   # Проверка статуса
   sudo systemctl status normaldance-audio
   
   # Проверка логов
   sudo tail -f /var/log/normaldance/audio.log
   ```

3. **Проверка формата аудио**
   ```javascript
   // Проверка поддержки браузером
   const audio = new Audio();
   console.log(audio.canPlayType('audio/mpeg'));
   console.log(audio.canPlayType('audio/ogg'));
   console.log(audio.canPlayType('audio/wav'));
   ```

4. **Проверка качества звука**
   ```javascript
   // Проверка качества звука
   const audioContext = new (window.AudioContext || window.webkitAudioContext)();
   const analyser = audioContext.createAnalyser();
   const source = audioContext.createMediaElementSource(audio);
   source.connect(analyser);
   analyser.connect(audioContext.destination);
   ```

### Проблема 2: Плохое качество звука

**Симптомы:**
- Звук хрипит
- Пропадает звук
- Задержка звука

**Решение:**
1. **Проверка качества аудио**
   ```bash
   # Проверка битрейта
   ffprobe -v quiet -print_format json -show_format -show_streams /var/normaldance/uploads/tracks/track_123.mp3 | jq '.format.bit_rate'
   
   # Проверка частоты дискретизации
   ffprobe -v quiet -print_format json -show_format -show_streams /var/normaldance/uploads/tracks/track_123.mp3 | jq '.streams[0].sample_rate'
   ```

2. **Проверка сети**
   ```bash
   # Проверка скорости интернета
   speedtest-cli
   
   # Проверка пинга
   ping -c 4 normaldance.com
   ```

3. **Настройка качества звука**
   ```javascript
   // Настройка качества звука
   const audio = new Audio();
   audio.preload = 'auto';
   audio.src = 'https://normaldance.com/audio/track_123.mp3';
   
   // Настройка буфера
   audio.buffered = true;
   audio.crossOrigin = 'anonymous';
   ```

4. **Проверка CDN**
   ```bash
   # Проверка CDN
   curl -I https://cdn.normaldance.com/audio/track_123.mp3
   ```

## 💰 Проблемы кошелька

### Проблема 1: Кошелек не подключается

**Симптомы:**
- Кнопка подключения кошелька не работает
- Ошибка "Кошелек не найден"
- Не открывается окно подключения

**Диагностика:**
```javascript
// Проверка наличия кошелька
if (window.solana) {
  console.log('Phantom wallet found');
} else {
  console.log('Phantom wallet not found');
}
```

**Решение:**
1. **Проверка установки кошелька**
   - Убедиться, что установлен Phantom кошелек
   - Проверить версию кошелька (последняя версия)
   - Проверить, что кошелек включен в браузере

2. **Проверка разрешений браузера**
   ```javascript
   // Проверка разрешений
   console.log(navigator.permissions.query({ name: 'wallet' }));
   ```

3. **Проверка конфигурации приложения**
   ```javascript
   // Проверка конфигурации
   console.log(window.solana);
   console.log(window.solana.isPhantom);
   ```

4. **Проверка RPC URL**
   ```javascript
   // Проверка RPC URL
   const connection = new solana.Connection('https://api.mainnet-beta.solana.com');
   console.log(connection.rpcEndpoint);
   ```

### Проблема 2: Транзакция не подтверждается

**Симптомы:**
- Транзакция висит в статусе "Pending"
- Не приходит подтверждение
- Ошибка "Транзакция отклонена"

**Диагностика:**
```javascript
// Проверка статуса транзакции
const connection = new solana.Connection('https://api.mainnet-beta.solana.com');
const signature = 'транзакция_сигнатура';
connection.confirmTransaction(signature, 'confirmed')
  .then(res => console.log(res))
  .catch(err => console.log(err));
```

**Решение:**
1. **Проверка статуса сети**
   ```bash
   # Проверка статуса Solana
   curl https://api.mainnet-beta.solana.com
   
   # Проверка загрузки сети
   curl https://api.mainnet-beta.solana.com -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getRecentBlockhash","params":[]}'
   ```

2. **Проверка газа**
   ```javascript
   // Проверка газа
   const connection = new solana.Connection('https://api.mainnet-beta.solana.com');
   connection.getRecentBlockhash().then(res => {
     console.log('Recent blockhash:', res.blockhash);
     console.log('Fee calculator:', res.feeCalculator);
   });
   ```

3. **Повторная отправка транзакции**
   ```javascript
   // Повторная отправка транзакции
   const connection = new solana.Connection('https://api.mainnet-beta.solana.com');
   const transaction = new Transaction();
   // Добавление инструкций
   connection.sendTransaction(transaction, [signer])
     .then(signature => {
       console.log('Transaction sent:', signature);
     })
     .catch(err => {
       console.log('Error sending transaction:', err);
     });
   ```

4. **Проверка баланса**
   ```javascript
   // Проверка баланса
   const connection = new solana.Connection('https://api.mainnet-beta.solana.com');
   connection.getBalance(publicKey)
     .then(balance => {
       console.log('Balance:', balance / 1e9, 'SOL');
     })
     .catch(err => {
       console.log('Error getting balance:', err);
     });
   ```

## 🗄️ Проблемы базы данных

### Проблема 1: Медленные запросы к базе данных

**Симптомы:**
- Страницы загружаются медленно
- API ответы занимают много времени
- Ошибки таймаута

**Диагностика:**
```sql
-- Проверка медленных запросов
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Проверка блокировок
SELECT blocked_locks.pid AS blocked_pid,
         blocked_activity.usename AS blocked_user,
         blocking_locks.pid AS blocking_pid,
         blocking_activity.usename AS blocking_user,
         blocked_activity.query AS blocked_statement,
         blocking_activity.query AS current_statement_in_blocking_process,
         blocked_locks.mode AS blocked_mode,
         blocking_locks.mode AS current_mode_in_blocking_process
FROM pg_catalog.pg_locks blocked_locks
    JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
    JOIN pg_catalog.pg_locks blocking_locks
        ON blocking_locks.locktype = blocked_locks.locktype
        AND blocking_locks.DATABASE IS NOT DISTINCT FROM blocked_locks.DATABASE
        AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
        AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
        AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
        AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
        AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
        AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
        AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
        AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
        AND blocking_locks.pid != blocked_locks.pid
    JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.GRANTED;
```

**Решение:**
1. **Проверка индексов**
   ```sql
   -- Проверка отсутствующих индексов
   SELECT schemaname, tablename, attname, indexdef
   FROM pg_stat_user_indexes
   JOIN pg_index ON indexrelid = indexrelid
   JOIN pg_attribute ON attrelid = indrelid AND attnum = ANY(indkey)
   WHERE indisunique = false AND indisprimary = false
   ORDER BY schemaname, tablename, attname;
   
   -- Добавление индекса
   CREATE INDEX idx_tracks_created_at ON tracks(created_at);
   CREATE INDEX idx_tracks_artist_id ON tracks(artist_id);
   CREATE INDEX idx_users_email ON users(email);
   ```

2. **Оптимизация запросов**
   ```sql
   -- Использование EXPLAIN ANALYZE
   EXPLAIN ANALYZE SELECT * FROM tracks WHERE artist_id = '123';
   
   -- Оптимизация JOIN
   EXPLAIN ANALYZE SELECT t.*, u.username 
   FROM tracks t 
   JOIN users u ON t.artist_id = u.id 
   WHERE t.genre = 'electronic';
   ```

3. **Проверка статистики**
   ```sql
   -- Обновление статистики
   ANALYZE tracks;
   ANALYZE users;
   ANALYZE nfts;
   
   -- Проверка статистики
   SELECT schemaname, tablename, attname, n_distinct, correlation
   FROM pg_stats
   WHERE tablename IN ('tracks', 'users', 'nfts');
   ```

4. **Проверка производительности**
   ```bash
   # Проверка производительности базы данных
   pgbench -i normaldance
   pgbench -c 10 -j 2 -t 1000 normaldance
   ```

### Проблема 2: Ошибки подключения к базе данных

**Симптомы:**
- Ошибка "Connection refused"
- Ошибка "Timeout"
- Ошибка "Too many connections"

**Решение:**
1. **Проверка статуса PostgreSQL**
   ```bash
   # Проверка статуса
   sudo systemctl status postgresql
   
   # Проверка логов
   sudo tail -f /var/log/postgresql/postgresql-14-main.log
   
   # Проверка портов
   sudo netstat -tlnp | grep 5432
   ```

2. **Проверка конфигурации**
   ```bash
   # Проверка конфигурации
   sudo cat /etc/postgresql/14/main/postgresql.conf | grep -E 'max_connections|shared_buffers|effective_cache_size'
   
   # Проверка подключений
   sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"
   ```

3. **Настройка пула соединений**
   ```javascript
   // Настройка Prisma connection pool
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
     pool_size = 10
     connection_limit = 20
     connection_timeout = 30
     idle_timeout = 300
     max_lifetime = 3600
   }
   ```

4. **Проверка ресурсов**
   ```bash
   # Проверка памяти
   free -h
   
   # Проверка диска
   df -h
   
   # Проверка CPU
   top -p $(pgrep postgres)
   ```

## ⚡ Проблемы производительности

### Проблема 1: Высокая загрузка CPU

**Симптомы:**
- Система работает медленно
- Задержки в ответах
- Высокая температура процессора

**Диагностика:**
```bash
# Проверка загрузки CPU
top -p $(pgrep normaldance)

# Проверка процессов
ps aux | grep normaldance

# Проверка системных вызовов
strace -p $(pgrep normaldance)
```

**Решение:**
1. **Оптимизация кода**
   ```javascript
   // Использование кеширования
   const cache = new Map();
   
   function getCachedData(key) {
     if (cache.has(key)) {
       return cache.get(key);
     }
     
     const data = fetchData(key);
     cache.set(key, data);
     return data;
   }
   
   // Оптимизация циклов
   const optimizedLoop = (data) => {
     const result = new Array(data.length);
     for (let i = 0; i < data.length; i++) {
       result[i] = processData(data[i]);
     }
     return result;
   };
   ```

2. **Проверка утечек памяти**
   ```javascript
   // Проверка памяти
   console.log(process.memoryUsage());
   
   // Проверка кеша
   console.log('Cache size:', cache.size);
   
   // Очистка кеша
   if (cache.size > 1000) {
     cache.clear();
   }
   ```

3. **Масштабирование**
   ```yaml
   # Kubernetes HPA
   apiVersion: autoscaling/v2
   kind: HorizontalPodAutoscaler
   metadata:
     name: normaldance-hpa
   spec:
     scaleTargetRef:
       apiVersion: apps/v1
       kind: Deployment
       name: normaldance
     minReplicas: 2
     maxReplicas: 10
     metrics:
     - type: Resource
       resource:
         name: cpu
         target:
           type: Utilization
           averageUtilization: 70
   ```

4. **Оптимизация базы данных**
   ```sql
   -- Оптимизация запросов
   EXPLAIN ANALYZE SELECT * FROM tracks WHERE created_at > NOW() - INTERVAL '7 days';
   
   -- Использование материализованных представлений
   CREATE MATERIALIZED VIEW mv_weekly_stats AS
   SELECT 
     DATE_TRUNC('week', created_at) as week,
     COUNT(*) as track_count,
     SUM(play_count) as total_plays
   FROM tracks
   GROUP BY DATE_TRUNC('week', created_at);
   
   -- Обновление материализованного представления
   REFRESH MATERIALIZED VIEW mv_weekly_stats;
   ```

### Проблема 2: Медленная загрузка страниц

**Симптомы:**
- Страницы загружаются более 3 секунд
- Пользователи уходят с сайта
- Низкая конверсия

**Решение:**
1. **Оптимизация изображений**
   ```javascript
   // Оптимизация изображений
   const optimizeImage = async (imageUrl) => {
     const response = await fetch(imageUrl);
     const blob = await response.blob();
     const optimizedBlob = await compressImage(blob);
     return URL.createObjectURL(optimizedBlob);
   };
   
   // Ленивая загрузка
   const LazyImage = ({ src, alt }) => {
     const [imageSrc, setImageSrc] = useState(null);
     
     useEffect(() => {
       const img = new Image();
       img.src = src;
       img.onload = () => setImageSrc(src);
     }, [src]);
     
     return imageSrc ? <img src={imageSrc} alt={alt} /> : <div>Loading...</div>;
   };
   ```

2. **Оптимизация JavaScript**
   ```javascript
   // Разделение кода
   const LazyComponent = React.lazy(() => import('./LazyComponent'));
   
   // Предзагрузка
   const preloadComponent = () => {
     import('./LazyComponent');
   };
   
   // Оптимизация бандлов
   const config = {
     optimization: {
       splitChunks: {
         chunks: 'all',
         minSize: 30000,
         maxSize: 0,
         minChunks: 1,
         maxAsyncRequests: 5,
         maxInitialRequests: 3,
         automaticNameDelimiter: '~',
         cacheGroups: {
           vendors: {
             test: /[\\/]node_modules[\\/]/,
             priority: -10
           },
           default: {
             minChunks: 2,
             priority: -20,
             reuseExistingChunk: true
           }
         }
       }
     }
   };
   ```

3. **Оптимизация CSS**
   ```css
   /* Critical CSS */
   .critical-css {
     /* Стили для выше склада */
   }
   
   /* Non-critical CSS */
   .non-critical-css {
     /* Стили для ниже склада */
   }
   
   /* Оптимизация шрифтов */
   @font-face {
     font-family: 'CustomFont';
     src: url('fonts/custom-font.woff2') format('woff2');
     font-display: swap;
   }
   ```

4. **Кеширование**
   ```javascript
   // Service Worker
   const CACHE_NAME = 'normaldance-v1';
   const urlsToCache = [
     '/',
     '/static/js/bundle.js',
     '/static/css/main.css'
   ];
   
   self.addEventListener('install', event => {
     event.waitUntil(
       caches.open(CACHE_NAME)
         .then(cache => cache.addAll(urlsToCache))
     );
   });
   
   self.addEventListener('fetch', event => {
     event.respondWith(
       caches.match(event.request)
         .then(response => {
           return response || fetch(event.request);
         })
     );
   });
   ```

## 🔒 Проблемы безопасности

### Проблема 1: Уязвимость XSS

**Симптомы:**
- Подозрительный JavaScript код в браузере
- Перенаправление на другие сайты
- Кража данных пользователей

**Диагностика:**
```javascript
// Проверка на XSS
const userInput = '<script>alert("XSS")</script>';
console.log('User input contains script:', userInput.includes('<script>'));
```

**Решение:**
1. **Экранирование данных**
   ```javascript
   // Использование DOMPurify
   import DOMPurify from 'dompurify';
   
   const sanitizeInput = (input) => {
     return DOMPurify.sanitize(input);
   };
   
   // Использование React
   const SafeComponent = ({ content }) => {
     const sanitizedContent = sanitizeInput(content);
     return <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />;
   };
   ```

2. **CSP заголовки**
   ```nginx
   # Настройка CSP
   add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://api.normaldance.com;";
   add_header X-Content-Type-Options "nosniff";
   add_header X-Frame-Options "SAMEORIGIN";
   add_header X-XSS-Protection "1; mode=block";
   ```

3. **Валидация ввода**
   ```javascript
   // Использование Zod для валидации
   import { z } from 'zod';
   
   const userSchema = z.object({
     username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
     email: z.string().email(),
     password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
   });
   
   const validateUser = (userData) => {
     return userSchema.parse(userData);
   };
   ```

4. **Проверка зависимостей**
   ```bash
   # Проверка уязвимостей
   npm audit
   
   # Автоматическое исправление
   npm audit fix
   
   # Проверка безопасности контейнеров
   docker scan normaldance:latest
   ```

### Проблема 2: Атаки DDoS

**Симптомы:**
- Высокая нагрузка на сервер
- Замедление работы сайта
- Недоступность сервиса

**Решение:**
1. **Настройка rate limiting**
   ```nginx
   # Rate limiting в Nginx
   limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
   limit_req_zone $binary_remote_addr zone=login:10m rate=1r/m;
   
   server {
     location /api/ {
       limit_req zone=api burst=20 nodelay;
       proxy_pass http://backend;
     }
     
     location /auth/login {
       limit_req zone=login burst=5 nodelay;
       proxy_pass http://backend;
     }
   }
   ```

2. **Cloudflare защита**
   ```javascript
   // Проверка Cloudflare
   if ('cf' in window) {
     console.log('Cloudflare detected');
     console.log('Country:', cf.country);
     console.log('IP:', cf.ip);
     console.log('Threat score:', cf.threat.score);
   }
   ```

3. **Мониторинг аномалий**
   ```javascript
   // Мониторинг подозрительной активности
   const monitorSuspiciousActivity = () => {
     const events = [];
     let lastEventTime = Date.now();
     
     window.addEventListener('click', (e) => {
       const currentTime = Date.now();
       if (currentTime - lastEventTime < 100) {
         events.push('rapid_clicks');
       }
       lastEventTime = currentTime;
     });
     
     setInterval(() => {
       if (events.length > 50) {
         reportSuspiciousActivity('rapid_clicks', events.length);
       }
       events.length = 0;
     }, 5000);
   };
   ```

4. **Блокировка IP адресов**
   ```bash
   # Блокировка IP адресов
   iptables -A INPUT -s 192.168.1.100 -j DROP
   
   # Проверка заблокированных IP
   iptables -L -n -v
   
   # Очистка правил
   iptables -F
   ```

## 🚀 Проблемы развертывания

### Проблема 1: Ошибка сборки Docker

**Симптомы:**
- Ошибка при выполнении `docker build`
- Ошибка при запуске контейнера
- Ошибка при запуске приложения

**Решение:**
1. **Проверка Dockerfile**
   ```dockerfile
   # Оптимизированный Dockerfile
   FROM node:18-alpine AS base
   
   # Установка зависимостей
   FROM base AS deps
   RUN apk add --no-cache libc6-compat
   WORKDIR /app
   
   COPY package.json package-lock.json* ./
   RUN npm ci --only=production
   
   # Сборка приложения
   FROM base AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   
   # Сборка
   RUN npm run build
   
   # Production image
   FROM base AS runner
   WORKDIR /app
   
   ENV NODE_ENV=production
   ENV PORT=3000
   
   RUN addgroup --system --gid 1001 nodejs
   RUN adduser --system --uid 1001 nextjs
   
   COPY --from=builder /app/public ./public
   COPY --from=builder /app/.next/standalone ./
   COPY --from=builder /app/.next/static ./.next/static
   
   USER nextjs
   
   EXPOSE 3000
   
   ENV PORT=3000
   
   CMD ["node", "server.js"]
   ```

2. **Проверка сборки**
   ```bash
   # Сборка образа
   docker build -t normaldance:latest .
   
   # Проверка образа
   docker images | grep normaldance
   
   # Запуск контейнера
   docker run -p 3000:3000 normaldance:latest
   ```

3. **Проверка логов**
   ```bash
   # Проверка логов сборки
   docker build --no-cache --progress=plain . 2>&1 | tee build.log
   
   # Проверка логов контейнера
   docker logs normaldance-container
   ```

4. **Оптимизация сборки**
   ```bash
   # Использование build cache
   docker build --target=builder --build-arg NODE_ENV=production .
   
   # Использование multi-stage builds
   docker build --target=runner .
   
   # Использование docker-compose
   docker-compose up --build
   ```

### Проблема 2: Ошибка Kubernetes развертывания

**Симптомы:**
- Под не запускается
- Ошибка CrashLoopBackOff
- Ошибка ImagePullBackOff

**Решение:**
1. **Проверка статуса подов**
   ```bash
   # Проверка статуса подов
   kubectl get pods -n normaldance
   
   # Проверка событий
   kubectl get events -n normaldance
   
   # Проверка логов
   kubectl logs -n normaldance pod-name
   kubectl logs -n normaldance pod-name --previous
   ```

2. **Проверка конфигурации**
   ```yaml
   # Проверка конфигурации
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: normaldance
     namespace: normaldance
   spec:
     replicas: 3
     selector:
       matchLabels:
         app: normaldance
     template:
       metadata:
         labels:
           app: normaldance
       spec:
         containers:
         - name: normaldance
           image: normaldance:latest
           ports:
           - containerPort: 3000
           env:
           - name: NODE_ENV
             value: "production"
           - name: DATABASE_URL
             valueFrom:
               secretKeyRef:
                 name: database-secret
                 key: url
           resources:
             requests:
               memory: "256Mi"
               cpu: "250m"
             limits:
               memory: "512Mi"
               cpu: "500m"
           livenessProbe:
             httpGet:
               path: /api/health
               port: 3000
             initialDelaySeconds: 30
             periodSeconds: 10
           readinessProbe:
             httpGet:
               path: /api/health
               port: 3000
             initialDelaySeconds: 5
             periodSeconds: 5
   ```

3. **Проверка ресурсов**
   ```bash
   # Проверка ресурсов
   kubectl describe pod -n normaldance pod-name
   
   # Проверка ограничений
   kubectl get resourcequota -n normaldance
   
   # Проверка лимитов
   kubectl get limitrange -n normaldance
   ```

4. **Проверка сети**
   ```bash
   # Проверка сети
   kubectl get svc -n normaldance
   kubectl get endpoints -n normaldance
   
   # Проверка политики сети
   kubectl get networkpolicy -n normaldance
   
   # Проверка DNS
   kubectl exec -n normaldance pod-name -- nslookup normaldance-api
   ```

## 📞 Контакты поддержки

### Техническая поддержка
- **Email:** support@normaldance.com
- **Телефон:** +7 (495) 123-45-67
- **Чат:** Live Chat на сайте
- **Telegram:** @normaldance_support

### DevOps команда
- **Email:** devops@normaldance.com
- **Slack:** #devops-issues
- **PagerDuty:** Для критических инцидентов

### Команда разработки
- **Email:** dev@normaldance.com
- **Slack:** #dev-issues
- **GitHub Issues:** https://github.com/normaldance/normaldance/issues

### Система мониторинга
- **Статус платформы:** https://status.normaldance.com
- **Grafana:** https://grafana.normaldance.com
- **Prometheus:** https://prometheus.normaldance.com

## 📚 Дополнительные ресурсы

### Документация
- [Официальная документация](https://docs.normaldance.com)
- [API документация](https://api.normaldance.com/docs)
- [Руководство по разработке](https://docs.normaldance.com/development)

### Инструменты
- [GitHub](https://github.com/normaldance/normaldance)
- [Docker Hub](https://hub.docker.com/r/normaldance/normaldance)
- [Kubernetes Charts](https://github.com/normaldance/helm-charts)

### Сообщество
- [Discord](https://discord.gg/normaldance)
- [Telegram](https://t.me/normaldance)
- [Twitter](https://twitter.com/normaldance)

---

**Создано:** Сентябрь 2025
**Версия:** v1.0.1
**Обновлено:** Последнее обновление: Сентябрь 2025
**Ответственный:** Support Lead - Смирнов А.В.