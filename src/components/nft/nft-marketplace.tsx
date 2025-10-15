'use client'

import { useState, useEffect, useCallback } from 'react'
import { nftMarketplaces } from '@/lib/integrations/nft-marketplaces'
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Badge, Avatar, AvatarFallback, AvatarImage, Tabs, TabsContent, TabsList, TabsTrigger, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, Slider } from '@/components/ui'
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Heart, 
  ShoppingCart, 
  Eye, 
  TrendingUp,
  Clock,
  DollarSign,
  Users,
  Calendar,
  Star,
  Plus,
  ExternalLink,
  Auction,
  BarChart3,
  LineChart,
  PieChart,
  Zap,
  Target,
  Shield,
  Gem,
  Music,
  Palette,
  Crown,
  Activity,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from '@/components/icons'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

interface NFTMarketplaceProps {
  userId: string
}

interface NFTCardProps {
  nft: unknown
  onBuy: (nft: unknown) => void
  onAddToWatchlist: (nft: unknown) => void
  onPlaceBid: (nft: unknown, amount: number) => void
}

interface CollectionCardProps {
  collection: unknown
  onSelect: (collection: unknown) => void
}

interface MarketplaceSelectorProps {
  selectedMarketplace: string
  onMarketplaceChange: (marketplace: string) => void
}

interface FilterOptions {
  minPrice: number
  maxPrice: number
  category: string
  rarity: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

interface Auction {
  id: string
  nftId: string
  currentBid: number
  startTime: string
  endTime: string
  bidderCount: number
  minIncrement: number
}

interface MarketStats {
  totalVolume24h: number
  totalSales24h: number
  activeListings: number
  averagePrice: number
  topCollections: Array<{
    name: string
    volume24h: number
    floorPrice: number
    change24h: number
  }>
}

export function NFTMarketplace({ userId }: NFTMarketplaceProps) {
  const [selectedMarketplace, setSelectedMarketplace] = useState('opensea')
  const [nfts, setNfts] = useState<any[]>([])
  const [collections, setCollections] = useState<any[]>([])
  const [trendingNFTs, setTrendingNFTs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null)
  const [userPortfolio, setUserPortfolio] = useState<any>(null)
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [marketStats, setMarketStats] = useState<MarketStats | null>(null)
  const [watchlist, setWatchlist] = useState<string[]>([])
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({
    minPrice: 0,
    maxPrice: 100,
    category: 'all',
    rarity: 'all',
    sortBy: 'price',
    sortOrder: 'desc'
  })
  const [showFilters, setShowFilters] = useState(false)
  const [bidAmount, setBidAmount] = useState('')

  // Категории NFT
  const categories = [
    { value: 'all', label: 'Все категории' },
    { value: 'music', label: 'Музыка', icon: <Music className="h-4 w-4" /> },
    { value: 'art', label: 'Искусство', icon: <Palette className="h-4 w-4" /> },
    { value: 'collectibles', label: 'Коллекционные', icon: <Gem className="h-4 w-4" /> },
    { value: 'photography', label: 'Фотография', icon: <Eye className="h-4 w-4" /> },
    { value: 'domain', label: 'Домены', icon: <ExternalLink className="h-4 w-4" /> },
    { value: 'virtual-worlds', label: 'Виртуальные миры', icon: <Target className="h-4 w-4" /> }
  ]

  // Редкость NFT
  const rarities = [
    { value: 'all', label: 'Любая редкость' },
    { value: 'legendary', label: 'Легендарная', color: 'text-purple-600' },
    { value: 'epic', label: 'Эпическая', color: 'text-blue-600' },
    { value: 'rare', label: 'Редкая', color: 'text-green-600' },
    { value: 'uncommon', label: 'Необычная', color: 'text-yellow-600' },
    { value: 'common', label: 'Обычная', color: 'text-gray-600' }
  ]

  // Загрузка данных при монтировании
  useEffect(() => {
    loadMarketplaceData()
    loadUserPortfolio()
    loadMarketStats()
    loadAuctions()
    loadWatchlist()
  }, [selectedMarketplace])

  // Загрузка данных маркетплейса
  const loadMarketplaceData = useCallback(async () => {
    setLoading(true)
    try {
      const [collectionsData, nftsData, trendingData] = await Promise.all([
        nftMarketplaces.getCollections(selectedMarketplace, 20),
        nftMarketplaces.getNFTs(selectedMarketplace, selectedCollection || '', 20),
        nftMarketplaces.getTrendingNFTs(selectedMarketplace, 10)
      ])
      
      setCollections(collectionsData)
      setNfts(applyFiltersAndSort(nftsData))
      setTrendingNFTs(trendingData)
    } catch (error) {
      console.error('Error loading marketplace data:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedMarketplace, selectedCollection, activeFilters])

  // Применение фильтров и сортировки
  const applyFiltersAndSort = useCallback((data: unknown[]) => {
    let filtered = [...data]

    // Фильтрация по цене
    filtered = filtered.filter(nft => {
      const price = parseFloat(nft.price) || 0
      return price >= activeFilters.minPrice && price <= activeFilters.maxPrice
    })

    // Фильтрация по категории
    if (activeFilters.category !== 'all') {
      filtered = filtered.filter(nft => nft.category === activeFilters.category)
    }

    // Фильтрация по редкости
    if (activeFilters.rarity !== 'all') {
      filtered = filtered.filter(nft => 
        nft.attributes?.some((attr: unknown) => 
          attr.trait_type?.toLowerCase() === 'rarity' && 
          attr.value?.toLowerCase() === activeFilters.rarity
        )
      )
    }

    // Поиск
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(nft =>
        nft.name.toLowerCase().includes(query) ||
        nft.description.toLowerCase().includes(query) ||
        nft.collection?.name.toLowerCase().includes(query)
      )
    }

    // Сортировка
    filtered.sort((a, b) => {
      let aValue: number | string
      let bValue: number | string

      switch (activeFilters.sortBy) {
        case 'price':
          aValue = parseFloat(a.price) || 0
          bValue = parseFloat(b.price) || 0
          break
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'date':
          aValue = new Date(a.createdAt || 0).getTime()
          bValue = new Date(b.createdAt || 0).getTime()
          break
        case 'popularity':
          aValue = a.likes || 0
          bValue = b.likes || 0
          break
        default:
          aValue = parseFloat(a.price) || 0
          bValue = parseFloat(b.price) || 0
      }

      if (activeFilters.sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [activeFilters, searchQuery])

  // Загрузка портфолио пользователя
  const loadUserPortfolio = async () => {
    try {
      const portfolio = await nftMarketplaces.getUserPortfolio(userId)
      setUserPortfolio(portfolio)
    } catch (error) {
      console.error('Error loading user portfolio:', error)
    }
  }

  // Загрузка статистики рынка
  const loadMarketStats = async () => {
    try {
      const stats = await nftMarketplaces.getMarketStats(selectedMarketplace)
      setMarketStats(stats)
    } catch (error) {
      console.error('Error loading market stats:', error)
    }
  }

  // Загрузка аукционов
  const loadAuctions = async () => {
    try {
      const auctionsData = await nftMarketplaces.getActiveAuctions(selectedMarketplace, 20)
      setAuctions(auctionsData)
    } catch (error) {
      console.error('Error loading auctions:', error)
    }
  }

  // Загрузка избранного
  const loadWatchlist = async () => {
    try {
      const watchlistData = await nftMarketplaces.getUserWatchlist(userId)
      setWatchlist(watchlistData.map((item: unknown) => item.nftId))
    } catch (error) {
      console.error('Error loading watchlist:', error)
    }
  }

  // Обработка покупки NFT
  const handleBuyNFT = async (nft: unknown) => {
    try {
      const response = await fetch(`/api/nft/${nft.id}/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          price: nft.price || 0,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        alert(`NFT успешно куплен! Транзакция: ${result.transactionHash}`)
        await loadUserPortfolio()
        await loadMarketplaceData()
        await loadMarketStats()
      } else {
        const error = await response.json()
        alert(`Ошибка покупки: ${error.error}`)
      }
    } catch (error) {
      console.error('Error buying NFT:', error)
      alert('Произошла ошибка при покупке NFT')
    }
  }

  // Обработка ставки на аукцион
  const handlePlaceBid = async (nft: unknown, amount: number) => {
    try {
      const response = await fetch(`/api/nft/${nft.id}/bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          amount,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Стата ${amount} ${nft.currency} успешно размещена!`)
        await loadMarketplaceData()
        await loadAuctions()
      } else {
        const error = await response.json()
        alert(`Ошибка ставки: ${error.error}`)
      }
    } catch (error) {
      console.error('Error placing bid:', error)
      alert('Произошла ошибка при размещении ставки')
    }
  }

  // Обработка добавления в избранное
  const handleAddToWatchlist = async (nft: unknown) => {
    try {
      const isInWatchlist = watchlist.includes(nft.id)
      
      if (isInWatchlist) {
        await nftMarketplaces.removeFromWatchlist(userId, nft.id)
        setWatchlist(prev => prev.filter(id => id !== nft.id))
      } else {
        await nftMarketplaces.addToWatchlist(userId, nft.id)
        setWatchlist(prev => [...prev, nft.id])
      }
    } catch (error) {
      console.error('Error updating watchlist:', error)
    }
  }

  // Обработка поиска
  const handleSearch = async () => {
    await loadMarketplaceData()
  }

  // Обработка выбора коллекции
  const handleCollectionSelect = async (collection: unknown) => {
    setSelectedCollection(collection.contractAddress)
    await loadMarketplaceData()
  }

  // Обновление фильтров
  const handleFilterChange = (key: keyof FilterOptions, value: unknown) => {
    setActiveFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // Сброс фильтров
  const resetFilters = () => {
    setActiveFilters({
      minPrice: 0,
      maxPrice: 100,
      category: 'all',
      rarity: 'all',
      sortBy: 'price',
      sortOrder: 'desc'
    })
    setSearchQuery('')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">NFT Маркетплейс</h1>
        <p className="text-muted-foreground">Исследуйте, покупайте и продавайте музыкальные NFT</p>
      </div>

      {/* Статистика рынка */}
      {marketStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Объем 24ч</p>
                  <p className="text-xl font-bold">{marketStats.totalVolume24h.toFixed(2)} ETH</p>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +12.5%
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Продаж 24ч</p>
                  <p className="text-xl font-bold">{marketStats.totalSales24h}</p>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +8.2%
                  </p>
                </div>
                <ShoppingCart className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Активных лотов</p>
                  <p className="text-xl font-bold">{marketStats.activeListings}</p>
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" />
                    -2.1%
                  </p>
                </div>
                <Eye className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Средняя цена</p>
                  <p className="text-xl font-bold">{marketStats.averagePrice.toFixed(2)} ETH</p>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +5.7%
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="explore" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="explore">Исследовать</TabsTrigger>
          <TabsTrigger value="collections">Коллекции</TabsTrigger>
          <TabsTrigger value="auctions">Аукционы</TabsTrigger>
          <TabsTrigger value="trending">Тренды</TabsTrigger>
          <TabsTrigger value="portfolio">Мой портфель</TabsTrigger>
        </TabsList>

        <TabsContent value="explore" className="space-y-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex gap-2 items-center">
              <MarketplaceSelector 
                selectedMarketplace={selectedMarketplace}
                onMarketplaceChange={setSelectedMarketplace}
              />
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-2 w-full lg:w-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Поиск NFT..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Фильтры */}
          {showFilters && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Фильтры
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Цена (ETH)</label>
                    <div className="space-y-2">
                      <Slider
                        value={[activeFilters.minPrice, activeFilters.maxPrice]}
                        onValueChange={([min, max]) => {
                          handleFilterChange('minPrice', min)
                          handleFilterChange('maxPrice', max)
                        }}
                        max={100}
                        step={0.1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{activeFilters.minPrice} ETH</span>
                        <span>{activeFilters.maxPrice} ETH</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Категория</label>
                    <Select value={activeFilters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            <div className="flex items-center gap-2">
                              {category.icon}
                              {category.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Редкость</label>
                    <Select value={activeFilters.rarity} onValueChange={(value) => handleFilterChange('rarity', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {rarities.map((rarity) => (
                          <SelectItem key={rarity.value} value={rarity.value}>
                            <span className={rarity.color}>{rarity.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Сортировка</label>
                    <div className="flex gap-2">
                      <Select value={activeFilters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="price">Цена</SelectItem>
                          <SelectItem value="name">Название</SelectItem>
                          <SelectItem value="date">Дата</SelectItem>
                          <SelectItem value="popularity">Популярность</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFilterChange('sortOrder', activeFilters.sortOrder === 'asc' ? 'desc' : 'asc')}
                      >
                        {activeFilters.sortOrder === 'asc' ? '↑' : '↓'}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetFilters}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Сбросить
                  </Button>
                  <Button onClick={handleSearch}>
                    Применить фильтры
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Результаты */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-muted rounded-t-lg"></div>
                  <CardContent className="p-4 space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                    <div className="h-8 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {nfts.map((nft) => (
                <NFTCard
                  key={nft.id}
                  nft={nft}
                  onBuy={handleBuyNFT}
                  onAddToWatchlist={handleAddToWatchlist}
                  onPlaceBid={handlePlaceBid}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="collections" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {collections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                onSelect={handleCollectionSelect}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="auctions" className="space-y-6">
          <div className="mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Auction className="h-6 w-6" />
              Активные аукционы
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {auctions.map((auction) => (
              <Card key={auction.id} className="hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img
                    src={`/api/placeholder/400/300`}
                    alt="Auction NFT"
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
                    АУКЦИОН
                  </div>
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Badge variant="destructive" className="text-xs">
                      {auction.bidderCount} ставок
                    </Badge>
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Текущая ставка:</span>
                      <span className="font-bold text-green-600">{auction.currentBid} ETH</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Мин. прирост:</span>
                      <span className="text-xs">{auction.minIncrement} ETH</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Осталось времени:</span>
                      <span className="text-xs text-red-600 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(auction.endTime), { 
                          addSuffix: true, 
                          locale: ru 
                        })}
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Ваша ставка"
                        className="flex-1"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                      />
                      <Button 
                        size="sm"
                        onClick={() => {
                          const amount = parseFloat(bidAmount)
                          if (amount > auction.currentBid) {
                            handlePlaceBid({ id: auction.nftId }, amount)
                            setBidAmount('')
                          }
                        }}
                      >
                        <Target className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trending" className="space-y-6">
          <div className="mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              Трендовые NFT
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingNFTs.map((nft) => (
              <NFTCard
                key={nft.id}
                nft={nft}
                onBuy={handleBuyNFT}
                onAddToWatchlist={handleAddToWatchlist}
                onPlaceBid={handlePlaceBid}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-6">
          {userPortfolio ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Всего NFT</p>
                        <p className="text-2xl font-bold">{userPortfolio.nfts.length}</p>
                      </div>
                      <Avatar className="h-12 w-12">
                        <AvatarImage src="/placeholder-avatar.jpg" />
                        <AvatarFallback>NFT</AvatarFallback>
                      </Avatar>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Общая стоимость</p>
                        <p className="text-2xl font-bold">{userPortfolio.totalValue.toFixed(2)} ETH</p>
                      </div>
                      <DollarSign className="h-12 w-12 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Коллекций</p>
                        <p className="text-2xl font-bold">{userPortfolio.collections.length}</p>
                      </div>
                      <Users className="h-12 w-12 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">В избранном</p>
                        <p className="text-2xl font-bold">{watchlist.length}</p>
                      </div>
                      <Heart className="h-12 w-12 text-red-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4">Мои NFT</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userPortfolio.nfts.map((nft) => (
                    <NFTCard
                      key={nft.id}
                      nft={nft}
                      onBuy={() => {}} // Уже куплено
                      onAddToWatchlist={handleAddToWatchlist}
                      onPlaceBid={handlePlaceBid}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground mb-4">У вас еще нет NFT в портфеле</p>
                <Button onClick={() => document.querySelector('[value="explore"]')?.click()}>
                  Купить первый NFT
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Компонент выбора маркетплейса
function MarketplaceSelector({ selectedMarketplace, onMarketplaceChange }: MarketplaceSelectorProps) {
  const marketplaces = nftMarketplaces.getAvailableMarketplaces()

  return (
    <Select value={selectedMarketplace} onValueChange={onMarketplaceChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Выберите маркетплейс" />
      </SelectTrigger>
      <SelectContent>
        {marketplaces.map((marketplace) => (
          <SelectItem key={marketplace.id} value={marketplace.id}>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center">
                <span className="text-xs font-bold">{marketplace.name.charAt(0)}</span>
              </div>
              {marketplace.name}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// Компонент карточки NFT
function NFTCard({ nft, onBuy, onAddToWatchlist, onPlaceBid }: NFTCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [showBidDialog, setShowBidDialog] = useState(false)
  const [bidAmount, setBidAmount] = useState('')
  const [isInWatchlist, setIsInWatchlist] = useState(false)

  const isAuction = nft.auction && new Date(nft.auction.endTime) > new Date()
  const currentPrice = isAuction ? nft.auction.currentBid : nft.price

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="relative">
        <img
          src={nft.imageUrl || '/placeholder-album.jpg'}
          alt={nft.name}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        
        {/* Бейджи */}
        <div className="absolute top-2 left-2 flex gap-1">
          {nft.verified && (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Подтверждено
            </Badge>
          )}
          {isAuction && (
            <Badge variant="destructive" className="text-xs">
              <Auction className="h-3 w-3 mr-1" />
              Аукцион
            </Badge>
          )}
          {nft.isNew && (
            <Badge variant="secondary" className="text-xs">
              <Plus className="h-3 w-3 mr-1" />
              Новинка
            </Badge>
          )}
        </div>

        {/* Кнопки действий */}
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant={isInWatchlist ? "default" : "secondary"}
            className="h-8 w-8 p-0"
            onClick={() => {
              onAddToWatchlist(nft)
              setIsInWatchlist(!isInWatchlist)
            }}
          >
            <Heart className={`h-4 w-4 ${isInWatchlist ? 'fill-current text-red-500' : ''}`} />
          </Button>
          <Dialog open={showDetails} onOpenChange={setShowDetails}>
            <DialogTrigger asChild>
              <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                <Eye className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Gem className="h-5 w-5" />
                  {nft.name}
                </DialogTitle>
                <DialogDescription>
                  Детальная информация о NFT
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <img
                      src={nft.imageUrl || '/placeholder-album.jpg'}
                      alt={nft.name}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Описание</h4>
                      <p className="text-sm text-muted-foreground">{nft.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Токен ID</p>
                        <p className="font-mono text-sm">{nft.tokenId}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Контракт</p>
                        <p className="font-mono text-xs">{nft.contractAddress}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Цена</p>
                        <p className="font-bold text-lg">{currentPrice} {nft.currency}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Статус</p>
                        <Badge variant={nft.listed ? 'default' : 'secondary'}>
                          {nft.listed ? 'В продаже' : 'Не в продаже'}
                        </Badge>
                      </div>
                    </div>

                    {isAuction && (
                      <div className="p-3 bg-red-50 rounded-lg">
                        <h4 className="font-medium text-red-800 mb-2">Аукцион</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Текущая ставка:</span>
                            <span className="font-medium">{nft.auction.currentBid} ETH</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Ставок:</span>
                            <span>{nft.auction.bidderCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Осталось:</span>
                            <span className="text-red-600">
                              {formatDistanceToNow(new Date(nft.auction.endTime), { 
                                addSuffix: true, 
                                locale: ru 
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {isAuction ? (
                        <Dialog open={showBidDialog} onOpenChange={setShowBidDialog}>
                          <DialogTrigger asChild>
                            <Button className="flex-1">
                              <Target className="h-4 w-4 mr-2" />
                              Сделать ставку
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Ставка на аукцион</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Минимальная ставка</label>
                                <p className="text-lg font-bold text-green-600">
                                  {(nft.auction.currentBid + nft.auction.minIncrement).toFixed(4)} ETH
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Ваша ставка</label>
                                <Input
                                  type="number"
                                  placeholder="Введите сумму ETH"
                                  value={bidAmount}
                                  onChange={(e) => setBidAmount(e.target.value)}
                                  step="0.001"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  onClick={() => {
                                    const amount = parseFloat(bidAmount)
                                    if (amount >= nft.auction.currentBid + nft.auction.minIncrement) {
                                      onPlaceBid(nft, amount)
                                      setShowBidDialog(false)
                                      setBidAmount('')
                                    }
                                  }}
                                  className="flex-1"
                                >
                                  Разместить ставку
                                </Button>
                                <Button variant="outline" onClick={() => setShowBidDialog(false)}>
                                  Отмена
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <Button 
                          onClick={() => onBuy(nft)} 
                          disabled={!nft.listed}
                          className="flex-1"
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Купить
                        </Button>
                      )}
                      <Button variant="outline" asChild>
                        <a 
                          href={`https://opensea.io/assets/${nft.chain}/${nft.contractAddress}/${nft.tokenId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Атрибуты */}
                {nft.attributes && nft.attributes.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Атрибуты</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {nft.attributes.map((attr: unknown, index: number) => (
                        <div key={index} className="p-3 bg-muted rounded-lg text-center">
                          <div className="text-sm font-medium">{attr.trait_type}</div>
                          <div className="text-xs text-muted-foreground">{attr.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold mb-1 truncate">{nft.name}</h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {nft.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={nft.creator?.imageUrl || '/placeholder-avatar.jpg'} />
              <AvatarFallback className="text-xs">
                {nft.creator?.name?.charAt(0) || 'N'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              {nft.creator?.name?.slice(0, 6)}...{nft.creator?.name?.slice(-4) || 'NFT'}
            </span>
          </div>
          
          <div className="text-right">
            <p className="font-bold">{currentPrice} {nft.currency}</p>
            {nft.auctionEndTime && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(nft.auctionEndTime), { 
                  addSuffix: true, 
                  locale: ru 
                })}
              </p>
            )}
          </div>
        </div>
        
        {nft.attributes && nft.attributes.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {nft.attributes.slice(0, 3).map((attr: unknown, index: number) => (
              <Badge key={index} variant="outline" className="text-xs">
                {attr.trait_type}: {attr.value}
              </Badge>
            ))}
            {nft.attributes.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{nft.attributes.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Компонент карточки коллекции
function CollectionCard({ collection, onSelect }: CollectionCardProps) {
  return (
    <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1" onClick={() => onSelect(collection)}>
      <div className="relative">
        <img
          src={collection.imageUrl || '/placeholder-album.jpg'}
          alt={collection.name}
          className="w-full h-32 object-cover rounded-t-lg"
        />
        <div className="absolute top-2 right-2 flex gap-1">
          {collection.verified && (
            <Badge variant="default" className="bg-green-600 text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              ✓
            </Badge>
          )}
          {collection.isTrending && (
            <Badge variant="secondary" className="text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              Тренд
            </Badge>
          )}
        </div>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold mb-1 truncate">{collection.name}</h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {collection.description}
        </p>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            <span>{collection.floorPrice} ETH</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{collection.owners}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3" />
            <span>{collection.volume24h} ETH</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{collection.totalSupply}</span>
          </div>
        </div>

        {/* График изменения цены */}
        <div className="mt-3 h-8 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded flex items-end justify-around p-1">
          <div className="w-1 bg-blue-400 rounded-t" style={{ height: '20%' }} />
          <div className="w-1 bg-blue-400 rounded-t" style={{ height: '35%' }} />
          <div className="w-1 bg-blue-400 rounded-t" style={{ height: '50%' }} />
          <div className="w-1 bg-blue-400 rounded-t" style={{ height: '70%' }} />
          <div className="w-1 bg-purple-500 rounded-t" style={{ height: '90%' }} />
        </div>
      </CardContent>
    </Card>
  )
}