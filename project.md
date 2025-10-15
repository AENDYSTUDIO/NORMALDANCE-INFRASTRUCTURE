# Анализ фронтенд кодовой базы: NORMALDANCE

## 📁 Структура проекта

```
NORMALDANCE/
├── .roo/                          # Конфигурации архитектурных агентов
├── .kilocode/                     # Настройки режимов kilocode агента
├── .vscode/                       # Конфигурации VSCode
├── contracts/                     # Смарт-контракты
├── docker-compose.yml             # Docker конфигурация
├── Dockerfile                     # Docker билд
├── src/
│   ├── app/                       # Next.js 15 приложение (страницы)
│   │   ├── telegram-app/          # Telegram Mini App
│   │   ├── telegram-partnership/  # Партнерство с Telegram
│   │   ├── ton-grant/             # Заявка на грант TON
│   │   ├── tracks/                # Страницы треков
│   │   ├── upload/                # Загрузка контента
│   │   ├── wallet/                # Страница кошелька
│   │   └── ...                    # Другие страницы
│   ├── components/                # React компоненты
│   │   ├── audio/                 # Аудио-компоненты
│   │   ├── layout/                # Компоненты макета
│   │   ├── ui/                    # UI компоненты (shadcn/ui)
│   │   ├── wallet/                # Компоненты кошельков
│   │   └── ...                    # Другие компоненты
│   ├── constants/                 # Константы приложения
│   ├── contexts/                  # React контексты
│   ├── hooks/                     # React хуки
│   ├── lib/                       # Библиотечные утилиты
│   │   ├── ai-recommendation-system.ts # ИИ-рекомендации
│   │   ├── deflationary-model.ts  # Дефляционная модель NDT
│   │   ├── ipfs-enhanced.ts       # Улучшенная IPFS интеграция
│   │   ├── telegram-integration-2025.ts # Интеграция с Telegram
│   │   └── ...                    # Другие библиотеки
│   ├── mcp/                       # Model Context Protocol сервер
│   ├── store/                     # Zustand хранилища
│   ├── types/                     # TypeScript типы
│   └── utils/                     # Утилиты
├── public/                        # Публичные ресурсы
├── tests/                         # Тесты
├── package.json                   # Зависимости и скрипты
├── next.config.ts                 # Next.js конфигурация
├── tailwind.config.ts             # Tailwind CSS конфигурация
└── server.ts                      # Кастомный сервер с Socket.IO
```

### Описание директорий:

- **src/app/** - Next.js 15 приложение с использованием App Router, содержит все страницы и маршруты
- **src/components/** - Компоненты приложения, организованные по функциональности
- **src/lib/** - Библиотечные функции и утилиты, включая бизнес-логику
- **src/store/** - Состояния приложения с использованием Zustand
- **src/hooks/** - Пользовательские React хуки
- **contracts/** - Смарт-контракты для Solana и TON
- **tests/** - Модульные и интеграционные тесты
- **.roo/** - Конфигурации и правила для архитектурных агентов
- **.kilocode/** - Настройки режимов для kilocode агента

## 🛠 Технологический стек

| Технология     | Версия | Назначение                            |
| -------------- | ------ | ------------------------------------- |
| Next.js        | 15.0.0 | Фреймворк для React приложения        |
| React          | 18.0.0 | Библиотека для построения интерфейсов |
| TypeScript     | 5.0.0  | Язык программирования с типизацией    |
| Tailwind CSS   | 4.1.13 | CSS-фреймворк для стилизации          |
| shadcn/ui      | -      | Библиотека компонентов                |
| Radix UI       | -      | Примитивы для доступных компонентов   |
| Zustand        | 5.0.8  | Библиотека управления состоянием      |
| Solana Web3.js | 1.98.4 | Библиотека для работы с Solana        |
| TON Connect    | 3.3.1  | Интеграция с TON кошельками           |
| IPFS/Helia     | 4.2.2  | Децентрализованное хранение           |
| Socket.IO      | 4.8.1  | Реал-тайм коммуникации                |
| Prisma         | 5.0.0  | ORM для работы с базой данных         |
| Jest           | 29.0   | Фреймворк для тестирования            |

### Инструменты сборки:

- **Next.js** - для сборки и рендеринга приложения
- **TypeScript** - для статической типизации
- **Tailwind CSS** - для стилизации
- **ESLint** - для линтинга кода
- **Prettier** - для форматирования кода
- **Husky** - для git хуков

## 🏗 Архитектура

### Подходы к компонентной архитектуре:

Проект использует современную архитектуру с разделением на:

1. **UI компоненты** - базовые компоненты интерфейса из shadcn/ui
2. **Функциональные компоненты** - компоненты с бизнес-логикой
3. **Контейнеры** - компоненты, управляющие состоянием и данными

Пример компонентной архитектуры из [`src/components/layout/main-layout.tsx`](src/components/layout/main-layout.tsx:1):

```tsx
export function MainLayout({ children, user }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          sidebarOpen ? "block" : "hidden"
        )}
      >
        <div
          className="fixed inset-0 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 w-72 bg-card">
          {/* Навигация */}
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-72">
        {/* Навигация */}
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top header */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-6">
          {/* Заголовок и меню пользователя */}
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
```

### Паттерны разделения логики:

1. **Хуки** - для извлечения логики в переиспользуемые функции
2. **Контексты** - для глобального управления состоянием
3. **Zustand** - для централизованного хранения состояния
4. **Компоненты высшего порядка** - для переиспользования логики

### Управление состоянием приложения:

Проект использует Zustand для управления состоянием, как показано в [`src/store/use-audio-store.ts`](src/store/use-audio-store.ts:1):

```tsx
export const useAudioStore = create<AudioState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentTrack: null,
      isPlaying: false,
      volume: 70,
      isMuted: false,
      currentTime: 0,
      duration: 0,
      queue: [],
      currentQueueIndex: -1,
      history: [],
      shuffle: false,
      repeat: "off",

      // Actions
      play: (track) =>
        set((state) => ({
          isPlaying: true,
          currentTrack:
            track ??
            state.currentTrack ??
            state.queue[state.currentQueueIndex] ??
            null,
        })),
      pause: () => set({ isPlaying: false }),
      // ... другие действия
    }),
    {
      name: "audio-store",
      partialize: (state) => ({
        volume: state.volume,
        isMuted: state.isMuted,
        shuffle: state.shuffle,
        repeat: state.repeat,
      }),
    }
  )
);
```

### Организация API-слоя и работа с данными:

Проект использует:

1. **Next.js API Routes** для серверных операций
2. **React Query/SWR** для управления серверными данными
3. **IPFS** для децентрализованного хранения
4. **Solana Web3.js** для взаимодействия с блокчейном

### Паттерны роутинга и навигации:

Используется App Router Next.js 15 с файловой системой:

- `src/app/page.tsx` - главная страница
- `src/app/tracks/[id]/page.tsx` - динамические страницы треков
- `src/app/wallet/page.tsx` - страница кошелька
- И другие маршруты

### Обработка ошибок и loading состояний:

Проект включает:

1. **Try-catch блоки** для асинхронных операций
2. **Error boundaries** для обработки ошибок в компонентах
3. **Loading состояния** для асинхронных операций
4. **Sentry** для мониторинга ошибок

## 🎨 UI/UX и стилизация

### Подходы к стилизации:

Проект использует:

1. **Tailwind CSS** для стилизации с использованием утилитарных классов
2. **shadcn/ui** для готовых компонентов с доступной разметкой
3. **Radix UI** для примитивов компонентов
4. **CSS Modules** - при необходимости

Пример стилизации из [`src/components/ui/button.tsx`](src/components/ui/button.tsx:1):

```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

### Дизайн-система:

Проект использует:

1. **shadcn/ui** как основу дизайн-системы
2. **Tailwind CSS** для настройки темы и цветов
3. **Кастомные компоненты** для специфичных элементов интерфейса

### Адаптивность:

Реализована адаптивность с использованием:

- **Tailwind CSS** утилитарных классов для адаптивности
- **Mobile-first подхода**
- **Responsive breakpoints** (sm, md, lg, xl, 2xl)

### Темизация:

Используется **next-themes** для переключения между светлой и темной темами.

### Доступность:

Проект включает:

1. **ARIA атрибуты** для доступности
2. **Клавиатурную навигацию**
3. **Контрастность цветов**
4. **Семантическую разметку**

## ✅ Качество кода

### Конфигурации линтеров:

- **ESLint** - с правилами Next.js и React
- **Prettier** - для форматирования кода
- **TypeScript** - для статической типизации

### Соглашения по именованию:

- **PascalCase** для компонентов
- **camelCase** для функций и переменных
- **UPPER_SNAKE_CASE** для констант
- **use** префикс для хуков

### Качество TypeScript типизации:

Проект использует строгую типизацию с:

- **Интерфейсами** для определения форм
- **Дженериками** для переиспользуемых компонентов
- **Strict mode** в TypeScript

Пример типизации из [`src/store/use-audio-store.ts`](src/store/use-audio-store.ts:4):

```tsx
export interface Track {
  id: string;
  title: string;
  artistName: string;
  genre: string;
  duration: number;
  playCount: number;
  likeCount: number;
  ipfsHash: string;
  audioUrl: string;
  coverImage?: string;
  metadata?: any;
  price?: number;
  isExplicit: boolean;
  isPublished: boolean;
  // Optional fields used by UI components
  isPremium?: boolean;
  bitrate?: number;
  year?: string | number;
  label?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Тесты:

Проект включает:

1. **Модульные тесты** с Jest
2. **Интеграционные тесты** для основных функций
3. **E2E тесты** с Playwright

## 🔧 Ключевые компоненты

### 1. Аудио-плеер

**Назначение**: Основной компонент воспроизведения аудио с расширенными возможностями.

**Пример использования** из [`src/components/audio/audio-player.tsx`](src/components/audio/audio-player.tsx:109):

```tsx
export function AudioPlayer() {
  const {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    currentTime,
    duration,
    queue,
    currentQueueIndex,
    history,
    shuffle,
    repeat,
    play,
    pause,
    setVolume,
    toggleMute,
    seekTo,
    playNext,
    playPrevious,
    toggleLike,
    toggleShuffle,
    setRepeat,
    addToQueue,
    removeFromQueue,
    clearQueue,
    createPlaylist,
    addToPlaylist,
    removeFromPlaylist,
    getUserPlaylists,
    setCurrentPlaylist,
  } = useAudioStore();

  const audioRef = useRef<HTMLAudioElement>(null);
  const { effectiveType } = useNetworkStatus();

  // ... логика компонента
}
```

**Основные пропсы/API**:

- Управление воспроизведением (play, pause, next, previous)
- Регулировка громкости и смена качества
- Очередь воспроизведения
- Плейлисты
- Эквалайзер
- Визуализация аудио

### 2. Компонент кошелька

**Назначение**: Интеграция с Solana и TON кошельками для Web3 функций.

**Пример использования** из [`src/components/wallet/wallet-adapter.tsx`](src/components/wallet/wallet-adapter.tsx:56):

```tsx
export function useSolanaWallet() {
  const wallet = useWallet();
  const { connection } = useConnection();

  const connectWallet = async () => {
    if (!wallet.connected) {
      if (!wallet.connect)
        throw new Error("Wallet does not support connection");
      await wallet.connect();
    }
  };

  const disconnectWallet = async () => {
    if (wallet.connected) {
      if (!wallet.disconnect)
        throw new Error("Wallet does not support disconnection");
      await wallet.disconnect();
    }
  };

  const signMessage = async (message: Uint8Array): Promise<Uint8Array> => {
    if (!wallet.connected) throw new WalletNotConnectedError();
    if (!wallet.signMessage)
      throw new Error("Wallet does not support message signing");

    try {
      return await wallet.signMessage(message);
    } catch (error) {
      console.error("Error signing message:", error);
      Sentry.captureException(error);
      throw error;
    }
  };

  const sendTransaction = async (transaction: Transaction): Promise<string> => {
    if (!wallet.connected) throw new WalletNotConnectedError();
    if (!wallet.sendTransaction)
      throw new Error("Wallet does not support transaction sending");

    try {
      const signature = await wallet.sendTransaction(transaction, connection);
      return signature;
    } catch (error) {
      console.error("Error sending transaction:", error);
      Sentry.captureException(error);
      throw error;
    }
  };

  const getBalance = async (): Promise<number> => {
    if (!wallet.publicKey) return 0;

    try {
      const balance = await connection.getBalance(wallet.publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error("Error getting balance:", error);
      Sentry.captureException(error);
      return 0;
    }
  };

  return {
    ...wallet,
    connectWallet,
    disconnectWallet,
    signMessage,
    sendTransaction,
    getBalance,
  };
}
```

**Основные пропсы/API**:

- Подключение и отключение кошелька
- Подпись сообщений и транзакций
- Получение баланса
- Отправка транзакций

### 3. Главный макет

**Назначение**: Базовый макет приложения с навигацией и пользовательским интерфейсом.

**Пример использования** из [`src/components/layout/main-layout.tsx`](src/components/layout/main-layout.tsx:63):

```tsx
export function MainLayout({ children, user }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          sidebarOpen ? "block" : "hidden"
        )}
      >
        <div
          className="fixed inset-0 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 w-72 bg-card">
          {/* Навигация */}
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-72">
        {/* Навигация */}
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top header */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-6">
          {/* Заголовок и меню пользователя */}
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
```

**Основные пропсы/API**:

- `children` - содержимое страницы
- `user` - информация о пользователе
- Состояния для мобильного меню и пользовательского меню

### 4. Интеграция с Telegram

**Назначение**: Интеграция с Telegram для Mini-App и уведомлений.

**Пример использования** из [`src/lib/telegram-integration-2025.ts`](src/lib/telegram-integration-2025.ts:69):

```tsx
export class TelegramIntegration2025 {
  private botToken: string;
  private webAppUrl: string;
  private notifications: Map<number, TelegramNotification[]> = new Map();
  private socialPayments: Map<string, SocialPayment> = new Map();
  private miniApp: TelegramMiniApp;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || "";
    this.webAppUrl =
      process.env.TELEGRAM_WEB_APP_URL || "https://normaldance.com/telegram";

    this.miniApp = {
      id: "normaldance_dex",
      name: "NormalDance DEX",
      description:
        "Продвинутый DEX с гибридными алгоритмами AMM и защитой от волатильности",
      version: "2025.1.0",
      features: [
        "hybrid_amm",
        "volatility_protection",
        "smart_limit_orders",
        "ml_predictions",
        "social_payments",
        "ton_space_integration",
      ],
      web_app_url: this.webAppUrl,
      bot_username: "normaldance_dex_bot",
      is_verified: true,
      stars_revenue_share: 0.3, // 30% от Stars
    };
  }

  async initializeMiniApp(): Promise<boolean> {
    try {
      // Регистрация Mini-App в Telegram
      const response = await fetch(
        "https://api.telegram.org/bot" + this.botToken + "/setWebhook",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: `${this.webAppUrl}/api/telegram/webhook`,
            allowed_updates: [
              "message",
              "callback_query",
              "inline_query",
              "payment",
            ],
          }),
        }
      );

      const result = await response.json();
      return result.ok;
    } catch (error) {
      console.error("Error initializing Telegram Mini-App:", error);
      return false;
    }
  }
}
```

**Основные пропсы/API**:

- Инициализация Mini-App
- Обработка платежей через Telegram
- Отправка уведомлений
- Создание социальных платежей

### 5. Компонент TON кошелька

**Назначение**: Интеграция с TON кошельками для работы с TON и NFT.

**Пример использования** из [`src/components/wallet/ton-wallet-connect.tsx`](src/components/wallet/ton-wallet-connect.tsx:22):

```tsx
export function TonWalletConnect({
  className,
  onConnect,
  onDisconnect,
}: TonWalletConnectProps) {
  const [tonConnectUI] = useTonConnectUI();
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await tonConnectUI.connectWallet();
      onConnect?.();
      toast({
        title: "Кошелек подключен",
        description: "TON кошелек успешно подключен к приложению",
      });
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast({
        title: "Ошибка подключения",
        description: "Не удалось подключить TON кошелек",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await tonConnectUI.disconnect();
      onDisconnect?.();
      toast({
        title: "Кошелек отключен",
        description: "TON кошелек успешно отключен от приложения",
      });
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      toast({
        title: "Ошибка отключения",
        description: "Не удалось отключить TON кошелек",
        variant: "destructive",
      });
    }
  };

  // ... отображение компонента
}
```

**Основные пропсы/API**:

- `className` - CSS класс для стилизации
- `onConnect` - колбэк при подключении
- `onDisconnect` - колбэк при отключении
- Подключение и отключение кошелька
- Отображение информации о кошельке

## 📋 Выводы и рекомендации

### Сильные стороны:

1. **Современная архитектура** - использование Next.js 15 с App Router
2. **Качественная типизация** - строгая типизация TypeScript
3. **Децентрализованное хранение** - интеграция с IPFS и Filecoin
4. **Web3 интеграции** - поддержка Solana и TON кошельков
5. **Адаптивный интерфейс** - качественная адаптивная верстка
6. **Масштабируемость** - модульная архитектура компонентов
7. **Безопасность** - встроенные меры безопасности и валидации

### ## ✅ ПРОГРЕСС УЛУЧШЕНИЙ

#### Phase 1: COMPLETE ✅ (100%)
1. ✅ Database Configuration
2. ✅ TypeScript Suppressions (3 removed)
3. ✅ ESLint Configuration
4. ✅ Centralized Logger (15+ files)
5. ✅ Mock Data Removal
6. ✅ Security Audit (Env validator + Zod schemas)

#### Phase 2: STARTED 🔄 (10%)
1. 🔄 Remove `any` types (5/50 files done)
2. ⬜ Apply Zod to APIs (2/76 done)
3. ⬜ Unified error handling (system created)
4. ⬜ Env centralization
5. ⬜ Dependency audit

### Создано файлов:
- `.env.production.example` - Production config
- `src/lib/utils/logger.ts` - Centralized logging
- `src/__mocks__/tracks.ts` - Test fixtures
- `.eslintrc.json` - Code quality rules
- `PHASE1_COMPLETED.md` - Detailed progress
- `IMPROVEMENTS_SUMMARY.md` - Full roadmap

---

Потенциальные области для улучшения:

1. **Документация** - улучшение inline-документации компонентов
2. **Тестирование** - расширение покрытия тестами, особенно для Web3 функций
3. **Оптимизация** - ленивая загрузка для тяжелых компонентов
4. **Конфигурация** - централизация конфигураций

### Уровень сложности проекта:

**Senior friendly** - проект демонстрирует продвинутую архитектуру с использованием современных технологий и подходов, включая Web3 интеграции, децентрализованное хранение, сложную бизнес-логику и высокую степень модульности.

### Особые решения:

1. **Дефляционная модель токена** - автоматическое сжигание 2% от каждой транзакции
2. **Улучшенная IPFS интеграция** - с репликацией на несколько шлюзов
3. **Telegram Mini-App интеграция** - для массового adoption
4. **Гибридный AMM** - алгоритм для DEX с защитой от MEV
5. **ИИ-рекомендательная система** - для персонализации контента
