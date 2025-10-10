'use client'

import { useMobileSafe } from '@/hooks/use-mobile-safe'
import MobileNav from './mobile-nav'

export function MobileNavWrapper() {
  const { isMobile, isLoaded } = useMobileSafe()

  if (!isLoaded) {
    return null // Предотвращаем flash of incorrect content
  }

  return isMobile ? <MobileNav /> : null
}