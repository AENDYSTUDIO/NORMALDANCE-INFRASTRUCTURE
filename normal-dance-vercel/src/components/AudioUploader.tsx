'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, Loader2, Music } from 'lucide-react'

interface Artist {
  id: string
  name: string
}

interface Album {
  id: string
  title: string
}

interface AudioUploaderProps {
  artists: Artist[]
  albums: Album[]
  onUploadSuccess?: () => void
}

export default function AudioUploader({ artists, albums, onUploadSuccess }: AudioUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [artistId, setArtistId] = useState('')
  const [albumId, setAlbumId] = useState('')
  const [genre, setGenre] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const genres = [
    'Electronic', 'House', 'Techno', 'Dubstep', 'Trance', 
    'Drum & Bass', 'Ambient', 'Synthwave', 'EDM', 'Other'
  ]

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type.startsWith('audio/')) {
        setFile(selectedFile)
        if (!title) {
          setTitle(selectedFile.name.replace(/\.[^/.]+$/, '')) // Remove file extension
        }
        setError('')
      } else {
        setError('Пожалуйста, выберите аудиофайл')
        setFile(null)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !title || !artistId) {
      setError('Пожалуйста, заполните все обязательные поля')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', title)
      formData.append('artistId', artistId)
      formData.append('genre', genre)
      if (albumId) {
        formData.append('albumId', albumId)
      }

      const response = await fetch('/api/upload/audio', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Аудиофайл успешно загружен!')
        // Reset form
        setFile(null)
        setTitle('')
        setArtistId('')
        setAlbumId('')
        setGenre('')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        onUploadSuccess?.()
      } else {
        setError(data.error || 'Ошибка при загрузке файла')
      }
    } catch (error) {
      setError('Ошибка при загрузке файла')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="w-5 h-5 text-green-400" />
          Загрузить аудиофайл
        </CardTitle>
        <CardDescription className="text-zinc-400">
          Загрузите свой трек в библиотеку NORMAL DANCE
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
            <Label htmlFor="file">Аудиофайл</Label>
            <div className="flex items-center gap-2">
              <Input
                ref={fileInputRef}
                id="file"
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                className="bg-zinc-800 border-zinc-700 text-white file:bg-zinc-700 file:text-white file:border-0"
                required
              />
              {file && (
                <span className="text-sm text-zinc-400 max-w-32 truncate">
                  {file.name}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Название трека</Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Название трека"
              className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="artist">Артист</Label>
            <Select value={artistId} onValueChange={setArtistId} required>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Выберите артиста" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {artists.map((artist) => (
                  <SelectItem key={artist.id} value={artist.id}>
                    {artist.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="album">Альбом (необязательно)</Label>
            <Select value={albumId} onValueChange={setAlbumId}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Выберите альбом" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="">Без альбома</SelectItem>
                {albums.map((album) => (
                  <SelectItem key={album.id} value={album.id}>
                    {album.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="genre">Жанр</Label>
            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Выберите жанр" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {genres.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-green-500 hover:bg-green-400 text-black font-semibold"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Загрузка...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Загрузить трек
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}