export interface NFTItem {
  id: string;
  name: string;
  collection: string;
  price: number;
  currency: string;
  rarity: string;
  metadata: any;
}

export interface MarketStats {
  volume24h: number;
  activeCollections: number;
  averagePrice: number;
  totalSales: number;
}

export class NFTContextProvider {
  async getNFT(nftId: string): Promise<NFTItem | null> {
    // Mock implementation
    return {
      id: nftId,
      name: 'Music NFT #1',
      collection: 'NORMAL DANCE Tracks',
      price: 2.5,
      currency: 'SOL',
      rarity: 'rare',
      metadata: {
        artist: 'Digital Artist',
        genre: 'Electronic',
        releaseDate: '2024-01-01',
        audioUrl: `https://nft-audio.dnb1st.ru/${nftId}.mp3`
      }
    };
  }

  async getMarketStats(): Promise<MarketStats> {
    return {
      volume24h: 1250.5,
      activeCollections: 45,
      averagePrice: 3.2,
      totalSales: 8920
    };
  }

  async getTrendingCollections(limit: number = 10): Promise<any[]> {
    return [
      {
        name: 'NORMAL DANCE Tracks',
        volume24h: 450.2,
        floorPrice: 1.8,
        items: 1200
      }
    ];
  }

  async searchNFTs(query: string, filters: any = {}): Promise<NFTItem[]> {
    return [
      {
        id: 'search1',
        name: `NFT matching "${query}"`,
        collection: 'Search Results',
        price: 2.0,
        currency: 'SOL',
        rarity: 'common',
        metadata: Record<string, unknown>
      }
    ];
  }

  async getUserNFTs(userId: string): Promise<NFTItem[]> {
    return [
      {
        id: 'user1',
        name: 'User NFT Collection',
        collection: 'Personal',
        price: 0,
        currency: 'SOL',
        rarity: 'owned',
        metadata: Record<string, unknown>
      }
    ];
  }
}