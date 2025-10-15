/**
 * Утилиты для ленивой загрузки компонентов и маршрутов
 */

import { lazy, Suspense, ComponentType, LazyExoticComponent, useState, useCallback, useEffect } from 'react'

// Предзагрузка критических ресурсов
export function preloadCriticalResources() {
  if (typeof window !== 'undefined') {
    // Предзагрузка критических шрифтов
    const fontLinks = [
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
      'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap'
    ]
    
    fontLinks.forEach(href => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = href
      link.as = 'style'
      document.head.appendChild(link)
    })
    
    // Предзагрузка критических изображений
    const criticalImages = [
      '/placeholder-album.jpg',
      '/placeholder-avatar.jpg'
    ]
    
    criticalImages.forEach(src => {
      const img = new Image()
      img.src = src
    })
  }
}

// Хук для ленивой загрузки с отслеживанием состояния
export function useLazyState<T>(importFn: () => Promise<{ default: T }>) {
  const [Component, setComponent] = useState<LazyExoticComponent<ComponentType<any>> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  const load = useCallback(async () => {
    if (Component) return
    
    setLoading(true)
    try {
      const module = await importFn()
      setComponent(lazy(() => Promise.resolve(module)))
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [importFn, Component])
  
  return { Component, loading, error, load }
}

// Оптимизированный компонент для загрузки тяжелых модулей
export function HeavyModuleLoader({ 
  children, 
  fallback, 
  preload = false 
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
  preload?: boolean
}) {
  useEffect(() => {
    if (preload) {
      // Здесь можно добавить логику предзагрузки тяжелых модулей
    }
  }, [preload])
  
  return (
    <Suspense fallback={fallback || <div>Загрузка...</div>}>
      {children}
    </Suspense>
  )
}

// Утилита для создания ленивых компонентов с предзагрузкой
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFn)
  
  const LazyWrapper = ({ fallback: customFallback, ...props }: Record<string, unknown>) => (
    <Suspense fallback={customFallback || fallback}>
      <LazyComponent {...props} />
    </Suspense>
  )
  
  return { LazyComponent, LazyWrapper }
}

// Оптимизация для роутов на основе Next.js
export function createLazyRoute<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  const LazyRoute = lazy(importFn)
  
  const LazyRouteWrapper = (props: Record<string, unknown>) => (
    <Suspense fallback={<div>Загрузка страницы...</div>}>
      <LazyRoute {...props} />
    </Suspense>
  )
  
  return LazyRouteWrapper
}