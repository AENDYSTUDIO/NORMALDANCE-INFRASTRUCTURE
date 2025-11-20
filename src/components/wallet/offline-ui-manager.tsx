'use client';

import React, { useState, useEffect, useContext, createContext } from 'react';
import { logger } from '../../utils/logger';
import { OfflineTransactionManager } from '../../lib/wallet/offline-transaction-manager';
import { FallbackStateManager } from '../../lib/wallet/fallback-state-manager';

interface OfflineUIContextType {
  isOffline: boolean;
  pendingTransactions: number;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  showOfflineBanner: boolean;
}

const OfflineUIContext = createContext<OfflineUIContextType | undefined>(undefined);

export const useOfflineUI = () => {
  const context = useContext(OfflineUIContext);
  if (!context) {
    throw new Error('useOfflineUI must be used within an OfflineUIProvider');
  }
  return context;
};

interface OfflineUIProviderProps {
  children: React.ReactNode;
}

export const OfflineUIProvider: React.FC<OfflineUIProviderProps> = ({ children }) => {
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [pendingTransactions, setPendingTransactions] = useState<number>(0);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [showOfflineBanner, setShowOfflineBanner] = useState<boolean>(false);
  
  const offlineManager = OfflineTransactionManager.getInstance();
  const stateManager = FallbackStateManager.getInstance();

  useEffect(() => {
    // Check initial network status
    const initialOnlineStatus = typeof window !== 'undefined' ? window.navigator.onLine : true;
    setIsOffline(!initialOnlineStatus);
    setShowOfflineBanner(!initialOnlineStatus);

    // Listen for network status changes
    const handleOnline = () => {
      setIsOffline(false);
      setShowOfflineBanner(false);
      setSyncStatus('syncing');
      
      // Attempt to sync when coming back online
      offlineManager.syncPendingTransactions()
        .then(() => {
          setSyncStatus('success');
          setTimeout(() => setSyncStatus('idle'), 3000);
        })
        .catch(error => {
          logger.error('Failed to sync pending transactions:', error);
          setSyncStatus('error');
          setTimeout(() => setSyncStatus('idle'), 3000);
        });
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowOfflineBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for transaction queue changes
    const updatePendingTransactions = () => {
      const pending = offlineManager.getPendingTransactions();
      setPendingTransactions(pending.length);
      
      // Show banner if we have pending transactions
      if (pending.length > 0 && !isOffline) {
        setShowOfflineBanner(true);
      }
    };

    // Initial update
    updatePendingTransactions();

    // Set up interval to periodically check for updates
    const interval = setInterval(updatePendingTransactions, 2000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [isOffline]);

  const contextValue: OfflineUIContextType = {
    isOffline,
    pendingTransactions,
    syncStatus,
    showOfflineBanner,
  };

  return (
    <OfflineUIContext.Provider value={contextValue}>
      {children}
      <OfflineBanner />
      <TransactionQueuePanel />
    </OfflineUIContext.Provider>
  );
};

const OfflineBanner: React.FC = () => {
  const { isOffline, showOfflineBanner, pendingTransactions, syncStatus } = useOfflineUI();

  if (!showOfflineBanner && pendingTransactions === 0) {
    return null;
  }

  let bannerMessage = '';
  let bannerType = 'info';

  if (isOffline) {
    bannerMessage = 'Вы работаете в оффлайн режиме. Транзакции будут выполнены при восстановлении соединения.';
    bannerType = 'warning';
  } else if (pendingTransactions > 0) {
    bannerMessage = `Синхронизация ${pendingTransactions} транзакций...`;
    bannerType = 'info';
  } else if (syncStatus === 'syncing') {
    bannerMessage = 'Синхронизация с сетью...';
    bannerType = 'info';
  } else if (syncStatus === 'success') {
    bannerMessage = 'Все транзакции синхронизированы';
    bannerType = 'success';
  } else if (syncStatus === 'error') {
    bannerMessage = 'Ошибка синхронизации';
    bannerType = 'error';
  }

  // Determine banner style based on type
  const bannerStyles = {
    info: 'bg-blue-100 text-blue-800 border-blue-300',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    success: 'bg-green-100 text-green-800 border-green-300',
    error: 'bg-red-100 text-red-800 border-red-300',
  };

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg border ${bannerStyles[bannerType as keyof typeof bannerStyles]} shadow-lg max-w-sm`}>
      <div className="flex items-center">
        <div className="flex-1">
          <p className="text-sm font-medium">{bannerMessage}</p>
          {pendingTransactions > 0 && (
            <p className="text-xs mt-1">
              {pendingTransactions} транзакций в очереди
            </p>
          )}
        </div>
        <button 
          onClick={() => {}} 
          className="ml-2 text-gray-500 hover:text-gray-700"
          aria-label="Закрыть"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const TransactionQueuePanel: React.FC = () => {
  const { pendingTransactions } = useOfflineUI();
  const [isOpen, setIsOpen] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  
  const offlineManager = OfflineTransactionManager.getInstance();

  useEffect(() => {
    if (isOpen) {
      setTransactions(offlineManager.getTransactionQueue());
    }
  }, [isOpen]);

  if (pendingTransactions === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-indigo-60 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-indigo-700 transition-colors flex items-center"
      >
        <span className="mr-2">Очередь транзакций</span>
        <span className="bg-white text-indigo-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
          {pendingTransactions}
        </span>
      </button>
      
      {isOpen && (
        <div className="absolute bottom-14 right-0 w-80 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Очередь транзакций</h3>
            <p className="text-sm text-gray-600">{pendingTransactions} транзакций ожидает синхронизации</p>
          </div>
          
          <div className="p-4">
            {transactions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Нет транзакций в очереди</p>
            ) : (
              <ul className="space-y-3">
                {transactions
                  .filter(tx => tx.status === 'pending')
                  .map((transaction) => (
                    <li 
                      key={transaction.id} 
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800 capitalize">{transaction.type.replace('-', ' ')}</p>
                          <p className="text-xs text-gray-500 mt-1">ID: {transaction.id.substring(0, 8)}...</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          transaction.priority === 'high' 
                            ? 'bg-red-100 text-red-800' 
                            : transaction.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {transaction.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Создана: {new Date(transaction.createdAt).toLocaleString('ru-RU')}
                      </p>
                    </li>
                  ))
                }
              </ul>
            )}
          </div>
          
          <div className="p-4 border-t border-gray-200 flex justify-between">
            <button
              onClick={() => {
                offlineManager.syncPendingTransactions().catch(error => {
                  logger.error('Failed to sync transactions:', error);
                });
              }}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            >
              Синхронизировать
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export interface OfflineTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
}

export const OfflineTransactionModal: React.FC<OfflineTransactionModalProps> = ({ 
  isOpen, 
  onClose, 
  transaction 
}) => {
  if (!isOpen || !transaction) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900">Детали транзакции</h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Тип транзакции</p>
              <p className="font-medium capitalize">{transaction.type.replace('-', ' ')}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Статус</p>
              <p className={`font-medium ${
                transaction.status === 'pending' ? 'text-yellow-600' :
                transaction.status === 'executed' ? 'text-green-600' :
                transaction.status === 'failed' ? 'text-red-600' :
                'text-purple-600'
              }`}>
                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Дата создания</p>
              <p className="font-medium">{new Date(transaction.createdAt).toLocaleString('ru-RU')}</p>
            </div>
            
            {transaction.executedAt && (
              <div>
                <p className="text-sm text-gray-500">Дата выполнения</p>
                <p className="font-medium">{new Date(transaction.executedAt).toLocaleString('ru-RU')}</p>
              </div>
            )}
            
            <div>
              <p className="text-sm text-gray-500">Приоритет</p>
              <p className="font-medium capitalize">{transaction.priority}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Данные транзакции</p>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                {JSON.stringify(transaction.data, null, 2)}
              </pre>
            </div>
            
            {transaction.error && (
              <div>
                <p className="text-sm text-gray-500">Ошибка</p>
                <p className="font-medium text-red-600">{transaction.error}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-gray-50 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-60 text-white rounded hover:bg-indigo-700"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};