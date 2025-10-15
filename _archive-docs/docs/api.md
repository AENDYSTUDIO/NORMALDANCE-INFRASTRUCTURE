# 📚 API документация NORMAL DANCE

Эта документация описывает все API endpoints для NormalDance платформы.

## 🌐 Базовый URL

```
https://api.normaldance.com/v1
```

## 🔐 Аутентификация

Большинство API endpoints требуют аутентификации через JWT токен.

### Формат заголовка
```
Authorization: Bearer <jwt_token>
```

### Получение токена
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

## 🎵 Треки

### Получить список треков
```http
GET /tracks

Query параметры:
- page: номер страницы (default: 1)
- limit: количество элементов на странице (default: 20, max: 100)
- genre: фильтр по жанру
- search: поиск по названию или артисту
- sort: сортировка (popular, newest, trending)
- artistId: фильтр по артисту

Response:
{
  "data": [
    {
      "id": "track_id",
      "title": "Название трека",
      "artistName": "Имя артиста",
      "genre": "electronic",
      "duration": 180,
      "playCount": 1000,
      "likeCount": 50,
      "imageUrl": "https://...",
      "audioUrl": "https://...",
      "createdAt": "2023-01-01T00:00:00Z",
      "isExplicit": false,
      "price": 9.99
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Получить трек по ID
```http
GET /tracks/{id}

Response:
{
  "id": "track_id",
  "title": "Название трека",
  "artistName": "Имя артиста",
  "genre": "electronic",
  "duration": 180,
  "playCount": 1000,
  "likeCount": 50,
  "imageUrl": "https://...",
  "audioUrl": "https://...",
  "lyrics": "Текст песни...",
  "metadata": {
    "bpm": 120,
    "key": "C#m",
    "energy": 0.8
  },
  "createdAt": "2023-01-01T00:00:00Z",
  "isExplicit": false,
  "price": 9.99,
  "isLiked": true,
  "isPurchased": true
}
```

### Загрузить трек (только для артистов)
```http
POST /tracks
Authorization: Bearer <token>
Content-Type: multipart/form-data

Параметры:
- title: название трека
- artistName: имя артиста
- genre: жанр
- audio: аудиофайл (mp3, wav, flac)
- image: обложка (jpg, png)
- lyrics: текст песни (опционально)
- price: цена в NDT токенах (опционально)

Response:
{
  "id": "track_id",
  "title": "Название трека",
  "status": "uploading",
  "ipfsHash": "Qm...",
  "transactionHash": "0x..."
}
```

### Обновить трек
```http
PUT /tracks/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Новое название",
  "genre": "pop",
  "price": 14.99,
  "isExplicit": true
}
```

### Удалить трек
```http
DELETE /tracks/{id}
Authorization: Bearer <token>
```

### Лайкнуть трек
```http
POST /tracks/{id}/like
Authorization: Bearer <token>
```

### Воспроизвести трек
```http
POST /tracks/{id}/play
Authorization: Bearer <token>

Response:
{
  "success": true,
  "playCount": 1001
}
```

## 👤 Пользователи

### Получить профиль пользователя
```http
GET /users/{id}

Response:
{
  "id": "user_id",
  "username": "username",
  "displayName": "Отображаемое имя",
  "email": "user@example.com",
  "bio": "О себе...",
  "avatar": "https://...",
  "banner": "https://...",
  "level": "GOLD",
  "balance": 1000.50,
  "isArtist": true,
  "role": "ARTIST",
  "stats": {
    "totalPlays": 50000,
    "totalLikes": 1000,
    "totalFollowers": 500,
    "totalTracks": 10
  },
  "createdAt": "2023-01-01T00:00:00Z"
}
```

### Обновить профиль
```http
PUT /users/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "displayName": "Новое имя",
  "bio": "Новый био",
  "avatar": "https://...",
  "banner": "https://..."
}
```

### Получить статистику пользователя
```http
GET /users/{id}/stats
Authorization: Bearer <token>

Response:
{
  "totalPlays": 50000,
  "totalLikes": 1000,
  "totalFollowers": 500,
  "totalFollowing": 200,
  "totalTracks": 10,
  "totalPlaylists": 5,
  "totalEarnings": 5000.00,
  "topGenres": [
    { "genre": "electronic", "count": 10000 },
    { "genre": "pop", "count": 8000 }
  ],
  "recentActivity": [
    {
      "type": "play",
      "track": { "id": "track_id", "title": "Трек" },
      "timestamp": "2023-01-01T00:00:00Z"
    }
  ]
}
```

## 🎵 Плейлисты

### Получить плейлисты пользователя
```http
GET /users/{id}/playlists

Response:
{
  "data": [
    {
      "id": "playlist_id",
      "name": "Мой плейлист",
      "description": "Описание",
      "isPublic": true,
      "coverImage": "https://...",
      "trackCount": 25,
      "playCount": 1000,
      "createdAt": "2023-01-01T00:00:00Z"
    }
  ]
}
```

### Создать плейлист
```http
POST /playlists
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Название плейлиста",
  "description": "Описание",
  "isPublic": true,
  "coverImage": "https://..."
}
```

### Добавить трек в плейлист
```http
POST /playlists/{id}/tracks
Authorization: Bearer <token>
Content-Type: application/json

{
  "trackId": "track_id",
  "position": 0
}
```

### Удалить трек из плейлиста
```http
DELETE /playlists/{id}/tracks/{trackId}
Authorization: Bearer <token>
```

## 💰 Кошелек и токены

### Получить баланс
```http
GET /wallet/balance
Authorization: Bearer <token>

Response:
{
  "sol": 1.5,
  "ndt": 1000.50,
  "usd": 150.00
}
```

### История транзакций
```http
GET /wallet/transactions
Authorization: Bearer <token>

Response:
{
  "data": [
    {
      "id": "tx_id",
      "type": "purchase",
      "amount": 10.00,
      "currency": "NDT",
      "description": "Покупка трека",
      "timestamp": "2023-01-01T00:00:00Z",
      "status": "completed"
    }
  ]
}
```

### Пополнить кошелек (Stripe)
```http
POST /wallet/deposit
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 100.00,
  "currency": "USD",
  "paymentMethodId": "pm_123456789"
}
```

### Вывести средства
```http
POST /wallet/withdraw
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 50.00,
  "currency": "SOL",
  "address": "0x1234567890abcdef..."
}
```

## 🏆 Система наград

### Получить достижения пользователя
```http
GET /users/{id}/achievements
Authorization: Bearer <token>

Response:
{
  "data": [
    {
      "id": "achievement_id",
      "name": "Первый трек",
      "description": "Загрузите первый трек",
      "icon": "🎵",
      "rarity": "common",
      "unlockedAt": "2023-01-01T00:00:00Z"
    }
  ]
}
```

### Получить чарты
```http
GET /charts

Query параметры:
- type: weekly, monthly, alltime
- genre: фильтр по жанру

Response:
{
  "data": [
    {
      "rank": 1,
      "track": {
        "id": "track_id",
        "title": "Трек",
        "artistName": "Артист"
      },
      "plays": 10000,
      "likes": 500
    }
  ]
}
```

## 🎨 NFT

### Получить NFT по ID
```http
GET /nft/{id}

Response:
{
  "id": "nft_id",
  "tokenId": "token_id",
  "name": "Название NFT",
  "description": "Описание",
  "imageUrl": "https://...",
  "metadata": {
    "attributes": [...]
  },
  "price": 100.00,
  "status": "listed",
  "owner": {
    "id": "owner_id",
    "username": "owner_username"
  },
  "createdAt": "2023-01-01T00:00:00Z"
}
```

### Купить NFT
```http
POST /nft/{id}/purchase
Authorization: Bearer <token>
Content-Type: application/json

{
  "price": 100.00
}
```

### Создать NFT из трека
```http
POST /nft/mint
Authorization: Bearer <token>
Content-Type: application/json

{
  "trackId": "track_id",
  "name": "NFT название",
  "description": "NFT описание",
  "price": 100.00
}
```

## 🎨 NFT Marketplace

### Получить список NFT
```http
GET /nft

Query параметры:
- page: номер страницы (default: 1)
- limit: количество элементов на странице (default: 20, max: 100)
- category: фильтр по категории (audio, video, image, collection, event)
- rarity: фильтр по редкости (common, rare, epic, legendary, mythic)
- priceRange: диапазон цен [min, max]
- sortBy: сортировка (price, date, popularity, rarity)
- sortOrder: порядок (asc, desc)
- search: поиск по названию или описанию
- collectionId: фильтр по коллекции
- creator: фильтр по создателю
- owner: фильтр по владельцу
- saleType: тип продажи (buy-now, auction, offer)

Response:
{
  "data": [
    {
      "id": "nft_id",
      "tokenId": "token_id",
      "name": "Название NFT",
      "description": "Описание NFT",
      "imageUrl": "https://...",
      "audioUrl": "https://...",
      "videoUrl": "https://...",
      "price": 10.5,
      "currency": "SOL",
      "owner": "owner_address",
      "creator": "creator_address",
      "category": "audio",
      "rarity": "rare",
      "attributes": [
        {
          "trait_type": "Жанр",
          "value": "Electronic"
        }
      ],
      "metadata": {
        "bpm": 120,
        "genre": "electronic",
        "duration": 180,
        "releaseDate": "2023-01-01"
      },
      "saleType": "buy-now",
      "auction": {
        "currentBid": 12.0,
        "endTime": "2023-12-31T23:59:59Z",
        "minIncrement": 0.5
      },
      "royalties": 0.05,
      "totalSales": 5,
      "views": 1000,
      "likes": 50,
      "isListed": true,
      "collection": {
        "id": "collection_id",
        "name": "Название коллекции",
        "floorPrice": 5.0
      },
      "createdAt": "2023-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Получить NFT по ID
```http
GET /nft/{id}

Response:
{
  "id": "nft_id",
  "tokenId": "token_id",
  "name": "Название NFT",
  "description": "Описание NFT",
  "imageUrl": "https://...",
  "audioUrl": "https://...",
  "videoUrl": "https://...",
  "price": 10.5,
  "currency": "SOL",
  "owner": "owner_address",
  "creator": "creator_address",
  "category": "audio",
  "rarity": "rare",
  "attributes": [
    {
      "trait_type": "Жанр",
      "value": "Electronic"
    }
  ],
  "metadata": {
    "bpm": 120,
    "genre": "electronic",
    "duration": 180,
    "releaseDate": "2023-01-01"
  },
  "saleType": "buy-now",
  "auction": {
    "currentBid": 12.0,
    "endTime": "2023-12-31T23:59:59Z",
    "minIncrement": 0.5,
    "bids": [
      {
        "bidder": "bidder_address",
        "amount": 12.0,
        "timestamp": "2023-12-30T10:00:00Z"
      }
    ]
  },
  "royalties": 0.05,
  "totalSales": 5,
  "views": 1000,
  "likes": 50,
  "isListed": true,
  "collection": {
    "id": "collection_id",
    "name": "Название коллекции",
    "description": "Описание коллекции",
    "imageUrl": "https://...",
    "totalSupply": 100,
    "minted": 75,
    "floorPrice": 5.0,
    "totalVolume": 5000,
    "owners": 50,
    "averagePrice": 66.67,
    "rarityDistribution": {
      "common": 40,
      "rare": 30,
      "epic": 20,
      "legendary": 8,
      "mythic": 2
    }
  },
  "createdAt": "2023-01-01T00:00:00Z",
  "updatedAt": "2023-12-30T10:00:00Z"
}
```

### Создать NFT (только для артистов)
```http
POST /nft
Authorization: Bearer <token>
Content-Type: multipart/form-data

Параметры:
- name: название NFT
- description: описание NFT
- category: категория (audio, video, image, collection, event)
- file: файл NFT (mp3, mp4, jpg, png, gif)
- image: обложка (jpg, png)
- price: цена в SOL или NDT (опционально)
- royalties: процент роялти (0-10%, default: 5%)
- attributes: JSON с атрибутами NFT
- collectionId: ID коллекции (опционально)

Response:
{
  "id": "nft_id",
  "tokenId": "token_id",
  "name": "Название NFT",
  "status": "minting",
  "ipfsHash": "Qm...",
  "transactionHash": "0x...",
  "price": 10.5,
  "currency": "SOL"
}
```

### Разместить ставку на аукционе
```http
POST /nft/{id}/bid
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 12.0,
  "message": "Моя ставка"
}

Response:
{
  "success": true,
  "bidId": "bid_id",
  "transactionHash": "0x...",
  "newCurrentBid": 12.0
}
```

### Купить NFT
```http
POST /nft/{id}/purchase
Authorization: Bearer <token>
Content-Type: application/json

{
  "price": 10.5,
  "currency": "SOL"
}

Response:
{
  "success": true,
  "transactionHash": "0x...",
  "nftId": "nft_id",
  "newOwner": "buyer_address"
}
```

## 💰 Стейкинг

### Получить информацию о пулах стейкинга
```http
GET /staking/pools

Response:
{
  "data": [
    {
      "id": "pool_id",
      "name": "Фиксированный стейкинг",
      "type": "fixed",
      "apy": 15.0,
      "minAmount": 1000,
      "maxAmount": 100000,
      "duration": 30,
      "totalStaked": 500000,
      "totalStakers": 100,
      "myStake": 5000,
      "myRewards": 62.5,
      "nextReward": "2023-12-31T23:59:59Z",
      "isAvailable": true,
      "riskLevel": "low",
      "description": "Гарантированная доходность 15% APY",
      "features": [
        "Фиксированная доходность",
        "Ежемесячные выплаты",
        "Без комиссии за вход"
      ],
      "requirements": [
        "Минимальная сумма: 1000 NDT",
        "Срок: 30-365 дней"
      ]
    }
  ]
}
```

### Застейкить токены
```http
POST /staking/stake
Authorization: Bearer <token>
Content-Type: application/json

{
  "poolId": "pool_id",
  "amount": 5000,
  "duration": 90,
  "autoCompound": true,
  "compoundFrequency": "monthly"
}

Response:
{
  "success": true,
  "stakeId": "stake_id",
  "transactionHash": "0x...",
  "estimatedRewards": 187.5,
  "maturityDate": "2023-12-31T23:59:59Z"
}
```

### Анстейкнуть токены
```http
POST /staking/unstake
Authorization: Bearer <token>
Content-Type: application/json

{
  "stakeId": "stake_id",
  "earlyUnstake": false
}

Response:
{
  "success": true,
  "transactionHash": "0x...",
  "unStakedAmount": 5187.5,
  "penalty": 0
}
```

### Рассчитать доходность стейкинга
```http
POST /staking/calculate
Authorization: Bearer <token>
Content-Type: application/json

{
  "poolId": "pool_id",
  "amount": 5000,
  "duration": 90,
  "autoCompound": true,
  "compoundFrequency": "monthly"
}

Response:
{
  "principal": 5000,
  "apy": 15.0,
  "duration": 90,
  "totalRewards": 187.5,
  "netRewards": 187.5,
  "usdValue": 187.5,
  "compoundEffect": 12.5,
  "maturityDate": "2023-12-31T23:59:59Z"
}
```

## 🎯 AI Рекомендации

### Получить персональные рекомендации
```http
GET /recommendations/personal
Authorization: Bearer <token>

Response:
{
  "tracks": [
    {
      "id": "track_id",
      "title": "Рекомендуемый трек",
      "artistName": "Имя артиста",
      "genre": "electronic",
      "matchScore": 0.95,
      "reason": "Похож на ваши любимые треки в жанре electronic",
      "imageUrl": "https://...",
      "audioUrl": "https://..."
    }
  ],
  "artists": [
    {
      "id": "artist_id",
      "name": "Рекомендуемый артист",
      "matchScore": 0.88,
      "reason": "Слушатели ваших любимых артистов также слушают этого артиста",
      "imageUrl": "https://..."
    }
  ],
  "playlists": [
    {
      "id": "playlist_id",
      "name": "Рекомендуемый плейлист",
      "matchScore": 0.82,
      "reason": "Основан на вашем музыкальном вкусе",
      "coverImage": "https://..."
    }
  ]
}
```

### Получить рекомендации на основе трека
```http
GET /recommendations/similar/{trackId}
Authorization: Bearer <token>

Response:
{
  "similarTracks": [
    {
      "id": "track_id",
      "title": "Похожий трек",
      "artistName": "Имя артиста",
      "similarityScore": 0.92,
      "features": {
        "bpm": 120,
        "energy": 0.8,
        "danceability": 0.7,
        "valence": 0.6
      },
      "imageUrl": "https://...",
      "audioUrl": "https://..."
    }
  ]
}
```

## 🏆 Достижения

### Получить достижения пользователя
```http
GET /achievements
Authorization: Bearer <token>

Response:
{
  "achievements": [
    {
      "id": "achievement_id",
      "name": "Первый трек",
      "description": "Загрузите свой первый трек",
      "icon": "🎵",
      "category": "creator",
      "progress": 1,
      "target": 1,
      "unlocked": true,
      "unlockedAt": "2023-01-01T00:00:00Z",
      "rewards": [
        {
          "type": "badge",
          "value": "first-track"
        }
      ]
    }
  ],
  "stats": {
    "totalAchievements": 15,
    "unlockedAchievements": 8,
    "totalProgress": 53,
    "nextLevel": "Level 5"
  }
}
```

### Получить прогресс по достижению
```http
GET /achievements/{id}/progress
Authorization: Bearer <token>

Response:
{
  "achievement": {
    "id": "achievement_id",
    "name": "Музыкальный коллекционер",
    "description": "Соберите 100 треков в плейлистах",
    "icon": "📀",
    "category": "collector",
    "target": 100
  },
  "progress": {
    "current": 45,
    "target": 100,
    "percentage": 45,
    "estimatedCompletion": "2023-12-31T23:59:59Z"
  }
}
```

## 📊 Аналитика для артистов

### Получить статистику платформы
```http
GET /analytics/platform

Response:
{
  "totalUsers": 10000,
  "totalTracks": 50000,
  "totalPlays": 1000000,
  "totalRevenue": 50000.00,
  "activeUsers": 1000,
  "topGenres": [
    { "genre": "electronic", "percentage": 30 },
    { "genre": "pop", "percentage": 25 }
  ]
}
```

### Получить статистику артиста
```http
GET /analytics/artist
Authorization: Bearer <token>

Response:
{
  "overview": {
    "totalPlays": 50000,
    "totalListeners": 10000,
    "totalRevenue": 5000.00,
    "averagePlayTime": 180,
    "topCountry": "Russia",
    "growthRate": 15.2
  },
  "tracks": [
    {
      "id": "track_id",
      "title": "Популярный трек",
      "plays": 10000,
      "likes": 500,
      "shares": 100,
      "revenue": 1000.00,
      "trend": "up"
    }
  ],
  "audience": {
    "ageGroups": {
      "18-24": 30,
      "25-34": 45,
      "35-44": 20,
      "45+": 5
    },
    "genres": {
      "electronic": 40,
      "pop": 30,
      "rock": 20,
      "other": 10
    },
    "geography": [
      {
        "country": "Russia",
        "listeners": 5000,
        "percentage": 50
      },
      {
        "country": "USA",
        "listeners": 2000,
        "percentage": 20
      }
    ]
  },
  "revenue": {
    "total": 5000.00,
    "bySource": {
      "streaming": 3000.00,
      "nft": 1500.00,
      "tips": 500.00
    },
    "byCurrency": {
      "SOL": 3000.00,
      "NDT": 1500.00,
      "USD": 500.00
    }
  }
}
```

### Получить статистику трека
```http
GET /analytics/track/{trackId}
Authorization: Bearer <token>

Response:
{
  "track": {
    "id": "track_id",
    "title": "Название трека",
    "artistName": "Имя артиста",
    "duration": 180,
    "releaseDate": "2023-01-01"
  },
  "performance": {
    "totalPlays": 10000,
    "uniqueListeners": 5000,
    "completionRate": 0.75,
    "averagePlayTime": 135,
    "likes": 500,
    "shares": 100,
    "comments": 50
  },
  "timeline": [
    {
      "date": "2023-01-01",
      "plays": 100,
      "listeners": 50
    },
    {
      "date": "2023-01-02",
      "plays": 150,
      "listeners": 75
    }
  ],
  "geography": [
    {
      "country": "Russia",
      "plays": 5000,
      "percentage": 50
    },
    {
      "country": "USA",
      "plays": 2000,
      "percentage": 20
    }
  ]
}
```

## 🔧 WebSocket события

### Подключение
```javascript
const socket = io('https://api.normaldance.com', {
  auth: {
    token: 'jwt_token'
  }
});
```

### События

#### `track:play`
```javascript
socket.on('track:play', (data) => {
  console.log('Трек воспроизводится:', data);
});
```

#### `user:online`
```javascript
socket.on('user:online', (data) => {
  console.log('Пользователь онлайн:', data);
});
```

#### `notification:new`
```javascript
socket.on('notification:new', (data) => {
  console.log('Новое уведомление:', data);
});
```

## 🚀 Ошибки

### Коды ошибок

| Код | Описание |
|-----|----------|
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Validation Error |
| 429 | Too Many Requests |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

### Формат ошибки
```json
{
  "error": {
    "code": "validation_error",
    "message": "Validation failed",
    "details": {
      "field": "email",
      "message": "Email is required"
    }
  }
}
```

## 📝 Rate Limiting

- **API лимит**: 100 запросов в минуту
- **WebSocket лимит**: 10 сообщений в секунду
- **Файл загрузка**: Максимальный размер 100MB

## 🔒 Безопасность

- Все API запросы должны использовать HTTPS
- JWT токены имеют срок действия 24 часа
- Все файлы проходят проверку на вредоносный код
- Реализована защита от CSRF атак

## 📱 Мобильное приложение

### Получить мобильные уведомления
```http
GET /mobile/notifications
Authorization: Bearer <token>

Response:
{
  "notifications": [
    {
      "id": "notification_id",
      "type": "like",
      "title": "Новый лайк",
      "message": "Пользователь лайкнул ваш трек",
      "imageUrl": "https://...",
      "timestamp": "2023-01-01T00:00:00Z",
      "read": false,
      "action": {
        "type": "track",
        "id": "track_id"
      }
    }
  ],
  "unreadCount": 5
}
```

### Подписаться на push-уведомления
```http
POST /mobile/subscribe
Authorization: Bearer <token>
Content-Type: application/json

{
  "token": "push_notification_token",
  "platform": "ios",
  "topics": ["likes", "comments", "follows"]
}

Response:
{
  "success": true,
  "subscriptionId": "subscription_id"
}
```

## 🔄 Live Streaming

### Получить активные стримы
```http
GET /live/active

Response:
{
  "streams": [
    {
      "id": "stream_id",
      "title": "Название стрима",
      "artistName": "Имя артиста",
      "viewerCount": 100,
      "thumbnailUrl": "https://...",
      "startTime": "2023-01-01T19:00:00Z",
      "duration": 3600,
      "isLive": true
    }
  ]
}
```

### Начать стрим
```http
POST /live/stream
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Мой концерт",
  "description": "Прямой эфир",
  "category": "music",
  "tags": ["electronic", "live"]
}

Response:
{
  "streamId": "stream_id",
  "streamKey": "stream_key",
  "rtmpUrl": "rtmp://...",
  "hlsUrl": "https://...",
  "viewerUrl": "https://dnb1st.ru/live/stream_id"
}
```

## 🎭 VR/AR Галерея

### Получить VR галерею NFT
```http
GET /vr/gallery
Authorization: Bearer <token>

Response:
{
  "gallery": {
    "id": "gallery_id",
    "name": "Моя коллекция",
    "description": "VR галерея NFT",
    "nfts": [
      {
        "id": "nft_id",
        "name": "NFT название",
        "imageUrl": "https://...",
        "position": {
          "x": 0,
          "y": 0,
          "z": 0
        },
        "scale": 1.0,
        "rotation": 0
      }
    ],
    "camera": {
      "position": {
        "x": 0,
        "y": 0,
        "z": 5
      },
      "target": {
        "x": 0,
        "y": 0,
        "z": 0
      }
    }
  }
}
```

### Обновить позицию NFT в галерее
```http
PUT /vr/gallery/{nftId}/position
Authorization: Bearer <token>
Content-Type: application/json

{
  "position": {
    "x": 1.0,
    "y": 0.5,
    "z": -2.0
  },
  "rotation": 45,
  "scale": 1.2
}

Response:
{
  "success": true,
  "nftId": "nft_id",
  "newPosition": {
    "x": 1.0,
    "y": 0.5,
    "z": -2.0
  }
}
```

---

**Последнее обновление:** Сентябрь 2025
**Версия API:** v1.0.1