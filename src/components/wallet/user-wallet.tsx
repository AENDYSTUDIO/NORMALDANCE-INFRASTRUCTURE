"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Copy, ExternalLink, QrCode, Send, Star, Wallet } from "lucide-react";
import React, { useState } from "react";
import { formatAddress, formatSol } from "./wallet-adapter";
import { useWalletContext } from "./wallet-provider";

export function UserWallet() {
  const {
    connected,
    publicKey,
    balance,
    connect,
    disconnect,
    isConnecting,
    error,
  } = useWalletContext();
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleViewOnExplorer = () => {
    if (publicKey) {
      window.open(
        `https://explorer.solana.com/address/${publicKey.toBase58()}`,
        "_blank"
      );
    }
  };

  if (!connected) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Подключить кошелек
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button
              onClick={connect}
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? "Подключение..." : "Подключить Phantom"}
            </Button>
            {error && <div className="text-red-50 text-sm">{error}</div>}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Мой кошелек
          </div>
          <Badge variant="secondary">Phantom</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <div className="text-sm text-muted-foreground">Баланс</div>
              <div className="text-2xl font-bold">
                {balance !== null ? formatSol(balance) : "Загрузка..."} SOL
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-600" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Адрес кошелька</div>
            <Button variant="ghost" size="sm" onClick={handleViewOnExplorer}>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <div className="text-sm font-mono truncate">
              {publicKey ? formatAddress(publicKey) : ""}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyAddress}
              className="shrink-0"
            >
              {copied ? (
                <CheckIcon className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              Получить
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Отправить
            </Button>
          </div>

          <div className="pt-4">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={disconnect}
            >
              Отключить кошелек
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Иконка галочки для отображения при копировании
function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
