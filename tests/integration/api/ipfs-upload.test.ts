import { NextRequest } from 'next/server'
import { POST } from '@/app/api/ipfs/upload/route'
import { db } from '@/lib/db'
import { uploadToIPFS } from '@/lib/ipfs'
import { pinFileToIPFS } from '@/lib/pinata'

// Mock dependencies
jest.mock('@/lib/db')
jest.mock('@/lib/ipfs')
jest.mock('@/lib/pinata')

const mockDb = db as jest.Mocked<typeof db>
const mockUploadToIPFS = uploadToIPFS as jest.MockedFunction<typeof uploadToIPFS>
const mockPinFileToIPFS = pinFileToIPFS as jest.MockedFunction<typeof pinFileToIPFS>

describe('IPFS Upload API - Comprehensive Tests', () => {
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
    mockUploadToIPFS.mockResolvedValue({
      cid: 'QmTestHash',
      size: 1024000,
      url: 'https://ipfs.io/ipfs/QmTestHash',
    })
    mockPinFileToIPFS.mockResolvedValue({
      success: true,
      pinSize: 1024000,
      ipfsHash: 'QmTestHash',
    })
  })

  describe('POST /api/ipfs/upload', () => {
    it('should upload file to IPFS successfully', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'audio/mpeg' }), 'test.mp3')
      formData.append('metadata', JSON.stringify({
        title: 'Test Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 180,
        price: 100,
      }))

      const request = new NextRequest('http://localhost:3000/api/ipfs/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.ipfsHash).toBe('QmTestHash')
      expect(data.url).toBe('https://ipfs.io/ipfs/QmTestHash')
      expect(mockUploadToIPFS).toHaveBeenCalledWith(
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

      const request = new NextRequest('http://localhost:3000/api/ipfs/upload', {
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

      const request = new NextRequest('http://localhost:3000/api/ipfs/upload', {
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

      const request = new NextRequest('http://localhost:3000/api/ipfs/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid metadata format')
    })

    it('should handle IPFS upload errors', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'audio/mpeg' }), 'test.mp3')
      formData.append('metadata', JSON.stringify({
        title: 'Test Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 180,
        price: 100,
      }))

      mockUploadToIPFS.mockRejectedValue(new Error('IPFS upload failed'))

      const request = new NextRequest('http://localhost:3000/api/ipfs/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to upload to IPFS')
    })

    it('should handle Pinata pin errors', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'audio/mpeg' }), 'test.mp3')
      formData.append('metadata', JSON.stringify({
        title: 'Test Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 180,
        price: 100,
      }))

      mockUploadToIPFS.mockResolvedValue({
        cid: 'QmTestHash',
        size: 1024000,
        url: 'https://ipfs.io/ipfs/QmTestHash',
      })
      mockPinFileToIPFS.mockRejectedValue(new Error('Pinata pin failed'))

      const request = new NextRequest('http://localhost:3000/api/ipfs/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.ipfsHash).toBe('QmTestHash')
      expect(data.warning).toBe('File uploaded but not pinned to Pinata')
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

      mockUploadToIPFS.mockResolvedValue({
        cid: 'QmTestHash',
        size: 1024000,
        url: 'https://ipfs.io/ipfs/QmTestHash',
      })
      mockDb.track.create.mockRejectedValue(new Error('Database creation failed'))

      const request = new NextRequest('http://localhost:3000/api/ipfs/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.ipfsHash).toBe('QmTestHash')
      expect(data.warning).toBe('File uploaded but track creation failed')
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

      mockUploadToIPFS.mockResolvedValue({
        cid: 'QmTestHash',
        size: 1024000,
        url: 'https://ipfs.io/ipfs/QmTestHash',
      })
      mockDb.track.create.mockResolvedValue({
        id: 'test-track-id',
        title: 'Test Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 180,
        ipfsHash: 'QmTestHash',
        metadata: Record<string, unknown>,
        price: 100,
        isExplicit: false,
        isPublished: true,
        artistId: 'test-artist-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      mockDb.user.update.mockRejectedValue(new Error('Balance update failed'))

      const request = new NextRequest('http://localhost:3000/api/ipfs/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.ipfsHash).toBe('QmTestHash')
      expect(data.warning).toBe('File uploaded but balance update failed')
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

      mockUploadToIPFS.mockResolvedValue({
        cid: 'QmLargeHash',
        size: 10 * 1024 * 1024,
        url: 'https://ipfs.io/ipfs/QmLargeHash',
      })

      const request = new NextRequest('http://localhost:3000/api/ipfs/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.ipfsHash).toBe('QmLargeHash')
      expect(data.size).toBe(10 * 1024 * 1024)
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

        mockUploadToIPFS.mockResolvedValue({
          cid: `Qm${fileType.extension}Hash`,
          size: 1024000,
          url: `https://ipfs.io/ipfs/Qm${fileType.extension}Hash`,
        })

        const request = new NextRequest('http://localhost:3000/api/ipfs/upload', {
          method: 'POST',
          body: formData,
        })

        const response = await POST(request)
        const data = await response.json()
        
        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.ipfsHash).toBe(`Qm${fileType.extension}Hash`)
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

      const request = new NextRequest('http://localhost:3000/api/ipfs/upload', {
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

      const request = new NextRequest('http://localhost:3000/api/ipfs/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.ipfsHash).toBe('QmTestHash')
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

      mockUploadToIPFS.mockRejectedValue(new Error('Network error'))

      const request = new NextRequest('http://localhost:3000/api/ipfs/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to upload to IPFS')
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

      mockUploadToIPFS.mockRejectedValue(new Error('Request timeout'))

      const request = new NextRequest('http://localhost:3000/api/ipfs/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to upload to IPFS')
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

      const request = new NextRequest('http://localhost:3000/api/ipfs/upload', {
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

      const request = new NextRequest('http://localhost:3000/api/ipfs/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid file type. Only audio files are allowed')
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

      const request = new NextRequest('http://localhost:3000/api/ipfs/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.ipfsHash).toBe('QmTestHash')
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

      const request = new NextRequest('http://localhost:3000/api/ipfs/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.ipfsHash).toBe('QmTestHash')
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

      const request = new NextRequest('http://localhost:3000/api/ipfs/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.ipfsHash).toBe('QmTestHash')
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

      mockUploadToIPFS.mockResolvedValue({
        cid: 'QmTestHash',
        size: 1024000,
        url: 'https://ipfs.io/ipfs/QmTestHash',
      })

      const startTime = performance.now()
      
      const request = new NextRequest('http://localhost:3000/api/ipfs/upload', {
        method: 'POST',
        body: formData,
      })
      const response = await POST(request)
      
      const endTime = performance.now()
      const responseTime = endTime - startTime
      
      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(5000) // Should respond in less than 5 seconds for IPFS upload
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

      mockUploadToIPFS.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({
          cid: 'QmTestHash',
          size: 1024000,
          url: 'https://ipfs.io/ipfs/QmTestHash',
        }), 1000) // Simulate 1 second upload time
      }))

      const startTime = performance.now()
      
      const requests = Array.from({ length: 3 }, () => 
        new NextRequest('http://localhost:3000/api/ipfs/upload', {
          method: 'POST',
          body: formData,
        })
      )
      
      const responses = await Promise.all(requests.map(req => POST(req)))
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      expect(responses.every(r => r.status === 200)).toBe(true)
      expect(totalTime).toBeLessThan(4000) // Should handle 3 concurrent requests in less than 4 seconds
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

      const request = new NextRequest('http://localhost:3000/api/ipfs/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.ipfsHash).toBe('QmTestHash')
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

      const request = new NextRequest('http://localhost:3000/api/ipfs/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.ipfsHash).toBe('QmTestHash')
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

      const request = new NextRequest('http://localhost:3000/api/ipfs/upload', {
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

      const request = new NextRequest('http://localhost:3000/api/ipfs/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('File size exceeds maximum limit of 50MB')
    })
  })

  describe('Integration Tests', {
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

      mockUploadToIPFS.mockResolvedValue({
        cid: 'QmCompleteHash',
        size: 1024000,
        url: 'https://ipfs.io/ipfs/QmCompleteHash',
      })
      mockPinFileToIPFS.mockResolvedValue({
        success: true,
        pinSize: 1024000,
        ipfsHash: 'QmCompleteHash',
      })

      const request = new NextRequest('http://localhost:3000/api/ipfs/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.ipfsHash).toBe('QmCompleteHash')
      expect(data.url).toBe('https://ipfs.io/ipfs/QmCompleteHash')
      expect(data.pinned).toBe(true)
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

      mockUploadToIPFS.mockResolvedValue({
        cid: 'QmPartialHash',
        size: 1024000,
        url: 'https://ipfs.io/ipfs/QmPartialHash',
      })
      mockPinFileToIPFS.mockRejectedValue(new Error('Pin failed'))
      mockDb.track.create.mockRejectedValue(new Error('Track creation failed'))

      const request = new NextRequest('http://localhost:3000/api/ipfs/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.ipfsHash).toBe('QmPartialHash')
      expect(data.warning).toBe('File uploaded but not pinned and track creation failed')
    })
  })
})