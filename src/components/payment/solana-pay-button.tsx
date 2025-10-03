import { SolanaPayConfig, SolanaPayService } from '@/lib/solana-pay';
import React, { useEffect, useState } from 'react';

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
  label = 'Payment',
  message = `Payment of ${amount} SOL`,
  memo,
  onSuccess,
  onError
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  
  // Get platform wallet from environment
  const platformWallet = process.env.NEXT_PUBLIC_PLATFORM_WALLET || recipient;
  
  // Initialize Solana Pay service
  const solanaPayService = new SolanaPayService(
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
    platformWallet || ''
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
          memo
        };
        
        const paymentRequest = solanaPayService.createPaymentRequest(config);
        setPaymentUrl(paymentRequest.url);
        setQrData(paymentRequest.qr);
      } catch (error) {
        console.error('Error generating payment request:', error);
        if (onError) onError(error as Error);
      }
    }
  }, [amount, platformWallet, label, message, memo]);

  const handlePayment = async () => {
    if (!platformWallet) {
      onError?.(new Error('Platform wallet not configured'));
      return;
    }

    setIsProcessing(true);
    setShowQR(true);

    try {
      // In a real implementation, we would wait for the payment to be confirmed
      // For now, we'll just show the QR code and let the user know they can pay
    } catch (error) {
      console.error('Payment error:', error);
      if (onError) onError(error as Error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentConfirmed = () => {
    setShowQR(false);
    if (onSuccess) onSuccess();
  };

  const handleQRClick = () => {
    if (paymentUrl) {
      // Open the payment URL in a new window/tab
      window.open(paymentUrl, '_blank');
    }
  };

  return (
    <div className="solana-pay-container">
      <button
        onClick={handlePayment}
        disabled={isProcessing}
        className={`solana-pay-button ${isProcessing ? 'processing' : ''}`}
      >
        {isProcessing ? 'Processing...' : `Pay ${amount} SOL`}
      </button>

      {showQR && qrData && (
        <div className="solana-pay-qr-modal">
          <div className="solana-pay-qr-content">
            <h3>Scan to Pay</h3>
            <p>Scan this QR code with your Solana wallet to complete the payment</p>
            
            <div className="qr-container" onClick={handleQRClick}>
              <img 
                src={qrData} 
                alt="Solana Pay QR Code" 
                className="solana-pay-qr"
              />
            </div>
            
            <p className="solana-pay-amount">Amount: {amount} SOL</p>
            
            <button 
              className="solana-pay-confirm-button"
              onClick={handlePaymentConfirmed}
            >
              I've Paid
            </button>
            
            <button 
              className="solana-pay-cancel-button"
              onClick={() => setShowQR(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SolanaPayButton;