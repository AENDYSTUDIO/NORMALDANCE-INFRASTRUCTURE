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
import { useTonWallet } from "@/hooks/use-ton-wallet";
import { Copy, ExternalLink, Wallet } from "lucide-react";

interface TonWalletInfoProps {
  className?: string;
  onSend?: () => void;
  onReceive?: () => void;
  onViewTransactions?: () => void;
  onDisconnect?: () => void;
}

export function TonWalletInfo({
  className,
  onSend,
  onReceive,
  onViewTransactions,
  onDisconnect,
}: TonWalletInfoProps) {
  const {
    connected,
    address,
    balance,
    network,
    error,
    isLoading,
    formatAddress,
    disconnectWallet,
  } = useTonWallet();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (!connected || !address) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            TON Кошелек
          </CardTitle>
          <CardDescription>
            Подключите TON кошелек для доступа к платформе
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center">
            Кошелек не подключен
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
              <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <Wallet className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                TON Кошелек
                <Badge variant="secondary" className="text-xs">
                  {network}
                </Badge>
              </CardTitle>
              <CardDescription>{formatAddress(address, 6)}</CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(address)}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Баланс</span>
            <div className="text-right">
              <p className="font-semibold">
                {balance !== null ? `${balance} TON` : "Загрузка..."}
              </p>
              <p className="text-xs text-muted-foreground">
                ${(parseFloat(balance || "0") * 2.5).toFixed(2)} USD
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Статус</span>
            <Badge variant="default" className="text-xs">
              <Wallet className="h-3 w-3 mr-1" />
              Подключен
            </Badge>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 rounded-md">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onSend}
            disabled={isLoading}
          >
            Отправить
          </Button>
          <Button className="flex-1" onClick={onReceive} disabled={isLoading}>
            Получить
          </Button>
        </div>

        <div className="flex gap-2 w-full">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onViewTransactions}
            disabled={isLoading}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Транзакции
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={() => {
              disconnectWallet();
              if (onDisconnect) onDisconnect();
            }}
            disabled={isLoading}
          >
            Отключить
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
