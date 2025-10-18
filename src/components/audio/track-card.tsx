'use client'

import { useState, memo, useRef, useEffect } from 'react'
import { useAudioStore } from '@/store/use-audio-store'
import useNetworkStatus from '@/hooks/useNetworkStatus' // Импортируем наш новый хук
import { Card, CardContent, Button, Badge, Avatar, AvatarFallback, AvatarImage } from '@/components/ui'
import { 
  Play, 
  Pause, 
  Heart, 
  MoreHorizontal,
  Clock,
  AlertTriangle
} from '@/components/icons'
import { formatNumber, formatTime } from '@/lib/utils'
import { Track } from '@/store/use-audio-store'
import { cn } from '@/lib/utils'
import { useImageOptimizer, ImageQuality } from '@/utils/image-optimizer'

interface TrackCardProps {
  track: Track
  className?: string
}

function TrackCardComponent({ track, className }: TrackCardProps) {
  const {
    currentTrack,
    isPlaying,
    playTrack,
    pause,
    toggleLike
  } = useAudioStore()

  const { effectiveType, isMobile, saveData } = useNetworkStatus()
  const imageOptimizer = useImageOptimizer()
  const [optimizedImageSrc, setOptimizedImageSrc] = useState<string>(track.coverImage || '/placeholder-album.jpg')
  const imageRef = useRef<HTMLImageElement>(null)

  const [isLiked, setIsLiked] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const isCurrentTrack = currentTrack?.id === track.id
  const isTrackPlaying = isCurrentTrack && isPlaying

  // Оптимизируем изображение на основе сетевого подключения
  useEffect(() => {
    if (!imageOptimizer || !track.coverImage) return;
    
    // Определяем качество изображения на основе сети
    let quality = ImageQuality.HIGH;
    
    if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g') {
      quality = ImageQuality.LOW;
    } else if (isMobile && effectiveType === '3g') {
      quality = ImageQuality.MEDIUM;
    }
    
    // Получаем оптимизированный URL
    const optimizedSrc = imageOptimizer.getOptimizedImageUrl(track.coverImage, quality);
    setOptimizedImageSrc(optimizedSrc);
    
    // Если изображение видимо, наблюдаем за ним для ленивой загрузки
    if (imageRef.current) {
      imageOptimizer.observe(imageRef.current);
    }
    
    // Очистка при размонтировании
    return () => {
      if (imageRef.current) {
        imageOptimizer.unobserve(imageRef.current);
      }
    };
  }, [track.coverImage, imageOptimizer, effectiveType, isMobile, saveData]);

  const handlePlay = () => {
    if (isCurrentTrack) {
      if (isPlaying) {
        pause()
      } else {
        playTrack(track)
      }
    } else {
      playTrack(track)
    }
  }

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsLiked(!isLiked)
    toggleLike(track.id)
  }

  return (
    <Card 
      className={cn(
        'group cursor-pointer transition-all hover:shadow-md track-card',
        isCurrentTrack && 'ring-2 ring-primary',
        isMobile ? 'p-0 shadow-sm' : '', // Уменьшаем отступы и тень для мобильных устройств
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handlePlay}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Track image and play button */}
          <div className="relative aspect-square">
            <Avatar className="w-full h-full rounded-lg">
              <AvatarImage 
                ref={imageRef}
                src={optimizedImageSrc} 
                className="track-card-image"
              />
              <AvatarFallback className="rounded-lg text-lg">
                {track.title.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            {/* Play button overlay */}
            <div 
              className={cn(
                'absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity',
                isCurrentTrack && 'opacity-100'
              )}
            >
              <Button
                size="lg"
                className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90"
                onClick={handlePlay}
              >
                {isTrackPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 ml-1" />
                )}
              </Button>
            </div>
          </div>

          {/* Track info */}
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate">
                  {track.title}
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  {track.artistName}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleLike}
              >
                <Heart className={cn(
                  'h-3 w-3',
                  isLiked && 'fill-red-500 text-red-500'
                )} />
              </Button>
            </div>

            {/* Track metadata */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>{formatTime(track.duration)}</span>
                {track.isExplicit && (
                  <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
                    <AlertTriangle className="h-2 w-2 mr-1" />
                    E
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Play className="h-3 w-3" />
                  {formatNumber(track.playCount)}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {formatNumber(track.likeCount)}
                </span>
              </div>
            </div>

            {/* Genre badge */}
            <Badge variant="outline" className="text-xs">
              {track.genre}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Оптимизируем компонент с помощью React.memo для предотвращения лишних ререндеров
export const TrackCard = memo(TrackCardComponent, (prevProps, nextProps) => {
  // Сравниваем только необходимые свойства для определения необходимости ререндера
  return prevProps.track.id === nextProps.track.id && 
         prevProps.track.title === nextProps.track.title &&
         prevProps.track.artistName === nextProps.track.artistName &&
         prevProps.track.coverImage === nextProps.track.coverImage &&
         prevProps.track.playCount === nextProps.track.playCount &&
         prevProps.track.likeCount === nextProps.track.likeCount &&
         prevProps.className === nextProps.className;
});