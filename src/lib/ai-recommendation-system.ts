import { Track } from '@/store/use-audio-store'

export interface AudioFeatures {
  tempo: number
  key: string
  mode: string
  energy: number
  danceability: number
  valence: number
  acousticness: number
  instrumentalness: number
  liveness: number
  speechiness: number
}

export interface UserProfile {
  id: string
  preferences: {
    genres: string[]
    artists: string[]
    moods: string[]
    energyLevel: number
    danceability: number
    valence: number
  }
  listeningHistory: Track[]
  likedTracks: Track[]
  skippedTracks: Track[]
  playlists: unknown[]
  createdAt: Date
  updatedAt: Date
}

export interface RecommendationContext {
  currentTrack?: Track
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
  dayOfWeek: 'weekday' | 'weekend'
  weather?: 'sunny' | 'cloudy' | 'rainy' | 'snowy'
  activity?: 'workout' | 'study' | 'relax' | 'party' | 'commute'
  socialContext?: 'alone' | 'with_friends' | 'with_family'
}

export interface Recommendation {
  track: Track
  score: number
  reasons: string[]
  confidence: number
  features: AudioFeatures
}

export class AIRecommendationSystem {
  private userProfiles: Map<string, UserProfile> = new Map()
  private trackFeatures: Map<string, AudioFeatures> = new Map()
  private model: unknown = null

  constructor() {
    this.initializeModel()
  }

  // Инициализация модели машинного обучения
  private async initializeModel() {
    try {
      // В реальном проекте здесь будет загрузка предобученной модели
      // или инициализация TensorFlow.js модели
      this.model = {
        predict: (features: number[]) => {
          // Простая модель для демонстрации
          return this.simpleRecommendationModel(features)
        }
      }
    } catch (error) {
      console.error('Failed to initialize AI model:', error)
    }
  }

  // Простая модель рекомендаций для демонстрации
  private simpleRecommendationModel(features: number[]): number {
    // Веса для различных характеристик
    const weights = [0.2, 0.15, 0.1, 0.15, 0.1, 0.1, 0.05, 0.05, 0.05, 0.05]
    
    let score = 0
    for (let i = 0; i < Math.min(features.length, weights.length); i++) {
      score += features[i] * weights[i]
    }
    
    return Math.max(0, Math.min(1, score))
  }

  // Обновление профиля пользователя
  async updateUserProfile(userId: string, profile: Partial<UserProfile>): Promise<void> {
    const existingProfile = this.userProfiles.get(userId) || {
      id: userId,
      preferences: {
        genres: [],
        artists: [],
        moods: [],
        energyLevel: 0.5,
        danceability: 0.5,
        valence: 0.5
      },
      listeningHistory: [],
      likedTracks: [],
      skippedTracks: [],
      playlists: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const updatedProfile = {
      ...existingProfile,
      ...profile,
      updatedAt: new Date()
    }

    this.userProfiles.set(userId, updatedProfile)
    
    // Сохраняем в localStorage для демонстрации
    localStorage.setItem(`user_profile_${userId}`, JSON.stringify(updatedProfile))
  }

  // Получение профиля пользователя
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    let profile = this.userProfiles.get(userId)
    
    if (!profile) {
      // Пытаемся загрузить из localStorage
      const stored = localStorage.getItem(`user_profile_${userId}`)
      if (stored) {
        profile = JSON.parse(stored)
        this.userProfiles.set(userId, profile)
      }
    }
    
    return profile || null
  }

  // Анализ трека и извлечение характеристик
  async analyzeTrack(track: Track): Promise<AudioFeatures> {
    const cacheKey = `track_features_${track.id}`
    const cached = localStorage.getItem(cacheKey)
    
    if (cached) {
      return JSON.parse(cached)
    }

    // В реальном проекте здесь будет анализ аудио файла
    // Для демонстрации генерируем случайные характеристики
    const features: AudioFeatures = {
      tempo: this.generateRandomTempo(track.genre),
      key: this.generateRandomKey(),
      mode: Math.random() > 0.5 ? 'major' : 'minor',
      energy: this.generateRandomEnergy(track.genre),
      danceability: this.generateRandomDanceability(track.genre),
      valence: this.generateRandomValence(track.genre),
      acousticness: this.generateRandomAcousticness(track.genre),
      instrumentalness: this.generateRandomInstrumentalness(track.genre),
      liveness: this.generateRandomLiveness(track.genre),
      speechiness: this.generateRandomSpeechiness(track.genre)
    }

    this.trackFeatures.set(track.id, features)
    localStorage.setItem(cacheKey, JSON.stringify(features))
    
    return features
  }

  // Генерация рекомендаций
  async generateRecommendations(
    userId: string,
    context: RecommendationContext,
    limit: number = 10
  ): Promise<Recommendation[]> {
    const userProfile = await this.getUserProfile(userId)
    if (!userProfile) {
      throw new Error('User profile not found')
    }

    // Получаем все доступные треки
    const availableTracks = await this.getAvailableTracks()
    
    // Фильтруем треки на основе контекста
    const filteredTracks = this.filterTracksByContext(availableTracks, context)
    
    // Вычисляем оценки для каждого трека
    const recommendations: Recommendation[] = []
    
    for (const track of filteredTracks) {
      const features = await this.analyzeTrack(track)
      const score = await this.calculateRecommendationScore(
        track,
        features,
        userProfile,
        context
      )
      
      if (score > 0.3) { // Минимальный порог
        recommendations.push({
          track,
          score,
          reasons: this.generateReasons(track, features, userProfile, context),
          confidence: this.calculateConfidence(features, userProfile),
          features
        })
      }
    }
    
    // Сортируем по оценке и возвращаем топ-N
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  // Вычисление оценки рекомендации
  private async calculateRecommendationScore(
    track: Track,
    features: AudioFeatures,
    userProfile: UserProfile,
    context: RecommendationContext
  ): Promise<number> {
    let score = 0
    
    // Базовые предпочтения пользователя
    score += this.calculateGenreScore(track.genre, userProfile.preferences.genres) * 0.3
    score += this.calculateArtistScore(track.artistName, userProfile.preferences.artists) * 0.2
    score += this.calculateFeatureScore(features, userProfile.preferences) * 0.3
    
    // Контекстные факторы
    score += this.calculateContextScore(features, context) * 0.2
    
    return Math.max(0, Math.min(1, score))
  }

  // Оценка по жанру
  private calculateGenreScore(trackGenre: string, userGenres: string[]): number {
    if (userGenres.includes(trackGenre)) {
      return 1.0
    }
    
    // Проверяем похожие жанры
    const similarGenres = this.getSimilarGenres(trackGenre)
    for (const genre of similarGenres) {
      if (userGenres.includes(genre)) {
        return 0.7
      }
    }
    
    return 0.1
  }

  // Оценка по артисту
  private calculateArtistScore(trackArtist: string, userArtists: string[]): number {
    if (userArtists.includes(trackArtist)) {
      return 1.0
    }
    
    // Проверяем похожих артистов
    const similarArtists = this.getSimilarArtists(trackArtist)
    for (const artist of similarArtists) {
      if (userArtists.includes(artist)) {
        return 0.8
      }
    }
    
    return 0.2
  }

  // Оценка по характеристикам
  private calculateFeatureScore(features: AudioFeatures, preferences: UserProfile['preferences']): number {
    let score = 0
    
    // Энергия
    score += (1 - Math.abs(features.energy - preferences.energyLevel)) * 0.3
    
    // Танцевальность
    score += (1 - Math.abs(features.danceability - preferences.danceability)) * 0.3
    
    // Валентность
    score += (1 - Math.abs(features.valence - preferences.valence)) * 0.4
    
    return score
  }

  // Оценка по контексту
  private calculateContextScore(features: AudioFeatures, context: RecommendationContext): number {
    let score = 0
    
    // Время дня
    switch (context.timeOfDay) {
      case 'morning':
        score += features.energy > 0.6 ? 0.3 : 0.1
        break
      case 'afternoon':
        score += features.energy > 0.4 && features.energy < 0.8 ? 0.3 : 0.1
        break
      case 'evening':
        score += features.energy < 0.6 ? 0.3 : 0.1
        break
      case 'night':
        score += features.energy < 0.4 ? 0.3 : 0.1
        break
    }
    
    // День недели
    if (context.dayOfWeek === 'weekend') {
      score += features.danceability > 0.6 ? 0.2 : 0.1
    } else {
      score += features.energy < 0.7 ? 0.2 : 0.1
    }
    
    // Активность
    if (context.activity) {
      switch (context.activity) {
        case 'workout':
          score += features.energy > 0.7 && features.danceability > 0.6 ? 0.3 : 0.1
          break
        case 'study':
          score += features.energy < 0.4 && features.instrumentalness > 0.5 ? 0.3 : 0.1
          break
        case 'relax':
          score += features.energy < 0.5 && features.valence > 0.6 ? 0.3 : 0.1
          break
        case 'party':
          score += features.energy > 0.7 && features.danceability > 0.7 ? 0.3 : 0.1
          break
        case 'commute':
          score += features.energy > 0.3 && features.energy < 0.7 ? 0.3 : 0.1
          break
      }
    }
    
    return score
  }

  // Генерация причин рекомендации
  private generateReasons(
    track: Track,
    features: AudioFeatures,
    userProfile: UserProfile,
    context: RecommendationContext
  ): string[] {
    const reasons: string[] = []
    
    // Жанр
    if (userProfile.preferences.genres.includes(track.genre)) {
      reasons.push(`Похож на ваш любимый жанр ${track.genre}`)
    }
    
    // Артист
    if (userProfile.preferences.artists.includes(track.artistName)) {
      reasons.push(`От вашего любимого артиста ${track.artistName}`)
    }
    
    // Характеристики
    if (features.energy > 0.7) {
      reasons.push('Высокая энергия')
    } else if (features.energy < 0.3) {
      reasons.push('Спокойная музыка')
    }
    
    if (features.danceability > 0.7) {
      reasons.push('Танцевальная')
    }
    
    if (features.valence > 0.7) {
      reasons.push('Позитивная')
    } else if (features.valence < 0.3) {
      reasons.push('Меланхоличная')
    }
    
    // Контекст
    if (context.timeOfDay === 'morning' && features.energy > 0.6) {
      reasons.push('Отлично для утра')
    }
    
    if (context.activity === 'workout' && features.energy > 0.7) {
      reasons.push('Идеально для тренировки')
    }
    
    return reasons
  }

  // Вычисление уверенности
  private calculateConfidence(features: AudioFeatures, userProfile: UserProfile): number {
    let confidence = 0.5
    
    // Если у пользователя есть история прослушивания
    if (userProfile.listeningHistory.length > 0) {
      confidence += 0.2
    }
    
    // Если у пользователя есть лайки
    if (userProfile.likedTracks.length > 0) {
      confidence += 0.2
    }
    
    // Если характеристики трека хорошо определены
    const featureVariance = this.calculateFeatureVariance(features)
    if (featureVariance < 0.1) {
      confidence += 0.1
    }
    
    return Math.max(0, Math.min(1, confidence))
  }

  // Вычисление дисперсии характеристик
  private calculateFeatureVariance(features: AudioFeatures): number {
    const values = [
      features.energy,
      features.danceability,
      features.valence,
      features.acousticness,
      features.instrumentalness,
      features.liveness,
      features.speechiness
    ]
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length
    
    return variance
  }

  // Фильтрация треков по контексту
  private filterTracksByContext(tracks: Track[], context: RecommendationContext): Track[] {
    return tracks.filter(track => {
      // Базовые фильтры
      if (context.currentTrack && track.id === context.currentTrack.id) {
        return false
      }
      
      // Время дня
      if (context.timeOfDay === 'night' && track.isExplicit) {
        return false
      }
      
      // Активность
      if (context.activity === 'study' && track.isExplicit) {
        return false
      }
      
      return true
    })
  }

  // Получение доступных треков
  private async getAvailableTracks(): Promise<Track[]> {
    // В реальном проекте здесь будет запрос к API
    // Для демонстрации возвращаем пустой массив
    return []
  }

  // Получение похожих жанров
  private getSimilarGenres(genre: string): string[] {
    const genreMap: { [key: string]: string[] } = {
      'pop': ['dance', 'electronic', 'indie pop'],
      'rock': ['alternative', 'indie rock', 'punk'],
      'hip-hop': ['rap', 'trap', 'r&b'],
      'electronic': ['dance', 'techno', 'house'],
      'jazz': ['blues', 'soul', 'funk'],
      'classical': ['orchestral', 'chamber', 'opera']
    }
    
    return genreMap[genre] || []
  }

  // Получение похожих артистов
  private getSimilarArtists(artist: string): string[] {
    // В реальном проекте здесь будет запрос к API музыкальных данных
    // Для демонстрации возвращаем пустой массив
    return []
  }

  // Генерация случайных характеристик для демонстрации
  private generateRandomTempo(genre: string): number {
    const tempoRanges: { [key: string]: [number, number] } = {
      'pop': [100, 140],
      'rock': [120, 160],
      'hip-hop': [80, 120],
      'electronic': [120, 180],
      'jazz': [60, 120],
      'classical': [40, 120]
    }
    
    const range = tempoRanges[genre] || [80, 140]
    return range[0] + Math.random() * (range[1] - range[0])
  }

  private generateRandomKey(): string {
    const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    return keys[Math.floor(Math.random() * keys.length)]
  }

  private generateRandomEnergy(genre: string): number {
    const energyRanges: { [key: string]: [number, number] } = {
      'pop': [0.6, 0.9],
      'rock': [0.7, 1.0],
      'hip-hop': [0.5, 0.8],
      'electronic': [0.8, 1.0],
      'jazz': [0.3, 0.7],
      'classical': [0.2, 0.6]
    }
    
    const range = energyRanges[genre] || [0.4, 0.8]
    return range[0] + Math.random() * (range[1] - range[0])
  }

  private generateRandomDanceability(genre: string): number {
    const danceabilityRanges: { [key: string]: [number, number] } = {
      'pop': [0.6, 0.9],
      'rock': [0.4, 0.7],
      'hip-hop': [0.7, 0.9],
      'electronic': [0.8, 1.0],
      'jazz': [0.3, 0.6],
      'classical': [0.2, 0.5]
    }
    
    const range = danceabilityRanges[genre] || [0.4, 0.8]
    return range[0] + Math.random() * (range[1] - range[0])
  }

  private generateRandomValence(genre: string): number {
    const valenceRanges: { [key: string]: [number, number] } = {
      'pop': [0.6, 0.9],
      'rock': [0.4, 0.8],
      'hip-hop': [0.3, 0.7],
      'electronic': [0.5, 0.9],
      'jazz': [0.4, 0.8],
      'classical': [0.3, 0.7]
    }
    
    const range = valenceRanges[genre] || [0.4, 0.8]
    return range[0] + Math.random() * (range[1] - range[0])
  }

  private generateRandomAcousticness(genre: string): number {
    const acousticnessRanges: { [key: string]: [number, number] } = {
      'pop': [0.1, 0.4],
      'rock': [0.2, 0.6],
      'hip-hop': [0.1, 0.3],
      'electronic': [0.0, 0.2],
      'jazz': [0.6, 0.9],
      'classical': [0.8, 1.0]
    }
    
    const range = acousticnessRanges[genre] || [0.2, 0.6]
    return range[0] + Math.random() * (range[1] - range[0])
  }

  private generateRandomInstrumentalness(genre: string): number {
    const instrumentalnessRanges: { [key: string]: [number, number] } = {
      'pop': [0.0, 0.2],
      'rock': [0.1, 0.4],
      'hip-hop': [0.0, 0.1],
      'electronic': [0.2, 0.8],
      'jazz': [0.3, 0.7],
      'classical': [0.8, 1.0]
    }
    
    const range = instrumentalnessRanges[genre] || [0.1, 0.5]
    return range[0] + Math.random() * (range[1] - range[0])
  }

  private generateRandomLiveness(genre: string): number {
    const livenessRanges: { [key: string]: [number, number] } = {
      'pop': [0.1, 0.4],
      'rock': [0.3, 0.7],
      'hip-hop': [0.2, 0.5],
      'electronic': [0.1, 0.3],
      'jazz': [0.4, 0.8],
      'classical': [0.6, 0.9]
    }
    
    const range = livenessRanges[genre] || [0.2, 0.6]
    return range[0] + Math.random() * (range[1] - range[0])
  }

  private generateRandomSpeechiness(genre: string): number {
    const speechinessRanges: { [key: string]: [number, number] } = {
      'pop': [0.1, 0.3],
      'rock': [0.1, 0.4],
      'hip-hop': [0.6, 0.9],
      'electronic': [0.0, 0.2],
      'jazz': [0.0, 0.1],
      'classical': [0.0, 0.1]
    }
    
    const range = speechinessRanges[genre] || [0.1, 0.4]
    return range[0] + Math.random() * (range[1] - range[0])
  }
}

// Экспорт глобального экземпляра
export const aiRecommendationSystem = new AIRecommendationSystem()
