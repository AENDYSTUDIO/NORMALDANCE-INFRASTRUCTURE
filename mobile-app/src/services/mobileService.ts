// Сервис для мобильного приложения NormalDance
import { Audio } from 'expo-av'
import * as FileSystem from 'expo-file-system'
import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import { AnchorProvider, Program, web3 } from '@coral-xyz/anchor'
import { MobileInvisibleWallet } from './invisible-wallet';
import { DeflationaryModel } from '../../../../src/lib/deflationary-model';
import { TransactionFeeCalculator } from '../../../../src/lib/wallet/transaction-fee-calculator';

// Конфигурация
const SOLANA_NETWORK = 'devnet'
const RPC_URL = 'https://api.devnet.solana.com'
const API_BASE_URL = 'http://localhost:3000'

// Интерфейсы
export interface MobileTrack {
  id: string
  title: string
  artist: string
  genre: string
  duration: number
  ipfsHash: string
 metadata: {
    title: string
    artist: string
    genre: string
    duration: number
    albumArt?: string
    description?: string
    releaseDate: string
    bpm?: number
    key?: string
    isExplicit: boolean
    fileSize: number
    mimeType: string
 }
  price?: number
  isExplicit: boolean
 playCount: number
  likeCount: number
}

export interface WalletState {
  connected: boolean
  publicKey?: string
  balance?: number
  starsBalance?: number
  isInvisible: boolean;
}

export interface StakingInfo {
  level: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'
  amountStaked: number
  apy: number
  lockPeriod: number
  rewards: number
}

export interface UploadProgress {
  progress: number
  status: 'uploading' | 'processing' | 'completed' | 'failed'
 error?: string
}

export class MobileService {
  private connection: Connection
  private sound: Audio.Sound | null = null
  private invisibleWallet: MobileInvisibleWallet | null = null;
  private deflationaryModel: DeflationaryModel | null = null;
 private transactionFeeCalculator: TransactionFeeCalculator | null = null;

  constructor() {
    this.connection = new Connection(RPC_URL, 'confirmed')
  }

  // Инициализация Invisible Wallet
  async initializeInvisibleWallet(): Promise<void> {
    try {
      // Конфигурация для мобильного Invisible Wallet
      const config = {
        keyConfig: {
          encryptionAlgorithm: 'AES-256-GCM',
          keyDerivation: 'PBKDF2',
          storageLocation: 'secure-store',
          backupEnabled: true,
          rotationInterval: 30
        },
        starsConfig: {
          enabled: true,
          minAmount: 1,
          maxAmount: 10000,
          commissionRate: 0.02,
          conversionRate: 0.0001
        },
        offlineConfig: {
          maxQueueSize: 100,
          syncInterval: 30000, // 30 секунд
          retryAttempts: 3,
          storageQuota: 100 * 1024 * 1024, // 100MB
          conflictResolution: 'last-wins'
        },
        biometricRequired: true,
        autoConnect: true
      };

      this.invisibleWallet = new MobileInvisibleWallet(config);
      await this.invisibleWallet.initialize();
    } catch (error) {
      console.error('Failed to initialize Invisible Wallet:', error);
      throw error;
    }
    
    // Инициализация дефляционной модели
    async initializeDeflationaryModel(): Promise<void> {
      // В мобильной версии мы создаем упрощенную версию модели
      // так как у нас нет прямого доступа к базе данных
      this.deflationaryModel = new DeflationaryModel(this.connection);
    }
    
    // Инициализация калькулятора комиссий
   async initializeTransactionFeeCalculator(): Promise<void> {
      if (!this.deflationaryModel) {
        await this.initializeDeflationaryModel();
      }
      
      if (this.deflationaryModel) {
        this.transactionFeeCalculator = new TransactionFeeCalculator(this.deflationaryModel);
      }
    }
  }

  // Работа с треками
 async loadTracks(): Promise<MobileTrack[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tracks`)
      const data = await response.json()
      
      if (data.success) {
        return data.data.map((track: any) => ({
          id: track.id,
          title: track.title,
          artist: track.artistName,
          genre: track.genre,
          duration: track.duration,
          ipfsHash: track.ipfsHash,
          metadata: track.metadata,
          price: track.price,
          isExplicit: track.isExplicit,
          playCount: track.playCount,
          likeCount: track.likeCount
        }))
      }
      return []
    } catch (error) {
      console.error('Failed to load tracks:', error)
      return []
    }
  }

  async searchTracks(query: string): Promise<MobileTrack[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tracks/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      
      if (data.success) {
        return data.data.map((track: any) => ({
          id: track.id,
          title: track.title,
          artist: track.artistName,
          genre: track.genre,
          duration: track.duration,
          ipfsHash: track.ipfsHash,
          metadata: track.metadata,
          price: track.price,
          isExplicit: track.isExplicit,
          playCount: track.playCount,
          likeCount: track.likeCount
        }))
      }
      return []
    } catch (error) {
      console.error('Failed to search tracks:', error)
      return []
    }
  }

  async getTrackById(id: string): Promise<MobileTrack | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tracks/${id}`)
      const data = await response.json()
      
      if (data.success) {
        const track = data.data
        return {
          id: track.id,
          title: track.title,
          artist: track.artistName,
          genre: track.genre,
          duration: track.duration,
          ipfsHash: track.ipfsHash,
          metadata: track.metadata,
          price: track.price,
          isExplicit: track.isExplicit,
          playCount: track.playCount,
          likeCount: track.likeCount
        }
      }
      return null
    } catch (error) {
      console.error('Failed to get track:', error)
      return null
    }
  }

  // Работа с аудио
  async playTrack(track: MobileTrack): Promise<void> {
    try {
      // Остановка текущего трека
      if (this.sound) {
        await this.sound.unloadAsync()
      }

      // Загрузка аудио из IPFS
      const audioUrl = `https://ipfs.io/ipfs/${track.ipfsHash}`
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      )

      this.sound = newSound

      // Обновление счетчика воспроизведений
      await fetch(`${API_BASE_URL}/api/tracks/${track.id}/play`, {
        method: 'POST'
      })

    } catch (error) {
      console.error('Failed to play track:', error)
      throw error
    }
  }

  async pausePlayback(): Promise<void> {
    if (this.sound) {
      await this.sound.pauseAsync()
    }
  }

  async resumePlayback(): Promise<void> {
    if (this.sound) {
      await this.sound.playAsync()
    }
  }

  async stopPlayback(): Promise<void> {
    if (this.sound) {
      await this.sound.stopAsync()
      await this.sound.unloadAsync()
      this.sound = null
    }
  }

  // Работа с кошельком
 async connectWallet(): Promise<WalletState> {
   try {
     if (this.invisibleWallet) {
       // Используем Invisible Wallet
       const walletState = await this.invisibleWallet.connect();
       
       // Инициализируем дефляционную модель и калькулятор комиссий
       await this.initializeDeflationaryModel();
       await this.initializeTransactionFeeCalculator();
       
       return walletState;
     } else {
       // Резервная реализация - создаем Invisible Wallet при первом подключении
       await this.initializeInvisibleWallet();
       
       // Инициализируем дефляционную модель и калькулятор комиссий
       await this.initializeDeflationaryModel();
       await this.initializeTransactionFeeCalculator();
       
       return await this.invisibleWallet!.connect();
     }
   } catch (error) {
     console.error('Failed to connect wallet:', error)
     throw error
   }
}

  async disconnectWallet(): Promise<void> {
    if (this.invisibleWallet) {
      await this.invisibleWallet.disconnect();
    }
    console.log('Wallet disconnected')
  }

  async getWalletBalance(publicKey: string): Promise<number> {
    try {
      if (this.invisibleWallet) {
        // Используем методы Invisible Wallet, если доступны
        return await this.invisibleWallet.getBalance(publicKey);
      }
      
      const balance = await this.connection.getBalance(new PublicKey(publicKey))
      return balance / 1e9 // SOL to lamports
    } catch (error) {
      console.error('Failed to get wallet balance:', error)
      return 0
    }
  }

  // Получение баланса Telegram Stars
  async getStarsBalance(): Promise<number> {
    try {
      if (this.invisibleWallet) {
        // Используем методы Invisible Wallet для получения баланса Stars
        return await this.invisibleWallet.getStarsBalance();
      }
      
      // Резервная реализация через API
      const response = await fetch(`${API_BASE_URL}/api/wallet/stars-balance`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      const data = await response.json()
      if (data.success) {
        return data.data.balance
      }
      return 0
    } catch (error) {
      console.error('Failed to get Stars balance:', error)
      return 0
    }
  }

  // Покупка токенов за Telegram Stars
  async purchaseWithStars(amount: number, description: string): Promise<any> {
    try {
      if (this.invisibleWallet) {
        // Используем методы Invisible Wallet для покупки за Stars
        return await this.invisibleWallet.purchaseWithStars(amount, description);
      }
      
      // Резервная реализация через API
      const response = await fetch(`${API_BASE_URL}/api/wallet/purchase-stars`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount, description })
      })
      
      const data = await response.json()
      if (data.success) {
        return data.data
      }
      throw new Error(data.error || 'Purchase with Stars failed')
    } catch (error) {
      console.error('Failed to purchase with Stars:', error)
      throw error
    }
  }

  // Проверка статуса платежа через Telegram Stars
  async checkStarsPaymentStatus(transactionId: string): Promise<any> {
    try {
      if (this.invisibleWallet) {
        // Используем методы Invisible Wallet для проверки статуса платежа
        return await this.invisibleWallet['checkStarsPaymentStatus'](transactionId);
      }
      
      const response = await fetch(`${API_BASE_URL}/api/wallet/stars-payment-status/${transactionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      const data = await response.json()
      if (data.success) {
        return data.data
      }
      throw new Error(data.error || 'Failed to check payment status')
    } catch (error) {
      console.error('Failed to check Stars payment status:', error)
      throw error
    }
 }

  // Работа с оффлайн очередью транзакций
  async queueTransaction(transaction: Transaction): Promise<string> {
    try {
      if (this.invisibleWallet) {
        return await this.invisibleWallet.queueTransaction(transaction);
      }
      throw new Error('Invisible Wallet not initialized');
    } catch (error) {
      console.error('Failed to queue transaction:', error);
      throw error;
    }
  }

  async syncWhenOnline(): Promise<void> {
    try {
      if (this.invisibleWallet) {
        await this.invisibleWallet.syncWhenOnline();
      }
    } catch (error) {
      console.error('Failed to sync when online:', error);
      throw error;
    }
  }

  // Работа с лайками
  async likeTrack(trackId: string, walletAddress: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/api/tracks/${trackId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress })
      })
    } catch (error) {
      console.error('Failed to like track:', error)
      throw error
    }
  }

  async unlikeTrack(trackId: string, walletAddress: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/api/tracks/${trackId}/unlike`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress })
      })
    } catch (error) {
      console.error('Failed to unlike track:', error)
      throw error
    }
  }

  // Работа со стейкингом
  async getStakingInfo(walletAddress: string): Promise<StakingInfo | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/staking/info?walletAddress=${walletAddress}`)
      const data = await response.json()
      
      if (data.success) {
        return {
          level: data.data.level,
          amountStaked: data.data.amountStaked,
          apy: data.data.apy,
          lockPeriod: data.data.lockPeriod,
          rewards: data.data.rewards
        }
      return null
    } catch (error) {
      console.error('Failed to get staking info:', error)
      return null
    }
  }

  async stakeTokens(amount: number, lockPeriod: number): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/staking/stake`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount, lockPeriod })
      })
      
      const data = await response.json()
      if (data.success) {
        return data.data.signature
      }
      throw new Error(data.error || 'Staking failed')
    } catch (error) {
      console.error('Failed to stake tokens:', error)
      throw error
    }
  }

  async unstakeTokens(): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/staking/unstake`, {
        method: 'POST'
      })
      
      const data = await response.json()
      if (data.success) {
        return data.data.signature
      }
      throw new Error(data.error || 'Unstaking failed')
    } catch (error) {
      console.error('Failed to unstake tokens:', error)
      throw error
    }
  }

  // Загрузка треков
  async uploadTrack(
    file: { uri: string; name: string; type: string },
    metadata: {
      title: string
      artist: string
      genre: string
      description?: string
      isExplicit: boolean
    },
    onProgress: (progress: UploadProgress) => void
 ): Promise<string> {
    try {
      // Чтение файла
      const fileContent = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64
      })

      // Создание FormData
      const formData = new FormData()
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.type
      } as any)
      
      formData.append('metadata', JSON.stringify(metadata))

      // Отправка файла
      const response = await fetch(`${API_BASE_URL}/api/tracks/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      const data = await response.json()
      if (data.success) {
        return data.data.trackId
      }
      throw new Error(data.error || 'Upload failed')
    } catch (error) {
      console.error('Failed to upload track:', error)
      throw error
    }
  }

  // Работа с профилем
  async getUserProfile(walletAddress: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/profile?walletAddress=${walletAddress}`)
      const data = await response.json()
      
      if (data.success) {
        return data.data
      }
      return null
    } catch (error) {
      console.error('Failed to get user profile:', error)
      return null
    }
  }

  async updateUserProfile(walletAddress: string, profileData: any): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress, ...profileData })
      })
      
      const data = await response.json()
      return data.success
    } catch (error) {
      console.error('Failed to update user profile:', error)
      return false
    }
  }

  // Настройка восстановления кошелька
  async setupRecovery(contacts: Array<{ id: string; username?: string; firstName: string; lastName?: string; isVerified: boolean; trustLevel: number }>): Promise<void> {
    try {
      if (this.invisibleWallet) {
        await this.invisibleWallet.setupRecovery(contacts);
      } else {
        throw new Error('Invisible Wallet not initialized');
      }
      
      // Метод для получения статистики сжигания токенов
      async getDeflationStats(): Promise<{
        totalBurned: number;
        totalSupply: number;
        currentSupply: number;
        treasuryDistributed: number;
        stakingDistributed: number;
      } | null> {
        if (!this.deflationaryModel) {
          console.warn('Deflationary model not initialized');
          return null;
        }
        
        try {
          // В мобильной версии возвращаем mock данные или получаем сервера
          // В реальной реализации нужно будет получать актуальные данные
          return {
            totalBurned: 5000000, // 5M NDT сожжено
            totalSupply: 100000, // 1B NDT общего supply
            currentSupply: 9950000, // 995M NDT текущий supply
            treasuryDistributed: 15000000, // 15M NDT в казне
            stakingDistributed: 1000000 // 10M NDT в стейкинге
          };
        } catch (error) {
          console.error('Failed to get deflation stats:', error);
          return null;
        }
      }
      
      // Метод для расчета комиссий с учетом дефляции
     calculateDeflationFees(amount: number): {
        burnAmount: number;
        treasuryAmount: number;
        stakingAmount: number;
        netAmount: number;
        totalFee: number;
      } | null {
        if (!this.transactionFeeCalculator) {
          console.warn('Transaction fee calculator not initialized');
          return null;
        }
        
        try {
          const fees = this.transactionFeeCalculator.calculateFees(amount);
          return {
            burnAmount: fees.burnAmount,
            treasuryAmount: fees.treasuryAmount,
            stakingAmount: fees.stakingAmount,
            netAmount: fees.netAmount,
            totalFee: fees.feeAmount
          };
        } catch (error) {
          console.error('Failed to calculate deflation fees:', error);
          return null;
        }
      }
    }
    } catch (error) {
      console.error('Failed to setup recovery:', error);
      throw error;
    }
  }

  // Подписание транзакции
 async signTransaction(transaction: Transaction): Promise<Transaction> {
    try {
      if (this.invisibleWallet) {
        return await this.invisibleWallet.signTransaction(transaction);
      }
      throw new Error('Invisible Wallet not initialized');
    } catch (error) {
      console.error('Failed to sign transaction:', error);
      throw error;
    }
  }

  // Отправка транзакции
  async sendTransaction(transaction: Transaction): Promise<string> {
    try {
      if (this.invisibleWallet) {
        return await this.invisibleWallet.sendTransaction(transaction);
      }
      throw new Error('Invisible Wallet not initialized');
    } catch (error) {
      console.error('Failed to send transaction:', error);
      throw error;
    }
 }

  // Очистка ресурсов
  cleanup(): void {
    if (this.sound) {
      this.sound.unloadAsync()
      this.sound = null
    }
  }
}

// Создание экземпляра сервиса
export const mobileService = new MobileService()