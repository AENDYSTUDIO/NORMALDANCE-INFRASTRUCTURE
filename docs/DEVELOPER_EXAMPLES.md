# 💻 Примеры разработки для NORMAL DANCE

## Обзор

Этот документ содержит практические примеры интеграции с NORMAL DANCE API, настройки разработки, работы с Web3 функциями и мобильной разработкой.

## 🚀 Быстрый старт разработки

### Настройка проекта

```bash
# 1. Клонирование репозитория
git clone https://github.com/AENDYSTUDIO/NORMALDANCE-REVOLUTION.git
cd NORMALDANCE-REVOLUTION

# 2. Установка зависимостей
npm install

# 3. Настройка окружения
cp .env.example .env.local

# 4. Запуск базы данных и Redis
docker-compose up -d postgres redis

# 5. Миграции базы данных
npm run db:generate
npm run db:migrate

# 6. Запуск в режиме разработки
npm run dev
```

### Структура проекта

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── invest/            # Инвесторская страница
│   ├── ton-grant/         # TON грант информация
│   └── telegram-partnership/ # Партнерство с Telegram
├── components/            # React компоненты
│   ├── wallet/           # Web3 wallet интеграция
│   ├── nft/              # NFT функциональность
│   └── staking/          # Staking интерфейс
├── lib/                   # Утилиты и сервисы
│   ├── db.ts             # База данных
│   ├── wallet-adapter.tsx # Web3 адаптер
│   └── deflationary-model.ts # Дефляционная модель
└── types/                 # TypeScript типы
```

## 🔗 API интеграция

### REST API примеры

#### Аутентификация

```typescript
// Авторизация через Phantom wallet
import { useWallet } from '@solana/wallet-adapter-react';

const { signMessage, publicKey } = useWallet();

// Подпись сообщения для аутентификации
const authenticateUser = async () => {
  if (!publicKey || !signMessage) return;

  const message = `Sign in to NORMAL DANCE: ${Date.now()}`;
  const encodedMessage = new TextEncoder().encode(message);
  const signature = await signMessage(encodedMessage);

  const response = await fetch('/api/auth/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      publicKey: publicKey.toString(),
      message,
      signature: Array.from(signature),
    }),
  });

  const { token } = await response.json();
  localStorage.setItem('auth_token', token);
};
```

#### Загрузка трека

```typescript
// Загрузка музыкального трека с метаданными
const uploadTrack = async (audioFile: File, metadata: TrackMetadata) => {
  const formData = new FormData();
  formData.append('audio', audioFile);
  formData.append('metadata', JSON.stringify(metadata));

  const response = await fetch('/api/tracks/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
    },
    body: formData,
  });

  if (response.ok) {
    const { ipfsHash, trackId } = await response.json();
    console.log('Track uploaded:', { ipfsHash, trackId });
  }
};
```

#### Создание NFT

```typescript
// Создание NFT для трека
const createTrackNFT = async (trackId: string) => {
  const response = await fetch('/api/nft/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
    },
    body: JSON.stringify({
      trackId,
      name: 'My Awesome Track',
      description: 'Revolutionary music NFT',
      attributes: [
        { trait_type: 'Genre', value: 'Electronic' },
        { trait_type: 'BPM', value: '128' },
      ],
    }),
  });

  const { mintAddress, nftId } = await response.json();
  return { mintAddress, nftId };
};
```

### WebSocket события

```typescript
// Подключение к WebSocket для реального времени
import { io, Socket } from 'socket.io-client';

const socket: Socket = io(process.env.NEXT_PUBLIC_WS_URL, {
  auth: {
    token: localStorage.getItem('auth_token'),
  },
});

// События платформы
socket.on('track:uploaded', (data) => {
  console.log('New track uploaded:', data);
});

socket.on('staking:reward', (data) => {
  console.log('Staking reward received:', data);
});

socket.on('nft:sale', (data) => {
  console.log('NFT sold:', data);
});

// Отправка событий
const likeTrack = (trackId: string) => {
  socket.emit('track:like', { trackId });
};

const startStaking = (amount: number) => {
  socket.emit('staking:start', { amount });
};
```

## 🎵 Web3 интеграция

### Solana программы

#### Взаимодействие с токеном NDT

```typescript
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from '@solana/spl-token';

const connection = new Connection(
  'https://api.mainnet-beta.solana.com'
);

// Минтинг токенов NDT
const mintNDT = async (
  mintAuthority: Keypair,
  recipient: PublicKey,
  amount: number
) => {
  const mintPublicKey = new PublicKey(process.env.NEXT_PUBLIC_NDT_MINT!);
  const recipientATA = await getOrCreateAssociatedTokenAccount(
    connection,
    mintAuthority,
    mintPublicKey,
    recipient
  );

  const transaction = new Transaction().add(
    mintTo(
      mintPublicKey,
      recipientATA.address,
      mintAuthority.publicKey,
      amount * Math.pow(10, 9), // 9 decimals for NDT
      [],
      TOKEN_PROGRAM_ID
    )
  );

  const signature = await connection.sendTransaction(
    transaction,
    [mintAuthority]
  );

  await connection.confirmTransaction(signature);
  return signature;
};
```

#### Staking операции

```typescript
// Staking NDT токенов
const stakeTokens = async (
  wallet: any,
  amount: number,
  lockPeriod: number
) => {
  const stakingProgramId = new PublicKey(
    process.env.NEXT_PUBLIC_STAKING_PROGRAM_ID!
  );

  const stakingAccount = Keypair.generate();
  const userTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    wallet,
    new PublicKey(process.env.NEXT_PUBLIC_NDT_MINT!),
    wallet.publicKey
  );

  const transaction = new Transaction();

  // Создание аккаунта стейкинга
  transaction.add(
    SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: stakingAccount.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(165),
      space: 165,
      programId: stakingProgramId,
    })
  );

  // Staking инструкция
  transaction.add({
    keys: [
      {
        pubkey: wallet.publicKey,
        isSigner: true,
        isWritable: true,
      },
      {
        pubkey: userTokenAccount.address,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: stakingAccount.publicKey,
        isSigner: false,
        isWritable: true,
      },
    ],
    programId: stakingProgramId,
    data: Buffer.from([0, ...encodeAmount(amount), lockPeriod]),
  });

  const signature = await wallet.sendTransaction(transaction, connection, {
    signers: [stakingAccount],
  });

  return signature;
};
```

### IPFS интеграция

```typescript
import { createHelia } from 'helia';
import { strings } from '@helia/strings';

// Загрузка файлов в IPFS
const uploadToIPFS = async (file: File) => {
  const helia = await createHelia();
  const s = strings(helia);

  // Загрузка метаданных
  const metadata = {
    name: file.name,
    size: file.size,
    type: file.type,
    uploadedAt: new Date().toISOString(),
  };

  const metadataCid = await s.add(JSON.stringify(metadata));
  const fileCid = await s.add(file.stream());

  await helia.stop();

  return {
    metadataCid: metadataCid.toString(),
    fileCid: fileCid.toString(),
    metadata,
  };
};

// Получение данных из IPFS
const fetchFromIPFS = async (cid: string) => {
  const helia = await createHelia();
  const s = strings(helia);

  const data = await s.get(cid);
  await helia.stop();

  return JSON.parse(data);
};
```

## 📱 Мобильная разработка

### React Native интеграция

```typescript
// src/services/mobileService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

export class MobileService {
  private static instance: MobileService;
  private sound: Audio.Sound | null = null;

  static getInstance(): MobileService {
    if (!MobileService.instance) {
      MobileService.instance = new MobileService();
    }
    return MobileService.instance;
  }

  // Оффлайн воспроизведение
  async playOfflineTrack(trackId: string): Promise<void> {
    try {
      const cachedTrack = await this.getCachedTrack(trackId);
      if (cachedTrack) {
        await this.playAudio(cachedTrack.localPath);
      } else {
        throw new Error('Track not cached');
      }
    } catch (error) {
      console.error('Offline playback failed:', error);
      throw error;
    }
  }

  // Кеширование треков
  async cacheTrack(trackId: string, audioUrl: string): Promise<void> {
    try {
      const localPath = `${FileSystem.documentDirectory}tracks/${trackId}.mp3`;
      await FileSystem.downloadAsync(audioUrl, localPath);
      await AsyncStorage.setItem(`track_${trackId}`, localPath);
    } catch (error) {
      console.error('Caching failed:', error);
      throw error;
    }
  }

  private async getCachedTrack(trackId: string): Promise<string | null> {
    return await AsyncStorage.getItem(`track_${trackId}`);
  }

  private async playAudio(filePath: string): Promise<void> {
    if (this.sound) {
      await this.sound.unloadAsync();
    }

    const { sound } = await Audio.Sound.createAsync(
      { uri: filePath },
      { shouldPlay: true }
    );

    this.sound = sound;
  }
}
```

### Wallet интеграция для мобильного приложения

```typescript
// src/hooks/useMobileWallet.ts
import { useWallet } from '@solana/wallet-adapter-react-native';
import { PublicKey, Transaction } from '@solana/web3.js';

export const useMobileWallet = () => {
  const { signTransaction, signAllTransactions, publicKey } = useWallet();

  const signAndSendTransaction = async (
    transaction: Transaction,
    connection: Connection
  ): Promise<string> => {
    if (!signTransaction || !publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      // Подпись транзакции
      transaction.recentBlockhash = (
        await connection.getRecentBlockhash()
      ).blockhash;

      transaction.feePayer = publicKey;
      const signedTransaction = await signTransaction(transaction);

      // Отправка транзакции
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize()
      );

      await connection.confirmTransaction(signature, 'confirmed');
      return signature;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  };

  const signMessage = async (message: string): Promise<Uint8Array> => {
    if (!signTransaction) {
      throw new Error('Wallet not connected');
    }

    const encodedMessage = new TextEncoder().encode(message);
    return await signTransaction(encodedMessage);
  };

  return {
    publicKey,
    signAndSendTransaction,
    signMessage,
    connected: !!publicKey,
  };
};
```

## 🧪 Тестирование

### Unit тесты

```typescript
// src/lib/__tests__/deflationary-model.test.ts
import { calculateBurnAmount, calculateStakingRewards } from '../deflationary-model';

describe('Deflationary Model', () => {
  describe('calculateBurnAmount', () => {
    it('should calculate 2% burn correctly', () => {
      const transactionAmount = 1000;
      const burnAmount = calculateBurnAmount(transactionAmount);

      expect(burnAmount).toBe(20); // 2% of 1000
    });

    it('should handle zero amount', () => {
      const burnAmount = calculateBurnAmount(0);
      expect(burnAmount).toBe(0);
    });
  });

  describe('calculateStakingRewards', () => {
    it('should calculate rewards based on stake amount and duration', () => {
      const stakeAmount = 10000;
      const stakeDuration = 30; // days
      const rewards = calculateStakingRewards(stakeAmount, stakeDuration);

      expect(rewards).toBeGreaterThan(0);
    });
  });
});
```

### Интеграционные тесты

```typescript
// tests/integration/api.test.ts
import { createMocks } from 'node-mocks-http';
import { POST } from '@/app/api/tracks/upload/route';

describe('/api/tracks/upload', () => {
  it('should upload track successfully', async () => {
    const { req } = createMocks({
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-token',
      },
      body: {
        // Mock FormData
      },
    });

    const response = await POST(req);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('ipfsHash');
    expect(data).toHaveProperty('trackId');
  });

  it('should reject unauthorized requests', async () => {
    const { req } = createMocks({
      method: 'POST',
      // No authorization header
    });

    const response = await POST(req);
    expect(response.status).toBe(401);
  });
});
```

## 🔧 Конфигурация разработки

### VS Code настройки

```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "emmet.includeLanguages": {
    "typescript": "typescriptreact"
  }
}
```

### Pre-commit хуки

```yaml
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run lint
npm run type-check
npm run test
npm run build
```

## 🚀 Production деплой

### Docker сборка

```bash
# Локальная сборка для тестирования
docker build -f docker/nextjs.Dockerfile -t normaldance:local .

# Многоэтапная сборка для продакшна
docker build \
  --target production \
  -f docker/nextjs.Dockerfile \
  -t normaldance:prod \
  .
```

### Kubernetes деплой

```bash
# Установка через Helm
helm upgrade --install normaldance ./helm/normaldance \
  --namespace production \
  --create-namespace \
  --values ./helm/normaldance/values-production.yaml \
  --atomic

# Проверка развертывания
kubectl get pods -n production -l app=normaldance
kubectl get services -n production -l app=normaldance
```

## 📚 Дополнительные ресурсы

- [API документация](./API_DOCUMENTATION.md)
- [Руководство по мониторингу](./MONITORING_GUIDE.md)
- [Гайд по безопасности](./SECURITY_GUIDE.md)
- [Мобильная документация](./mobile-app/README.md)

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Закоммитьте изменения (`git commit -m 'Add amazing feature'`)
4. Запушьте branch (`git push origin feature/amazing-feature`)
5. Создайте Pull Request

---

*Для получения дополнительной помощи присоединяйтесь к нашему [Discord сообществу](https://discord.gg/normaldance) или создайте issue в репозитории.*