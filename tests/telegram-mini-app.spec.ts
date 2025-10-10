/**
 * Telegram Mini App E2E Tests
 */

import { test, expect, Page } from '@playwright/test';

class TelegramMiniAppPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto('/telegram-app');
  }

  async checkTelegramWebView() {
    // Wait for Telegram WebApp initialization
    await this.page.waitForLoadState('networkidle');
    
    // Check for Telegram-specific elements
    const title = this.page.locator('h1');
    await expect(title).toContainText('NormalDance');
    
    // Check for Telegram context presence
    const backButton = this.page.locator('[data-testid="back-button"]');
    const mainButton = this.page.locator('[data-testid="main-button"]');
  }

  async testMusicGallery() {
    await this.page.click('[data-testid="music-tab"]');
    
    // Check if NFT gallery loads
    const gallery = this.page.locator('[data-testid="nft-gallery"]');
    await expect(gallery).toBeVisible();
    
    // Test NFT cards
    const nftCards = this.page.locator('[data-testid^="nft-card-"]');
    await expect(nftCards).toHaveCount.greaterThan(0);
  }

  async testWalletIntegration() {
    await this.page.click('[data-testid="wallet-tab"]');
    
    // Check wallet providers
    const phantomWallet = this.page.locator('[data-testid="phantom-wallet"]');
    const tonWallet = this.page.locator('[data-testid="ton-wallet"]');
    
    await expect(phantomWallet).toBeVisible();
    await expect(tonWallet).toBeVisible();
  }

  async testStarsPayments() {
    await this.page.click('[data-testid="stars-tab"]');
    
    // Check Stars balance display
    const balance = this.page.locator('[data-testid="stars-balance"]');
    await expect(balance).toBeVisible();
    
    // Test purchase flow
    await this.page.click('[data-testid="purchase-stars-button"]');
    
    // Should show payment dialog
    const paymentDialog = this.page.locator('[data-testid="payment-dialog"]');
    await expect(paymentDialog).toBeVisible();
  }

  async testUserProfile() {
    await this.page.click('[data-testid="profile-tab"]');
    
    // Check user information
    const userName = this.page.locator('[data-testid="user-name"]');
    const userProfile = this.page.locator('[data-testid="user-profile"]');
    
    await expect(userName).toBeVisible();
    await expect(userProfile).toBeVisible();
  }

  async testMobileResponsiveness() {
    await this.page.setViewportSize({ width: 375, height: 812 }); // iPhone X
    
    // Check mobile-specific elements
    const mobileNav = this.page.locator('[data-testid="mobile-nav"]');
    await expect(mobileNav).toBeVisible();
    
    // Test touch interactions
    const nftCard = this.page.locator('[data-testid^="nft-card-"]').first();
    await nftCard.tap();
    
    // Should open NFT details
    const nftDetails = this.page.locator('[data-testid="nft-details"]');
    await expect(nftDetails).toBeVisible();
  }

  async testPerformance() {
    // Measure page load time
    const startTime = Date.now();
    await this.navigate();
    await this.page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Should load within reasonable time
    expect(loadTime).toBeLessThan(5000);
    
    // Check for performance metrics
    const performance = await this.page.evaluate(() => ({
      memory: (performance as any).memory,
      timing: performance.timing,
    }));
    
    // Memory usage should be reasonable
    expect(performance.memory.usedJSHeapSize).toBeLessThan(50 * 1024 * 1024); // 50MB
  }

  async testAccessibility() {
    // Test keyboard navigation
    await this.page.keyboard.press('Tab');
    const firstFocusable = await this.page.locator(':focus');
    await expect(firstFocusable).toBeVisible();
    
    // Test screen reader compatibility
    const h1 = this.page.locator('h1');
    await expect(h1).toHaveAttribute('role', 'heading');
    
    // Check ARIA labels
    const buttons = this.page.locator('button');
    for (let i = 0; i < await buttons.count(); i++) {
      const button = buttons.nth(i);
      await expect(button).toHaveAttribute('aria-label');
    }
  }

  async testErrorHandling() {
    // Simulate network error
    await this.page.route('/api/**', route => route.abort());
    
    // Attempt to load data
    await this.navigate();
    
    // Should show error state
    const errorState = this.page.locator('[data-testid="error-state"]');
    await expect(errorState).toBeVisible();
    
    // Test retry functionality
    await this.page.unroute('/api/**');
    await this.page.click('[data-testid="retry-button"]');
    
    // Should recover successfully
    const content = this.page.locator('[data-testid="app-content"]');
    await expect(content).toBeVisible();
  }
}

test.describe('Telegram Mini App E2E', () => {
  let miniAppPage: TelegramMiniAppPage;

  test.beforeEach(async ({ page }) => {
    miniAppPage = new TelegramMiniAppPage(page);
    
    // Mock Telegram WebApp API
    await page.addInitScript(() => {
      window.Telegram = {
        WebApp: {
          ready: () => {},
          expand: () => {},
          initData: 'test_data',
          initDataUnsafe: {
            user: {
              id: 12345,
              first_name: 'Test',
              last_name: 'User',
            },
          },
          colorScheme: 'light',
          themeParams: {
            bg_color: '#1c1c1c',
            text_color: '#ffffff',
          },
          MainButton: {
            text: 'Main Button',
            onClick: () => {},
            show: () => {},
            hide: () => {},
            setText: () => {},
          },
          BackButton: {
            show: () => {},
            hide: () => {},
            onClick: () => {},
          },
          HapticFeedback: {
            impactOccurred: () => {},
            notificationOccurred: () => {},
            selectionChanged: () => {},
          },
        },
      };
    });
  });

  test('should load Telegram Mini App successfully', async ({ page }) => {
    await miniAppPage.navigate();
    await miniAppPage.checkTelegramWebView();
  });

  test('should display and navigate music gallery', async ({ page }) => {
    await miniAppPage.navigate();
    await miniAppPage.testMusicGallery();
  });

  test('should handle wallet integration', async ({ page }) => {
    await miniAppPage.navigate();
    await miniAppPage.testWalletIntegration();
  });

  test('should handle Stars payments', async ({ page }) => {
    await miniAppPage.navigate();
    await miniAppPage.testStarsPayments();
  });

  test('should display user profile', async ({ page }) => {
    await miniAppPage.navigate();
    await miniAppPage.testUserProfile();
  });

  test('should be mobile responsive', async ({ page }) => {
    await miniAppPage.navigate();
    await miniAppPage.testMobileResponsiveness();
  });

  test('should load within performance budget', async ({ page }) => {
    await miniAppPage.testPerformance();
  });

  test('should meet accessibility standards', async ({ page }) => {
    await miniAppPage.navigate();
    await miniAppPage.testAccessibility();
  });

  test('should handle errors gracefully', async ({ page }) => {
    await miniAppPage.testErrorHandling();
  });
});

test.describe('Telegram Mini App Payment Flow', () => {
  let miniAppPage: TelegramMiniAppPage;

  test.beforeEach(async ({ page }) => {
    miniAppPage = new TelegramMiniAppPage(page);
    
    await page.addInitScript(() => {
      // Enhanced payment mock
      window.Telegram = {
        WebApp: {
          ...window.Telegram?.WebApp,
          openInvoice: (url, callback) => {
            // Simulate payment process
            setTimeout(() => callback('paid'), 1000);
          },
          openLink: (url) => {
            window.open(url, '_blank');
          },
        },
      };
    });
  });

  test('should complete Stars payment flow', async ({ page }) => {
    await miniAppPage.navigate();
    
    // Navigate to payments
    await miniAppPage.testStarsPayments();
    
    // Select amount
    await page.click('[data-testid="stars-amount-100"]');
    
    // Initiate payment
    await page.click('[data-testid="purchase-button"]');
    
    // Handle payment dialog
    await page.waitForSelector('[data-testid="invoice-modal"]');
    
    // Confirm payment
    await page.click('[data-testid="confirm-payment"]');
    
    // Verify success
    await page.waitForSelector('[data-testid="payment-success"]');
    const successMessage = page.locator('[data-testid="payment-success"]');
    await expect(successMessage).toContainText('Payment successful');
  });

  test('should handle cancelled payments', async ({ page }) => {
    await miniAppPage.navigate();
    await miniAppPage.testStarsPayments();
    
    await page.click('[data-testid="purchase-button"]');
    await page.click('[data-testid="cancel-payment"]');
    
    // Should return to app state
    const backButton = page.locator('[data-testid="back-button"]');
    await expect(backButton).toBeVisible();
  });
});

test.describe('Telegram Mini App Offline Support', () => {
  test('should work in offline mode', async ({ page }) => {
    const miniAppPage = new TelegramMiniAppPage(page);
    
    // Simulate offline mode
    await page.route('**', route => route.fulfill());
    
    await miniAppPage.navigate();
    
    // Should show cached content
    const cachedContent = page.locator('[data-testid="cached-content"]');
    await expect(cachedContent).toBeVisible();
  });

  test('should sync when back online', async ({ page }) => {
    const miniAppPage = new TelegramMiniAppPage(page);
    
    // Start offline
    await page.route('**', route => route.fulfill());
    await miniAppPage.navigate();
    
    // Go back online
    await page.unroute('**');
    await page.reload();
    
    // Should sync and show updated content
    const syncStatus = page.locator('[data-testid="sync-status"]');
    await expect(syncStatus).toContainText('Online');
  });
});
