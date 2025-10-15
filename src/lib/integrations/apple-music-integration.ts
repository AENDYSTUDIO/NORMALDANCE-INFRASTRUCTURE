/**
 * Интеграция с Apple Music API для NormalDance
 * Синхронизация библиотек, импорт/экспорт плейлистов, аналитика
 */

import axios from 'axios'

interface AppleMusicTrack {
  id: string
  attributes: {
    name: string
    artistName: string
    albumName: string
    durationInMillis: number
    artwork: { url: string }
    url: string
    playParams: { id: string }
  }
}

interface AppleMusicPlaylist {
  id: string
  attributes: {
    name: string
    description: { standard: string }
    artwork: { url: string }
    dateAdded: string
    lastAddedDate: string
    trackCount: number
    durationInMillis: number
    url: string
  }
}

interface AppleMusicArtist {
  id: string
  attributes: {
    name: string
    artwork: { url: string }
    url: string
    genreNames: string[]
  }
}

interface AppleMusicAlbum {
  id: string
  attributes: {
    name: string
    artistName: string
    artwork: { url: string }
    url: string
    trackCount: number
    durationInMillis: number
  }
}

interface AppleMusicSearchResult {
  songs: { data: AppleMusicTrack[] }
  albums: { data: AppleMusicAlbum[] }
  artists: { data: AppleMusicArtist[] }
  playlists: { data: AppleMusicPlaylist[] }
}

class AppleMusicIntegration {
  private developerToken: string
  private musicUserToken: string | null = null
  private storefront: string = 'us' // По умолчанию US Storefront

  constructor(config: {
    developerToken: string
    musicUserToken?: string
    storefront?: string
  }) {
    this.developerToken = config.developerToken
    this.musicUserToken = config.musicUserToken || null
    this.storefront = config.storefront || 'us'
  }

  /**
   * Установка токена пользователя
   */
  setMusicUserToken(token: string): void {
    this.musicUserToken = token
  }

  /**
   * Получение заголовков для запросов
   */
  private getHeaders(): { [key: string]: string } {
    const headers: { [key: string]: string } = {
      'Authorization': `Bearer ${this.developerToken}`,
      'Music-User-Token': this.musicUserToken || '',
      'Content-Type': 'application/json'
    }

    return headers
  }

  /**
   * Поиск треков, артистов, альбомов, плейлистов
   */
  async search(query: string, types: ['songs' | 'albums' | 'artists' | 'playlists'] = ['songs'], limit = 10): Promise<AppleMusicSearchResult> {
    try {
      const response = await axios.get('https://api.music.apple.com/v1/catalog/{storefront}/search'.replace('{storefront}', this.storefront), {
        params: {
          term: query,
          types: types.join(','),
          limit,
          storefront: this.storefront
        },
        headers: this.getHeaders()
      })

      return response.data
    } catch (error) {
      console.error('Failed to search on Apple Music:', error)
      throw new Error('Failed to search on Apple Music')
    }
  }

  /**
   * Получение трека по ID
   */
  async getTrack(trackId: string): Promise<AppleMusicTrack> {
    try {
      const response = await axios.get(`https://api.music.apple.com/v1/catalog/{storefront}/songs/{id}`.replace('{storefront}', this.storefront).replace('{id}', trackId), {
        headers: this.getHeaders()
      })

      return response.data.data[0]
    } catch (error) {
      console.error('Failed to get track:', error)
      throw new Error('Failed to get Apple Music track')
    }
  }

  /**
   * Получение треков по ID
   */
  async getTracks(trackIds: string[]): Promise<AppleMusicTrack[]> {
    try {
      const response = await axios.get(`https://api.music.apple.com/v1/catalog/{storefront}/songs`.replace('{storefront}', this.storefront), {
        params: {
          ids: trackIds.join(',')
        },
        headers: this.getHeaders()
      })

      return response.data.data
    } catch (error) {
      console.error('Failed to get tracks:', error)
      throw new Error('Failed to get Apple Music tracks')
    }
  }

  /**
   * Получение библиотеки пользователя
   */
  async getUserLibrary(limit = 50): Promise<{
    songs: AppleMusicTrack[]
    albums: AppleMusicAlbum[]
    playlists: AppleMusicPlaylist[]
  }> {
    if (!this.musicUserToken) {
      throw new Error('Music user token is required to access library')
    }

    try {
      const [songsResponse, albumsResponse, playlistsResponse] = await Promise.all([
        axios.get('https://api.music.apple.com/v1/me/library/songs', {
          params: { limit },
          headers: this.getHeaders()
        }),
        axios.get('https://api.music.apple.com/v1/me/library/albums', {
          params: { limit },
          headers: this.getHeaders()
        }),
        axios.get('https://api.music.apple.com/v1/me/library/playlists', {
          params: { limit },
          headers: this.getHeaders()
        })
      ])

      return {
        songs: songsResponse.data.data,
        albums: albumsResponse.data.data,
        playlists: playlistsResponse.data.data
      }
    } catch (error) {
      console.error('Failed to get user library:', error)
      throw new Error('Failed to get Apple Music library')
    }
  }

  /**
   * Получение плейлистов пользователя
   */
  async getUserPlaylists(limit = 50): Promise<AppleMusicPlaylist[]> {
    if (!this.musicUserToken) {
      throw new Error('Music user token is required to access playlists')
    }

    try {
      const response = await axios.get('https://api.music.apple.com/v1/me/library/playlists', {
        params: { limit },
        headers: this.getHeaders()
      })

      return response.data.data
    } catch (error) {
      console.error('Failed to get user playlists:', error)
      throw new Error('Failed to get Apple Music playlists')
    }
  }

  /**
   * Получение плейлиста по ID
   */
  async getPlaylist(playlistId: string): Promise<AppleMusicPlaylist> {
    try {
      const response = await axios.get(`https://api.music.apple.com/v1/catalog/{storefront}/playlists/{id}`.replace('{storefront}', this.storefront).replace('{id}', playlistId), {
        headers: this.getHeaders()
      })

      return response.data.data[0]
    } catch (error) {
      console.error('Failed to get playlist:', error)
      throw new Error('Failed to get Apple Music playlist')
    }
  }

  /**
   * Получение треков из плейлиста
   */
  async getPlaylistTracks(playlistId: string, limit = 100): Promise<AppleMusicTrack[]> {
    try {
      const response = await axios.get(`https://api.music.apple.com/v1/catalog/{storefront}/playlists/{id}/tracks`.replace('{storefront}', this.storefront).replace('{id}', playlistId), {
        params: { limit },
        headers: this.getHeaders()
      })

      return response.data.data
    } catch (error) {
      console.error('Failed to get playlist tracks:', error)
      throw new Error('Failed to get Apple Music playlist tracks')
    }
  }

  /**
   * Получение популярных треков
   */
  async getTopCharts(limit = 20): Promise<AppleMusicTrack[]> {
    try {
      const response = await axios.get(`https://api.music.apple.com/v1/catalog/{storefront}/songs`.replace('{storefront}', this.storefront), {
        params: {
          limit,
          'include[songs]': 'top'
        },
        headers: this.getHeaders()
      })

      return response.data.data
    } catch (error) {
      console.error('Failed to get top charts:', error)
      throw new Error('Failed to get Apple Music top charts')
    }
  }

  /**
   * Получение рекомендаций
   */
  async getRecommendations(seedTracks: string[], limit = 10): Promise<AppleMusicTrack[]> {
    try {
      const response = await axios.get(`https://api.music.apple.com/v1/catalog/{storefront}/songs/recommendations`.replace('{storefront}', this.storefront), {
        params: {
          seedTracks: seedTracks.slice(0, 5).join(','), // Максимум 5 seed треков
          limit
        },
        headers: this.getHeaders()
      })

      return response.data.data
    } catch (error) {
      console.error('Failed to get recommendations:', error)
      throw new Error('Failed to get Apple Music recommendations')
    }
  }

  /**
   * Получение информации об артисте
   */
  async getArtist(artistId: string): Promise<AppleMusicArtist> {
    try {
      const response = await axios.get(`https://api.music.apple.com/v1/catalog/{storefront}/artists/{id}`.replace('{storefront}', this.storefront).replace('{id}', artistId), {
        headers: this.getHeaders()
      })

      return response.data.data[0]
    } catch (error) {
      console.error('Failed to get artist:', error)
      throw new Error('Failed to get Apple Music artist')
    }
  }

  /**
   * Получение треков артиста
   */
  async getArtistTracks(artistId: string, limit = 50): Promise<AppleMusicTrack[]> {
    try {
      const response = await axios.get(`https://api.music.apple.com/v1/catalog/{storefront}/artists/{id}/songs`.replace('{storefront}', this.storefront).replace('{id}', artistId), {
        params: { limit },
        headers: this.getHeaders()
      })

      return response.data.data
    } catch (error) {
      console.error('Failed to get artist tracks:', error)
      throw new Error('Failed to get Apple Music artist tracks')
    }
  }

  /**
   * Получение альбомов артиста
   */
  async getArtistAlbums(artistId: string, limit = 20): Promise<AppleMusicAlbum[]> {
    try {
      const response = await axios.get(`https://api.music.apple.com/v1/catalog/{storefront}/artists/{id}/albums`.replace('{storefront}', this.storefront).replace('{id}', artistId), {
        params: { limit },
        headers: this.getHeaders()
      })

      return response.data.data
    } catch (error) {
      console.error('Failed to get artist albums:', error)
      throw new Error('Failed to get Apple Music artist albums')
    }
  }

  /**
   * Получение альбома по ID
   */
  async getAlbum(albumId: string): Promise<AppleMusicAlbum> {
    try {
      const response = await axios.get(`https://api.music.apple.com/v1/catalog/{storefront}/albums/{id}`.replace('{storefront}', this.storefront).replace('{id}', albumId), {
        headers: this.getHeaders()
      })

      return response.data.data[0]
    } catch (error) {
      console.error('Failed to get album:', error)
      throw new Error('Failed to get Apple Music album')
    }
  }

  /**
   * Получение треков из альбома
   */
  async getAlbumTracks(albumId: string, limit = 50): Promise<AppleMusicTrack[]> {
    try {
      const response = await axios.get(`https://api.music.apple.com/v1/catalog/{storefront}/albums/{id}/tracks`.replace('{storefront}', this.storefront).replace('{id}', albumId), {
        params: { limit },
        headers: this.getHeaders()
      })

      return response.data.data
    } catch (error) {
      console.error('Failed to get album tracks:', error)
      throw new Error('Failed to get Apple Music album tracks')
    }
  }

  /**
   * Проверка доступности трека
   */
  async checkTrackAvailability(trackId: string): Promise<boolean> {
    try {
      await this.getTrack(trackId)
      return true
    } catch {
      return false
    }
  }

  /**
   * Получение статистики прослушиваний
   */
  async getListeningStats(): Promise<{
    totalMinutes: number
    topGenres: { genre: string; count: number }[]
    topArtists: { artist: string; count: number }[]
    dailyAverage: number
  }> {
    if (!this.musicUserToken) {
      throw new Error('Music user token is required to get listening stats')
    }

    try {
      const library = await this.getUserLibrary(100)
      
      // Расчет статистики
      const totalMinutes = library.songs.reduce((sum, song) => sum + (song.attributes.durationInMillis / 1000 / 60), 0)
      const dailyAverage = totalMinutes / 30 // Упрощенный расчет

      // Анализ жанров (упрощенный)
      const genreCount: { [key: string]: number } = {}
      library.songs.forEach(song => {
        // В реальном приложении здесь будет более сложная логика определения жанров
        const genre = 'Pop' // Заглушка
        genreCount[genre] = (genreCount[genre] || 0) + 1
      })

      const topGenres = Object.entries(genreCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([genre, count]) => ({ genre, count }))

      // Топ артистов
      const artistCount: { [key: string]: number } = {}
      library.songs.forEach(song => {
        const artist = song.attributes.artistName
        artistCount[artist] = (artistCount[artist] || 0) + 1
      })

      const topArtists = Object.entries(artistCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([artist, count]) => ({ artist, count }))

      return {
        totalMinutes: Math.round(totalMinutes),
        topGenres,
        topArtists,
        dailyAverage: Math.round(dailyAverage)
      }
    } catch (error) {
      console.error('Failed to get listening stats:', error)
      throw new Error('Failed to get Apple Music listening stats')
    }
  }

  /**
   * Импорт плейлиста в NormalDance
   */
  async importPlaylistToNormalDance(playlistId: string, userId: string): Promise<any> {
    const playlist = await this.getPlaylist(playlistId)
    const tracks = await this.getPlaylistTracks(playlistId)

    // Здесь будет логика импорта в базу данных NormalDance
    return {
      playlist: {
        name: playlist.attributes.name,
        description: playlist.attributes.description.standard,
        externalUrl: playlist.attributes.url,
        image: playlist.attributes.artwork.url
      },
      tracks: tracks.map(track => ({
        appleMusicId: track.id,
        name: track.attributes.name,
        artist: track.attributes.artistName,
        duration: track.attributes.durationInMillis,
        externalUrl: track.attributes.url,
        image: track.attributes.artwork.url
      })),
      totalTracks: tracks.length
    }
  }

  /**
   * Синхронизация библиотеки
   */
  async syncLibrary(normalDanceUserId: string): Promise<{
    added: number
    updated: number
    removed: number
    errors: string[]
  }> {
    const result = {
      added: 0,
      updated: 0,
      removed: 0,
      errors: [] as string[]
    }

    try {
      if (!this.musicUserToken) {
        throw new Error('Music user token is required')
      }

      const library = await this.getUserLibrary(100)
      // Здесь будет логика синхронизации с NormalDance
      // Для примера возвращаем симуляцию
      result.added = Math.floor(Math.random() * 5)
      result.updated = Math.floor(Math.random() * 3)
      result.removed = Math.floor(Math.random() * 2)
    } catch (error) {
      result.errors.push('Failed to sync library: ' + error)
    }

    return result
  }

  /**
   * Проверка статуса подключения
   */
  async isConnected(): Promise<boolean> {
    try {
      if (!this.musicUserToken) {
        return false
      }

      await this.getUserLibrary(1)
      return true
    } catch {
      return false
    }
  }

  /**
   * Получение доступных storefronts
   */
  async getAvailableStorefronts(): Promise<{ id: string; name: string }[]> {
    try {
      const response = await axios.get('https://api.music.apple.com/v1/catalog/storefronts', {
        headers: this.getHeaders()
      })

      return response.data.data.map((storefront: { id: string; attributes: { name: string } }) => ({
        id: storefront.id,
        name: storefront.attributes.name
      }))
    } catch (error) {
      console.error('Failed to get storefronts:', error)
      throw new Error('Failed to get Apple Music storefronts')
    }
  }

  /**
   * Установка storefront
   */
  setStorefront(storefront: string): void {
    this.storefront = storefront
  }

  /**
   * Получение текущего storefront
   */
  getStorefront(): string {
    return this.storefront
  }

  /**
   * Получение URL для авторизации
   */
  getAuthUrl(): string {
    // Apple Music использует токены разработчика и токены пользователей
    // В реальном приложении здесь будет логика получения токена пользователя
    return 'https://music.apple.com'
  }
}

// Создание экземпляра интеграции
export function createAppleMusicIntegration(config: {
  developerToken: string
  musicUserToken?: string
  storefront?: string
}): AppleMusicIntegration {
  return new AppleMusicIntegration(config)
}

// Хуки для использования в React компонентах
export function useAppleMusicIntegration(config: {
  developerToken: string
  musicUserToken?: string
  storefront?: string
}) {
  const [appleMusic] = useState(() => createAppleMusicIntegration(config))
  const [isConnected, setIsConnected] = useState(false)
  const [userLibrary, setUserLibrary] = useState<{
    songs: AppleMusicTrack[]
    albums: AppleMusicAlbum[]
    playlists: AppleMusicPlaylist[]
  } | null>(null)
  const [loading, setLoading] = useState(false)

  // Проверка подключения
  const checkConnection = async () => {
    try {
      setLoading(true)
      const connected = await appleMusic.isConnected()
      setIsConnected(connected)
      if (connected) {
        const library = await appleMusic.getUserLibrary(20)
        setUserLibrary(library)
      }
    } catch (error) {
      console.error('Failed to check Apple Music connection:', error)
      setIsConnected(false)
      setUserLibrary(null)
    } finally {
      setLoading(false)
    }
  }

  // Инициализация проверки подключения
  useEffect(() => {
    checkConnection()
  }, [appleMusic])

  return {
    appleMusic,
    isConnected,
    userLibrary,
    loading,
    checkConnection,
    connect: () => appleMusic.getAuthUrl(),
    disconnect: () => {
      appleMusic.setMusicUserToken('')
      setIsConnected(false)
      setUserLibrary(null)
    }
  }
}

export default AppleMusicIntegration