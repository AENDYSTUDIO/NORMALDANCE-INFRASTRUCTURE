// Конфигурация для системы кошелька и платежей Telegram Stars

export const WALLET_CONFIG = {
  // Настройки для Telegram Stars
  TELEGRAM_STARS: {
    // Минимальная сумма Stars для покупки
    MIN_PURCHASE_AMOUNT: 100, // 100 Stars = $0.14
    // Максимальная сумма Stars за одну транзакцию
    MAX_PURCHASE_AMOUNT: 1000000, // 1,000,000 Stars = $1,400
    // Комиссия Telegram за транзакции (обычно 10% от стоимости)
    TELEGRAM_FEE_PERCENT: 10,
    // Настройки конвертации
    CONVERSION_RATES: {
      // Кэширование курса конвертации в миллисекундах
      CACHE_DURATION: 300000, // 5 минут
      // Стандартный курс SOL к Stars (примерный)
      DEFAULT_SOL_TO_STARS: 285714, // Пример: 1 SOL = ~285,714 Stars (при $140 за SOL и $0.00048 за Star)
    },
    // Настройки сессии платежа
    PAYMENT_SESSION: {
      // Время жизни сессии в миллисекундах
      EXPIRATION_TIME: 900000, // 15 минут
      // Проверка статуса транзакции
      STATUS_CHECK_INTERVAL: 5000, // 5 секунд
      // Максимальное количество попыток проверки статуса
      MAX_STATUS_CHECK_ATTEMPTS: 12, // 60 секунд максимум
    },
    // URL для взаимодействия с Telegram API
    API_URL: 'https://api.telegram.org',
    // URL для веб-приложения
    WEB_APP_URL: 'https://web.telegram.org',
  },

  // Настройки для Invisible Wallet
  INVISIBLE_WALLET: {
    // Время жизни сессии кошелька
    SESSION_DURATION: 3600000, // 1 час
    // Период обновления баланса
    BALANCE_REFRESH_INTERVAL: 30000, // 30 секунд
    // Период обновления курсов
    RATES_REFRESH_INTERVAL: 60000, // 1 минута
  },

  // Настройки безопасности
  SECURITY: {
    // Максимальное время ожидания транзакции
    MAX_TRANSACTION_TIME: 300000, // 5 минут
    // Период блокировки после неудачных попыток
    LOCKOUT_DURATION: 300000, // 5 минут
    // Максимальное количество попыток ввода
    MAX_RETRY_ATTEMPTS: 3,
  },
};

// Настройки для различных сред выполнения
export const ENV_CONFIG = {
  development: {
    ...WALLET_CONFIG,
    TELEGRAM_STARS: {
      ...WALLET_CONFIG.TELEGRAM_STARS,
      API_URL: 'https://api.telegram.org',
    },
  },
  production: {
    ...WALLET_CONFIG,
    TELEGRAM_STARS: {
      ...WALLET_CONFIG.TELEGRAM_STARS,
      API_URL: 'https://api.telegram.org',
    },
  },
  test: {
    ...WALLET_CONFIG,
    TELEGRAM_STARS: {
      ...WALLET_CONFIG.TELEGRAM_STARS,
      API_URL: 'https://api.telegram.org',
      // В тестовой среде используем пониженные лимиты для быстрого тестирования
      PAYMENT_SESSION: {
        ...WALLET_CONFIG.TELEGRAM_STARS.PAYMENT_SESSION,
        EXPIRATION_TIME: 60000, // 1 минута для тестов
        STATUS_CHECK_INTERVAL: 1000, // 1 секунда для тестов
        MAX_STATUS_CHECK_ATTEMPTS: 30, // 30 попыток для тестов
      },
    },
  },
};

// Получить конфигурацию в зависимости от среды
export const getConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return ENV_CONFIG[env as keyof typeof ENV_CONFIG] || ENV_CONFIG.development;
};

// Экспортируем текущую активную конфигурацию
export const CURRENT_CONFIG = getConfig();

// Функция для получения конфигурации Invisible Wallet с настройками Stars
export function getInvisibleWalletConfig() {
  const config = getConfig();
  
  return {
    starsConfig: {
      enabled: true,
      minAmount: config.TELEGRAM_STARS.MIN_PURCHASE_AMOUNT,
      maxAmount: config.TELEGRAM_STARS.MAX_PURCHASE_AMOUNT,
      conversionRate: 1 / config.TELEGRAM_STARS.CONVERSION_RATES.DEFAULT_SOL_TO_STARS, // Обратный курс для вычислений
    }
  };
}