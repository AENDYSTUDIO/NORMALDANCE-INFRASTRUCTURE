'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Filter, Music, ShoppingCart, Play, Heart, ExternalLink } from 'lucide-react'

interface NFTListing {
  id: string
  title: string
  artist: string
  genre: string
  price: number
  currency: string
  blockchain: string
  coverArt?: string
  likes: number
  isLiked: boolean
}

const mockListings: NFTListing[] = [
  {
    id: '1',
    title: 'Cosmic Journey',
    artist: 'Artist One',
    genre: 'Electronic',
    price: 0.5,
    currency: 'SOL',
    blockchain: 'Solana',
    likes: 42,
    isLiked: false
  },
  {
    id: '2',
    title: 'Digital Dreams',
    artist: 'Artist Two',
    genre: 'Pop',
    price: 2.5,
    currency: 'TON',
    blockchain: 'TON',
    likes: 28,
    isLiked: true
  },
  {
    id: '3',
    title: 'Neon Nights',
    artist: 'Artist Three',
    genre: 'Electronic',
    price: 0.8,
    currency: 'SOL',
    blockchain: 'Solana',
    likes: 35,
    isLiked: false
  },
  {
    id: '4',
    title: 'Sunset Melody',
    artist: 'Artist Four',
    genre: 'Jazz',
    price: 1.2,
    currency: 'TON',
    blockchain: 'TON',
    likes: 19,
    isLiked: false
  },
  {
    id: '5',
    title: 'Urban Beats',
    artist: 'Artist Five',
    genre: 'Hip Hop',
    price: 0.3,
    currency: 'SOL',
    blockchain: 'Solana',
    likes: 56,
    isLiked: true
  },
  {
    id: '6',
    title: 'Classical Remix',
    artist: 'Artist Six',
    genre: 'Classical',
    price: 3.0,
    currency: 'TON',
    blockchain: 'TON',
    likes: 23,
    isLiked: false
  }
]

interface MarketplaceProps {
  solanaConnected: boolean
  tonConnected: boolean
}

export function Marketplace({ solanaConnected, tonConnected }: MarketplaceProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('all')
  const [selectedBlockchain, setSelectedBlockchain] = useState('all')
  const [priceRange, setPriceRange] = useState('all')
  const [listings, setListings] = useState(mockListings)
  const [activeTab, setActiveTab] = useState('all')

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.artist.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGenre = selectedGenre === 'all' || listing.genre === selectedGenre
    const matchesBlockchain = selectedBlockchain === 'all' || 
                             (selectedBlockchain === 'solana' && listing.blockchain === 'Solana') ||
                             (selectedBlockchain === 'ton' && listing.blockchain === 'TON')
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'solana' && listing.blockchain === 'Solana') ||
                      (activeTab === 'ton' && listing.blockchain === 'TON')
    
    return matchesSearch && matchesGenre && matchesBlockchain && matchesTab
  })

  const handleLike = (id: string) => {
    setListings(prev => prev.map(listing => 
      listing.id === id 
        ? { ...listing, isLiked: !listing.isLiked, likes: listing.isLiked ? listing.likes - 1 : listing.likes + 1 }
        : listing
    ))
  }

  const handlePurchase = async (listing: NFTListing) => {
    if (!solanaConnected && !tonConnected) {
      alert('Please connect your wallet to purchase NFTs')
      return
    }

    if ((listing.blockchain === 'Solana' && !solanaConnected) || 
        (listing.blockchain === 'TON' && !tonConnected)) {
      alert(`Please connect your ${listing.blockchain} wallet to purchase this NFT`)
      return
    }

    try {
      console.log('Purchasing NFT:', listing)
      // Simulate purchase process
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert(`Successfully purchased ${listing.title}!`)
    } catch (error) {
      console.error('Purchase failed:', error)
      alert('Purchase failed. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Music NFT Marketplace
          </CardTitle>
          <CardDescription>
            Discover and collect unique music NFTs from artists worldwide
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tracks or artists..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genres</SelectItem>
                  <SelectItem value="pop">Pop</SelectItem>
                  <SelectItem value="rock">Rock</SelectItem>
                  <SelectItem value="electronic">Electronic</SelectItem>
                  <SelectItem value="hip-hop">Hip Hop</SelectItem>
                  <SelectItem value="jazz">Jazz</SelectItem>
                  <SelectItem value="classical">Classical</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Price Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="0-1">Under 1</SelectItem>
                  <SelectItem value="1-2">1 - 2</SelectItem>
                  <SelectItem value="2+">2+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blockchain Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All NFTs</TabsTrigger>
          <TabsTrigger value="solana" disabled={!solanaConnected}>
            Solana
          </TabsTrigger>
          <TabsTrigger value="ton" disabled={!tonConnected}>
            TON
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {/* NFT Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <Card key={listing.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gradient-to-br from-purple-200 to-pink-200 dark:from-purple-800 dark:to-pink-800 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Music className="h-16 w-16 text-white/50" />
                  </div>
                  <Badge 
                    className={`absolute top-2 right-2 ${
                      listing.blockchain === 'Solana' 
                        ? 'bg-purple-600 hover:bg-purple-700' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {listing.blockchain}
                  </Badge>
                  <Badge variant="secondary" className="absolute top-2 left-2">
                    {listing.genre}
                  </Badge>
                </div>
                
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg">{listing.title}</h3>
                      <p className="text-sm text-muted-foreground">{listing.artist}</p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          {listing.price} {listing.currency}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(listing.id)}
                          className={listing.isLiked ? 'text-red-500' : ''}
                        >
                          <Heart className={`h-4 w-4 ${listing.isLiked ? 'fill-current' : ''}`} />
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          {listing.likes}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        onClick={() => handlePurchase(listing)}
                        disabled={
                          (listing.blockchain === 'Solana' && !solanaConnected) ||
                          (listing.blockchain === 'TON' && !tonConnected)
                        }
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Buy Now
                      </Button>
                      <Button variant="outline" size="sm">
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredListings.length === 0 && (
            <div className="text-center py-12">
              <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No NFTs found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or search terms
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}