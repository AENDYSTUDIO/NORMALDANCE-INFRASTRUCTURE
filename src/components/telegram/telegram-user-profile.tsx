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
import { Separator } from "@/components/ui/separator";
import { useTelegram } from "@/contexts/telegram-context";
import { Copy, ExternalLink, Shield, Star, User } from "lucide-react";
import { useEffect, useState } from "react";

interface TelegramUserProfileProps {
  className?: string;
  onEditProfile?: () => void;
  onViewWallet?: () => void;
}

export function TelegramUserProfile({
  className,
  onEditProfile,
  onViewWallet,
}: TelegramUserProfileProps) {
  const { isTMA, tgWebApp, theme, colorScheme } = useTelegram();
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
    } catch (err) {
      console.error("Failed to copy:", err);
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
                  <Star className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {formatUsername(userInfo.username)}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">User ID</span>
            <div className="flex items-center gap-2">
              <span className="text-sm">{formatId(userInfo.id)}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(userInfo.id?.toString() || "")}
              >
                <Copy className="h-4 w-4" />
              </Button>
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

      <CardFooter className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onEditProfile}>
          <User className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
        <Button className="flex-1" onClick={onViewWallet}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Wallet
        </Button>
      </CardFooter>
    </Card>
  );
}
