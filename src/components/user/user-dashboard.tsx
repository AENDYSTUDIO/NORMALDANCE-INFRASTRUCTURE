"use client";

import { NFTGallery } from "@/components/nft/nft-gallery";
import { TelegramStarsInfo } from "@/components/telegram/telegram-stars-info";
import { TelegramUserProfile } from "@/components/telegram/telegram-user-profile";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TonWalletInfo } from "@/components/wallet/ton-wallet-info";
import { Star, User, Wallet } from "lucide-react";

interface UserDashboardProps {
  className?: string;
}

export function UserDashboard({ className }: UserDashboardProps) {
  // Mock data for NFTs
  const mockNFTs = [
    {
      id: "1",
      name: "Summer Vibes",
      description: "Limited edition summer track NFT",
      imageUrl: "/images/nft1.jpg",
      owner: "EQD...",
      price: 50,
      currency: "TON" as const,
      isPlayable: true,
    },
    {
      id: "2",
      name: "Night City",
      description: "Cyberpunk inspired music NFT",
      imageUrl: "/images/nft2.jpg",
      owner: "EQD...",
      price: 75,
      currency: "TON" as const,
      isPlayable: true,
    },
    {
      id: "3",
      name: "Ocean Waves",
      description: "Relaxing ambient track NFT",
      imageUrl: "/images/nft3.jpg",
      owner: "EQD...",
      price: 100,
      currency: "XTR" as const,
      isPlayable: true,
    },
  ];

  const handleEditProfile = () => {
    console.log("Edit profile");
  };

  const handleViewWallet = () => {
    console.log("View wallet");
  };

  const handleSend = () => {
    console.log("Send TON");
  };

  const handleReceive = () => {
    console.log("Receive TON");
  };

  const handleViewTransactions = () => {
    console.log("View transactions");
  };

  const handleDisconnectWallet = () => {
    console.log("Disconnect wallet");
  };

  const handlePurchaseStars = () => {
    console.log("Purchase Stars");
  };

  const handleViewStarsTransactions = () => {
    console.log("View Stars transactions");
  };

  const handlePlayNFT = (nftId: string) => {
    console.log("Play NFT:", nftId);
  };

  const handlePurchaseNFT = (nftId: string) => {
    console.log("Purchase NFT:", nftId);
  };

  const handleViewNFTDetails = (nftId: string) => {
    console.log("View NFT details:", nftId);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-2xl">Панель управления</CardTitle>
        <CardDescription>
          Управляйте своим профилем, кошельками и NFT коллекцией
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Профиль
            </TabsTrigger>
            <TabsTrigger value="wallet" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Кошелек
            </TabsTrigger>
            <TabsTrigger value="stars" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Stars
            </TabsTrigger>
            <TabsTrigger value="nft" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Коллекция
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <div className="space-y-6">
              <TelegramUserProfile
                onEditProfile={handleEditProfile}
                onViewWallet={handleViewWallet}
              />
            </div>
          </TabsContent>

          <TabsContent value="wallet" className="mt-6">
            <div className="space-y-6">
              <TonWalletInfo
                onSend={handleSend}
                onReceive={handleReceive}
                onViewTransactions={handleViewTransactions}
                onDisconnect={handleDisconnectWallet}
              />

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Быстрые действия</CardTitle>
                    <CardDescription>
                      Часто используемые функции кошелька
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <button className="p-3 border rounded-lg hover:bg-muted transition-colors">
                        <p className="text-sm font-medium">Отправить</p>
                      </button>
                      <button className="p-3 border rounded-lg hover:bg-muted transition-colors">
                        <p className="text-sm font-medium">Получить</p>
                      </button>
                      <button className="p-3 border rounded-lg hover:bg-muted transition-colors">
                        <p className="text-sm font-medium">Обменять</p>
                      </button>
                      <button className="p-3 border rounded-lg hover:bg-muted transition-colors">
                        <p className="text-sm font-medium">Стейкинг</p>
                      </button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Статистика</CardTitle>
                    <CardDescription>
                      Активность кошелька за последний месяц
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Транзакции
                        </span>
                        <span className="text-sm font-medium">24</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Объем
                        </span>
                        <span className="text-sm font-medium">125.6 TON</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Комиссии
                        </span>
                        <span className="text-sm font-medium">0.12 TON</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stars" className="mt-6">
            <div className="space-y-6">
              <TelegramStarsInfo
                onPurchaseStars={handlePurchaseStars}
                onViewTransactions={handleViewStarsTransactions}
              />

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Использование Stars
                    </CardTitle>
                    <CardDescription>
                      Как вы используете свои Stars
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                          <span className="text-sm">Покупки контента</span>
                        </div>
                        <span className="text-sm font-medium">60%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                          <span className="text-sm">Подписки</span>
                        </div>
                        <span className="text-sm font-medium">25%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-green-500"></div>
                          <span className="text-sm">Донаты</span>
                        </div>
                        <span className="text-sm font-medium">15%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">История покупок</CardTitle>
                    <CardDescription>
                      Последние транзакции Stars
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">NFT трек</span>
                        <span className="text-sm font-medium">-25 Stars</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Подписка на бота</span>
                        <span className="text-sm font-medium">-10 Stars</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Донат автору</span>
                        <span className="text-sm font-medium">-5 Stars</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="nft" className="mt-6">
            <div className="space-y-6">
              <NFTGallery
                nfts={mockNFTs}
                onPlayNFT={handlePlayNFT}
                onPurchaseNFT={handlePurchaseNFT}
                onViewNFTDetails={handleViewNFTDetails}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
