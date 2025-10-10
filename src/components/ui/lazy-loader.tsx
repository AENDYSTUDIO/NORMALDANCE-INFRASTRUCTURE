'use client'
import { Suspense } from 'react'
import { createLazyComponent } from '@/lib/performance-optimizer'

// Lazy components for heavy features
export const LazyAudioPlayer = createLazyComponent(() => import('@/components/audio/audio-player'))
export const LazyNFTMarketplace = createLazyComponent(() => import('@/components/nft/nft-marketplace'))
export const LazyDEXInterface = createLazyComponent(() => import('@/components/dex/advanced-dashboard'))

// Loading fallback
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
)

// Wrapper with error boundary
export const LazyWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingSpinner />}>
    {children}
  </Suspense>
)