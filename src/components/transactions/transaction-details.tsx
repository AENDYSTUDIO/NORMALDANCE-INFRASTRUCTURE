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
import { useToast } from "@/hooks/use-toast";
import { Copy, ExternalLink, ShoppingCart, Wallet } from "lucide-react";

interface TransactionDetailsProps {
  readonly transaction: {
    readonly id: string;
    readonly type: "purchase" | "sale" | "transfer" | "refund";
    readonly amount: number;
    readonly currency: "TON" | "XTR" | "USD";
    readonly timestamp: string;
    readonly status: "completed" | "pending" | "failed" | "cancelled";
    readonly description: string;
    readonly to?: string;
    readonly from?: string;
    readonly transactionHash?: string;
    readonly blockchainExplorerUrl?: string;
    readonly fee?: number;
    readonly feeCurrency?: string;
    readonly nftId?: string;
    readonly nftName?: string;
    readonly nftImageUrl?: string;
  };
  readonly className?: string;
  readonly onRetry?: () => void;
  readonly onCancel?: () => void;
}

export function TransactionDetails({
  transaction,
  className,
  onRetry,
  onCancel,
}: TransactionDetailsProps) {
  const { toast } = useToast();

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

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case "purchase":
        return "Покупка";
      case "sale":
        return "Продажа";
      case "transfer":
        return "Перевод";
      case "refund":
        return "Возврат";
      default:
        return "Транзакция";
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "pending":
        return "secondary";
      case "failed":
        return "destructive";
      case "cancelled":
        return "outline";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case "completed":
        return "Завершено";
      case "pending":
        return "В обработке";
      case "failed":
        return "Ошибка";
      case "cancelled":
        return "Отменено";
      default:
        return "Неизвестно";
    }
  };

  const formatCurrency = (amount: number, currency: string): string => {
    if (currency === "XTR") {
      return `${amount} Stars`;
    }
    return `${amount} ${currency}`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "purchase":
        return <ShoppingCart className="h-5 w-5" />;
      case "sale":
        return <Wallet className="h-5 w-5" />;
      case "transfer":
        return <ExternalLink className="h-5 w-5" />;
      case "refund":
        return <ExternalLink className="h-5 w-5 rotate-180" />;
      default:
        return <Wallet className="h-5 w-5" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white">
            {getTypeIcon(transaction.type)}
          </div>
          {getTypeLabel(transaction.type)}
        </CardTitle>
        <CardDescription>
          Детали транзакции от {formatDate(transaction.timestamp)}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Transaction Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Статус</span>
          <Badge
            variant={getStatusVariant(transaction.status)}
            className="text-sm"
          >
            {getStatusLabel(transaction.status)}
          </Badge>
        </div>

        <Separator />

        {/* Transaction Details */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Сумма</span>
            <div className="text-right">
              <p className="font-semibold">
                {formatCurrency(transaction.amount, transaction.currency)}
              </p>
              {transaction.fee && transaction.feeCurrency && (
                <p className="text-xs text-muted-foreground">
                  Комиссия:{" "}
                  {formatCurrency(transaction.fee, transaction.feeCurrency)}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Описание</span>
            <p className="text-sm text-right max-w-[60%] line-clamp-2">
              {transaction.description}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Дата</span>
            <span className="text-sm">{formatDate(transaction.timestamp)}</span>
          </div>

          {transaction.from && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">От</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono">
                  {transaction.from.slice(0, 6)}...{transaction.from.slice(-4)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(transaction.from || "")}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {transaction.to && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Кому</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono">
                  {transaction.to.slice(0, 6)}...{transaction.to.slice(-4)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(transaction.to || "")}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {transaction.nftId && transaction.nftName && (
          <>
            <Separator />

            {/* NFT Details */}
            <div>
              <h3 className="text-sm font-semibold mb-2">NFT</h3>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                {transaction.nftImageUrl && (
                  <div className="h-12 w-12 rounded-md bg-muted overflow-hidden">
                    <img
                      src={transaction.nftImageUrl}
                      alt={transaction.nftName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">{transaction.nftName}</p>
                  <p className="text-xs text-muted-foreground">
                    ID: {transaction.nftId}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {transaction.transactionHash && (
          <>
            <Separator />

            {/* Transaction Hash */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Хэш транзакции</h3>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm font-mono">
                  {transaction.transactionHash.slice(0, 8)}...
                  {transaction.transactionHash.slice(-8)}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(transaction.transactionHash || "")
                    }
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  {transaction.blockchainExplorerUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        window.open(transaction.blockchainExplorerUrl, "_blank")
                      }
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        {transaction.status === "failed" && onRetry && (
          <Button className="flex-1" onClick={onRetry}>
            Повторить
          </Button>
        )}

        {transaction.status === "pending" && onCancel && (
          <Button variant="destructive" className="flex-1" onClick={onCancel}>
            Отменить
          </Button>
        )}

        <Button
          variant="outline"
          className="flex-1"
          onClick={() => window.print()}
        >
          Печать
        </Button>
      </CardFooter>
    </Card>
  );
}
