'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Upload, Music, Image, DollarSign, Wallet } from 'lucide-react'

interface UploadMusicProps {
  solanaConnected: boolean
  tonConnected: boolean
}

export function UploadMusic({ solanaConnected, tonConnected }: UploadMusicProps) {
  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [currency, setCurrency] = useState('SOL')
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedBlockchain, setSelectedBlockchain] = useState<'solana' | 'ton'>('solana')

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('audio/')) {
      setAudioFile(file)
    }
  }

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setCoverFile(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!audioFile || !title || !genre || !price) {
      alert('Please fill in all required fields')
      return
    }

    setIsUploading(true)
    try {
      // Simulate upload process
      console.log('Uploading track:', {
        title,
        genre,
        description,
        price,
        currency,
        blockchain: selectedBlockchain,
        audioFile: audioFile.name,
        coverFile: coverFile?.name
      })

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000))

      alert('Track uploaded successfully!')
      // Reset form
      setTitle('')
      setGenre('')
      setDescription('')
      setPrice('')
      setAudioFile(null)
      setCoverFile(null)
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  if (!solanaConnected && !tonConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Music
          </CardTitle>
          <CardDescription>
            Connect your wallet to start uploading music
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">
            Please connect your wallet to upload music as NFTs
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Music as NFT
        </CardTitle>
        <CardDescription>
          Upload your music and mint it as an NFT on your chosen blockchain
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Blockchain Selection */}
          <div className="space-y-2">
            <Label>Select Blockchain</Label>
            <Tabs value={selectedBlockchain} onValueChange={(value) => setSelectedBlockchain(value as 'solana' | 'ton')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="solana" disabled={!solanaConnected}>
                  Solana
                </TabsTrigger>
                <TabsTrigger value="ton" disabled={!tonConnected}>
                  TON
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Track Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter track title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="genre">Genre *</Label>
              <Select value={genre} onValueChange={setGenre} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pop">Pop</SelectItem>
                  <SelectItem value="rock">Rock</SelectItem>
                  <SelectItem value="electronic">Electronic</SelectItem>
                  <SelectItem value="hip-hop">Hip Hop</SelectItem>
                  <SelectItem value="jazz">Jazz</SelectItem>
                  <SelectItem value="classical">Classical</SelectItem>
                  <SelectItem value="rnb">R&B</SelectItem>
                  <SelectItem value="country">Country</SelectItem>
                  <SelectItem value="indie">Indie</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your track..."
                rows={3}
              />
            </div>
          </div>

          {/* File Uploads */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="audio">Audio File *</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                <input
                  id="audio"
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                  className="hidden"
                />
                <label htmlFor="audio" className="cursor-pointer">
                  <Music className="h-8 w-8 mx-auto mb-2 text-muted-foreground" aria-hidden="true" />
                  {audioFile ? (
                    <p className="text-sm font-medium">{audioFile.name}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Click to upload audio file
                    </p>
                  )}
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cover">Cover Art</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                <input
                  id="cover"
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                />
                <label htmlFor="cover" className="cursor-pointer">
                  <Image className="h-8 w-8 mx-auto mb-2 text-muted-foreground" aria-hidden="true" />
                  {coverFile ? (
                    <p className="text-sm font-medium">{coverFile.name}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Click to upload cover art
                    </p>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SOL">SOL</SelectItem>
                  <SelectItem value="TON">TON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploading and Minting...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload & Mint NFT
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}