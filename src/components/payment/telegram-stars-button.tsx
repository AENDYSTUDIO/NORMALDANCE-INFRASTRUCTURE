"use client";

import React, { useEffect, useState } from "react";

interface TelegramStarsButtonProps {
  amount: number;
  itemId: string;
  itemName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  onError?: (error: Error) => void;
}

const TelegramStarsButton: React.FC<TelegramStarsButtonProps> = ({
  amount,
  itemId,
  itemName,
  onSuccess,
  onCancel,
  onError,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTMA, setIsTMA] = useState(false);
  const [tgWebApp, setTgWebApp] = useState<any>(null);

  // Check if we're in Telegram Mini App
  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      setIsTMA(true);
      setTgWebApp(window.Telegram.WebApp);

      // Initialize Telegram WebApp
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
    }
  }, []);

  const handlePurchase = async () => {
    if (!isTMA || !tgWebApp) {
      onError?.(new Error("Telegram WebApp not available"));
      return;
    }

    setIsProcessing(true);

    try {
      // In a real implementation, this would trigger the Telegram Stars purchase flow
      // For now, we'll simulate the process

      // Show processing state
      if (tgWebApp.MainButton) {
        tgWebApp.MainButton.setText("Processing...");
        tgWebApp.MainButton.show();
      }

      // Simulate API call to initiate purchase
      console.log("Initiating Telegram Stars purchase:", {
        amount,
        itemId,
        itemName,
      });

      // In a real implementation, you would:
      // 1. Call your backend to create a purchase order
      // 2. Redirect user to Telegram's payment interface
      // 3. Handle the callback from Telegram

      // Simulate async operation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // For demo purposes, we'll show a success message
      alert(`Successfully purchased ${itemName} for ${amount} Stars!`);

      // Call success callback
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Stars purchase error:", error);
      onError?.(error as Error);
    } finally {
      setIsProcessing(false);

      // Reset button state
      if (tgWebApp.MainButton) {
        tgWebApp.MainButton.setText("Buy with Stars");
      }
    }
  };

  // Setup Telegram MainButton when in TMA
  useEffect(() => {
    if (isTMA && tgWebApp) {
      // Configure MainButton
      tgWebApp.MainButton.setText(`Buy ${itemName} for ${amount} Stars`);
      tgWebApp.MainButton.show();
      tgWebApp.MainButton.onClick(handlePurchase);

      // Cleanup
      return () => {
        tgWebApp.MainButton.offClick(handlePurchase);
        tgWebApp.MainButton.hide();
      };
    }
  }, [isTMA, tgWebApp, amount, itemName]);

  return (
    <div className="telegram-stars-container">
      {isTMA ? (
        <button
          onClick={handlePurchase}
          disabled={isProcessing}
          className={`telegram-stars-button ${
            isProcessing ? "processing" : ""
          }`}
        >
          {isProcessing
            ? "Processing..."
            : `Buy ${itemName} for ${amount} Stars`}
        </button>
      ) : (
        <div className="telegram-stars-unavailable">
          <p>
            Telegram Stars payments are only available within Telegram Mini Apps
          </p>
        </div>
      )}

      <style jsx global>{`
        /* Global styles for Telegram Stars Button */
        .telegram-stars-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }

        .telegram-stars-button {
          background-color: #ffcc00; /* Telegram Stars yellow */
          color: #333333;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          transition: background-color 0.3s, transform 0.1s;
          width: 100%;
          max-width: 300px;
          font-weight: 500;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .telegram-stars-button:hover:not(:disabled) {
          background-color: #e6b800; /* Darker yellow on hover */
        }

        .telegram-stars-button:active:not(:disabled) {
          transform: translateY(1px);
        }

        .telegram-stars-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .telegram-stars-unavailable {
          background-color: #f5f5f5;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 16px;
          text-align: center;
          color: #666666;
          width: 100%;
          max-width: 300px;
        }

        /* Dark theme support */
        html[data-theme="dark"] .telegram-stars-unavailable {
          background-color: #1c1c1c;
          border: 1px solid #333333;
          color: #cccccc;
        }

        /* Animation for processing state */
        @keyframes pulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
          100% {
            opacity: 1;
          }
        }

        .telegram-stars-button.processing {
          animation: pulse 1.5s infinite;
        }

        /* Focus states for accessibility */
        .telegram-stars-button:focus {
          outline: 2px solid #ffcc00;
          outline-offset: 2px;
        }

        /* Responsive adjustments */
        @media (max-width: 480px) {
          .telegram-stars-button {
            padding: 10px 20px;
            font-size: 14px;
          }

          .telegram-stars-unavailable {
            padding: 12px;
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
};

export default TelegramStarsButton;
