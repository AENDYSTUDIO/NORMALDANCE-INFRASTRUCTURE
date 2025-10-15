import { TelegramWebApp } from '@twa-dev/types'

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
  photo_url?: string
}

export interface TelegramWebAppData {
  query_id: string
  user: TelegramUser
  auth_date: number
  hash: string
}

export interface TelegramMiniAppConfig {
  appId: string
  appHash: string
  botToken: string
  webAppUrl: string
  isTestMode: boolean
}

export interface TelegramStarsConfig {
  enabled: boolean
  minAmount: number
  maxAmount: number
  currency: string
  commissionRate: number
}

export interface TelegramPartnershipMetrics {
  totalUsers: number
  activeUsers: number
  revenue: number
  starsEarned: number
  conversionRate: number
  retentionRate: number
  averageSessionTime: number
  userSatisfaction: number
}

export class TelegramPartnership {
  private webApp: TelegramWebApp | null = null
  private config: TelegramMiniAppConfig | null = null
  private starsConfig: TelegramStarsConfig | null = null
  private metrics: TelegramPartnershipMetrics | null = null

  constructor() {
    this.initializeTelegramWebApp()
  }

  // Инициализация Telegram Web App
  private initializeTelegramWebApp() {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      this.webApp = window.Telegram.WebApp
      this.webApp.ready()
      this.webApp.expand()
    }
  }

  // Инициализация конфигурации
  async initialize(config: TelegramMiniAppConfig, starsConfig: TelegramStarsConfig): Promise<void> {
    this.config = config
    this.starsConfig = starsConfig
    
    // Валидация конфигурации
    if (!config.appId || !config.appHash || !config.botToken) {
      throw new Error('Invalid Telegram Mini App configuration')
    }

    // Инициализация метрик
    await this.loadMetrics()
  }

  // Получение данных пользователя Telegram
  getTelegramUser(): TelegramUser | null {
    if (!this.webApp) return null
    
    return this.webApp.initDataUnsafe?.user || null
  }

  // Получение данных Web App
  getWebAppData(): TelegramWebAppData | null {
    if (!this.webApp) return null
    
    return this.webApp.initDataUnsafe as TelegramWebAppData || null
  }

  // Проверка авторизации
  isAuthenticated(): boolean {
    return this.getTelegramUser() !== null
  }

  // Получение токена авторизации
  getAuthToken(): string | null {
    if (!this.webApp) return null
    
    return this.webApp.initData || null
  }

  // Валидация данных Telegram
  async validateTelegramData(data: string): Promise<boolean> {
    if (!this.config) return false
    
    try {
      // В реальном проекте здесь будет валидация подписи
      // Для демонстрации возвращаем true
      return true
    } catch (error) {
      console.error('Error validating Telegram data:', error)
      return false
    }
  }

  // Синхронизация пользователя с Telegram
  async syncUserWithTelegram(userId: string): Promise<{
    success: boolean
    telegramUserId?: number
    error?: string
  }> {
    try {
      const telegramUser = this.getTelegramUser()
      if (!telegramUser) {
        return { success: false, error: 'No Telegram user data' }
      }

      // Отправляем данные на сервер для синхронизации
      const response = await fetch('/api/telegram/sync-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          telegramUser,
          authToken: this.getAuthToken()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to sync user with Telegram')
      }

      const result = await response.json()
      return { success: true, telegramUserId: telegramUser.id }
    } catch (error) {
      console.error('Error syncing user with Telegram:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // Настройка Telegram Stars
  async setupTelegramStars(): Promise<boolean> {
    if (!this.starsConfig || !this.webApp) return false
    
    try {
      // Инициализация Telegram Stars
      if (this.webApp.MainButton) {
        this.webApp.MainButton.setText('Купить за Stars')
        this.webApp.MainButton.show()
      }

      return true
    } catch (error) {
      console.error('Error setting up Telegram Stars:', error)
      return false
    }
  }

  // Покупка за Telegram Stars
  async purchaseWithStars(amount: number, description: string): Promise<{
    success: boolean
    transactionId?: string
    error?: string
  }> {
    if (!this.starsConfig || !this.webApp) {
      return { success: false, error: 'Telegram Stars not configured' }
    }

    if (amount < this.starsConfig.minAmount || amount > this.starsConfig.maxAmount) {
      return { 
        success: false, 
        error: `Amount must be between ${this.starsConfig.minAmount} and ${this.starsConfig.maxAmount}` 
      }
    }

    try {
      // В реальном проекте здесь будет интеграция с Telegram Stars API
      // Для демонстрации симулируем успешную покупку
      const transactionId = `stars_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Обновляем метрики
      await this.updateMetrics({
        starsEarned: amount,
        revenue: amount * this.starsConfig.commissionRate
      })

      return { success: true, transactionId }
    } catch (error) {
      console.error('Error purchasing with Telegram Stars:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // Отправка уведомлений через Telegram
  async sendTelegramNotification(
    userId: number,
    message: string,
    options?: {
      parse_mode?: 'HTML' | 'Markdown'
      disable_web_page_preview?: boolean
      disable_notification?: boolean
    }
  ): Promise<boolean> {
    if (!this.config) return false

    try {
      const response = await fetch('/api/telegram/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          message,
          ...options
        })
      })

      return response.ok
    } catch (error) {
      console.error('Error sending Telegram notification:', error)
      return false
    }
  }

  // Получение статистики партнерства
  async getPartnershipMetrics(): Promise<TelegramPartnershipMetrics | null> {
    if (!this.metrics) {
      await this.loadMetrics()
    }
    
    return this.metrics
  }

  // Загрузка метрик
  private async loadMetrics(): Promise<void> {
    try {
      const response = await fetch('/api/telegram/metrics')
      if (response.ok) {
        this.metrics = await response.json()
      }
    } catch (error) {
      console.error('Error loading Telegram metrics:', error)
    }
  }

  // Обновление метрик
  private async updateMetrics(updates: Partial<TelegramPartnershipMetrics>): Promise<void> {
    if (!this.metrics) {
      this.metrics = {
        totalUsers: 0,
        activeUsers: 0,
        revenue: 0,
        starsEarned: 0,
        conversionRate: 0,
        retentionRate: 0,
        averageSessionTime: 0,
        userSatisfaction: 0
      }
    }

    this.metrics = { ...this.metrics, ...updates }

    // Отправляем обновления на сервер
    try {
      await fetch('/api/telegram/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.metrics)
      })
    } catch (error) {
      console.error('Error updating Telegram metrics:', error)
    }
  }

  // Получение конфигурации Mini App
  getMiniAppConfig(): TelegramMiniAppConfig | null {
    return this.config
  }

  // Получение конфигурации Stars
  getStarsConfig(): TelegramStarsConfig | null {
    return this.starsConfig
  }

  // Проверка поддержки функций
  supportsStars(): boolean {
    return this.starsConfig?.enabled || false
  }

  supportsNotifications(): boolean {
    return this.webApp?.isVersionAtLeast('6.0') || false
  }

  supportsHapticFeedback(): boolean {
    return this.webApp?.isVersionAtLeast('6.1') || false
  }

  // Тактильная обратная связь
  hapticFeedback(type: 'impact' | 'notification' | 'selection' = 'impact'): void {
    if (this.webApp?.HapticFeedback) {
      switch (type) {
        case 'impact':
          this.webApp.HapticFeedback.impactOccurred('medium')
          break
        case 'notification':
          this.webApp.HapticFeedback.notificationOccurred('success')
          break
        case 'selection':
          this.webApp.HapticFeedback.selectionChanged()
          break
      }
    }
  }

  // Закрытие Mini App
  closeMiniApp(): void {
    if (this.webApp) {
      this.webApp.close()
    }
  }

  // Получение темы
  getTheme(): 'light' | 'dark' | 'auto' {
    if (!this.webApp) return 'auto'
    
    return this.webApp.colorScheme || 'auto'
  }

  // Получение языка
  getLanguage(): string {
    if (!this.webApp) return 'en'
    
    return this.webApp.initDataUnsafe?.user?.language_code || 'en'
  }

  // Получение платформы
  getPlatform(): string {
    if (!this.webApp) return 'unknown'
    
    return this.webApp.platform || 'unknown'
  }

  // Получение версии
  getVersion(): string {
    if (!this.webApp) return '0.0.0'
    
    return this.webApp.version || '0.0.0'
  }

  // Проверка версии
  isVersionAtLeast(version: string): boolean {
    if (!this.webApp) return false
    
    return this.webApp.isVersionAtLeast(version)
  }

  // Получение данных инициализации
  getInitData(): string | null {
    if (!this.webApp) return null
    
    return this.webApp.initData || null
  }

  // Получение небезопасных данных инициализации
  getInitDataUnsafe(): Record<string, unknown> {
    if (!this.webApp) return null
    
    return this.webApp.initDataUnsafe || null
  }

  // Получение параметров запуска
  getLaunchParams(): Record<string, unknown> {
    if (!this.webApp) return null
    
    return this.webApp.initDataUnsafe?.start_param || null
  }

  // Получение реферальных данных
  getReferralData(): {
    ref?: string
    start_param?: string
  } | null {
    if (!this.webApp) return null
    
    const initData = this.getInitDataUnsafe()
    return {
      ref: initData?.ref,
      start_param: initData?.start_param
    }
  }

  // Отправка данных в Telegram
  sendData(data: string | Record<string, unknown>): void {
    if (this.webApp) {
      this.webApp.sendData(JSON.stringify(data))
    }
  }

  // Открытие ссылки
  openLink(url: string, options?: {
    try_instant_view?: boolean
  }): void {
    if (this.webApp) {
      this.webApp.openLink(url, options)
    }
  }

  // Открытие телефона
  openTelegramLink(url: string): void {
    if (this.webApp) {
      this.webApp.openTelegramLink(url)
    }
  }

  // Открытие инвойса
  openInvoice(url: string, callback?: (status: string) => void): void {
    if (this.webApp) {
      this.webApp.openInvoice(url, callback)
    }
  }

  // Показ всплывающего окна
  showPopup(params: {
    title?: string
    message: string
    buttons?: Array<{
      id?: string
      type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive'
      text?: string
    }>
  }, callback?: (buttonId: string) => void): void {
    if (this.webApp) {
      this.webApp.showPopup(params, callback)
    }
  }

  // Показ алерта
  showAlert(message: string, callback?: () => void): void {
    if (this.webApp) {
      this.webApp.showAlert(message, callback)
    }
  }

  // Показ подтверждения
  showConfirm(message: string, callback?: (confirmed: boolean) => void): void {
    if (this.webApp) {
      this.webApp.showConfirm(message, callback)
    }
  }

  // Показ сканера QR
  showScanQrPopup(params: {
    text?: string
  }, callback?: (text: string) => void): void {
    if (this.webApp) {
      this.webApp.showScanQrPopup(params, callback)
    }
  }

  // Закрытие сканера QR
  closeScanQrPopup(): void {
    if (this.webApp) {
      this.webApp.closeScanQrPopup()
    }
  }

  // Показ кнопки
  showMainButton(): void {
    if (this.webApp?.MainButton) {
      this.webApp.MainButton.show()
    }
  }

  // Скрытие кнопки
  hideMainButton(): void {
    if (this.webApp?.MainButton) {
      this.webApp.MainButton.hide()
    }
  }

  // Установка текста кнопки
  setMainButtonText(text: string): void {
    if (this.webApp?.MainButton) {
      this.webApp.MainButton.setText(text)
    }
  }

  // Установка цвета кнопки
  setMainButtonColor(color: string): void {
    if (this.webApp?.MainButton) {
      this.webApp.MainButton.setParams({ color })
    }
  }

  // Установка обработчика кнопки
  setMainButtonClickHandler(handler: () => void): void {
    if (this.webApp?.MainButton) {
      this.webApp.MainButton.onClick(handler)
    }
  }

  // Показ кнопки назад
  showBackButton(): void {
    if (this.webApp?.BackButton) {
      this.webApp.BackButton.show()
    }
  }

  // Скрытие кнопки назад
  hideBackButton(): void {
    if (this.webApp?.BackButton) {
      this.webApp.BackButton.hide()
    }
  }

  // Установка обработчика кнопки назад
  setBackButtonClickHandler(handler: () => void): void {
    if (this.webApp?.BackButton) {
      this.webApp.BackButton.onClick(handler)
    }
  }

  // Установка заголовка
  setHeaderColor(color: string): void {
    if (this.webApp) {
      this.webApp.setHeaderColor(color)
    }
  }

  // Установка цвета фона
  setBackgroundColor(color: string): void {
    if (this.webApp) {
      this.webApp.setBackgroundColor(color)
    }
  }

  // Включение/выключение вертикального скролла
  enableVerticalSwipes(): void {
    if (this.webApp) {
      this.webApp.enableVerticalSwipes()
    }
  }

  // Отключение вертикального скролла
  disableVerticalSwipes(): void {
    if (this.webApp) {
      this.webApp.disableVerticalSwipes()
    }
  }

  // Включение/выключение закрытия по свайпу
  enableClosingConfirmation(): void {
    if (this.webApp) {
      this.webApp.enableClosingConfirmation()
    }
  }

  // Отключение подтверждения закрытия
  disableClosingConfirmation(): void {
    if (this.webApp) {
      this.webApp.disableClosingConfirmation()
    }
  }

  // Получение информации о приложении
  getAppInfo(): {
    version: string
    platform: string
    colorScheme: string
    themeParams: Record<string, unknown>
    isExpanded: boolean
    viewportHeight: number
    viewportStableHeight: number
    headerColor: string
    backgroundColor: string
    isClosingConfirmationEnabled: boolean
  } | null {
    if (!this.webApp) return null
    
    return {
      version: this.webApp.version,
      platform: this.webApp.platform,
      colorScheme: this.webApp.colorScheme,
      themeParams: this.webApp.themeParams,
      isExpanded: this.webApp.isExpanded,
      viewportHeight: this.webApp.viewportHeight,
      viewportStableHeight: this.webApp.viewportStableHeight,
      headerColor: this.webApp.headerColor,
      backgroundColor: this.webApp.backgroundColor,
      isClosingConfirmationEnabled: this.webApp.isClosingConfirmationEnabled
    }
  }
}

// Экспорт глобального экземпляра
export const telegramPartnership = new TelegramPartnership()
