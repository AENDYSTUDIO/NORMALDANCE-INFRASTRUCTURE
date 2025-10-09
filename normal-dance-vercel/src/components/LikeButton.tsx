'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface LikeButtonProps {
  trackId: string
  className?: string
}

export default function LikeButton({ trackId, className }: LikeButtonProps) {
  const { data: session } = useSession()
  const [isLiked, setIsLiked] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session?.user && trackId) {
      fetchLikedStatus()
    }
  }, [session, trackId])

  const fetchLikedStatus = async () => {
    try {
      const response = await fetch(`/api/likes?trackId=${trackId}`)
      if (response.ok) {
        const data = await response.json()
        setIsLiked(data.liked)
      }
    } catch (error) {
      console.error('Error fetching like status:', error)
    }
  }

  const handleLike = async () => {
    if (!session?.user) {
      // Redirect to login or show login modal
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ trackId })
      })

      if (response.ok) {
        const data = await response.json()
        setIsLiked(data.liked)
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleLike}
      disabled={loading || !session?.user}
      className={`${className} ${
        isLiked 
          ? 'text-green-400 hover:text-green-300' 
          : 'text-zinc-400 hover:text-white'
      }`}
      title={session?.user ? 'Лайк' : 'Войдите для лайка'}
    >
      <Heart 
        className={`w-5 h-5 ${isLiked ? 'fill-current' : ''} ${
          loading ? 'animate-pulse' : ''
        }`} 
      />
    </Button>
  )
}