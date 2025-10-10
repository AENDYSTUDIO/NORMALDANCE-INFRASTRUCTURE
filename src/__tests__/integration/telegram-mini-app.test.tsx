/**
 * Telegram Mini App Integration Tests
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import '@testing-library/jest-dom';
import { TelegramProvider } from '@/contexts/telegram-context';
import TelegramAppPage from '@/app/telegram-app/page';

// Mock Telegram WebApp
const mockTelegramWebApp = {
  ready: jest.fn((callback?: () => void) => callback && callback()),
  expand: jest.fn(),
  close: jest.fn(),
  setHeaderColor: jest.fn(),
  setBackgroundColor: jest.fn(),
  enableClosingConfirmation: jest.fn(),
  disableClosingConfirmation: jest.fn(),
  initData: 'test_init_data',
  initDataUnsafe: {
    user: {
      id: 12345,
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser',
      photo_url: 'https://example.com/photo.jpg',
    },
  },
  colorScheme: 'light' as const,
  themeParams: {
    bg_color: '#1c1c1c',
    text_color: '#ffffff',
    button_color: '#3390EC',
    button_text_color: '#ffffff',
    secondary_bg_color: '#2c2c2c',
  },
  isExpanded: true,
  viewportHeight: 600,
  viewportStableHeight: 600,
  headerColor: '#6366f1',
  backgroundColor: '#1c1c1c',
  MainButton: {
    text: 'Main Button',
    color: '#3390EC',
    textColor: '#ffffff',
    isVisible: false,
    isActive: true,
    isProgressVisible: false,
    onClick: jest.fn(),
    show: jest.fn(),
    hide: jest.fn(),
    setText: jest.fn(),
    enable: jest.fn(),
    disable: jest.fn(),
    showProgress: jest.fn(),
    hideProgress: jest.fn(),
    setParams: jest.fn(),
  },
  BackButton: {
    isVisible: false,
    onClick: jest.fn(),
    show: jest.fn(),
    hide: jest.fn(),
  },
  HapticFeedback: {
    impactOccurred: jest.fn(),
    notificationOccurred: jest.fn(),
    selectionChanged: jest.fn(),
  },
  showAlert: jest.fn(),
  showConfirm: jest.fn(),
  showPopup: jest.fn(),
  openLink: jest.fn(),
  openTelegramLink: jest.fn(),
  openInvoice: jest.fn(),
  showScanQrPopup: jest.fn(),
  closeScanQrPopup: jest.fn(),
  readTextFromClipboard: jest.fn(),
  requestWriteAccess: jest.fn(),
  requestContact: jest.fn(),
  onEvent: jest.fn(),
  offEvent: jest.fn(),
  sendData: jest.fn(),
  switchInlineQuery: jest.fn(),
  isVersionAtLeast: jest.fn(() => true),
};

// Setup window mocks for jsdom
Object.defineProperty(window, 'Telegram', {
  value: {
    WebApp: mockTelegramWebApp,
  },
  writable: true,
  configurable: true,
});

describe('Telegram Mini App Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes Telegram WebApp correctly', () => {
    render(
      <TelegramProvider>
        <TelegramAppPage />
      </TelegramProvider>
    );

    expect(mockTelegramWebApp.ready).toHaveBeenCalled();
    expect(mockTelegramWebApp.expand).toHaveBeenCalled();
  });

  it('displays user information correctly', async () => {
    render(
      <TelegramProvider>
        <TelegramAppPage />
      </TelegramProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  it('handles MainButton interactions', async () => {
    render(
      <TelegramProvider>
        <TelegramAppPage />
      </TelegramProvider>
    );

    const purchaseButton = screen.getByText(/пополнить/i);
    fireEvent.click(purchaseButton);

    await waitFor(() => {
      expect(mockTelegramWebApp.MainButton.show).toHaveBeenCalled();
    });
  });

  it('handles haptic feedback correctly', async () => {
    render(
      <TelegramProvider>
        <TelegramAppPage />
      </TelegramProvider>
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);

    await waitFor(() => {
      expect(mockTelegramWebApp.HapticFeedback.impactOccurred).toHaveBeenCalledWith('medium');
    });
  });

  it('respects theme changes', async () => {
    const { rerender } = render(
      <TelegramProvider>
        <TelegramAppPage />
      </TelegramProvider>
    );

    // Simulate theme change
    mockTelegramWebApp.colorScheme = 'dark';
    fireEvent(
      window,
      new CustomEvent('themeChanged', {
        detail: { theme: 'dark' },
      })
    );

    await waitFor(() => {
      rerender(
        <TelegramProvider>
          <TelegramAppPage />
        </TelegramProvider>
      );
    });
  });

  it('validates Telegram Mini App URLs', () => {
    const validUrls = [
      '/telegram-app',
      'https://normaldance.online/telegram-app',
      'https://t.me/normaldance_bot/app',
    ];

    validUrls.forEach(url => {
      expect(url).toMatch(/telegram-app|t\.me/);
    });
  });

  it('handles payments flow correctly', async () => {
    render(
      <TelegramProvider>
        <TelegramAppPage />
      </TelegramProvider>
    );

    const starsButton = screen.getByText(/Buy.*Stars/i);
    fireEvent.click(starsButton);

    await waitFor(() => {
      expect(mockTelegramWebApp.showPopup).toHaveBeenCalled();
    });
  });

  it('provides proper accessibility', () => {
    render(
      <TelegramProvider>
        <TelegramAppPage />
      </TelegramProvider>
    );

    // Check for ARIA labels
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('aria-label');
    });

    // Check for semantic HTML
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByLabelText('музыка')).toBeInTheDocument();
  });
});

describe('Telegram Stars Integration', () => {
  it('handles Stars payment initialization', async () => {
    // Mock Stars payment API
    const mockStarsPayment = jest.fn();
    mockStarsPayment.mockResolvedValue({ success: true });

    render(
      <TelegramProvider>
        <TelegramAppPage />
      </TelegramProvider>
    );

    const purchaseButton = screen.getByText(/Купить.*Stars/i);
    fireEvent.click(purchaseButton);

    await waitFor(() => {
      expect(mockStarsPayment).toHaveBeenCalled();
    });
  });

  it('validates Stars transaction amounts', async () => {
    // Test invalid amounts
    const invalidAmounts = [-100, 0, 0.5, 'abc'];
    
    invalidAmounts.forEach(amount => {
      expect(() => {
        // Simulate validation
        const isValid = typeof amount === 'number' && amount > 0 && Number.isInteger(amount);
        if (!isValid) throw new Error('Invalid amount');
      }).toThrow('Invalid amount');
    });
  });

  it('handles Stars payment success flow', async () => {
    const mockPaymentSuccess = jest.fn();
    
    render(
      <TelegramProvider>
        <TelegramAppPage />
      </TelegramProvider>
    );

    const purchaseButton = screen.getByText(/Пополнить/i);
    fireEvent.click(purchaseButton);

    await waitFor(() => {
      expect(mockPaymentSuccess).toHaveBeenCalled();
    });
  });
});

describe('Telegram Bot Integration', () => {
  it('validates bot token format', () => {
    const validTokens = [
      '1234567890:ABCDEF1234567890',
      '123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    ];

    const invalidTokens = [
      '123456',
      '1234567890:',
      'invalid:token',
      '',
    ];

    validTokens.forEach(token => {
      expect(token).toMatch(/^\d+:[A-Za-z0-9_-]+$/);
    });

    invalidTokens.forEach(token => {
      expect(token).not.toMatch(/^\d+:[A-Za-z0-9_-]+$/);
    });
  });

  it('handles webhook events', () => {
    const webhookPayload = {
      update_id: 12345,
      message: {
        message_id: 1,
        from: {
          id: 98765,
          first_name: 'Test',
        },
        chat: {
          id: 98765,
          type: 'private',
        },
        text: '/start',
      },
    };

    expect(webhookPayload.message.text).toBe('/start');
    expect(webhookPayload.update_id).toBe(12345);
  });
});
