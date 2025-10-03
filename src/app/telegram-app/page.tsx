'use client';

import SolanaPayButton from '@/components/payment/solana-pay-button';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

declare global {
  interface Window {
    Telegram: {
      WebApp: any;
    };
  }
}

export default function TelegramAppPage() {
  const [user, setUser] = useState<any>(null);
  const [tgReady, setTgReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Initialize Telegram WebApp
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      
      // Enable closing confirmation
      tg.ready();
      tg.expand();
      
      // Set header color
      tg.setHeaderColor('#673ab7');
      tg.setBackgroundColor('#f5f5f5');
      
      // Get user info
      const userData = tg.initDataUnsafe?.user;
      if (userData) {
        setUser(userData);
      }
      
      setTgReady(true);
    } else {
      console.error('Telegram WebApp not available');
    }
  }, []);

  const handleHapticFeedback = () => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
  };

  const handleOpenDEX = () => {
    handleHapticFeedback();
    router.push('/music-dex');
  };

  const handleOpenAnalytics = () => {
    handleHapticFeedback();
    router.push('/analytics');
  };

  const handleStarsPurchase = () => {
    handleHapticFeedback();
    // In a real implementation, this would trigger the Stars purchase flow
    // For now, we'll just show an alert
    alert('Stars purchase initiated! (This is a demo)');
  };

  return (
    <div className="telegram-app-container">
      <div className="telegram-app-header">
        <h1>Welcome to NormalDance</h1>
        {user && (
          <p>Hello, {user.first_name} {user.last_name || ''}!</p>
        )}
      </div>

      <div className="telegram-app-content">
        <div className="telegram-app-buttons">
          <button 
            className="telegram-button"
            onClick={handleOpenDEX}
          >
            Open DEX
          </button>
          
          <button 
            className="telegram-button"
            onClick={handleOpenAnalytics}
          >
            View Analytics
          </button>
          
          <button 
            className="telegram-button stars-button"
            onClick={handleStarsPurchase}
          >
            Purchase with Stars
          </button>
        </div>

        <div className="solana-pay-section">
          <h2>Alternative Payment</h2>
          <p>If Stars aren't available in your region, you can pay with Solana:</p>
          <SolanaPayButton 
            amount={0.1} 
            message="Demo payment via Solana Pay" 
            onSuccess={() => alert('Payment successful!')}
            onError={(error) => console.error('Payment error:', error)}
          />
        </div>
      </div>
    </div>
  );
}