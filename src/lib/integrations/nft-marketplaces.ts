/**
 * Интеграция с NFT маркетплейсами для NormalDance
 * Поддержка OpenSea, Rarible, Foundation и других платформ
 */

import axios from 'axios'

interface NFTCollection {
  id: string
  name: string
  description: string
  imageUrl: string
  bannerUrl: string
  contractAddress: string
  chain: string
  symbol: string
  totalSupply: number
  floorPrice: number
  volume24h: number
  owners: number
  verified: boolean
  category: string
  createdAt: Date
}

interface NFTItem {
  id: string
  tokenId: string
  name: string
  description: string
  imageUrl: string
  metadataUrl: string
  contractAddress: string
  chain: string
  owner: string
  price?: number
  currency: string
  listed: boolean
  saleType: 'auction' | 'fixed' | 'offer'
  auctionEndTime?: Date
  attributes: NFTAttribute[]
  createdAt: Date
  updatedAt: Date
}

interface NFTAttribute {
  trait_type: string
  value: string | number
  display_type?: 'number' | 'date' | 'boost_percentage'
}

interface Marketplace {
  id: string
  name: string
  description: string
  logo: string
  baseUrl: string
  supportedChains: string[]
  supportedCollections: string[]
  features: string[]
  fees: {
    listing: number
    sale: number
    royalty: number
  }
  apiEndpoints: {
    collections: string
    nfts: string
    listings: string
    sales: string
  }
}

interface Listing {
  id: string
  nftId: string
  marketplaceId: string
  seller: string
  price: number
  currency: string
  type: 'auction' | 'fixed' | 'offer'
  startTime: Date
  endTime?: Date
  status: 'active' | 'ended' | 'cancelled'
  bids: Bid[]
  createdAt: Date
}

interface Bid {
  id: string
  listingId: string
  bidder: string
  amount: number
  currency: string
  timestamp: Date
  status: 'pending' | 'accepted' | 'rejected'
}

interface UserNFTPortfolio {
  userId: string
  nfts: NFTItem[]
  totalValue: number
  collections: string[]
  recentActivity: Activity[]
}

interface Activity {
  id: string
  type: 'purchase' | 'sale' | 'transfer' | 'listing' | 'bid'
  nftId: string
  marketplaceId: string
  amount: number
  currency: string
  timestamp: Date
  details: Record<string, unknown>
}

// Класс для работы с NFT маркетплейсами
export class NFTMarketplaces {
  private marketplaces: Map<string, Marketplace> = new Map()
  private collections: Map<string, NFTCollection> = new Map()
  private nfts: Map<string, NFTItem> = new Map()
  private listings: Map<string, Listing> = new Map()
  private userPortfolios: Map<string, UserNFTPortfolio> = new Map()

  constructor() {
    this.initializeMarketplaces()
  }

  /**
   * Инициализация доступных маркетплейсов
   */
  private initializeMarketplaces(): void {
    const marketplaces: Marketplace[] = [
      {
        id: 'opensea',
        name: 'OpenSea',
        description: 'Крупнейший NFT маркетплейс',
        logo: '/logos/opensea.png',
        baseUrl: 'https://opensea.io',
        supportedChains: ['ethereum', 'polygon', 'arbitrum'],
        supportedCollections: ['all'],
        features: [
          'Мультивалютная поддержка',
          'Аукционы',
          'Фиксированные цены',
          'Офферы',
          'Статистика продаж',
          'Верификация коллекций'
        ],
        fees: {
          listing: 2.5,
          sale: 2.5,
          royalty: 10
        },
        apiEndpoints: {
          collections: 'https://api.opensea.io/api/v1/collections',
          nfts: 'https://api.opensea.io/api/v1/assets',
          listings: 'https://api.opensea.io/api/v1/listings',
          sales: 'https://api.opensea.io/api/v1/events'
        }
      },
      {
        id: 'rarible',
        name: 'Rarible',
        description: 'Децентрализованный NFT маркетплейс',
        logo: '/logos/rarible.png',
        baseUrl: 'https://rarible.com',
        supportedChains: ['ethereum', 'polygon', 'tezos'],
        supportedCollections: ['all'],
        features: [
          'Децентрализованный',
          'Роялти',
          'Создание NFT',
          'Governance',
          'Мультивалютный'
        ],
        fees: {
          listing: 2.5,
          sale: 2.5,
          royalty: 2.5
        },
        apiEndpoints: {
          collections: 'https://api.rarible.org/v0.1/collections',
          nfts: 'https://api.rarible.org/v0.1/nft',
          listings: 'https://api.rarible.org/v0.1/orders',
          sales: 'https://api.rarible.org/v0.1/events'
        }
      },
      {
        id: 'foundation',
        name: 'Foundation',
        description: 'Кураторский NFT маркетплейс',
        logo: '/logos/foundation.png',
        baseUrl: 'https://foundation.app',
        supportedChains: ['ethereum'],
        supportedCollections: ['foundation'],
        features: [
          'Кураторский отбор',
          'Высокое качество',
          'Профессиональные артисты',
          'Аукционы',
          'Эксклюзивные коллекции'
        ],
        fees: {
          listing: 5,
          sale: 5,
          royalty: 15
        },
        apiEndpoints: {
          collections: 'https://api.foundation.app/v1/collections',
          nfts: 'https://api.foundation.app/v1/nfts',
          listings: 'https://api.foundation.app/v1/listings',
          sales: 'https://api.foundation.app/v1/sales'
        }
      }
    ]

    marketplaces.forEach(marketplace => {
      this.marketplaces.set(marketplace.id, marketplace)
    })
  }

  /**
   * Получение списка доступных маркетплейсов
   */
  getAvailableMarketplaces(): Marketplace[] {
    return Array.from(this.marketplaces.values())
  }

  /**
   * Получение маркетплейса по ID
   */
  getMarketplace(marketplaceId: string): Marketplace | undefined {
    return this.marketplaces.get(marketplaceId)
  }

  /**
   * Получение коллекций с маркетплейса
   */
  async getCollections(marketplaceId: string, limit: number = 50): Promise<NFTCollection[]> {
    const marketplace = this.getMarketplace(marketplaceId)
    if (!marketplace) {
      throw new Error('Marketplace not found')
    }

    try {
      const response = await axios.get(marketplace.apiEndpoints.collections, {
        params: {
          limit,
          chain: marketplace.supportedChains[0]
        }
      })

      const collections: NFTCollection[] = response.data.map((item: { id: string; name: string; [key: string]: unknown }) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        imageUrl: item.image_url,
        bannerUrl: item.banner_image_url,
        contractAddress: item.primary_asset_contracts[0]?.address,
        chain: item.chain,
        symbol: item.symbol,
        totalSupply: item.total_supply,
        floorPrice: item.stats.floor_price,
        volume24h: item.stats.volume_24h,
        owners: item.num_owners,
        verified: item.verified,
        category: item.category_name,
        createdAt: new Date(item.created_date)
      }))

      collections.forEach(collection => {
        this.collections.set(collection.id, collection)
      })

      return collections
    } catch (error) {
      console.error(`Error fetching collections from ${marketplaceId}:`, error)
      return []
    }
  }

  /**
   * Получение NFT из коллекции
   */
  async getNFTs(
    marketplaceId: string,
    collectionAddress: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<NFTItem[]> {
    const marketplace = this.getMarketplace(marketplaceId)
    if (!marketplace) {
      throw new Error('Marketplace not found')
    }

    try {
      const response = await axios.get(marketplace.apiEndpoints.nfts, {
        params: {
          collection: collectionAddress,
          limit,
          offset,
          chain: marketplace.supportedChains[0]
        }
      })

      const nfts: NFTItem[] = response.data.map((item: { mint: string; name: string; [key: string]: unknown }) => ({
        id: item.id,
        tokenId: item.token_id,
        name: item.name,
        description: item.description,
        imageUrl: item.image_url,
        metadataUrl: item.metadata_url,
        contractAddress: item.asset_contract.address,
        chain: item.asset_contract.chain,
        owner: item.owner,
        price: item.sell_orders?.[0]?.current_price,
        currency: item.sell_orders?.[0]?.payment_token?.symbol || 'ETH',
        listed: !!item.sell_orders?.length,
        saleType: item.sell_orders?.[0]?.listing_type || 'fixed',
        auctionEndTime: item.sell_orders?.[0]?.expiration_time ? new Date(item.sell_orders[0].expiration_time) : undefined,
        attributes: item.traits || [],
        createdAt: new Date(item.created_date),
        updatedAt: new Date(item.updated_date)
      }))

      nfts.forEach(nft => {
        this.nfts.set(nft.id, nft)
      })

      return nfts
    } catch (error) {
      console.error(`Error fetching NFTs from ${marketplaceId}:`, error)
      return []
    }
  }

  /**
   * Получение активных листингов
   */
  async getListings(marketplaceId: string, limit: number = 50): Promise<Listing[]> {
    const marketplace = this.getMarketplace(marketplaceId)
    if (!marketplace) {
      throw new Error('Marketplace not found')
    }

    try {
      const response = await axios.get(marketplace.apiEndpoints.listings, {
        params: {
          limit,
          chain: marketplace.supportedChains[0]
        }
      })

      const listings: Listing[] = response.data.map((item: { price: number; seller: string; [key: string]: unknown }) => ({
        id: item.id,
        nftId: item.asset.id,
        marketplaceId,
        seller: item.maker.address,
        price: item.current_price,
        currency: item.payment_token.symbol,
        type: item.listing_type,
        startTime: new Date(item.created_date),
        endTime: item.expiration_date ? new Date(item.expiration_date) : undefined,
        status: item.canceled ? 'cancelled' : 'active',
        bids: [],
        createdAt: new Date(item.created_date)
      }))

      listings.forEach(listing => {
        this.listings.set(listing.id, listing)
      })

      return listings
    } catch (error) {
      console.error(`Error fetching listings from ${marketplaceId}:`, error)
      return []
    }
  }

  /**
   * Создание листинга NFT
   */
  async createListing(
    marketplaceId: string,
    nftId: string,
    price: number,
    currency: string = 'ETH',
    type: 'auction' | 'fixed' | 'offer' = 'fixed',
    duration?: number // в часах
  ): Promise<Listing> {
    const marketplace = this.getMarketplace(marketplaceId)
    if (!marketplace) {
      throw new Error('Marketplace not found')
    }

    const listing: Listing = {
      id: this.generateListingId(),
      nftId,
      marketplaceId,
      seller: 'user_address', // В реальном приложении из контекста пользователя
      price,
      currency,
      type,
      startTime: new Date(),
      endTime: duration ? new Date(Date.now() + duration * 60 * 60 * 1000) : undefined,
      status: 'active',
      bids: [],
      createdAt: new Date()
    }

    // Здесь будет логика отправки листинга на маркетплейс
    await this.submitListingToMarketplace(listing)

    this.listings.set(listing.id, listing)
    return listing
  }

  /**
   * Отправка листинга на маркетплейс
   */
  private async submitListingToMarketplace(listing: Listing): Promise<void> {
    const marketplace = this.getMarketplace(listing.marketplaceId)
    if (!marketplace) {
      throw new Error('Marketplace not found')
    }

    try {
      // Симуляция отправки листинга
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log(`Listing submitted to ${marketplace.name}:`, listing)
    } catch (error) {
      listing.status = 'cancelled'
      this.listings.set(listing.id, listing)
      throw error
    }
  }

  /**
   * Покупка NFT
   */
  async purchaseNFT(
    marketplaceId: string,
    listingId: string,
    buyerAddress: string,
    price: number
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    const marketplace = this.getMarketplace(marketplaceId)
    if (!marketplace) {
      return { success: false, error: 'Marketplace not found' }
    }

    const listing = this.listings.get(listingId)
    if (!listing) {
      return { success: false, error: 'Listing not found' }
    }

    try {
      // Симуляция транзакции покупки
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const transactionHash = `0x${Math.random().toString(16).substr(2, 64)}`
      
      // Обновление статуса листинга
      listing.status = 'ended'
      this.listings.set(listingId, listing)
      
      return { success: true, transactionHash }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Purchase failed' }
    }
  }

  /**
   * Получение портфолио пользователя
   */
  async getUserPortfolio(userId: string): Promise<UserNFTPortfolio> {
    // В реальном приложении здесь будет запрос к базе данных
    const userNfts = Array.from(this.nfts.values()).filter(nft => nft.owner === userId)
    
    const portfolio: UserNFTPortfolio = {
      userId,
      nfts: userNfts,
      totalValue: userNfts.reduce((sum, nft) => sum + (nft.price || 0), 0),
      collections: [...new Set(userNfts.map(nft => nft.contractAddress))],
      recentActivity: []
    }

    this.userPortfolios.set(userId, portfolio)
    return portfolio
  }

  /**
   * Поиск NFT по ключевым словам
   */
  async searchNFTs(
    marketplaceId: string,
    query: string,
    limit: number = 20
  ): Promise<NFTItem[]> {
    const marketplace = this.getMarketplace(marketplaceId)
    if (!marketplace) {
      throw new Error('Marketplace not found')
    }

    try {
      const response = await axios.get(marketplace.apiEndpoints.nfts, {
        params: {
          q: query,
          limit,
          chain: marketplace.supportedChains[0]
        }
      })

      const nfts: NFTItem[] = response.data.map((item: { mint: string; name: string; [key: string]: unknown }) => ({
        id: item.id,
        tokenId: item.token_id,
        name: item.name,
        description: item.description,
        imageUrl: item.image_url,
        metadataUrl: item.metadata_url,
        contractAddress: item.asset_contract.address,
        chain: item.asset_contract.chain,
        owner: item.owner,
        price: item.sell_orders?.[0]?.current_price,
        currency: item.sell_orders?.[0]?.payment_token?.symbol || 'ETH',
        listed: !!item.sell_orders?.length,
        saleType: item.sell_orders?.[0]?.listing_type || 'fixed',
        auctionEndTime: item.sell_orders?.[0]?.expiration_time ? new Date(item.sell_orders[0].expiration_time) : undefined,
        attributes: item.traits || [],
        createdAt: new Date(item.created_date),
        updatedAt: new Date(item.updated_date)
      }))

      return nfts
    } catch (error) {
      console.error(`Error searching NFTs on ${marketplaceId}:`, error)
      return []
    }
  }

  /**
   * Получение статистики продаж
   */
  async getSalesStats(
    marketplaceId: string,
    collectionAddress?: string,
    timeRange: '24h' | '7d' | '30d' = '24h'
  ): Promise<{
    volume: number
    sales: number
    averagePrice: number
    topCollections: Array<{
      address: string
      name: string
      volume: number
      sales: number
    }>
  }> {
    const marketplace = this.getMarketplace(marketplaceId)
    if (!marketplace) {
      throw new Error('Marketplace not found')
    }

    try {
      const response = await axios.get(marketplace.apiEndpoints.sales, {
        params: {
          collection: collectionAddress,
          timeRange,
          chain: marketplace.supportedChains[0]
        }
      })

      const stats = response.data
      return {
        volume: stats.volume,
        sales: stats.sales,
        averagePrice: stats.averagePrice,
        topCollections: stats.topCollections
      }
    } catch (error) {
      console.error(`Error fetching sales stats from ${marketplaceId}:`, error)
      return {
        volume: 0,
        sales: 0,
        averagePrice: 0,
        topCollections: []
      }
    }
  }

  /**
   * Получение трендовых NFT
   */
  async getTrendingNFTs(marketplaceId: string, limit: number = 10): Promise<NFTItem[]> {
    const marketplace = this.getMarketplace(marketplaceId)
    if (!marketplace) {
      throw new Error('Marketplace not found')
    }

    try {
      const response = await axios.get(`${marketplace.baseUrl}/api/v1/trending`, {
        params: {
          limit,
          chain: marketplace.supportedChains[0]
        }
      })

      const nfts: NFTItem[] = response.data.map((item: { mint: string; name: string; [key: string]: unknown }) => ({
        id: item.id,
        tokenId: item.token_id,
        name: item.name,
        description: item.description,
        imageUrl: item.image_url,
        metadataUrl: item.metadata_url,
        contractAddress: item.asset_contract.address,
        chain: item.asset_contract.chain,
        owner: item.owner,
        price: item.sell_orders?.[0]?.current_price,
        currency: item.sell_orders?.[0]?.payment_token?.symbol || 'ETH',
        listed: !!item.sell_orders?.length,
        saleType: item.sell_orders?.[0]?.listing_type || 'fixed',
        auctionEndTime: item.sell_orders?.[0]?.expiration_time ? new Date(item.sell_orders[0].expiration_time) : undefined,
        attributes: item.traits || [],
        createdAt: new Date(item.created_date),
        updatedAt: new Date(item.updated_date)
      }))

      return nfts
    } catch (error) {
      console.error(`Error fetching trending NFTs from ${marketplaceId}:`, error)
      return []
    }
  }

  // Вспомогательные методы
  private generateListingId(): string {
    return `listing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Получение рекомендаций по NFT для пользователя
   */
  async getRecommendations(userId: string): Promise<{
    collections: NFTCollection[]
    nfts: NFTItem[]
    listings: Listing[]
  }> {
    const portfolio = await this.getUserPortfolio(userId)
    
    // Рекомендации на основе портфолио
    const recommendedCollections = Array.from(this.collections.values())
      .filter(collection => 
        portfolio.collections.includes(collection.contractAddress) ||
        portfolio.nfts.some(nft => nft.contractAddress === collection.contractAddress)
      )
      .slice(0, 5)

    const recommendedNfts = Array.from(this.nfts.values())
      .filter(nft => 
        !portfolio.nfts.some(userNft => userNft.id === nft.id) &&
        nft.listed
      )
      .slice(0, 10)

    const recommendedListings = Array.from(this.listings.values())
      .filter(listing => listing.status === 'active')
      .slice(0, 20)

    return {
      collections: recommendedCollections,
      nfts: recommendedNfts,
      listings: recommendedListings
    }
  }
}

// Экземпляр класса для использования в приложении
export const nftMarketplaces = new NFTMarketplaces()