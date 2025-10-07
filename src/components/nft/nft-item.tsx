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
import { ExternalLink, Music, Play } from "lucide-react";
import Image from "next/image";

interface NFTItemProps {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  owner: string;
  price?: number;
  currency?: "TON" | "XTR";
  isPlayable?: boolean;
  onPlay?: () => void;
  onPurchase?: () => void;
  onViewDetails?: () => void;
  className?: string;
}

export function NFTItem({
  id,
  name,
  description,
  imageUrl,
  owner,
  price,
  currency = "TON",
  isPlayable = false,
  onPlay,
  onPurchase,
  onViewDetails,
  className,
}: NFTItemProps) {
  const formatAddress = (address: string, length: number = 4): string => {
    if (!address) return "";
    return `${address.slice(0, length)}...${address.slice(-length)}`;
  };

  return (
    <Card className={`overflow-hidden ${className || ""}`}>
      <div className="relative aspect-square w-full">
        <Image
          src={imageUrl}
          alt={name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
        />
        {isPlayable && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <Button
              size="lg"
              className="rounded-full h-16 w-16 bg-white/90 hover:bg-white text-black"
              onClick={onPlay}
            >
              <Play className="h-8 w-8 ml-1" />
            </Button>
          </div>
        )}
      </div>

      <CardHeader className="p-4">
        <CardTitle className="text-lg line-clamp-1">{name}</CardTitle>
        <CardDescription className="text-sm line-clamp-2">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 pt-0 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Владелец</div>
          <Badge variant="secondary" className="text-xs">
            {formatAddress(owner, 4)}
          </Badge>
        </div>

        {price && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Цена</div>
            <div className="font-semibold">
              {price} {currency === "TON" ? "TON" : "Stars"}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onViewDetails}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Детали
        </Button>

        {isPlayable && (
          <Button size="sm" className="flex-1" onClick={onPlay}>
            <Music className="h-4 w-4 mr-2" />
            Играть
          </Button>
        )}

        {price && onPurchase && (
          <Button
            size="sm"
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            onClick={onPurchase}
          >
            Купить
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
