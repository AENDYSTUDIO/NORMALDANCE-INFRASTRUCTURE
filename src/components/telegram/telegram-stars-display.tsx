"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, ShoppingCart, Star } from "lucide-react";
import { useState } from "react";

interface TelegramStarsDisplayProps {
  balance?: number;
  className?: string;
  onPurchaseStars?: () => void;
  onViewTransactions?: () => void;
}

export function TelegramStarsDisplay({
  balance = 0,
  className,
  onPurchaseStars,
  onViewTransactions
}: TelegramStarsDisplayProps) {
  const { toast } = useToast();
  const [exchangeRate, setExchangeRate] = useState(0.01); // 1 Star = 0.01 USD

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

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Telegram Stars
        </CardTitle>
        <CardDescription>
          Ваша виртуальная валюта Telegram
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
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
        
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={onPurchaseStars}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Купить
          </Button>
          <Button
            variant="outline"
            onClick={onViewTransactions}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            История
          </Button>
        </div>
        
        <div className="pt-2 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Курс обмена</span>
            <span>1 Star = $0.01 USD</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Платформа</span>
            <span>Telegram</span>
          </div>
        </div>
        
        <div className="text-center text-xs text-muted-foreground">
          <p>✓ Безопасные платежи через Telegram</p>
          <p>✓ Мгновенное зачисление</p>
        </div>
      </CardContent>
    </Card>
  );
}