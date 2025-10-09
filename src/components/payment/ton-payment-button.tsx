"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Address, toNano } from "@ton/ton";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface TonPaymentButtonProps {
  amount: number;
  recipient: string;
  description: string;
  onPaymentSuccess?: () => void;
  onPaymentError?: (error: Error) => void;
  className?: string;
}

export function TonPaymentButton({
  amount,
  recipient,
  description,
  onPaymentSuccess,
  onPaymentError,
  className,
}: TonPaymentButtonProps) {
  const [tonConnectUI] = useTonConnectUI();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    if (!tonConnectUI.connected) {
      onPaymentError?.(new Error("TON wallet not connected"));
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const address = Address.parse(recipient);
      const amountNano = toNano(amount);

      // Отправка транзакции
      const result = await tonConnectUI.sendTransaction({
        messages: [
          {
            address: recipient,
            amount: amountNano.toString(),
            payload: description
              ? Buffer.from(description).toString("base64")
              : undefined,
          },
        ],
        validUntil: Date.now() + 5 * 60 * 1000, // 5 минут
      });

      if (result) {
        onPaymentSuccess?.();
      }
    } catch (err) {
      console.error("TON payment error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Payment failed";
      setError(errorMessage);
      onPaymentError?.(
        err instanceof Error ? err : new Error("Payment failed")
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Оплата через TON</CardTitle>
        <CardDescription>
          Оплатите {amount} TON получателю {recipient}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 rounded-md text-destructive text-sm">
            {error}
          </div>
        )}
        <Button
          onClick={handlePayment}
          disabled={isProcessing || !tonConnectUI.connected}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Обработка...
            </>
          ) : (
            `Заплатить ${amount} TON`
          )}
        </Button>
        {!tonConnectUI.connected && (
          <p className="text-xs text-muted-foreground mt-2">
            Подключите TON кошелек для оплаты
          </p>
        )}
      </CardContent>
    </Card>
  );
}
