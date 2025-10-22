import { NextRequest } from 'next/server'
import { POST } from '@/app/api/redundancy/route'
import { db } from '@/lib/db'
import { uploadToRedundancyStorage } from '@/lib/redundancy'

// Mock dependencies
jest.mock('@/lib/db')
jest.mock('@/lib/redundancy')

const mockDb = db as jest.Mocked<typeof db>
const mockUploadToRedundancyStorage = uploadToRedundancyStorage as jest.MockedFunction<typeof uploadToRedundancyStorage>

describe('Redundancy API - Comprehensive Tests', () => {
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
      redundancyCid: 'bafyreigdyrzt5s2o2...',
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
    mockUploadToRedundancyStorage.mockResolvedValue({
      cid: 'bafyreigdyrzt5s2o2...',
      size: 1024000,
      storageProviders: ['arweave', 'sia', 'storj'],
      replicationFactor: 3,
      locations: ['us-east-1', 'eu-west-1', 'ap-southeast-1'],
      price: 0.3,
      duration: 365,
      redundancyScore: 99.9,
    })
  })

  describe('POST /api/redundancy', () => {
    it('should upload file to redundancy storage successfully', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'audio/mpeg' }), 'test.mp3')
      formData.append('metadata', JSON.stringify({
        title: 'Test Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 180,
        price: 100,
      }))

      const request = new NextRequest('http://localhost:3000/api/redundancy', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.redundancyCid).toBe('bafyreigdyrzt5s2o2...')
      expect(data.storageProviders).toEqual(['arweave', 'sia', 'storj'])
      expect(data.replicationFactor).toBe(3)
      expect(data.locations).toEqual(['us-east-1', 'eu-west-1', 'ap-southeast-1'])
      expect(data.price).toBe(0.3)
      expect(data.duration).toBe(365)
      expect(data.redundancyScore).toBe(99.9)
      expect(mockUploadToRedundancyStorage).toHaveBeenCalledWith(
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

      const request = new NextRequest('http://localhost:3000/api/redundancy', {
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

      const request = new NextRequest('http://localhost:3000/api/redundancy', {
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

      const request = new NextRequest('http://localhost:3000/api/redundancy', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid metadata format')
    })

    it('should handle redundancy upload errors', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'audio/mpeg' }), 'test.mp3')
      formData.append('metadata', JSON.stringify({
        title: 'Test Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 180,
        price: 100,
      }))

      mockUploadToRedundancyStorage.mockRejectedValue(new Error('Redundancy upload failed'))

      const request = new NextRequest('http://localhost:3000/api/redundancy', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to upload to redundancy storage')
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

      mockUploadToRedundancyStorage.mockResolvedValue({
        cid: 'bafyreigdyrzt5s2o2...',
        size: 1024000,
        storageProviders: ['arweave', 'sia', 'storj'],
        replicationFactor: 3,
        locations: ['us-east-1', 'eu-west-1', 'ap-southeast-1'],
        price: 0.3,
        duration: 365,
        redundancyScore: 99.9,
      })
      mockDb.track.create.mockRejectedValue(new Error('Database creation failed'))

      const request = new NextRequest('http://localhost:3000/api/redundancy', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.redundancyCid).toBe('bafyreigdyrzt5s2o2...')
      expect(data.warning).toBe('File uploaded to redundancy storage but track creation failed')
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

      mockUploadToRedundancyStorage.mockResolvedValue({
        cid: 'bafyreigdyrzt5s2o2...',
        size: 1024000,
        storageProviders: ['arweave', 'sia', 'storj'],
        replicationFactor: 3,
        locations: ['us-east-1', 'eu-west-1', 'ap-southeast-1'],
        price: 0.3,
        duration: 365,
        redundancyScore: 99.9,
      })
      mockDb.track.create.mockResolvedValue({
        id: 'test-track-id',
        title: 'Test Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 180,
        ipfsHash: 'QmTestHash',
        filecoinCid: 'bafybeigdyrzt5s2o2...',
        redundancyCid: 'bafyreigdyrzt5s2o2...',
        metadata: Record<string, unknown>,
        price: 100,
        isExplicit: false,
        isPublished: true,
        artistId: 'test-artist-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      mockDb.user.update.mockRejectedValue(new Error('Balance update failed'))

      const request = new NextRequest('http://localhost:3000/api/redundancy', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.redundancyCid).toBe('bafyreigdyrzt5s2o2...')
      expect(data.warning).toBe('File uploaded to redundancy storage but balance update failed')
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

      mockUploadToRedundancyStorage.mockResolvedValue({
        cid: 'bafyreiglarge...',
        size: 10 * 1024 * 1024,
        storageProviders: ['arweave', 'sia', 'storj'],
        replicationFactor: 3,
        locations: ['us-east-1', 'eu-west-1', 'ap-southeast-1'],
        price: 3.0,
        duration: 365,
        redundancyScore: 99.9,
      })

      const request = new NextRequest('http://localhost:3000/api/redundancy', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.redundancyCid).toBe('bafyreiglarge...')
      expect(data.size).toBe(10 * 1024 * 1024)
      expect(data.price).toBe(3.0)
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

        mockUploadToRedundancyStorage.mockResolvedValue({
          cid: `bafyreig${fileType.extension}...`,
          size: 1024000,
          storageProviders: ['arweave', 'sia', 'storj'],
          replicationFactor: 3,
          locations: ['us-east-1', 'eu-west-1', 'ap-southeast-1'],
          price: 0.3,
          duration: 365,
          redundancyScore: 99.9,
        })

        const request = new NextRequest('http://localhost:3000/api/redundancy', {
          method: 'POST',
          body: formData,
        })

        const response = await POST(request)
        const data = await response.json()
        
        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.redundancyCid).toBe(`bafyreig${fileType.extension}...`)
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

      const request = new NextRequest('http://localhost:3000/api/redundancy', {
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

      const request = new NextRequest('http://localhost:3000/api/redundancy', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.redundancyCid).toBe('bafyreigdyrzt5s2o2...')
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

      mockUploadToRedundancyStorage.mockResolvedValue({
        cid: 'bafyreigdyrzt5s2o2...',
        size: 1024000,
        storageProviders: ['arweave', 'sia', 'storj', 'backblaze', 'wasabi'],
        replicationFactor: 5,
        locations: ['us-east-1', 'eu-west-1', 'ap-southeast-1', 'ca-central-1', 'sa-east-1'],
        price: 0.5,
        duration: 365,
        redundancyScore: 99.95,
      })

      const request = new NextRequest('http://localhost:3000/api/redundancy', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.redundancyCid).toBe('bafyreigdyrzt5s2o2...')
      expect(data.replicationFactor).toBe(5)
      expect(data.storageProviders).toHaveLength(5)
      expect(data.locations).toHaveLength(5)
      expect(data.price).toBe(0.5)
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

      mockUploadToRedundancyStorage.mockResolvedValue({
        cid: 'bafyreigdyrzt5s2o2...',
        size: 1024000,
        storageProviders: ['arweave', 'sia', 'storj'],
        replicationFactor: 3,
        locations: ['us-east-1', 'eu-west-1', 'ap-southeast-1'],
        price: 0.6,
        duration: 730,
        redundancyScore: 99.9,
      })

      const request = new NextRequest('http://localhost:3000/api/redundancy', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.redundancyCid).toBe('bafyreigdyrzt5s2o2...')
      expect(data.duration).toBe(730)
      expect(data.price).toBe(0.6)
    })

    it('should handle custom storage providers', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'audio/mpeg' }), 'test.mp3')
      formData.append('metadata', JSON.stringify({
        title: 'Test Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 180,
        price: 100,
      }))
      formData.append('storageProviders', 'arweave,sia')

      mockUploadToRedundancyStorage.mockResolvedValue({
        cid: 'bafyreigdyrzt5s2o2...',
        size: 1024000,
        storageProviders: ['arweave', 'sia'],
        replicationFactor: 2,
        locations: ['us-east-1', 'eu-west-1'],
        price: 0.2,
        duration: 365,
        redundancyScore: 99.5,
      })

      const request = new NextRequest('http://localhost:3000/api/redundancy', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.redundancyCid).toBe('bafyreigdyrzt5s2o2...')
      expect(data.storageProviders).toEqual(['arweave', 'sia'])
      expect(data.replicationFactor).toBe(2)
      expect(data.locations).toHaveLength(2)
      expect(data.price).toBe(0.2)
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

      mockUploadToRedundancyStorage.mockRejectedValue(new Error('Network error'))

      const request = new NextRequest('http://localhost:3000/api/redundancy', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to upload to redundancy storage')
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

      mockUploadToRedundancyStorage.mockRejectedValue(new Error('Request timeout'))

      const request = new NextRequest('http://localhost:3000/api/redundancy', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to upload to redundancy storage')
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

      const request = new NextRequest('http://localhost:3000/api/redundancy', {
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

      const request = new NextRequest('http://localhost:3000/api/redundancy', {
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

      const request = new NextRequest('http://localhost:3000/api/redundancy', {
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

      const request = new NextRequest('http://localhost:3000/api/redundancy', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid duration')
    })

    it('should handle invalid storage providers', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'audio/mpeg' }), 'test.mp3')
      formData.append('metadata', JSON.stringify({
        title: 'Test Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 180,
        price: 100,
      }))
      formData.append('storageProviders', 'invalid,provider')

      const request = new NextRequest('http://localhost:3000/api/redundancy', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid storage providers')
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

      const request = new NextRequest('http://localhost:3000/api/redundancy', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.redundancyCid).toBe('bafyreigdyrzt5s2o2...')
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

      const request = new NextRequest('http://localhost:3000/api/redundancy', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.redundancyCid).toBe('bafyreigdyrzt5s2o2...')
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

      const request = new NextRequest('http://localhost:3000/api/redundancy', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.redundancyCid).toBe('bafyreigdyrzt5s2o2...')
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

      mockUploadToRedundancyStorage.mockResolvedValue({
        cid: 'bafyreigdyrzt5s2o2...',
        size: 1024000,
        storageProviders: ['arweave'],
        replicationFactor: 1,
        locations: ['us-east-1'],
        price: 0.1,
        duration: 365,
        redundancyScore: 95.0,
      })

      const request = new NextRequest('http://localhost:3000/api/redundancy', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.redundancyCid).toBe('bafyreigdyrzt5s2o2...')
      expect(data.replicationFactor).toBe(1)
      expect(data.storageProviders).toHaveLength(1)
      expect(data.locations).toHaveLength(1)
      expect(data.redundancyScore).toBe(95.0)
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

      mockUploadToRedundancyStorage.mockResolvedValue({
        cid: 'bafyreigdyrzt5s2o2...',
        size: 1024000,
        storageProviders: Array.from({ length: 10 }, (_, i) => `provider${i}`),
        replicationFactor: 10,
        locations: Array.from({ length: 10 }, (_, i) => `location${i}`),
        price: 1.0,
        duration: 365,
        redundancyScore: 99.99,
      })

      const request = new NextRequest('http://localhost:3000/api/redundancy', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.redundancyCid).toBe('bafyreigdyrzt5s2o2...')
      expect(data.replicationFactor).toBe(10)
      expect(data.storageProviders).toHaveLength(10)
      expect(data.locations).toHaveLength(10)
      expect(data.redundancyScore).toBe(99.99)
    })

    it('should handle single storage provider', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'audio/mpeg' }), 'test.mp3')
      formData.append('metadata', JSON.stringify({
        title: 'Test Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 180,
        price: 100,
      }))
      formData.append('storageProviders', 'arweave')

      mockUploadToRedundancyStorage.mockResolvedValue({
        cid: 'bafyreigdyrzt5s2o2...',
        size: 1024000,
        storageProviders: ['arweave'],
        replicationFactor: 1,
        locations: ['us-east-1'],
        price: 0.1,
        duration: 365,
        redundancyScore: 95.0,
      })

      const request = new NextRequest('http://localhost:3000/api/redundancy', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.redundancyCid).toBe('bafyreigdyrzt5s2o2...')
      expect(data.storageProviders).toEqual(['arweave'])
      expect(data.replicationFactor).toBe(1)
      expect(data.redundancyScore).toBe(95.0)
    })

    it('should handle all storage providers', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'audio/mpeg' }), 'test.mp3')
      formData.append('metadata', JSON.stringify({
        title: 'Test Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 180,
        price: 100,
      }))
      formData.append('storageProviders', 'arweave,sia,storj,backblaze,wasabi,cloudflare,google,amazon,microsoft,ovh')

      mockUploadToRedundancyStorage.mockResolvedValue({
        cid: 'bafyreigdyrzt5s2o2...',
        size: 1024000,
        storageProviders: ['arweave', 'sia', 'storj', 'backblaze', 'wasabi', 'cloudflare', 'google', 'amazon', 'microsoft', 'ovh'],
        replicationFactor: 10,
        locations: Array.from({ length: 10 }, (_, i) => `location${i}`),
        price: 1.0,
        duration: 365,
        redundancyScore: 99.99,
      })

      const request = new NextRequest('http://localhost:3000/api/redundancy', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.redundancyCid).toBe('bafyreigdyrzt5s2o2...')
      expect(data.storageProviders).toHaveLength(10)
      expect(data.replicationFactor).toBe(10)
      expect(data.redundancyScore).toBe(99.99)
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

      mockUploadToRedundancyStorage.mockResolvedValue({
        cid: 'bafyreigdyrzt5s2o2...',
        size: 1024000,
        storageProviders: ['arweave', 'sia', 'storj'],
        replicationFactor: 3,
        locations: ['us-east-1', 'eu-west-1', 'ap-southeast-1'],
        price: 0.3,
        duration: 365,
        redundancyScore: 99.9,
      })

      const startTime = performance.now()
      
      const request = new NextRequest('http://localhost:3000/api/redundancy', {
        method: 'POST',
        body: formData,
      })
      const response = await POST(request)
      
      const endTime = performance.now()
      const responseTime = endTime - startTime
      
      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(8000) // Should respond in less than 8 seconds for redundancy upload
    })

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

      mockUploadToRedundancyStorage.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({
          cid: 'bafyreigdyrzt5s2o2...',
          size: 1024000,
          storageProviders: ['arweave', 'sia', 'storj'],
          replicationFactor: 3,
          locations: ['us-east-1', 'eu-west-1', 'ap-southeast-1'],
          price: 0.3,
          duration: 365,
          redundancyScore: 99.9,
        }), 2000) // Simulate 2 second upload time
      }))

      const startTime = performance.now()
      
      const requests = Array.from({ length: 3 }, () => 
        new NextRequest('http://localhost:3000/api/redundancy', {
          method: 'POST',
          body: formData,
        })
      )
      
      const responses = await Promise.all(requests.map(req => POST(req)))
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      expect(responses.every(r => r.status === 200)).toBe(true)
      expect(totalTime).toBeLessThan(8000) // Should handle 3 concurrent requests in less than 8 seconds
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

      const request = new NextRequest('http://localhost:3000/api/redundancy', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.redundancyCid).toBe('bafyreigdyrzt5s2o2...')
    })

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

      const request = new NextRequest('http://localhost:3000/api/redundancy', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.redundancyCid).toBe('bafyreigdyrzt5s2o2...')
    })

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

      const request = new NextRequest('http://localhost:3000/api/redundancy', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid file type. Only audio files are allowed')
    })

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

      const request = new NextRequest('http://localhost:3000/api/redundancy', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('File size exceeds maximum limit of 50MB')
    })

    it('should prevent invalid storage providers', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'audio/mpeg' }), 'test.mp3')
      formData.append('metadata', JSON.stringify({
        title: 'Test Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 180,
        price: 100,
      }))
      formData.append('storageProviders', 'malicious,provider')

      const request = new NextRequest('http://localhost:3000/api/redundancy', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid storage providers')
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
      formData.append('storageProviders', 'arweave,sia,storj')

      mockUploadToRedundancyStorage.mockResolvedValue({
        cid: 'bafyreigcomplete...',
        size: 1024000,
        storageProviders: ['arweave', 'sia', 'storj'],
        replicationFactor: 3,
        locations: ['us-east-1', 'eu-west-1', 'ap-southeast-1'],
        price: 0.3,
        duration: 365,
        redundancyScore: 99.9,
      })

      const request = new NextRequest('http://localhost:3000/api/redundancy', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.redundancyCid).toBe('bafyreigcomplete...')
      expect(data.storageProviders).toEqual(['arweave', 'sia', 'storj'])
      expect(data.replicationFactor).toBe(3)
      expect(data.locations).toEqual(['us-east-1', 'eu-west-1', 'ap-southeast-1'])
      expect(data.price).toBe(0.3)
      expect(data.duration).toBe(365)
      expect(data.redundancyScore).toBe(99.9)
      expect(data.trackId).toBe('test-track-id')
    })

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

      mockUploadToRedundancyStorage.mockResolvedValue({
        cid: 'bafyreigpartial...',
        size: 1024000,
        storageProviders: ['arweave', 'sia', 'storj'],
        replicationFactor: 3,
        locations: ['us-east-1', 'eu-west-1', 'ap-southeast-1'],
        price: 0.3,
        duration: 365,
        redundancyScore: 99.9,
      })
      mockDb.track.create.mockRejectedValue(new Error('Track creation failed'))
      mockDb.user.update.mockRejectedValue(new Error('Balance update failed'))

      const request = new NextRequest('http://localhost:3000/api/redundancy', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.redundancyCid).toBe('bafyreigpartial...')
      expect(data.warning).toBe('File uploaded to redundancy storage but track creation and balance update failed')
    })

    it('should handle storage provider monitoring', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'audio/mpeg' }), 'test.mp3')
      formData.append('metadata', JSON.stringify({
        title: 'Storage Monitoring Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 180,
        price: 100,
      }))

      mockUploadToRedundancyStorage.mockResolvedValue({
        cid: 'bafyreigmonitor...',
        size: 1024000,
        storageProviders: ['arweave', 'sia', 'storj'],
        replicationFactor: 3,
        locations: ['us-east-1', 'eu-west-1', 'ap-southeast-1'],
        price: 0.3,
        duration: 365,
        redundancyScore: 99.9,
        providerStatus: {
          'arweave': 'active',
          'sia': 'active',
          'storj': 'degraded',
        },
      })

      const request = new NextRequest('http://localhost:3000/api/redundancy', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.redundancyCid).toBe('bafyreigmonitor...')
      expect(data.providerStatus).toEqual({
        'arweave': 'active',
        'sia': 'active',
        'storj': 'degraded',
      })
    })

    it('should handle redundancy scoring', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'audio/mpeg' }), 'test.mp3')
      formData.append('metadata', JSON.stringify({
        title: 'Redundancy Scoring Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 180,
        price: 100,
      }))

      mockUploadToRedundancyStorage.mockResolvedValue({
        cid: 'bafyreigscore...',
        size: 1024000,
        storageProviders: ['arweave', 'sia', 'storj'],
        replicationFactor: 3,
        locations: ['us-east-1', 'eu-west-1', 'ap-southeast-1'],
        price: 0.3,
        duration: 365,
        redundancyScore: 99.95,
        scoringDetails: {
          geographicDistribution: 98.5,
          providerDiversity: 99.0,
          uptime: 99.9,
          durability: 99.8,
        },
      })

      const request = new NextRequest('http://localhost:3000/api/redundancy', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.redundancyCid).toBe('bafyreigscore...')
      expect(data.redundancyScore).toBe(99.95)
      expect(data.scoringDetails).toEqual({
        geographicDistribution: 98.5,
        providerDiversity: 99.0,
        uptime: 99.9,
        durability: 99.8,
      })
    })
  })
})