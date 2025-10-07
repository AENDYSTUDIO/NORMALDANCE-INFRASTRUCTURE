"use client";

import { useTelegram } from "@/contexts/telegram-context";
import { useEffect, useState } from "react";

interface StarsPaymentResult {
  status: "pending" | "completed" | "cancelled" | "failed";
  transactionId?: string;
  error?: string;
}

export function useTelegramStars() {
  const { isTMA, tgWebApp, showConfirm, showAlert, showToast } = useTelegram();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<StarsPaymentResult>({
    status: "pending",
  });

  // Check if we're in Telegram Mini App
  useEffect(() => {
    if (!isTMA) {
      console.warn(
        "useTelegramStars should only be used in Telegram Mini Apps"
      );
    }
  }, [isTMA]);

  const initiatePayment = async (
    amount: number,
    description: string,
    payload?: string
  ): Promise<StarsPaymentResult> => {
    if (!isTMA || !tgWebApp) {
      const errorResult: StarsPaymentResult = {
        status: "failed",
        error: "Not in Telegram Mini App",
      };
      setPaymentResult(errorResult);
      return errorResult;
    }

    setIsProcessing(true);
    setPaymentResult({ status: "pending" });

    try {
      // In a real implementation, you would:
      // 1. Call your backend to create a payment request
      // 2. Get an invoice link from Telegram Bot API
      // 3. Open the invoice in Telegram

      // For demonstration, we'll simulate the process
      console.log("Initiating Telegram Stars payment:", {
        amount,
        description,
        payload,
      });

      // Show processing state in MainButton if available
      if (tgWebApp.MainButton) {
        tgWebApp.MainButton.setText("Processing...");
        tgWebApp.MainButton.show();
      }

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // For demo purposes, we'll show a success message
      showAlert(
        `Successfully processed payment of ${amount} Stars for ${description}!`
      );

      const successResult: StarsPaymentResult = {
        status: "completed",
        transactionId: `stars_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
      };

      setPaymentResult(successResult);
      return successResult;
    } catch (error) {
      console.error("Stars payment error:", error);
      const errorResult: StarsPaymentResult = {
        status: "failed",
        error: error instanceof Error ? error.message : "Payment failed",
      };
      setPaymentResult(errorResult);
      return errorResult;
    } finally {
      setIsProcessing(false);

      // Reset MainButton if available
      if (tgWebApp.MainButton) {
        tgWebApp.MainButton.setText("Buy with Stars");
        tgWebApp.MainButton.hide();
      }
    }
  };

  const validatePayment = async (transactionId: string): Promise<boolean> => {
    try {
      // In a real implementation, you would:
      // 1. Call your backend to verify the transaction
      // 2. Check the transaction status with Telegram Bot API
      // 3. Update your database with the payment status

      // For demonstration, we'll simulate validation
      console.log("Validating Telegram Stars payment:", transactionId);

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // For demo purposes, we'll assume all payments are valid
      return true;
    } catch (error) {
      console.error("Payment validation error:", error);
      return false;
    }
  };

  const refundPayment = async (transactionId: string): Promise<boolean> => {
    try {
      // In a real implementation, you would:
      // 1. Call your backend to initiate a refund
      // 2. Process the refund through Telegram Bot API

      // For demonstration, we'll simulate refund processing
      console.log(
        "Processing refund for Telegram Stars payment:",
        transactionId
      );

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // For demo purposes, we'll assume refund is successful
      showToast("Refund processed successfully", "default");
      return true;
    } catch (error) {
      console.error("Refund processing error:", error);
      showToast("Failed to process refund", "destructive");
      return false;
    }
  };

  const getExchangeRate = async (): Promise<number> => {
    try {
      // In a real implementation, you would:
      // 1. Call your backend or an exchange rate API
      // 2. Get the current exchange rate for Stars to USD

      // For demonstration, we'll return a fixed rate
      // 1 Star = 0.01 USD
      return 0.01;
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
      // Return default rate
      return 0.01;
    }
  };

  const convertToStars = async (
    amount: number,
    currency: string = "USD"
  ): Promise<number> => {
    try {
      // Get exchange rate
      const rate = await getExchangeRate();

      // Convert to Stars
      // For USD: amount / 0.01 = amount * 100
      const stars = currency === "USD" ? amount / rate : amount;

      return Math.round(stars);
    } catch (error) {
      console.error("Error converting to Stars:", error);
      return 0;
    }
  };

  return {
    isProcessing,
    paymentResult,
    initiatePayment,
    validatePayment,
    refundPayment,
    getExchangeRate,
    convertToStars,
  };
}
