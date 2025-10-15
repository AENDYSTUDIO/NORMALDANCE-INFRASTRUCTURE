/**
 * Система уведомлений для NormalDance
 * Поддержка push-уведомлений, email, in-app уведомлений
 */

import { EventEmitter } from 'events'

// Типы уведомлений
export enum NotificationType {
  LIKE = 'like',
  COMMENT = 'comment',
  FOLLOW = 'follow',
  PLAYLIST_ADD = 'playlist_add',
  REWARD = 'reward',
  ACHIEVEMENT = 'achievement',
  SYSTEM = 'system',
  MARKETING = 'marketing',
  SECURITY = 'security'
}

// Уровни важности
export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Статусы уведомлений
export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
  ARCHIVED = 'archived'
}

// Интерфейс уведомления
export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  priority: NotificationPriority
  status: NotificationStatus
  data?: Record<string, unknown>
  metadata?: {
    trackId?: string
    artistId?: string
    playlistId?: string
    rewardId?: string
    achievementId?: string
    actionUrl?: string
    imageUrl?: string
    timestamp?: Date
  }
  createdAt: Date
  readAt?: Date
  expiresAt?: Date
}

// Настройки уведомлений пользователя
export interface NotificationSettings {
  userId: string
  email: boolean
  push: boolean
  inApp: boolean
  preferences: {
    [key in NotificationType]?: {
      email: boolean
      push: boolean
      inApp: boolean
    }
  }
}

// Класс системы уведомлений
export class NotificationSystem extends EventEmitter {
  private notifications: Map<string, Notification> = new Map()
  private userSettings: Map<string, NotificationSettings> = new Map()
  private notificationHistory: Notification[] = []

  constructor() {
    super()
    this.initializeDefaultSettings()
  }

  /**
   * Инициализация настроек по умолчанию
   */
  private initializeDefaultSettings(): void {
    // Загрузка настроек из базы данных или установка по умолчанию
  }

  /**
   * Создание уведомления
   */
  async createNotification(
    notification: Omit<Notification, 'id' | 'createdAt' | 'status'>
  ): Promise<Notification> {
    const newNotification: Notification = {
      ...notification,
      id: this.generateId(),
      createdAt: new Date(),
      status: NotificationStatus.UNREAD
    }

    // Сохранение в памяти (в реальном приложении в базе данных)
    this.notifications.set(newNotification.id, newNotification)
    this.notificationHistory.push(newNotification)

    // Отправка уведомлений в соответствии с настройками пользователя
    await this.sendNotification(newNotification)

    // Эмитирование события
    this.emit('notification.created', newNotification)

    return newNotification
  }

  /**
   * Отправка уведомлений
   */
  private async sendNotification(notification: Notification): Promise<void> {
    const settings = this.getUserSettings(notification.userId)

    if (settings.inApp) {
      await this.sendInAppNotification(notification)
    }

    if (settings.push) {
      await this.sendPushNotification(notification)
    }

    if (settings.email) {
      await this.sendEmailNotification(notification)
    }
  }

  /**
   * Отправка in-app уведомления
   */
  private async sendInAppNotification(notification: Notification): Promise<void> {
    // В реальном приложении здесь будет логика отправки через WebSocket или SSE
    console.log(`In-app notification sent to user ${notification.userId}:`, notification)
    
    // Эмитирование события для frontend
    this.emit('notification.inapp', notification)
  }

  /**
   * Отправка push-уведомления
   */
  private async sendPushNotification(notification: Notification): Promise<void> {
    // В реальном приложении здесь будет интеграция с FCM, APN или другим сервисом
    console.log(`Push notification sent to user ${notification.userId}:`, notification)
    
    // Эмитирование события для frontend
    this.emit('notification.push', notification)
  }

  /**
   * Отправка email уведомления
   */
  private async sendEmailNotification(notification: Notification): Promise<void> {
    // В реальном приложении здесь будет интеграция с SendGrid, Mailgun или другим сервисом
    console.log(`Email notification sent to user ${notification.userId}:`, notification)
    
    // Эмитирование события для frontend
    this.emit('notification.email', notification)
  }

  /**
   * Получение уведомлений пользователя
   */
  getUserNotifications(userId: string, limit = 50, offset = 0): Notification[] {
    const userNotifications = this.notificationHistory
      .filter(n => n.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit)

    return userNotifications
  }

  /**
   * Получение непрочитанных уведомлений
   */
  getUnreadNotifications(userId: string): Notification[] {
    return this.getUserNotifications(userId).filter(n => n.status === NotificationStatus.UNREAD)
  }

  /**
   * Отметка уведомления как прочитанного
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const notification = this.notifications.get(notificationId)
    
    if (!notification || notification.userId !== userId) {
      return false
    }

    notification.status = NotificationStatus.READ
    notification.readAt = new Date()

    this.emit('notification.read', notification)
    return true
  }

  /**
   * Отметка всех уведомлений как прочитанных
   */
  async markAllAsRead(userId: string): Promise<number> {
    const unreadNotifications = this.getUnreadNotifications(userId)
    
    for (const notification of unreadNotifications) {
      await this.markAsRead(notification.id, userId)
    }

    return unreadNotifications.length
  }

  /**
   * Архивирование уведомления
   */
  async archiveNotification(notificationId: string, userId: string): Promise<boolean> {
    const notification = this.notifications.get(notificationId)
    
    if (!notification || notification.userId !== userId) {
      return false
    }

    notification.status = NotificationStatus.ARCHIVED

    this.emit('notification.archived', notification)
    return true
  }

  /**
   * Удаление уведомления
   */
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    const notification = this.notifications.get(notificationId)
    
    if (!notification || notification.userId !== userId) {
      return false
    }

    this.notifications.delete(notificationId)
    this.notificationHistory = this.notificationHistory.filter(n => n.id !== notificationId)

    this.emit('notification.deleted', notification)
    return true
  }

  /**
   * Получение настроек уведомлений пользователя
   */
  getUserSettings(userId: string): NotificationSettings {
    let settings = this.userSettings.get(userId)
    
    if (!settings) {
      settings = this.getDefaultSettings(userId)
      this.userSettings.set(userId, settings)
    }

    return settings
  }

  /**
   * Обновление настроек уведомлений
   */
  async updateNotificationSettings(userId: string, settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    const currentSettings = this.getUserSettings(userId)
    const updatedSettings = { ...currentSettings, ...settings }

    this.userSettings.set(userId, updatedSettings)

    // Эмитирование события
    this.emit('notification.settings.updated', { userId, settings: updatedSettings })

    return updatedSettings
  }

  /**
   * Получение настроек по умолчанию
   */
  private getDefaultSettings(userId: string): NotificationSettings {
    return {
      userId,
      email: true,
      push: true,
      inApp: true,
      preferences: {
        [NotificationType.LIKE]: { email: false, push: true, inApp: true },
        [NotificationType.COMMENT]: { email: false, push: true, inApp: true },
        [NotificationType.FOLLOW]: { email: false, push: true, inApp: true },
        [NotificationType.PLAYLIST_ADD]: { email: false, push: true, inApp: true },
        [NotificationType.REWARD]: { email: true, push: true, inApp: true },
        [NotificationType.ACHIEVEMENT]: { email: true, push: true, inApp: true },
        [NotificationType.SYSTEM]: { email: true, push: false, inApp: true },
        [NotificationType.MARKETING]: { email: true, push: false, inApp: false },
        [NotificationType.SECURITY]: { email: true, push: true, inApp: true }
      }
    }
  }

  /**
   * Очистка устаревших уведомлений
   */
  async cleanupExpiredNotifications(): Promise<number> {
    const now = new Date()
    const expiredNotifications = this.notificationHistory.filter(n => 
      n.expiresAt && n.expiresAt < now
    )

    for (const notification of expiredNotifications) {
      this.notifications.delete(notification.id)
      this.notificationHistory = this.notificationHistory.filter(n => n.id !== notification.id)
    }

    return expiredNotifications.length
  }

  /**
   * Получение статистики уведомлений
   */
  getNotificationStats(userId: string): {
    total: number
    unread: number
    read: number
    archived: number
    byType: { [key in NotificationType]?: number }
  } {
    const userNotifications = this.getUserNotifications(userId)
    
    const stats = {
      total: userNotifications.length,
      unread: userNotifications.filter(n => n.status === NotificationStatus.UNREAD).length,
      read: userNotifications.filter(n => n.status === NotificationStatus.READ).length,
      archived: userNotifications.filter(n => n.status === NotificationStatus.ARCHIVED).length,
      byType: {} as { [key in NotificationType]?: number }
    }

    // Подсчет по типам
    userNotifications.forEach(notification => {
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1
    })

    return stats
  }

  /**
   * Генерация ID
   */
  private generateId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Создание уведомления о лайке
   */
  async createLikeNotification(userId: string, trackId: string, likerName: string): Promise<Notification> {
    return this.createNotification({
      userId,
      type: NotificationType.LIKE,
      title: 'Новый лайк',
      message: `${likerName} оценил ваш трек`,
      priority: NotificationPriority.MEDIUM,
      metadata: {
        trackId,
        actionUrl: `/tracks/${trackId}`,
        imageUrl: '/placeholder-album.jpg'
      }
    })
  }

  /**
   * Создание уведомления о комментарии
   */
  async createCommentNotification(userId: string, trackId: string, commenterName: string, comment: string): Promise<Notification> {
    return this.createNotification({
      userId,
      type: NotificationType.COMMENT,
      title: 'Новый комментарий',
      message: `${commenterName}: ${comment}`,
      priority: NotificationPriority.MEDIUM,
      metadata: {
        trackId,
        actionUrl: `/tracks/${trackId}#comments`,
        imageUrl: '/placeholder-album.jpg'
      }
    })
  }

  /**
   * Создание уведомления о подписке
   */
  async createFollowNotification(userId: string, followerName: string): Promise<Notification> {
    return this.createNotification({
      userId,
      type: NotificationType.FOLLOW,
      title: 'Новый подписчик',
      message: `${followerName} подписался на вас`,
      priority: NotificationPriority.MEDIUM,
      metadata: {
        actionUrl: `/users/${followerName}`,
        imageUrl: '/placeholder-avatar.jpg'
      }
    })
  }

  /**
   * Создание уведомления о награде
   */
  async createRewardNotification(userId: string, rewardType: string, amount: number): Promise<Notification> {
    return this.createNotification({
      userId,
      type: NotificationType.REWARD,
      title: 'Получена награда',
      message: `Вы получили ${amount} NDT за ${rewardType}`,
      priority: NotificationPriority.HIGH,
      metadata: {
        rewardType,
        amount,
        actionUrl: '/rewards'
      }
    })
  }

  /**
   * Создание уведомления о достижении
   */
  async createAchievementNotification(userId: string, achievementName: string): Promise<Notification> {
    return this.createNotification({
      userId,
      type: NotificationType.ACHIEVEMENT,
      title: 'Новое достижение!',
      message: `Поздравляем! Вы разблокировали "${achievementName}"`,
      priority: NotificationPriority.HIGH,
      metadata: {
        achievementName,
        actionUrl: '/achievements'
      }
    })
  }

  /**
   * Создание системного уведомления
   */
  async createSystemNotification(userId: string, message: string, actionUrl?: string): Promise<Notification> {
    return this.createNotification({
      userId,
      type: NotificationType.SYSTEM,
      title: 'Системное уведомление',
      message,
      priority: NotificationPriority.HIGH,
      metadata: {
        actionUrl
      }
    })
  }

  /**
   * Создание маркетингового уведомления
   */
  async createMarketingNotification(userId: string, title: string, message: string, actionUrl: string): Promise<Notification> {
    return this.createNotification({
      userId,
      type: NotificationType.MARKETING,
      title,
      message,
      priority: NotificationPriority.LOW,
      metadata: {
        actionUrl
      }
    })
  }

  /**
   * Создание уведомления о безопасности
   */
  async createSecurityNotification(userId: string, message: string): Promise<Notification> {
    return this.createNotification({
      userId,
      type: NotificationType.SECURITY,
      title: 'Важное уведомление безопасности',
      message,
      priority: NotificationPriority.URGENT,
      metadata: {
        actionUrl: '/security'
      }
    })
  }
}

// Глобальный экземпляр системы уведомлений
export const notificationSystem = new NotificationSystem()

// Хуки для использования в React компонентах
export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [loading, setLoading] = useState(true)

  // Загрузка уведомлений
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const userNotifications = notificationSystem.getUserNotifications(userId)
      const unread = notificationSystem.getUnreadNotifications(userId).length
      const userSettings = notificationSystem.getUserSettings(userId)

      setNotifications(userNotifications)
      setUnreadCount(unread)
      setSettings(userSettings)
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Загрузка при монтировании
  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  // Подписка на события
  useEffect(() => {
    const handleNotificationCreated = (notification: Notification) => {
      if (notification.userId === userId) {
        loadNotifications()
      }
    }

    const handleNotificationRead = (notification: Notification) => {
      if (notification.userId === userId) {
        loadNotifications()
      }
    }

    notificationSystem.on('notification.created', handleNotificationCreated)
    notificationSystem.on('notification.read', handleNotificationRead)

    return () => {
      notificationSystem.off('notification.created', handleNotificationCreated)
      notificationSystem.off('notification.read', handleNotificationRead)
    }
  }, [userId, loadNotifications])

  // Функции для работы с уведомлениями
  const markAsRead = useCallback(async (notificationId: string) => {
    const success = await notificationSystem.markAsRead(notificationId, userId)
    if (success) {
      loadNotifications()
    }
    return success
  }, [userId, loadNotifications])

  const markAllAsRead = useCallback(async () => {
    const count = await notificationSystem.markAllAsRead(userId)
    loadNotifications()
    return count
  }, [userId, loadNotifications])

  const deleteNotification = useCallback(async (notificationId: string) => {
    const success = await notificationSystem.deleteNotification(notificationId, userId)
    if (success) {
      loadNotifications()
    }
    return success
  }, [userId, loadNotifications])

  const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
    const updated = await notificationSystem.updateNotificationSettings(userId, newSettings)
    setSettings(updated)
    return updated
  }, [userId])

  return {
    notifications,
    unreadCount,
    settings,
    loading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updateSettings
  }
}

export default NotificationSystem