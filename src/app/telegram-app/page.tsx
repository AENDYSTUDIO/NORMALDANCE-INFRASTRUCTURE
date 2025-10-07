"use client";

import { NFTGallery } from "@/components/nft/nft-gallery";
import TelegramStarsButton from "@/components/payment/telegram-stars-button";
import { TonPaymentButton } from "@/components/payment/ton-payment-button";
import { TelegramStarsInfo } from "@/components/telegram/telegram-stars-info";
import { TelegramUserProfile } from "@/components/telegram/telegram-user-profile";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserDashboard } from "@/components/user/user-dashboard";
import { TonWalletInfo } from "@/components/wallet/ton-wallet-info";
import { useTelegram } from "@/contexts/telegram-context";
import { useTonConnect } from "@/contexts/ton-connect-context";
import { Home, Music, Star, User, Wallet } from "lucide-react";

export default function TelegramAppPage() {
  const { isTMA, tgWebApp, theme } = useTelegram();
  const { connected, account } = useTonConnect();

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

  const handlePlayNFT = (nftId: string) => {
    console.log("Play NFT:", nftId);
  };

  const handlePurchaseNFT = (nftId: string) => {
    console.log("Purchase NFT:", nftId);
  };

  const handleViewNFTDetails = (nftId: string) => {
    console.log("View NFT details:", nftId);
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

  const handleEditProfile = () => {
    console.log("Edit profile");
  };

  const handleViewWallet = () => {
    console.log("View wallet");
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-4">
          <h1 className="text-2xl font-bold">NormalDance</h1>
          <p className="text-muted-foreground">Music NFT Marketplace</p>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="home" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger
              value="home"
              className="flex flex-col items-center gap-1"
            >
              <Home className="h-4 w-4" />
              <span className="text-xs">Главная</span>
            </TabsTrigger>
            <TabsTrigger
              value="music"
              className="flex flex-col items-center gap-1"
            >
              <Music className="h-4 w-4" />
              <span className="text-xs">Музыка</span>
            </TabsTrigger>
            <TabsTrigger
              value="wallet"
              className="flex flex-col items-center gap-1"
            >
              <Wallet className="h-4 w-4" />
              <span className="text-xs">Кошелек</span>
            </TabsTrigger>
            <TabsTrigger
              value="stars"
              className="flex flex-col items-center gap-1"
            >
              <Star className="h-4 w-4" />
              <span className="text-xs">Stars</span>
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className="flex flex-col items-center gap-1"
            >
              <User className="h-4 w-4" />
              <span className="text-xs">Профиль</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="h-5 w-5" />
                    Добро пожаловать в NormalDance
                  </CardTitle>
                  <CardDescription>
                    Ваша платформа для покупки и продажи музыкальных NFT
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      variant="outline"
                      className="h-24 flex flex-col gap-2"
                    >
                      <Music className="h-6 w-6" />
                      <span>Прослушать</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-24 flex flex-col gap-2"
                    >
                      <Wallet className="h-6 w-6" />
                      <span>Кошелек</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-24 flex flex-col gap-2"
                    >
                      <Star className="h-6 w-6" />
                      <span>Stars</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <NFTGallery
                nfts={mockNFTs.slice(0, 2)}
                onPlayNFT={handlePlayNFT}
                onPurchaseNFT={handlePurchaseNFT}
                onViewNFTDetails={handleViewNFTDetails}
              />
            </div>
          </TabsContent>

          <TabsContent value="music" className="mt-6">
            <NFTGallery
              nfts={mockNFTs}
              onPlayNFT={handlePlayNFT}
              onPurchaseNFT={handlePurchaseNFT}
              onViewNFTDetails={handleViewNFTDetails}
            />
          </TabsContent>

          <TabsContent value="wallet" className="mt-6">
            <div className="space-y-6">
              <TonWalletInfo
                onSend={handleSend}
                onReceive={handleReceive}
                onViewTransactions={handleViewTransactions}
                onDisconnect={handleDisconnectWallet}
              />

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Отправить средства
                  </CardTitle>
                  <CardDescription>
                    Отправьте TON или токены другому пользователю
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TonPaymentButton
                    amount={1}
                    recipient="EQD..."
                    description="Перевод средств"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="stars" className="mt-6">
            <div className="space-y-6">
              <TelegramStarsInfo
                onPurchaseStars={handlePurchaseStars}
                onViewTransactions={handleViewStarsTransactions}
              />

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Купить Stars
                  </CardTitle>
                  <CardDescription>
                    Пополните баланс Telegram Stars
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TelegramStarsButton
                    amount={100}
                    itemId="stars_100"
                    itemName="100 Stars"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <div className="space-y-6">
              <TelegramUserProfile
                onEditProfile={handleEditProfile}
                onViewWallet={handleViewWallet}
              />

              <UserDashboard />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
