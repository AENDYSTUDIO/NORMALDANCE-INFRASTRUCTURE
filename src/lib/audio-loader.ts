/**
 * Оптимизированный загрузчик аудиофайлов для NormalDance
 * Поддержка стриминга, кеширования, адаптивного качества и предзагрузки
 */

import { audioCache } from './cache-manager'

interface AudioQuality {
  bitrate: number
  sampleRate: number
  channels: number
  format: 'mp3' | 'ogg' | 'webm' | 'aac'
}

interface AudioQualityProfile {
  name: 'low' | 'medium' | 'high'
  quality: AudioQuality
  maxSize: number // Максимальный размер файла в байтах
}

interface LoadAudioOptions {
  quality?: 'low' | 'medium' | 'high'
  preload?: boolean
  stream?: boolean
  onProgress?: (progress: number) => void
  onError?: (error: Error) => void
  onSuccess?: (audioBuffer: AudioBuffer) => void
}

interface NetworkRequest {
  url: string
  controller: AbortController
  startTime: number
  progress: number
}

// Профили качества аудио
const QUALITY_PROFILES: Record<string, AudioQualityProfile> = {
  low: {
    name: 'low',
    quality: {
      bitrate: 128,
      sampleRate: 22050,
      channels: 1,
      format: 'mp3'
    },
    maxSize: 1024 * 1024 * 2 // 2MB
  },
  medium: {
    name: 'medium',
    quality: {
      bitrate: 192,
      sampleRate: 44100,
      channels: 2,
      format: 'mp3'
    },
    maxSize: 1024 * 1024 * 5 // 5MB
  },
  high: {
    name: 'high',
    quality: {
      bitrate: 320,
      sampleRate: 48000,
      channels: 2,
      format: 'flac'
    },
    maxSize: 1024 * 1024 * 10 // 10MB
  }
}

// Сетевые запросы в процессе
const activeRequests = new Map<string, NetworkRequest>()

class AudioLoader {
  private audioContext: AudioContext | null = null
  private isInitialized = false
  private downloadQueue: Array<{
    url: string
    options: LoadAudioOptions
    resolve: (value: AudioBuffer) => void
    reject: (reason?: unknown) => void
  }> = []
  private isProcessingQueue = false

  /**
   * Инициализация AudioContext
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.isInitialized = true
      console.log('AudioLoader initialized')
    } catch (error) {
      console.error('Failed to initialize AudioContext:', error)
      throw new Error('Audio context not supported')
    }
  }

  /**
   * Определение оптимального качества аудио на основе устройства и сети
   */
  private detectOptimalQuality(): 'low' | 'medium' | 'high' {
    // Проверка соединения
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      if (connection) {
        if (connection.saveData || connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          return 'low'
        }
        if (connection.effectiveType === '3g') {
          return 'medium'
        }
      }
    }

    // Проверка производительности устройства
    if ('hardwareConcurrency' in navigator) {
      const cores = navigator.hardwareConcurrency || 4
      if (cores <= 2) {
        return 'medium'
      }
    }

    // Проверка доступной памяти
    if ('deviceMemory' in navigator) {
      const memory = (navigator as any).deviceMemory || 4
      if (memory <= 2) {
        return 'medium'
      }
    }

    return 'high'
  }

  /**
   * Загрузка аудиофайла
   */
  async loadAudio(url: string, options: LoadAudioOptions = {}): Promise<AudioBuffer> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    const quality = options.quality || this.detectOptimalQuality()
    const cacheKey = `audio:${url}:${quality}`

    // Проверка кеша
    const cachedAudio = await audioCache.getCachedAudio(url, quality)
    if (cachedAudio) {
      console.log(`Audio loaded from cache: ${url}`)
      if (options.onSuccess) {
        options.onSuccess(this.arrayBufferToAudioBuffer(cachedAudio))
      }
      return this.arrayBufferToAudioBuffer(cachedAudio)
    }

    // Проверка активных запросов
    if (activeRequests.has(url)) {
      const existingRequest = activeRequests.get(url)!
      return new Promise((resolve, reject) => {
        // Добавляем в очередь ожидания
        existingRequest.controller.signal.addEventListener('abort', () => {
          reject(new Error('Request aborted'))
        })
      })
    }

    // Создаем новый запрос
    const controller = new AbortController()
    const request: NetworkRequest = {
      url,
      controller,
      startTime: Date.now(),
      progress: 0
    }

    activeRequests.set(url, request)

    try {
      const audioBuffer = await this.fetchAudio(url, quality, options, controller)
      
      // Кеширование результата
      await audioCache.cacheAudio(url, audioBuffer, quality)
      
      if (options.onSuccess) {
        options.onSuccess(audioBuffer)
      }
      
      return audioBuffer
    } catch (error) {
      if (options.onError) {
        options.onError(error as Error)
      }
      throw error
    } finally {
      activeRequests.delete(url)
    }
  }

  /**
   * Загрузка аудиофайла с прогрессом
   */
  private async fetchAudio(
    url: string,
    quality: 'low' | 'medium' | 'high',
    options: LoadAudioOptions,
    controller: AbortController
  ): Promise<AudioBuffer> {
    const profile = QUALITY_PROFILES[quality]
    
    // Создаем URL с параметрами качества
    const qualityUrl = this.addQualityParams(url, profile)

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      
      xhr.open('GET', qualityUrl, true)
      xhr.responseType = 'arraybuffer'
      
      // Обработка прогресса загрузки
      xhr.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100
          request.progress = progress
          
          if (options.onProgress) {
            options.onProgress(progress)
          }
        }
      }
      
      // Обработка успешной загрузки
      xhr.onload = async () => {
        if (xhr.status === 200) {
          try {
            const audioBuffer = await this.arrayBufferToAudioBuffer(xhr.response)
            resolve(audioBuffer)
          } catch (error) {
            reject(new Error(`Failed to decode audio: ${error}`))
          }
        } else {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`))
        }
      }
      
      // Обработка ошибок
      xhr.onerror = () => {
        reject(new Error('Network error occurred'))
      }
      
      xhr.onabort = () => {
        reject(new Error('Request aborted'))
      }
      
      // Отправка запроса
      xhr.send()
      
      // Сохраняем контроллер для отмены
      controller.signal.addEventListener('abort', () => {
        xhr.abort()
      })
    })
  }

  /**
   * Преобразование ArrayBuffer в AudioBuffer
   */
  private async arrayBufferToAudioBuffer(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
    if (!this.audioContext) {
      await this.initialize()
    }

    try {
      return await this.audioContext!.decodeAudioData(arrayBuffer)
    } catch (error) {
      throw new Error(`Failed to decode audio data: ${error}`)
    }
  }

  /**
   * Добавление параметров качества к URL
   */
  private addQualityParams(url: string, profile: AudioQualityProfile): string {
    const urlObj = new URL(url)
    urlObj.searchParams.set('quality', profile.name)
    urlObj.searchParams.set('bitrate', profile.quality.bitrate.toString())
    urlObj.searchParams.set('sampleRate', profile.quality.sampleRate.toString())
    urlObj.searchParams.set('format', profile.quality.format)
    return urlObj.toString()
  }

  /**
   * Предзагрузка аудиофайла
   */
  async preloadAudio(url: string, quality: 'low' | 'medium' | 'high' = 'low'): Promise<void> {
    try {
      await this.loadAudio(url, { quality, preload: true })
      console.log(`Audio preloaded: ${url}`)
    } catch (error) {
      console.warn(`Failed to preload audio: ${url}`, error)
    }
  }

  /**
   * Отмена загрузки аудиофайла
   */
  cancelAudioLoad(url: string): void {
    const request = activeRequests.get(url)
    if (request) {
      request.controller.abort()
      activeRequests.delete(url)
    }
  }

  /**
   * Отмена всех загрузок
   */
  cancelAllLoads(): void {
    for (const [url, request] of activeRequests) {
      request.controller.abort()
    }
    activeRequests.clear()
  }

  /**
   * Получение статистики загрузки
   */
  getLoadStats() {
    return {
      activeRequests: activeRequests.size,
      totalLoaded: audioCache.getStats().hits,
      cacheHitRate: audioCache.getStats().hitRate,
      cacheSize: audioCache.getStats().currentSize
    }
  }

  /**
   * Очистка кеша
   */
  async clearCache(): Promise<void> {
    await audioCache.clear()
  }

  /**
   * Адаптивная загрузка с изменением качества
   */
  async loadAdaptiveAudio(
    url: string,
    initialQuality: 'low' | 'medium' | 'high' = 'medium',
    options: LoadAudioOptions = {}
  ): Promise<AudioBuffer> {
    let currentQuality = initialQuality
    const lastLoadTime = 0
    let loadCount = 0

    const loadWithRetry = async (quality: 'low' | 'medium' | 'high'): Promise<AudioBuffer> => {
      try {
        const startTime = Date.now()
        const result = await this.loadAudio(url, { ...options, quality })
        
        // Анализ производительности загрузки
        const loadTime = Date.now() - startTime
        loadCount++

        // Адаптация качества на основе производительности
        if (loadTime > 5000 && quality !== 'low') {
          currentQuality = 'low'
          console.log(`Switching to low quality due to slow load: ${loadTime}ms`)
        } else if (loadTime < 2000 && quality !== 'high') {
          currentQuality = 'high'
          console.log(`Switching to high quality due to fast load: ${loadTime}ms`)
        }

        return result
      } catch (error) {
        // Падение качества при ошибке
        if (quality !== 'low') {
          console.log(`Retrying with lower quality due to error: ${error}`)
          return loadWithRetry(quality === 'high' ? 'medium' : 'low')
        }
        throw error
      }
    }

    return loadWithRetry(currentQuality)
  }

  /**
   * Пакетная загрузка аудиофайлов
   */
  async loadMultipleAudio(
    urls: string[],
    options: LoadAudioOptions = {}
  ): Promise<AudioBuffer[]> {
    const results: AudioBuffer[] = []
    const errors: Error[] = []

    // Параллельная загрузка с ограничением одновременных запросов
    const MAX_CONCURRENT = 3
    let activeLoads = 0
    let currentIndex = 0

    const loadNext = async (): Promise<void> => {
      if (currentIndex >= urls.length) return

      const url = urls[currentIndex]
      currentIndex++
      activeLoads++

      try {
        const audioBuffer = await this.loadAudio(url, options)
        results.push(audioBuffer)
      } catch (error) {
        errors.push(error as Error)
        console.warn(`Failed to load audio: ${url}`, error)
      } finally {
        activeLoads--
        await loadNext()
      }
    }

    // Запускаем загрузки
    const promises = []
    for (let i = 0; i < Math.min(MAX_CONCURRENT, urls.length); i++) {
      promises.push(loadNext())
    }

    await Promise.all(promises)

    if (errors.length > 0) {
      console.warn(`${errors.length} errors occurred during batch loading`)
    }

    return results
  }

  /**
   * Создание стримингового источника
   */
  createStreamingSource(url: string, quality: 'low' | 'medium' | 'high' = 'medium'): Promise<AudioBuffer> {
    // В реальном приложении здесь будет реализация стриминга
    // Для примера просто загружаем файл
    return this.loadAudio(url, { quality, stream: true })
  }
}

// Глобальный экземпляр загрузчика
export const audioLoader = new AudioLoader()

// Хуки для React
export function useAudioLoader() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [loadStats, setLoadStats] = useState(audioLoader.getLoadStats())

  const initialize = async () => {
    if (!isInitialized) {
      await audioLoader.initialize()
      setIsInitialized(true)
    }
  }

  const loadAudio = async (url: string, options: LoadAudioOptions = {}) => {
    if (!isInitialized) {
      await initialize()
    }
    return audioLoader.loadAudio(url, options)
  }

  const preloadAudio = async (url: string, quality?: 'low' | 'medium' | 'high') => {
    if (!isInitialized) {
      await initialize()
    }
    return audioLoader.preloadAudio(url, quality)
  }

  const cancelAudioLoad = (url: string) => {
    audioLoader.cancelAudioLoad(url)
  }

  const clearCache = async () => {
    await audioLoader.clearCache()
    setLoadStats(audioLoader.getLoadStats())
  }

  // Обновление статистики
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadStats(audioLoader.getLoadStats())
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return {
    isInitialized,
    loadStats,
    initialize,
    loadAudio,
    preloadAudio,
    cancelAudioLoad,
    clearCache
  }
}

// Утилиты для работы с аудио
export const audioUtils = {
  /**
   * Форматирование времени аудио
   */
  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  },

  /**
   * Расчет размера аудиофайла
   */
  calculateAudioSize(duration: number, bitrate: number): number {
    // Размер в байтах = (битрейт * длительность) / 8
    return Math.round((bitrate * duration) / 8)
  },

  /**
   * Оптимизация аудио для веба
   */
  optimizeForWeb(audioBuffer: AudioBuffer, targetSampleRate: number = 44100): AudioBuffer {
    // В реальном приложении здесь будет логика оптимизации
    return audioBuffer
  },

  /**
   * Проверка поддержки аудио форматов
   */
  getSupportedFormats(): string[] {
    const audio = new Audio()
    const formats = ['mp3', 'wav', 'ogg', 'webm', 'aac']
    return formats.filter(format => audio.canPlayType(`audio/${format}`) !== '')
  }
}

export default AudioLoader