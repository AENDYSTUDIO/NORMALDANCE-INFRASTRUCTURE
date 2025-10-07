'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Music, Upload, DollarSign, Users, Play, Heart, Eye, TrendingUp, Wallet } from 'lucide-react'

interface Track {
  id: string
  title: string
  genre: string
  price: number
  currency: string
  blockchain: string
  plays: number
  likes: number
  sales: number
  revenue: number
  isMinted: boolean
  createdAt: string
}

interface Stats {
  totalTracks: number
  totalSales: number
  totalRevenue: number
  totalPlays: number
  monthlyGrowth: number
}

const mockTracks: Track[] = [
  {
    id: '1',
    title: 'Cosmic Journey',
    genre: 'Electronic',
    price: 0.5,
    currency: 'SOL',
    blockchain: 'Solana',
    plays: 1250,
    likes: 89,
    sales: 23,
    revenue: 11.5,
    isMinted: true,
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    title: 'Digital Dreams',
    genre: 'Pop',
    price: 2.5,
    currency: 'TON',
    blockchain: 'TON',
    plays: 890,
    likes: 56,
    sales: 15,
    revenue: 37.5,
    isMinted: true,
    createdAt: '2024-01-20'
  },
  {
    id: '3',
    title: 'Neon Nights',
    genre: 'Electronic',
    price: 0.8,
    currency: 'SOL',
    blockchain: 'Solana',
    plays: 2100,
    likes: 120,
    sales: 45,
    revenue: 36.0,
    isMinted: false,
    createdAt: '2024-02-01'
  }
]

const mockStats: Stats = {
  totalTracks: 12,
  totalSales: 156,
  totalRevenue: 892.5,
  totalPlays: 15420,
  monthlyGrowth: 23.5
}

interface ArtistDashboardProps {
  solanaConnected: boolean
  tonConnected: boolean
}

export function ArtistDashboard({ solanaConnected, tonConnected }: ArtistDashboardProps) {
  const [tracks] = useState<Track[]>(mockTracks)
  const [stats] = useState<Stats>(mockStats)

  if (!solanaConnected && !tonConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Artist Dashboard
          </CardTitle>
          <CardDescription>
            Connect your wallet to access your artist dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">
            Please connect your wallet to view your artist dashboard
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tracks</p>
                <p className="text-2xl font-bold">{stats.totalTracks}</p>
              </div>
              <Music className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
                <p className="text-2xl font-bold">{stats.totalSales}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{stats.totalRevenue} SOL/TON</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Plays</p>
                <p className="text-2xl font-bold">{stats.totalPlays.toLocaleString()}</p>
              </div>
              <Play className="h-8 w-8 text-pink-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Growth Indicator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Monthly Growth
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Growth Rate</span>
              <span className="font-medium text-green-600">+{stats.monthlyGrowth}%</span>
            </div>
            <Progress value={stats.monthlyGrowth} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Tracks Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Your Tracks
          </CardTitle>
          <CardDescription>
            Manage your uploaded music tracks and NFTs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All Tracks</TabsTrigger>
              <TabsTrigger value="minted">Minted NFTs</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <div className="space-y-4">
                {tracks.map((track) => (
                  <Card key={track.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-200 to-pink-200 dark:from-purple-800 dark:to-pink-800 rounded flex items-center justify-center">
                          <Music className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{track.title}</h3>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Badge variant="secondary">{track.genre}</Badge>
                            <Badge 
                              className={
                                track.blockchain === 'Solana' 
                                  ? 'bg-purple-600 hover:bg-purple-700' 
                                  : 'bg-blue-600 hover:bg-blue-700'
                              }
                            >
                              {track.blockchain}
                            </Badge>
                            {track.isMinted ? (
                              <Badge className="bg-green-600 hover:bg-green-700">Minted</Badge>
                            ) : (
                              <Badge variant="outline">Pending</Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold">{track.price} {track.currency}</p>
                        <p className="text-sm text-muted-foreground">
                          {track.sales} sales • {track.plays} plays
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span>Revenue: {track.revenue} {track.currency}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span>Sales: {track.sales}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Play className="h-4 w-4 text-pink-600" />
                        <span>Plays: {track.plays}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Heart className="h-4 w-4 text-red-600" />
                        <span>Likes: {track.likes}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        View Analytics
                      </Button>
                      {!track.isMinted && (
                        <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                          <Upload className="h-4 w-4 mr-2" />
                          Mint NFT
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="minted" className="mt-6">
              <div className="space-y-4">
                {tracks.filter(track => track.isMinted).map((track) => (
                  <Card key={track.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-200 to-emerald-200 dark:from-green-800 dark:to-emerald-800 rounded flex items-center justify-center">
                          <Music className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{track.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Minted on {track.blockchain}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{track.price} {track.currency}</p>
                        <p className="text-sm text-muted-foreground">
                          {track.sales} sales
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="pending" className="mt-6">
              <div className="space-y-4">
                {tracks.filter(track => !track.isMinted).map((track) => (
                  <Card key={track.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-200 to-orange-200 dark:from-yellow-800 dark:to-orange-800 rounded flex items-center justify-center">
                          <Music className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{track.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Ready to mint on {track.blockchain}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                        <Upload className="h-4 w-4 mr-2" />
                        Mint NFT
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}