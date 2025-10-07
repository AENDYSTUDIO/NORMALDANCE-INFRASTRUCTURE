'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Play, Pause, SkipBack, SkipForward, Volume2, Search, Home, Library, TrendingUp, User, Heart, MoreHorizontal, Shuffle, Repeat, Radio, Mic2, Headphones, Settings, LogIn, UserPlus, Upload, ListMusic } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import LikeButton from '@/components/LikeButton'
import PlaylistCreator from '@/components/PlaylistCreator'
import AudioUploader from '@/components/AudioUploader'
import Recommendations from '@/components/Recommendations'

interface Track {
  id: string
  title: string
  duration: number
  audioUrl: string
  coverUrl?: string
  genre?: string
  playCount: number
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
  }
}

interface Playlist {
  id: string
  name: string
  description?: string
  coverUrl?: string
  isPublic: boolean
  createdAt: string
  owner: {
    id: string
    name?: string
    avatar?: string
  }
  tracks: Array<{
    id: string
    position: number
    track: Track
  }>
}

interface Artist {
  id: string
  name: string
  bio?: string
  avatar?: string
  verified: boolean
  tracks: Array<{
    id: string
    title: string
    playCount: number
  }>
  albums: Array<{
    id: string
    title: string
    coverUrl?: string
  }>
  _count: {
    tracks: number
    albums: number
  }
}

export default function NormalDancePlatform() {
  const { data: session } = useSession()
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(70)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('home')
  const [featuredPlaylists, setFeaturedPlaylists] = useState<Playlist[]>([])
  const [popularTracks, setPopularTracks] = useState<Track[]>([])
  const [artists, setArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)
  const [showPlaylistCreator, setShowPlaylistCreator] = useState(false)
  const [showAudioUploader, setShowAudioUploader] = useState(false)

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch playlists
        const playlistsResponse = await fetch('/api/playlists?public=true&limit=6')
        const playlistsData = await playlistsResponse.json()
        setFeaturedPlaylists(playlistsData.playlists || [])

        // Fetch tracks
        const tracksResponse = await fetch('/api/tracks?limit=10')
        const tracksData = await tracksResponse.json()
        setPopularTracks(tracksData.tracks || [])

        // Fetch artists
        const artistsResponse = await fetch('/api/artists?limit=8')
        const artistsData = await artistsResponse.json()
        setArtists(artistsData.artists || [])

        // Seed database if empty
        if (playlistsData.playlists?.length === 0) {
          await fetch('/api/seed', { method: 'POST' })
          // Refetch after seeding
          const newPlaylistsResponse = await fetch('/api/playlists?public=true&limit=6')
          const newPlaylistsData = await newPlaylistsResponse.json()
          setFeaturedPlaylists(newPlaylistsData.playlists || [])

          const newTracksResponse = await fetch('/api/tracks?limit=10')
          const newTracksData = await newTracksResponse.json()
          setPopularTracks(newTracksData.tracks || [])

          const newArtistsResponse = await fetch('/api/artists?limit=8')
          const newArtistsData = await newArtistsResponse.json()
          setArtists(newArtistsData.artists || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handlePlayPause = () => {
    if (currentTrack) {
      setIsPlaying(!isPlaying)
    }
  }

  const handleTrackSelect = (track: Track) => {
    setCurrentTrack(track)
    setIsPlaying(true)
    setCurrentTime(0)
  }

  const handleTrackClick = (track: Track, e: React.MouseEvent) => {
    if (e.detail === 2) { // Double click
      window.open(`/track/${track.id}`, '_blank')
    } else {
      handleTrackSelect(track)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    try {
      const response = await fetch(`/api/tracks?search=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      setPopularTracks(data.tracks || [])
    } catch (error) {
      console.error('Error searching tracks:', error)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch()
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const sidebarItems = [
    { icon: Home, label: 'Главная', id: 'home' },
    { icon: TrendingUp, label: 'Тренды', id: 'trending' },
    { icon: Radio, label: 'Радио', id: 'radio' },
    { icon: Library, label: 'Библиотека', id: 'library' },
    { icon: Heart, label: 'Любимые', id: 'favorites' },
  ]

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' })
  }

  const refreshData = () => {
    fetchData()
  }

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-zinc-900 p-6 flex flex-col">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-green-400">NORMAL DANCE</h1>
          <p className="text-xs text-zinc-400 mt-1">Музыкальная платформа</p>
        </div>

        <nav className="space-y-2 mb-8">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeTab === item.id 
                  ? 'bg-zinc-800 text-white' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto space-y-2">
          {session ? (
            <>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={session.user.image || ''} />
                  <AvatarFallback className="bg-green-400 text-black">
                    {session.user.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {session.user.name}
                  </p>
                  <p className="text-xs text-zinc-400 truncate">
                    {session.user.email}
                  </p>
                </div>
              </div>
              
              {session.user.premium && (
                <Badge className="w-full justify-center bg-gradient-to-r from-yellow-400 to-orange-400 text-black">
                  PREMIUM
                </Badge>
              )}

              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowPlaylistCreator(true)}
                className="w-full justify-start text-zinc-400 hover:text-white"
              >
                <ListMusic className="w-4 h-4 mr-2" />
                Создать плейлист
              </Button>

              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowAudioUploader(true)}
                className="w-full justify-start text-zinc-400 hover:text-white"
              >
                <Upload className="w-4 h-4 mr-2" />
                Загрузить трек
              </Button>

              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSignOut}
                className="w-full justify-start text-zinc-400 hover:text-white"
              >
                <LogIn className="w-4 h-4 mr-2 rotate-180" />
                Выйти
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => window.open('/auth/signin', '_blank')}
                className="w-full justify-start text-zinc-400 hover:text-white"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Войти
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => window.open('/auth/signup', '_blank')}
                className="w-full justify-start text-zinc-400 hover:text-white"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Регистрация
              </Button>
            </>
          )}
          
          <Button variant="ghost" size="sm" className="w-full justify-start text-zinc-400 hover:text-white">
            <Settings className="w-4 h-4 mr-2" />
            Настройки
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-zinc-900 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Поиск треков, артистов, альбомов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-zinc-800 border-none text-white placeholder-zinc-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
              <Mic2 className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
              <Headphones className="w-5 h-5" />
            </Button>
            <Avatar className="w-8 h-8">
              <AvatarImage src="/api/placeholder/32/32" />
              <AvatarFallback className="bg-green-400 text-black">U</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Content */}
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-zinc-400">Загрузка...</div>
              </div>
            ) : (
              <>
                {/* Hero Section */}
                <div className="mb-8">
                  <h2 className="text-3xl font-bold mb-2">Добро пожаловать в NORMAL DANCE</h2>
                  <p className="text-zinc-400">Откройте для себя лучшие треки и создайте свои плейлисты</p>
                </div>

                {/* Featured Playlists */}
                <section className="mb-8">
                  <h3 className="text-2xl font-bold mb-4">Популярные плейлисты</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {featuredPlaylists.map((playlist) => (
                      <Card key={playlist.id} className="bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer group">
                        <CardContent className="p-4">
                          <div className="relative mb-4">
                            <div className="aspect-square bg-gradient-to-br from-green-400 to-blue-500 rounded-md mb-4"></div>
                            <Button 
                              size="icon" 
                              className="absolute bottom-2 right-2 bg-green-500 hover:bg-green-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Play className="w-4 h-4 text-black" fill="black" />
                            </Button>
                          </div>
                          <h4 className="font-semibold truncate">{playlist.name}</h4>
                          <p className="text-sm text-zinc-400 truncate">{playlist.description}</p>
                          <p className="text-xs text-zinc-500 mt-1">{playlist.tracks.length} треков</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>

                {/* Popular Artists */}
                <section className="mb-8">
                  <h3 className="text-2xl font-bold mb-4">Популярные артисты</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {artists.map((artist) => (
                      <div 
                        key={artist.id} 
                        className="text-center cursor-pointer group"
                        onClick={() => window.open(`/artist/${artist.id}`, '_blank')}
                        title="Клик для открытия страницы артиста"
                      >
                        <div className="relative mb-3">
                          <div className="w-full aspect-square bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mb-2"></div>
                          {artist.verified && (
                            <div className="absolute bottom-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>
                        <h4 className="font-medium text-sm truncate">{artist.name}</h4>
                        <p className="text-xs text-zinc-400">{artist._count.tracks} треков</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Popular Tracks */}
                <section className="mb-8">
                  <h3 className="text-2xl font-bold mb-4">Популярные треки</h3>
                  <div className="space-y-2">
                    {popularTracks.map((track, index) => (
                      <div 
                        key={track.id}
                        onClick={(e) => handleTrackClick(track, e)}
                        className="flex items-center p-3 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer group"
                        title="Двойной клик для открытия детальной страницы"
                      >
                        <span className="text-zinc-400 w-8 text-center">{index + 1}</span>
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-md mx-4"></div>
                        <div className="flex-1">
                          <h4 className="font-medium">{track.title}</h4>
                          <p className="text-sm text-zinc-400">
                            {track.artist.name}
                            {track.artist.verified && <span className="ml-1 text-blue-400">✓</span>}
                          </p>
                        </div>
                        <div className="text-right mr-4">
                          <p className="text-sm text-zinc-400">{formatPlayCount(track.playCount)}</p>
                          {track.genre && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              {track.genre}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-zinc-400 mr-4">{formatTime(track.duration)}</p>
                        <div className="flex items-center gap-1">
                          <LikeButton trackId={track.id} />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleTrackSelect(track)
                            }}
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Recommendations */}
                <Recommendations onTrackSelect={handleTrackSelect} />
              </>
            )}

            {/* Modals */}
            {showPlaylistCreator && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <PlaylistCreator 
                    availableTracks={popularTracks}
                    onCreateSuccess={() => {
                      setShowPlaylistCreator(false)
                      refreshData()
                    }}
                  />
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowPlaylistCreator(false)}
                    className="w-full mt-4"
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            )}

            {showAudioUploader && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <AudioUploader 
                    artists={artists}
                    albums={[]}
                    onUploadSuccess={() => {
                      setShowAudioUploader(false)
                      refreshData()
                    }}
                  />
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowAudioUploader(false)}
                    className="w-full mt-4"
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Player */}
        {currentTrack && (
          <div className="bg-zinc-900 border-t border-zinc-800 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-blue-500 rounded-md"></div>
                <div>
                  <h4 className="font-medium">{currentTrack.title}</h4>
                  <p className="text-sm text-zinc-400">
                    {currentTrack.artist.name}
                    {currentTrack.artist.verified && <span className="ml-1 text-blue-400">✓</span>}
                  </p>
                </div>
                <LikeButton trackId={currentTrack.id} />
              </div>

              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                    <Shuffle className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                    <SkipBack className="w-5 h-5" />
                  </Button>
                  <Button 
                    size="icon" 
                    className="bg-white text-black hover:bg-zinc-200"
                    onClick={handlePlayPause}
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" fill="black" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                    <SkipForward className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                    <Repeat className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 w-full max-w-md">
                  <span className="text-xs text-zinc-400">{formatTime(currentTime)}</span>
                  <Slider 
                    value={[currentTime]} 
                    max={currentTrack.duration} 
                    step={1}
                    className="flex-1"
                    onValueChange={(value) => setCurrentTime(value[0])}
                  />
                  <span className="text-xs text-zinc-400">{formatTime(currentTrack.duration)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-1 justify-end">
                <Volume2 className="w-4 h-4 text-zinc-400" />
                <Slider 
                  value={[volume]} 
                  max={100} 
                  step={1}
                  className="w-24"
                  onValueChange={(value) => setVolume(value[0])}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}