import useNetworkStatus from '@/hooks/useNetworkStatus';

// Типы качества аудио
export enum AudioQuality {
  LOW = 'low',      // 64kbps, для медленных соединений
  MEDIUM = 'medium', // 128kbps, для средних соединений
  HIGH = 'high',    // 256kbps, для хороших соединений
  LOSSLESS = 'lossless' // Без потерь, для отличных соединений
}

// Интерфейс для настроек оптимизации
export interface AudioOptimizationSettings {
  preloadStrategy: 'none' | 'metadata' | 'auto';
  quality: AudioQuality;
  useLazyLoading: boolean;
  useProgressiveLoading: boolean;
  maxCacheSize: number; // в МБ
}

// Функция для определения оптимальных настроек аудио на основе типа сети и устройства
export function getOptimalAudioSettings(): AudioOptimizationSettings {
  const { effectiveType, isMobile, saveData } = useNetworkStatus();
  
  // Настройки по умолчанию
  const defaultSettings: AudioOptimizationSettings = {
    preloadStrategy: 'metadata',
    quality: AudioQuality.HIGH,
    useLazyLoading: false,
    useProgressiveLoading: false,
    maxCacheSize: 100
  };
  
  // Если включен режим экономии данных
  if (saveData) {
    return {
      preloadStrategy: 'none',
      quality: AudioQuality.LOW,
      useLazyLoading: true,
      useProgressiveLoading: true,
      maxCacheSize: 20
    };
  }
  
  // Настройки в зависимости от типа сети
  if (effectiveType === 'slow-2g' || effectiveType === '2g') {
    return {
      preloadStrategy: 'none',
      quality: AudioQuality.LOW,
      useLazyLoading: true,
      useProgressiveLoading: true,
      maxCacheSize: 10
    };
  }
  
  if (effectiveType === '3g') {
    return {
      preloadStrategy: 'metadata',
      quality: isMobile ? AudioQuality.LOW : AudioQuality.MEDIUM,
      useLazyLoading: isMobile,
      useProgressiveLoading: isMobile,
      maxCacheSize: isMobile ? 30 : 50
    };
  }
  
  // Для 4G и лучше
  return {
    preloadStrategy: isMobile ? 'metadata' : 'auto',
    quality: isMobile ? AudioQuality.MEDIUM : AudioQuality.HIGH,
    useLazyLoading: isMobile,
    useProgressiveLoading: false,
    maxCacheSize: isMobile ? 50 : 100
  };
}

// Класс для оптимизации загрузки аудио
export class MobileAudioOptimizer {
  private settings: AudioOptimizationSettings;
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private totalCacheSize: number = 0;
  
  constructor(settings?: Partial<AudioOptimizationSettings>) {
    // Используем переданные настройки или получаем оптимальные
    this.settings = {
      ...getOptimalAudioSettings(),
      ...settings
    };
  }
  
  // Оптимизация элемента аудио
  public optimizeAudioElement(audio: HTMLAudioElement, src: string): void {
    // Устанавливаем атрибут предзагрузки
    audio.preload = this.settings.preloadStrategy;
    
    // Если используем ленивую загрузку, загружаем аудио только при необходимости
    if (this.settings.useLazyLoading) {
      audio.src = '';
      
      // Загружаем аудио только когда пользователь взаимодействует с плеером
      const loadAudio = () => {
        audio.src = this.getOptimizedAudioUrl(src);
        audio.load();
        
        // Удаляем обработчики после загрузки
        audio.removeEventListener('play', loadAudio);
      };
      
      audio.addEventListener('play', loadAudio, { once: true });
    } else {
      audio.src = this.getOptimizedAudioUrl(src);
    }
    
    // Добавляем в кэш, если не используем ленивую загрузку
    if (!this.settings.useLazyLoading) {
      this.addToCache(src, audio);
    }
  }
  
  // Получение оптимизированного URL аудио в зависимости от качества
  private getOptimizedAudioUrl(originalUrl: string): string {
    // Здесь можно добавить логику для выбора разных версий аудио файла
    // в зависимости от настроек качества
    
    // Пример: добавляем параметр качества к URL
    const separator = originalUrl.includes('?') ? '&' : '?';
    return `${originalUrl}${separator}quality=${this.settings.quality}`;
  }
  
  // Добавление аудио в кэш
  private addToCache(key: string, audio: HTMLAudioElement): void {
    // Если кэш превышает максимальный размер, удаляем старые элементы
    if (this.totalCacheSize >= this.settings.maxCacheSize) {
      this.cleanCache();
    }
    
    this.audioCache.set(key, audio);
    this.totalCacheSize += 1; // Упрощенно считаем размер кэша по количеству элементов
  }
  
  // Очистка кэша
  private cleanCache(): void {
    // Удаляем самые старые элементы из кэша
    const keysToRemove = Array.from(this.audioCache.keys()).slice(0, 5);
    keysToRemove.forEach(key => {
      this.audioCache.delete(key);
      this.totalCacheSize -= 1;
    });
  }
  
  // Получение аудио из кэша
  public getFromCache(key: string): HTMLAudioElement | undefined {
    return this.audioCache.get(key);
  }
  
  // Очистка всего кэша
  public clearCache(): void {
    this.audioCache.clear();
    this.totalCacheSize = 0;
  }
  
  // Обновление настроек
  public updateSettings(settings: Partial<AudioOptimizationSettings>): void {
    this.settings = {
      ...this.settings,
      ...settings
    };
  }

  // Предварительная загрузка следующего трека
  preloadNextTrack(nextTrackUrl: string): void {
    if (!this.settings.useLazyLoading && nextTrackUrl) {
      const audio = new Audio();
      audio.preload = 'metadata'; // Загружаем только метаданные
      audio.src = this.getOptimizedAudioUrl(nextTrackUrl);
      
      // Добавляем в кэш
      this.addToCache(`preload_${nextTrackUrl}`, audio);
    }
  }
}

// Хук для использования оптимизатора аудио
export function useMobileAudioOptimizer(settings?: Partial<AudioOptimizationSettings>) {
  const [optimizer] = useState(() => new MobileAudioOptimizer(settings));
  
  return optimizer;
}