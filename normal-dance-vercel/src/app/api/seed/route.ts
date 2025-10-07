import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
    // Create sample artists
    const artists = await Promise.all([
      db.artist.create({
        data: {
          name: 'DJ Normal',
          bio: 'Professional DJ and electronic music producer',
          avatar: '/api/placeholder/200/200',
          verified: true
        }
      }),
      db.artist.create({
        data: {
          name: 'Dance Master',
          bio: 'Master of dance floors and electronic beats',
          avatar: '/api/placeholder/200/200',
          verified: true
        }
      }),
      db.artist.create({
        data: {
          name: 'Electronic Soul',
          bio: 'Bringing soul to electronic music',
          avatar: '/api/placeholder/200/200',
          verified: false
        }
      }),
      db.artist.create({
        data: {
          name: 'Night Rhythm',
          bio: 'Creating vibes for late night sessions',
          avatar: '/api/placeholder/200/200',
          verified: false
        }
      })
    ])

    // Create sample albums
    const albums = await Promise.all([
      db.album.create({
        data: {
          title: 'Dance Collection',
          coverUrl: '/api/placeholder/300/300',
          releaseDate: new Date('2024-01-15'),
          artistId: artists[0].id
        }
      }),
      db.album.create({
        data: {
          title: 'Night Sessions',
          coverUrl: '/api/placeholder/300/300',
          releaseDate: new Date('2024-02-20'),
          artistId: artists[1].id
        }
      }),
      db.album.create({
        data: {
          title: 'Energy Flow',
          coverUrl: '/api/placeholder/300/300',
          releaseDate: new Date('2024-03-10'),
          artistId: artists[2].id
        }
      })
    ])

    // Create sample tracks
    const tracks = await Promise.all([
      db.track.create({
        data: {
          title: 'Electric Dreams',
          duration: 245,
          audioUrl: '/api/audio/electric-dreams.mp3',
          coverUrl: '/api/placeholder/300/300',
          genre: 'Electronic',
          playCount: 15420,
          artistId: artists[0].id,
          albumId: albums[0].id
        }
      }),
      db.track.create({
        data: {
          title: 'Night Rhythm',
          duration: 198,
          audioUrl: '/api/audio/night-rhythm.mp3',
          coverUrl: '/api/placeholder/300/300',
          genre: 'House',
          playCount: 12350,
          artistId: artists[1].id,
          albumId: albums[1].id
        }
      }),
      db.track.create({
        data: {
          title: 'Pulse of Life',
          duration: 312,
          audioUrl: '/api/audio/pulse-of-life.mp3',
          coverUrl: '/api/placeholder/300/300',
          genre: 'Techno',
          playCount: 9870,
          artistId: artists[2].id,
          albumId: albums[2].id
        }
      }),
      db.track.create({
        data: {
          title: 'Digital Love',
          duration: 267,
          audioUrl: '/api/audio/digital-love.mp3',
          coverUrl: '/api/placeholder/300/300',
          genre: 'Electronic',
          playCount: 8650,
          artistId: artists[0].id,
          albumId: albums[0].id
        }
      }),
      db.track.create({
        data: {
          title: 'Midnight City',
          duration: 289,
          audioUrl: '/api/audio/midnight-city.mp3',
          coverUrl: '/api/placeholder/300/300',
          genre: 'Synthwave',
          playCount: 7230,
          artistId: artists[3].id
        }
      }),
      db.track.create({
        data: {
          title: 'Bass Drop',
          duration: 224,
          audioUrl: '/api/audio/bass-drop.mp3',
          coverUrl: '/api/placeholder/300/300',
          genre: 'Dubstep',
          playCount: 6540,
          artistId: artists[1].id,
          albumId: albums[1].id
        }
      })
    ])

    // Create sample user
    const user = await db.user.create({
      data: {
        email: 'user@normaldance.com',
        name: 'Music Lover',
        avatar: '/api/placeholder/100/100'
      }
    })

    // Create sample playlists
    const playlists = await Promise.all([
      db.playlist.create({
        data: {
          name: 'Normal Dance Hits',
          description: 'Самые горячие треки платформы',
          coverUrl: '/api/placeholder/300/300',
          isPublic: true,
          ownerId: user.id
        }
      }),
      db.playlist.create({
        data: {
          name: 'Electronic Vibes',
          description: 'Электронная музыка для настроения',
          coverUrl: '/api/placeholder/300/300',
          isPublic: true,
          ownerId: user.id
        }
      }),
      db.playlist.create({
        data: {
          name: 'Night Drive',
          description: 'Идеально для ночных поездок',
          coverUrl: '/api/placeholder/300/300',
          isPublic: true,
          ownerId: user.id
        }
      })
    ])

    // Add tracks to playlists
    await Promise.all([
      // Normal Dance Hits
      db.playlistTrack.createMany({
        data: [
          { playlistId: playlists[0].id, trackId: tracks[0].id, position: 0 },
          { playlistId: playlists[0].id, trackId: tracks[1].id, position: 1 },
          { playlistId: playlists[0].id, trackId: tracks[2].id, position: 2 }
        ]
      }),
      // Electronic Vibes
      db.playlistTrack.createMany({
        data: [
          { playlistId: playlists[1].id, trackId: tracks[0].id, position: 0 },
          { playlistId: playlists[1].id, trackId: tracks[3].id, position: 1 },
          { playlistId: playlists[1].id, trackId: tracks[4].id, position: 2 }
        ]
      }),
      // Night Drive
      db.playlistTrack.createMany({
        data: [
          { playlistId: playlists[2].id, trackId: tracks[1].id, position: 0 },
          { playlistId: playlists[2].id, trackId: tracks[4].id, position: 1 },
          { playlistId: playlists[2].id, trackId: tracks[5].id, position: 2 }
        ]
      })
    ])

    return NextResponse.json({
      message: 'Database seeded successfully',
      data: {
        artists: artists.length,
        albums: albums.length,
        tracks: tracks.length,
        playlists: playlists.length,
        user: 1
      }
    })
  } catch (error) {
    console.error('Error seeding database:', error)
    return NextResponse.json(
      { error: 'Failed to seed database' },
      { status: 500 }
    )
  }
}