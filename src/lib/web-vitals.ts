/**
 * Сервис для сбора Core Web Vitals и кастомных метрик
 * Интеграция с Vercel Analytics и Sentry
 */

// Импорты будут добавлены динамически для избежания SSR проблем

// Интерфейс для метрик производительности
export interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number | null
  fid: number | null
  cls: number | null
  fcp: number | null
  tbt: number | null
  inp: number | null
  ttfb: number | null
  
  // Кастомные метрики
  pageLoadTime: number | null
  domInteractiveTime: number | null
  firstContentfulPaint: number | null
  largestContentfulPaint: number | null
  firstInputDelay: number | null
  cumulativeLayoutShift: number | null
  timeToFirstByte: number | null
  timeToInteractive: number | null
  
  // Контекстные данные
  url: string
  userAgent: string
  viewport: string
  connectionType: string
  deviceMemory: number
  hardwareConcurrency: number
}

// Сервис для сбора метрик
export class WebVitalsService {
  private metrics: PerformanceMetrics = {
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    tbt: null,
    inp: null,
    ttfb: null,
    pageLoadTime: null,
    domInteractiveTime: null,
    firstContentfulPaint: null,
    largestContentfulPaint: null,
    firstInputDelay: null,
    cumulativeLayoutShift: null,
    timeToFirstByte: null,
    timeToInteractive: null,
    url: '',
    userAgent: '',
    viewport: '',
    connectionType: '',
    deviceMemory: 0,
    hardwareConcurrency: 0,
  }

  private isInitialized = false

  // Инициализация сервиса
  init(): void {
    if (this.isInitialized) return

    // Получаем контекстные данные
    this.metrics.url = window.location.href
    this.metrics.userAgent = navigator.userAgent
    this.metrics.viewport = `${window.innerWidth}x${window.innerHeight}`
    this.metrics.connectionType = (navigator as any).connection?.effectiveType || 'unknown'
    this.metrics.deviceMemory = (navigator as any).deviceMemory || 0
    this.metrics.hardwareConcurrency = navigator.hardwareConcurrency || 0

    // Инициализируем сбор метрик
    this.initializeWebVitals()
    this.initializeCustomMetrics()

    this.isInitialized = true
  }

  // Инициализация Core Web Vitals
  private initializeWebVitals(): void {
    // Импортируем web-vitals динамически для избежания SSR проблем
    import('web-vitals').then(({ onCLS, onFID, onLCP, onFCP, onTTFB, onINP }) => {
      // Largest Contentful Paint
      onLCP((metric: any) => {
        this.metrics.lcp = metric.value
        this.sendToMonitoring('lcp', metric)
      })

      // First Input Delay
      onFID((metric: any) => {
        this.metrics.fid = metric.value
        this.sendToMonitoring('fid', metric)
      })

      // Cumulative Layout Shift
      onCLS((metric: any) => {
        this.metrics.cls = metric.value
        this.sendToMonitoring('cls', metric)
      })

      // First Contentful Paint
      onFCP((metric: any) => {
        this.metrics.fcp = metric.value
        this.sendToMonitoring('fcp', metric)
      })

      // Time to First Byte
      onTTFB((metric: any) => {
        this.metrics.ttfb = metric.value
        this.sendToMonitoring('ttfb', metric)
      })

      // Interaction to Next Paint
      onINP((metric: any) => {
        this.metrics.inp = metric.value
        this.sendToMonitoring('inp', metric)
      })
    })
  }

  // Инициализация кастомных метрик
  private initializeCustomMetrics(): void {
    // Page Load Time
    window.addEventListener('load', () => {
      const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigationTiming) {
        this.metrics.pageLoadTime = navigationTiming.loadEventEnd - navigationTiming.fetchStart
        this.metrics.domInteractiveTime = navigationTiming.domInteractive - navigationTiming.fetchStart
        this.metrics.firstContentfulPaint = navigationTiming.responseEnd - navigationTiming.fetchStart
        this.metrics.largestContentfulPaint = navigationTiming.loadEventEnd - navigationTiming.fetchStart
        this.metrics.timeToFirstByte = navigationTiming.responseStart - navigationTiming.fetchStart
        this.metrics.timeToInteractive = navigationTiming.domInteractive - navigationTiming.fetchStart

        this.sendCustomMetrics()
      }
    })

    // First Input Delay (альтернативный метод)
    let firstInputTimestamp: number | null = null
    const inputElements = ['button', 'input', 'select', 'textarea', 'a']
    
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      if (inputElements.includes(target.tagName.toLowerCase())) {
        firstInputTimestamp = performance.now()
      }
    }, { once: true })

    // Track user interactions
    document.addEventListener('click', (event) => {
      this.trackUserInteraction('click', event.target as HTMLElement)
    })

    document.addEventListener('submit', (event) => {
      this.trackUserInteraction('submit', event.target as HTMLElement)
    })

    // Track resource loading
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          this.trackResourceLoad(entry as PerformanceResourceTiming)
        }
      }
    })

    observer.observe({ entryTypes: ['resource'] })
  }

  // Отправка метрик в мониторинг
  private sendToMonitoring(type: string, metric: any): void {
    if (process.env.NODE_ENV !== 'production') return

    // Отправка в Sentry (если доступно)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.addBreadcrumb({
        category: 'web-vitals',
        message: `${type}: ${metric.value}ms`,
        level: 'info',
        data: {
          metric: type,
          value: metric.value,
          delta: metric.delta,
          id: metric.id,
          name: metric.name,
          url: metric.url,
          navigationType: metric.navigationType,
        },
      })
    }

    // Отправка в Vercel Analytics (если доступно)
    if (typeof window !== 'undefined' && (window as any).vercel) {
      (window as any).vercel.analytics.track('web-vital', {
        type,
        value: metric.value,
        url: metric.url,
        navigationType: metric.navigationType,
      })
    }

    // Локальное хранение для анализа
    this.storeMetric(type, metric.value)
  }

  // Отправка кастомных метрик
  private sendCustomMetrics(): void {
    if (process.env.NODE_ENV !== 'production') return

    const customMetrics = {
      pageLoadTime: this.metrics.pageLoadTime,
      domInteractiveTime: this.metrics.domInteractiveTime,
      firstContentfulPaint: this.metrics.firstContentfulPaint,
      largestContentfulPaint: this.metrics.largestContentfulPaint,
      timeToFirstByte: this.metrics.timeToFirstByte,
      timeToInteractive: this.metrics.timeToInteractive,
      url: this.metrics.url,
      userAgent: this.metrics.userAgent,
      viewport: this.metrics.viewport,
      connectionType: this.metrics.connectionType,
      deviceMemory: this.metrics.deviceMemory,
      hardwareConcurrency: this.metrics.hardwareConcurrency,
    }

    // Отправка в Sentry (если доступно)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.addBreadcrumb({
        category: 'custom-metrics',
        message: 'Custom performance metrics',
        level: 'info',
        data: customMetrics,
      })
    }

    // Отправка в Vercel Analytics (если доступно)
    if (typeof window !== 'undefined' && (window as any).vercel) {
      (window as any).vercel.analytics.track('custom-metrics', customMetrics)
    }
  }

  // Отслеживание пользовательских взаимодействий
  private trackUserInteraction(type: string, element: HTMLElement): void {
    if (process.env.NODE_ENV !== 'production') return

    const interactionData = {
      type,
      element: element.tagName.toLowerCase(),
      id: element.id || '',
      className: element.className || '',
      text: element.textContent?.substring(0, 100) || '',
      url: this.metrics.url,
      timestamp: Date.now(),
    }

    // Отправка в Sentry (если доступно)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.addBreadcrumb({
        category: 'user-interaction',
        message: `User ${type} on ${interactionData.element}`,
        level: 'info',
        data: interactionData,
      })
    }

    // Отправка в Vercel Analytics (если доступно)
    if (typeof window !== 'undefined' && (window as any).vercel) {
      (window as any).vercel.analytics.track('user-interaction', interactionData)
    }
  }

  // Отслеживание загрузки ресурсов
  private trackResourceLoad(entry: PerformanceResourceTiming): void {
    if (process.env.NODE_ENV !== 'production') return

    const resourceData = {
      name: entry.name,
      type: entry.initiatorType,
      duration: entry.duration,
      size: entry.transferSize,
      url: this.metrics.url,
      timestamp: Date.now(),
    }

    // Отправка в Sentry (если доступно)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.addBreadcrumb({
        category: 'resource-load',
        message: `Resource loaded: ${resourceData.name}`,
        level: 'info',
        data: resourceData,
      })
    }

    // Отправка в Vercel Analytics (если доступно)
    if (typeof window !== 'undefined' && (window as any).vercel) {
      (window as any).vercel.analytics.track('resource-load', resourceData)
    }
  }

  // Хранение метрик локально
  private storeMetric(type: string, value: number): void {
    try {
      const storedMetrics = JSON.parse(localStorage.getItem('web-vitals-metrics') || '{}')
      storedMetrics[type] = storedMetrics[type] || []
      storedMetrics[type].push({
        value,
        timestamp: Date.now(),
        url: this.metrics.url,
      })

      // Ограничиваем количество хранимых метрик
      if (storedMetrics[type].length > 100) {
        storedMetrics[type] = storedMetrics[type].slice(-100)
      }

      localStorage.setItem('web-vitals-metrics', JSON.stringify(storedMetrics))
    } catch (error) {
      console.error('Failed to store web vitals metric:', error)
    }
  }

  // Получение собранных метрик
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  // Получение статистики по метрикам
  getMetricsStats(): Record<string, any> {
    try {
      const storedMetrics = JSON.parse(localStorage.getItem('web-vitals-metrics') || '{}')
      const stats: Record<string, any> = {}

      Object.keys(storedMetrics).forEach(type => {
        const values = storedMetrics[type].map((m: any) => m.value)
        if (values.length > 0) {
          stats[type] = {
            count: values.length,
            average: values.reduce((a: number, b: number) => a + b, 0) / values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            latest: values[values.length - 1],
          }
        }
      })

      return stats
    } catch (error) {
      console.error('Failed to get metrics stats:', error)
      return {}
    }
  }

  // Очистка хранилища метрик
  clearMetrics(): void {
    localStorage.removeItem('web-vitals-metrics')
    this.metrics = {
      lcp: null,
      fid: null,
      cls: null,
      fcp: null,
      tbt: null,
      inp: null,
      ttfb: null,
      pageLoadTime: null,
      domInteractiveTime: null,
      firstContentfulPaint: null,
      largestContentfulPaint: null,
      firstInputDelay: null,
      cumulativeLayoutShift: null,
      timeToFirstByte: null,
      timeToInteractive: null,
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      connectionType: (navigator as any).connection?.effectiveType || 'unknown',
      deviceMemory: (navigator as any).deviceMemory || 0,
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
    }
  }
}

// Создаем экземпляр сервиса
const webVitalsService = new WebVitalsService()

// Инициализация при загрузке модуля
if (typeof window !== 'undefined') {
  webVitalsService.init()
}

export default webVitalsService
export { WebVitalsService }