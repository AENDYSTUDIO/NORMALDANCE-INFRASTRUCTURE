'use client'

import { useEffect, useState } from 'react'
import { AudioPlayer } from '@/components/audio/audio-player'
import { ListeningNow } from '@/components/audio/listening-now'
import { TrackCard } from '@/components/audio/track-card'
import {
  Award,
  Clock,
  Heart,
  Play,
  Radio,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  Users
} from '@/components/icons'
import { MainLayout } from '@/components/layout/main-layout'
import { Avatar, AvatarFallback, AvatarImage, Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from '@/components/ui'
import { CommunityStats } from '@/components/stats/community-stats'
import { logger } from '@/lib/utils/logger'

// Development-only imports
const isDevelopment = process.env.NODE_ENV === 'development'
const mockData = isDevelopment ? require('@/__mocks__/tracks') : null

interface Track {
  id: string
  title: string
  artistName: string
  genre: string
  duration: number
  playCount: number
  likeCount: number
  ipfsHash: string
  audioUrl: string
  coverImage?: string
  isExplicit: boolean
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

interface Artist {
  name: string
  tracks: number
  followers: string
}

export default function Home() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [artists, setArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        // In development, use mock data
        if (isDevelopment && mockData) {
          setTracks(mockData.mockTracks)
          setArtists(mockData.mockArtists)
          setLoading(false)
          return
        }

        // In production, fetch real data from API
        const response = await fetch('/api/tracks?limit=6&sortBy=playCount&sortOrder=desc')
        if (response.ok) {
          const data = await response.json()
          setTracks(data.tracks || [])
        } else {
          logger.warn('Failed to fetch tracks', { status: response.status })
        }
        
        // TODO: Fetch real artists data
        setArtists([])
        
      } catch (error) {
        logger.error('Error fetching homepage data', error as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Hero section */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Добро пожаловать в NORMAL DANCE</h1>
              <p className="text-lg opacity-90">
                Децентрализованная музыкальная платформа, где артисты и слушатели вместе создают будущее музыки
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <Sparkles className="h-3 w-3 mr-1" />
                2025: Полный план реализации выполнен
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <Users className="h-3 w-3 mr-1" />
                4 недели разработки
              </Badge>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
              <Play className="h-4 w-4 mr-2" />
              Начать слушать
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600">
              <Radio className="h-4 w-4 mr-2" />
              Стать артистом
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600">
              <Award className="h-4 w-4 mr-2" />
              Получить награды
            </Button>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Поиск треков, артистов, альбомов..."
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trending tracks */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold flex items-center space-x-2">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                  <span>Популярное сейчас</span>
                </h2>
                <Button variant="ghost" size="sm">
                  Показать все
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tracks.length > 0 ? (
                  tracks.slice(0, 3).map((track) => (
                    <TrackCard key={track.id} track={track} />
                  ))
                ) : (
                  <p className="text-muted-foreground col-span-2">Нет доступных треков</p>
                )}
              </div>
            </section>

            {/* Recent uploads */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold flex items-center space-x-2">
                  <Clock className="h-6 w-6 text-pink-600" />
                  <span>Новые релизы</span>
                </h2>
                <Button variant="ghost" size="sm">
                  Показать все
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tracks.length > 0 ? (
                  tracks.slice(3, 6).map((track) => (
                    <TrackCard key={track.id} track={track} />
                  ))
                ) : (
                  <p className="text-muted-foreground col-span-2">Нет новых релизов</p>
                )}
              </div>
            </section>

            {/* Top artists */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold flex items-center space-x-2">
                  <Star className="h-6 w-6 text-yellow-600" />
                  <span>Топ артисты</span>
                </h2>
                <Button variant="ghost" size="sm">
                  Показать всех
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {artists.length > 0 ? (
                  artists.map((artist, index) => (
                  <Card key={index} className="text-center p-4 hover:shadow-md transition-shadow">
                    <Avatar className="h-16 w-16 mx-auto mb-3">
                      <AvatarImage src="/placeholder-avatar.jpg" />
                      <AvatarFallback className="text-lg">
                        {artist.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-medium mb-1">{artist.name}</h3>
                    <div className="flex justify-center space-x-4 text-xs text-muted-foreground">
                      <span>{artist.tracks} треков</span>
                      <span>{artist.followers} подписчиков</span>
                    </div>
                    <Button size="sm" className="mt-3 w-full">
                      Подписаться
                    </Button>
                  </Card>
                  ))
                ) : (
                  <p className="text-muted-foreground col-span-3">Нет данных об артистах</p>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Listening now */}
            <ListeningNow />

            {/* Quick actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Быстрые действия</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Radio className="h-4 w-4 mr-2" />
                  Создать плейлист
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Heart className="h-4 w-4 mr-2" />
                  Моя музыка
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Award className="h-4 w-4 mr-2" />
                  Мои награды
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Тренды
                </Button>
              </CardContent>
            </Card>

            <CommunityStats />
          </div>
        </div>
      </div>
      
      <AudioPlayer />
    </MainLayout>
  )
}