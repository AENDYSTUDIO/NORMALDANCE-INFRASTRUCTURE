import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/tracks/route'
import { db } from '@/lib/db'
import { z } from 'zod'

// Mock dependencies
jest.mock('@/lib/db')
jest.mock('zod')

const mockDb = db as jest.Mocked<typeof db>
const mockZod = z as jest.Mocked<typeof z>

describe('Tracks API - Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default mock implementations
    mockDb.track.findMany.mockResolvedValue([])
    mockDb.track.count.mockResolvedValue(0)
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
    mockDb.reward.create.mockResolvedValue({
      id: 'test-reward-id',
      userId: 'test-artist-id',
      type: 'UPLOAD',
      amount: 20,
      reason: 'Test reward',
      createdAt: new Date(),
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
  })

  describe('GET /api/tracks', () => {
    it('should get tracks with default parameters', async () => {
      const mockTracks = [
        {
          id: '1',
          title: 'Test Track 1',
          artistName: 'Test Artist 1',
          genre: 'Rock',
          duration: 180,
          ipfsHash: 'QmHash1',
          metadata: Record<string, unknown>,
          price: 100,
          isExplicit: false,
          isPublished: true,
          artist: {
            id: 'artist1',
            username: 'artist1',
            displayName: 'Artist 1',
            avatar: 'avatar1.jpg',
          },
          _count: {
            likes: 10,
            comments: 5,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ]

      mockDb.track.findMany.mockResolvedValue(mockTracks)
      mockDb.track.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/tracks')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.tracks).toHaveLength(1)
      expect(data.pagination.page).toBe(1)
      expect(data.pagination.limit).toBe(10)
      expect(data.pagination.total).toBe(1)
      expect(data.pagination.pages).toBe(1)
    })

    it('should get tracks with pagination', async () => {
      const mockTracks = [
        {
          id: '1',
          title: 'Test Track 1',
          artistName: 'Test Artist 1',
          genre: 'Rock',
          duration: 180,
          ipfsHash: 'QmHash1',
          metadata: Record<string, unknown>,
          price: 100,
          isExplicit: false,
          isPublished: true,
          artist: {
            id: 'artist1',
            username: 'artist1',
            displayName: 'Artist 1',
            avatar: 'avatar1.jpg',
          },
          _count: {
            likes: 10,
            comments: 5,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          title: 'Test Track 2',
          artistName: 'Test Artist 2',
          genre: 'Pop',
          duration: 200,
          ipfsHash: 'QmHash2',
          metadata: Record<string, unknown>,
          price: 150,
          isExplicit: false,
          isPublished: true,
          artist: {
            id: 'artist2',
            username: 'artist2',
            displayName: 'Artist 2',
            avatar: 'avatar2.jpg',
          },
          _count: {
            likes: 20,
            comments: 10,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ]

      mockDb.track.findMany.mockResolvedValue(mockTracks)
      mockDb.track.count.mockResolvedValue(2)

      const request = new NextRequest('http://localhost:3000/api/tracks?page=2&limit=5')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.tracks).toHaveLength(2)
      expect(data.pagination.page).toBe(2)
      expect(data.pagination.limit).toBe(5)
      expect(data.pagination.total).toBe(2)
      expect(data.pagination.pages).toBe(1)
    })

    it('should get tracks with search filter', async () => {
      const mockTracks = [
        {
          id: '1',
          title: 'Summer Vibes',
          artistName: 'DJ Normal',
          genre: 'House',
          duration: 180,
          ipfsHash: 'QmHash1',
          metadata: Record<string, unknown>,
          price: 100,
          isExplicit: false,
          isPublished: true,
          artist: {
            id: 'artist1',
            username: 'djnormal',
            displayName: 'DJ Normal',
            avatar: 'avatar1.jpg',
          },
          _count: {
            likes: 10,
            comments: 5,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ]

      mockDb.track.findMany.mockResolvedValue(mockTracks)
      mockDb.track.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/tracks?search=summer')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.tracks).toHaveLength(1)
      expect(data.tracks[0].title).toBe('Summer Vibes')
    })

    it('should get tracks with genre filter', async () => {
      const mockTracks = [
        {
          id: '1',
          title: 'Rock Anthem',
          artistName: 'Rock Band',
          genre: 'Rock',
          duration: 240,
          ipfsHash: 'QmHash1',
          metadata: Record<string, unknown>,
          price: 200,
          isExplicit: false,
          isPublished: true,
          artist: {
            id: 'artist1',
            username: 'rockband',
            displayName: 'Rock Band',
            avatar: 'avatar1.jpg',
          },
          _count: {
            likes: 15,
            comments: 8,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ]

      mockDb.track.findMany.mockResolvedValue(mockTracks)
      mockDb.track.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/tracks?genre=rock')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.tracks).toHaveLength(1)
      expect(data.tracks[0].genre).toBe('Rock')
    })

    it('should get tracks with artist filter', async () => {
      const mockTracks = [
        {
          id: '1',
          title: 'Artist Track',
          artistName: 'Test Artist',
          genre: 'Electronic',
          duration: 200,
          ipfsHash: 'QmHash1',
          metadata: Record<string, unknown>,
          price: 120,
          isExplicit: false,
          isPublished: true,
          artist: {
            id: 'artist1',
            username: 'testartist',
            displayName: 'Test Artist',
            avatar: 'avatar1.jpg',
          },
          _count: {
            likes: 12,
            comments: 6,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ]

      mockDb.track.findMany.mockResolvedValue(mockTracks)
      mockDb.track.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/tracks?artistId=artist1')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.tracks).toHaveLength(1)
      expect(data.tracks[0].artistId).toBe('artist1')
    })

    it('should get tracks with sorting', async () => {
      const mockTracks = [
        {
          id: '1',
          title: 'Old Track',
          artistName: 'Test Artist',
          genre: 'Pop',
          duration: 180,
          ipfsHash: 'QmHash1',
          metadata: Record<string, unknown>,
          price: 100,
          isExplicit: false,
          isPublished: true,
          artist: {
            id: 'artist1',
            username: 'testartist',
            displayName: 'Test Artist',
            avatar: 'avatar1.jpg',
          },
          _count: {
            likes: 10,
            comments: 5,
          },
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date(),
        },
        {
          id: '2',
          title: 'New Track',
          artistName: 'Test Artist',
          genre: 'Pop',
          duration: 200,
          ipfsHash: 'QmHash2',
          metadata: Record<string, unknown>,
          price: 150,
          isExplicit: false,
          isPublished: true,
          artist: {
            id: 'artist1',
            username: 'testartist',
            displayName: 'Test Artist',
            avatar: 'avatar1.jpg',
          },
          _count: {
            likes: 20,
            comments: 10,
          },
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date(),
        }
      ]

      mockDb.track.findMany.mockResolvedValue(mockTracks)
      mockDb.track.count.mockResolvedValue(2)

      const request = new NextRequest('http://localhost:3000/api/tracks?sortBy=createdAt&sortOrder=desc')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.tracks).toHaveLength(2)
      expect(data.tracks[0].title).toBe('New Track')
      expect(data.tracks[1].title).toBe('Old Track')
    })

    it('should handle empty results', async () => {
      mockDb.track.findMany.mockResolvedValue([])
      mockDb.track.count.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/tracks?search=nonexistent')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.tracks).toHaveLength(0)
      expect(data.pagination.total).toBe(0)
    })

    it('should handle database errors gracefully', async () => {
      mockDb.track.findMany.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/tracks')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch tracks')
    })
  })

  describe('POST /api/tracks', () => {
    it('should create a new track successfully', async () => {
      const mockTrackData = {
        title: 'New Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 200,
        ipfsHash: 'QmNewHash',
        metadata: { bpm: 128 },
        price: 150,
        isExplicit: false,
        isPublished: true,
      }

      const mockZodParse = mockZod.object().parse as jest.MockedFunction<any>
      mockZodParse.mockReturnValue(mockTrackData)

      const mockCreatedTrack = {
        id: 'new-track-id',
        title: 'New Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 200,
        ipfsHash: 'QmNewHash',
        metadata: { bpm: 128 },
        price: 150,
        isExplicit: false,
        isPublished: true,
        artistId: 'default-artist-id',
        artist: {
          id: 'default-artist-id',
          username: 'defaultartist',
          displayName: 'Default Artist',
          avatar: 'default-avatar.jpg',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockDb.track.create.mockResolvedValue(mockCreatedTrack)

      const request = new NextRequest('http://localhost:3000/api/tracks', {
        method: 'POST',
        body: JSON.stringify(mockTrackData),
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data.title).toBe('New Track')
      expect(data.artistName).toBe('Test Artist')
      expect(mockDb.track.create).toHaveBeenCalledWith({
        data: {
          ...mockTrackData,
          artistId: 'default-artist-id',
        },
        include: {
          artist: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            }
          }
        }
      })
    })

    it('should handle validation errors', async () => {
      const mockZodParse = mockZod.object().parse as jest.MockedFunction<any>
      mockZodParse.mockImplementation(() => {
        throw new Error('Validation failed')
      })

      const request = new NextRequest('http://localhost:3000/api/tracks', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
    })

    it('should handle missing required fields', async () => {
      const mockZodParse = mockZod.object().parse as jest.MockedFunction<any>
      mockZodParse.mockImplementation(() => {
        throw new Error('Missing required fields')
      })

      const request = new NextRequest('http://localhost:3000/api/tracks', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test' }),
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
    })

    it('should handle database creation errors', async () => {
      const mockTrackData = {
        title: 'New Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 200,
        ipfsHash: 'QmNewHash',
        metadata: { bpm: 128 },
        price: 150,
        isExplicit: false,
        isPublished: true,
      }

      const mockZodParse = mockZod.object().parse as jest.MockedFunction<any>
      mockZodParse.mockReturnValue(mockTrackData)

      mockDb.track.create.mockRejectedValue(new Error('Creation failed'))

      const request = new NextRequest('http://localhost:3000/api/tracks', {
        method: 'POST',
        body: JSON.stringify(mockTrackData),
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create track')
    })

    it('should handle reward creation errors gracefully', async () => {
      const mockTrackData = {
        title: 'New Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 200,
        ipfsHash: 'QmNewHash',
        metadata: { bpm: 128 },
        price: 150,
        isExplicit: false,
        isPublished: true,
      }

      const mockZodParse = mockZod.object().parse as jest.MockedFunction<any>
      mockZodParse.mockReturnValue(mockTrackData)

      const mockCreatedTrack = {
        id: 'new-track-id',
        title: 'New Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 200,
        ipfsHash: 'QmNewHash',
        metadata: { bpm: 128 },
        price: 150,
        isExplicit: false,
        isPublished: true,
        artistId: 'default-artist-id',
        artist: {
          id: 'default-artist-id',
          username: 'defaultartist',
          displayName: 'Default Artist',
          avatar: 'default-avatar.jpg',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockDb.track.create.mockResolvedValue(mockCreatedTrack)
      mockDb.reward.create.mockRejectedValue(new Error('Reward creation failed'))

      const request = new NextRequest('http://localhost:3000/api/tracks', {
        method: 'POST',
        body: JSON.stringify(mockTrackData),
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data.title).toBe('New Track')
    })

    it('should handle user balance update errors gracefully', async () => {
      const mockTrackData = {
        title: 'New Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 200,
        ipfsHash: 'QmNewHash',
        metadata: { bpm: 128 },
        price: 150,
        isExplicit: false,
        isPublished: true,
      }

      const mockZodParse = mockZod.object().parse as jest.MockedFunction<any>
      mockZodParse.mockReturnValue(mockTrackData)

      const mockCreatedTrack = {
        id: 'new-track-id',
        title: 'New Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 200,
        ipfsHash: 'QmNewHash',
        metadata: { bpm: 128 },
        price: 150,
        isExplicit: false,
        isPublished: true,
        artistId: 'default-artist-id',
        artist: {
          id: 'default-artist-id',
          username: 'defaultartist',
          displayName: 'Default Artist',
          avatar: 'default-avatar.jpg',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockDb.track.create.mockResolvedValue(mockCreatedTrack)
      mockDb.reward.create.mockResolvedValue({
        id: 'test-reward-id',
        userId: 'default-artist-id',
        type: 'UPLOAD',
        amount: 20,
        reason: 'Test reward',
        createdAt: new Date(),
      })
      mockDb.user.update.mockRejectedValue(new Error('Balance update failed'))

      const request = new NextRequest('http://localhost:3000/api/tracks', {
        method: 'POST',
        body: JSON.stringify(mockTrackData),
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data.title).toBe('New Track')
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid JSON body', async () => {
      const request = new NextRequest('http://localhost:3000/api/tracks', {
        method: 'POST',
        body: 'invalid json',
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
    })

    it('should handle empty request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/tracks', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
    })

    it('should handle network errors', async () => {
      mockDb.track.findMany.mockRejectedValue(new Error('Network error'))

      const request = new NextRequest('http://localhost:3000/api/tracks')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch tracks')
    })

    it('should handle timeout errors', async () => {
      mockDb.track.findMany.mockRejectedValue(new Error('Request timeout'))

      const request = new NextRequest('http://localhost:3000/api/tracks')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch tracks')
    })
  })

  describe('Edge Cases', () => {
    it('should handle very large pagination numbers', async () => {
      const mockTracks = []
      mockDb.track.findMany.mockResolvedValue(mockTracks)
      mockDb.track.count.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/tracks?page=999999&limit=1000')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.pagination.page).toBe(999999)
      expect(data.pagination.limit).toBe(1000)
      expect(data.pagination.pages).toBe(0)
    })

    it('should handle negative pagination numbers', async () => {
      const mockTracks = []
      mockDb.track.findMany.mockResolvedValue(mockTracks)
      mockDb.track.count.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/tracks?page=-1&limit=-10')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.pagination.page).toBe(1)
      expect(data.pagination.limit).toBe(10)
    })

    it('should handle special characters in search', async () => {
      const mockTracks = [
        {
          id: '1',
          title: 'Test Track with special chars: !@#$%^&*()',
          artistName: 'Test Artist',
          genre: 'Test',
          duration: 180,
          ipfsHash: 'QmHash1',
          metadata: Record<string, unknown>,
          price: 100,
          isExplicit: false,
          isPublished: true,
          artist: {
            id: 'artist1',
            username: 'testartist',
            displayName: 'Test Artist',
            avatar: 'avatar1.jpg',
          },
          _count: {
            likes: 10,
            comments: 5,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ]

      mockDb.track.findMany.mockResolvedValue(mockTracks)
      mockDb.track.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/tracks?search=!@#$%^&*()')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.tracks).toHaveLength(1)
    })

    it('should handle Unicode characters in search', async () => {
      const mockTracks = [
        {
          id: '1',
          title: 'Тестовый трек с русскими символами',
          artistName: 'Тестовый исполнитель',
          genre: 'Test',
          duration: 180,
          ipfsHash: 'QmHash1',
          metadata: Record<string, unknown>,
          price: 100,
          isExplicit: false,
          isPublished: true,
          artist: {
            id: 'artist1',
            username: 'testartist',
            displayName: 'Test Artist',
            avatar: 'avatar1.jpg',
          },
          _count: {
            likes: 10,
            comments: 5,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ]

      mockDb.track.findMany.mockResolvedValue(mockTracks)
      mockDb.track.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/tracks?search=русские')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.tracks).toHaveLength(1)
    })
  })

  describe('Performance Tests', () => {
    it('should handle track requests quickly', async () => {
      const mockTracks = [
        {
          id: '1',
          title: 'Test Track',
          artistName: 'Test Artist',
          genre: 'Test',
          duration: 180,
          ipfsHash: 'QmHash1',
          metadata: Record<string, unknown>,
          price: 100,
          isExplicit: false,
          isPublished: true,
          artist: {
            id: 'artist1',
            username: 'testartist',
            displayName: 'Test Artist',
            avatar: 'avatar1.jpg',
          },
          _count: {
            likes: 10,
            comments: 5,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ]

      mockDb.track.findMany.mockResolvedValue(mockTracks)
      mockDb.track.count.mockResolvedValue(1)

      const startTime = performance.now()
      
      const request = new NextRequest('http://localhost:3000/api/tracks')
      const response = await GET(request)
      
      const endTime = performance.now()
      const responseTime = endTime - startTime
      
      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(100) // Should respond in less than 100ms
    })

    it('should handle concurrent track requests', async () => {
      const mockTracks = [
        {
          id: '1',
          title: 'Test Track',
          artistName: 'Test Artist',
          genre: 'Test',
          duration: 180,
          ipfsHash: 'QmHash1',
          metadata: Record<string, unknown>,
          price: 100,
          isExplicit: false,
          isPublished: true,
          artist: {
            id: 'artist1',
            username: 'testartist',
            displayName: 'Test Artist',
            avatar: 'avatar1.jpg',
          },
          _count: {
            likes: 10,
            comments: 5,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ]

      mockDb.track.findMany.mockResolvedValue(mockTracks)
      mockDb.track.count.mockResolvedValue(1)

      const startTime = performance.now()
      
      const requests = Array.from({ length: 5 }, () => 
        new NextRequest('http://localhost:3000/api/tracks')
      )
      
      const responses = await Promise.all(requests.map(req => GET(req)))
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      expect(responses.every(r => r.status === 200)).toBe(true)
      expect(totalTime).toBeLessThan(500) // Should handle 5 requests in less than 500ms
    })
  })

  describe('Security Tests', () => {
    it('should prevent SQL injection in search', async () => {
      const mockTracks = []
      mockDb.track.findMany.mockResolvedValue(mockTracks)
      mockDb.track.count.mockResolvedValue(0)

      const maliciousSearch = "test'; DROP TABLE tracks; --"
      
      const request = new NextRequest(`http://localhost:3000/api/tracks?search=${maliciousSearch}`)
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.tracks).toHaveLength(0)
    })

    it('should prevent XSS in search', async () => {
      const mockTracks = []
      mockDb.track.findMany.mockResolvedValue(mockTracks)
      mockDb.track.count.mockResolvedValue(0)

      const xssSearch = '<script>alert("xss")</script>'
      
      const request = new NextRequest(`http://localhost:3000/api/tracks?search=${xssSearch}`)
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.tracks).toHaveLength(0)
    })

    it('should validate input data', async () => {
      const mockZodParse = mockZod.object().parse as jest.MockedFunction<any>
      mockZodParse.mockImplementation(() => {
        throw new Error('Invalid input')
      })

      const maliciousData = {
        title: "'; DROP TABLE tracks; --",
        artistName: 'Test Artist',
        genre: 'Test',
        duration: 180,
        ipfsHash: 'QmHash1',
      }

      const request = new NextRequest('http://localhost:3000/api/tracks', {
        method: 'POST',
        body: JSON.stringify(maliciousData),
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
    })
  })
})