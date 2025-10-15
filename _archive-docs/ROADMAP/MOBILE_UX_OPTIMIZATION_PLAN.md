# План оптимизации мобильного UX

## Обзор

В этом документе описывается план оптимизации пользовательского интерфейса и взаимодействия на мобильных устройствах проекта NormalDance. Это улучшение имеет средний приоритет для Q2-Q3 2025 года, так как улучшает пользовательский опыт на мобильных устройствах и увеличивает мобильный трафик.

## Текущая ситуация

### Существующий мобильный UX

- Адаптивный дизайн на базе Tailwind CSS
- Ограниченная оптимизация для мобильных устройств
- Проблемы с производительностью на мобильных устройствах
- Недостаточная адаптация элементов управления

### Проблемы текущей реализации

- Медленная загрузка на мобильных устройствах
- Неудобные элементы управления
- Проблемы с воспроизведением аудио
- Ограниченная навигация

## Цели реализации

### Основные цели

- Оптимизация интерфейса для мобильных устройств
- Улучшение производительности на мобильных устройствах
- Реализация адаптивных элементов управления
- Улучшение навигации

### Технические цели

- Адаптация под различные размеры экранов
- Оптимизация загрузки контента
- Улучшение UX воспроизведения
- Адаптация Web3-взаимодействий

## План реализации

### Этап 1: Анализ и аудит (Неделя 1-2)

- Аудит текущего мобильного UX
- Анализ пользовательского поведения
- Тестирование на различных устройствах
- Подготовка рекомендаций

### Этап 2: Дизайн и прототипирование (Неделя 3-4)

- Создание мобильных макетов
- Прототипирование ключевых сценариев
- Тестирование прототипов
- Утверждение дизайна

### Этап 3: Разработка (Неделя 5-8)

- Адаптация основных компонентов
- Оптимизация производительности
- Реализация мобильных элементов управления
- Тестирование UX

### Этап 4: Тестирование (Неделя 9)

- Тестирование на реальных устройствах
- A/B тестирование UX
- Тестирование производительности
- Исправление выявленных проблем

### Этап 5: Внедрение (Неделя 10)

- Постепенное внедрение изменений
- Мониторинг после внедрения
- Обновление документации

## Технические детали

### Адаптивная верстка

#### Основные компоненты для мобильных устройств

```tsx
// src/components/Mobile/MobilePlayer.tsx
import { useState, useEffect } from "react";
import { useAudioStore } from "@/store/use-audio-store";
import { formatTime } from "@/lib/utils";

const MobilePlayer = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    playPause,
    setProgress,
  } = useAudioStore();
  const [progress, setLocalProgress] = useState(0);

  useEffect(() => {
    if (duration > 0) {
      setLocalProgress((currentTime / duration) * 10);
    }
  }, [currentTime, duration]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseInt(e.target.value);
    setProgress((newProgress / 100) * duration);
  };

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 p-4 md:hidden">
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium truncate">
            {currentTrack.title}
          </h3>
          <p className="text-gray-400 text-sm truncate">
            {currentTrack.artist}
          </p>
        </div>
        <div className="flex items-center space-x-3 ml-4">
          <button className="text-gray-400 hover:text-white">
            <HeartIcon className="w-5 h-5" />
          </button>
          <button
            onClick={playPause}
            className="bg-purple-600 hover:bg-purple-700 rounded-full p-2"
          >
            {isPlaying ? (
              <PauseIcon className="w-5 h-5 text-white" />
            ) : (
              <PlayIcon className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-400 w-10">
          {formatTime(currentTime)}
        </span>
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={handleSeek}
          className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-xs text-gray-400 w-10">
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
};

// Мобильное меню навигации
const MobileNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden fixed bottom-16 left-0 right-0 bg-gray-900 border-t border-gray-700 z-50">
      <div className="flex justify-around py-2">
        {[
          { name: "Главная", icon: HomeIcon, href: "/" },
          { name: "Треки", icon: MusicNoteIcon, href: "/tracks" },
          { name: "NFT", icon: CollectionIcon, href: "/nft" },
          { name: "Профиль", icon: UserIcon, href: "/profile" },
        ].map((item) => (
          <a
            key={item.name}
            href={item.href}
            className="flex flex-col items-center p-2 text-gray-400 hover:text-white"
          >
            <item.icon className="w-6 h-6" />
            <span className="text-xs mt-1">{item.name}</span>
          </a>
        ))}
      </div>
    </div>
  );
};
```

#### Адаптация основных страниц

```tsx
// src/app/mobile/tracks/page.tsx
"use client";

import { useState, useEffect } from "react";
import { TrackCard } from "@/components/TrackCard";
import { MobileSearch } from "@/components/Mobile/MobileSearch";
import { MobileFilter } from "@/components/Mobile/MobileFilter";

const MobileTracksPage = () => {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    genre: "",
    duration: "",
    sortBy: "newest",
  });

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const response = await fetch(
          `/api/tracks?${new URLSearchParams({
            ...filters,
            limit: "20",
          })}`
        );
        const data = await response.json();
        setTracks(data.tracks);
      } catch (error) {
        console.error("Error fetching tracks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, [filters]);

  return (
    <div className="pb-24">
      {" "}
      {/* Отступ для фиксированного плеера */}
      <div className="p-4">
        <MobileSearch onSearch={(query) => setFilters({ ...filters, query })} />
        <MobileFilter filters={filters} onChange={setFilters} />
      </div>
      <div className="px-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : tracks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Треки не найдены</div>
        ) : (
          tracks.map((track) => <TrackCard key={track.id} track={track} />)
        )}
      </div>
    </div>
  );
};

export default MobileTracksPage;
```

### Оптимизация производительности

#### Lazy-загрузка компонентов

```tsx
// src/components/Mobile/LazyTrackList.tsx
import { useState, useEffect, useCallback } from "react";
import { TrackCard } from "@/components/TrackCard";

interface LazyTrackListProps {
  fetchTracks: (page: number) => Promise<any[]>;
  initialTracks: any[];
}

const LazyTrackList = ({ fetchTracks, initialTracks }: LazyTrackListProps) => {
  const [tracks, setTracks] = useState(initialTracks);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const newTracks = await fetchTracks(page + 1);
      if (newTracks.length === 0) {
        setHasMore(false);
      } else {
        setTracks((prev) => [...prev, ...newTracks]);
        setPage((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error loading more tracks:", error);
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore, fetchTracks]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 500
      ) {
        loadMore();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadMore]);

  return (
    <div>
      {tracks.map((track) => (
        <TrackCard key={track.id} track={track} />
      ))}

      {loading && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
        </div>
      )}
    </div>
  );
};
```

#### Оптимизация изображений

```tsx
// src/components/Mobile/OptimizedImage.tsx
import { useState } from "react";
import Image from "next/image";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

const OptimizedImage = ({
  src,
  alt,
  width = 300,
  height = 300,
  className = "",
  priority = false,
}: OptimizedImageProps) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div
      className={`relative overflow-hidden ${
        isLoading ? "bg-gray-800" : ""
      } ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        onLoadingComplete={() => setIsLoading(false)}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,..."
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      )}
    </div>
  );
};
```

### Адаптация Web3-взаимодействий

#### Мобильный кошелек

```tsx
// src/components/Mobile/MobileWallet.tsx
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const MobileWallet = () => {
  const { connected, publicKey, disconnect } = useWallet();
  const [showMenu, setShowMenu] = useState(false);

  if (!connected) {
    return (
      <div className="fixed top-4 right-4 z-50 md:hidden">
        <WalletMultiButton className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full text-sm" />
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50 md:hidden">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="bg-gray-800 text-white px-3 py-2 rounded-full text-sm flex items-center"
      >
        <span className="truncate max-w-[10px] mr-1">
          {publicKey?.toBase58().slice(0, 4)}...
          {publicKey?.toBase58().slice(-4)}
        </span>
        <ChevronDownIcon className="w-4 h-4" />
      </button>

      {showMenu && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1">
          <button
            onClick={disconnect}
            className="block px-4 py-2 text-sm text-white hover:bg-gray-700 w-full text-left"
          >
            Отключить кошелек
          </button>
        </div>
      )}
    </div>
  );
};
```

### Улучшенная навигация

#### Адаптивная панель навигации

```tsx
// src/components/Mobile/AdaptiveNavigation.tsx
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const AdaptiveNavigation = () => {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { name: "Главная", href: "/", icon: HomeIcon },
    { name: "Музыка", href: "/tracks", icon: MusicNoteIcon },
    { name: "NFT", href: "/nft", icon: CollectionIcon },
    { name: "Артисты", href: "/artists", icon: UserGroupIcon },
    { name: "Профиль", href: "/profile", icon: UserIcon },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-30 ${
        isScrolled
          ? "bg-gray-900/90 backdrop-blur-sm border-b border-gray-700"
          : "bg-transparent"
      } md:hidden`}
    >
      <div className="flex justify-between items-center px-4 py-3">
        <div className="text-xl font-bold text-white">NormalDance</div>

        <div className="flex space-x-1">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className={`p-2 rounded-lg ${
                pathname === item.href
                  ? "bg-purple-600 text-white"
                  : "text-gray-30 hover:bg-gray-800"
              }`}
            >
              <item.icon className="w-5 h-5" />
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
};
```

### Оптимизация для тач-устройств

#### Улучшенные элементы управления

```tsx
// src/components/Mobile/TouchControls.tsx
import { useState, useRef } from "react";

// Улучшенный слайдер для мобильных устройств
const TouchSlider = ({ value, onChange, min = 0, max = 100, step = 1 }) => {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const calculateValue = (clientX: number) => {
    if (!sliderRef.current) return value;

    const rect = sliderRef.current.getBoundingClientRect();
    const position = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    const percentage = position / rect.width;
    const newValue = Math.round(percentage * (max - min) + min);

    return Math.min(Math.max(newValue, min), max);
  };

  const handleStart = (clientX: number) => {
    setIsDragging(true);
    onChange(calculateValue(clientX));
  };

  const handleMove = (clientX: number) => {
    if (isDragging) {
      onChange(calculateValue(clientX));
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  // Обработчики для мыши
  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX);
  };

  // Обработчики для тача
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
    e.preventDefault(); // Предотвращаем скролл во время перетаскивания
  };

  const percentage = ((value - min) / (max - min)) * 10;

  return (
    <div
      ref={sliderRef}
      className="relative w-full h-2 bg-gray-600 rounded-full cursor-pointer"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleEnd}
    >
      <div
        className="absolute top-0 left-0 h-full bg-purple-600 rounded-full"
        style={{ width: `${percentage}%` }}
      >
        <div
          className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md"
          style={{
            transform: "translate(50%, -50%)",
            right: `${100 - percentage}%`,
          }}
        />
      </div>
    </div>
  );
};
```

## Риски и меры по их снижению

### Риск 1: Проблемы с производительностью

- **Мера**: Оптимизация рендеринга
- **Мера**: Использование виртуального скролла

### Риск 2: Несовместимость с различными устройствами

- **Мера**: Тестирование на различных устройствах
- **Мера**: Адаптивная верстка

### Риск 3: Ухудшение UX для десктопных пользователей

- **Мера**: Условная загрузка мобильных компонентов
- **Мера**: Сохранение десктопного UX

## Критерии успеха

- Улучшенный мобильный UX
- Быстрая загрузка на мобильных устройствах
- Удобные элементы управления
- Удовлетворенность пользователей
- Увеличение мобильного трафика

## Ресурсы

- 2-3 разработчика на 10 недель
- UI/UX-дизайнер для адаптации интерфейса
- QA-инженер для тестирования

## Сроки

- Начало: 1 июля 2025
- Завершение: 5 сентября 2025
- Общее время: 10 недель
