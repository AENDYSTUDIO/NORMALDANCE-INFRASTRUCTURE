'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Play, Pause, ArrowLeft, Heart, MoreHorizontal, Shuffle, PlayIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Artist {
  id: string
  name: string
  bio?: string
  avatar?: string
  verified: boolean
  createdAt: string
  tracks: Array<{
    id: string
    title: string
    playCount: number
    duration: number
    genre?: string
  }>
  albums: Array<{
    id: string
    title: string
    coverUrl?: string
    releaseDate?: string
  }>
  _count: {
    tracks: number
    albums: number
  }
}

export default function ArtistDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [artist, setArtist] = useState<Artist | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [activeTab, setActiveTab] = useState<'tracks' | 'albums'>('tracks')

  useEffect(() => {
    const fetchArtist = async () => {
      try {
        const response = await fetch(`/api/artists`)
        const data = await response.json()
        const foundArtist = data.artists.find((a: Artist) => a.id === params.id)
        
        if (foundArtist) {
          setArtist(foundArtist)
        } else {
          router.push('/')
        }
      } catch (error) {
        console.error('Error fetching artist:', error)
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchArtist()
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
      month: 'long'
    })
  }

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleLike = () => {
    setIsLiked(!isLiked)
  }

  const handlePlayAll = () => {
    setIsPlaying(true)
  }

  const handleShufflePlay = () => {
    setIsPlaying(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-zinc-400">Загрузка...</div>
      </div>
    )
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-zinc-400">Артист не найден</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-zinc-900 to-black">
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
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-48 h-48 md:w-64 md:h-64 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full shadow-2xl"></div>
            </div>

            {/* Artist Info */}
            <div className="flex-1 flex flex-col justify-end">
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-4xl md:text-6xl font-bold">{artist.name}</h1>
                {artist.verified && (
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                )}
              </div>

              {artist.bio && (
                <p className="text-lg text-zinc-300 mb-6 max-w-2xl">{artist.bio}</p>
              )}

              <div className="flex items-center gap-6 text-sm text-zinc-400 mb-8">
                <span>{artist._count.tracks} треков</span>
                <span>{artist._count.albums} альбомов</span>
                <span>{formatPlayCount(artist.tracks.reduce((sum, track) => sum + track.playCount, 0))} прослушиваний</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4">
                <Button 
                  size="lg" 
                  className="bg-green-500 hover:bg-green-400 text-black font-semibold"
                  onClick={handlePlayAll}
                >
                  <PlayIcon className="w-5 h-5 mr-2" fill="black" />
                  Play
                </Button>

                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleShufflePlay}
                  className="text-zinc-400 border-zinc-600"
                >
                  <Shuffle className="w-5 h-5" />
                </Button>

                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleLike}
                  className={isLiked ? 'text-green-400 border-green-400' : 'text-zinc-400 border-zinc-600'}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                </Button>

                <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Separator className="bg-zinc-800" />
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Tabs */}
        <div className="flex gap-6 mb-6">
          <button
            onClick={() => setActiveTab('tracks')}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === 'tracks' 
                ? 'border-white text-white' 
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Треки
          </button>
          <button
            onClick={() => setActiveTab('albums')}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === 'albums' 
                ? 'border-white text-white' 
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Альбомы
          </button>
        </div>

        {/* Tracks Tab */}
        {activeTab === 'tracks' && (
          <div className="space-y-2">
            {artist.tracks.map((track, index) => (
              <div 
                key={track.id}
                className="flex items-center p-3 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer group"
              >
                <span className="text-zinc-400 w-8 text-center">{index + 1}</span>
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-md mx-4"></div>
                <div className="flex-1">
                  <h4 className="font-medium">{track.title}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-400">{artist.name}</span>
                    {track.genre && (
                      <>
                        <span className="text-zinc-600">•</span>
                        <Badge variant="secondary" className="text-xs">
                          {track.genre}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right mr-4">
                  <p className="text-sm text-zinc-400">{formatPlayCount(track.playCount)}</p>
                </div>
                <p className="text-sm text-zinc-400 mr-4">{formatTime(track.duration)}</p>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Play className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Albums Tab */}
        {activeTab === 'albums' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {artist.albums.map((album) => (
              <Card key={album.id} className="bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer group">
                <CardContent className="p-4">
                  <div className="relative mb-4">
                    <div className="aspect-square bg-gradient-to-br from-purple-400 to-pink-400 rounded-md mb-4"></div>
                    <Button 
                      size="icon" 
                      className="absolute bottom-2 right-2 bg-green-500 hover:bg-green-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Play className="w-4 h-4 text-black" fill="black" />
                    </Button>
                  </div>
                  <h4 className="font-semibold truncate text-sm">{album.title}</h4>
                  {album.releaseDate && (
                    <p className="text-xs text-zinc-400 mt-1">{formatDate(album.releaseDate)}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}