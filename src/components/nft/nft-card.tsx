'use client'

import { useState } from 'react'
import { Card, CardContent, Button, Badge, Avatar, AvatarFallback, AvatarImage, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui'
import { 
  Eye, 
  Heart, 
  ShoppingCart, 
  Clock,
  ExternalLink
} from '@/components/icons'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

interface NFTCardProps {
  nft: unknown
  onBuy: (nft: unknown) => void
  onAddToWatchlist: (nft: unknown) => void
}

export function NFTCard({ nft, onBuy, onAddToWatchlist }: NFTCardProps) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <Card className="group hover:shadow-lg transition-shadow">
      <div className="relative">
        <img
          src={nft.imageUrl || '/placeholder-album.jpg'}
          alt={nft.name}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        <div className="absolute top-2 right-2 flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0"
            onClick={() => onAddToWatchlist(nft)}
          >
            <Heart className="h-4 w-4" />
          </Button>
          <Dialog open={showDetails} onOpenChange={setShowDetails}>
            <DialogTrigger asChild>
              <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                <Eye className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{nft.name}</DialogTitle>
                <DialogDescription>
                  Детальная информация о NFT
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <img
                  src={nft.imageUrl || '/placeholder-album.jpg'}
                  alt={nft.name}
                  className="w-full h-64 object-cover rounded-lg"
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Токен ID</p>
                    <p className="font-mono">{nft.tokenId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Контракт</p>
                    <p className="font-mono text-xs">{nft.contractAddress}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Цена</p>
                    <p className="font-bold">{nft.price} {nft.currency}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Статус</p>
                    <Badge variant={nft.listed ? 'default' : 'secondary'}>
                      {nft.listed ? 'В продаже' : 'Не в продаже'}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => onBuy(nft)} 
                    disabled={!nft.listed}
                    className="flex-1"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Купить
                  </Button>
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
              <AvatarImage src="/placeholder-avatar.jpg" />
              <AvatarFallback className="text-xs">NFT</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              {nft.owner.slice(0, 6)}...{nft.owner.slice(-4)}
            </span>
          </div>
          
          <div className="text-right">
            <p className="font-bold">{nft.price} {nft.currency}</p>
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