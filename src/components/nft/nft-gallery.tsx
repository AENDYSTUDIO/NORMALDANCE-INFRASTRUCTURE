"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Grid, List, Search } from "lucide-react";
import { useState } from "react";
import { NFTItem } from "./nft-item";

interface NFT {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  owner: string;
  price?: number;
  currency?: "TON" | "XTR";
  isPlayable?: boolean;
}

interface NFTGalleryProps {
  nfts: NFT[];
  onPlayNFT?: (nftId: string) => void;
  onPurchaseNFT?: (nftId: string) => void;
  onViewNFTDetails?: (nftId: string) => void;
  className?: string;
}

export function NFTGallery({
  nfts,
  onPlayNFT,
  onPurchaseNFT,
  onViewNFTDetails,
  className,
}: NFTGalleryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"newest" | "price_low" | "price_high">(
    "newest"
  );

  const filteredAndSortedNFTs = nfts
    .filter(
      (nft) =>
        nft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nft.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return b.id.localeCompare(a.id); // Предполагаем, что более новые ID больше
        case "price_low":
          return (a.price || 0) - (b.price || 0);
        case "price_high":
          return (b.price || 0) - (a.price || 0);
        default:
          return 0;
      }
    });

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Коллекция NFT</span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            >
              {viewMode === "grid" ? (
                <List className="h-4 w-4" />
              ) : (
                <Grid className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          {filteredAndSortedNFTs.length} NFT в коллекции
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Поиск и фильтры */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по названию или описанию..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border rounded-md px-3 py-2 text-sm"
            >
              <option value="newest">Новинки</option>
              <option value="price_low">Цена: по возрастанию</option>
              <option value="price_high">Цена: по убыванию</option>
            </select>
          </div>
        </div>

        {/* Список NFT */}
        {filteredAndSortedNFTs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Нет NFT, соответствующих критериям поиска</p>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                : "space-y-4"
            }
          >
            {filteredAndSortedNFTs.map((nft) => (
              <NFTItem
                key={nft.id}
                id={nft.id}
                name={nft.name}
                description={nft.description}
                imageUrl={nft.imageUrl}
                owner={nft.owner}
                price={nft.price}
                currency={nft.currency}
                isPlayable={nft.isPlayable}
                onPlay={() => onPlayNFT?.(nft.id)}
                onPurchase={() => onPurchaseNFT?.(nft.id)}
                onViewDetails={() => onViewNFTDetails?.(nft.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
