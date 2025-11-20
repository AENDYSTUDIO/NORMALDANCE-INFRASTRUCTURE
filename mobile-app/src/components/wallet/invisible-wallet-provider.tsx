import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Connection } from '@solana/web3.js';
import { DeflationaryModel } from '@/lib/deflationary-model';
import { walletEmitter } from './wallet-adapter';

// Типы для состояния невидимого кошелька
interface InvisibleWalletState {
  publicKey: PublicKey | null;
  connected: boolean;
  connecting: boolean;
  balance: number | null;
  offlineMode: boolean;
  lastUpdated: Date | null;
}

// Типы для контекста
interface InvisibleWalletContextType {
  state: InvisibleWalletState;
  connect: () => Promise<void>;
  disconnect: () => void;
 updateBalance: () => Promise<void>;
  setOfflineMode: (offline: boolean) => void;
}

// Инициализация контекста
const InvisibleWalletContext = createContext<InvisibleWalletContextType | undefined>(undefined);

// Пропсы для провайдера
interface InvisibleWalletProviderProps {
  children: ReactNode;
  autoConnect?: boolean;
  connection?: Connection;
}

// Компонент провайдера невидимого кошелька для мобильного приложения
export const InvisibleWalletProvider: React.FC<InvisibleWalletProviderProps> = ({
  children,
  autoConnect = true,
  connection = new Connection(process.env.EXPO_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'),
}) => {
  const [state, setState] = useState<InvisibleWalletState>({
    publicKey: null,
    connected: false,
    connecting: false,
    balance: null,
    offlineMode: false,
    lastUpdated: null,
  });

  const { connect: solanaConnect, disconnect: solanaDisconnect, publicKey, connected, connecting } = useWallet();

  // Автоматическая инициализация кошелька
  useEffect(() => {
    if (autoConnect && !connected && !connecting && !state.connected) {
      initializeWallet();
    }
  }, [autoConnect, connected, connecting, state.connected]);

  // Обновление состояния при изменении Solana кошелька
  useEffect(() => {
    setState(prev => ({
      ...prev,
      publicKey: publicKey || null,
      connected,
      connecting,
    }));

    if (publicKey) {
      updateBalance();
    }
  }, [publicKey, connected, connecting]);

  // Инициализация кошелька
 const initializeWallet = async () => {
    if (!connected && !connecting) {
      try {
        setState(prev => ({ ...prev, connecting: true }));
        await solanaConnect();
      } catch (error) {
        console.warn('Auto-connect failed, continuing in offline mode');
        setState(prev => ({
          ...prev,
          connecting: false,
          offlineMode: true,
          lastUpdated: new Date(),
        }));
        walletEmitter.emit('invisibleWallet:offline', true);
      }
    }
  };

  // Подключение кошелька
  const connect = async () => {
    try {
      setState(prev => ({ ...prev, connecting: true }));
      await solanaConnect();
      setState(prev => ({ ...prev, offlineMode: false }));
      walletEmitter.emit('invisibleWallet:connected', publicKey);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setState(prev => ({ ...prev, connecting: false, offlineMode: true }));
      walletEmitter.emit('invisibleWallet:connectError', error);
    }
  };

  // Отключение кошелька
  const disconnect = () => {
    solanaDisconnect();
    setState({
      publicKey: null,
      connected: false,
      connecting: false,
      balance: null,
      offlineMode: false,
      lastUpdated: new Date(),
    });
    walletEmitter.emit('invisibleWallet:disconnected');
  };

  // Обновление баланса
  const updateBalance = async () => {
    if (publicKey && connection) {
      try {
        const balance = await connection.getBalance(publicKey);
        const formattedBalance = DeflationaryModel.formatSolAmount(balance);
        setState(prev => ({
          ...prev,
          balance: formattedBalance,
          lastUpdated: new Date(),
        }));
        walletEmitter.emit('invisibleWallet:balanceUpdated', formattedBalance);
      } catch (error) {
        console.error('Failed to update balance:', error);
        // В оффлайн режиме сохраняем предыдущий баланс
        if (!state.offlineMode) {
          setState(prev => ({ ...prev, offlineMode: true }));
        }
      }
    }
  };

  // Установка оффлайн режима
  const setOfflineMode = (offline: boolean) => {
    setState(prev => ({
      ...prev,
      offlineMode: offline,
      lastUpdated: new Date(),
    }));
    walletEmitter.emit('invisibleWallet:offline', offline);
  };

  // Периодическое обновление баланса
  useEffect(() => {
    let balanceInterval: NodeJS.Timeout;
    
    if (state.connected && publicKey) {
      // Обновляем баланс каждые 30 секунд
      balanceInterval = setInterval(updateBalance, 30000);
    }
    
    return () => {
      if (balanceInterval) clearInterval(balanceInterval);
    };
  }, [state.connected, publicKey]);

  const contextValue: InvisibleWalletContextType = {
    state,
    connect,
    disconnect,
    updateBalance,
    setOfflineMode,
  };

  return (
    <InvisibleWalletContext.Provider value={contextValue}>
      {children}
    </InvisibleWalletContext.Provider>
  );
};

// Хук для использования невидимого кошелька
export const useInvisibleWallet = (): InvisibleWalletContextType => {
 const context = useContext(InvisibleWalletContext);
  if (!context) {
    throw new Error('useInvisibleWallet must be used within an InvisibleWalletProvider');
  }
  return context;
};

// Компонент для автоматического подключения кошелька при загрузке
export const AutoConnectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <InvisibleWalletProvider autoConnect={true}>
      {children}
    </InvisibleWalletProvider>
  );
};