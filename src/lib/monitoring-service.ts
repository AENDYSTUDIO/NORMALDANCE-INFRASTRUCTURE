import { checkFileAvailabilityOnMultipleGateways, getFileFromBestGateway } from './ipfs-enhanced'
import { filecoinService } from './filecoin-service'

// Интерфейс для метрик мониторинга
export interface MonitoringMetrics {
  timestamp: string
  totalFiles: number
  healthyFiles: number
  degradedFiles: number
  unhealthyFiles: number
  averageReplicationFactor: number
  totalStorage: number
  activeDeals: number
  failedUploads: number
  averageUploadTime: number
}

// Интерфейс для оповещения
export interface Alert {
  id: string
  type: 'health' | 'performance' | 'availability' | 'storage'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  timestamp: string
  resolved: boolean
  metadata?: Record<string, unknown>
}

// Сервис мониторинга
export class MonitoringService {
  private alerts: Alert[] = []
  private metrics: MonitoringMetrics[] = []
  private monitoringInterval: NodeJS.Timeout | null = null
  private readonly CHECK_INTERVAL = 5 * 60 * 1000 // 5 минут
  private readonly ALERT_THRESHOLD = {
    replicationFactor: 1,
    availability: 0.8, // 80%
    uploadFailureRate: 0.1, // 10%
  }

  // Запуск мониторинга
  startMonitoring(): void {
    console.log('Starting file monitoring service...')
    
    this.monitoringInterval = setInterval(async () => {
      await this.runMonitoringCycle()
    }, this.CHECK_INTERVAL)

    // Запускаем первый цикл немедленно
    this.runMonitoringCycle()
  }

  // Остановка мониторинга
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
      console.log('File monitoring service stopped')
    }
  }

  // Запуск цикла мониторинга
  private async runMonitoringCycle(): Promise<void> {
    try {
      console.log('Running monitoring cycle...')
      
      const metrics = await this.collectMetrics()
      this.metrics.push(metrics)
      
      // Проверяем метрики и создаем оповещения
      await this.checkMetrics(metrics)
      
      // Очищаем старые метрики (оставляем только последние 1000 записей)
      if (this.metrics.length > 1000) {
        this.metrics = this.metrics.slice(-1000)
      }
      
      console.log('Monitoring cycle completed')
    } catch (error) {
      console.error('Monitoring cycle failed:', error)
      this.createAlert('performance', 'high', 'Monitoring cycle failed', { error })
    }
  }

  // Сбор метрик
  private async collectMetrics(): Promise<MonitoringMetrics> {
    try {
      const startTime = Date.now()
      
      // Получаем все треки из базы данных
      const tracks = await this.getTracksFromDatabase()
      
      let healthyFiles = 0
      let degradedFiles = 0
      let unhealthyFiles = 0
      let totalReplicationFactor = 0
      let totalStorage = 0
      let failedUploads = 0
      const uploadTimes: number[] = []
      
      const fileChecks = tracks.map(async (track) => {
        try {
          // Проверяем доступность файла
          const availability = await checkFileAvailabilityOnMultipleGateways(track.ipfsHash)
          
          // Проверяем Filecoin статус
          const filecoinStatus = await filecoinService.checkFileAvailability(track.ipfsHash)
          
          // Обновляем статистику
          totalStorage += track.metadata?.fileSize || 0
          
          if (availability.available && filecoinStatus.available) {
            healthyFiles++
          } else if (availability.available || filecoinStatus.available) {
            degradedFiles++
          } else {
            unhealthyFiles++
          }
          
          totalReplicationFactor += availability.replicationFactor
          
          // Проверяем время загрузки (если есть данные)
          if (track.metadata?.uploadTime) {
            uploadTimes.push(track.metadata.uploadTime)
          }
          
        } catch (error) {
          console.warn(`Failed to check track ${track.id}:`, error)
          failedUploads++
        }
      })
      
      await Promise.all(fileChecks)
      
      // Получаем статистику по Filecoin сделкам
      const filecoinStats = await filecoinService.monitorDeals()
      
      const metrics: MonitoringMetrics = {
        timestamp: new Date().toISOString(),
        totalFiles: tracks.length,
        healthyFiles,
        degradedFiles,
        unhealthyFiles,
        averageReplicationFactor: tracks.length > 0 ? totalReplicationFactor / tracks.length : 0,
        totalStorage,
        activeDeals: filecoinStats.activeDeals,
        failedUploads,
        averageUploadTime: uploadTimes.length > 0 ? uploadTimes.reduce((a, b) => a + b, 0) / uploadTimes.length : 0,
      }
      
      return metrics
    } catch (error) {
      console.error('Failed to collect metrics:', error)
      throw error
    }
  }

  // Проверка метрик и создание оповещений
  private async checkMetrics(metrics: MonitoringMetrics): Promise<void> {
    // Проверяем коэффициент репликации
    if (metrics.averageReplicationFactor < this.ALERT_THRESHOLD.replicationFactor) {
      this.createAlert(
        'health',
        'medium',
        `Low replication factor: ${metrics.averageReplicationFactor.toFixed(2)}`,
        { averageReplicationFactor: metrics.averageReplicationFactor }
      )
    }
    
    // Проверяем доступность файлов
    const availabilityRatio = metrics.healthyFiles / metrics.totalFiles
    if (availabilityRatio < this.ALERT_THRESHOLD.availability) {
      this.createAlert(
        'availability',
        'high',
        `Low file availability: ${(availabilityRatio * 100).toFixed(1)}%`,
        { availabilityRatio, healthyFiles: metrics.healthyFiles, totalFiles: metrics.totalFiles }
      )
    }
    
    // Проверяем процент ошибок загрузки
    const failureRate = metrics.failedUploads / metrics.totalFiles
    if (failureRate > this.ALERT_THRESHOLD.uploadFailureRate) {
      this.createAlert(
        'performance',
        'high',
        `High upload failure rate: ${(failureRate * 100).toFixed(1)}%`,
        { failureRate, failedUploads: metrics.failedUploads, totalFiles: metrics.totalFiles }
      )
    }
    
    // Проверяем использование хранилища
    const storageGB = metrics.totalStorage / (1024 * 1024 * 1024)
    if (storageGB > 1000) { // Более 1TB
      this.createAlert(
        'storage',
        'medium',
        `High storage usage: ${storageGB.toFixed(2)}GB`,
        { storageGB }
      )
    }
  }

  // Создание оповещения
  private createAlert(type: Alert['type'], severity: Alert['severity'], message: string, metadata?: Record<string, unknown>): void {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      message,
      timestamp: new Date().toISOString(),
      resolved: false,
      metadata,
    }
    
    this.alerts.push(alert)
    console.log(`Alert created: [${severity.toUpperCase()}] ${message}`)
    
    // Оставляем только последние 100 оповещений
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100)
    }
  }

  // Получение треков из базы данных
  private async getTracksFromDatabase(): Promise<any[]> {
    try {
      // Здесь должна быть реальная логика получения треков из базы данных
      // Пока возвращаем пустой массив
      return []
    } catch (error) {
      console.error('Failed to get tracks from database:', error)
      return []
    }
  }

  // Получение текущих метрик
  getCurrentMetrics(): MonitoringMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null
  }

  // Получение истории метрик
  getMetricsHistory(hours: number = 24): MonitoringMetrics[] {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000)
    return this.metrics.filter(metric => new Date(metric.timestamp) > cutoffTime)
  }

  // Получение активных оповещений
  getActiveAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.resolved)
  }

  // Разрешение оповещения
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.resolved = true
      console.log(`Alert resolved: ${alertId}`)
      return true
    }
    return false
  }

  // Получение статистики по оповещениям
  getAlertStats(): {
    total: number
    resolved: number
    active: number
    byType: Record<string, number>
    bySeverity: Record<string, number>
  } {
    const byType: Record<string, number> = {}
    const bySeverity: Record<string, number> = {}
    
    this.alerts.forEach(alert => {
      byType[alert.type] = (byType[alert.type] || 0) + 1
      bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1
    })
    
    return {
      total: this.alerts.length,
      resolved: this.alerts.filter(a => a.resolved).length,
      active: this.alerts.filter(a => !a.resolved).length,
      byType,
      bySeverity,
    }
  }

  // Получение производительности загрузки
  async getUploadPerformance(): Promise<{
    averageTime: number
    successRate: number
    totalUploads: number
    failedUploads: number
  }> {
    try {
      const recentMetrics = this.getMetricsHistory(24) // Последние 24 часа
      
      if (recentMetrics.length === 0) {
        return {
          averageTime: 0,
          successRate: 0,
          totalUploads: 0,
          failedUploads: 0,
        }
      }
      
      const totalUploads = recentMetrics.reduce((sum, metric) => sum + metric.totalFiles, 0)
      const failedUploads = recentMetrics.reduce((sum, metric) => sum + metric.failedUploads, 0)
      const successRate = totalUploads > 0 ? (totalUploads - failedUploads) / totalUploads : 0
      const averageTime = recentMetrics.reduce((sum, metric) => sum + metric.averageUploadTime, 0) / recentMetrics.length
      
      return {
        averageTime,
        successRate,
        totalUploads,
        failedUploads,
      }
    } catch (error) {
      console.error('Failed to get upload performance:', error)
      return {
        averageTime: 0,
        successRate: 0,
        totalUploads: 0,
        failedUploads: 0,
      }
    }
  }

  // Получение здоровья системы
  async getSystemHealth(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy'
    fileHealth: 'healthy' | 'degraded' | 'unhealthy'
    storageHealth: 'healthy' | 'degraded' | 'unhealthy'
    dealHealth: 'healthy' | 'degraded' | 'unhealthy'
    metrics: MonitoringMetrics
  }> {
    const metrics = this.getCurrentMetrics()
    if (!metrics) {
      return {
        overall: 'unhealthy',
        fileHealth: 'unhealthy',
        storageHealth: 'unhealthy',
        dealHealth: 'unhealthy',
        metrics: {
          timestamp: new Date().toISOString(),
          totalFiles: 0,
          healthyFiles: 0,
          degradedFiles: 0,
          unhealthyFiles: 0,
          averageReplicationFactor: 0,
          totalStorage: 0,
          activeDeals: 0,
          failedUploads: 0,
          averageUploadTime: 0,
        },
      }
    }
    
    // Оценка здоровья файлов
    const fileHealthRatio = metrics.healthyFiles / metrics.totalFiles
    let fileHealth: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    if (fileHealthRatio < 0.8) fileHealth = 'unhealthy'
    else if (fileHealthRatio < 0.95) fileHealth = 'degraded'
    
    // Оценка здоровья хранилища
    const storageGB = metrics.totalStorage / (1024 * 1024 * 1024)
    let storageHealth: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    if (storageGB > 1000) storageHealth = 'unhealthy'
    else if (storageGB > 500) storageHealth = 'degraded'
    
    // Оценка здоровья сделок
    let dealHealth: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    if (metrics.activeDeals === 0) dealHealth = 'unhealthy'
    else if (metrics.failedUploads / metrics.totalFiles > 0.1) dealHealth = 'degraded'
    
    // Общая оценка здоровья
    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    const unhealthyComponents = [fileHealth, storageHealth, dealHealth].filter(h => h === 'unhealthy').length
    const degradedComponents = [fileHealth, storageHealth, dealHealth].filter(h => h === 'degraded').length
    
    if (unhealthyComponents > 0) overall = 'unhealthy'
    else if (degradedComponents > 0) overall = 'degraded'
    
    return {
      overall,
      fileHealth,
      storageHealth,
      dealHealth,
      metrics,
    }
  }
}

// Создание экземпляра сервиса
export const monitoringService = new MonitoringService()