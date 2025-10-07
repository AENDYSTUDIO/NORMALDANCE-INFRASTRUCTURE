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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ExternalLink,
  Music,
  Pause,
  Play,
  Search,
  ShoppingCart,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface NFTCollectionItem {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly imageUrl: string;
  readonly owner: string;
  readonly price: number;
  readonly currency: "TON" | "XTR";
  readonly isPlayable?: boolean;
  readonly audioUrl?: string;
  readonly createdAt: string;
  readonly attributes?: Array<{
    readonly trait_type: string;
    readonly value: string;
  }>;
}

interface NFTCollectionProps {
  readonly nfts: readonly NFTCollectionItem[];
  readonly className?: string;
  readonly onPlayNFT?: (nftId: string) => void;
  readonly onPurchaseNFT?: (nftId: string) => void;
  readonly onViewDetails?: (nftId: string) => void;
  readonly onSortChange?: (sortBy: string) => void;
  readonly onFilterChange?: (filter: string) => void;
}

export function NFTCollection({
  nfts,
  className,
  onPlayNFT,
  onPurchaseNFT,
  onViewDetails,
  onSortChange,
  onFilterChange,
}: NFTCollectionProps) {
  const [playingNFT, setPlayingNFT] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterBy, setFilterBy] = useState("all");

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

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Фильтрация и сортировка NFT
  const filteredAndSortedNFTs = nfts
    .filter((nft) => {
      // Поиск по имени и описанию
      const matchesSearch =
        nft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nft.description.toLowerCase().includes(searchTerm.toLowerCase());

      // Фильтр по типу
      const matchesFilter =
        filterBy === "all" ||
        (filterBy === "playable" && nft.isPlayable) ||
        (filterBy === "ton" && nft.currency === "TON") ||
        (filterBy === "stars" && nft.currency === "XTR");

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "price_high":
          return b.price - a.price;
        case "price_low":
          return a.price - b.price;
        case "name_az":
          return a.name.localeCompare(b.name);
        case "name_za":
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5" />
          Коллекция NFT
        </CardTitle>
        <CardDescription>Ваша коллекция музыкальных NFT</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search and Filters */}
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
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Сортировка" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Новинки</SelectItem>
                <SelectItem value="oldest">Старые</SelectItem>
                <SelectItem value="price_high">Цена ↓</SelectItem>
                <SelectItem value="price_low">Цена ↑</SelectItem>
                <SelectItem value="name_az">Имя A-Z</SelectItem>
                <SelectItem value="name_za">Имя Z-A</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Фильтр" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                <SelectItem value="playable">Воспроизводимые</SelectItem>
                <SelectItem value="ton">TON</SelectItem>
                <SelectItem value="stars">Stars</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* NFT Grid */}
        {filteredAndSortedNFTs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Нет NFT, соответствующих критериям поиска</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedNFTs.map((nft) => (
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

                <CardHeader className="p-3">
                  <CardTitle className="text-sm line-clamp-1">
                    {nft.name}
                  </CardTitle>
                  <CardDescription className="text-xs line-clamp-2">
                    {nft.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-3 pt-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Владелец
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {formatAddress(nft.owner, 4)}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">Создан</div>
                    <div className="text-xs">{formatDate(nft.createdAt)}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">Цена</div>
                    <div className="font-semibold text-xs">
                      {formatPrice(nft.price, nft.currency)}
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-3 pt-0 flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs h-8"
                    onClick={() => onViewDetails?.(nft.id)}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Детали
                  </Button>

                  {nft.isPlayable && (
                    <Button
                      size="sm"
                      className="flex-1 text-xs h-8"
                      onClick={() => handlePlayPause(nft.id, nft.isPlayable)}
                    >
                      {playingNFT === nft.id ? (
                        <>
                          <Pause className="h-3 w-3 mr-1" />
                          Пауза
                        </>
                      ) : (
                        <>
                          <Music className="h-3 w-3 mr-1" />
                          Играть
                        </>
                      )}
                    </Button>
                  )}

                  <Button
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-xs h-8"
                    onClick={() => onPurchaseNFT?.(nft.id)}
                  >
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    Купить
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          Всего: {filteredAndSortedNFTs.length} NFT
        </div>
        <Button variant="outline" size="sm">
          <ExternalLink className="h-4 w-4 mr-2" />
          Экспорт коллекции
        </Button>
      </CardFooter>
    </Card>
  );
}
