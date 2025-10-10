import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const stats = {
      activeListeners: Math.floor(Math.random() * 1000) + 100,
      tracksToday: Math.floor(Math.random() * 50) + 10,
      newArtists: Math.floor(Math.random() * 20) + 5,
      totalPlays: Math.floor(Math.random() * 10000) + 5000,
    }

    res.status(200).json(stats)
  } catch (error) {
    console.error('Stats API error:', error)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
}