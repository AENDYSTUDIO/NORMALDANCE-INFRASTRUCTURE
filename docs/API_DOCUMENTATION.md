# 📖 API документация

## Обзор API

RESTful API для NORMAL DANCE платформы предоставляет доступ к музыкальному контенту, блокчейн операциям и пользовательским данным.

**Базовый URL**: `https://api.normaldance.com`

**Версия API**: v1

## 🔐 Аутентификация

API использует JWT токены для аутентификации:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     https://api.normaldance.com/api/tracks
```

### Получение токена

```http
POST /api/auth/login
Content-Type: application/json

{
  "wallet_address": "0x...",
  "signature": "signature..."
}
```

## 🎵 Треки (Tracks)

### Получение списка треков

```http
GET /api/tracks
```

**Параметры запроса:**
- `limit` (optional): Количество результатов (по умолчанию: 20)
- `offset` (optional): Смещение (по умолчанию: 0)
- `genre` (optional): Фильтр по жанру
- `artist` (optional): Фильтр по артисту

**Пример ответа:**
```json
{
  "tracks": [
    {
      "id": "track-123",
      "title": "Midnight Dreams",
      "artist": "DJ Normal",
      "duration": 245,
      "genre": "Electronic",
      "ipfs_hash": "QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o",
      "blockchain_tx": "5J8...9xK",
      "created_at": "2024-01-15T10:30:00Z",
      "nft_token_id": "NFT-456"
    }
  ],
  "total": 150,
  "has_more": true
}
```

### Получение конкретного трека

```http
GET /api/tracks/{track_id}
```

**Пример ответа:**
```json
{
  "id": "track-123",
  "title": "Midnight Dreams",
  "artist": "DJ Normal",
  "duration": 245,
  "genre": "Electronic",
  "description": "A mesmerizing electronic track...",
  "ipfs_hash": "QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o",
  "blockchain_tx": "5J8...9xK",
  "created_at": "2024-01-15T10:30:00Z",
  "nft_token_id": "NFT-456",
  "stream_url": "https://gateway.pinata.cloud/ipfs/QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o",
  "metadata": {
    "bpm": 128,
    "key": "Am",
    "energy": 0.85
  }
}
```

### Загрузка нового трека

```http
POST /api/tracks
Content-Type: multipart/form-data

Form Data:
- file: [audio file]
- title: "Track Title"
- artist: "Artist Name"
- genre: "Electronic"
- description: "Track description"
```

**Пример ответа:**
```json
{
  "id": "track-456",
  "title": "New Track",
  "upload_status": "processing",
  "ipfs_hash": null,
  "blockchain_tx": null
}
```

### Обновление трека

```http
PUT /api/tracks/{track_id}
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated description"
}
```

## 👥 Пользователи (Users)

### Профиль пользователя

```http
GET /api/users/{user_id}
```

**Пример ответа:**
```json
{
  "id": "user-123",
  "wallet_address": "0x742d35Cc6634C0532925a3b8D0A00C6F...",
  "username": "dj_normal",
  "avatar": "https://gateway.pinata.cloud/ipfs/QmAvatar...",
  "bio": "Electronic music producer and DJ",
  "followers_count": 1250,
  "following_count": 340,
  "tracks_count": 45,
  "created_at": "2023-08-10T14:20:00Z",
  "is_verified": true,
  "social_links": {
    "twitter": "https://twitter.com/djnormal",
    "instagram": "https://instagram.com/djnormal"
  }
}
```

### Подписки пользователя

```http
GET /api/users/{user_id}/followers
GET /api/users/{user_id}/following
```

## 🎨 NFT (Non-Fungible Tokens)

### Создание музыкального NFT

```http
POST /api/nft/create
Content-Type: application/json

{
  "track_id": "track-123",
  "name": "Midnight Dreams NFT",
  "description": "Exclusive NFT for the track Midnight Dreams",
  "royalty_percentage": 5.0,
  "total_supply": 100,
  "price_sol": 1.5
}
```

**Пример ответа:**
```json
{
  "nft_id": "nft-789",
  "mint_address": "ABC...123",
  "transaction_signature": "5J8...9xK",
  "status": "minting"
}
```

### Получение NFT коллекции

```http
GET /api/nft/collection/{collection_id}
```

## 💰 Платежи и транзакции

### Создание платежа

```http
POST /api/payments/create
Content-Type: application/json

{
  "amount": 1.5,
  "currency": "SOL",
  "description": "Purchase track NFT",
  "recipient_wallet": "0x742d35Cc6634C0532925a3b8D0A00C6F..."
}
```

**Пример ответа:**
```json
{
  "payment_id": "payment-123",
  "amount": 1.5,
  "currency": "SOL",
  "status": "pending",
  "solana_transaction": "5J8...9xK"
}
```

### История транзакций

```http
GET /api/transactions?limit=20&offset=0
```

## 🔍 Поиск

### Поиск по платформе

```http
GET /api/search?q=electronic&type=all
```

**Параметры:**
- `q`: Поисковый запрос
- `type`: Тип поиска (`tracks`, `artists`, `albums`, `all`)

**Пример ответа:**
```json
{
  "query": "electronic",
  "results": {
    "tracks": [...],
    "artists": [...],
    "albums": [...]
  },
  "total_results": 45
}
```

## 📊 Аналитика

### Статистика трека

```http
GET /api/analytics/tracks/{track_id}
```

**Пример ответа:**
```json
{
  "track_id": "track-123",
  "total_streams": 15420,
  "unique_listeners": 3240,
  "revenue": {
    "total": 245.67,
    "currency": "SOL"
  },
  "geographic_distribution": {
    "US": 45,
    "EU": 30,
    "ASIA": 25
  },
  "streaming_history": [
    {
      "date": "2024-01-15",
      "streams": 234
    }
  ]
}
```

### Платформенная аналитика

```http
GET /api/analytics/platform
```

Доступно только администраторам:

```json
{
  "total_users": 45678,
  "total_tracks": 12345,
  "total_streams": 2345678,
  "total_revenue": 45678.90,
  "active_users_today": 1234,
  "new_tracks_today": 45
}
```

## 🌐 WebSocket события

### Подключение к WebSocket

```javascript
const ws = new WebSocket('wss://api.normaldance.com/ws');

ws.onopen = () => {
  console.log('Connected to NORMAL DANCE WebSocket');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

### Типы событий

#### События воспроизведения
```json
{
  "type": "track_play",
  "data": {
    "track_id": "track-123",
    "user_id": "user-456",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

#### События транзакций
```json
{
  "type": "transaction_complete",
  "data": {
    "transaction_id": "tx-789",
    "status": "confirmed",
    "amount": 1.5
  }
}
```

#### События NFT
```json
{
  "type": "nft_minted",
  "data": {
    "nft_id": "nft-123",
    "token_id": "NFT-456",
    "owner": "0x742d35Cc6634C0532925a3b8D0A00C6F..."
  }
}
```

## 🔧 Админ API

### Управление пользователями

```http
GET /api/admin/users
POST /api/admin/users/{user_id}/verify
POST /api/admin/users/{user_id}/ban
```

### Управление контентом

```http
POST /api/admin/tracks/{track_id}/moderate
DELETE /api/admin/tracks/{track_id}
```

### Системные метрики

```http
GET /api/admin/metrics
GET /api/admin/health
```

## 🚨 Обработка ошибок

### Стандартные коды ошибок

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "title": ["Title is required"],
      "genre": ["Genre must be one of: electronic, rock, pop"]
    }
  }
}
```

### Коды состояния HTTP

- `200` - Успешный запрос
- `201` - Ресурс создан
- `400` - Ошибка валидации
- `401` - Не авторизован
- `403` - Доступ запрещен
- `404` - Ресурс не найден
- `429` - Слишком много запросов
- `500` - Внутренняя ошибка сервера

## 📝 Rate Limiting

API ограничивает количество запросов:

- **Бесплатный тариф**: 1000 запросов/час
- **Pro тариф**: 10000 запросов/час
- **Enterprise тариф**: Неограниченно

### Заголовки rate limiting

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1640995200
```

## 🔄 Версионирование API

Текущая версия: **v1**

Будущие изменения будут доступны через заголовок:
```http
Accept: application/vnd.normaldance.v2+json
```

## 📋 SDK и библиотеки

### JavaScript/TypeScript SDK

```bash
npm install @normaldance/sdk
```

```typescript
import { NormalDanceAPI } from '@normaldance/sdk';

const api = new NormalDanceAPI({
  apiKey: 'your-api-key',
  baseURL: 'https://api.normaldance.com'
});

// Загрузка трека
const track = await api.tracks.upload({
  file: audioFile,
  title: 'My Track',
  artist: 'Me'
});
```

### Python SDK

```bash
pip install normaldance-api
```

```python
from normaldance import API

api = API(api_key='your-api-key')

# Получение треков
tracks = api.get_tracks(genre='electronic')
```

### REST API инструменты

- **Postman коллекция**: [скачать](./api/postman-collection.json)
- **OpenAPI спецификация**: [скачать](./api/openapi.yaml)
- **Insomnia workspace**: [скачать](./api/insomnia.json)

## 🤝 Поддержка

Для вопросов по API обращайтесь:

- **Email**: api-support@normaldance.com
- **Discord**: #api-support канал
- **Документация**: [developers.normaldance.com](https://developers.normaldance.com)

---

*API находится в активной разработке. Актуальную информацию всегда проверяйте в [документации разработчика](https://developers.normaldance.com).*
