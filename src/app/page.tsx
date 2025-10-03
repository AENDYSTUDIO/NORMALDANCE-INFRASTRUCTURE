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

// Mock data for demonstration
const mockTracks = [
  {
    id: '1',
    title: 'Summer Vibes',
    artistName: 'DJ Melody',
    genre: 'Electronic',
    duration: 180,
    playCount: 15420,
    likeCount: 892,
    ipfsHash: 'QmXxx...',
    audioUrl: '/sample-audio.mp3',
    coverImage: '/placeholder-album.jpg',
    isExplicit: false,
    isPublished: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    title: 'Midnight Dreams',
    artistName: 'Luna Star',
    genre: 'Ambient',
    duration: 240,
    playCount: 8750,
    likeCount: 543,
    ipfsHash: 'QmYyy...',
    audioUrl: '/sample-audio.mp3',
    coverImage: '/placeholder-album.jpg',
    isExplicit: false,
    isPublished: true,
    createdAt: '2024-01-14T15:30:00Z',
    updatedAt: '2024-01-14T15:30:00Z'
  },
  {
    id: '3',
    title: 'Urban Beats',
    artistName: 'Street Composer',
    genre: 'Hip-Hop',
    duration: 200,
    playCount: 23100,
    likeCount: 1521,
    ipfsHash: 'QmZzz...',
    audioUrl: '/sample-audio.mp3',
    coverImage: '/placeholder-album.jpg',
    isExplicit: true,
    isPublished: true,
    createdAt: '2024-01-13T09:00:00Z',
    updatedAt: '2024-01-13T09:00:00Z'
  }
]

export default function Home() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Hero section */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Добро пожаловать в NORMAL DANCE REVOLUTION</h1>
              <p className="text-lg opacity-90">
                Революционная децентрализованная музыкальная платформа, где артисты и слушатели вместе создают будущее музыки
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
                {mockTracks.map((track) => (
                  <TrackCard key={track.id} track={track} />
                ))}
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
                {mockTracks.slice().reverse().map((track) => (
                  <TrackCard key={track.id} track={track} />
                ))}
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
                {[
                  { name: 'DJ Melody', tracks: 45, followers: '12K' },
                  { name: 'Luna Star', tracks: 32, followers: '8K' },
                  { name: 'Street Composer', tracks: 28, followers: '15K' }
                ].map((artist, index) => (
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
                ))}
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

            {/* Community stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Статистика сообщества</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Активных слушателей</span>
                  <span className="font-bold">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Треков сегодня</span>
                  <span className="font-bold">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Новых артистов</span>
                  <span className="font-bold">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Воспроизведений</span>
                  <span className="font-bold">0</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <AudioPlayer />
    </MainLayout>
  )
}