'use client'

import { useState, useEffect } from 'react'
import useNetworkStatus from '@/hooks/useNetworkStatus'

// Качество изображений
export enum ImageQuality {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  ORIGINAL = 'original'
}

// Настройки оптимизации изображений
export interface ImageOptimizationSettings {
  defaultQuality: ImageQuality;
  useLazyLoading: boolean;
  placeholderColor: string;
  cacheSize: number;
  preloadThreshold: number; // в пикселях, для определения когда начинать предзагрузку
  lowQualityWidth: number;
  mediumQualityWidth: number;
  highQualityWidth: number;
}

// Значения по умолчанию
const DEFAULT_SETTINGS: ImageOptimizationSettings = {
  defaultQuality: ImageQuality.MEDIUM,
  useLazyLoading: true,
  placeholderColor: '#f0f0f0',
  cacheSize: 50,
  preloadThreshold: 300,
  lowQualityWidth: 100,
  mediumQualityWidth: 300,
  highQualityWidth: 600
}

/**
 * Определяет оптимальные настройки изображения на основе сетевого подключения и типа устройства
 */
export function getOptimalImageSettings(
  effectiveType: string,
  isMobile: boolean,
  saveData: boolean
): Partial<ImageOptimizationSettings> {
  // Для режима экономии трафика или медленного соединения
  if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g') {
    return {
      defaultQuality: ImageQuality.LOW,
      useLazyLoading: true,
      preloadThreshold: 100
    }
  }

  // Для мобильных устройств с нормальным соединением
  if (isMobile && (effectiveType === '3g' || effectiveType === '4g')) {
    return {
      defaultQuality: ImageQuality.MEDIUM,
      useLazyLoading: true,
      preloadThreshold: 200
    }
  }

  // Для десктопов с хорошим соединением
  return {
    defaultQuality: ImageQuality.HIGH,
    useLazyLoading: true,
    preloadThreshold: 300
  }
}

/**
 * Класс для оптимизации изображений
 */
export class ImageOptimizer {
  private settings: ImageOptimizationSettings
  private imageCache: Map<string, HTMLImageElement>
  private observer: IntersectionObserver | null = null

  constructor(settings?: Partial<ImageOptimizationSettings>) {
    this.settings = { ...DEFAULT_SETTINGS, ...settings }
    this.imageCache = new Map()
    
    // Создаем IntersectionObserver для ленивой загрузки
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        this.handleIntersection.bind(this),
        {
          rootMargin: `${this.settings.preloadThreshold}px`,
          threshold: 0.1
        }
      )
    }
  }

  /**
   * Обработчик пересечения для ленивой загрузки
   */
  private handleIntersection(entries: IntersectionObserverEntry[], observer: IntersectionObserver) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target as HTMLImageElement
        const dataSrc = target.getAttribute('data-src')
        
        if (dataSrc) {
          // Загружаем изображение
          this.loadImage(dataSrc).then(img => {
            target.src = img.src
            target.classList.add('loaded')
            observer.unobserve(target)
          })
        }
      }
    })
  }

  /**
   * Загружает изображение и кэширует его
   */
  private async loadImage(src: string): Promise<HTMLImageElement> {
    // Проверяем кэш
    if (this.imageCache.has(src)) {
      return this.imageCache.get(src)!
    }

    // Загружаем изображение
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        // Добавляем в кэш
        this.addToCache(src, img)
        resolve(img)
      }
      img.onerror = reject
      img.src = src
    })
  }

  /**
   * Добавляет изображение в кэш
   */
  private addToCache(key: string, img: HTMLImageElement) {
    // Если кэш переполнен, удаляем самый старый элемент
    if (this.imageCache.size >= this.settings.cacheSize) {
      const firstKey = this.imageCache.keys().next().value
      this.imageCache.delete(firstKey)
    }
    
    this.imageCache.set(key, img)
  }

  /**
   * Наблюдает за элементом для ленивой загрузки
   */
  public observe(element: HTMLImageElement) {
    if (this.observer && this.settings.useLazyLoading) {
      this.observer.observe(element)
    }
  }

  /**
   * Прекращает наблюдение за элементом
   */
  public unobserve(element: HTMLImageElement) {
    if (this.observer) {
      this.observer.unobserve(element)
    }
  }

  /**
   * Получает оптимизированный URL изображения
   */
  public getOptimizedImageUrl(originalUrl: string, quality: ImageQuality = this.settings.defaultQuality): string {
    if (!originalUrl) return originalUrl
    
    // Если это уже оптимизированное изображение или внешний URL, возвращаем как есть
    if (originalUrl.includes('_low.') || originalUrl.includes('_medium.') || 
        originalUrl.includes('_high.') || originalUrl.startsWith('http')) {
      return originalUrl
    }
    
    // Разбиваем URL на части
    const parts = originalUrl.split('.')
    const extension = parts.pop()
    const basePath = parts.join('.')
    
    // Возвращаем URL с нужным качеством
    switch (quality) {
      case ImageQuality.LOW:
        return `${basePath}_low.${extension}`
      case ImageQuality.MEDIUM:
        return `${basePath}_medium.${extension}`
      case ImageQuality.HIGH:
        return `${basePath}_high.${extension}`
      default:
        return originalUrl
    }
  }

  /**
   * Предзагружает изображение
   */
  public preloadImage(url: string, quality: ImageQuality = this.settings.defaultQuality) {
    const optimizedUrl = this.getOptimizedImageUrl(url, quality)
    this.loadImage(optimizedUrl)
  }
}

/**
 * Хук для использования оптимизатора изображений
 */
export function useImageOptimizer(settings?: Partial<ImageOptimizationSettings>) {
  const { effectiveType, isMobile, saveData } = useNetworkStatus()
  const [optimizer, setOptimizer] = useState<ImageOptimizer | null>(null)
  
  useEffect(() => {
    // Определяем оптимальные настройки на основе сети и устройства
    const optimalSettings = getOptimalImageSettings(effectiveType, isMobile, saveData)
    
    // Создаем оптимизатор с объединенными настройками
    setOptimizer(new ImageOptimizer({
      ...optimalSettings,
      ...settings
    }))
  }, [effectiveType, isMobile, saveData, settings])
  
  return optimizer
}

/**
 * Компонент для оптимизированного изображения
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  quality,
  className,
  style,
  ...props
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: ImageQuality;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}) {
  const { effectiveType, isMobile, saveData } = useNetworkStatus()
  const imageOptimizer = useImageOptimizer()
  const [imageSrc, setImageSrc] = useState<string>('')
  const [isLoaded, setIsLoaded] = useState(false)
  const imgRef = useState<HTMLImageElement | null>(null)[1]
  
  useEffect(() => {
    if (!imageOptimizer || !src) return
    
    // Определяем качество изображения
    let imageQuality = quality
    
    if (!imageQuality) {
      // Автоматически определяем качество на основе сети
      if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g') {
        imageQuality = ImageQuality.LOW
      } else if (isMobile && (effectiveType === '3g')) {
        imageQuality = ImageQuality.MEDIUM
      } else {
        imageQuality = ImageQuality.HIGH
      }
    }
    
    // Получаем оптимизированный URL
    const optimizedSrc = imageOptimizer.getOptimizedImageUrl(src, imageQuality)
    setImageSrc(optimizedSrc)
  }, [src, quality, imageOptimizer, effectiveType, isMobile, saveData])
  
  // Обработчик загрузки изображения
  const handleLoad = () => {
    setIsLoaded(true)
  }
  
  // Обработчик ошибки загрузки
  const handleError = () => {
    // Если не удалось загрузить оптимизированное изображение, пробуем оригинал
    if (imageSrc !== src) {
      setImageSrc(src)
    }
  }
  
  // Обработчик ссылки на изображение
  const handleRef = (el: HTMLImageElement) => {
    imgRef(el)
    
    if (el && imageOptimizer) {
      imageOptimizer.observe(el)
    }
  }
  
  // Возвращаем объект с параметрами для img
  return {
    ref: handleRef,
    src: imageSrc || src,
    alt: alt,
    width: width,
    height: height,
    className: `${className || ''} ${isLoaded ? 'loaded' : 'loading'}`,
    style: {
        ...style,
        opacity: isLoaded ? 1 : 0.5,
        transition: 'opacity 0.3s ease'
      },
      onLoad: handleLoad,
      onError: handleError,
      loading: "lazy",
      ...props
    }
}