import { useState, useEffect, useCallback, useMemo } from 'react';
import { useInvisibleWallet } from '@/components/wallet/invisible-wallet-provider';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { DeflationaryModel } from '../deflationary-model';
import { walletEmitter } from '@/components/wallet/wallet-adapter';

// Типы для транзакций
interface TransactionOptions {
  onConfirm?: (signature: string) => void;
  onError?: (error: any) => void;
  priority?: 'low' | 'medium' | 'high';
}

// Основной хук для доступа к невидимому кошельку
export const useInvisibleWallet = () => {
  const context = useInvisibleWallet();
  if (!context) {
    throw new Error('useInvisibleWallet must be used within an InvisibleWalletProvider');
  }
  return context;
};

// Хук для получения баланса
export const useInvisibleBalance = () => {
  const { state, updateBalance } = useInvisibleWallet();
  const { connected } = useWallet();
  
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Обновление баланса
  const refreshBalance = useCallback(async () => {
    if (state.publicKey && connected) {
      setLoading(true);
      try {
        await updateBalance();
        setBalance(state.balance);
      } catch (error) {
        console.error('Error updating balance:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [state.publicKey, state.balance, connected, updateBalance]);
  
  // Следим за изменениями состояния кошелька
  useEffect(() => {
    if (state.balance !== null) {
      setBalance(state.balance);
    }
  }, [state.balance]);
  
  // Автоматическое обновление при подключении
  useEffect(() => {
    if (connected && state.publicKey) {
      refreshBalance();
    }
  }, [connected, state.publicKey, refreshBalance]);
  
  return {
    balance: balance,
    loading,
    refresh: refreshBalance,
    offlineMode: state.offlineMode,
  };
};

// Хук для выполнения транзакций
export const useInvisibleTransaction = () => {
  const { state } = useInvisibleWallet();
  const { sendTransaction, publicKey } = useWallet();
  const [transactionStatus, setTransactionStatus] = useState<Record<string, any>>({});
  
  // Выполнение транзакции
  const executeTransaction = useCallback(async (
    transaction: Transaction,
    description: string,
    options?: TransactionOptions
  ): Promise<string | null> => {
    if (!sendTransaction || !publicKey) {
      console.error('Wallet not connected');
      options?.onError?.('Wallet not connected');
      return null;
    }
    
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Устанавливаем начальный статус транзакции
    setTransactionStatus(prev => ({
      ...prev,
      [transactionId]: { status: 'pending', description, timestamp: new Date() }
    }));
    
    try {
      // Отправляем транзакцию
      const signature = await sendTransaction(transaction, publicKey);
      
      // Обновляем статус транзакции
      setTransactionStatus(prev => ({
        ...prev,
        [transactionId]: { 
          ...prev[transactionId], 
          status: 'sent', 
          signature,
          message: 'Transaction sent, waiting for confirmation...'
        }
      }));
      
      // Подтверждаем транзакцию
      const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }
      
      // Обновляем статус транзакции
      setTransactionStatus(prev => ({
        ...prev,
        [transactionId]: { 
          ...prev[transactionId], 
          status: 'confirmed', 
          message: 'Transaction confirmed successfully'
        }
      }));
      
      // Вызываем колбэк при успешном подтверждении
      options?.onConfirm?.(signature);
      
      // Вызываем событие через emitter
      walletEmitter.emit('invisibleWallet:transactionSuccess', {
        transactionId,
        signature,
        description
      });
      
      return signature;
    } catch (error) {
      console.error('Transaction failed:', error);
      
      // Обновляем статус транзакции
      setTransactionStatus(prev => ({
        ...prev,
        [transactionId]: { 
          ...prev[transactionId], 
          status: 'failed', 
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
      
      // Вызываем колбэк при ошибке
      options?.onError?.(error);
      
      // Вызываем событие через emitter
      walletEmitter.emit('invisibleWallet:transactionError', {
        transactionId,
        error,
        description
      });
      
      return null;
    }
  }, [sendTransaction, publicKey]);
  
  // Метод для получения статуса транзакции
  const getTransactionStatus = useCallback((transactionId: string) => {
    return transactionStatus[transactionId] || null;
  }, [transactionStatus]);
  
  return {
    execute: executeTransaction,
    getStatus: getTransactionStatus,
    transactions: transactionStatus,
    connected: state.connected,
    publicKey: state.publicKey,
    offlineMode: state.offlineMode,
  };
};

// Хук для аутентификации и управления сессией
export const useInvisibleAuth = () => {
  const { state, connect, disconnect } = useInvisibleWallet();
  const { connected, connecting } = useWallet();
  const [authStatus, setAuthStatus] = useState<'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'>('idle');
  
  // Обработка статуса аутентификации
  useEffect(() => {
    if (connecting) {
      setAuthStatus('connecting');
    } else if (connected) {
      setAuthStatus('connected');
    } else if (!connected && state.connected === false) {
      setAuthStatus('disconnected');
    }
  }, [connected, connecting, state.connected]);
  
  // Подключение
  const signIn = useCallback(async () => {
    try {
      setAuthStatus('connecting');
      await connect();
      setAuthStatus('connected');
      return true;
    } catch (error) {
      console.error('Auth failed:', error);
      setAuthStatus('error');
      return false;
    }
  }, [connect]);
  
  // Отключение
  const signOut = useCallback(async () => {
    try {
      await disconnect();
      setAuthStatus('disconnected');
      return true;
    } catch (error) {
      console.error('Sign out failed:', error);
      setAuthStatus('error');
      return false;
    }
  }, [disconnect]);
  
  // Проверка аутентификации
  const isAuthenticated = useMemo(() => {
    return connected && state.connected && !!state.publicKey;
  }, [connected, state.connected, state.publicKey]);
  
  // Проверка готовности
  const isReady = useMemo(() => {
    return authStatus !== 'idle' && authStatus !== 'connecting';
  }, [authStatus]);
  
  return {
    signIn,
    signOut,
    isAuthenticated,
    isReady,
    status: authStatus,
    publicKey: state.publicKey,
    connected: state.connected,
    offlineMode: state.offlineMode,
  };
};

// Хук для работы с токенами и балансами
export const useInvisibleTokens = () => {
  const { state } = useInvisibleWallet();
  const { connection } = useWallet();
  const [tokenBalances, setTokenBalances] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  
  // Получение баланса токенов
  const fetchTokenBalances = useCallback(async () => {
    if (!state.publicKey || !connection) return;
    
    setLoading(true);
    try {
      // В реальной реализации здесь будет логика получения балансов токенов
      // Для демонстрации возвращаем пустой объект
      const balances: Record<string, number> = {};
      setTokenBalances(balances);
    } catch (error) {
      console.error('Error fetching token balances:', error);
    } finally {
      setLoading(false);
    }
  }, [state.publicKey, connection]);
  
  // Обновление при изменении публичного ключа
  useEffect(() => {
    if (state.publicKey) {
      fetchTokenBalances();
    }
  }, [state.publicKey, fetchTokenBalances]);
  
  return {
    balances: tokenBalances,
    loading,
    refresh: fetchTokenBalances,
    publicKey: state.publicKey,
  };
};

// Хук для отслеживания событий кошелька
export const useInvisibleWalletEvents = () => {
  const [events, setEvents] = useState<any[]>([]);
  
  // Подписка на события
  useEffect(() => {
    const handleConnect = (publicKey: PublicKey) => {
      setEvents(prev => [...prev, { type: 'connect', publicKey, timestamp: new Date() }]);
    };
    
    const handleDisconnect = () => {
      setEvents(prev => [...prev, { type: 'disconnect', timestamp: new Date() }]);
    };
    
    const handleError = (error: any) => {
      setEvents(prev => [...prev, { type: 'error', error, timestamp: new Date() }]);
    };
    
    const handleBalanceUpdate = (balance: number) => {
      setEvents(prev => [...prev, { type: 'balanceUpdate', balance, timestamp: new Date() }]);
    };
    
    const handleTransactionSuccess = (data: any) => {
      setEvents(prev => [...prev, { type: 'transactionSuccess', data, timestamp: new Date() }]);
    };
    
    const handleTransactionError = (data: any) => {
      setEvents(prev => [...prev, { type: 'transactionError', data, timestamp: new Date() }]);
    };
    
    // Подписка на события
    walletEmitter.on('invisibleWallet:connected', handleConnect);
    walletEmitter.on('invisibleWallet:disconnected', handleDisconnect);
    walletEmitter.on('invisibleWallet:connectError', handleError);
    walletEmitter.on('invisibleWallet:balanceUpdated', handleBalanceUpdate);
    walletEmitter.on('invisibleWallet:transactionSuccess', handleTransactionSuccess);
    walletEmitter.on('invisibleWallet:transactionError', handleTransactionError);
    
    // Отписка при размонтировании
    return () => {
      walletEmitter.off('invisibleWallet:connected', handleConnect);
      walletEmitter.off('invisibleWallet:disconnected', handleDisconnect);
      walletEmitter.off('invisibleWallet:connectError', handleError);
      walletEmitter.off('invisibleWallet:balanceUpdated', handleBalanceUpdate);
      walletEmitter.off('invisibleWallet:transactionSuccess', handleTransactionSuccess);
      walletEmitter.off('invisibleWallet:transactionError', handleTransactionError);
    };
  }, []);
  
  // Метод для очистки событий
  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);
  
  return {
    events,
    clearEvents,
  };
};