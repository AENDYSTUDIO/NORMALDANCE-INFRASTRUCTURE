"use client";

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
import { useTonConnect } from "@/contexts/ton-connect-context";
import { useToast } from "@/hooks/use-toast";
import { Copy, ExternalLink, QrCode, Send, Wallet } from "lucide-react";
import { useEffect, useState } from "react";

interface TonWalletOverviewProps {
  className?: string;
  onSend?: () => void;
  onReceive?: () => void;
  onViewTransactions?: () => void;
  onDisconnect?: () => void;
  onBackup?: () => void;
}

export function TonWalletOverview({
  className,
  onSend,
  onReceive,
  onViewTransactions,
  onDisconnect,
  onBackup,
}: TonWalletOverviewProps) {
  const { connected, account, network } = useTonConnect();
  const { toast } = useToast();
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (connected && account) {
      loadBalance(account.address);
    }
  }, [connected, account]);

  const loadBalance = async (address: string) => {
    setIsLoading(true);
    try {
      // В реальной реализации здесь будет вызов API для получения баланса
      // Пока используем заглушку
      setTimeout(() => {
        setBalance("12.5");
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error loading balance:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить баланс кошелька",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Скопировано",
        description: "Адрес кошелька скопирован в буфер обмена",
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

  const formatBalance = (balance: string | null): string => {
    if (!balance) return "0.00";
    return parseFloat(balance).toFixed(2);
  };

  if (!connected || !account) {
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
        <CardTitle className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white">
            <Wallet className="h-5 w-5" />
          </div>
          TON Кошелек
        </CardTitle>
        <CardDescription>
          Ваш TON кошелек подключен и готов к использованию
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Wallet Address */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Адрес кошелька</p>
            <p className="font-mono text-sm">
              {formatAddress(account.address, 6)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(account.address)}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>

        <Separator />

        {/* Balance */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Баланс</span>
            <div className="text-right">
              <p className="text-2xl font-bold">
                {isLoading ? "Загрузка..." : `${formatBalance(balance)} TON`}
              </p>
              <p className="text-xs text-muted-foreground">
                ${(parseFloat(balance || "0") * 2.5).toFixed(2)} USD
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Сеть</span>
            <Badge variant="secondary" className="text-xs">
              {network === "mainnet" ? "Mainnet" : "Testnet"}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="flex flex-col gap-1 h-20"
            onClick={onSend}
          >
            <Send className="h-5 w-5" />
            <span className="text-xs">Отправить</span>
          </Button>

          <Button
            variant="outline"
            className="flex flex-col gap-1 h-20"
            onClick={onReceive}
          >
            <Download className="h-5 w-5" />
            <span className="text-xs">Получить</span>
          </Button>

          <Button
            variant="outline"
            className="flex flex-col gap-1 h-20"
            onClick={onViewTransactions}
          >
            <ExternalLink className="h-5 w-5" />
            <span className="text-xs">Транзакции</span>
          </Button>

          <Button
            variant="outline"
            className="flex flex-col gap-1 h-20"
            onClick={onBackup}
          >
            <QrCode className="h-5 w-5" />
            <span className="text-xs">Резервная копия</span>
          </Button>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button variant="destructive" className="flex-1" onClick={onDisconnect}>
          Отключить
        </Button>

        <Button
          variant="outline"
          className="flex-1"
          onClick={() =>
            window.open(
              `https://tonscan.org/address/${account.address}`,
              "_blank"
            )
          }
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Просмотр
        </Button>
      </CardFooter>
    </Card>
  );
}
