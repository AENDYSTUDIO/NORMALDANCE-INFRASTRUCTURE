import { NDTManager } from "@/components/wallet/ndt-manager";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

// Mock the wallet provider context
jest.mock("@/components/wallet/wallet-provider", () => ({
  useWalletContext: () => ({
    connected: true,
    publicKey: "test-public-key",
    balance: 10,
  }),
  useTransactions: () => ({
    sendTransaction: jest.fn().mockResolvedValue("test-transaction-signature"),
  }),
  WalletProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

// Mock other dependencies
jest.mock("@/components/wallet/wallet-adapter", () => ({
  formatTokens: (value: number) => value.toString(),
  formatSol: (value: number) => value.toString(),
  solToLamports: (value: number) => value * 10000,
  createTransaction: jest.fn(),
  NDT_MINT_ADDRESS: "test-ndt-mint-address",
  NDT_PROGRAM_ID: "test-ndt-program-id",
}));

// Mock UI components
jest.mock("@/components/ui", () => ({
  Card: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div className={className || ""}>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardDescription: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Button: ({
    children,
    onClick,
    disabled,
    className,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
  }) => (
    <button onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  ),
  Badge: ({
    children,
    variant,
  }: {
    children: React.ReactNode;
    variant?: string;
  }) => <span className={variant}>{children}</span>,
  Progress: ({ value }: { value: number }) => <div>{value}%</div>,
}));

// Mock icons
jest.mock("@/components/icons", () => ({
  Coins: () => <span>Coins Icon</span>,
  TrendingUp: () => <span>TrendingUp Icon</span>,
  Clock: () => <span>Clock Icon</span>,
  Lock: () => <span>Lock Icon</span>,
  Unlock: () => <span>Unlock Icon</span>,
  Zap: () => <span>Zap Icon</span>,
  AlertCircle: () => <span>AlertCircle Icon</span>,
}));

describe("NDTManager - Component Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders NDT Manager component when wallet is connected", () => {
    render(<NDTManager />);

    expect(screen.getByText(/NDT Токены/i)).toBeInTheDocument();
    expect(screen.getByText(/Стейкинг Информация/i)).toBeInTheDocument();
    expect(screen.getByText(/Действия стейкинга/i)).toBeInTheDocument();
    expect(screen.getByText(/Уровни стейкинга/i)).toBeInTheDocument();
  });

  it("shows connection message when wallet is not connected", () => {
    // Mock wallet as disconnected
    jest.mock("@/components/wallet/wallet-provider", () => ({
      useWalletContext: () => ({
        connected: false,
        publicKey: null,
        balance: 0,
      }),
      useTransactions: () => ({
        sendTransaction: jest.fn(),
      }),
      WalletProvider: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
      ),
    }));

    // Need to re-require the component after the mock to make it use the new mock
    const { NDTManager } = require("@/components/wallet/ndt-manager");

    render(<NDTManager />);

    expect(
      screen.getByText(/Пожалуйста, подключите кошелек/i)
    ).toBeInTheDocument();
  });

  it("displays wallet balances correctly", () => {
    render(<NDTManager />);

    // Check that balance information is displayed
    expect(screen.getByText(/Баланс NDT:/i)).toBeInTheDocument();
    expect(screen.getByText(/Баланс SOL:/i)).toBeInTheDocument();
  });

  it("handles stake button clicks", async () => {
    const sendTransactionMock = jest.fn().mockResolvedValue("test-signature");
    jest.mock("@/components/wallet/wallet-provider", () => ({
      useWalletContext: () => ({
        connected: true,
        publicKey: "test-public-key",
        balance: 10,
      }),
      useTransactions: () => ({
        sendTransaction: sendTransactionMock,
      }),
      WalletProvider: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
      ),
    }));

    const { NDTManager } = require("@/components/wallet/ndt-manager");

    render(<NDTManager />);

    // Find and click one of the stake buttons
    const stakeButton = screen.getByText("100 NDT / 3 мес");
    fireEvent.click(stakeButton);

    await waitFor(() => {
      expect(sendTransactionMock).toHaveBeenCalled();
    });
  });

  it("handles claim rewards button click", async () => {
    const sendTransactionMock = jest.fn().mockResolvedValue("test-signature");
    jest.mock("@/components/wallet/wallet-provider", () => ({
      useWalletContext: () => ({
        connected: true,
        publicKey: "test-public-key",
        balance: 10,
      }),
      useTransactions: () => ({
        sendTransaction: sendTransactionMock,
      }),
      WalletProvider: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
      ),
    }));

    const { NDTManager } = require("@/components/wallet/ndt-manager");

    render(<NDTManager />);

    // Find and click the claim rewards button
    const claimButton = screen.getByText("Claim Rewards");
    fireEvent.click(claimButton);

    await waitFor(() => {
      expect(sendTransactionMock).toHaveBeenCalled();
    });
  });

  it("handles unstake button click", async () => {
    const sendTransactionMock = jest.fn().mockResolvedValue("test-signature");
    jest.mock("@/components/wallet/wallet-provider", () => ({
      useWalletContext: () => ({
        connected: true,
        publicKey: "test-public-key",
        balance: 10,
      }),
      useTransactions: () => ({
        sendTransaction: sendTransactionMock,
      }),
      WalletProvider: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
      ),
    }));

    const { NDTManager } = require("@/components/wallet/ndt-manager");

    render(<NDTManager />);

    // Find and click the unstake button
    const unstakeButton = screen.getByText("Unstake All");
    fireEvent.click(unstakeButton);

    await waitFor(() => {
      expect(sendTransactionMock).toHaveBeenCalled();
    });
  });

  it("displays staking tiers information", () => {
    render(<NDTManager />);

    expect(screen.getByText(/Bronze/i)).toBeInTheDocument();
    expect(screen.getByText(/Silver/i)).toBeInTheDocument();
    expect(screen.getByText(/Gold/i)).toBeInTheDocument();
  });
});
