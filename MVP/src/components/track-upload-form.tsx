'use client'

import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, Music, Loader2 } from 'lucide-react'

export function TrackUploadForm() {
  const { publicKey, sendTransaction } = useWallet()
  const { connection } = useConnection()
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    genre: '',
    description: '',
    price: ''
  })
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!publicKey || !audioFile) return

    setUploading(true)
    
    try {
      // 1. Upload to IPFS (simplified)
      const audioHash = await uploadToIPFS(audioFile)
      const coverHash = coverFile ? await uploadToIPFS(coverFile) : null
      
      // 2. Save to database
      const response = await fetch('/api/tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          fileUrl: audioHash,
          coverUrl: coverHash,
          artistId: publicKey.toString()
        })
      })
      
      if (response.ok) {
        // Reset form
        setFormData({ title: '', artist: '', genre: '', description: '', price: '' })
        setAudioFile(null)
        setCoverFile(null)
        alert('Track uploaded successfully!')
      }
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const uploadToIPFS = async (file: File): Promise<string> => {
    // Simplified IPFS upload - using public gateway
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch('https://ipfs.io/api/v0/add', {
      method: 'POST',
      body: formData
    })
    
    const result = await response.json()
    return result.Hash
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Your Track
        </CardTitle>
        <CardDescription>
          Share your music with the world as an NFT on Solana
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Track Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Track Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter track title"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="artist">Artist Name *</Label>
              <Input
                id="artist"
                value={formData.artist}
                onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                placeholder="Your artist name"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="genre">Genre</Label>
              <Input
                id="genre"
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                placeholder="e.g., Electronic, Rock, Jazz"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Tell us about your track..."
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="price">Price (SOL)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.1"
              />
            </div>
          </div>

          {/* File Uploads */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="audio">Audio File *</Label>
              <Input
                id="audio"
                type="file"
                accept="audio/*"
                onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                required
                className="cursor-pointer"
              />
              {audioFile && (
                <p className="text-sm text-green-600 mt-1">
                  <Music className="inline h-4 w-4 mr-1" />
                  {audioFile.name}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="cover">Cover Image</Label>
              <Input
                id="cover"
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
              {coverFile && (
                <p className="text-sm text-green-600 mt-1">
                  Cover: {coverFile.name}
                </p>
              )}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={!publicKey || !audioFile || uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload Track'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}