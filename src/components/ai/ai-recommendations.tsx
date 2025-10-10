"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Sparkles,
  TrendingUp,
  Clock,
  Users,
  Brain,
  RefreshCw,
  Music
  Heart
  Share2
  } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAIRecommendationEngine } from "@/lib/ai-recommendations";
import { useTelegram } from "@/contexts/telegram-context";

interface RecommendationDisplay {
  id: string;
  title: string;
  artist: string;
  genre: string;
  duration: number;
  score: number;
  confidence: number;
  type: 'personal' | 'trending' | 'discovery' | 'social';
  explanations: string[];
  audioFeatures: {
    hasVocals: boolean;
    isLive: boolean;
    isAcoustic: boolean;
  };
  socialFeatures: {
    likeCount: number;
    sharingCount: number;
    trendingScore: number;
  };
}

interface AIRecommendationsProps {
  userId: string;
  compact?: boolean;
  showFilters?: boolean;
  onTrackSelect?: (trackId: string) => void;
  onTrackPlay?: (trackId: string) => void;
  onTrackLike?: (trackId: string) => void;
  onTrackSkip?: (trackId: string) => void;
}

export function AIRecommendations({
  userId,
  compact = false,
  showFilters = false,
  onTrackSelect,
  onTrackPlay,
  onTrackLike,
  onTrackSkip,
}: AIRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<RecommendationDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    count: 10,
    genre: 'all',
    artist: 'all'
  });
  
  const { isTMA, hapticFeedback, showToast } = useTelegram();
  const { toast } = useToast();
  
  const engine = getAIRecommendationEngine();
  const refreshRef = useRef<(() => {})(null);

  // Load recommendations
  const loadRecommendations = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const results = await engine.getRecommendations(userId, {
        count: filters.count,
        type: filters.type as any,
        filters: {
          genre: filters.genre !== 'all' ? [filters.genre] : undefined,
          artist: filters.artist !== 'all' ? [filters.artist] : undefined,
          minRating: 4.0,
          minDuration: 120,
          maxDuration: 600,
        }
      });

      // Format results for display
      const formattedRecommendations: RecommendationDisplay[] = results.map(rec => ({
        id: rec.track.id,
        title: rec.track.title,
        artist: rec.track.artist,
        genre: rec.track.genre,
        duration: rec.track.duration,
        score: rec.score,
        confidence: rec.confidence,
        type: rec.type,
        explanations: rec.explanations,
        audioFeatures: rec.track.audioFeatures,
        socialFeatures: rec.track.socialFeatures,
      }));

      setRecommendations(formattedRecommendations);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      toast({
        title: "Failed to load recommendations",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [userId, filters, engine]);

  // Auto-refresh recommendations
  useEffect(() => {
    loadRecommendations();
    
    const interval = refreshRef.current = setTimeout(() => {
      loadRecommendations();
      refreshRef.current = null;
    }, 30000); // Refresh every 30 seconds
    
    return () => {
      if (interval) clearTimeout(interval);
    };
  }, [userId, filters]);

  const handleRefresh = async () => {
    await loadRecommendations();
    hapticFeedback("impact");
    
    toast({
      title: "Recommendations refreshed",
      description: "Updated with latest AI suggestions",
    });
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(filters);
  };

  const handleTrackAction = async (
    action: 'play' | 'like' | 'skip',
    trackId: string
  ) => {
    hapticFeedback("selection");

    switch (action) {
      case 'play':
        onTrackPlay?.(trackId);
        break;
      case 'like':
        onTrackLike?.(trackId);
        // Add to liked tracks
        break;
      case 'skip':
        onTrackSkip?.(trackId);
        // Add to skipped tracks
        break;
    }
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'personal':
        return 'bg-blue-500 text-white';
      case 'trending':
        return 'bg-green-500 text-white';
      case 'discovery':
        return 'bg-purple-500 text-white';
      case 'social':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'personal':
        return 'For You';
      case 'trending':
        return 'Trending';
      case 'discovery':
        return 'Discover';
      case 'social':
        return 'Popular';
      default:
        return 'Recommended';
    }
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'personal':
        return '🎯';
      case 'trending':
        return '📈';
      case 'discovery':
        return '🔍';
      case 'social':
        return '👥';
      default:
        return '🎵';
    }
  };

  // Get type badge styling
  const getTypeBadge = (type: string) => {
    const colors = getTypeColor(type);
    return <Badge className={colors}>
      {getTypeIcon(type)} {getTypeLabel(type)}
    </Badge>;
  };

  if (!userId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Please log in to get personalized music recommendations powered by AI
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {!compact && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Recommendations
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Button
                size="sm"
                variant="outline"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
          </CardHeader>
          
          {showFilters && (
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange({ ...filters, type: e.target.value as any })}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Types</option>
                <option value="personal">For You</option>
                <option value="trending">Trending</option>
                <option value="discovery">Discover</option>
                <option value="social">Popular</option>
              </select>
              
              <select
                value={filters.genre}
                onChange={(e) => handleFilterChange({ ...filters, genre: e.target.value as any })}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Genres</option>
                <option value="EDM">EDM</option>
                <option value="House">House</option>
                <option value="Techno">Techno</option>
                <option value="Blues">Blues</option>
                <option value="Jazz">Jazz</option>
                <option value="Rock">Rock</option>
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((rec, index) => (
          <Card
            key={rec.id}
            className="group-hover:scale-105 transition-all duration-200"
          >
            <CardContent className="p-4 space-y-3">
              {/* Header with type badge */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg line-clamp-1">
                    {rec.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {rec.artist} • {rec.genre}
                  </p>
                </div>
                {getTypeBadge(rec.type)}
              </div>

              {/* Score and confidence */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">
                    {Math.round(rec.score * 100)}% match
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {Math.round(rec.confidence * 100)}% confidence
                </div>
              </div>

              {/* Audio features */}
              <div className="flex flex-wrap gap-2 text-xs">
                {rec.audioFeatures.hasVocals && (
                  <Badge variant="secondary">With Vocals</Badge>
                )}
                {rec.audioFeatures.isAcoustic && <Badge variant="outline">Acoustic</Badge>}
                {rec.audioFeatures.isLive && (
                  <Badge variant="destructive">Live</Badge>
                )}
              </div>

              {/* Duration */}
              <div className="text-sm text-muted-foreground mb-3">
                {formatDuration(rec.duration)}
              </div>

              {/* Explanations */}
              {rec.explanations.length > 0 && (
                <div className="space-y-1">
                  {rec.explanations.slice(0, 2).map((explanation, i) => (
                    <p
                      key={i}
                      className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1"
                    >
                      💡 {explanation}
                    </p>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleTrackAction('play', rec.id)}
                  className="flex-1"
                >
                  <Music className="h-4 w-4 mr-1" />
                  Play
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTrackAction('like', rec.id)}
                  className="flex-1"
                >
                  <Heart className="h-4 w-4 mr-1" />
                  Like
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTrackAction('skip', rec.id)}
                  className="flex-1"
                >
                  Skip
                </Button>
              </div>

              {/* Social proof */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>{rec.socialFeatures.likeCount}</span>
                  <span className="text-xs text-muted-foreground">
                    Likes
                  </span>
                </div>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <Share2 className="h-3 w-3" />
                  <span>{rec.socialFeatures.sharingCount}</span>
                  <span className="text-xs text-muted-foreground">
                    Shares
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary card */}
      {recommendations.length > 0 && (
        <Card>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-muted-foreground">Personal Score</p>
                <div className="text-2xl font-bold">
                  {Math.round(
                    recommendations
                      .reduce((sum, rec) => sum + rec.score, 0) / recommendations.length * 100
                  )}%
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">Social Proofs</p>
                <div className="text-2xl font-bold">
                  {recommendations
                    .reduce((sum, rec) => sum + rec.socialFeatures.likeCount, 0)}
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">New Discoveries</p>
                <div className="text-2xl font-bold">
                  {recommendations
                    .filter(rec => rec.type === 'discovery').length}
                </div>
              </div>
              <div>
                <p className="text-coverage text-muted-foreground">
                  avg: {Math.round(
                    recommendations
                      .reduce((sum, rec) => sum + rec.confidence, 0) / recommendations.length * 100
                  )}% confidence
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <Card className="text-center">
        <CardContent>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              size="sm"
              variant="outline"
              onClick={() => hapticFeedback('notification')}
            >
              <Brain className="h-4 w-4 mr-1" />
              Train AI
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to format duration
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  return `0:${remainingSeconds.toString().padStart(2, '0')}`;
}

export default AIRecommendations;
