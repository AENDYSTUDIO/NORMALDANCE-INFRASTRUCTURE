"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTelegram } from "@/contexts/telegram-context";
import { useTonConnect } from "@/contexts/ton-connect-context";
import { useToast } from "@/hooks/use-toast";
import { Copy, ExternalLink, Music, Star, User, Wallet } from "lucide-react";
import { useEffect, useState } from "react";

interface UserOverviewProps {
  className?: string;
  onEditProfile?: () => void;
  onViewWallet?: () => void;
  onSendMessage?: () => void;
  onViewCollection?: () => void;
}

export function UserOverview({
  className,
  onEditProfile,
  onViewWallet,
  onSendMessage,
  onViewCollection,
}: UserOverviewProps) {
  const { isTMA, tgWebApp, theme } = useTelegram();
  const { connected, account } = useTonConnect();
  const { toast } = useToast();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [stats, setStats] = useState({
    nftCount: 12,
    totalValue: 245.6,
    starsBalance: 150,
    tonBalance: 12.5,
  });

  useEffect(() => {
    if (isTMA && tgWebApp) {
      const user = tgWebApp.initDataUnsafe?.user;
      if (user) {
        setUserInfo(user);
        setIsPremium(!!user.is_premium);
      }
    }
  }, [isTMA, tgWebApp]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Скопировано",
        description: "Информация скопирована в буфер обмена",
      });
    } catch (err) {
      console.error("Failed to copy:", err);
      toast({
        title: "Ошибка",
        description: "Не удалось скопировать в буфер обмена",
        variant: "destructive",
      });
    }
  };

  const formatAddress = (address: string, length: number = 4): string => {
    if (!address) return "";
    return `${address.slice(0, length)}...${address.slice(-length)}`;
  };

  const formatUsername = (username: string | undefined): string => {
    if (!username) return "";
    return `@${username}`;
  };

  const formatId = (id: number | undefined): string => {
    if (!id) return "";
    return `ID: ${id}`;
  };

  if (!isTMA || !userInfo) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Обзор профиля</CardTitle>
          <CardDescription>
            Информация о пользователе недоступна
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center">
            Эта информация доступна только в Telegram Mini Apps
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            {userInfo.photo_url ? (
              <AvatarImage src={userInfo.photo_url} alt={userInfo.first_name} />
            ) : (
              <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                {userInfo.first_name?.charAt(0)}
                {userInfo.last_name?.charAt(0)}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {userInfo.first_name} {userInfo.last_name}
              {isPremium && (
                <Badge variant="secondary" className="text-xs">
                  <Star className="h-3 w-3 mr-1 text-yellow-500" />
                  Premium
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              {formatUsername(userInfo.username)}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(userInfo.id?.toString() || "")}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="border rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-purple-600">
              {stats.nftCount}
            </p>
            <p className="text-xs text-muted-foreground">NFT</p>
          </div>
          <div className="border rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-600">
              ${stats.totalValue.toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground">Общая стоимость</p>
          </div>
          <div className="border rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {stats.starsBalance}
            </p>
            <p className="text-xs text-muted-foreground">Stars</p>
          </div>
          <div className="border rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">
              {stats.tonBalance}
            </p>
            <p className="text-xs text-muted-foreground">TON</p>
          </div>
        </div>

        <Separator />

        {/* Wallet Info */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Кошелек</span>
            {connected && account ? (
              <Badge variant="default" className="text-xs">
                <Wallet className="h-3 w-3 mr-1" />
                Подключен
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-xs">
                <Wallet className="h-3 w-3 mr-1" />
                Не подключен
              </Badge>
            )}
          </div>

          {connected && account && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Адрес</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono">
                  {formatAddress(account.address, 4)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(account.address)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onEditProfile}
            className="flex items-center gap-2"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Профиль</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onViewWallet}
            className="flex items-center gap-2"
          >
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">Кошелек</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onViewCollection}
            className="flex items-center gap-2"
          >
            <Music className="h-4 w-4" />
            <span className="hidden sm:inline">Коллекция</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onSendMessage}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="hidden sm:inline">Сообщение</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
