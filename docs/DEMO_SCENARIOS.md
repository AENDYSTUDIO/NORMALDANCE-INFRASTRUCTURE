# Демонстрационные сценарии NormalDance

Этот документ описывает ключевые пользовательские сценарии для демонстрации возможностей платформы NormalDance инвесторам, партнерам и журналистам.

## 🚀 Быстрый старт демо-окружения

### Запуск демо

```bash
# Из корневой директории проекта
docker compose -f docker-compose.demo.yml up -d demo-frontend demo-backend demo-postgres demo-redis demo-ipfs
```

### Доступ

- **Frontend**: http://localhost:3001
- **API**: http://localhost:8081
- **Демо accounts**:
  - Artist: artist@demo.local / demo123
  - Listener: listener@demo.local / demo123
  - Admin: admin@demo.local / admin123

---

## 🎵 Сценарий 1: Потребительский опыт (15 минут)

### Цель

Показать, как обычный пользователь открывает для себя музыку, слушает треки и взаимодействует с контентом.

### Шаги демонстрации

#### 1. **Регистрация и onboarding** (2 мин)

- Перейдите на http://localhost:3001
- Создайте новый аккаунт или используйте demo listener account
- Покажите процесс подключения wallet (Solana/TON)
- Продемонстрируйте персонализированные рекомендации

#### 2. **Музыкальное открытие** (3 мин)

- Покажите главный фид с популярными треками
- Продемонстрируйте поиск по жанрам (Electronic, Synthwave, Techno)
- Воспроизведите трек "Midnight Drive" - покажите аудио-визуализатор
- Добавьте трек в избранное и создайте персональный плейлист

#### 3. **Social взаимодействия** (2 мин)

- Подпишитесь на артиста "electro_dreamer"
- Оставьте комментарий под треком
- Покажите ленту активности подписок
- Продемонстрируйте шаринг в социальные сети

#### 4. **NFT коллекционирование** (3 мин)

- Перейдите в NFT Marketplace
- Просмотрите доступные коллекции ("Electronic Dreams")
- Купите NFT "Midnight Drive #1" за 0.75 SOL
- Покажите владение в личном профиле

#### 5. **DEX и DeFi** (3 мин)

- Покажите базовую DEX функциональность
- Продемонстрируйте ликвидные пулы (NDT/SOL)
- Swap tokens через интерфейс
- Покажите портфель пользователя

### Ключевые talking points

- **Frictionless experience**: Нативная Web3 интеграция без сложностей
- **Rich interactions**: Комментарии, playlists, social features
- **Economic opportunities**: NFT ownership и trading
- **Cross-platform**: Desktop + Telegram Mini App

---

## 👨‍🎤 Сценарий 2: Артист/продюсер (12 минут)

### Цель

Показать, как создатель контента публикует музыку, монетизирует и строит сообщество.

### Шаги демонстрации

#### 1. **Профиль артиста** (2 мин)

- Войдите как artist@demo.local
- Покажите верифицированный профиль с 25K+ followers
- Продемонстрируйте артистскую статистику (plays, earnings)

#### 2. **Загрузка трека** (3 мин)

- Перейдите в "Upload Track"
- Загрузите демо-файл (эмулируйте процесс)
- Заполните метаданные (genre, BPM, mood)
- Покажите preview перед публикацией

#### 3. **Монетизация опции** (3 мин)

- Установите роялти (7.5% для стриминга, NFT)
- Создайте NFT из трека с эксклюзивным контентом
- Покажите прайсинг стратегии (free streaming + premium NFT)

#### 4. **Community building** (2 мин)

- Покажите взаимодействие с фанатами (комментарии, merch)
- Продемонстрируйте прямые чаевые через крипту
- Покажите аналитику вовлеченности

#### 5. **Доходы и аналитика** (2 мин)

- Перейдите в Earnings dashboard
- Покажите breakdown доходов (streaming royalties, NFT sales)
- Продемонстрируйте real-time updates транзакций

### Ключевые talking points

- **Fair compensation**: Артисты получают 100% роялти контроля
- **Multiple revenues**: Стриминг + NFT + licensing + merch
- **Direct fan connection**: Без посредников в коммуникации
- **Data-driven decisions**: Подробная аналитика для роста

---

## 🏪 Сценарий 3: NFT Marketplace и коллекционирование (10 минут)

### Цель

Демонстрировать ликвидный рынок цифровых музыкальных активов.

### Шаги демонстрации

#### 1. **NFT Discovery** (2 мин)

- Перейдите в "NFT" секцию
- Покажите фильтры (genre, price range, artist)
- Продемонстрируйте trending коллекции

#### 2. **Коллекция примера** (3 мин)

- Откройте "Electronic Dreams" collection
- Покажите rarity tiers и floor prices
- Продемонстрируйте secondary trading volume

#### 3. **NFT Purchase** (2 мин)

- Выберите NFT "Neon Dreams #1"
- Покажите preview (artwork, audio sample, additional content)
- Завершите покупку через Solana wallet

#### 4. **Ownership perks** (2 мин)

- Покажите owned NFT в профиле
- Продемонстрируйте exclusive content unlock
- Перепродажа с роялти распределением

#### 5. **Market analytics** (1 мин)

- Покажите market stats (volume, floor prices)
- Продемонстрируйте holder benefits

### Ключевые talking points

- **Secondary market liquidity**: Активная торговля с volume tracking
- **Utility NFTs**: Не просто artwork, а реальный access и benefits
- **Creator royalties**: Автоматический 7.5% роялти на resale
- **Cross-chain support**: Solana + TON interoperability

---

## 💱 Сценарий 4: DEX и токен экономика (8 минут)

### Цель

Показать интегрированный DEX для музыкальной экономики.

### Шаги демонстрации

#### 1. **Token overview** (2 мин)

- Объясните NDT token utility
- Покажите governance features
- Продемонстрируйте staking rewards

#### 2. **Liquidity pools** (3 мин)

- Покажите active pools (NDT/SOL, USDC/NDT)
- Продемонстрируйте impermanent loss защиту
- Покажите LP rewards distribution

#### 3. **Trading experience** (2 мин)

- Выполните swap NDT → SOL
- Покажите slippage protection
- Продемонстрируйте gas-less transactions (Solana)

#### 4. **Yield farming** (1 мин)

- Покажите farming opportunities
- Продемонстрируйте APY calculations

### Ключевые talking points

- **Integrated DeFi**: DEX native to music platform
- **Low fees**: Sub-dollar transactions на Solana
- **Community governance**: Token holders управляют платформой
- **Economic alignment**: Стейкинг и farming incentivize participation

---

## 📱 Сценарий 5: Telegram Mini App (10 минут)

### Цель

Демонстрировать мобильный опыт через Telegram Mini App.

### Шаги демонстрации

#### 1. **App discovery** (2 мин)

- Покажите, как найти NormalDance в Telegram
- Продемонстрируйте Web App manifest
- Объясните seamless integration

#### 2. **Mobile music** (3 мин)

- Покажите оптимизированный mobile UI
- Воспроизведите трек в фоне
- Продемонстрируйте touch controls

#### 3. **TON Payments** (2 мин)

- Покажите TON wallet интеграцию
- Продемонстрируйте micro-payments
- Покажите Telegram Stars redemption

#### 4. **Social features** (2 мин)

- Продемонстрируйте sharing to chats
- Покажите collaborative playlists
- Продемонстрируйте group music sessions

#### 5. **Cross-platform sync** (1 мин)

- Покажите синхронизацию между app и web
- Продемонстрируйте cloud backup

### Ключевые talking points

- **700M potential users**: Telegram user base
- **Native payments**: TON integration через wallet
- **Social distribution**: Organic sharing mechanics
- **Mobile-optimized**: Seamless experience на всех устройствах

---

## 📊 Сценарий 6: Аналитика и инсайты (5 минут)

### Цель

Показать data-driven подход к музыкальной платформе.

### Шаги демонстрации

#### 1. **Platform metrics** (2 мин)

- Покажите dashboard (total users, tracks, streams)
- Продемонстрируйте growth trends
- Покажите географическое распределение

#### 2. **Artist analytics** (2 мин)

- Покажите индивидуальные артистские метрики
- Продемонстрируйте аудиторию demographics
- Покажите top tracks performance

#### 3. **Business intelligence** (1 мин)

- Покажите revenue breakdowns
- Продемонстрируйте user acquisition costs
- Покажите retention analytics

### Ключевые talking points

- **Transparent data**: Все метрики доступны в real-time
- **Growth tracking**: Подробная аналитика для scaling decisions
- **Creator insights**: Данные для business optimization
- **Community health**: Метрики engagement и satisfaction

---

## 🎬 Технические указания для демонстраторов

### Подготовка

- **Hardware**: MacBook Pro с внешним дисплеем
- **Browser**: Chrome latest с Metamask/Phantom wallets
- **Speed**: Предварительно загрузите все assets
- **Backup**: Готовые видео для каждого сценария

### Переходы между сценариями

- Используйте разные browser tabs для разных accounts
- Подготовьте bookmarks для быстрых переходов
- Имейте готовые wallet connections

### Обработка вопросов

- **Технические вопросы**: Сфокусируйтесь на high-level benefits
- **Конкурентные сравнения**: Подчеркивайте unique Web3 features
- **Регуляторные аспекты**: Укажите на compliance features
- **Scalability**: Ссылайтесь на 5M+ user projections

### Emergency scripts

- **Slow loading**: Переключитесь на cached demo
- **Wallet issues**: Используйте pre-connected sessions
- **Network problems**: Покажите offline capabilities

---

## 📋 Чек-лист перед демонстрацией

### Техническая подготовка

- [ ] Docker demo environment запущен
- [ ] Все порты доступны (3001, 8081, etc.)
- [ ] Demo data загружена и актуальна
- [ ] Browser cache очищен
- [ ] Wallet extensions установлены

### Контент подготовка

- [ ] Talking points выучены
- [ ] Временные ограничения соблюдены
- [ ] Transition points помечены
- [ ] Backup materials готовы

### Окружение

- [ ] Тихое помещение
- [ ] Хорошее освещение для камеры (если онлайн)
- [ ] Стабильный интернет
- [ ] Backup device готов

---

_Этот документ поддерживается текущим состоянием платформы. Регулярно обновляйте сценарии по мере добавления новых функций._
