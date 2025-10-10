"use client";

import {
  BarChart3,
  Coins,
  Music,
  Settings,
  TrendingUp,
  Wallet,
  Zap,
} from "@/components/icons";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { WalletConnect } from "@/components/wallet/wallet-connect";
import { WalletProviderWrapper } from "@/components/wallet/wallet-provider";
import dynamic from "next/dynamic";
import { useState } from "react";

// Ленивая загрузка тяжелых компонентов
const NDTManager = dynamic(() => import("@/components/wallet/ndt-manager"), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full bg-gray-200 animate-pulse rounded" />
  ),
});

const StakingManager = dynamic(
  () => import("@/components/wallet/staking-manager"),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full bg-gray-200 animate-pulse rounded" />
    ),
  }
);

const MusicNFTManager = dynamic(
  () => import("@/components/wallet/music-nft-manager"),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full bg-gray-200 animate-pulse rounded" />
    ),
  }
);

const DeflationStats = dynamic(
  () => import("@/components/wallet/deflation-stats"),
  {
    ssr: false,
    loading: () => (
      <div className="h-32 w-full bg-gray-200 animate-pulse rounded" />
    ),
  }
);

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <WalletProviderWrapper>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Web3 Кошелек</h1>
          <p className="text-muted-foreground">
            Управляйте вашими NDT токенами, стейкингом и музыкальными NFT
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Обзор</TabsTrigger>
            <TabsTrigger value="deflation">Дефляция</TabsTrigger>
            <TabsTrigger value="tokens">Токены</TabsTrigger>
            <TabsTrigger value="staking">Стейкинг</TabsTrigger>
            <TabsTrigger value="nft">NFT</TabsTrigger>
            <TabsTrigger value="settings">Настройки</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Wallet Status Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Статус кошелька
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <WalletConnect />
                </CardContent>
              </Card>

              {/* NDT Balance Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="h-5 w-5" />
                    NDT Баланс
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      1,000.00
                    </div>
                    <div className="text-sm text-muted-foreground">NDT</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-medium">0.0500</div>
                    <div className="text-sm text-muted-foreground">SOL</div>
                  </div>
                  <Badge variant="secondary" className="w-full justify-center">
                    Активный
                  </Badge>
                </CardContent>
              </Card>

              {/* Staking Stats Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Статистика стейкинга
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">15%</div>
                    <div className="text-sm text-muted-foreground">
                      Текущий APY
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-medium">500.00</div>
                    <div className="text-sm text-muted-foreground">
                      Застейкено NDT
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-green-600">
                      +25.00 NDT
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Накоплено rewards
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Быстрые действия</CardTitle>
                <CardDescription>
                  Часто используемые операции с вашим кошельком
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Zap className="h-6 w-6" />
                    <span className="text-xs">Стейкинг</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Coins className="h-6 w-6" />
                    <span className="text-xs">Купить NDT</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Music className="h-6 w-6" />
                    <span className="text-xs">Музыка NFT</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <BarChart3 className="h-6 w-6" />
                    <span className="text-xs">Аналитика</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tokens" className="space-y-6">
            <NDTManager />
          </TabsContent>

          <TabsContent value="staking" className="space-y-6">
            <StakingManager />
          </TabsContent>

          <TabsContent value="nft" className="space-y-6">
            <MusicNFTManager />
          </TabsContent>

          <TabsContent value="deflation" className="space-y-6">
            <DeflationStats />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Настройки кошелька
                </CardTitle>
                <CardDescription>
                  Управление настройками безопасности и предпочтениями
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Автоматический стейкинг</h4>
                      <p className="text-sm text-muted-foreground">
                        Автоматически реинвестировать rewards
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Включить
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Уведомления</h4>
                      <p className="text-sm text-muted-foreground">
                        Получать уведомления о транзакциях
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Настроить
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Безопасность</h4>
                      <p className="text-sm text-muted-foreground">
                        Управление доступом и паролями
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Управлять
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </WalletProviderWrapper>
  );
}
