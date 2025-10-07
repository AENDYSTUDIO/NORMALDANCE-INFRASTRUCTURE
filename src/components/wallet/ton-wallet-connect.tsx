"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { Copy, ExternalLink, Wallet } from "lucide-react";
import { useState } from "react";

interface TonWalletConnectProps {
  className?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function TonWalletConnect({
  className,
  onConnect,
  onDisconnect,
}: TonWalletConnectProps) {
  const [tonConnectUI] = useTonConnectUI();
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await tonConnectUI.connectWallet();
      onConnect?.();
      toast({
        title: "Кошелек подключен",
        description: "TON кошелек успешно подключен к приложению",
      });
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast({
        title: "Ошибка подключения",
        description: "Не удалось подключить TON кошелек",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await tonConnectUI.disconnect();
      onDisconnect?.();
      toast({
        title: "Кошелек отключен",
        description: "TON кошелек успешно отключен от приложения",
      });
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      toast({
        title: "Ошибка отключения",
        description: "Не удалось отключить TON кошелек",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Адрес скопирован",
        description: "Адрес кошелька скопирован в буфер обмена",
      });
    } catch (err) {
      console.error("Failed to copy:", err);
      toast({
        title: "Ошибка копирования",
        description: "Не удалось скопировать адрес в буфер обмена",
        variant: "destructive",
      });
    }
  };

  if (tonConnectUI.connected && tonConnectUI.wallet?.account) {
    const account = tonConnectUI.wallet.account;

    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            TON Кошелек подключен
          </CardTitle>
          <CardDescription>Ваш TON кошелек успешно подключен</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">T</span>
              </div>
              <div>
                <p className="text-sm font-medium">
                  {formatAddress(account.address, 6)}
                </p>
                <p className="text-xs text-muted-foreground">TON</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(account.address)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                window.open(
                  `https://tonscan.org/address/${account.address}`,
                  "_blank"
                )
              }
              className="flex-1"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Просмотр
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDisconnect}
              className="flex-1"
            >
              Отключить
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Подключить TON Кошелек
        </CardTitle>
        <CardDescription>
          Подключите ваш TON кошелек для доступа к платформе
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4">
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full"
          >
            {isConnecting ? (
              "Подключение..."
            ) : (
              <>
                <Wallet className="h-4 w-4 mr-2" />
                Подключить TON Кошелек
              </>
            )}
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            <p>✓ native интеграция с Telegram</p>
            <p>✓ Безопасные транзакции</p>
            <p>✓ Поддержка NFT и токенов</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Функция для форматирования адреса
const formatAddress = (address: string, length: number = 4): string => {
  if (!address) return "";
  return `${address.slice(0, length)}...${address.slice(-length)}`;
};
