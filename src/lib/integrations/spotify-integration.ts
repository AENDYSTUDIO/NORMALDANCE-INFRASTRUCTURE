/**
 * Интеграция с Spotify API для NormalDance
 * Синхронизация плейлистов, импорт/экспорт треков, аналитика
 */

import axios from 'axios'

interface SpotifyTrack {
  id: string
  name: string
  artists: { name: string }[]
  album: { name: string; images: { url: string }[] }
  duration_ms: number
  external_urls: { spotify: string }
  uri: string
}

interface SpotifyPlaylist {
  id: string
  name: string
  description: string
  images: { url: string }[]
  tracks: { total: number; items: { track: SpotifyTrack }[] }
  external_urls: { spotify: string }
  owner: { display_name: string; external_urls: { spotify: string } }
}

interface SpotifyArtist {
  id: string
  name: string
  images: { url: string }[]
  external_urls: { spotify: string }
  followers: { total: number }
  genres: string[]
  popularity: number
}

interface SpotifyUser {
  id: string
  display_name: string
  images: { url: string }[]
  external_urls: { spotify: string }
  followers: { total: number }
  product: string
}

interface SpotifySearchResult {
  tracks: { items: SpotifyTrack[] }
  artists: { items: SpotifyArtist[] }
  playlists: { items: SpotifyPlaylist[] }
}

class SpotifyIntegration {
  private clientId: string
  private clientSecret: string
  private redirectUri: string
  private accessToken: string | null = null
  private refreshToken: string | null = null
  private tokenExpiry: number = 0

  constructor(config: {
    clientId: string
    clientSecret: string
    redirectUri: string
  }) {
    this.clientId = config.clientId
    this.clientSecret = config.clientSecret
    this.redirectUri = config.redirectUri
  }

  /**
   * Авторизация через Spotify OAuth
   */
  getAuthorizationUrl(): string {
    const scope = [
      'playlist-read-private',
      'playlist-modify-public',
      'playlist-modify-private',
      'user-read-email',
      'user-read-private',
      'user-top-read',
      'user-library-read',
      'user-library-modify'
    ].join(' ')

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      scope,
      redirect_uri: this.redirectUri,
      state: Math.random().toString(36).substring(2, 15)
    })

    return `https://accounts.spotify.com/authorize?${params.toString()}`
  }

  /**
   * Обмен кода на access token
   */
  async exchangeCodeForToken(code: string): Promise<{ access_token: string; refresh_token: string }> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.redirectUri,
      client_id: this.clientId,
      client_secret: this.clientSecret
    })

    try {
      const response = await axios.post('https://accounts.spotify.com/api/token', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })

      this.accessToken = response.data.access_token
      this.refreshToken = response.data.refresh_token
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000)

      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token
      }
    } catch (error) {
      console.error('Failed to exchange code for token:', error)
      throw new Error('Failed to authenticate with Spotify')
    }
  }

  /**
   * Обновление access token
   */
  async refreshTokenIfNeeded(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available')
    }

    if (Date.now() < this.tokenExpiry - 60000) { // Обновляем за минуту до истечения
      return
    }

    try {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret
      })

      const response = await axios.post('https://accounts.spotify.com/api/token', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })

      this.accessToken = response.data.access_token
      this.refreshToken = response.data.refresh_token || this.refreshToken
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000)
    } catch (error) {
      console.error('Failed to refresh token:', error)
      throw new Error('Failed to refresh Spotify token')
    }
  }

  /**
   * Получение информации о пользователе
   */
  async getUserProfile(): Promise<SpotifyUser> {
    await this.refreshTokenIfNeeded()

    try {
      const response = await axios.get('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })

      return response.data
    } catch (error) {
      console.error('Failed to get user profile:', error)
      throw new Error('Failed to get Spotify user profile')
    }
  }

  /**
   * Поиск треков, артистов, альбомов
   */
  async search(query: string, types: ['track' | 'artist' | 'playlist'] = ['track'], limit = 10): Promise<SpotifySearchResult> {
    await this.refreshTokenIfNeeded()

    try {
      const typeString = types.join(',')
      const response = await axios.get('https://api.spotify.com/v1/search', {
        params: {
          q: query,
          type: typeString,
          limit
        },
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })

      return response.data
    } catch (error) {
      console.error('Failed to search:', error)
      throw new Error('Failed to search on Spotify')
    }
  }

  /**
   * Получение треков по ID
   */
  async getTracks(trackIds: string[]): Promise<SpotifyTrack[]> {
    await this.refreshTokenIfNeeded()

    try {
      const response = await axios.get('https://api.spotify.com/v1/tracks', {
        params: {
          ids: trackIds.join(',')
        },
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })

      return response.data.tracks.filter((track: unknown) => track !== null)
    } catch (error) {
      console.error('Failed to get tracks:', error)
      throw new Error('Failed to get tracks from Spotify')
    }
  }

  /**
   * Получение плейлистов пользователя
   */
  async getUserPlaylists(limit = 50): Promise<SpotifyPlaylist[]> {
    await this.refreshTokenIfNeeded()

    try {
      const response = await axios.get('https://api.spotify.com/v1/me/playlists', {
        params: {
          limit
        },
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })

      return response.data.items
    } catch (error) {
      console.error('Failed to get user playlists:', error)
      throw new Error('Failed to get Spotify playlists')
    }
  }

  /**
   * Получение плейлиста по ID
   */
  async getPlaylist(playlistId: string): Promise<SpotifyPlaylist> {
    await this.refreshTokenIfNeeded()

    try {
      const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })

      return response.data
    } catch (error) {
      console.error('Failed to get playlist:', error)
      throw new Error('Failed to get Spotify playlist')
    }
  }

  /**
   * Получение треков из плейлиста
   */
  async getPlaylistTracks(playlistId: string, limit = 100): Promise<SpotifyTrack[]> {
    await this.refreshTokenIfNeeded()

    try {
      const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        params: {
          limit
        },
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })

      return response.data.items.map((item: { track: unknown }) => item.track).filter((track: unknown) => track !== null)
    } catch (error) {
      console.error('Failed to get playlist tracks:', error)
      throw new Error('Failed to get Spotify playlist tracks')
    }
  }

  /**
   * Получение популярных треков пользователя
   */
  async getTopTracks(timeRange: 'short_term' | 'medium_term' | 'long_term' = 'short_term', limit = 20): Promise<SpotifyTrack[]> {
    await this.refreshTokenIfNeeded()

    try {
      const response = await axios.get('https://api.spotify.com/v1/me/top/tracks', {
        params: {
          time_range: timeRange,
          limit
        },
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })

      return response.data.items
    } catch (error) {
      console.error('Failed to get top tracks:', error)
      throw new Error('Failed to get Spotify top tracks')
    }
  }

  /**
   * Получение сохраненных треков
   */
  async getSavedTracks(limit = 50): Promise<{ track: SpotifyTrack; added_at: string }[]> {
    await this.refreshTokenIfNeeded()

    try {
      const response = await axios.get('https://api.spotify.com/v1/me/tracks', {
        params: {
          limit
        },
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })

      return response.data.items
    } catch (error) {
      console.error('Failed to get saved tracks:', error)
      throw new Error('Failed to get Spotify saved tracks')
    }
  }

  /**
   * Импорт плейлиста в NormalDance
   */
  async importPlaylistToNormalDance(playlistId: string, userId: string): Promise<any> {
    const playlist = await this.getPlaylist(playlistId)
    const tracks = await this.getPlaylistTracks(playlistId)

    // Здесь будет логика импорта в базу данных NormalDance
    // Для примера возвращаем структурированные данные
    return {
      playlist: {
        name: playlist.name,
        description: playlist.description,
        externalUrl: playlist.external_urls.spotify,
        image: playlist.images[0]?.url
      },
      tracks: tracks.map(track => ({
        spotifyId: track.id,
        name: track.name,
        artist: track.artists[0].name,
        duration: track.duration_ms,
        externalUrl: track.external_urls.spotify,
        image: track.album.images[0]?.url
      })),
      totalTracks: tracks.length
    }
  }

  /**
   * Экспорт плейлиста из NormalDance в Spotify
   */
  async exportPlaylistToSpotify(normalDancePlaylistId: string, name: string, description: string): Promise<string> {
    // Здесь будет логика экспорта в Spotify
    // Для примера возвращаем ID созданного плейлиста
    return 'spotify_playlist_id_' + Math.random().toString(36).substring(2, 15)
  }

  /**
   * Поиск похожих треков
   */
  async getRecommendations(seedTracks: string[], limit = 10): Promise<SpotifyTrack[]> {
    await this.refreshTokenIfNeeded()

    try {
      const response = await axios.get('https://api.spotify.com/v1/recommendations', {
        params: {
          seed_tracks: seedTracks.slice(0, 5).join(','), // Максимум 5 seed треков
          limit
        },
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })

      return response.data.tracks
    } catch (error) {
      console.error('Failed to get recommendations:', error)
      throw new Error('Failed to get Spotify recommendations')
    }
  }

  /**
   * Получение информации об артисте
   */
  async getArtist(artistId: string): Promise<SpotifyArtist> {
    await this.refreshTokenIfNeeded()

    try {
      const response = await axios.get(`https://api.spotify.com/v1/artists/${artistId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })

      return response.data
    } catch (error) {
      console.error('Failed to get artist:', error)
      throw new Error('Failed to get Spotify artist')
    }
  }

  /**
   * Получение треков артиста
   */
  async getArtistTracks(artistId: string, limit = 50): Promise<SpotifyTrack[]> {
    await this.refreshTokenIfNeeded()

    try {
      const response = await axios.get(`https://api.spotify.com/v1/artists/${artistId}/top-tracks`, {
        params: {
          country: 'US', // Можно сделать настраиваемым
          limit
        },
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })

      return response.data.tracks
    } catch (error) {
      console.error('Failed to get artist tracks:', error)
      throw new Error('Failed to get Spotify artist tracks')
    }
  }

  /**
   * Проверка доступности трека в Spotify
   */
  async checkTrackAvailability(trackId: string): Promise<boolean> {
    try {
      await this.getTracks([trackId])
      return true
    } catch {
      return false
    }
  }

  /**
   * Получение статистики прослушиваний из Spotify
   */
  async getListeningStats(timeRange: 'short_term' | 'medium_term' | 'long_term' = 'short_term'): Promise<{
    totalMinutes: number
    topGenres: { genre: string; count: number }[]
    topArtists: { artist: string; count: number }[]
    dailyAverage: number
  }> {
    const topTracks = await this.getTopTracks(timeRange)
    const topArtists = await this.getTopArtists(timeRange)

    // Расчет статистики
    const totalMinutes = topTracks.reduce((sum, track) => sum + (track.duration_ms / 1000 / 60), 0)
    const dailyAverage = totalMinutes / (timeRange === 'short_term' ? 7 : timeRange === 'medium_term' ? 30 : 365)

    // Анализ жанров (упрощенный)
    const genreCount: { [key: string]: number } = {}
    topArtists.forEach(artist => {
      artist.genres.forEach(genre => {
        genreCount[genre] = (genreCount[genre] || 0) + 1
      })
    })

    const topGenres = Object.entries(genreCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([genre, count]) => ({ genre, count }))

    return {
      totalMinutes: Math.round(totalMinutes),
      topGenres,
      topArtists: topArtists.slice(0, 10).map(artist => ({
        artist: artist.name,
        count: artist.popularity
      })),
      dailyAverage: Math.round(dailyAverage)
    }
  }

  /**
   * Получение топ артистов
   */
  async getTopArtists(timeRange: 'short_term' | 'medium_term' | 'long_term' = 'short_term', limit = 20): Promise<SpotifyArtist[]> {
    await this.refreshTokenIfNeeded()

    try {
      const response = await axios.get('https://api.spotify.com/v1/me/top/artists', {
        params: {
          time_range: timeRange,
          limit
        },
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })

      return response.data.items
    } catch (error) {
      console.error('Failed to get top artists:', error)
      throw new Error('Failed to get Spotify top artists')
    }
  }

  /**
   * Синхронизация плейлистов
   */
  async syncPlaylists(normalDanceUserId: string): Promise<{
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
      const spotifyPlaylists = await this.getUserPlaylists()
      // Здесь будет логика синхронизации с NormalDance
      // Для примера возвращаем симуляцию
      result.added = Math.floor(Math.random() * 5)
      result.updated = Math.floor(Math.random() * 3)
      result.removed = Math.floor(Math.random() * 2)
    } catch (error) {
      result.errors.push('Failed to sync playlists: ' + error)
    }

    return result
  }

  /**
   * Проверка статуса подключения
   */
  async isConnected(): Promise<boolean> {
    try {
      await this.getUserProfile()
      return true
    } catch {
      return false
    }
  }

  /**
   * Отключение от Spotify
   */
  disconnect(): void {
    this.accessToken = null
    this.refreshToken = null
    this.tokenExpiry = 0
  }

  /**
   * Получение URL для авторизации
   */
  getAuthUrl(): string {
    return this.getAuthorizationUrl()
  }
}

// Создание экземпляра интеграции
export function createSpotifyIntegration(config: {
  clientId: string
  clientSecret: string
  redirectUri: string
}): SpotifyIntegration {
  return new SpotifyIntegration(config)
}

// Хуки для использования в React компонентах
export function useSpotifyIntegration(config: {
  clientId: string
  clientSecret: string
  redirectUri: string
}) {
  const [spotify] = useState(() => createSpotifyIntegration(config))
  const [isConnected, setIsConnected] = useState(false)
  const [user, setUser] = useState<SpotifyUser | null>(null)
  const [loading, setLoading] = useState(false)

  // Проверка подключения
  const checkConnection = async () => {
    try {
      setLoading(true)
      const connected = await spotify.isConnected()
      setIsConnected(connected)
      if (connected) {
        const profile = await spotify.getUserProfile()
        setUser(profile)
      }
    } catch (error) {
      console.error('Failed to check Spotify connection:', error)
      setIsConnected(false)
    } finally {
      setLoading(false)
    }
  }

  // Инициализация проверки подключения
  useEffect(() => {
    checkConnection()
  }, [spotify])

  return {
    spotify,
    isConnected,
    user,
    loading,
    checkConnection,
    connect: () => spotify.getAuthUrl(),
    disconnect: () => {
      spotify.disconnect()
      setIsConnected(false)
      setUser(null)
    }
  }
}

export default SpotifyIntegration