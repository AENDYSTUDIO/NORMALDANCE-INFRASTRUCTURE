'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useAudioStore } from '@/store/use-audio-store'
import useNetworkStatus from '@/hooks/useNetworkStatus'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Heart,
  Share,
  MoreHorizontal,
  List,
  X,
  Shuffle,
  Repeat,
  Clock,
  Music,
  Users,
  TrendingUp,
  BarChart3,
  Headphones,
  Plus,
  Settings,
  Download,
  Save,
  ListMusic,
  Radio,
  Mic,
  SlidersHorizontal,
  Waves,
  Circle,
  Square,
  Triangle,
  Zap,
  Crown,
  Award,
  Target,
  Activity,
  Ruler,
  Gauge,
  Volume1,
  Wifi,
  WifiOff,
  Signal,
  SignalHigh,
  SignalLow,
  SignalMedium,
  AlertCircle,
  CheckCircle,
  Info,
  Search,
  Star,
  Sparkles,
  Diamond
} from '@/components/icons'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { AudioVisualizer } from './audio-visualizer'
import { PlaylistManager } from './playlist-manager'

interface AudioQuality {
  id: string
  name: string
  bitrate: number
  sampleRate: number
  extension: string
  size: string
}

interface Playlist {
  id: string
  name: string
  description?: string
  coverImage?: string
  tracks: unknown[]
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
  playCount: number
  likeCount: number
}

interface EqualizerPreset {
  id: string
  name: string
  settings: {
    bass: number
    mid: number
    treble: number
    gain: number
  }
  icon: React.ReactNode
}

export function AudioPlayer() {
  const {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    currentTime,
    duration,
    queue,
    currentQueueIndex,
    history,
    shuffle,
    repeat,
    play,
    pause,
    setVolume,
    toggleMute,
    seekTo,
    playNext,
    playPrevious,
    toggleLike,
    toggleShuffle,
    setRepeat,
    addToQueue,
    removeFromQueue,
    clearQueue,
    createPlaylist,
    addToPlaylist,
    removeFromPlaylist,
    getUserPlaylists,
    setCurrentPlaylist
  } = useAudioStore()

  const audioRef = useRef<HTMLAudioElement>(null)
  const { effectiveType } = useNetworkStatus()
  const [isLiked, setIsLiked] = useState(false)
  const [showQueue, setShowQueue] = useState(false)
  const [showVisualizer, setShowVisualizer] = useState(true)
  const [showPlaylistManager, setShowPlaylistManager] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showQualitySettings, setShowQualitySettings] = useState(false)
  const [showEqualizer, setShowEqualizer] = useState(false)
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false)
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  
  // Состояния для плейлистов
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [currentPlaylist, setCurrentPlaylistState] = useState<Playlist | null>(null)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedQuality, setSelectedQuality] = useState('auto')
  
  // Состояния для эквалайзера
  const [equalizerSettings, setEqualizerSettings] = useState({
    bass: 0,
    mid: 0,
    treble: 0,
    gain: 0
  })
  
  // Состояния для визуализации
  const [visualizerType, setVisualizerType] = useState<'bars' | 'wave' | 'circle' | 'particles'>('bars')
  const [visualizerColor, setVisualizerColor] = useState('#3b82f6')
  const [visualizerSensitivity, setVisualizerSensitivity] = useState(50)
  
  // Качество звука
  const audioQualities: AudioQuality[] = [
    { id: 'low', name: 'Низкое (64 kbps)', bitrate: 64, sampleRate: 22050, extension: 'mp3', size: '2-5 MB' },
    { id: 'medium', name: 'Среднее (128 kbps)', bitrate: 128, sampleRate: 44100, extension: 'mp3', size: '4-10 MB' },
    { id: 'high', name: 'Высокое (320 kbps)', bitrate: 320, sampleRate: 48000, extension: 'mp3', size: '8-15 MB' },
    { id: 'lossless', name: 'Lossless (FLAC)', bitrate: 1411, sampleRate: 96000, extension: 'flac', size: '20-40 MB' },
    { id: 'auto', name: 'Авто (адаптивное)', bitrate: 0, sampleRate: 0, extension: 'mp3', size: 'Переменное' }
  ]
  
  // Пресеты эквалайзера
  const equalizerPresets: EqualizerPreset[] = [
    {
      id: 'flat',
      name: 'Плоский',
      settings: { bass: 0, mid: 0, treble: 0, gain: 0 },
      icon: <Square className="h-4 w-4" />
    },
    {
      id: 'bass_boost',
      name: 'Усиление баса',
      settings: { bass: 8, mid: 0, treble: -2, gain: 2 },
      icon: <Triangle className="h-4 w-4" />
    },
    {
      id: 'vocal_boost',
      name: 'Усиление вокала',
      settings: { bass: -2, mid: 6, treble: 2, gain: 0 },
      icon: <Mic className="h-4 w-4" />
    },
    {
      id: 'rock',
      name: 'Рок',
      settings: { bass: 5, mid: 2, treble: 5, gain: 3 },
      icon: <Zap className="h-4 w-4" />
    },
    {
      id: 'jazz',
      name: 'Джаз',
      settings: { bass: 3, mid: 3, treble: 2, gain: 1 },
      icon: <Music className="h-4 w-4" />
    },
    {
      id: 'classical',
      name: 'Классика',
      settings: { bass: 2, mid: 4, treble: 4, gain: 2 },
      icon: <Crown className="h-4 w-4" />
    }
  ]

  // Адаптивный URL для аудио
  const audioSrc = useCallback(() => {
    if (!currentTrack) return ''
    
    // Определяем качество звука
    let quality = audioQualities.find(q => q.id === selectedQuality)
    if (!quality || selectedQuality === 'auto') {
      quality = audioQualities[1] // Среднее качество по умолчанию
    }
    
    // Адаптируем под сеть
    const useLowQualityAudio = effectiveType === 'slow-2g' || effectiveType === '2g'
    
    if (useLowQualityAudio && quality.id !== 'low') {
      const lowQuality = audioQualities[0] // Низкое качество
      const parts = currentTrack.audioUrl.split('.')
      const extension = parts.pop()
      return `${parts.join('.')}_low.${extension}`
    }
    
    // Для lossless качества проверяем поддержку браузера
    if (quality.id === 'lossless' && !audioRef.current?.canPlayType('audio/flac')) {
      const highQuality = audioQualities[2] // Высокое качество mp3
      const parts = currentTrack.audioUrl.split('.')
      const extension = parts.pop()
      return `${parts.join('.')}_high.${extension}`
    }
    
    return currentTrack.audioUrl
  }, [currentTrack, selectedQuality, effectiveType])

  // Загрузка плейлистов
  useEffect(() => {
    const loadPlaylists = async () => {
      try {
        const userPlaylists = await getUserPlaylists()
        setPlaylists(userPlaylists)
      } catch (error) {
        console.error('Error loading playlists:', error)
      }
    }
    loadPlaylists()
  }, [getUserPlaylists])

  // Эффекты для аудио
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100
    }
  }, [volume, isMuted])

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Error playing audio:", e))
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying, currentTrack])

  // Обработчики событий
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime
      seekTo(time)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      useAudioStore.getState().setDuration(audioRef.current.duration)
    }
  }

  const handleSeek = (value: number[]) => {
    const newTime = value[0]
    seekTo(newTime)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
  }

  const handleQueueItemClick = (track: unknown, index: number) => {
    playTrack(track)
  }

  const playTrack = (track: unknown) => {
    play(track)
  }

  // Форматирование времени
  const formatQueueTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Форматирование чисел
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  // Создание плейлиста
  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return
    
    try {
      const playlist = await createPlaylist({
        name: newPlaylistName,
        description: newPlaylistDescription,
        isPublic: false
      })
      
      setPlaylists(prev => [...prev, playlist])
      setNewPlaylistName('')
      setNewPlaylistDescription('')
      setShowCreatePlaylist(false)
    } catch (error) {
      console.error('Error creating playlist:', error)
    }
  }

  // Добавление в плейлист
  const handleAddToPlaylist = async (playlistId: string) => {
    if (!currentTrack) return
    
    try {
      await addToPlaylist(playlistId, currentTrack)
      alert('Трек добавлен в плейлист')
    } catch (error) {
      console.error('Error adding to playlist:', error)
    }
  }

  // Применение пресета эквалайзера
  const applyEqualizerPreset = (preset: EqualizerPreset) => {
    setEqualizerSettings(preset.settings)
  }

  // Если нет текущего трека, не отображаем плеер
  if (!currentTrack) {
    return null
  }

  return (
    <>
      <audio
        ref={audioRef}
        src={audioSrc()}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={playNext}
        crossOrigin="anonymous"
      />
      
      {/* Основной плеер */}
      <Card className="fixed bottom-0 left-0 right-0 z-50 rounded-none border-t">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            {/* Информация о треке */}
            <div className="flex items-center space-x-3 min-w-[200px]">
              <Avatar className="h-12 w-12">
                <AvatarImage src={currentTrack.coverImage} />
                <AvatarFallback>{currentTrack.title.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h4 className="text-sm font-medium truncate">{currentTrack.title}</h4>
                <p className="text-xs text-muted-foreground truncate">
                  {currentTrack.artistName}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {currentTrack.genre}
                  </Badge>
                  {currentTrack.isExplicit && (
                    <Badge variant="destructive" className="text-xs">
                      18+
                    </Badge>
                  )}
                  {currentTrack.isPremium && (
                    <Badge variant="secondary" className="text-xs">
                      <Crown className="h-3 w-3 mr-1" />
                      Премиум
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Управление воспроизведением */}
            <div className="flex-1 flex flex-col items-center space-y-2">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleShuffle}
                  className={cn(shuffle && 'text-primary')}
                >
                  <Shuffle className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={playPrevious}>
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => isPlaying ? pause() : play(currentTrack)}
                  className="h-8 w-8"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="ghost" size="sm" onClick={playNext}>
                  <SkipForward className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRepeat(repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off')}
                  className={cn(repeat !== 'off' && 'text-primary')}
                >
                  <Repeat className={cn(
                    'h-4 w-4',
                    repeat === 'one' && 'rotate-180'
                  )} />
                </Button>
              </div>
              
              {/* Прогресс бар */}
              <div className="flex items-center space-x-2 w-full max-w-md">
                <span className="text-xs text-muted-foreground">
                  {formatTime(currentTime)}
                </span>
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={1}
                  className="flex-1"
                  onValueChange={handleSeek}
                />
                <span className="text-xs text-muted-foreground">
                  {formatTime(duration || 0)}
                </span>
              </div>
            </div>

            {/* Расширенные контролы */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleLike(currentTrack.id)}
              >
                <Heart className={cn(
                  'h-4 w-4',
                  isLiked ? 'fill-red-500 text-red-500' : ''
                )} />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQualitySettings(!showQualitySettings)}
              >
                <Settings className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEqualizer(!showEqualizer)}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              >
                <Waves className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQueue(!showQueue)}
              >
                <List className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVisualizer(!showVisualizer)}
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPlaylistManager(!showPlaylistManager)}
              >
                <ListMusic className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStats(!showStats)}
              >
                <TrendingUp className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={100}
                  step={1}
                  className="w-20"
                  onValueChange={handleVolumeChange}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Визуализатор аудио */}
      {showVisualizer && audioRef.current && (
        <div className="fixed bottom-20 left-4 right-4 z-40 bg-card border rounded-lg p-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">Визуализация</h4>
            <div className="flex items-center gap-2">
              <Select value={visualizerType} onValueChange={(value: unknown) => setVisualizerType(value)}>
                <SelectTrigger className="w-24 h-6">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bars">Столбцы</SelectItem>
                  <SelectItem value="wave">Волна</SelectItem>
                  <SelectItem value="circle">Круг</SelectItem>
                  <SelectItem value="particles">Частицы</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="ghost" onClick={() => setShowVisualizer(false)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <AudioVisualizer
            audioElement={audioRef.current}
            isPlaying={isPlaying}
            type={visualizerType as any}
            color={visualizerColor}
          />
        </div>
      )}

      {/* Менеджер плейлистов */}
      {showPlaylistManager && (
        <div className="fixed bottom-20 left-4 right-4 z-40 bg-card border rounded-lg p-4 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">Мои плейлисты</h3>
            <Button size="sm" onClick={() => setShowCreatePlaylist(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Создать
            </Button>
          </div>
          
          <div className="space-y-2">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                className="flex items-center space-x-3 p-2 rounded hover:bg-accent cursor-pointer"
                onClick={() => setCurrentPlaylistState(playlist)}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={playlist.coverImage} />
                  <AvatarFallback>
                    <ListMusic className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{playlist.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {playlist.tracks.length} треков • {formatNumber(playlist.playCount)} прослушиваний
                  </p>
                </div>
                <Button size="sm" variant="ghost">
                  <Play className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Статистика трека */}
      {showStats && (
        <div className="fixed bottom-20 left-4 right-4 z-40 bg-card border rounded-lg p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Headphones className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{formatNumber(currentTrack.playCount)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Прослушиваний</p>
            </div>
            <div>
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Heart className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{formatNumber(currentTrack.likeCount)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Лайков</p>
            </div>
            <div>
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{formatTime(currentTrack.duration)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Длительность</p>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground">Жанр:</span>
                <span className="ml-1 font-medium">{currentTrack.genre}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Битрейт:</span>
                <span className="ml-1 font-medium">{currentTrack.bitrate || '320'} kbps</span>
              </div>
              <div>
                <span className="text-muted-foreground">Год:</span>
                <span className="ml-1 font-medium">{currentTrack.year || '2024'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Лейбл:</span>
                <span className="ml-1 font-medium">{currentTrack.label || 'Независимый'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Настройки качества звука */}
      {showQualitySettings && (
        <div className="fixed bottom-20 left-4 right-4 z-40 bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">Качество звука</h3>
            <Button size="sm" variant="ghost" onClick={() => setShowQualitySettings(false)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="space-y-3">
            {audioQualities.map((quality) => (
              <div
                key={quality.id}
                className={`flex items-center justify-between p-2 rounded cursor-pointer ${
                  selectedQuality === quality.id ? 'bg-primary/10 border border-primary' : 'hover:bg-accent'
                }`}
                onClick={() => setSelectedQuality(quality.id)}
              >
                <div>
                  <p className="text-sm font-medium">{quality.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {quality.bitrate > 0 ? `${quality.bitrate} kbps` : 'Адаптивное'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{quality.size}</p>
                  {quality.id === selectedQuality && (
                    <CheckCircle className="h-4 w-4 text-green-500 mx-auto mt-1" />
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Состояние сети:</span>
              <div className="flex items-center gap-2">
                {effectiveType === '4g' && <SignalHigh className="h-3 w-3 text-green-500" />}
                {effectiveType === '3g' && <SignalMedium className="h-3 w-3 text-yellow-500" />}
                {effectiveType === '2g' && <SignalLow className="h-3 w-3 text-orange-500" />}
                {effectiveType === 'slow-2g' && <Signal className="h-3 w-3 text-red-500" />}
                <span className="text-muted-foreground">{effectiveType}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Эквалайзер */}
      {showEqualizer && (
        <div className="fixed bottom-20 left-4 right-4 z-40 bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">Эквалайзер</h3>
            <Button size="sm" variant="ghost" onClick={() => setShowEqualizer(false)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          {/* Пресеты */}
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">Пресеты:</p>
            <div className="flex gap-2 flex-wrap">
              {equalizerPresets.map((preset) => (
                <Button
                  key={preset.id}
                  size="sm"
                  variant="outline"
                  onClick={() => applyEqualizerPreset(preset)}
                  className="text-xs"
                >
                  {preset.icon}
                  <span className="ml-1">{preset.name}</span>
                </Button>
              ))}
            </div>
          </div>
          
          {/* Регуляторы */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Бас</span>
                <span className="text-xs text-muted-foreground">{equalizerSettings.bass} dB</span>
              </div>
              <Slider
                value={[equalizerSettings.bass]}
                max={12}
                min={-12}
                step={1}
                className="w-full"
                onValueChange={(value) => setEqualizerSettings(prev => ({ ...prev, bass: value[0] }))}
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Средние</span>
                <span className="text-xs text-muted-foreground">{equalizerSettings.mid} dB</span>
              </div>
              <Slider
                value={[equalizerSettings.mid]}
                max={12}
                min={-12}
                step={1}
                className="w-full"
                onValueChange={(value) => setEqualizerSettings(prev => ({ ...prev, mid: value[0] }))}
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Трель</span>
                <span className="text-xs text-muted-foreground">{equalizerSettings.treble} dB</span>
              </div>
              <Slider
                value={[equalizerSettings.treble]}
                max={12}
                min={-12}
                step={1}
                className="w-full"
                onValueChange={(value) => setEqualizerSettings(prev => ({ ...prev, treble: value[0] }))}
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Усиление</span>
                <span className="text-xs text-muted-foreground">{equalizerSettings.gain} dB</span>
              </div>
              <Slider
                value={[equalizerSettings.gain]}
                max={12}
                min={-12}
                step={1}
                className="w-full"
                onValueChange={(value) => setEqualizerSettings(prev => ({ ...prev, gain: value[0] }))}
              />
            </div>
          </div>
        </div>
      )}

      {/* Очередь воспроизведения */}
      {showQueue && (
        <div className="fixed bottom-16 left-0 right-0 z-40 bg-card border-t">
          <Card className="h-64">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Очередь воспроизведения</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground">
                    {queue.length} треков
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearQueue}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {queue.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    <div className="text-center">
                      <Music className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Очередь пуста</p>
                    </div>
                  </div>
                ) : (
                  queue.map((track, index) => (
                    <div
                      key={track.id}
                      className={cn(
                        "flex items-center space-x-3 p-2 rounded cursor-pointer hover:bg-accent",
                        index === currentQueueIndex && "bg-accent"
                      )}
                      onClick={() => handleQueueItemClick(track, index)}
                    >
                      <div className="flex items-center space-x-2">
                        {index === currentQueueIndex ? (
                          <Play className="h-3 w-3 text-primary" />
                        ) : (
                          <span className="text-xs text-muted-foreground w-4">
                            {index + 1}
                          </span>
                        )}
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={track.coverImage} />
                          <AvatarFallback className="text-xs">
                            {track.title.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {track.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {track.artistName}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground">
                          {formatQueueTime(track.duration)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeFromQueue(index)
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Диалог создания плейлиста */}
      <Dialog open={showCreatePlaylist} onOpenChange={setShowCreatePlaylist}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать плейлист</DialogTitle>
            <DialogDescription>
              Создайте новый плейлист для вашей музыки
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Название плейлиста</label>
              <Input
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Введите название плейлиста"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Описание</label>
              <Input
                value={newPlaylistDescription}
                onChange={(e) => setNewPlaylistDescription(e.target.value)}
                placeholder="Введите описание (опционально)"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreatePlaylist(false)}>
                Отмена
              </Button>
              <Button onClick={handleCreatePlaylist}>
                Создать
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
