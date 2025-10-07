'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Play, Pause, ArrowLeft, Heart, MoreHorizontal, Plus, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

interface Track {
  id: string
  title: string
  duration: number
  audioUrl: string
  coverUrl?: string
  genre?: string
  playCount: number
  createdAt: string
  artist: {
    id: string
    name: string
    avatar?: string
    verified: boolean
  }
  album?: {
    id: string
    title: string
    coverUrl?: string
    releaseDate?: string
  }
}

export default function TrackDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [track, setTrack] = useState<Track | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLiked, setIsLiked] = useState(false)

  useEffect(() => {
    const fetchTrack = async () => {
      try {
        const response = await fetch(`/api/tracks`)
        const data = await response.json()
        const foundTrack = data.tracks.find((t: Track) => t.id === params.id)
        
        if (foundTrack) {
          setTrack(foundTrack)
        } else {
          router.push('/')
        }
      } catch (error) {
        console.error('Error fetching track:', error)
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchTrack()
    }
  }, [params.id, router])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatPlayCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleLike = () => {
    setIsLiked(!isLiked)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-zinc-400">Загрузка...</div>
      </div>
    )
  }

  if (!track) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-zinc-400">Трек не найден</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="bg-gradient-to-b from-zinc-900 to-black">
        {/* Header */}
        <div className="p-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()}
            className="mb-6 text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Cover */}
            <div className="flex-shrink-0">
              <div className="w-64 h-64 md:w-80 md:h-80 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg shadow-2xl"></div>
            </div>

            {/* Track Info */}
            <div className="flex-1 flex flex-col justify-end">
              {track.genre && (
                <Badge variant="secondary" className="w-fit mb-4">
                  {track.genre}
                </Badge>
              )}
              
              <h1 className="text-4xl md:text-6xl font-bold mb-4">{track.title}</h1>
              
              <div className="flex items-center gap-3 mb-6">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={track.artist.avatar} />
                  <AvatarFallback className="bg-zinc-700">
                    {track.artist.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-lg">
                  {track.artist.name}
                  {track.artist.verified && (
                    <span className="ml-1 text-blue-400">✓</span>
                  )}
                </span>
                {track.album && (
                  <>
                    <span className="text-zinc-400">•</span>
                    <span className="text-zinc-300">{track.album.title}</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-6 text-sm text-zinc-400 mb-8">
                <span>{formatPlayCount(track.playCount)} прослушиваний</span>
                <span>{formatTime(track.duration)}</span>
                <span>{formatDate(track.createdAt)}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4">
                <Button 
                  size="lg" 
                  className="bg-green-500 hover:bg-green-400 text-black font-semibold"
                  onClick={handlePlayPause}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-5 h-5 mr-2" fill="black" />
                      Пауза
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" fill="black" />
                      Play
                    </>
                  )}
                </Button>

                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleLike}
                  className={isLiked ? 'text-green-400 border-green-400' : 'text-zinc-400 border-zinc-600'}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                </Button>

                <Button variant="outline" size="icon" className="text-zinc-400 border-zinc-600">
                  <Plus className="w-5 h-5" />
                </Button>

                <Button variant="outline" size="icon" className="text-zinc-400 border-zinc-600">
                  <Share2 className="w-5 h-5" />
                </Button>

                <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Separator className="bg-zinc-800" />

        {/* Additional Info */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* About Track */}
            <div>
              <h3 className="text-xl font-semibold mb-4">О треке</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Артист</span>
                  <span>{track.artist.name}</span>
                </div>
                {track.album && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Альбом</span>
                    <span>{track.album.title}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-400">Длительность</span>
                  <span>{formatTime(track.duration)}</span>
                </div>
                {track.genre && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Жанр</span>
                    <span>{track.genre}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-400">Дата добавления</span>
                  <span>{formatDate(track.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Статистика</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Прослушиваний</span>
                  <span>{formatPlayCount(track.playCount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Лайков</span>
                  <span>{Math.floor(track.playCount * 0.1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Добавлений в плейлисты</span>
                  <span>{Math.floor(track.playCount * 0.05)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}