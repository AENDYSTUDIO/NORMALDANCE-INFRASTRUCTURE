'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Play, Pause, SkipBack, SkipForward, Volume2, Heart, Share2 } from 'lucide-react'

interface Track {
  id: string
  title: string
  artist: string
  coverArt?: string
  audioUrl: string
  duration: number
}

const mockTracks: Track[] = [
  {
    id: '1',
    title: 'Cosmic Journey',
    artist: 'Artist One',
    coverArt: '/api/placeholder/300/300',
    audioUrl: '/api/placeholder/audio',
    duration: 180
  },
  {
    id: '2',
    title: 'Digital Dreams',
    artist: 'Artist Two',
    coverArt: '/api/placeholder/300/300',
    audioUrl: '/api/placeholder/audio',
    duration: 240
  },
  {
    id: '3',
    title: 'Neon Nights',
    artist: 'Artist Three',
    coverArt: '/api/placeholder/300/300',
    audioUrl: '/api/placeholder/audio',
    duration: 200
  }
]

export function MusicPlayer() {
  const [currentTrack, setCurrentTrack] = useState<Track>(mockTracks[0])
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(75)
  const [isLiked, setIsLiked] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100
    }
  }, [volume])

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeChange = (value: number[]) => {
    const newTime = value[0]
    setCurrentTime(newTime)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
    }
  }

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0])
  }

  const playNext = () => {
    const currentIndex = mockTracks.findIndex(track => track.id === currentTrack.id)
    const nextIndex = (currentIndex + 1) % mockTracks.length
    setCurrentTrack(mockTracks[nextIndex])
    setCurrentTime(0)
  }

  const playPrevious = () => {
    const currentIndex = mockTracks.findIndex(track => track.id === currentTrack.id)
    const prevIndex = currentIndex === 0 ? mockTracks.length - 1 : currentIndex - 1
    setCurrentTrack(mockTracks[prevIndex])
    setCurrentTime(0)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Music Player
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Playing */}
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-200 to-pink-200 dark:from-purple-800 dark:to-pink-800 rounded-lg flex items-center justify-center">
              <span className="text-2xl font-bold text-white">🎵</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{currentTrack.title}</h3>
              <p className="text-muted-foreground">{currentTrack.artist}</p>
              <div className="flex items-center space-x-2 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsLiked(!isLiked)}
                  className={isLiked ? 'text-red-500' : ''}
                >
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                </Button>
                <Button variant="ghost" size="sm">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Slider
              value={[currentTime]}
              max={currentTrack.duration}
              step={1}
              onValueChange={handleTimeChange}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(currentTrack.duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center space-x-4">
            <Button variant="ghost" size="sm" onClick={playPrevious}>
              <SkipBack className="h-5 w-5" />
            </Button>
            <Button
              size="lg"
              onClick={togglePlayPause}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={playNext}>
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>

          {/* Volume */}
          <div className="flex items-center space-x-3">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={[volume]}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground w-10">{volume}%</span>
          </div>

          {/* Hidden Audio Element */}
          <audio
            ref={audioRef}
            src={currentTrack.audioUrl}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onEnded={playNext}
          />
        </CardContent>
      </Card>

      {/* Playlist */}
      <Card>
        <CardHeader>
          <CardTitle>Playlist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {mockTracks.map((track) => (
              <div
                key={track.id}
                className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  currentTrack.id === track.id
                    ? 'bg-purple-100 dark:bg-purple-900'
                    : 'hover:bg-muted'
                }`}
                onClick={() => {
                  setCurrentTrack(track)
                  setCurrentTime(0)
                }}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-200 to-pink-200 dark:from-purple-800 dark:to-pink-800 rounded flex items-center justify-center">
                  <span className="text-lg">🎵</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{track.title}</h4>
                  <p className="text-sm text-muted-foreground">{track.artist}</p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatTime(track.duration)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}