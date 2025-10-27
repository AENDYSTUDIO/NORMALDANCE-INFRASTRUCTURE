# 💡 Примеры использования и руководства

## Обзор примеров

Этот раздел содержит практические примеры использования NORMAL DANCE платформы для различных сценариев.

## 🎵 Примеры интеграции API

### JavaScript/TypeScript интеграция

```typescript
// src/examples/api-integration.ts
import { NormalDanceAPI } from '@normaldance/sdk';

class MusicPlatform {
  private api: NormalDanceAPI;

  constructor(apiKey: string) {
    this.api = new NormalDanceAPI({
      apiKey,
      baseURL: 'https://api.normaldance.com'
    });
  }

  async searchTracks(query: string, genre?: string) {
    try {
      const response = await this.api.search({
        q: query,
        type: 'tracks',
        genre
      });

      return response.results.tracks;
    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  }

  async uploadTrack(file: File, metadata: TrackMetadata) {
    try {
      const track = await this.api.tracks.upload({
        file,
        title: metadata.title,
        artist: metadata.artist,
        genre: metadata.genre
      });

      // Создание NFT для трека
      const nft = await this.api.nft.create({
        track_id: track.id,
        name: `${metadata.title} NFT`,
        total_supply: 100
      });

      return { track, nft };
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }
}

// Использование
const platform = new MusicPlatform('your-api-key');
const tracks = await platform.searchTracks('electronic');
```

### React компонент плеера

```tsx
// src/examples/MusicPlayer.tsx
import React, { useState, useEffect } from 'react';
import { Track } from '@normaldance/sdk';

interface MusicPlayerProps {
  track: Track;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ track }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audio] = useState(new Audio(track.stream_url));

  useEffect(() => {
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audio]);

  const togglePlay = async () => {
    try {
      if (isPlaying) {
        audio.pause();
      } else {
        await audio.play();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Playback failed:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="music-player">
      <img src={track.cover_url} alt={track.title} />
      <div className="track-info">
        <h3>{track.title}</h3>
        <p>{track.artist}</p>
      </div>
      <div className="controls">
        <button onClick={togglePlay}>
          {isPlaying ? '⏸️' : '▶️'}
        </button>
      </div>
      <div className="progress">
        <span>{formatTime(currentTime)}</span>
        <input
          type="range"
          min="0"
          max={track.duration}
          value={currentTime}
          onChange={(e) => {
            audio.currentTime = Number(e.target.value);
            setCurrentTime(Number(e.target.value));
          }}
        />
        <span>{formatTime(track.duration)}</span>
      </div>
    </div>
  );
};
```

## 🔗 Web3 интеграция

### Подключение к Solana wallet

```typescript
// src/examples/wallet-integration.ts
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';

export class WalletManager {
  private connection: Connection;
  private wallet: PhantomWalletAdapter;

  constructor() {
    this.connection = new Connection('https://api.mainnet-beta.solana.com');
    this.wallet = new PhantomWalletAdapter();
  }

  async connect(): Promise<string> {
    try {
      await this.wallet.connect();
      return this.wallet.publicKey?.toString() || '';
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    }
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    try {
      return await this.wallet.signTransaction(transaction);
    } catch (error) {
      console.error('Transaction signing failed:', error);
      throw error;
    }
  }

  async purchaseNFT(nftId: string, price: number): Promise<string> {
    try {
      const transaction = await this.api.createPurchaseTransaction(nftId, price);
      const signedTransaction = await this.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(signedTransaction.serialize());

      return signature;
    } catch (error) {
      console.error('NFT purchase failed:', error);
      throw error;
    }
  }
}
```

### Создание музыкального NFT

```typescript
// src/examples/nft-creation.ts
import { createMintNFTTransaction } from '@/lib/solana-utils';

export class NFTCreator {
  async createMusicNFT(
    trackId: string,
    metadata: NFTMetadata,
    wallet: WalletManager
  ): Promise<string> {
    try {
      // 1. Загрузка метаданных в IPFS
      const metadataUri = await this.uploadMetadataToIPFS(metadata);

      // 2. Создание транзакции минтинга
      const transaction = await createMintNFTTransaction({
        metadataUri,
        recipient: wallet.publicKey,
        royalties: metadata.royalty_percentage
      });

      // 3. Подписание и отправка транзакции
      const signature = await wallet.sendTransaction(transaction);

      // 4. Регистрация NFT в платформе
      await this.api.registerNFT({
        track_id: trackId,
        mint_address: signature,
        metadata_uri: metadataUri
      });

      return signature;
    } catch (error) {
      console.error('NFT creation failed:', error);
      throw error;
    }
  }

  private async uploadMetadataToIPFS(metadata: NFTMetadata): Promise<string> {
    const response = await fetch('/api/ipfs/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metadata)
    });

    const { ipfsHash } = await response.json();
    return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
  }
}
```

## 🎨 Кастомные UI компоненты

### Компонент карточки трека

```tsx
// src/examples/TrackCard.tsx
import React from 'react';
import { Track } from '@/types/track';
import { formatDuration } from '@/utils/formatters';

interface TrackCardProps {
  track: Track;
  onPlay: (trackId: string) => void;
  onPurchase: (trackId: string) => void;
}

export const TrackCard: React.FC<TrackCardProps> = ({
  track,
  onPlay,
  onPurchase
}) => {
  return (
    <div className="track-card">
      <div className="track-cover">
        <img src={track.cover_url} alt={track.title} />
        <button
          className="play-button"
          onClick={() => onPlay(track.id)}
        >
          ▶️
        </button>
      </div>

      <div className="track-info">
        <h3 className="track-title">{track.title}</h3>
        <p className="track-artist">{track.artist}</p>
        <div className="track-meta">
          <span className="duration">{formatDuration(track.duration)}</span>
          <span className="genre">{track.genre}</span>
        </div>
      </div>

      <div className="track-actions">
        {track.nft_available ? (
          <button
            className="nft-button"
            onClick={() => onPurchase(track.id)}
          >
            Купить NFT ({track.nft_price} SOL)
          </button>
        ) : (
          <button
            className="stream-button"
            onClick={() => onPlay(track.id)}
          >
            Слушать
          </button>
        )}
      </div>
    </div>
  );
};
```

### Компонент поиска

```tsx
// src/examples/SearchComponent.tsx
import React, { useState, useEffect } from 'react';
import { SearchResults } from '@/types/api';

export const SearchComponent: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delayedSearch = setTimeout(async () => {
      if (query.length < 2) return;

      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [query]);

  return (
    <div className="search-component">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск музыки, артистов..."
        className="search-input"
      />

      {loading && <div className="loading">Поиск...</div>}

      {results && (
        <div className="search-results">
          {results.tracks.length > 0 && (
            <div className="tracks-section">
              <h3>Треки</h3>
              {results.tracks.map(track => (
                <TrackCard key={track.id} track={track} />
              ))}
            </div>
          )}

          {results.artists.length > 0 && (
            <div className="artists-section">
              <h3>Артисты</h3>
              {results.artists.map(artist => (
                <ArtistCard key={artist.id} artist={artist} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

## 📱 Мобильное приложение примеры

### React Native плеер

```tsx
// mobile-app/src/components/MusicPlayer.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import TrackPlayer, { State, Event } from 'react-native-track-player';
import Slider from '@react-native-community/slider';

export const MusicPlayer: React.FC<{ track: Track }> = ({ track }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(track.duration);

  useEffect(() => {
    // Настройка TrackPlayer
    TrackPlayer.setupPlayer();
    TrackPlayer.updateQueue([track]);

    // Подписка на события
    const subscription = TrackPlayer.addEventListener(
      Event.PlaybackState,
      ({ state }) => setIsPlaying(state === State.Playing)
    );

    return () => subscription.remove();
  }, [track]);

  const togglePlayback = async () => {
    const currentTrack = await TrackPlayer.getCurrentTrack();
    if (currentTrack !== null) {
      if (isPlaying) {
        await TrackPlayer.pause();
      } else {
        await TrackPlayer.play();
      }
    }
  };

  const handleSeek = async (value: number) => {
    await TrackPlayer.seekTo(value);
    setPosition(value);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{track.title}</Text>
      <Text style={styles.artist}>{track.artist}</Text>

      <TouchableOpacity onPress={togglePlayback} style={styles.playButton}>
        <Text style={styles.playButtonText}>
          {isPlaying ? '⏸️' : '▶️'}
        </Text>
      </TouchableOpacity>

      <Slider
        style={styles.slider}
        value={position}
        minimumValue={0}
        maximumValue={duration}
        onValueChange={handleSeek}
        minimumTrackTintColor="#007AFF"
        maximumTrackTintColor="#CCCCCC"
      />
    </View>
  );
};
```

## 🔧 Кастомные хуки

### Хук для работы с API

```typescript
// src/hooks/useTracks.ts
import { useState, useEffect } from 'react';
import { Track } from '@/types/track';

export const useTracks = (genre?: string) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/tracks${genre ? `?genre=${genre}` : ''}`);
        const data = await response.json();
        setTracks(data.tracks);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tracks');
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, [genre]);

  return { tracks, loading, error };
};
```

### Хук для Web3 операций

```typescript
// src/hooks/useWeb3.ts
import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export const useWeb3 = () => {
  const { connected, publicKey, signTransaction } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (connected && publicKey) {
      fetchBalance();
    }
  }, [connected, publicKey]);

  const fetchBalance = async () => {
    if (!publicKey) return;

    try {
      const response = await fetch(`/api/wallet/balance/${publicKey.toString()}`);
      const data = await response.json();
      setBalance(data.balance);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  const sendTransaction = async (to: string, amount: number) => {
    if (!signTransaction) throw new Error('Wallet not connected');

    try {
      const response = await fetch('/api/transactions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, amount })
      });

      const { transaction } = await response.json();
      const signedTransaction = await signTransaction(transaction);

      // Отправка транзакции
      return await sendSignedTransaction(signedTransaction);
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  };

  return {
    connected,
    publicKey,
    balance,
    sendTransaction
  };
};
```

## 🌐 Полноценное приложение пример

### Структура мини-приложения

```
examples/mini-app/
├── components/
│   ├── App.tsx              # Главный компонент
│   ├── TrackList.tsx        # Список треков
│   ├── MusicPlayer.tsx      # Плеер
│   └── Search.tsx           # Поиск
├── hooks/
│   ├── useTracks.ts         # Хук для треков
│   └── useWeb3.ts           # Хук для Web3
├── utils/
│   └── api.ts               # API утилиты
└── types/
    └── index.ts             # TypeScript типы
```

### Пример мини-приложения

```tsx
// examples/mini-app/components/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TrackList from './TrackList';
import MusicPlayer from './MusicPlayer';
import Search from './Search';
import { WalletProvider } from './WalletProvider';

function App() {
  return (
    <WalletProvider>
      <Router>
        <div className="app">
          <header className="app-header">
            <h1>NORMAL DANCE Mini App</h1>
          </header>

          <main className="app-main">
            <Routes>
              <Route path="/" element={<TrackList />} />
              <Route path="/player/:trackId" element={<MusicPlayer />} />
              <Route path="/search" element={<Search />} />
            </Routes>
          </main>
        </div>
      </Router>
    </WalletProvider>
  );
}

export default App;
```

## 🧪 Тестирование примеров

### Тесты для компонентов

```typescript
// src/examples/__tests__/TrackCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TrackCard } from '../TrackCard';

const mockTrack: Track = {
  id: '1',
  title: 'Test Track',
  artist: 'Test Artist',
  duration: 180,
  genre: 'Electronic',
  cover_url: 'https://example.com/cover.jpg'
};

describe('TrackCard', () => {
  it('renders track information', () => {
    render(
      <TrackCard
        track={mockTrack}
        onPlay={jest.fn()}
        onPurchase={jest.fn()}
      />
    );

    expect(screen.getByText('Test Track')).toBeInTheDocument();
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
  });

  it('calls onPlay when play button is clicked', () => {
    const onPlay = jest.fn();
    render(
      <TrackCard
        track={mockTrack}
        onPlay={onPlay}
        onPurchase={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /play/i }));
    expect(onPlay).toHaveBeenCalledWith('1');
  });
});
```

## 🚀 Деплой примеров

### Локальный запуск примеров

```bash
# Установка зависимостей примеров
cd examples/mini-app
npm install

# Запуск примера
npm run dev

# Сборка для продакшна
npm run build
```

### Деплой в Vercel

```bash
# Установка Vercel CLI
npm install -g vercel

# Деплой примера
cd examples/mini-app
vercel --prod
```

## 📚 Дополнительные ресурсы

- [Storybook компонентов](./storybook-static/index.html)
- [Интерактивная демонстрация](https://demo.normaldance.com)
- [Видео туториалы](./docs/tutorials/)
- [Сообщество разработчиков](https://discord.gg/normaldance)

---

*Эти примеры демонстрируют основные возможности платформы. Для более сложных интеграций обратитесь к полной документации API.*
