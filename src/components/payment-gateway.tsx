"use client";

import { TelegramStarsButton } from "@/components/payment/telegram-stars-button";
import { TonPaymentButton } from "@/components/payment/ton-payment-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

interface PaymentGatewayProps {
  amount: number;
  recipient: string;
  description: string;
  onPaymentSuccess?: (paymentMethod: string, result: any) => void;
  onPaymentError?: (paymentMethod: string, error: Error) => void;
  className?: string;
}

export function PaymentGateway({
  amount,
  recipient,
  description,
  onPaymentSuccess,
  onPaymentError,
  className,
}: PaymentGatewayProps) {
  const [activeTab, setActiveTab] = useState("stars");

  const handleStarsSuccess = (result: any) => {
    onPaymentSuccess?.("stars", result);
  };

  const handleStarsError = (error: Error) => {
    onPaymentError?.("stars", error);
  };

  const handleTonSuccess = () => {
    onPaymentSuccess?.("ton", { method: "ton", amount, recipient });
  };

  const handleTonError = (error: Error) => {
    onPaymentError?.("ton", error);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Выберите способ оплаты</CardTitle>
        <CardDescription>
          Оплатите {amount} за {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stars">Telegram Stars</TabsTrigger>
            <TabsTrigger value="ton">TON</TabsTrigger>
          </TabsList>
          <TabsContent value="stars" className="mt-4">
            <TelegramStarsButton
              amount={amount}
              description={description}
              onSuccess={handleStarsSuccess}
              onError={handleStarsError}
            />
          </TabsContent>
          <TabsContent value="ton" className="mt-4">
            <TonPaymentButton
              amount={amount}
              recipient={recipient}
              description={description}
              onPaymentSuccess={handleTonSuccess}
              onPaymentError={handleTonError}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
