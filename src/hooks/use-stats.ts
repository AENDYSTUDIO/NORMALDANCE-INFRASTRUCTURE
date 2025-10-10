'use client'

import { useState, useEffect } from 'react'

interface Stats {
  activeListeners: number
  tracksToday: number
  newArtists: number
  totalPlays: number
}

export function useStats() {
  const [stats, setStats] = useState<Stats>({
    activeListeners: 0,
    tracksToday: 0,
    newArtists: 0,
    totalPlays: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 30000) // Обновляем каждые 30 секунд

    return () => clearInterval(interval)
  }, [])

  return { stats, loading }
}