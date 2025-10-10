// Performance optimization utilities
import { lazy } from 'react'

// Lazy loading with error boundaries
export const createLazyComponent = (importFn: () => Promise<any>) => {
  return lazy(() => importFn().catch(() => ({ default: () => <div>Failed to load</div> })))
}

// Image optimization
export const optimizeImage = (src: string, width?: number) => {
  if (!src) return '/placeholder.jpg'
  return `${src}?w=${width || 400}&q=75&f=webp`
}

// Bundle size analyzer
export const trackBundleSize = () => {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('Bundle loaded:', performance.now())
  }
}

// Critical CSS inlining
export const inlineCriticalCSS = () => `
  .loading { opacity: 0.5; }
  .loaded { opacity: 1; transition: opacity 0.3s; }
`