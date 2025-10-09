'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, Heart, TrendingUp, Clock, Music } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface Track {
  id: string
  title: string
  duration: number
  playCount: number
  genre?: string
  artist: {
    id: string
    name: string
    verified: boolean
  }
}

interface RecommendationsProps {
  onTrackSelect?: (track: Track) => void
}

export default function Recommendations({ onTrackSelect }: RecommendationsProps) {
  const { data: session } = useSession()
  const [recommendations, setRecommendations] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState<'mixed' | 'liked' | 'history' | 'trending'>('mixed')

  const recommendationTypes = [
    { id: 'mixed', label: 'Для вас', icon: Music },
    { id: 'liked', label: 'Похожие на лайки', icon: Heart },
    { id: 'history', label: 'По истории', icon: Clock },
    { id: 'trending', label: 'В тренде', icon: TrendingUp }
  ]

  useEffect(() => {
    fetchRecommendations()
  }, [activeType, session])

  const fetchRecommendations = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/recommendations?type=${activeType}`)
      if (response.ok) {
        const data = await response.json()
        setRecommendations(data.tracks || [])
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPlayCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Рекомендации
          </CardTitle>
          {session && (
            <div className="flex gap-2">
              {recommendationTypes.map((type) => {
                const Icon = type.icon
                return (
                  <Button
                    key={type.id}
                    variant={activeType === type.id ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveType(type.id as any)}
                    className={
                      activeType === type.id
                        ? 'bg-green-500 text-black'
                        : 'text-zinc-400 hover:text-white'
                    }
                  >
                    <Icon className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">{type.label}</span>
                  </Button>
                )
              })}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-zinc-800/50 animate-pulse">
                <div className="w-10 h-10 bg-zinc-700 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-zinc-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-zinc-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-8 text-zinc-400">
            <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Рекомендации появятся после того, как вы начнете слушать музыку</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recommendations.map((track, index) => (
              <div
                key={track.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer group"
                onClick={() => onTrackSelect?.(track)}
              >
                <span className="text-zinc-400 w-6 text-center text-sm">{index + 1}</span>
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{track.title}</h4>
                  <p className="text-sm text-zinc-400 truncate">
                    {track.artist.name}
                    {track.artist.verified && (
                      <span className="ml-1 text-blue-400">✓</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-right">
                  {track.genre && (
                    <Badge variant="secondary" className="text-xs">
                      {track.genre}
                    </Badge>
                  )}
                  <span className="text-sm text-zinc-400 hidden sm:block">
                    {formatPlayCount(track.playCount)}
                  </span>
                  <span className="text-sm text-zinc-400">
                    {formatTime(track.duration)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation()
                    onTrackSelect?.(track)
                  }}
                >
                  <Play className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}