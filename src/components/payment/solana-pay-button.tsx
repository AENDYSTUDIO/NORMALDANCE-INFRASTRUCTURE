import { SolanaPayConfig, SolanaPayService } from "@/lib/solana-pay";
import React, { useEffect, useState } from "react";

interface SolanaPayButtonProps {
  amount: number;
  recipient?: string;
  label?: string;
  message?: string;
  memo?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

const SolanaPayButton: React.FC<SolanaPayButtonProps> = ({
  amount,
  recipient,
  label = "Payment",
  message = `Payment of ${amount} SOL`,
  memo,
  onSuccess,
  onError,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [isWaitingForPayment, setIsWaitingForPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    "pending" | "confirmed" | "failed"
  >("pending");
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null
  );
  const [useMainButton, setUseMainButton] = useState(false);

  // Check if we're in Telegram Mini App
  const isTMA = typeof window !== "undefined" && window.Telegram?.WebApp;

  // Get platform wallet from environment
  const platformWallet = process.env.NEXT_PUBLIC_PLATFORM_WALLET || recipient;

  // Initialize Solana Pay service
  const solanaPayService = new SolanaPayService(
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
      "https://api.mainnet-beta.solana.com",
    platformWallet || ""
  );

  // Generate payment URL and QR code
  useEffect(() => {
    if (platformWallet && amount > 0) {
      try {
        const config: SolanaPayConfig = {
          recipient: platformWallet,
          amount,
          label,
          message,
          memo,
        };

        const paymentRequest = solanaPayService.createPaymentRequest(config);
        setPaymentUrl(paymentRequest.url);
        setQrData(paymentRequest.qr);
      } catch (error) {
        console.error("Error generating payment request:", error);
        if (onError) onError(error as Error);
      }
    }
  }, [amount, platformWallet, label, message, memo]);

  // Setup Telegram MainButton when in TMA
  useEffect(() => {
    if (isTMA && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;

      // Expand the app to full screen
      tg.expand();

      // Set theme based on Telegram theme
      const isDark = tg.colorScheme === "dark";
      document.documentElement.setAttribute(
        "data-theme",
        isDark ? "dark" : "light"
      );

      // Handle back button
      tg.BackButton.onClick(() => {
        if (showQR || isWaitingForPayment) {
          handleCancel();
        } else {
          // Close the app if on main screen
          tg.close();
        }
      });

      // Handle main button visibility
      if (useMainButton) {
        tg.MainButton.setText(`Pay ${amount} SOL`);
        tg.MainButton.show();
        tg.MainButton.onClick(handlePayment);
      } else {
        tg.MainButton.hide();
      }

      // Cleanup
      return () => {
        tg.MainButton.offClick(handlePayment);
        tg.BackButton.offClick(() => {});
      };
    }
  }, [isTMA, showQR, isWaitingForPayment, useMainButton, amount]);

  // Start polling for payment confirmation
  const startPolling = (signature: string) => {
    if (pollingInterval) clearInterval(pollingInterval);

    const interval = setInterval(async () => {
      try {
        // In a real implementation, we would check the transaction status
        // For now, we'll simulate the confirmation after a few seconds
        console.log("Polling for transaction status:", signature);

        // This is where you would call the backend to check transaction status
        // const status = await checkTransactionStatus(signature);
        // if (status === 'confirmed') {
        //   clearInterval(interval);
        //   setPaymentStatus('confirmed');
        //   setIsWaitingForPayment(false);
        //   if (onSuccess) onSuccess();
        // }
      } catch (error) {
        console.error("Error polling transaction status:", error);
        clearInterval(interval);
        setPaymentStatus("failed");
        setIsWaitingForPayment(false);
        if (onError) onError(error as Error);
      }
    }, 2000); // Poll every 2 seconds

    setPollingInterval(interval);
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const handlePayment = async () => {
    if (!platformWallet) {
      onError?.(new Error("Platform wallet not configured"));
      return;
    }

    setIsProcessing(true);

    try {
      if (isTMA) {
        // In TMA, show the QR code inline and start waiting for payment
        setShowQR(true);
        setIsWaitingForPayment(true);
        setPaymentStatus("pending");
        setUseMainButton(false); // Switch to QR screen mode

        // In a real implementation, we would start polling for payment confirmation
        // after the user scans the QR code and completes the payment
      } else {
        // In web browser, open the payment URL in a new window
        if (paymentUrl) {
          window.open(paymentUrl, "_blank");
          setShowQR(true);
          setIsWaitingForPayment(true);
          setPaymentStatus("pending");
        }
      }
    } catch (error) {
      console.error("Payment error:", error);
      if (onError) onError(error as Error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentConfirmed = () => {
    // In a real implementation, this would be called after verifying the transaction
    setIsWaitingForPayment(false);
    setPaymentStatus("confirmed");
    setUseMainButton(true); // Return to main button mode
    if (onSuccess) onSuccess();
  };

  const handleCheckPayment = () => {
    // In a real implementation, this would poll the backend to check if payment was made
    // For now, we'll just simulate a confirmation
    handlePaymentConfirmed();
  };

  const handleCancel = () => {
    setIsWaitingForPayment(false);
    setShowQR(false);
    setUseMainButton(true); // Return to main button mode
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }

    // Hide back button when returning to main screen
    if (isTMA && window.Telegram?.WebApp) {
      window.Telegram.WebApp.BackButton.hide();
    }
  };

  // Show back button when showing QR or waiting for payment
  useEffect(() => {
    if (isTMA && window.Telegram?.WebApp) {
      if (showQR || isWaitingForPayment) {
        window.Telegram.WebApp.BackButton.show();
      } else {
        window.Telegram.WebApp.BackButton.hide();
      }
    }
  }, [isTMA, showQR, isWaitingForPayment]);

  return (
    <div className="solana-pay-container">
      {/* Main payment button - only shown when not in QR/payment waiting mode */}
      {!showQR && !isWaitingForPayment && (
        <button
          onClick={handlePayment}
          disabled={isProcessing}
          className={`solana-pay-button ${isProcessing ? "processing" : ""}`}
        >
          {isProcessing ? "Processing..." : `Pay ${amount} SOL`}
        </button>
      )}

      {/* QR Code Modal */}
      {(showQR || isWaitingForPayment) && qrData && (
        <div className="solana-pay-qr-modal">
          <div className="solana-pay-qr-content">
            <h3>
              {isWaitingForPayment ? "Waiting for Payment" : "Scan to Pay"}
            </h3>

            {isWaitingForPayment ? (
              <p className="solana-pay-status">
                {paymentStatus === "pending" &&
                  "Please complete the payment in your wallet..."}
                {paymentStatus === "confirmed" && "Payment confirmed!"}
                {paymentStatus === "failed" &&
                  "Payment failed. Please try again."}
              </p>
            ) : (
              <p>
                Scan this QR code with your Solana wallet to complete the
                payment
              </p>
            )}

            <div className="qr-container">
              <img
                src={qrData}
                alt="Solana Pay QR Code"
                className="solana-pay-qr"
              />
            </div>

            <p className="solana-pay-amount">Amount: {amount} SOL</p>

            {isWaitingForPayment ? (
              <>
                {paymentStatus === "pending" && (
                  <>
                    <button
                      className="solana-pay-check-button"
                      onClick={handleCheckPayment}
                    >
                      Check Payment
                    </button>

                    <button
                      className="solana-pay-cancel-button"
                      onClick={handleCancel}
                    >
                      Cancel
                    </button>
                  </>
                )}

                {paymentStatus === "confirmed" && (
                  <button
                    className="solana-pay-done-button"
                    onClick={handleCancel}
                  >
                    Done
                  </button>
                )}

                {paymentStatus === "failed" && (
                  <button
                    className="solana-pay-try-again-button"
                    onClick={handleCancel}
                  >
                    Try Again
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  className="solana-pay-confirm-button"
                  onClick={handlePaymentConfirmed}
                >
                  I've Paid
                </button>

                <button
                  className="solana-pay-cancel-button"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        /* Global styles for Solana Pay Button in Telegram Mini App */
        :root {
          --solana-purple: #9945ff;
          --solana-purple-dark: #7a34cc;
          --solana-bg-light: #ffffff;
          --solana-bg-dark: #1c1c1c;
          --solana-text-light: #333333;
          --solana-text-dark: #ffffff;
          --solana-text-gray: #666666;
          --solana-border-light: rgba(0, 0, 0, 0.1);
          --solana-border-dark: rgba(255, 255, 255, 0.1);
        }

        html[data-theme="dark"] {
          --solana-bg: var(--solana-bg-dark);
          --solana-text: var(--solana-text-dark);
          --solana-border: var(--solana-border-dark);
        }

        html[data-theme="light"] {
          --solana-bg: var(--solana-bg-light);
          --solana-text: var(--solana-text-light);
          --solana-border: var(--solana-border-light);
        }

        .solana-pay-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }

        .solana-pay-button {
          background-color: var(--solana-purple);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          transition: background-color 0.3s;
          width: 100%;
          max-width: 300px;
          font-weight: 500;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .solana-pay-button:hover:not(:disabled) {
          background-color: var(--solana-purple-dark);
        }

        .solana-pay-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .solana-pay-qr-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .solana-pay-qr-content {
          background: var(--solana-bg);
          padding: 24px;
          border-radius: 16px;
          text-align: center;
          max-width: 90%;
          width: 320px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          border: 1px solid var(--solana-border);
          color: var(--solana-text);
        }

        .solana-pay-qr-content h3 {
          margin-top: 0;
          margin-bottom: 16px;
          font-size: 20px;
          font-weight: 600;
          color: var(--solana-text);
        }

        .qr-container {
          margin: 24px auto;
          display: flex;
          justify-content: center;
          background: white;
          padding: 16px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .solana-pay-qr {
          max-width: 200px;
          max-height: 200px;
          width: 100%;
          height: auto;
          image-rendering: -webkit-optimize-contrast;
        }

        .solana-pay-amount {
          font-weight: 600;
          margin: 16px 0;
          font-size: 18px;
          color: var(--solana-text);
        }

        .solana-pay-status {
          margin: 16px 0;
          color: var(--solana-text-gray);
          font-size: 16px;
          line-height: 1.5;
        }

        /* Button styles for different actions */
        .solana-pay-confirm-button,
        .solana-pay-check-button,
        .solana-pay-done-button,
        .solana-pay-try-again-button,
        .solana-pay-cancel-button {
          background-color: var(--solana-purple);
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 8px;
          margin: 8px 0;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          width: 100%;
          transition: background-color 0.2s, transform 0.1s;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .solana-pay-confirm-button:hover,
        .solana-pay-check-button:hover,
        .solana-pay-done-button:hover,
        .solana-pay-try-again-button:hover {
          background-color: var(--solana-purple-dark);
        }

        .solana-pay-confirm-button:active,
        .solana-pay-check-button:active,
        .solana-pay-done-button:active,
        .solana-pay-try-again-button:active {
          transform: translateY(1px);
        }

        .solana-pay-cancel-button {
          background-color: #f0f0f0;
          color: #333333;
        }

        .solana-pay-cancel-button:hover {
          background-color: #e0e0e0;
        }

        /* Dark theme adjustments */
        html[data-theme="dark"] .solana-pay-cancel-button {
          background-color: #333333;
          color: #ffffff;
        }

        html[data-theme="dark"] .solana-pay-cancel-button:hover {
          background-color: #444444;
        }

        html[data-theme="dark"] .solana-pay-amount {
          color: #ffffff;
        }

        html[data-theme="dark"] .solana-pay-status {
          color: #cccccc;
        }

        /* Responsive adjustments for small screens */
        @media (max-width: 480px) {
          .solana-pay-qr-content {
            padding: 20px;
            width: 95%;
          }

          .solana-pay-qr-content h3 {
            font-size: 18px;
          }

          .solana-pay-amount {
            font-size: 16px;
          }

          .solana-pay-status {
            font-size: 14px;
          }

          .solana-pay-confirm-button,
          .solana-pay-check-button,
          .solana-pay-done-button,
          .solana-pay-try-again-button,
          .solana-pay-cancel-button {
            font-size: 14px;
            padding: 10px 16px;
          }
        }

        /* Animation for processing state */
        @keyframes pulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            opacity: 1;
          }
        }

        .solana-pay-button.processing {
          animation: pulse 1.5s infinite;
        }

        /* Focus states for accessibility */
        .solana-pay-button:focus,
        .solana-pay-confirm-button:focus,
        .solana-pay-check-button:focus,
        .solana-pay-done-button:focus,
        .solana-pay-try-again-button:focus,
        .solana-pay-cancel-button:focus {
          outline: 2px solid var(--solana-purple);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
};

export default SolanaPayButton;
