# План документации

## Обзор

В этом документе описывается план создания исчерпывающей документации для проекта NormalDance. Это улучшение имеет низкий приоритет для Q3-Q4 2025 года, так как обеспечивает упрощенную интеграцию для разработчиков и лучшую поддержку пользователей.

## Текущая ситуация

### Существующая документация

- Ограниченная документация по API
- Отсутствие руководств для разработчиков
- Нет пользовательской документации
- Недостаточно информации по интеграции

### Проблемы текущей реализации

- Недостаточная документация для разработчиков
- Нет руководств по использованию
- Отсутствие примеров кода
- Недоступность документации для новых пользователей

## Цели реализации

### Основные цели

- Создание API-документации
- Написание руководств для разработчиков
- Подготовка пользовательской документации
- Настройка системы поддержки документации

### Технические цели

- Интерактивная документация API
- Примеры кода для интеграции
- Руководства по использованию функций
- Система поиска по документации

## План реализации

### Этап 1: Анализ и планирование (Неделя 1-2)

- Анализ существующей документации
- Определение целевой аудитории
- Подготовка структуры документации
- Выбор инструментов для документации

### Этап 2: Создание API-документации (Неделя 3-4)

- Документирование всех API-эндпоинтов
- Создание интерактивных примеров
- Интеграция с OpenAPI/Swagger
- Тестирование примеров кода

### Этап 3: Руководства для разработчиков (Неделя 5-6)

- Создание руководства по интеграции
- Примеры использования SDK
- Руководства по Web3-интеграции
- Документация для Telegram Mini App

### Этап 4: Пользовательская документация (Неделя 7-8)

- Создание руководства пользователя
- Подготовка FAQ
- Документация по функциям платформы
- Руководства по созданию контента

### Этап 5: Внедрение и поддержка (Неделя 9)

- Развертывание документации
- Настройка системы поиска
- Обучение команды поддержке
- Обновление документации

## Технические детали

### Структура документации

#### Директория документации

```
docs/
├── api/                    # API-документация
│   ├── openapi.yaml        # OpenAPI спецификация
│   ├── authentication.md   # Документация аутентификации
│   ├── tracks.md          # Документация треков
│   ├── nfts.md            # Документация NFT
│   └── payments.md        # Документация платежей
├── guides/                 # Руководства
│   ├── getting-started.md # Начало работы
│   ├── web3-integration.md # Web3 интеграция
│   ├── telegram-mini-app.md # Telegram Mini App
│   └── nft-memorials.md   # NFT мемориалы
├── reference/              # Справочная информация
│   ├── types.md           # Типы данных
│   ├── errors.md          # Коды ошибок
│   └── webhooks.md        # Webhook события
└── faq/                    # Часто задаваемые вопросы
    ├── account.md         # Вопросы по аккаунтам
    ├── payments.md        # Вопросы по платежам
    └── technical.md       # Технические вопросы
```

### API-документация

#### OpenAPI спецификация

```yaml
# docs/api/openapi.yaml
openapi: 3.0.0
info:
  title: NormalDance API
 description: API для платформы NormalDance
  version: 1.0.0
  contact:
    name: NormalDance Support
    email: support@normaldance.com

servers:
  - url: https://api.normaldance.com/v1
    description: Production server
  - url: https://staging-api.normaldance.com/v1
    description: Staging server

paths:
  /tracks:
    get:
      summary: Получить список треков
      description: Возвращает список доступных треков с возможностью фильтрации
      parameters:
        - name: genre
          in: query
          description: Фильтр по жанру
          required: false
          schema:
            type: string
        - name: limit
          in: query
          description: Количество возвращаемых записей
          required: false
          schema:
            type: integer
            default: 20
            maximum: 100
      responses:
        '200':
          description: Успешный ответ
          content:
            application/json:
              schema:
                type: object
                properties:
                  tracks:
                    type: array
                    items:
                      $ref: '#/components/schemas/Track'
                  pagination:
                    $ref: '#/components/schemas/Pagination'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'

    post:
      summary: Создать новый трек
      description: Создает новый трек от имени авторизованного пользователя
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateTrackRequest'
      responses:
        '201':
          description: Трек успешно создан
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Track'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'

  /tracks/{id}:
    get:
      summary: Получить информацию о треке
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Успешный ответ
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Track'
        '404':
          $ref: '#/components/responses/NotFound'

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    Track:
      type: object
      required:
        - id
        - title
        - artistId
        - coverImage
        - audioUrl
      properties:
        id:
          type: string
          description: Уникальный идентификатор трека
        title:
          type: string
          description: Название трека
        description:
          type: string
          description: Описание трека
        coverImage:
          type: string
          description: URL обложки трека
        audioUrl:
          type: string
          description: URL аудиофайла
        artistId:
          type: string
          description: Идентификатор артиста
        genre:
          type: string
          description: Жанр трека
        duration:
          type: integer
          description: Продолжительность в секундах
        price:
          type: number
          description: Цена в SOL (если NFT)
        isNFT:
          type: boolean
          description: Является ли трек NFT
        createdAt:
          type: string
          format: date-time
          description: Дата создания
        updatedAt:
          type: string
          format: date-time
          description: Дата обновления

    Pagination:
      type: object
      properties:
        page:
          type: integer
        limit:
          type: integer
        total:
          type: integer
        pages:
          type: integer

    CreateTrackRequest:
      type: object
      required:
        - title
        - coverImage
        - audioUrl
      properties:
        title:
          type: string
          description: Название трека
        description:
          type: string
          description: Описание трека
        coverImage:
          type: string
          description: URL обложки
        audioUrl:
          type: string
          description: URL аудиофайла
        genre:
          type: string
          description: Жанр трека
        price:
          type: number
          description: Цена (если NFT)

  responses:
    BadRequest:
      description: Неверный запрос
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    Unauthorized:
      description: Неавторизованный доступ
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    Forbidden:
      description: Доступ запрещен
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    NotFound:
      description: Ресурс не найден
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'

    Error:
      type: object
      properties:
        error:
          type: string
          description: Сообщение об ошибке
        code:
          type: string
          description: Код ошибки
```

### Руководство по началу работы

#### Getting Started Guide

````markdown
# Getting Started with NormalDance API

This guide will help you get started with the NormalDance API to integrate music streaming and NFT functionality into your application.

## Prerequisites

- A NormalDance developer account
- API key (obtain from your dashboard)
- Basic knowledge of REST APIs
- Web3 wallet (for NFT operations)

## Authentication

All API requests require authentication using a Bearer token:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://api.normaldance.com/v1/tracks
```
````

## Quick Start Example

Here's a simple example to get popular tracks:

```javascript
// JavaScript example
const response = await fetch("https://api.normaldance.com/v1/tracks?limit=10", {
  headers: {
    Authorization: "Bearer YOUR_API_KEY",
    "Content-Type": "application/json",
  },
});

const data = await response.json();
console.log(data.tracks);
```

```python
# Python example
import requests

headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

response = requests.get('https://api.normaldance.com/v1/tracks?limit=10', headers=headers)
data = response.json()
print(data['tracks'])
```

## Next Steps

1. Explore the [API Reference](/docs/api/tracks.md)
2. Learn about [Web3 Integration](/docs/guides/web3-integration.md)
3. Check out the [NFT Memorials Guide](/docs/guides/nft-memorials.md)

````

### Руководство по Web3-интеграции

#### Web3 Integration Guide
```markdown
# Web3 Integration Guide

Learn how to integrate Web3 functionality into your NormalDance application.

## Wallet Connection

### Using Phantom Wallet

```javascript
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

// In your component
const { connected, connect, disconnect, publicKey } = useWallet();

// Connect wallet
const handleConnect = async () => {
  try {
    await connect();
  } catch (error) {
    console.error('Wallet connection failed:', error);
  }
};

// Disconnect wallet
const handleDisconnect = async () => {
  try {
    await disconnect();
  } catch (error) {
    console.error('Wallet disconnection failed:', error);
  }
};
````

### Wallet Authentication

To authenticate users with their wallet:

```javascript
// 1. Request a challenge from the server
const response = await fetch("/api/auth/challenge", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ publicKey: wallet.publicKey.toBase58() }),
});

const { challenge } = await response.json();

// 2. Sign the challenge with the wallet
const message = new TextEncoder().encode(challenge);
const signature = await wallet.signMessage(message);

// 3. Send signature to server for verification
const authResponse = await fetch("/api/auth/verify", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    publicKey: wallet.publicKey.toBase58(),
    signature: bs58.encode(signature),
    message: challenge,
  }),
});
```

## NFT Operations

### Minting an NFT

```javascript
import {
  createMint,
  mintTo,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import { createNFT } from "@/lib/nft-service";

const mintNFT = async (nftMetadata) => {
  try {
    // 1. Prepare NFT metadata
    const metadata = {
      name: nftMetadata.name,
      symbol: nftMetadata.symbol,
      description: nftMetadata.description,
      image: nftMetadata.image,
      attributes: nftMetadata.attributes,
    };

    // 2. Create NFT using our service
    const result = await createNFT({
      metadata,
      recipient: wallet.publicKey.toBase58(),
    });

    return result;
  } catch (error) {
    console.error("NFT minting failed:", error);
    throw error;
  }
};
```

### NFT Memorials

To create a memorial NFT:

```javascript
import { createMemorialNFT } from "@/lib/nft-memorials";

const createMemorial = async (memorialData) => {
  try {
    const result = await createMemorialNFT({
      name: memorialData.name,
      description: memorialData.dedication,
      image: memorialData.image,
      memories: memorialData.memories,
      owner: wallet.publicKey.toBase58(),
    });

    return result;
  } catch (error) {
    console.error("Memorial NFT creation failed:", error);
    throw error;
  }
};
```

## Best Practices

- Always verify wallet signatures on the backend
- Implement proper error handling for wallet operations
- Cache wallet addresses to improve UX
- Use Solana Pay for seamless payment experiences

````

### Документация для Telegram Mini App

#### Telegram Mini App Documentation
```markdown
# Telegram Mini App Integration

Documentation for integrating with the NormalDance Telegram Mini App.

## Getting Started

The NormalDance Telegram Mini App allows users to access music streaming and NFT functionality directly within Telegram.

### Initialization

```javascript
import { initTgSdk, useInitData, useMainButton, useBackButton } from '@twa-dev/sdk/react';

// Initialize the Telegram Web Apps SDK
const TelegramApp = () => {
  const initData = useInitData();
  const mainButton = useMainButton();
  const backButton = useBackButton();

  // Use user data from initialization
  useEffect(() => {
    if (initData?.user) {
      // User is authenticated in Telegram
      console.log('Telegram user:', initData.user);
    }
  }, [initData]);

  return (
    <div className="telegram-app">
      {/* Your app content */}
    </div>
  );
};
````

### Web3 Integration in Telegram

Web3 functionality works the same way as in web applications:

```javascript
import { useWallet } from "@solana/wallet-adapter-react";

const Web3Features = () => {
  const { connected, connect, publicKey } = useWallet();

  return (
    <div>
      {connected ? (
        <div>
          <p>Connected: {publicKey?.toBase58()}</p>
          <TrackPlayer />
          <NFTGallery />
        </div>
      ) : (
        <button onClick={connect}>Connect Wallet</button>
      )}
    </div>
  );
};
```

### Main Button Usage

The Main Button is Telegram's native call-to-action button:

```javascript
import { useMainButton } from "@twa-dev/sdk/react";

const PurchaseButton = ({ onPurchase }) => {
  const mainButton = useMainButton();

  useEffect(() => {
    mainButton.setText("Buy NFT");
    mainButton.show();
    mainButton.onClick(onPurchase);

    return () => {
      mainButton.hide();
      mainButton.offClick(onPurchase);
    };
  }, [onPurchase]);

  return null; // Button is managed by Telegram
};
```

## API Integration

When making API calls from the Telegram Mini App, include the Telegram initialization data:

```javascript
const makeAuthenticatedRequest = async (endpoint, data) => {
  const initData = useInitData();

  const response = await fetch(`/api/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Telegram-Init-Data": initData?.authData || "", // Raw init data
    },
    body: JSON.stringify(data),
  });

  return response.json();
};
```

## Best Practices

- Use Telegram's native UI components when possible
- Implement proper error handling for network requests
- Optimize for mobile performance
- Follow Telegram Mini App design guidelines
- Test thoroughly on different devices

````

### Пользовательская документация

#### Руководство пользователя
```markdown
# User Guide for NormalDance

Welcome to NormalDance! This guide will help you navigate the platform and make the most of its features.

## Getting Started

### Creating an Account

1. Visit [normaldance.com](https://normaldance.com) or open the Telegram Mini App
2. Click "Sign Up" and choose your preferred method:
   - Email and password
   - Web3 wallet (Phantom, Solflare, etc.)
   - Social login (if available)
3. Complete the verification process
4. Set up your profile

### Connecting Your Wallet

To access NFT features and make purchases:

1. Click on your profile icon
2. Select "Connect Wallet"
3. Choose your preferred wallet (Phantom is recommended)
4. Confirm the connection in your wallet
5. Your wallet is now linked to your account

## Music Features

### Browsing Music

1. Navigate to the "Tracks" section
2. Filter by genre, mood, or popularity
3. Use the search function to find specific artists or songs
4. Click on any track to preview it

### Creating Playlists

1. Find a track you like
2. Click the "..." menu next to the track
3. Select "Add to Playlist"
4. Choose an existing playlist or create a new one
5. Your playlist is saved and accessible from your profile

### Uploading Your Own Music

1. Go to your profile and click "Upload"
2. Fill in track details (title, description, genre)
3. Upload your audio file and cover image
4. Set pricing if you want to sell as NFT
5. Click "Publish" to make it live

## NFT Features

### Buying NFTs

1. Navigate to the "NFTs" section
2. Browse available NFTs or search for specific ones
3. Click on an NFT to view details
4. Click "Buy Now" or place a bid if it's an auction
5. Confirm the transaction in your wallet

### Creating NFT Memorials

1. Go to the "Digital Cemetery" section
2. Click "Create Memorial"
3. Fill in the memorial details:
   - Name of the memorial
   - Dedication message
   - Memories or stories
   - Image or artwork
4. Set the price (if applicable)
5. Click "Mint Memorial NFT" to create

## Web3 Wallet Features

### Managing Your Assets

1. Go to your profile
2. Click on "My Assets"
3. View your NFTs, tokens, and other digital assets
4. Manage your collection by selling, transferring, or displaying items

### Staking Tokens

1. Navigate to the "Staking" section
2. Choose a staking strategy that fits your goals
3. Select the amount you want to stake
4. Confirm the transaction in your wallet
5. Start earning rewards

## Safety and Moderation

### Reporting Content

If you encounter inappropriate content:

1. Click the "..." menu on the content
2. Select "Report"
3. Choose the reason for reporting
4. Add any additional details
5. Submit the report

### Privacy Settings

Manage who can see your activity:

1. Go to your profile settings
2. Click on "Privacy"
3. Adjust settings for profile visibility, activity, and notifications

## Getting Help

### FAQ

**Q: How do I recover my account?**
A: If you're using email/password, use the "Forgot Password" link. If using a Web3 wallet, your wallet is your account - keep your private key safe.

**Q: What are the fees for selling music?**
A: NormalDance charges a small percentage on sales. Check the current rates in your dashboard.

**Q: Can I sell my NFTs elsewhere?**
A: Yes, your NFTs are on the Solana blockchain and can be transferred to other marketplaces.

### Contact Support

For additional help:
- Visit our [Help Center](https://normaldance.com/help)
- Email us at [support@normaldance.com](mailto:support@normaldance.com)
- Join our [Discord community](https://discord.gg/normaldance)

## Tips for Success

- Keep your wallet secure and never share your private key
- Engage with the community to grow your audience
- Use high-quality audio and artwork for your uploads
- Set competitive prices for your NFTs
- Regularly update your profile to attract more followers
````

### Система поиска по документации

#### Конфигурация поиска

```json
// docs/search-config.json
{
  "index": {
    "title_boost": 2,
    "content_boost": 1,
    "tags_boost": 1.5
  },
  "search": {
    "min_length": 2,
    "expand": true,
    "typo_tolerance": true,
    "facet_filters": ["category", "tags"]
  },
  "highlight": {
    "full_words": false,
    "max_length": 120,
    "max_nb_words": 10,
    "min_nb_words": 3
  },
  "pagination": {
    "max_total_hits": 1000
  },
  "attributes": {
    "searchable": ["title", "content", "tags", "category"],
    "displayed": ["title", "content", "url", "category", "tags"]
  }
}
```

## Риски и меры по их снижению

### Риск 1: Устаревание документации

- **Мера**: Автоматическое обновление по CI/CD
- **Мера**: Регулярные проверки актуальности

### Риск 2: Низкое качество документации

- **Мера**: Рецензирование перед публикацией
- **Мера**: Тестирование на пользователях

### Риск 3: Недостаточное покрытие тем

- **Мера**: Систематический подход к написанию
- **Мера**: Обратная связь от сообщества

## Критерии успеха

- Понятная и исчерпывающая документация
- Интерактивные примеры кода
- Эффективная система поиска
- Положительная обратная связь от пользователей
- Снижение обращений в поддержку

## Ресурсы

- 1-2 технических писателя на 9 недель
- Разработчики для проверки примеров
- Дизайнер для оформления

## Сроки

- Начало: 15 октября 2025
- Завершение: 12 декабря 2025
- Общее время: 9 недель
