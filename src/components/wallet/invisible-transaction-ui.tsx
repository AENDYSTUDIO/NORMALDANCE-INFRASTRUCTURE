import React, { useState, useEffect, useCallback } from 'react';
import { useInvisibleWallet } from './invisible-wallet-provider';
import { WalletNotification } from './minimal-wallet-ui';
import { Transaction, Connection, sendAndConfirmTransaction } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { DeflationaryModel } from '@/lib/deflationary-model';
import { walletEmitter } from './wallet-adapter';

// Типы для транзакций
interface TransactionStatus {
  id: string;
  status: 'pending' | 'confirmed' | 'failed' | 'processing';
  message: string;
  timestamp: Date;
  signature?: string;
}

interface TransactionRequest {
  id: string;
  transaction: Transaction;
  description: string;
 onConfirm?: (signature: string) => void;
  onError?: (error: any) => void;
}

// Компонент для обработки невидимых транзакций
export const InvisibleTransactionUI: React.FC = () => {
  const { state } = useInvisibleWallet();
  const { sendTransaction } = useWallet();
  const [transactions, setTransactions] = useState<TransactionStatus[]>([]);
  const [pendingRequests, setPendingRequests] = useState<TransactionRequest[]>([]);
  const [showNotifications, setShowNotifications] = useState(true);
  const [recentTransaction, setRecentTransaction] = useState<TransactionStatus | null>(null);

  // Добавление новой транзакции в очередь
  const addToQueue = useCallback((request: TransactionRequest) => {
    setPendingRequests(prev => [...prev, request]);
  }, []);

  // Обработка транзакции
  const processTransaction = useCallback(async (request: TransactionRequest) => {
    if (!sendTransaction || !state.publicKey) {
      const errorStatus: TransactionStatus = {
        id: request.id,
        status: 'failed',
        message: 'Кошелек не подключен',
        timestamp: new Date(),
      };
      setTransactions(prev => [errorStatus, ...prev]);
      setRecentTransaction(errorStatus);
      walletEmitter.emit('invisibleWallet:transactionFailed', errorStatus);
      return;
    }

    try {
      // Обновляем статус транзакции на "processing"
      const processingStatus: TransactionStatus = {
        id: request.id,
        status: 'processing',
        message: 'Обработка транзакции...',
        timestamp: new Date(),
      };
      
      setTransactions(prev => [processingStatus, ...prev]);
      setRecentTransaction(processingStatus);
      
      // Отправляем транзакцию
      const signature = await sendTransaction(request.transaction, state.publicKey);
      
      // Обновляем статус на "pending"
      const pendingStatus: TransactionStatus = {
        ...processingStatus,
        status: 'pending',
        message: 'Ожидание подтверждения...',
        signature,
      };
      
      setTransactions(prev => prev.map(t => t.id === request.id ? pendingStatus : t));
      setRecentTransaction(pendingStatus);

      // Ждем подтверждения транзакции
      const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
      await connection.confirmTransaction(signature, 'confirmed');
      
      // Обновляем статус на "confirmed"
      const confirmedStatus: TransactionStatus = {
        ...pendingStatus,
        status: 'confirmed',
        message: 'Транзакция подтверждена',
      };
      
      setTransactions(prev => prev.map(t => t.id === request.id ? confirmedStatus : t));
      setRecentTransaction(confirmedStatus);
      
      // Вызываем callback при подтверждении
      if (request.onConfirm) {
        request.onConfirm(signature);
      }
      
      walletEmitter.emit('invisibleWallet:transactionConfirmed', confirmedStatus);
    } catch (error) {
      console.error('Transaction failed:', error);
      
      const errorStatus: TransactionStatus = {
        id: request.id,
        status: 'failed',
        message: error instanceof Error ? error.message : 'Ошибка транзакции',
        timestamp: new Date(),
      };
      
      setTransactions(prev => prev.map(t => t.id === request.id ? errorStatus : t));
      setRecentTransaction(errorStatus);
      
      // Вызываем callback при ошибке
      if (request.onError) {
        request.onError(error);
      }
      
      walletEmitter.emit('invisibleWallet:transactionFailed', errorStatus);
    }
  }, [sendTransaction, state.publicKey]);

  // Обработка очереди транзакций
  useEffect(() => {
    if (pendingRequests.length > 0 && state.connected) {
      const [nextRequest, ...remainingRequests] = pendingRequests;
      setPendingRequests(remainingRequests);
      processTransaction(nextRequest);
    }
  }, [pendingRequests, state.connected, processTransaction]);

  // Автоматическое уведомление о важных транзакциях
  useEffect(() => {
    if (recentTransaction && showNotifications) {
      // Показываем уведомление в зависимости от статуса транзакции
      const notificationType = recentTransaction.status === 'confirmed' ? 'success' :
                              recentTransaction.status === 'failed' ? 'error' : 'info';
                              
      // Создаем уведомление только для важных событий
      if (recentTransaction.status !== 'processing' && recentTransaction.status !== 'pending') {
        // Здесь можно добавить логику для отображения уведомлений
      }
    }
  }, [recentTransaction, showNotifications]);

  // Очистка старых транзакций (по истечении времени)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTransactions(prev => 
        prev.filter(t => {
          const timeDiff = now.getTime() - t.timestamp.getTime();
          // Удаляем транзакции старше 5 минут, если они подтверждены
          return !(t.status === 'confirmed' && timeDiff > 5 * 60 * 1000);
        })
      );
    }, 60000); // Проверяем каждую минуту

    return () => clearInterval(interval);
  }, []);

  // Метод для выполнения транзакции
  const executeTransaction = useCallback((transaction: Transaction, description: string, onConfirm?: (signature: string) => void, onError?: (error: any) => void) => {
    const id = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const request: TransactionRequest = {
      id,
      transaction,
      description,
      onConfirm,
      onError
    };
    
    addToQueue(request);
    return id;
  }, [addToQueue]);

  // Метод для получения статуса транзакции
  const getTransactionStatus = useCallback((id: string) => {
    return transactions.find(t => t.id === id) || null;
 }, [transactions]);

  // Экспорт методов для использования в других компонентах
  (window as any).invisibleWalletTransactions = {
    execute: executeTransaction,
    getStatus: getTransactionStatus,
    transactions,
    pendingRequests,
  };

  return (
    <div className="hidden"> {/* Компонент невидимый по умолчанию */}
      {/* Здесь могут быть скрытые элементы для обработки транзакций */}
      {recentTransaction && showNotifications && (
        <WalletNotification 
          type={recentTransaction.status === 'confirmed' ? 'success' : 
                recentTransaction.status === 'failed' ? 'error' : 'info'}
          message={`${recentTransaction.status === 'confirmed' ? '✓' : recentTransaction.status === 'failed' ? '✗' : 'ℹ'} ${recentTransaction.message}`}
          duration={recentTransaction.status === 'confirmed' ? 3000 : 5000}
        />
      )}
    </div>
  );
};

// Хук для выполнения транзакций
export const useInvisibleTransaction = () => {
 const { state } = useInvisibleWallet();
  const [transactions, setTransactions] = useState<any[]>([]);
  
  const executeTransaction = useCallback(async (
    transaction: Transaction, 
    description: string,
    onConfirm?: (signature: string) => void,
    onError?: (error: any) => void
  ) => {
    if (!(window as any).invisibleWalletTransactions) {
      console.error('InvisibleTransactionUI not initialized');
      return null;
    }
    
    return (window as any).invisibleWalletTransactions.execute(
      transaction,
      description,
      onConfirm,
      onError
    );
  }, []);

  return {
    executeTransaction,
    transactions,
    connected: state.connected,
    publicKey: state.publicKey,
  };
};

// Компонент для отображения истории транзакций (по требованию)
interface TransactionHistoryProps {
  limit?: number;
  className?: string;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ 
  limit = 5, 
  className = '' 
}) => {
  const [history, setHistory] = useState<TransactionStatus[]>([]);
  
  // В реальной реализации этот компонент будет подключен к состоянию InvisibleTransactionUI
  // Для демонстрации показываем фиктивные данные
  useEffect(() => {
    // Заглушка для получения истории транзакций
    const mockHistory: TransactionStatus[] = [
      {
        id: 'tx_1',
        status: 'confirmed',
        message: 'Транзакция подтверждена',
        timestamp: new Date(Date.now() - 3600000),
        signature: 'mock_signature_1'
      },
      {
        id: 'tx_2',
        status: 'confirmed',
        message: 'Транзакция подтверждена',
        timestamp: new Date(Date.now() - 86400000),
        signature: 'mock_signature_2'
      }
    ];
    
    setHistory(mockHistory.slice(0, limit));
  }, [limit]);

  return (
    <div className={className}>
      <h3 className="font-medium mb-2">История транзакций</h3>
      <div className="space-y-1">
        {history.map(tx => (
          <div key={tx.id} className="text-sm p-2 bg-gray-100 rounded">
            <div>{tx.message}</div>
            <div className="text-xs text-gray-500">
              {tx.timestamp.toLocaleString()} - {tx.signature?.substring(0, 8)}...
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};