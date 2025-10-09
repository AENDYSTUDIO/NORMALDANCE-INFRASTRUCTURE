"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, Music, Pause, Play, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface NFTShowcaseProps {
  nfts: Array<{
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    owner: string;
    price: number;
    currency: "TON" | "XTR";
    isPlayable?: boolean;
    audioUrl?: string;
  }>;
  className?: string;
  onPlayNFT?: (nftId: string) => void;
  onPurchaseNFT?: (nftId: string) => void;
  onViewDetails?: (nftId: string) => void;
}

export function NFTShowcase({
  nfts,
  className,
  onPlayNFT,
  onPurchaseNFT,
  onViewDetails,
}: NFTShowcaseProps) {
  const { toast } = useToast();
  const [playingNFT, setPlayingNFT] = useState<string | null>(null);

  const handlePlayPause = (nftId: string, isPlayable: boolean | undefined) => {
    if (!isPlayable) return;

    if (playingNFT === nftId) {
      setPlayingNFT(null);
      // Остановить воспроизведение
    } else {
      setPlayingNFT(nftId);
      // Начать воспроизведение
      onPlayNFT?.(nftId);
    }
  };

  const formatAddress = (address: string, length: number = 4): string => {
    if (!address) return "";
    return `${address.slice(0, length)}...${address.slice(-length)}`;
  };

  const formatPrice = (price: number, currency: "TON" | "XTR"): string => {
    return `${price} ${currency === "TON" ? "TON" : "Stars"}`;
  };

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}
    >
      {nfts.map((nft) => (
        <Card
          key={nft.id}
          className="overflow-hidden hover:shadow-lg transition-shadow"
        >
          <div className="relative aspect-square w-full">
            <Image
              src={nft.imageUrl}
              alt={nft.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
            />

            {nft.isPlayable && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Button
                  size="lg"
                  className="rounded-full h-16 w-16 bg-white/90 hover:bg-white text-black"
                  onClick={() => handlePlayPause(nft.id, nft.isPlayable)}
                >
                  {playingNFT === nft.id ? (
                    <Pause className="h-8 w-8" />
                  ) : (
                    <Play className="h-8 w-8 ml-1" />
                  )}
                </Button>
              </div>
            )}

            <Badge
              variant="secondary"
              className="absolute top-2 right-2 text-xs"
            >
              {nft.currency === "TON" ? "TON" : "Stars"}
            </Badge>
          </div>

          <CardHeader className="p-4">
            <CardTitle className="text-lg line-clamp-1">{nft.name}</CardTitle>
            <CardDescription className="text-sm line-clamp-2">
              {nft.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 pt-0 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Владелец</div>
              <Badge variant="outline" className="text-xs">
                {formatAddress(nft.owner, 4)}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Цена</div>
              <div className="font-semibold">
                {formatPrice(nft.price, nft.currency)}
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-4 pt-0 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onViewDetails?.(nft.id)}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Детали
            </Button>

            {nft.isPlayable && (
              <Button
                size="sm"
                className="flex-1"
                onClick={() => handlePlayPause(nft.id, nft.isPlayable)}
              >
                {playingNFT === nft.id ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Пауза
                  </>
                ) : (
                  <>
                    <Music className="h-4 w-4 mr-2" />
                    Играть
                  </>
                )}
              </Button>
            )}

            <Button
              size="sm"
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              onClick={() => onPurchaseNFT?.(nft.id)}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Купить
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
