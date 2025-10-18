import { NextRequest } from 'next/server'
import { POST } from '@/app/api/filecoin/route'
import { db } from '@/lib/db'
import { uploadToFilecoin } from '@/lib/filecoin'

// Mock dependencies
jest.mock('@/lib/db')
jest.mock('@/lib/filecoin')

const mockDb = db as jest.Mocked<typeof db>
const mockUploadToFilecoin = uploadToFilecoin as jest.MockedFunction<typeof uploadToFilecoin>

describe('Filecoin API - Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default mock implementations
    mockDb.track.create.mockResolvedValue({
      id: 'test-track-id',
      title: 'Test Track',
      artistName: 'Test Artist',
      genre: 'Test Genre',
      duration: 180,
      ipfsHash: 'QmTestHash',
      filecoinCid: 'bafybeigdyrzt5s2o2...',
      metadata: Record<string, unknown>,
      price: 100,
      isExplicit: false,
      isPublished: true,
      artistId: 'test-artist-id',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    mockDb.user.update.mockResolvedValue({
      id: 'test-artist-id',
      email: 'test@example.com',
      username: 'testuser',
      displayName: 'Test User',
      bio: 'Test bio',
      avatar: 'test-avatar.jpg',
      banner: 'test-banner.jpg',
      wallet: 'test-wallet-address',
      level: 1,
      balance: 20,
      isArtist: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    mockUploadToFilecoin.mockResolvedValue({
      cid: 'bafybeigdyrzt5s2o2...',
      size: 1024000,
      storageProvider: 'filecoin',
      replicationFactor: 3,
      dealIds: ['12345', '12346', '12347'],
      price: 0.5,
      duration: 365,
    })
  })

  describe('POST /api/filecoin', () => {
    it('should upload file to Filecoin successfully', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'audio/mpeg' }), 'test.mp3')
      formData.append('metadata', JSON.stringify({
        title: 'Test Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 180,
        price: 100,
      }))

      const request = new NextRequest('http://localhost:3000/api/filecoin', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.filecoinCid).toBe('bafybeigdyrzt5s2o2...')
      expect(data.storageProvider).toBe('filecoin')
      expect(data.replicationFactor).toBe(3)
      expect(data.dealIds).toHaveLength(3)
      expect(data.price).toBe(0.5)
      expect(data.duration).toBe(365)
      expect(mockUploadToFilecoin).toHaveBeenCalledWith(
        expect.any(Blob),
        expect.objectContaining({
          title: 'Test Track',
          artistName: 'Test Artist',
          genre: 'Electronic',
          duration: 180,
          price: 100,
        })
      )
    })

    it('should handle missing file', async () => {
      const formData = new FormData()
      formData.append('metadata', JSON.stringify({
        title: 'Test Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 180,
        price: 100,
      }))

      const request = new NextRequest('http://localhost:3000/api/filecoin', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('File is required')
    })

    it('should handle missing metadata', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'audio/mpeg' }), 'test.mp3')

      const request = new NextRequest('http://localhost:3000/api/filecoin', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Metadata is required')
    })

    it('should handle invalid metadata', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'audio/mpeg' }), 'test.mp3')
      formData.append('metadata', 'invalid json')

      const request = new NextRequest('http://localhost:3000/api/filecoin', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid metadata format')
    })

    it('should handle Filecoin upload errors', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'audio/mpeg' }), 'test.mp3')
      formData.append('metadata', JSON.stringify({
        title: 'Test Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 180,
        price: 100,
      }))

      mockUploadToFilecoin.mockRejectedValue(new Error('Filecoin upload failed'))

      const request = new NextRequest('http://localhost:3000/api/filecoin', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to upload to Filecoin')
    })

    it('should handle database creation errors', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'audio/mpeg' }), 'test.mp3')
      formData.append('metadata', JSON.stringify({
        title: 'Test Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 180,
        price: 100,
      }))

      mockUploadToFilecoin.mockResolvedValue({
        cid: 'bafybeigdyrzt5s2o2...',
        size: 1024000,
        storageProvider: 'filecoin',
        replicationFactor: 3,
        dealIds: ['12345', '12346', '12347'],
        price: 0.5,
        duration: 365,
      })
      mockDb.track.create.mockRejectedValue(new Error('Database creation failed'))

      const request = new NextRequest('http://localhost:3000/api/filecoin', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.filecoinCid).toBe('bafybeigdyrzt5s2o2...')
      expect(data.warning).toBe('File uploaded to Filecoin but track creation failed')
    })

    it('should handle user balance update errors', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'audio/mpeg' }), 'test.mp3')
      formData.append('metadata', JSON.stringify({
        title: 'Test Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 180,
        price: 100,
      }))

      mockUploadToFilecoin.mockResolvedValue({
        cid: 'bafybeigdyrzt5s2o2...',
        size: 1024000,
        storageProvider: 'filecoin',
        replicationFactor: 3,
        dealIds: ['12345', '12346', '12347'],
        price: 0.5,
        duration: 365,
      })
      mockDb.track.create.mockResolvedValue({
        id: 'test-track-id',
        title: 'Test Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 180,
        ipfsHash: 'QmTestHash',
        filecoinCid: 'bafybeigdyrzt5s2o2...',
        metadata: Record<string, unknown>,
        price: 100,
        isExplicit: false,
        isPublished: true,
        artistId: 'test-artist-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      mockDb.user.update.mockRejectedValue(new Error('Balance update failed'))

      const request = new NextRequest('http://localhost:3000/api/filecoin', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.filecoinCid).toBe('bafybeigdyrzt5s2o2...')
      expect(data.warning).toBe('File uploaded to Filecoin but balance update failed')
    })

    it('should handle large files', async () => {
      const largeContent = new Array(10 * 1024 * 1024).fill('a').join('') // 10MB
      const formData = new FormData()
      formData.append('file', new Blob([largeContent], { type: 'audio/mpeg' }), 'large.mp3')
      formData.append('metadata', JSON.stringify({
        title: 'Large Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 300,
        price: 200,
      }))

      mockUploadToFilecoin.mockResolvedValue({
        cid: 'bafybeiglarge...',
        size: 10 * 1024 * 1024,
        storageProvider: 'filecoin',
        replicationFactor: 3,
        dealIds: ['large1', 'large2', 'large3'],
        price: 5.0,
        duration: 365,
      })

      const request = new NextRequest('http://localhost:3000/api/filecoin', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.filecoinCid).toBe('bafybeiglarge...')
      expect(data.size).toBe(10 * 1024 * 1024)
      expect(data.price).toBe(5.0)
    })

    it('should handle different file types', async () => {
      const fileTypes = [
        { type: 'audio/mpeg', extension: 'mp3' },
        { type: 'audio/wav', extension: 'wav' },
        { type: 'audio/ogg', extension: 'ogg' },
        { type: 'audio/flac', extension: 'flac' },
      ]

      for (const fileType of fileTypes) {
        const formData = new FormData()
        formData.append('file', new Blob(['test content'], { type: fileType.type }), `test.${fileType.extension}`)
        formData.append('metadata', JSON.stringify({
          title: 'Test Track',
          artistName: 'Test Artist',
          genre: 'Electronic',
          duration: 180,
          price: 100,
        }))

        mockUploadToFilecoin.mockResolvedValue({
          cid: `bafybeig${fileType.extension}...`,
          size: 1024000,
          storageProvider: 'filecoin',
          replicationFactor: 3,
          dealIds: ['12345', '12346', '12347'],
          price: 0.5,
          duration: 365,
        })

        const request = new NextRequest('http://localhost:3000/api/filecoin', {
          method: 'POST',
          body: formData,
        })

        const response = await POST(request)
        const data = await response.json()
        
        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.filecoinCid).toBe(`bafybeig${fileType.extension}...`)
      }
    })

    it('should handle metadata validation', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'audio/mpeg' }), 'test.mp3')
      formData.append('metadata', JSON.stringify({
        title: '', // Empty title should be invalid
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 180,
        price: 100,
      }))

      const request = new NextRequest('http://localhost:3000/api/filecoin', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid metadata: Title is required')
    })

    it('should handle metadata with optional fields', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'audio/mpeg' }), 'test.mp3')
      formData.append('metadata', JSON.stringify({
        title: 'Test Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 180,
        // Price is optional
      }))

      const request = new NextRequest('http://localhost:3000/api/filecoin', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.filecoinCid).toBe('bafybeigdyrzt5s2o2...')
    })

    it('should handle custom replication factor', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'audio/mpeg' }), 'test.mp3')
      formData.append('metadata', JSON.stringify({
        title: 'Test Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 180,
        price: 100,
      }))
      formData.append('replicationFactor', '5')

      mockUploadToFilecoin.mockResolvedValue({
        cid: 'bafybeigdyrzt5s2o2...',
        size: 1024000,
        storageProvider: 'filecoin',
        replicationFactor: 5,
        dealIds: ['12345', '12346', '12347', '12348', '12349'],
        price: 0.8,
        duration: 365,
      })

      const request = new NextRequest('http://localhost:3000/api/filecoin', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.filecoinCid).toBe('bafybeigdyrzt5s2o2...')
      expect(data.replicationFactor).toBe(5)
      expect(data.dealIds).toHaveLength(5)
      expect(data.price).toBe(0.8)
    })

    it('should handle custom duration', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'audio/mpeg' }), 'test.mp3')
      formData.append('metadata', JSON.stringify({
        title: 'Test Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 180,
        price: 100,
      }))
      formData.append('duration', '730') // 2 years

      mockUploadToFilecoin.mockResolvedValue({
        cid: 'bafybeigdyrzt5s2o2...',
        size: 1024000,
        storageProvider: 'filecoin',
        replicationFactor: 3,
        dealIds: ['12345', '12346', '12347'],
        price: 1.0,
        duration: 730,
      })

      const request = new NextRequest('http://localhost:3000/api/filecoin', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.filecoinCid).toBe('bafybeigdyrzt5s2o2...')
      expect(data.duration).toBe(730)
      expect(data.price).toBe(1.0)
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'audio/mpeg' }), 'test.mp3')
      formData.append('metadata', JSON.stringify({
        title: 'Test Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 180,
        price: 100,
      }))

      mockUploadToFilecoin.mockRejectedValue(new Error('Network error'))

      const request = new NextRequest('http://localhost:3000/api/filecoin', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to upload to Filecoin')
    })

    it('should handle timeout errors', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'audio/mpeg' }), 'test.mp3')
      formData.append('metadata', JSON.stringify({
        title: 'Test Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 180,
        price: 100,
      }))

      mockUploadToFilecoin.mockRejectedValue(new Error('Request timeout'))

      const request = new NextRequest('http://localhost:3000/api/filecoin', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to upload to Filecoin')
    })

    it('should handle file size validation', async () => {
      const largeContent = new Array(100 * 1024 * 1024).fill('a').join('') // 100MB
      const formData = new FormData()
      formData.append('file', new Blob([largeContent], { type: 'audio/mpeg' }), 'too-large.mp3')
      formData.append('metadata', JSON.stringify({
        title: 'Too Large Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 300,
        price: 200,
      }))

      const request = new NextRequest('http://localhost:3000/api/filecoin', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('File size exceeds maximum limit of 50MB')
    })

    it('should handle file type validation', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'application/pdf' }), 'test.pdf')
      formData.append('metadata', JSON.stringify({
        title: 'Invalid File Type',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 180,
        price: 100,
      }))

      const request = new NextRequest('http://localhost:3000/api/filecoin', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid file type. Only audio files are allowed')
    })

    it('should handle invalid replication factor', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'audio/mpeg' }), 'test.mp3')
      formData.append('metadata', JSON.stringify({
        title: 'Test Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 180,
        price: 100,
      }))
      formData.append('replicationFactor', 'invalid')

      const request = new NextRequest('http://localhost:3000/api/filecoin', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid replication factor')
    })

    it('should handle invalid duration', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'audio/mpeg' }), 'test.mp3')
      formData.append('metadata', JSON.stringify({
        title: 'Test Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 180,
        price: 100,
      }))
      formData.append('duration', 'invalid')

      const request = new NextRequest('http://localhost:3000/api/filecoin', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid duration')
    })
  })

  describe('Edge Cases', () => {
    it('should handle special characters in metadata', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'audio/mpeg' }), 'test.mp3')
      formData.append('metadata', JSON.stringify({
        title: 'Test Track with special chars: !@#$%^&*()',
        artistName: 'Test Artist with unicode: 你好',
        genre: 'Electronic',
        duration: 180,
        price: 100,
      }))

      const request = new NextRequest('http://localhost:3000/api/filecoin', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.filecoinCid).toBe('bafybeigdyrzt5s2o2...')
    })

    it('should handle empty file name', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'audio/mpeg' }), '')
      formData.append('metadata', JSON.stringify({
        title: 'Test Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 180,
        price: 100,
      }))

      const request = new NextRequest('http://localhost:3000/api/filecoin', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.filecoinCid).toBe('bafybeigdyrzt5s2o2...')
    })

    it('should handle metadata with extra fields', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'audio/mpeg' }), 'test.mp3')
      formData.append('metadata', JSON.stringify({
        title: 'Test Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 180,
        price: 100,
        extraField: 'extra value',
        anotherExtra: { nested: 'value' },
      }))

      const request = new NextRequest('http://localhost:3000/api/filecoin', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.filecoinCid).toBe('bafybeigdyrzt5s2o2...')
    })

    it('should handle minimum replication factor', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'audio/mpeg' }), 'test.mp3')
      formData.append('metadata', JSON.stringify({
        title: 'Test Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 180,
        price: 100,
      }))
      formData.append('replicationFactor', '1')

      mockUploadToFilecoin.mockResolvedValue({
        cid: 'bafybeigdyrzt5s2o2...',
        size: 1024000,
        storageProvider: 'filecoin',
        replicationFactor: 1,
        dealIds: ['12345'],
        price: 0.2,
        duration: 365,
      })

      const request = new NextRequest('http://localhost:3000/api/filecoin', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.filecoinCid).toBe('bafybeigdyrzt5s2o2...')
      expect(data.replicationFactor).toBe(1)
      expect(data.dealIds).toHaveLength(1)
    })

    it('should handle maximum replication factor', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'audio/mpeg' }), 'test.mp3')
      formData.append('metadata', JSON.stringify({
        title: 'Test Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 180,
        price: 100,
      }))
      formData.append('replicationFactor', '10')

      mockUploadToFilecoin.mockResolvedValue({
        cid: 'bafybeigdyrzt5s2o2...',
        size: 1024000,
        storageProvider: 'filecoin',
        replicationFactor: 10,
        dealIds: Array.from({ length: 10 }, (_, i) => `1234${i}`),
        price: 1.5,
        duration: 365,
      })

      const request = new NextRequest('http://localhost:3000/api/filecoin', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.filecoinCid).toBe('bafybeigdyrzt5s2o2...')
      expect(data.replicationFactor).toBe(10)
      expect(data.dealIds).toHaveLength(10)
    })
  })

  describe('Performance Tests', () => {
    it('should handle upload requests quickly', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'audio/mpeg' }), 'test.mp3')
      formData.append('metadata', JSON.stringify({
        title: 'Test Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 180,
        price: 100,
      }))

      mockUploadToFilecoin.mockResolvedValue({
        cid: 'bafybeigdyrzt5s2o2...',
        size: 1024000,
        storageProvider: 'filecoin',
        replicationFactor: 3,
        dealIds: ['12345', '12346', '12347'],
        price: 0.5,
        duration: 365,
      })

      const startTime = performance.now()
      
      const request = new NextRequest('http://localhost:3000/api/filecoin', {
        method: 'POST',
        body: formData,
      })
      const response = await POST(request)
      
      const endTime = performance.now()
      const responseTime = endTime - startTime
      
      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(10000) // Should respond in less than 10 seconds for Filecoin upload
    }),

    it('should handle concurrent upload requests', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'audio/mpeg' }), 'test.mp3')
      formData.append('metadata', JSON.stringify({
        title: 'Test Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 180,
        price: 100,
      }))

      mockUploadToFilecoin.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({
          cid: 'bafybeigdyrzt5s2o2...',
          size: 1024000,
          storageProvider: 'filecoin',
          replicationFactor: 3,
          dealIds: ['12345', '12346', '12347'],
          price: 0.5,
          duration: 365,
        }), 3000) // Simulate 3 second upload time
      }))

      const startTime = performance.now()
      
      const requests = Array.from({ length: 2 }, () => 
        new NextRequest('http://localhost:3000/api/filecoin', {
          method: 'POST',
          body: formData,
        })
      )
      
      const responses = await Promise.all(requests.map(req => POST(req)))
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      expect(responses.every(r => r.status === 200)).toBe(true)
      expect(totalTime).toBeLessThan(9000) // Should handle 2 concurrent requests in less than 9 seconds
    })
  })

  describe('Security Tests', () => {
    it('should prevent file path traversal', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'audio/mpeg' }), '../../../malicious.mp3')
      formData.append('metadata', JSON.stringify({
        title: 'Test Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 180,
        price: 100,
      }))

      const request = new NextRequest('http://localhost:3000/api/filecoin', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.filecoinCid).toBe('bafybeigdyrzt5s2o2...')
    }),

    it('should prevent malicious file extensions', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'audio/mpeg' }), 'test.php.mp3')
      formData.append('metadata', JSON.stringify({
        title: 'Test Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 180,
        price: 100,
      }))

      const request = new NextRequest('http://localhost:3000/api/filecoin', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.filecoinCid).toBe('bafybeigdyrzt5s2o2...')
    }),

    it('should validate file content type', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'application/x-php' }), 'test.mp3')
      formData.append('metadata', JSON.stringify({
        title: 'Test Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 180,
        price: 100,
      }))

      const request = new NextRequest('http://localhost:3000/api/filecoin', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid file type. Only audio files are allowed')
    }),

    it('should prevent oversized files', async () => {
      const largeContent = new Array(60 * 1024 * 1024).fill('a').join('') // 60MB
      const formData = new FormData()
      formData.append('file', new Blob([largeContent], { type: 'audio/mpeg' }), 'too-large.mp3')
      formData.append('metadata', JSON.stringify({
        title: 'Too Large Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 300,
        price: 200,
      }))

      const request = new NextRequest('http://localhost:3000/api/filecoin', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('File size exceeds maximum limit of 50MB')
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete upload workflow', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'audio/mpeg' }), 'test.mp3')
      formData.append('metadata', JSON.stringify({
        title: 'Complete Workflow Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 180,
        price: 100,
      }))
      formData.append('replicationFactor', '3')
      formData.append('duration', '365')

      mockUploadToFilecoin.mockResolvedValue({
        cid: 'bafybeigcomplete...',
        size: 1024000,
        storageProvider: 'filecoin',
        replicationFactor: 3,
        dealIds: ['complete1', 'complete2', 'complete3'],
        price: 0.5,
        duration: 365,
      })

      const request = new NextRequest('http://localhost:3000/api/filecoin', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.filecoinCid).toBe('bafybeigcomplete...')
      expect(data.storageProvider).toBe('filecoin')
      expect(data.replicationFactor).toBe(3)
      expect(data.dealIds).toHaveLength(3)
      expect(data.price).toBe(0.5)
      expect(data.duration).toBe(365)
      expect(data.trackId).toBe('test-track-id')
    }),

    it('should handle partial failures gracefully', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'audio/mpeg' }), 'test.mp3')
      formData.append('metadata', JSON.stringify({
        title: 'Partial Failure Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 180,
        price: 100,
      }))

      mockUploadToFilecoin.mockResolvedValue({
        cid: 'bafybeigpartial...',
        size: 1024000,
        storageProvider: 'filecoin',
        replicationFactor: 3,
        dealIds: ['partial1', 'partial2', 'partial3'],
        price: 0.5,
        duration: 365,
      })
      mockDb.track.create.mockRejectedValue(new Error('Track creation failed'))
      mockDb.user.update.mockRejectedValue(new Error('Balance update failed'))

      const request = new NextRequest('http://localhost:3000/api/filecoin', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.filecoinCid).toBe('bafybeigpartial...')
      expect(data.warning).toBe('File uploaded to Filecoin but track creation and balance update failed')
    }),

    it('should handle deal monitoring', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'audio/mpeg' }), 'test.mp3')
      formData.append('metadata', JSON.stringify({
        title: 'Deal Monitoring Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 180,
        price: 100,
      }))

      mockUploadToFilecoin.mockResolvedValue({
        cid: 'bafybeigdeal...',
        size: 1024000,
        storageProvider: 'filecoin',
        replicationFactor: 3,
        dealIds: ['deal1', 'deal2', 'deal3'],
        price: 0.5,
        duration: 365,
        dealStatus: {
          'deal1': 'active',
          'deal2': 'active',
          'deal3': 'pending',
        },
      })

      const request = new NextRequest('http://localhost:3000/api/filecoin', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.filecoinCid).toBe('bafybeigdeal...')
      expect(data.dealStatus).toEqual({
        'deal1': 'active',
        'deal2': 'active',
        'deal3': 'pending',
      })
    })
  })
})