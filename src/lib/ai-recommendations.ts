/**
 * AI Recommendations Engine for NormalDance
 * Personalized music recommendations using AI/ML
 */

import logger from "./logger";
import { getMonitoring } from "./monitoring";

const monitoring = getMonitoring();

export interface UserProfile {
  id: string;
  userId: string;
  preferredGenres: string[];
  listeningHistory: Array<{
    trackId: string;
    timestamp: number;
    duration: number;
    rating?: number;
    completed?: boolean;
    energyLevel?: "low" | "medium" | "high";
    timeOfDay: "morning" | "afternoon" | "evening" | "night";
  }>;
  favoriteArtists: string[];
  skippedTracks: string[];
  likedTracks: string[];
  currentLocation?: {
    latitude: number;
    longitude: number;
    country?: string;
    city?: string;
  };
  weather?: {
    temperature: number;
    condition: "sunny" | "cloudy" | "rainy" | "snowy";
    humidity: number;
  };
  recentSearches: string[];
}

export interface TrackFeatures {
  id: string;
  title: string;
  artist: string;
  genre: string;
  subgenre?: string;
  tempo: number;
  energy: number; // 0-1 scale
  valence: number; // 0-1 scale for emotional content
  instrumentalness: number; // 0-1 scale
  complexity: number; // 0-1 scale
  popularity: number;
  duration: number;
  released: number;
  language: string;
  country?: string;
  tags: string[];
  audioFeatures: {
    hasVocals: boolean;
    isLive: boolean;
    isAcoustic: boolean;
    hasVideo: boolean;
    beatsPerMinute: number;
    key: string;
  };
  socialFeatures: {
    trendingScore: number;
    viralScore: number;
    sharingCount: number;
    likeCount: number;
    commentCount: number;
    playlistCount: number;
  };
}

export interface RecommendationFactors {
  userPreference: number;
  genreMatch: number;
  artistPreference: number;
  newDiscovery: number;
  popularity: number;
  novelty: number;
  diversity: number;
  recencyRecentPenalty: number;
  trendingMultiplier: number;
  locationRelevance: number;
  weatherCompatibility: number;
  energyMatch: number;
  valenceMatch: number;
  socialProof: number;
  playlistFit: number;
}

export interface RecommendationResult {
  track: TrackFeatures;
  score: number;
  factors: RecommendationFactors;
  explanation: string[];
  confidence: number;
  type: "personal" | "trending" | "discovery" | "collaborative" | "social";
}

export class AIRecommendationEngine {
  private trackDatabase: Map<string, TrackFeatures> = new Map();
  private userProfileCache: Map<string, UserProfile> = new Map();
  private recommendationCache: Map<string, RecommendationResult[]> = new Map();
  private monitoring = getMonitoring();

  constructor() {
    this.initializeTrackDatabase();
  }

  // Initialize with sample track data
  private initializeTrackDatabase(): void {
    // Sample track features
    const sampleTracks: TrackFeatures[] = [
      {
        id: "track_1",
        title: "Summer Vibes",
        artist: "DJ Summer",
        genre: "EDM",
        subgenre: "Progressive House",
        tempo: 128,
        energy: 0.8,
        valence: 0.7,
        instrumentalness: 0.3,
        complexity: 0.6,
        popularity: 85,
        duration: 240,
        released: Date.now() - 86400000 * 30, // 30 days ago
        language: "English",
        tags: ["energetic", "summer", "club"],
        audioFeatures: {
          hasVocals: false,
          isLive: false,
          isAcoustic: false,
          hasVideo: false,
          beatsPerMinute: 128,
          key: "F# minor",
        },
        socialFeatures: {
          trendingScore: 0.8,
          viralScore: 0.7,
          sharingCount: 234,
          likeCount: 1523,
          commentCount: 89,
          playlistCount: 67,
        },
      },
      {
        id: "track_2",
        title: "Rainy Day Blues",
        artist: "Sad Piano",
        genre: "Blues",
        subgenre: "Acoustic Blues",
        tempo: 75,
        energy: 0.2,
        valence: 0.1,
        instrumentalness: 0.9,
        complexity: 0.3,
        popularity: 62,
        duration: 320,
        released: Date.now() - 86400000 * 90, // 90 days ago
        language: "English",
        tags: ["relaxing", "rainy", "acoustic", "melancholy"],
        audioFeatures: {
          hasVocals: false,
          isLive: false,
          isAcoustic: true,
          hasVideo: false,
          beatsPerMinute: 75,
          key: "C major",
        },
        socialFeatures: {
          trendingScore: 0.3,
          viralScore: 0.2,
          sharingCount: 45,
          likeCount: 567,
          commentCount: 23,
          playlistCount: 34,
        },
      },
      // Add more sample tracks...
    ];

    sampleTracks.forEach((track) => {
      this.trackDatabase.set(track.id, track);
    });

    logger.info(`Initialized with ${this.trackDatabase.size} tracks`);
  }

  // Calculate track similarity score
  private calculateTrackSimilarity(
    track1: TrackFeatures,
    track2: TrackFeatures
  ): number {
    let similarity = 0;
    let factors = 0;

    // Genre similarity
    if (track1.genre === track2.genre) similarity += 0.3;
    if (track1.subgenre === track2.subgenre) similarity += 0.1;
    factors += 0.4;

    // Tempo similarity
    const tempoDiff = Math.abs(track1.tempo - track2.tempo) / track1.tempo;
    if (tempoDiff < 0.1) similarity += 0.2;
    factors += 0.2;

    // Energy similarity
    const energyDiff = Math.abs(track1.energy - track2.energy);
    if (energyDiff < 0.2) similarity += 0.15;
    factors += 0.15;

    // Valence similarity
    const valenceDiff = Math.abs(track1.valence - track2.valence);
    if (valenceDiff < 0.3) similarity += 0.1;
    factors += 0.1;

    // Key similarity (both in major or both in minor)
    const track1Major = track1.audioFeatures.key.includes("major");
    const track2Major = track2.audioFeatures.key.includes("major");
    if (track1Major === track2Major) similarity += 0.05;
    factors += 0.05;

    return factors > 0 ? similarity / factors : 0;
  }

  // Calculate cultural compatibility
  private calculateCulturalCompatibility(
    profile: UserProfile,
    track: TrackFeatures
  ): number {
    let score = 0;
    let factors = 0;

    // Language compatibility
    if (track.language === "English" || track.language === "International") {
      score += 0.3;
    }
    factors += 0.3;

    // Regional popularity based on location
    if (
      profile.currentLocation &&
      track.country === profile.currentLocation.country
    ) {
      score += 0.2;
    } else if (track.country && track.country !== "US") {
      score += 0.1; // Slightly favor non-US for diversity
    }
    factors += 0.2;

    return factors > 0 ? score / factors : 0;
  }

  // Calculate weather compatibility
  private calculateWeatherCompatibility(
    profile: UserProfile,
    track: TrackFeatures
  ): number {
    if (!profile.weather) return 0;

    let compatibility = 0.5; // Base score

    // Adjust based on weather
    if (profile.weather.condition === "sunny") {
      if (track.energy > 0.7) compatibility += 0.3; // Energetic music for sunny weather
      if (track.tags.includes("outdoor") || track.tags.includes("summer"))
        compatibility += 0.2;
    } else if (profile.weather.condition === "rainy") {
      if (track.energy < 0.4) compatibility += 0.3; // Calm music for rainy weather
      if (track.tags.includes("cozy") || track.tags.includes("relaxing"))
        compatibility += 0.2;
      if (track.genre === "Blues" || track.genre === "Jazz")
        compatibility += 0.2;
    } else if (profile.weather.condition === "snowy") {
      if (track.energy < 0.5) compatibility += 0.2;
      if (track.instrumentalness > 0.7) compatibility += 0.1;
    }

    return Math.min(1, compatibility);
  }

  // Calculate energy level preference match
  private calculateEnergyMatch(
    profile: UserProfile,
    track: TrackFeatures
  ): number {
    const energy = track.energy;
    const userEnergy = this.getUserEnergyLevel(profile);

    if (userEnergy === "high") return energy;
    if (userEnergy === "low") return 1 - energy;
    return 0.5 - Math.abs(energy - 0.5); // Default preference
  }

  // Get user energy level from listening history
  private getUserEnergyLevel(profile: UserProfile): "low" | "medium" | "high" {
    const recentEnergyLevels = profile.listeningHistory
      .slice(-10)
      .map((entry) => entry.energyLevel || "medium")
      .filter(Boolean);

    if (recentEnergyLevels.length === 0) return "medium";

    const avgEnergy =
      recentEnergyLevels.reduce((sum, level) => {
        if (level === "high") return sum + 2;
        if (level === "low") return sum + 0;
        return sum + 1;
      }, 0) / recentEnergyLevels.length;

    if (avgEnergy >= 1.5) return "high";
    if (avgEnergy <= 0.5) return "low";
    return "medium";
  }

  // Calculate recommendation factors
  private calculateFactors(
    profile: UserProfile,
    track: TrackFeatures,
    context?: {
      timeOfDay?: "morning" | "afternoon" | "evening" | "night";
      device?: "mobile" | "desktop";
      trending?: boolean;
    }
  ): RecommendationFactors {
    const factors: RecommendationFactors = {
      userPreference: 0,
      genreMatch: 0,
      artistPreference: 0,
      newDiscovery: 0,
      popularity: 0,
      novelty: 0,
      diversity: 0,
      recencyRecentPenalty: 0,
      trendingMultiplier: 0,
      locationRelevance: 0,
      weatherCompatibility: 0,
      energyMatch: 0,
      valenceMatch: 0,
      socialProof: 0,
      playlistFit: 0,
    };

    // User preference scoring
    if (profile.preferredGenres.includes(track.genre)) {
      factors.userPreference = 0.25;
    }

    // Genre and subgenre matching
    if (profile.preferredGenres.includes(track.genre)) {
      factors.genreMatch = 0.2;
    }
    if (track.subgenre && profile.preferredGenres.includes(track.subgenre)) {
      factors.genreMatch += 0.1;
    }

    // Artist preference
    if (profile.favoriteArtists.includes(track.artist)) {
      factors.artistPreference = 0.15;
    }

    // New discovery (not recently listened to artist)
    const recentTracks = new Set(
      profile.listeningHistory.slice(-20).map((t) => t.trackId)
    );
    if (!recentTracks.has(track.id)) {
      factors.newDiscovery = 0.1;
    }

    // Popularity with multiplier
    factors.popularity = track.popularity / 100;
    if (context?.trending) {
      factors.trendingMultiplier = track.socialFeatures.trendingScore;
    }

    // Novelty (older tracks get higher novelty score)
    const daysSinceRelease = (Date.now() - track.released) / (1000 * 60 * 24);
    factors.novelty = Math.min(1, daysSinceRelease / 365);

    // Diversity from recent listening
    const genreCount = [
      ...new Set(
        profile.listeningHistory
          .map((t) => this.trackDatabase.get(t.trackId)?.genre)
          .filter(Boolean)
      ),
    ].length;
    if (genreCount > 0 && !profile.preferredGenres.includes(track.genre)) {
      factors.diversity = 1 / genreCount;
    }

    // Recency penalty for very recent tracks
    const recentDays = (Date.now() - track.released) / (1000 * 60 * 24);
    if (recentDays < 7) {
      factors.recencyRecentPenalty = -0.1;
    }

    // Location relevance
    factors.locationRelevance = this.calculateCulturalCompatibility(
      profile,
      track
    );

    // Weather compatibility
    if (profile.weather) {
      factors.weatherCompatibility = this.calculateWeatherCompatibility(
        profile,
        track
      );
    }

    // Energy level matching
    factors.energyMatch = this.calculateEnergyMatch(profile, track);

    // Valence matching for mood
    if (profile.listeningHistory.length > 0) {
      const recentValences = profile.listeningHistory
        .slice(-5)
        .map((entry) => {
          const trackData = this.trackDatabase.get(entry.trackId);
          return trackData?.valence || 0.5;
        })
        .filter((val) => val !== undefined);

      if (recentValences.length > 0) {
        const avgValence =
          recentValences.reduce((sum, val) => sum + val, 0) /
          recentValences.length;
        factors.valenceMatch = 1 - Math.abs(track.valence - avgValence);
      }
    }

    // Social proof from other users
    factors.socialProof = Math.min(1, track.socialFeatures.likeCount / 10000);

    return factors;
  }

  // Generate explanations for recommendation
  private generateExplanation(
    profile: UserProfile,
    track: TrackFeatures,
    factors: RecommendationFactors
  ): string[] {
    const explanations: string[] = [];

    if (factors.userPreference > 0.15) {
      explanations.push(`Matches your preference for ${track.genre} music`);
    }

    if (factors.genreMatch > 0.15) {
      explanations.push(
        `${track.title} is a perfect genre match for your taste`
      );
    }

    if (factors.artistPreference > 0.1) {
      explanations.push(`You'll love this ${track.artist} track`);
    }

    if (factors.energyMatch > 0.7) {
      explanations.push(`Perfect energy level for current mood`);
    }

    if (factors.weatherCompatibility > 0.7) {
      explanations.push(
        `Great choice for current weather: ${profile.weather?.condition}`
      );
    }

    if (factors.trendingMultiplier > 0.7) {
      explanations.push(`Currently trending among ${track.genre} fans`);
    }

    if (factors.socialProof > 0.5) {
      explanations.push(
        `Popular choice: ${track.socialFeatures.likeCount.toLocaleString()} likes`
      );
    }

    if (factors.newDiscovery > 0.05) {
      explanations.push(`Something new to discover in your collection`);
    }

    return explanations;
  }

  // Get recommendation confidence
  private calculateConfidence(factors: RecommendationFactors): number {
    const avgScore =
      Object.values(factors).reduce((sum, score) => sum + score, 0) /
      Object.keys(factors).length;

    // High confidence if multiple strong signals
    const strongSignals = Object.values(factors).filter(
      (score) => score > 0.15
    ).length;
    const totalSignals = Object.keys(factors).length;

    return Math.min(
      1,
      (avgScore * strongSignals) / totalSignals +
        (strongSignals / totalSignals) * 0.3
    );
  }

  // Main recommendation method
  async getRecommendations(
    userId: string,
    options: {
      type?: "personal" | "trending" | "discovery" | "social" | "all";
      count?: number;
      excludeLiked?: boolean;
      excludeSkipped?: boolean;
      filters?: {
        genre?: string[];
        artist?: string[];
        minRating?: number;
        minDuration?: number;
        maxDuration?: number;
      };
    } = {}
  ): Promise<RecommendationResult[]> {
    // Get or create user profile
    let profile = this.userProfileCache.get(userId);
    if (!profile) {
      profile = this.createProfileFromHistory(userId);
      this.userProfileCache.set(userId, profile);
    }

    // Check cache
    const cacheKey = `${userId}_${options.type || "all"}_${JSON.stringify(
      options
    )}`;
    if (this.recommendationCache.has(cacheKey)) {
      return this.recommendationCache.get(cacheKey)!;
    }

    const recommendations: RecommendationResult[] = [];
    const excludedTracks = new Set<string>();

    // Add explicitly excluded tracks
    if (options.excludeLiked) {
      profile.likedTracks.forEach((trackId) => excludedTracks.add(trackId));
    }
    if (options.excludeSkipped) {
      profile.skippedTracks.forEach((trackId) => excludedTracks.add(trackId));
    }

    // Filter candidates
    let candidates = Array.from(this.trackDatabase.values()).filter((track) => {
      // Exclude disliked tracks
      if (excludedTracks.has(track.id)) return false;

      // Apply filters
      if (
        options.filters?.genre &&
        !options.filters.genre.includes(track.genre)
      )
        return false;
      if (
        options.filters?.artist &&
        !options.filters.artist.includes(track.artist)
      )
        return false;
      if (
        options.filters?.minRating &&
        track.popularity < options.filters.minRating
      )
        return false;
      if (
        options.filters?.minDuration &&
        track.duration < options.filters.minDuration
      )
        return false;
      if (
        options.filters?.maxDuration &&
        track.duration > options.filters.maxDuration
      )
        return false;

      return true;
    });

    // Score candidates
    const scoredCandidates = candidates.map((track) => {
      const factors = this.calculateFactors(profile, track);
      const score = Object.values(factors).reduce((sum, val, index, arr) => {
        const weight = index < 3 ? 1.2 : 1.0; // Give more weight to top factors
        return sum + val * weight;
      }, 0);

      const explanations = this.generateExplanation(profile, track, factors);
      const confidence = this.calculateConfidence(factors);

      return {
        track,
        score,
        factors,
        explanation: explanations,
        confidence,
        type: this.determineRecommendationType(factors, options.type),
      };
    });

    // Sort by score and confidence
    scoredCandidates.sort((a, b) => {
      // Primary sort by score
      const scoreDiff = b.score - a.score;
      if (Math.abs(scoreDiff) > 0.01) return scoreDiff;

      // Secondary sort by confidence when scores are close
      const confidenceDiff = b.confidence - a.confidence;
      return confidenceDiff;
    });

    // Take only requested number of recommendations
    const result = scoredCandidates.slice(0, options.count || 10);

    // Cache the results
    this.recommendationCache.set(cacheKey, result);

    // Update user profile with recent recommendations
    profile.recentSearches = [
      ...result
        .slice(0, 3)
        .map((r) => r.track.title)
        .slice(-30),
    ];
    this.userProfileCache.set(userId, profile);

    // Log recommendation activity
    this.monitoring.recordMetric({
      endpoint: "ai-recommendations",
      responseTime: 0,
      timestamp: Date.now(),
      statusCode: 200,
    });

    return result;
  }

  // Determine recommendation type based on factors
  private determineRecommendationType(
    factors: RecommendationFactors,
    requestedType?: string
  ): RecommendationResult["type"] {
    if (requestedType) return requestedType as RecommendationResult["type"];

    if (factors.socialProof > 0.3) return "social";
    if (factors.trendingMultiplier > 0.5) return "trending";
    if (factors.newDiscovery > 0.2) return "discovery";
    return "personal";
  }

  // Create user profile from listening history
  private createProfileFromHistory(userId: string): UserProfile {
    // Implementation would fetch from database
    // For now, return a mock profile
    return {
      id: userId,
      userId,
      preferredGenres: ["EDM", "House", "Techno"],
      listeningHistory: [],
      favoriteArtists: ["DJ Summer", "Sad Piano"],
      skippedTracks: [],
      likedTracks: [],
    };
  }

  // Add track to database
  addTrack(track: TrackFeatures): void {
    this.trackDatabase.set(track.id, track);
  }

  // Update user profile
  updateUserProfile(userId: string, update: Partial<UserProfile>): void {
    const existingProfile = this.userProfileCache.get(userId);
    if (existingProfile) {
      const updatedProfile = { ...existingProfile, ...update };
      this.userProfileCache.set(userId, updatedProfile);
    }
  }

  // Clear caches
  clearCaches(): void {
    this.recommendationCache.clear();
    this.userProfileCache.clear();
  }

  // Get recommendation statistics
  getStats(): {
    totalTracks: number;
    userProfiles: number;
    cacheHits: number;
    averageConfidence: number;
  } {
    return {
      totalTracks: this.trackDatabase.size,
      userProfiles: this.userProfileCache.size,
      cacheHits: this.recommendationCache.size,
      averageConfidence: 0, // Would need to calculate from existing requests
    };
  }
}

// Singleton instance
let recommendationEngine: AIRecommendationEngine | null = null;

export function getAIRecommendationEngine(): AIRecommendationEngine {
  if (!recommendationEngine) {
    recommendationEngine = new AIRecommendationEngine();
  }
  return recommendationEngine;
}

