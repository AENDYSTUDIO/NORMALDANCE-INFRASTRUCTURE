"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Copy, ExternalLink, ShoppingCart, Wallet } from "lucide-react";
import { useState } from "react";

interface PaymentHistoryItem {
  id: string;
  type: "purchase" | "sale" | "transfer" | "refund";
  amount: number;
  currency: "TON" | "XTR" | "USD";
  timestamp: string;
  status: "completed" | "pending" | "failed" | "cancelled";
  description: string;
  to?: string;
  from?: string;
  transactionHash?: string;
}

interface PaymentHistoryProps {
  payments: PaymentHistoryItem[];
  className?: string;
  onViewTransaction?: (transactionId: string) => void;
  onExport?: () => void;
}

export function PaymentHistory({
  payments,
  className,
  onViewTransaction,
  onExport,
}: PaymentHistoryProps) {
  const { toast } = useToast();
  const [filter, setFilter] = useState<"all" | "incoming" | "outgoing">("all");

  const filteredPayments = payments.filter((payment) => {
    if (filter === "all") return true;
    if (filter === "incoming")
      return payment.type === "purchase" || payment.type === "transfer";
    if (filter === "outgoing")
      return payment.type === "sale" || payment.type === "transfer";
    return true;
  });

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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "purchase":
        return <ShoppingCart className="h-4 w-4" />;
      case "sale":
        return <Wallet className="h-4 w-4" />;
      case "transfer":
        return <ExternalLink className="h-4 w-4" />;
      case "refund":
        return <ExternalLink className="h-4 w-4 rotate-180" />;
      default:
        return <Wallet className="h-4 w-4" />;
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

  const formatCurrency = (amount: number, currency: string): string => {
    if (currency === "XTR") {
      return `${amount} Stars`;
    }
    return `${amount} ${currency}`;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              История платежей
            </CardTitle>
            <CardDescription>Все транзакции за последнее время</CardDescription>
          </div>

          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              Экспорт
            </Button>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            Все
          </Button>
          <Button
            variant={filter === "incoming" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("incoming")}
          >
            Входящие
          </Button>
          <Button
            variant={filter === "outgoing" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("outgoing")}
          >
            Исходящие
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {filteredPayments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Нет транзакций для отображения</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPayments.map((payment) => (
              <div
                key={payment.id}
                className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white">
                      {getTypeIcon(payment.type)}
                    </div>

                    <div>
                      <p className="text-sm font-medium line-clamp-1">
                        {payment.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatDate(payment.timestamp)}</span>
                        <Separator orientation="vertical" className="h-3" />
                        <span>
                          {formatCurrency(payment.amount, payment.currency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={getStatusVariant(payment.status)}
                      className="text-xs"
                    >
                      {payment.status === "completed" && "Завершено"}
                      {payment.status === "pending" && "В обработке"}
                      {payment.status === "failed" && "Ошибка"}
                      {payment.status === "cancelled" && "Отменено"}
                    </Badge>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewTransaction?.(payment.id)}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {payment.transactionHash && (
                  <div className="flex items-center justify-between pt-2 mt-2 border-t">
                    <span className="text-xs text-muted-foreground">
                      Tx Hash: {payment.transactionHash.slice(0, 8)}...
                      {payment.transactionHash.slice(-8)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(payment.transactionHash || "")
                      }
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
