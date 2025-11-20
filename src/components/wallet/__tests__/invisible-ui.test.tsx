import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { AutoConnectProvider, useInvisibleWallet } from '../invisible-wallet-provider';
import { MinimalWalletUI } from '../minimal-wallet-ui';
import { InvisibleTransactionUI } from '../invisible-transaction-ui';
import { useInvisibleBalance, useInvisibleTransaction, useInvisibleAuth } from '@/lib/wallet/invisible-wallet-hooks';

// Моки для wallet adapter
vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: vi.fn(),
}));

// Моки для web3.js
vi.mock('@solana/web3.js', async () => {
 const actual = await vi.importActual('@solana/web3.js');
  return {
    ...actual,
    Connection: vi.fn(() => ({
      getBalance: vi.fn(() => Promise.resolve(10000000)), // 1 SOL
    })),
  };
});

// Моки для invisible wallet hooks
vi.mock('@/lib/wallet/invisible-wallet-hooks', () => ({
  useInvisibleBalance: vi.fn(),
  useInvisibleTransaction: vi.fn(),
  useInvisibleAuth: vi.fn(),
  useInvisibleWalletEvents: vi.fn(() => ({ events: [], clearEvents: vi.fn() })),
}));

// Моки для utils
vi.mock('@/lib/utils', () => ({
  formatSolAmount: vi.fn((amount) => amount.toFixed(4)),
  cn: vi.fn((...classes) => classes.filter(Boolean).join(' ')),
}));

// Моки для wallet adapter
vi.mock('../wallet-adapter', () => ({
  walletEmitter: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  },
}));

// Тестовый компонент для проверки хука
const TestComponent: React.FC = () => {
  const { state } = useInvisibleWallet();
  const { balance } = useInvisibleBalance();
  const { execute } = useInvisibleTransaction();
  const { isAuthenticated } = useInvisibleAuth();

  return (
    <div>
      <div data-testid="wallet-state-connected">{state.connected.toString()}</div>
      <div data-testid="wallet-state-public-key">{state.publicKey?.toString() || 'null'}</div>
      <div data-testid="balance">{balance?.toString() || 'null'}</div>
      <div data-testid="is-authenticated">{isAuthenticated.toString()}</div>
      <button onClick={() => execute({} as any, 'test')}>Execute Transaction</button>
    </div>
  );
};

describe('Invisible Wallet UI Components', () => {
  beforeEach(() => {
    // Сброс моков перед каждым тестом
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('AutoConnectProvider', () => {
    it('should render children with invisible wallet context', async () => {
      // Мокаем useWallet
      (useWallet as any).mockReturnValue({
        connected: false,
        connecting: false,
        publicKey: null,
        connect: vi.fn(() => Promise.resolve()),
        disconnect: vi.fn(() => Promise.resolve()),
      });

      // Мокаем хуки
      (useInvisibleBalance as any).mockReturnValue({
        balance: 1.0,
        loading: false,
        refresh: vi.fn(),
        offlineMode: false,
      });
      (useInvisibleTransaction as any).mockReturnValue({
        execute: vi.fn(),
        getStatus: vi.fn(),
        transactions: {},
        connected: true,
        publicKey: null,
        offlineMode: false,
      });
      (useInvisibleAuth as any).mockReturnValue({
        signIn: vi.fn(),
        signOut: vi.fn(),
        isAuthenticated: false,
        isReady: true,
        status: 'disconnected',
        publicKey: null,
        connected: false,
        offlineMode: false,
      });

      render(
        <AutoConnectProvider>
          <TestComponent />
        </AutoConnectProvider>
      );

      // Проверяем, что компоненты отрендерились
      expect(screen.getByTestId('wallet-state-connected')).toBeInTheDocument();
      expect(screen.getByTestId('wallet-state-public-key')).toBeInTheDocument();
      expect(screen.getByTestId('balance')).toBeInTheDocument();
      expect(screen.getByTestId('is-authenticated')).toBeInTheDocument();

      // Проверяем начальное состояние
      expect(screen.getByTestId('wallet-state-connected')).toHaveTextContent('false');
      expect(screen.getByTestId('wallet-state-public-key')).toHaveTextContent('null');
      expect(screen.getByTestId('balance')).toHaveTextContent('1');
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    });
  });

  describe('MinimalWalletUI', () => {
    it('should render minimal wallet UI with balance', () => {
      // Мокаем useInvisibleWallet
      vi.mocked(useInvisibleWallet).mockReturnValue({
        state: {
          publicKey: new PublicKey('1234567890123456789012345678901234567890123'),
          connected: true,
          connecting: false,
          balance: 2.5,
          offlineMode: false,
          lastUpdated: new Date(),
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
        updateBalance: vi.fn(),
        setOfflineMode: vi.fn(),
      });

      render(<MinimalWalletUI showBalance={true} showConnectionStatus={true} />);

      // Проверяем, что баланс отображается
      expect(screen.getByText('2.5000 SOL')).toBeInTheDocument();
    });

    it('should render connection status indicator', () => {
      // Мокаем useInvisibleWallet
      vi.mocked(useInvisibleWallet).mockReturnValue({
        state: {
          publicKey: new PublicKey('1234567890123456789012345678901234567890123'),
          connected: true,
          connecting: false,
          balance: 2.5,
          offlineMode: false,
          lastUpdated: new Date(),
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
        updateBalance: vi.fn(),
        setOfflineMode: vi.fn(),
      });

      render(<MinimalWalletUI showConnectionStatus={true} />);

      // Проверяем, что статус подключения отображается
      expect(screen.getByText('1234...7890')).toBeInTheDocument();
    });

    it('should render offline mode indicator', () => {
      // Мокаем useInvisibleWallet
      vi.mocked(useInvisibleWallet).mockReturnValue({
        state: {
          publicKey: new PublicKey('1234567890123456789012345678901234567890123'),
          connected: false,
          connecting: false,
          balance: 2.5,
          offlineMode: true,
          lastUpdated: new Date(),
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
        updateBalance: vi.fn(),
        setOfflineMode: vi.fn(),
      });

      render(<MinimalWalletUI showConnectionStatus={true} />);

      // Проверяем, что индикатор оффлайн режима отображается
      expect(screen.getByText('OFF')).toBeInTheDocument();
    });
 });

  describe('InvisibleTransactionUI', () => {
    it('should render without errors', () => {
      // Мокаем useInvisibleWallet
      vi.mocked(useInvisibleWallet).mockReturnValue({
        state: {
          publicKey: new PublicKey('1234567890123456789012345678901234567890123'),
          connected: true,
          connecting: false,
          balance: 2.5,
          offlineMode: false,
          lastUpdated: new Date(),
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
        updateBalance: vi.fn(),
        setOfflineMode: vi.fn(),
      });

      const { container } = render(<InvisibleTransactionUI />);
      
      // Компонент должен быть отрендерен, но скрыт
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('InvisibleWalletProvider', () => {
    it('should provide wallet context', async () => {
      // Мокаем useWallet
      (useWallet as any).mockReturnValue({
        connected: true,
        connecting: false,
        publicKey: new PublicKey('1234567890123456789012345678901234567890123'),
        connect: vi.fn(() => Promise.resolve()),
        disconnect: vi.fn(() => Promise.resolve()),
      });

      render(
        <AutoConnectProvider>
          <TestComponent />
        </AutoConnectProvider>
      );

      // Ждем обновления состояния
      await waitFor(() => {
        expect(screen.getByTestId('wallet-state-connected')).toHaveTextContent('true');
        expect(screen.getByTestId('wallet-state-public-key')).toHaveTextContent('1234567890123456789012345678901234567890123');
      });
    });

    it('should handle connection errors gracefully', async () => {
      // Мокаем useWallet с ошибкой подключения
      (useWallet as any).mockReturnValue({
        connected: false,
        connecting: false,
        publicKey: null,
        connect: vi.fn(() => Promise.reject(new Error('Connection failed'))),
        disconnect: vi.fn(() => Promise.resolve()),
      });

      render(
        <AutoConnectProvider>
          <TestComponent />
        </AutoConnectProvider>
      );

      // Проверяем начальное состояние
      expect(screen.getByTestId('wallet-state-connected')).toHaveTextContent('false');
    });
  });

  describe('useInvisibleWallet hook', () => {
    it('should return wallet state and methods', () => {
      // Мокаем useInvisibleWallet
      const mockState = {
        publicKey: new PublicKey('1234567890123456789012345678901234567890123'),
        connected: true,
        connecting: false,
        balance: 2.5,
        offlineMode: false,
        lastUpdated: new Date(),
      };
      const mockConnect = vi.fn();
      const mockDisconnect = vi.fn();
      const mockUpdateBalance = vi.fn();
      const mockSetOfflineMode = vi.fn();

      vi.mocked(useInvisibleWallet).mockReturnValue({
        state: mockState,
        connect: mockConnect,
        disconnect: mockDisconnect,
        updateBalance: mockUpdateBalance,
        setOfflineMode: mockSetOfflineMode,
      });

      render(
        <AutoConnectProvider>
          <TestComponent />
        </AutoConnectProvider>
      );

      // Проверяем, что хук возвращает правильные значения
      expect(screen.getByTestId('wallet-state-connected')).toHaveTextContent('true');
    });
  });
});

// Дополнительные тесты для мобильной версии
describe('Mobile InvisibleWalletProvider', () => {
  it('should initialize with default connection', () => {
    // Мокаем useWallet
    (useWallet as any).mockReturnValue({
      connected: false,
      connecting: false,
      publicKey: null,
      connect: vi.fn(() => Promise.resolve()),
      disconnect: vi.fn(() => Promise.resolve()),
    });

    render(
      <AutoConnectProvider>
        <TestComponent />
      </AutoConnectProvider>
    );

    expect(screen.getByTestId('wallet-state-connected')).toBeInTheDocument();
  });
});