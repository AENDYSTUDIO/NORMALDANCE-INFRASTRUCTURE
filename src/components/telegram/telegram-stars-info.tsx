"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { useTelegramStars } from "@/hooks/use-telegram-stars";
import { ExternalLink, ShoppingCart, Star } from "lucide-react";

interface TelegramStarsInfoProps {
  className?: string;
  onPurchaseStars?: () => void;
  onViewTransactions?: () => void;
}

export function TelegramStarsInfo({
  className,
  onPurchaseStars,
  onViewTransactions,
}: TelegramStarsInfoProps) {
  const { isTMA, tgWebApp } = useTelegram();
  const { isProcessing, paymentResult } = useTelegramStars();

  // В реальной реализации здесь будет вызов API для получения баланса Stars
  const starsBalance = 100; // Заглушка

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                <Star className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                Telegram Stars
                <Badge
                  variant="secondary"
                  className="text-xs bg-yellow-100 text-yellow-800"
                >
                  <Star className="h-3 w-3 mr-1" />
                  {starsBalance}
                </Badge>
              </CardTitle>
              <CardDescription>Виртуальная валюта Telegram</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Баланс</span>
            <div className="text-right">
              <p className="font-semibold text-yellow-600">
                {starsBalance} Stars
              </p>
              <p className="text-xs text-muted-foreground">
                ${(starsBalance * 0.01).toFixed(2)} USD
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Статус</span>
            <Badge
              variant="default"
              className="text-xs bg-yellow-500 text-yellow-900"
            >
              <Star className="h-3 w-3 mr-1" />
              Активен
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Курс</span>
            <span className="text-sm font-medium">1 Star = $0.01 USD</span>
          </div>
        </div>

        {paymentResult.status === "completed" && (
          <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-md">
            <p className="text-green-800 dark:text-green-200 text-sm">
              Платеж успешно выполнен!
            </p>
          </div>
        )}

        {paymentResult.status === "failed" && (
          <div className="p-3 bg-destructive/10 rounded-md">
            <p className="text-destructive text-sm">{paymentResult.error}</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        <div className="flex gap-2 w-full">
          <Button
            className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
            onClick={onPurchaseStars}
            disabled={isProcessing}
          >
            {isProcessing ? (
              "Обработка..."
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Купить Stars
              </>
            )}
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={onViewTransactions}
            disabled={isProcessing}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            История
          </Button>
        </div>

        <div className="text-center text-xs text-muted-foreground mt-2">
          <p>✓ Безопасные платежи через Telegram</p>
          <p>✓ Мгновенное зачисление</p>
        </div>
      </CardFooter>
    </Card>
  );
}
