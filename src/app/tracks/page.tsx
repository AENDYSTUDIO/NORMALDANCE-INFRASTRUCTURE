'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Badge } from '@/components/ui'
import { 
  Search, 
  Filter, 
  Play, 
  Clock, 
  Heart, 
  TrendingUp,
  Grid,
  List,
  Music,
  Users,
  Calendar
} from '@/components/icons'
import { TrackCard } from '@/components/audio/track-card'
import { formatNumber, formatTime } from '@/lib/utils'
import { FixedSizeList as VirtualList } from 'react-window'

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
  coverImage: string
  isExplicit: boolean
  isPublished: boolean
  createdAt: string
  updatedAt: string
  artist: {
    id: string
    username: string
    displayName: string
    avatar: string
  }
}

interface FilterOptions {
  search: string
  genre: string
  sortBy: 'createdAt' | 'playCount' | 'likeCount'
  sortOrder: 'asc' | 'desc'
  viewMode: 'grid' | 'list'
}

export default function TracksPage() {
  const { data: session, status } = useSession()
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    genre: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    viewMode: 'grid'
  })

  useEffect(() => {
    fetchTracks()
  }, [filters])

  // Мемоизируем функцию fetchTracks для предотвращения лишних ререндеров
  const fetchTracks = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search: filters.search,
        genre: filters.genre,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      })

      const response = await fetch(`/api/tracks?${params}`)
      if (response.ok) {
        const data = await response.json()
        setTracks(data.tracks)
      }
    } catch (error) {
      console.error('Error fetching tracks:', error)
    } finally {
      setLoading(false)
    }
  }, [filters]) // Добавляем зависимость filters для корректной работы useCallback

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }))
  }

  const handleGenreFilter = (genre: string) => {
    setFilters(prev => ({ ...prev, genre }))
  }

  const handleSort = (sortBy: 'createdAt' | 'playCount' | 'likeCount') => {
    setFilters(prev => ({ 
      ...prev, 
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'desc' ? 'asc' : 'desc'
    }))
  }

  const toggleViewMode = () => {
    setFilters(prev => ({ 
      ...prev, 
      viewMode: prev.viewMode === 'grid' ? 'list' : 'grid'
    }))
  }

  // Мемоизируем отфильтрованные треки для предотвращения повторных вычислений при ререндере
  const filteredTracks = useMemo(() => {
    if (!tracks.length) return [];
    
    // Фильтрация по поиску
    let result = tracks;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(track => 
        track.title.toLowerCase().includes(searchLower) || 
        track.artistName.toLowerCase().includes(searchLower)
      );
    }
    
    // Фильтрация по жанру
    if (filters.genre) {
      result = result.filter(track => track.genre === filters.genre);
    }
    
    // Сортировка
    return [...result].sort((a, b) => {
      const aValue = a[filters.sortBy];
      const bValue = b[filters.sortBy];
      
      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [tracks, filters]);

  const genres = [
    'Все жанры',
    'Pop',
    'Rock',
    'Hip-Hop',
    'Electronic',
    'Jazz',
    'Classical',
    'R&B',
    'Country',
    'Folk'
  ]

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Музыкальные треки</h1>
            <p className="text-muted-foreground">
              Исследуйте и слушайте музыку от артистов NormalDance
            </p>
          </div>
          <Button variant="outline" onClick={toggleViewMode}>
            {filters.viewMode === 'grid' ? (
              <>
                <List className="h-4 w-4 mr-2" />
                Список
              </>
            ) : (
              <>
                <Grid className="h-4 w-4 mr-2" />
                Сетка
              </>
            )}
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск треков, артистов..."
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {genres.map((genre) => (
              <Button
                key={genre}
                variant={filters.genre === genre ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleGenreFilter(genre === 'Все жанры' ? '' : genre)}
              >
                {genre}
              </Button>
            ))}
          </div>
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-4 mt-4">
          <span className="text-sm text-muted-foreground">Сортировка:</span>
          <Button
            variant={filters.sortBy === 'createdAt' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleSort('createdAt')}
          >
            <Calendar className="h-4 w-4 mr-1" />
            Новые
          </Button>
          <Button
            variant={filters.sortBy === 'playCount' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleSort('playCount')}
          >
            <TrendingUp className="h-4 w-4 mr-1" />
            Популярные
          </Button>
          <Button
            variant={filters.sortBy === 'likeCount' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleSort('likeCount')}
          >
            <Heart className="h-4 w-4 mr-1" />
            Лайки
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <Music className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{tracks.length}</p>
            <p className="text-xs text-muted-foreground">Треков</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">50+</p>
            <p className="text-xs text-muted-foreground">Артистов</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Play className="h-6 w-6 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold">
              {formatNumber(useMemo(() => tracks.reduce((sum, track) => sum + track.playCount, 0), [tracks]))}
            </p>
            <p className="text-xs text-muted-foreground">Прослушиваний</p>
          </CardContent>
        </Card>
      </div>

      {/* Tracks Grid/List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-muted rounded-t-lg"></div>
              <CardContent className="p-4 space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="h-8 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredTracks.length === 0 ? (
        <div className="text-center py-12">
          <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Треки не найдены</h3>
          <p className="text-muted-foreground mb-4">
            Попробуйте изменить параметры поиска или фильтры
          </p>
          <Button onClick={() => setFilters(prev => ({ ...prev, search: '', genre: '' }))}>
            Сбросить фильтры
          </Button>
        </div>
      ) : (
        <>
          {filters.viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTracks.map((track) => (
                <TrackCard key={track.id} track={track} />
              ))}
            </div>
          ) : (
            <div className="space-y-0">
              <VirtualList
                height={600}
                width="100%"
                itemCount={filteredTracks.length}
                itemSize={80}
                className="scrollbar-thin"
              >
                {({ index, style }) => (
                  <div style={style} className="py-1">
                    <TrackCard key={filteredTracks[index].id} track={filteredTracks[index]} />
                  </div>
                )}
              </VirtualList>
            </div>
          )}
        </>
      )}

      {/* Load More */}
      {tracks.length > 0 && !loading && (
        <div className="text-center mt-8">
          <Button variant="outline" size="lg">
            Загрузить еще
          </Button>
        </div>
      )}
    </div>
  )
}