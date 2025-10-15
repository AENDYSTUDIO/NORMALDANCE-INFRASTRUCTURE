/**
 * Mock Data for Development and Testing
 * DO NOT import this in production code!
 */

export const mockTracks = [
  {
    id: '1',
    title: 'Summer Vibes',
    artistName: 'DJ Melody',
    genre: 'Electronic',
    duration: 180,
    playCount: 15420,
    likeCount: 892,
    ipfsHash: 'QmXxx...', // Mock IPFS hash
    audioUrl: '/sample-audio.mp3', // Mock audio
    coverImage: '/placeholder-album.jpg',
    isExplicit: false,
    isPublished: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    title: 'Midnight Dreams',
    artistName: 'Luna Star',
    genre: 'Ambient',
    duration: 240,
    playCount: 8750,
    likeCount: 543,
    ipfsHash: 'QmYyy...',
    audioUrl: '/sample-audio.mp3',
    coverImage: '/placeholder-album.jpg',
    isExplicit: false,
    isPublished: true,
    createdAt: '2024-01-14T15:30:00Z',
    updatedAt: '2024-01-14T15:30:00Z'
  },
  {
    id: '3',
    title: 'Urban Beats',
    artistName: 'Street Composer',
    genre: 'Hip-Hop',
    duration: 200,
    playCount: 23100,
    likeCount: 1521,
    ipfsHash: 'QmZzz...',
    audioUrl: '/sample-audio.mp3',
    coverImage: '/placeholder-album.jpg',
    isExplicit: true,
    isPublished: true,
    createdAt: '2024-01-13T09:00:00Z',
    updatedAt: '2024-01-13T09:00:00Z'
  }
]

export const mockArtists = [
  { name: 'DJ Melody', tracks: 45, followers: '12K' },
  { name: 'Luna Star', tracks: 32, followers: '8K' },
  { name: 'Street Composer', tracks: 28, followers: '15K' }
]
