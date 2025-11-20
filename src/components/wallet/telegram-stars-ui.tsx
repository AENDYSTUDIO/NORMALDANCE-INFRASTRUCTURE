// Компонент пользовательского интерфейса для платежей через Telegram Stars

'use client';

import React, { useState, useEffect, useContext } from 'react';
import { WalletContext } from '@/contexts/wallet-context';
import { StarsPaymentManager } from '@/lib/wallet/stars-payment-manager';
import { TelegramStarsBridge } from '@/lib/wallet/telegram-stars-bridge';
import { logger } from '@/lib/logger';

interface Props {
  onPurchaseSuccess?: (transactionId: string) => void;
  onPurchaseError?: (error: string) => void;
}

interface PurchaseState {
  starsAmount: number;
  ndtAmount: number;
  solAmount: number;
  isCalculating: boolean;
  isProcessing: boolean;
  status: 'idle' | 'calculating' | 'processing' | 'completed' | 'error';
  error?: string;
  transactionId?: string;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: any;
    };
  }
}

const TelegramStarsUI: React.FC<Props> = ({ onPurchaseSuccess, onPurchaseError }) => {
  const { wallet, starsBalance } = useContext(WalletContext);
  const [purchaseState, setPurchaseState] = useState<PurchaseState>({
    starsAmount: 100,
    ndtAmount: 0,
    solAmount: 0,
    isCalculating: false,
    isProcessing: false,
    status: 'idle',
  });
  const [bridge] = useState(() => new TelegramStarsBridge());
  const [paymentManager] = useState(() => new StarsPaymentManager(bridge));

  // Инициализация Telegram WebApp
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const telegramWebApp = window.Telegram.WebApp;
      telegramWebApp.ready();
      
      logger.info('Telegram WebApp initialized');
    } else {
      logger.warn('Telegram WebApp not available');
    }
  }, []);

  // Пересчет эквивалентов при изменении суммы Stars
  useEffect(() => {
    const calculateAmounts = async () => {
      if (purchaseState.starsAmount <= 0) {
        setPurchaseState(prev => ({
          ...prev,
          ndtAmount: 0,
          solAmount: 0,
          isCalculating: false,
        }));
        return;
      }

      setPurchaseState(prev => ({ ...prev, isCalculating: true }));

      try {
        const solAmount = await bridge.calculateSolAmount(purchaseState.starsAmount);
        const ndtAmount = await bridge.calculateNdtAmount(purchaseState.starsAmount);

        setPurchaseState(prev => ({
          ...prev,
          solAmount: parseFloat(solAmount.toFixed(6)),
          ndtAmount: parseFloat(ndtAmount.toFixed(2)),
          isCalculating: false,
        }));
      } catch (error) {
        logger.error('Error calculating amounts', { error });
        setPurchaseState(prev => ({
          ...prev,
          solAmount: 0,
          ndtAmount: 0,
          isCalculating: false,
          error: 'Error calculating amounts',
        }));
      }
    };

    calculateAmounts();
  }, [purchaseState.starsAmount, bridge]);

  const handleStarsAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      setPurchaseState(prev => ({
        ...prev,
        starsAmount: value,
        status: 'idle',
        error: undefined,
      }));
    }
  };

  const handlePurchase = async () => {
    if (!wallet?.connected) {
      setPurchaseState(prev => ({
        ...prev,
        status: 'error',
        error: 'Wallet not connected',
      }));
      onPurchaseError?.('Wallet not connected');
      return;
    }

    if (purchaseState.starsAmount <= 0) {
      setPurchaseState(prev => ({
        ...prev,
        status: 'error',
        error: 'Invalid Stars amount',
      }));
      onPurchaseError?.('Invalid Stars amount');
      return;
    }

    if (starsBalance !== undefined && purchaseState.starsAmount > starsBalance) {
      setPurchaseState(prev => ({
        ...prev,
        status: 'error',
        error: 'Insufficient Stars balance',
      }));
      onPurchaseError?.('Insufficient Stars balance');
      return;
    }

    setPurchaseState(prev => ({
      ...prev,
      isProcessing: true,
      status: 'processing',
      error: undefined,
    }));

    try {
      // Создаем платежную сессию
      const session = await paymentManager.createPaymentSession(
        wallet.publicKey || 'unknown_user',
        purchaseState.starsAmount,
        purchaseState.ndtAmount
      );

      logger.info('Payment session created', { sessionId: session.id });

      // Инициируем процесс оплаты через Telegram
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        const telegramWebApp = window.Telegram.WebApp;
        
        // В реальном приложении вызываем Telegram API для начала платежа
        // Пример: telegramWebApp.CloudStorage.setItem('payment_session_id', session.id);
        
        // Для демонстрации сразу подтверждаем платеж
        const success = await paymentManager.approvePaymentSession(session.id);
        
        if (success) {
          setPurchaseState(prev => ({
            ...prev,
            status: 'completed',
            isProcessing: false,
            transactionId: session.id, // В реальном приложении это будет ID транзакции
          }));
          
          logger.info('Purchase completed successfully', { sessionId: session.id });
          onPurchaseSuccess?.(session.id);
        } else {
          throw new Error('Payment approval failed');
        }
      } else {
        // Если не в Telegram WebApp, симулируем процесс
        // В реальном приложении это может быть редирект на Telegram или другая логика
        logger.warn('Not in Telegram WebApp, simulating purchase');
        
        // Симуляция успешной покупки
        setPurchaseState(prev => ({
          ...prev,
          status: 'completed',
          isProcessing: false,
          transactionId: `simulated_${Date.now()}`,
        }));
        
        onPurchaseSuccess?.(`simulated_${Date.now()}`);
      }
    } catch (error) {
      logger.error('Error during purchase', { error });
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setPurchaseState(prev => ({
        ...prev,
        status: 'error',
        isProcessing: false,
        error: errorMessage,
      }));
      
      onPurchaseError?.(errorMessage);
    }
  };

  const getStatusMessage = () => {
    switch (purchaseState.status) {
      case 'processing':
        return 'Processing your purchase...';
      case 'completed':
        return 'Purchase completed successfully!';
      case 'error':
        return purchaseState.error || 'An error occurred';
      default:
        return '';
    }
  };

  const canPurchase = wallet?.connected && 
                      purchaseState.starsAmount > 0 && 
                      (!starsBalance || purchaseState.starsAmount <= starsBalance) &&
                      !purchaseState.isProcessing &&
                      !purchaseState.isCalculating;

 return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Buy NDT Tokens with Telegram Stars</h2>
      
      {/* Отображение баланса Stars */}
      <div className="mb-4 p-3 bg-blue-50 rounded-md">
        <p className="text-sm text-gray-600">Your Stars Balance</p>
        <p className="text-lg font-semibold text-blue-600">
          {starsBalance !== undefined ? `${starsBalance} Stars` : 'Loading...'}
        </p>
      </div>

      {/* Ввод количества Stars */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Stars Amount
        </label>
        <input
          type="number"
          min="100"
          value={purchaseState.starsAmount}
          onChange={handleStarsAmountChange}
          disabled={purchaseState.isProcessing}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-50 focus:border-blue-500 disabled:bg-gray-100"
        />
        <p className="mt-1 text-xs text-gray-500">
          Minimum: 100 Stars
        </p>
      </div>

      {/* Отображение эквивалентов */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-gray-50 rounded-md">
          <p className="text-xs text-gray-500">Equivalent SOL</p>
          <p className="font-medium">
            {purchaseState.isCalculating ? 'Calculating...' : `${purchaseState.solAmount} SOL`}
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded-md">
          <p className="text-xs text-gray-500">Equivalent NDT</p>
          <p className="font-medium">
            {purchaseState.isCalculating ? 'Calculating...' : `${purchaseState.ndtAmount} NDT`}
          </p>
        </div>
      </div>

      {/* Кнопка покупки */}
      <button
        onClick={handlePurchase}
        disabled={!canPurchase}
        className={`w-full py-2 px-4 rounded-md text-white font-medium ${
          canPurchase 
            ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2' 
            : 'bg-gray-400 cursor-not-allowed'
        }`}
      >
        {purchaseState.isProcessing ? 'Processing...' : 'Buy with Stars'}
      </button>

      {/* Статус операции */}
      {purchaseState.status !== 'idle' && (
        <div className={`mt-4 p-3 rounded-md ${
          purchaseState.status === 'completed' ? 'bg-green-100 text-green-800' :
          purchaseState.status === 'error' ? 'bg-red-100 text-red-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {getStatusMessage()}
        </div>
      )}

      {/* Информация о процессе */}
      <div className="mt-4 text-xs text-gray-500">
        <p>• Your Stars will be converted to SOL and then to NDT tokens</p>
        <p>• Transaction fees may apply according to Telegram's policy</p>
        <p>• Tokens will be added to your wallet after confirmation</p>
      </div>
    </div>
  );
};

export default TelegramStarsUI;