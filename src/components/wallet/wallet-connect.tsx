"use client";

import { AlertCircle, CheckCircle, Wallet } from "@/components/icons";

import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { Copy, ExternalLink, Loader2, QrCode } from "lucide-react";
import { useEffect, useState } from "react";
import { formatAddress, useSolanaWallet } from "./wallet-adapter";

interface WalletConnectProps {
  className?: string;
}

export function WalletConnect({ className }: WalletConnectProps) {
  const {
    connected,
    publicKey,
    balance,
    connectWallet,
    disconnectWallet,
    getBalance,
    getTokenBalance,
    formatSol,
  } = useSolanaWallet();

  const [isConnecting, setIsConnecting] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [walletsAvailable, setWalletsAvailable] = useState(false);

  // В реальном приложении здесь нужно получить список доступных кошельков
  // и проверить, доступен ли кошелек для подключения
  useEffect(() => {
    // Проверяем, что мы в TMA
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      setWalletsAvailable(false); // В TMA традиционные кошельки недоступны
    } else {
      // В обычном браузере проверяем доступность кошельков
      setWalletsAvailable(true);
    }
  }, []);

  useEffect(() => {
    if (connected && publicKey) {
      loadBalance();
    }
  }, [connected, publicKey]);

  const loadBalance = async () => {
    setBalanceLoading(true);
    try {
      await getBalance();
      const ndtBalance = await getTokenBalance("NDT_MINT_ADDRESS");
      // Store NDT balance in state if needed
    } catch (err) {
      setError("Failed to load balance");
    } finally {
      setBalanceLoading(false);
    }
  };

  const handleConnect = async (walletName: string) => {
    setIsConnecting(true);
    setError(null);
    try {
      // Для Telegram Mini App используем специальный способ подключения
      if (isTelegramWebView()) {
        await initWalletConnectForTMA();
      } else {
        await connectWallet();
      }
      setShowQR(false);
    } catch (err) {
      setError("Failed to connect wallet");
      console.error("Connection error:", err);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
    } catch (err) {
      console.error("Disconnection error:", err);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Проверяем, запущено ли приложение в Telegram WebView
  const isTelegramWebView = (): boolean => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      return true;
    }
    return false;
  };

  // Инициализация WalletConnect для Telegram Mini App
  const initWalletConnectForTMA = async () => {
    try {
      // В TMA используем WalletConnect Universal или deeplink
      console.log("Initializing WalletConnect for Telegram Mini App");

      // Проверяем, что мы в браузере
      if (typeof window === "undefined") {
        throw new Error(
          "WalletConnect can only be initialized in browser environment"
        );
      }

      // Для TMA используем QR-код или deeplink
      if (showQR) {
        // Показываем QR-код для сканирования пользователем
        console.log("Show QR code for WalletConnect");
        // В реальном приложении здесь будет отображение QR-кода
        // и установка соединения через WalletConnect
      } else {
        // Используем deeplink для открытия мобильного кошелька
        const universalLink = "https://solana-wallet.app";
        const deepLink = `solana://`;

        // Открываем deeplink
        window.open(deepLink, "_blank");

        // Альтернатива: использовать универсальную ссылку
        // window.open(universalLink, '_blank');
      }

      // Пока просто вызываем стандартное подключение
      await connectWallet();
    } catch (err) {
      console.error("WalletConnect initialization error:", err);
      throw new Error(
        "Failed to initialize WalletConnect. Please try again or use another wallet."
      );
    }
  };

  if (connected && publicKey) {
    return (
      <Card className={cn("w-full max-w-md", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Кошелек подключен
          </CardTitle>
          <CardDescription>
            Ваш Solana кошелек успешно подключен
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Wallet address */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>Ξ</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">
                  {formatAddress(publicKey, 6)}
                </p>
                <p className="text-xs text-muted-foreground">Solana</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(publicKey.toBase58())}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          {/* Balance */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">SOL Balance</span>
              {balanceLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span className="text-sm font-medium">
                  {formatSol(balance || 0)}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">NDT Balance</span>
              <span className="text-sm font-medium">0</span>
            </div>
          </div>

          {/* Status badges */}
          <div className="flex gap-2">
            <Badge variant="default" className="text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </Badge>
            <Badge variant="outline" className="text-xs">
              <ExternalLink className="h-3 w-3 mr-1" />
              Mainnet
            </Badge>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQR(!showQR)}
              className="flex-1"
            >
              <QrCode className="h-4 w-4 mr-2" />
              QR Code
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

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-md">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">{error}</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full max-w-md", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Подключить кошелек
        </CardTitle>
        <CardDescription>
          Подключите ваш Web3 кошелек для доступа к платформе
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Wallet options */}
        <div className="space-y-2">
          {/* Показываем кнопку WalletConnect в TMA */}
          {isTelegramWebView() && (
            <Button
              className="w-full justify-start"
              onClick={() => handleConnect("WalletConnect")}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-600 rounded"></div>
                  WalletConnect
                </div>
              )}
            </Button>
          )}
          {/* Показываем Phantom если доступен и не в TMA */}
          {!isTelegramWebView() && walletsAvailable && (
            <Button
              className="w-full justify-start"
              onClick={() => handleConnect("Phantom")}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-purple-60 rounded"></div>
                  Phantom Wallet
                </div>
              )}
            </Button>
          )}
          {/* Если не в TMA и нет доступных кошельков, показываем рекомендацию */}
          {!isTelegramWebView() && !walletsAvailable && (
            <div className="text-sm text-muted-foreground text-center py-2">
              Установите кошелек Phantom для подключения
            </div>
          )}
        </div>

        {/* Features */}
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>✓ Полный контроль над вашими средствами</p>
          <p>✓ Безопасные транзакции</p>
          <p>✓ Поддержка NFT и токенов</p>
          <p>✓ Децентрализованный доступ</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-md">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        )}

        {/* Need help */}
        <div className="text-center text-xs text-muted-foreground">
          <p>Нужна помощь? Посетите нашу документацию</p>
        </div>
      </CardContent>
    </Card>
  );
}
