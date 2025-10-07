'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Loader2, ListMusic } from 'lucide-react'

interface Track {
  id: string
  title: string
  artist: {
    name: string
  }
}

interface PlaylistCreatorProps {
  availableTracks: Track[]
  onCreateSuccess?: () => void
}

export default function PlaylistCreator({ availableTracks, onCreateSuccess }: PlaylistCreatorProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [selectedTracks, setSelectedTracks] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleTrackToggle = (trackId: string) => {
    setSelectedTracks(prev => 
      prev.includes(trackId) 
        ? prev.filter(id => id !== trackId)
        : [...prev, trackId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) {
      setError('Название плейлиста обязательно')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/playlists/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          description,
          isPublic,
          trackIds: selectedTracks
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Плейлист успешно создан!')
        // Reset form
        setName('')
        setDescription('')
        setIsPublic(true)
        setSelectedTracks([])
        onCreateSuccess?.()
      } else {
        setError(data.error || 'Ошибка при создании плейлиста')
      }
    } catch (error) {
      setError('Ошибка при создании плейлиста')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListMusic className="w-5 h-5 text-green-400" />
          Создать плейлист
        </CardTitle>
        <CardDescription className="text-zinc-400">
          Создайте новый плейлист с вашими любимыми треками
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive" className="bg-red-900/20 border-red-800 text-red-400">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="bg-green-900/20 border-green-800 text-green-400">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Название плейлиста</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Мой плейлист"
              className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание (необязательно)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание вашего плейлиста..."
              className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 resize-none"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
            <Label htmlFor="public" className="text-sm">
              Публичный плейлист
            </Label>
          </div>

          <div className="space-y-2">
            <Label>Выберите треки ({selectedTracks.length} выбрано)</Label>
            <div className="max-h-48 overflow-y-auto space-y-2 border border-zinc-700 rounded-lg p-3">
              {availableTracks.length === 0 ? (
                <p className="text-zinc-500 text-sm">Нет доступных треков</p>
              ) : (
                availableTracks.map((track) => (
                  <div key={track.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={track.id}
                      checked={selectedTracks.includes(track.id)}
                      onChange={() => handleTrackToggle(track.id)}
                      className="rounded border-zinc-600 bg-zinc-800 text-green-500 focus:ring-green-500"
                    />
                    <Label 
                      htmlFor={track.id} 
                      className="text-sm cursor-pointer flex-1"
                    >
                      {track.title} - {track.artist.name}
                    </Label>
                  </div>
                ))
              )}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-green-500 hover:bg-green-400 text-black font-semibold"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Создание...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Создать плейлист
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}