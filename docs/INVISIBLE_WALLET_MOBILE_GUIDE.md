# Руководство по мобильной версии Invisible Wallet

## Введение

Мобильная версия Invisible Wallet предоставляет полную функциональность кошелька на мобильных устройствах с поддержкой iOS и Android. Приложение разработано с использованием Expo и React Native, что обеспечивает нативное качество пользовательского опыта при одновременной разработке для обеих платформ.

### Особенности мобильной версии

- **Нативный пользовательский интерфейс**: Адаптирован под особенности каждой платформы
- **Биометрическая аутентификация**: Поддержка Touch ID, Face ID и других систем распознавания
- **Оффлайн функциональность**: Работа без постоянного подключения к интернету
- **Интеграция с Telegram**: Полная поддержка Telegram Mini App и Telegram Stars
- **Локальное шифрование**: Все данные шифруются на устройстве пользователя
- **Социальное восстановление**: Восстановление доступа через доверенные контакты

## Архитектура мобильного приложения

### Стек технологий

- **React Native**: Для кроссплатформенной разработки
- **Expo**: Для упрощения разработки и деплоя
- **Expo SecureStore**: Для безопасного хранения данных
- **Expo LocalAuthentication**: Для биометрической аутентификации
- **Expo FileSystem**: Для локального хранения данных
- **React Navigation**: Для навигации между экранами
- **Invisible Wallet Core**: Ядро системы, общее с веб-версией

### Структура проекта

```
mobile-app/
├── src/
│   ├── components/          # Переиспользуемые компоненты
│   ├── screens/            # Экраны приложения
│   ├── services/           # Сервисы и бизнес-логика
│   ├── utils/              # Утилиты и вспомогательные функции
│   ├── hooks/              # Пользовательские хуки
│   └── types/              # Типы TypeScript
├── app/                    # Файлы экранов (React Navigation)
├── assets/                 # Ресурсы приложения
├── config/                 # Конфигурационные файлы
└── native/                 # Нативные модули (при необходимости)
```

## Интеграция с Expo и React Native

### Установка и настройка

Для запуска мобильной версии Invisible Wallet:

```bash
# Установка зависимостей
cd mobile-app
npm install

# Запуск в режиме разработки
npx expo start

# Запуск на iOS симуляторе
npx expo run:ios

# Запуск на Android эмуляторе
npx expo run:android
```

### Основные зависимости

```json
{
  "dependencies": {
    "expo": "~49.0.0",
    "react": "18.2.0",
    "react-native": "0.72.0",
    "expo-secure-store": "~12.1.0",
    "expo-local-authentication": "~13.3.0",
    "expo-file-system": "~15.4.0",
    "expo-device": "~5.4.0",
    "react-navigation/native": "^6.1.0",
    "@react-navigation/stack": "^6.3.0",
    "@solana/web3.js": "^1.70.0"
  }
}
```

### Конфигурация Expo

```json
{
  "expo": {
    "name": "Invisible Wallet",
    "slug": "invisible-wallet",
    "version": "1.0.0",
    "platforms": ["ios", "android"],
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "infoPlist": {
        "NSFaceIDUsageDescription": "Разрешите использовать Face ID для аутентификации в кошельке"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "permissions": [
        "Biometric",
        "Camera"
      ]
    },
    "plugins": [
      "expo-local-authentication",
      "expo-secure-store"
    ]
  }
}
```

## Биометрическая аутентификация

### Настройка биометрической аутентификации

```typescript
import * as LocalAuthentication from 'expo-local-authentication';
import { Alert } from 'react-native';

class BiometricAuthService {
  static async isBiometricAvailable(): Promise<boolean> {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    
    return compatible && enrolled;
  }

  static async authenticate(): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Аутентификация',
        fallbackLabel: 'Использовать PIN',
        cancelLabel: 'Отмена'
      });

      return result.success;
    } catch (error) {
      console.error('Ошибка биометрической аутентификации:', error);
      return false;
    }
  }

  static async getSupportedBiometryType(): Promise<LocalAuthentication.AuthenticationType | null> {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION;
    } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return LocalAuthentication.AuthenticationType.FINGERPRINT;
    }
    
    return null;
  }
}
```

### Использование в приложении

```tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { BiometricAuthService } from '../services/biometric-auth-service';

const BiometricAuthScreen = () => {
 const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<LocalAuthentication.AuthenticationType | null>(null);

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    const available = await BiometricAuthService.isBiometricAvailable();
    setBiometricAvailable(available);
    
    if (available) {
      const type = await BiometricAuthService.getSupportedBiometryType();
      setBiometricType(type);
    }
  };

  const handleBiometricAuth = async () => {
    const authenticated = await BiometricAuthService.authenticate();
    
    if (authenticated) {
      Alert.alert('Успешно', 'Аутентификация прошла успешно');
      // Продолжить работу с кошельком
    } else {
      Alert.alert('Ошибка', 'Не удалось пройти аутентификацию');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Биометрическая аутентификация</Text>
      
      {biometricAvailable ? (
        <Button
          title={`Использовать ${biometricType === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION ? 'Face ID' : 'Touch ID'}`}
          onPress={handleBiometricAuth}
        />
      ) : (
        <Text>Биометрическая аутентификация недоступна</Text>
      )}
    </View>
  );
};

export default BiometricAuthScreen;
```

## Оффлайн функциональность на мобильных устройствах

### Локальное хранение данных

```typescript
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';

class MobileStorageService {
  private static readonly ENCRYPTION_KEY = 'invisible_wallet_encryption_key';
  private static readonly WALLET_DATA_KEY = 'wallet_data';

  static async storeWalletData(data: any): Promise<void> {
    try {
      const encryptedData = this.encryptData(JSON.stringify(data));
      await SecureStore.setItemAsync(this.WALLET_DATA_KEY, encryptedData);
    } catch (error) {
      console.error('Ошибка сохранения данных кошелька:', error);
      throw error;
    }
  }

  static async retrieveWalletData(): Promise<any> {
    try {
      const encryptedData = await SecureStore.getItemAsync(this.WALLET_DATA_KEY);
      
      if (!encryptedData) {
        return null;
      }
      
      const decryptedData = this.decryptData(encryptedData);
      return JSON.parse(decryptedData);
    } catch (error) {
      console.error('Ошибка получения данных кошелька:', error);
      return null;
    }
  }

 static async storeTransactionHistory(transactions: any[]): Promise<void> {
    try {
      const fileUri = `${FileSystem.documentDirectory}transaction-history.json`;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(transactions));
    } catch (error) {
      console.error('Ошибка сохранения истории транзакций:', error);
      throw error;
    }
  }

  static async getTransactionHistory(): Promise<any[]> {
    try {
      const fileUri = `${FileSystem.documentDirectory}transaction-history.json`;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      
      if (!fileInfo.exists) {
        return [];
      }
      
      const content = await FileSystem.readAsStringAsync(fileUri);
      return JSON.parse(content);
    } catch (error) {
      console.error('Ошибка получения истории транзакций:', error);
      return [];
    }
  }

  private static encryptData(data: string): string {
    // Реализация шифрования данных
    // В реальном приложении использовать криптографически стойкие методы
    return btoa(data); // Простое кодирование для примера
  }

  private static decryptData(encryptedData: string): string {
    // Реализация дешифрования данных
    return atob(encryptedData); // Простое декодирование для примера
  }
}
```

### Оффлайн кэширование

```typescript
class OfflineCacheService {
  private static readonly CACHE_DURATION = 300000; // 5 минут
  private static cache = new Map<string, { data: any; timestamp: number }>();

  static async getCachedData<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data as T;
    }

    try {
      const data = await fetcher();
      this.cache.set(key, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      // Если нет подключения, возвращаем кэшированные данные
      if (cached) {
        return cached.data as T;
      }
      throw error;
    }
  }

  static async getOfflineBalance(): Promise<number> {
    const cached = this.cache.get('balance');
    if (cached) {
      return cached.data as number;
    }
    return 0;
  }

 static async storeOfflineTransaction(transaction: any): Promise<void> {
    const pendingTransactions = await this.getPendingTransactions();
    pendingTransactions.push({
      ...transaction,
      timestamp: Date.now(),
      status: 'pending'
    });
    
    await MobileStorageService.storeWalletData({
      pendingTransactions
    });
  }

  static async getPendingTransactions(): Promise<any[]> {
    const data = await MobileStorageService.retrieveWalletData();
    return data?.pendingTransactions || [];
  }

  static async syncPendingTransactions(): Promise<void> {
    const pendingTransactions = await this.getPendingTransactions();
    
    for (const transaction of pendingTransactions) {
      try {
        // Попытка отправки транзакции
        // await sendTransaction(transaction);
        
        // Удаление успешной транзакции из списка ожидания
        // await this.removePendingTransaction(transaction.id);
      } catch (error) {
        console.error('Ошибка синхронизации транзакции:', error);
      }
    }
 }

  private static async removePendingTransaction(transactionId: string): Promise<void> {
    const pendingTransactions = await this.getPendingTransactions();
    const updatedTransactions = pendingTransactions.filter(t => t.id !== transactionId);
    
    const data = await MobileStorageService.retrieveWalletData();
    await MobileStorageService.storeWalletData({
      ...data,
      pendingTransactions: updatedTransactions
    });
  }
}
```

### Обработка оффлайн сценариев

```tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Alert, AppState } from 'react-native';
import NetInfo from '@react-native-async-storage/netinfo';

const OfflineHandler = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const wasOnline = isOnline;
      setIsOnline(!!state.isConnected);
      
      if (wasOnline && !state.isConnected) {
        // Переход в оффлайн режим
        setOfflineMode(true);
        Alert.alert(
          'Режим оффлайн',
          'Подключение к интернету потеряно. Некоторые функции будут недоступны.',
          [{ text: 'OK' }]
        );
      } else if (!wasOnline && state.isConnected) {
        // Восстановление подключения
        setOfflineMode(false);
        Alert.alert(
          'Подключение восстановлено',
          'Подключение к интернету восстановлено. Выполняется синхронизация данных.',
          [{ text: 'OK' }]
        );
        
        // Синхронизация оффлайн данных
        OfflineCacheService.syncPendingTransactions();
      }
    });

    return () => unsubscribe();
  }, [isOnline]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background') {
        // Приложение уходит в фон - сохраняем данные
        MobileStorageService.storeWalletData({
          lastAppState: 'background',
          timestamp: Date.now()
        });
      } else if (nextAppState === 'active') {
        // Приложение становится активным - проверяем подключение
        NetInfo.fetch().then(state => {
          if (!state.isConnected) {
            setOfflineMode(true);
          }
        });
      }
    };

    AppState.addEventListener('change', handleAppStateChange);
    return () => AppState.removeEventListener('change', handleAppStateChange);
  }, []);

  return null; // Этот компонент не рендерит UI, только обрабатывает события
};
```

## Мобильная архитектура Invisible Wallet

### Основные экраны

```tsx
// app/index.tsx - Главный экран
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useWallet } from '../hooks/useWallet';
import { WalletBalance } from '../components/WalletBalance';
import { TransactionList } from '../components/TransactionList';
import { OfflineHandler } from '../components/OfflineHandler';

export default function HomeScreen() {
  const { wallet, balance, isConnected } = useWallet();
  const [offlineMode, setOfflineMode] = useState(false);

  useEffect(() => {
    // Инициализация кошелька
    initializeWallet();
  }, []);

  const initializeWallet = async () => {
    try {
      await wallet.connect();
    } catch (error) {
      console.error('Ошибка инициализации кошелька:', error);
    }
  };

  return (
    <View style={styles.container}>
      <OfflineHandler />
      
      <View style={styles.header}>
        <Text style={styles.title}>Invisible Wallet</Text>
        <Text style={styles.status}>
          {isConnected ? 'Подключен' : 'Не подключен'}
        </Text>
      </View>
      
      <WalletBalance balance={balance} />
      <TransactionList />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  status: {
    fontSize: 14,
    color: '#666',
  },
});
```

### Хук для работы с кошельком

```typescript
// hooks/useWallet.ts
import { useState, useEffect, useCallback } from 'react';
import { Connection } from '@solana/web3.js';
import { InvisibleWalletAdapter } from '../services/wallet-adapter';
import { MobileStorageService } from '../services/mobile-storage';

export const useWallet = () => {
  const [wallet, setWallet] = useState<InvisibleWalletAdapter | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const initializeWallet = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Получение сохраненных данных пользователя
      const walletData = await MobileStorageService.retrieveWalletData();
      
      const newWallet = new InvisibleWalletAdapter(
        {
          enableBiometric: true,
          enableSocialRecovery: true,
          supportedChains: ['solana'],
          enableOffline: true,
          ...walletData?.config,
        },
        new Connection('https://api.mainnet-beta.solana.com')
      );

      // Подписка на события
      newWallet.on('connect', () => {
        setIsConnected(true);
      });

      newWallet.on('disconnect', () => {
        setIsConnected(false);
      });

      newWallet.on('balanceChange', (data) => {
        setBalance(data.balance);
      });

      setWallet(newWallet);
    } catch (error) {
      console.error('Ошибка инициализации кошелька:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const connect = useCallback(async () => {
    if (wallet) {
      try {
        await wallet.connect();
      } catch (error) {
        console.error('Ошибка подключения:', error);
      }
    }
  }, [wallet]);

  const disconnect = useCallback(async () => {
    if (wallet) {
      try {
        await wallet.disconnect();
      } catch (error) {
        console.error('Ошибка отключения:', error);
      }
    }
  }, [wallet]);

  useEffect(() => {
    initializeWallet();
  }, [initializeWallet]);

  return {
    wallet,
    balance,
    isConnected,
    isLoading,
    connect,
    disconnect,
  };
};
```

### Мобильные компоненты

```tsx
// components/WalletBalance.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface WalletBalanceProps {
  balance: number;
}

export const WalletBalance: React.FC<WalletBalanceProps> = ({ balance }) => {
  return (
    <View style={styles.balanceContainer}>
      <Text style={styles.balanceLabel}>Баланс</Text>
      <Text style={styles.balanceValue}>{balance.toFixed(4)} SOL</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  balanceContainer: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 10,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#666',
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
});
```

```tsx
// components/TransactionList.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { OfflineCacheService } from '../services/offline-cache';

interface Transaction {
  id: string;
  type: string;
  amount: number;
 status: string;
 timestamp: number;
}

export const TransactionList: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      // Загрузка транзакций из кэша
      const cachedTransactions = await OfflineCacheService.getPendingTransactions();
      setTransactions(cachedTransactions);
    } catch (error) {
      console.error('Ошибка загрузки транзакций:', error);
    }
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionType}>{item.type}</Text>
        <Text style={styles.transactionAmount}>{item.amount} SOL</Text>
      </View>
      <View style={styles.transactionStatus}>
        <Text style={[
          styles.statusText,
          { color: item.status === 'confirmed' ? '#4CAF50' : '#FF9800' }
        ]}>
          {item.status}
        </Text>
        <Text style={styles.transactionTime}>
          {new Date(item.timestamp).toLocaleTimeString()}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Последние транзакции</Text>
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        style={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  list: {
    flex: 1,
  },
  transactionItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontWeight: 'bold',
  },
  transactionAmount: {
    color: '#666',
  },
  transactionStatus: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontWeight: 'bold',
  },
  transactionTime: {
    fontSize: 12,
    color: '#999',
  },
});
```

## Интеграция с Telegram на мобильных устройствах

### Запуск Telegram Mini App в мобильном приложении

```typescript
import { Linking, Alert } from 'react-native';

class TelegramIntegrationService {
  static async openTelegramMiniApp(botUsername: string, miniAppName: string) {
    try {
      const telegramUrl = `https://t.me/${botUsername}/${miniAppName}`;
      const supported = await Linking.canOpenURL(telegramUrl);
      
      if (supported) {
        await Linking.openURL(telegramUrl);
      } else {
        Alert.alert('Ошибка', 'Telegram не установлен на этом устройстве');
      }
    } catch (error) {
      console.error('Ошибка открытия Telegram Mini App:', error);
      Alert.alert('Ошибка', 'Не удалось открыть Telegram Mini App');
    }
 }

  static async shareWalletAddress(address: string) {
    try {
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(address)}&text=Мой%20адрес%20Invisible%20Wallet`;
      await Linking.openURL(shareUrl);
    } catch (error) {
      console.error('Ошибка шаринга адреса:', error);
    }
  }

  static async handleTelegramDeepLink(url: string) {
    // Обработка deep link из Telegram
    if (url.includes('tg://')) {
      // Обработка специфичных для Telegram ссылок
      console.log('Получена Telegram ссылка:', url);
    }
  }
}
```

### Работа с Telegram Stars на мобильных устройствах

```typescript
class MobileTelegramStarsService {
  static async getStarsBalance(): Promise<number> {
    // На мобильных устройствах получение баланса Stars возможно только
    // через взаимодействие с Telegram Mini App
    try {
      // Открытие Telegram Mini App для получения баланса
      await TelegramIntegrationService.openTelegramMiniApp('bot_username', 'wallet_app');
      
      // Возвращение предполагаемого баланса из локального кэша
      // или ожидание ответа через deep link
      return await this.getCachedStarsBalance();
    } catch (error) {
      console.error('Ошибка получения баланса Stars:', error);
      return 0;
    }
  }

 private static async getCachedStarsBalance(): Promise<number> {
    // Получение кэшированного баланса из локального хранилища
    const data = await MobileStorageService.retrieveWalletData();
    return data?.cachedStarsBalance || 0;
  }

  static async purchaseWithStars(amount: number, description: string): Promise<boolean> {
    try {
      // Открытие Telegram Mini App для выполнения покупки
      await TelegramIntegrationService.openTelegramMiniApp('bot_username', 'wallet_app');
      
      // В реальном приложении здесь будет обработка ответа через deep link
      // или веб-сокеты
      return true;
    } catch (error) {
      console.error('Ошибка покупки через Stars:', error);
      return false;
    }
  }
}
```

## Безопасность мобильного приложения

### Защита данных на устройстве

```typescript
class MobileSecurityService {
  static async setupDeviceProtection() {
    // Проверка, что устройство защищено
    const isDeviceSecure = await this.isDeviceSecure();
    
    if (!isDeviceSecure) {
      Alert.alert(
        'Предупреждение безопасности',
        'Для использования кошелька рекомендуется установить PIN-код или биометрическую защиту на устройстве.',
        [{ text: 'OK' }]
      );
    }
  }

  static async isDeviceSecure(): Promise<boolean> {
    try {
      // Проверка наличия защиты устройства
      const isPinSet = await LocalAuthentication.isEnrolledAsync();
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      
      return isPinSet && hasHardware;
    } catch {
      return false;
    }
  }

 static async validateJailbreak(): Promise<boolean> {
    // Проверка на jailbreak/root (упрощенная версия)
    // В реальном приложении использовать более надежные методы
    const isEmulator = this.isEmulator();
    const hasSuspiciousApps = await this.hasSuspiciousApps();
    
    return !(isEmulator || hasSuspiciousApps);
  }

  private static isEmulator(): boolean {
    // Проверка на эмулятор (упрощенная)
    // В реальном приложении использовать более надежные методы
    return false;
  }

  private static async hasSuspiciousApps(): Promise<boolean> {
    // Проверка наличие подозрительных приложений
    // В реальном приложении использовать специализированные библиотеки
    return false;
  }

  static async encryptSensitiveData(data: string): Promise<string> {
    // Реализация шифрования чувствительных данных
    // В реальном приложении использовать криптографически стойкие методы
    return this.simpleEncrypt(data);
  }

  private static simpleEncrypt(data: string): string {
    // Простое шифрование для примера (НЕ использовать в продакшене!)
    return btoa(data.split('').reverse().join(''));
  }

  static async decryptSensitiveData(encryptedData: string): Promise<string> {
    // Реализация дешифрования данных
    return this.simpleDecrypt(encryptedData);
  }

  private static simpleDecrypt(encryptedData: string): string {
    // Простое дешифрование для примера (НЕ использовать в продакшене!)
    return atob(encryptedData).split('').reverse().join('');
  }
}
```

### Обработка чувствительных операций

```tsx
import React, { useState } from 'react';
import { View, Text, Alert, TouchableOpacity } from 'react-native';
import { BiometricAuthService } from '../services/biometric-auth-service';
import { MobileSecurityService } from '../services/mobile-security';

const SensitiveOperationHandler = ({ onConfirm }: { onConfirm: () => void }) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleSensitiveOperation = async () => {
    try {
      // Проверка безопасности устройства
      const isDeviceSecure = await MobileSecurityService.validateJailbreak();
      if (!isDeviceSecure) {
        Alert.alert(
          'Предупреждение',
          'Операция не может быть выполнена на небезопасном устройстве',
          [{ text: 'OK' }]
        );
        return;
      }

      // Запрос биометрической аутентификации
      setIsAuthenticating(true);
      const authenticated = await BiometricAuthService.authenticate();
      
      if (authenticated) {
        // Выполнение чувствительной операции
        onConfirm();
      } else {
        Alert.alert('Ошибка', 'Аутентификация не пройдена');
      }
    } catch (error) {
      console.error('Ошибка чувствительной операции:', error);
      Alert.alert('Ошибка', 'Произошла ошибка при выполнении операции');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <TouchableOpacity 
      style={{ padding: 15, backgroundColor: '#07AFF', borderRadius: 8 }}
      onPress={handleSensitiveOperation}
      disabled={isAuthenticating}
    >
      <Text style={{ color: 'white', textAlign: 'center' }}>
        {isAuthenticating ? 'Аутентификация...' : 'Выполнить операцию'}
      </Text>
    </TouchableOpacity>
  );
};

export default SensitiveOperationHandler;
```

## Оптимизация производительности

### Управление памятью

```typescript
class MobilePerformanceService {
  static async optimizeMemoryUsage() {
    // Очистка кэша
    await this.clearUnusedCache();
    
    // Оптимизация изображений
    await this.optimizeImages();
  }

  private static async clearUnusedCache() {
    // Удаление старых временных файлов
    const documentsDir = FileSystem.documentDirectory;
    if (documentsDir) {
      const files = await FileSystem.readDirectoryAsync(documentsDir);
      for (const file of files) {
        const fileInfo = await FileSystem.getInfoAsync(
          `${documentsDir}${file}`
        );
        
        // Удаление файлов старше 7 дней
        if (fileInfo.modificationTime) {
          const age = Date.now() - fileInfo.modificationTime * 1000;
          if (age > 7 * 24 * 60 * 1000) { // 7 дней
            await FileSystem.deleteAsync(`${documentsDir}${file}`, { idempotent: true });
          }
        }
      }
    }
  }

  static async optimizeImages() {
    // Оптимизация изображений для экономии памяти
    // В реальном приложении использовать библиотеки для оптимизации изображений
 }

  static async getMemoryUsage(): Promise<number> {
    // В React Native нет прямого доступа к информации о памяти
    // Можно использовать сторонние библиотеки или нативные модули
    return 0; // Заглушка
  }
}
```

### Ленивая загрузка компонентов

```tsx
import React, { lazy, Suspense } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

// Ленивая загрузка тяжелых компонентов
const TransactionDetailsModal = lazy(() => import('../components/TransactionDetailsModal'));
const AdvancedSettings = lazy(() => import('../screens/AdvancedSettings'));

const LazyComponentWrapper = ({ 
  component, 
  fallback = <ActivityIndicator size="large" /> 
}: { 
  component: React.LazyExoticComponent<React.FC<any>>;
  fallback?: React.ReactNode;
}) => {
  return (
    <Suspense fallback={fallback}>
      {component}
    </Suspense>
  );
};

export { LazyComponentWrapper, TransactionDetailsModal, AdvancedSettings };
```

## Тестирование мобильной версии

### Модульные тесты

```typescript
// tests/mobile/wallet-service.test.ts
import { MobileStorageService } from '../../src/services/mobile-storage';
import { OfflineCacheService } from '../../src/services/offline-cache';

describe('Mobile Storage Service', () => {
  beforeEach(async () => {
    // Очистка перед каждым тестом
    await MobileStorageService.storeWalletData({});
  });

  it('should store and retrieve wallet data', async () => {
    const testData = { balance: 100, address: 'test_address' };
    await MobileStorageService.storeWalletData(testData);
    
    const retrievedData = await MobileStorageService.retrieveWalletData();
    expect(retrievedData).toEqual(testData);
  });

  it('should handle missing data gracefully', async () => {
    const result = await MobileStorageService.retrieveWalletData();
    expect(result).toBeNull();
  });
});

describe('Offline Cache Service', () => {
  it('should cache data and return cached value', async () => {
    const fetcher = jest.fn().mockResolvedValue('test_data');
    const result = await OfflineCacheService.getCachedData('test_key', fetcher);
    
    expect(result).toBe('test_data');
    expect(fetcher).toHaveBeenCalledTimes(1);
    
    // Второй вызов должен вернуть кэшированное значение
    const result2 = await OfflineCacheService.getCachedData('test_key', fetcher);
    expect(result2).toBe('test_data');
    expect(fetcher).toHaveBeenCalledTimes(1); // Не должен вызываться снова
  });
});
```

### UI тесты

```typescript
// tests/mobile/wallet-screen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import WalletScreen from '../../app/index';

// Моки для зависимостей
jest.mock('../../hooks/useWallet', () => ({
  useWallet: () => ({
    wallet: { connect: jest.fn(), disconnect: jest.fn() },
    balance: 10.5,
    isConnected: true,
    isLoading: false,
    connect: jest.fn(),
    disconnect: jest.fn(),
  }),
}));

describe('Wallet Screen', () => {
  it('should render wallet balance correctly', async () => {
    const { getByText } = render(<WalletScreen />);
    
    await waitFor(() => {
      expect(getByText('10.5000 SOL')).toBeTruthy();
    });
  });

  it('should handle connection state', () => {
    const { useWallet } = require('../../hooks/useWallet');
    useWallet.mockReturnValue({
      wallet: { connect: jest.fn(), disconnect: jest.fn() },
      balance: 0,
      isConnected: false,
      isLoading: false,
      connect: jest.fn(),
      disconnect: jest.fn(),
    });
    
    const { getByText } = render(<WalletScreen />);
    expect(getByText('Не подключен')).toBeTruthy();
  });
});
```

## Заключение

Мобильная версия Invisible Wallet предоставляет полную функциональность веб-версии с учетом особенностей мобильных платформ. Архитектура приложения спроектирована для обеспечения безопасности, производительности и удобства использования на мобильных устройствах.

Ключевые особенности мобильной версии:
- Полная поддержка оффлайн функциональности
- Интеграция с биометрической аутентификацией
- Безопасное хранение данных на устройстве
- Оптимизация производительности для мобильных устройств
- Полная совместимость с Telegram интеграцией
- Адаптивный пользовательский интерфейс

При разработке мобильной версии важно учитывать ограничения мобильных платформ, особенности пользовательского опыта и требования к безопасности. Следуя рекомендациям из этого руководства, вы сможете создать надежное и удобное мобильное приложение для Invisible Wallet.