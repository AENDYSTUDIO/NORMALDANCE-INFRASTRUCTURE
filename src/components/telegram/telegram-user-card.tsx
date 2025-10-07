"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { useTelegram } from "@/contexts/telegram-context";
import { useToast } from "@/hooks/use-toast";
import { Copy, ExternalLink, Shield, Star, User } from "lucide-react";
import { useEffect, useState } from "react";

interface TelegramUserCardProps {
  className?: string;
  onEditProfile?: () => void;
  onViewWallet?: () => void;
  onSendMessage?: () => void;
}

export function TelegramUserCard({
  className,
  onEditProfile,
  onViewWallet,
  onSendMessage,
}: TelegramUserCardProps) {
  const { isTMA, tgWebApp, theme, colorScheme } = useTelegram();
  const { toast } = useToast();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isPremium, setIsPremium] = useState(false);

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
          <CardTitle>Профиль пользователя</CardTitle>
          <CardDescription>
            Информация о пользователе недоступна
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
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
          <div>
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

      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">User ID</span>
            <div className="flex items-center gap-2">
              <span className="text-sm">{formatId(userInfo.id)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Language</span>
            <span className="text-sm">
              {userInfo.language_code?.toUpperCase() || "EN"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Theme</span>
            <Badge variant="outline" className="text-xs capitalize">
              {theme}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge variant="default" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        <div className="flex gap-2 w-full">
          <Button variant="outline" className="flex-1" onClick={onEditProfile}>
            <User className="h-4 w-4 mr-2" />
            Редактировать
          </Button>
          <Button className="flex-1" onClick={onViewWallet}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Кошелек
          </Button>
        </div>

        <Button variant="secondary" className="w-full" onClick={onSendMessage}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Написать сообщение
        </Button>
      </CardFooter>
    </Card>
  );
}
