
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Copy, ExternalLink, ShoppingCart, Star } from "lucide-react";
import { useTelegram } from "@/contexts/telegram-context";
import { useToast } from "@/hooks/use-toast";

interface TelegramStarsWalletProps {
  balance?: number;
  className?: string;
  onPurchaseStars?: () => void;
  onViewTransactions?: () => void;
  onSendStars?: () => void;
  onReceiveStars?: () => void;
}

export function TelegramStarsWallet({
  balance = 0,
  className,
  onPurchaseStars,
  onViewTransactions,
  onSendStars,
  onReceiveStars
}: TelegramStarsWalletProps) {
  const { isTMA, tgWebApp, theme } = useTelegram();
  const { toast } = useToast();
  const [exchangeRate, setExchangeRate] = useState(0.01); // 1 Star = 0.01 USD
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // В реальной реализации здесь будет загрузка баланса из Telegram
    // Пока используем пропс balance
  }, []);

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

  const formatUSD = (stars: number): string => {
    const usd = stars * exchangeRate;
    return `$${usd.toFixed(2)}`;
  };

  const getUserId = (): string | null => {
    if (isTMA && tgWebApp) {
      const user = tgWebApp.initDataUnsafe?.user;
      return user?.id?.toString() || null;
    }
    return null;
  };

  if (!isTMA) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Telegram Stars
          </CardTitle>
          <CardDescription>
            Информация о Stars доступна только в Telegram
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
        <CardTitle className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center text-white">
            <Star className="h-5 w-5" />
          </div>
          Telegram Stars
        </CardTitle>
        <CardDescription>
          Ваша виртуальная валюта Telegram
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Balance */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-yellow-600">
              {balance} Stars
            </p>
            <p className="text-sm text-muted-foreground">
              {formatUSD(balance)} USD
            </p>
          </div>
          <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
            <Star className="h-3 w-3 mr-1" />
            Активен
          </Badge>
        </div>
        
        <Separator />
        
        {/* User Info */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">User ID</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono">
              {getUserId()?.slice(0, 6)}...{getUserId()?.slice(-4)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(getUserId() || '')}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        
        <Separator />
        
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button
