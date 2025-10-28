import { Keypair, PublicKey, Transaction, Connection } from '@solana/web3.js';
import { WalletAdapter } from '../../components/wallet/wallet-adapter';
import { SecurityManager } from './security-manager';
import { Logger } from '../utils/logger';

/**
 * Менеджер аудита безопасности Invisible Wallet
 * Проверяет безопасность хранения ключей, валидацию криптографических операций,
 * целостность транзакций и мониторит подозрительную активность
 */
export class SecurityAuditManager {
  private logger: Logger;
  private securityManager: SecurityManager;
  private suspiciousActivityThreshold: number = 5; // порог подозрительной активности
  private activityLog: Map<string, number> = new Map();
  private transactionIntegrityChecks: Map<string, boolean> = new Map();

  constructor() {
    this.logger = new Logger('SecurityAuditManager');
    this.securityManager = new SecurityManager();
  }

  /**
   * Проверка безопасности хранения ключей
   * @param keypair - Keypair для проверки
   * @returns Результат проверки безопасности
   */
  async auditKeyStorage(keypair: Keypair): Promise<{ secure: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    try {
      // Проверка, что ключи не хранятся в открытом виде
      if (keypair.secretKey) {
        // Проверка на утечку в памяти
        if (this.securityManager.isKeyExposed(keypair)) {
          issues.push('Private key is exposed in memory');
        }
        
        // Проверка безопасности хранения
        if (!this.securityManager.isSecureStorage(keypair)) {
          issues.push('Key is not stored securely');
        }
      }

      // Проверка соответствия публичного и приватного ключа
      if (!this.securityManager.verifyKeyPair(keypair)) {
        issues.push('Public and private key do not match');
      }

      // Проверка подлинности ключа
      if (!this.securityManager.isAuthenticKey(keypair)) {
        issues.push('Key is not authentic');
      }

      this.logger.info(`Key storage audit completed. Issues found: ${issues.length}`);
      return { secure: issues.length === 0, issues };
    } catch (error) {
      this.logger.error('Error during key storage audit', error);
      return { secure: false, issues: ['Error during key storage audit'] };
    }
  }

  /**
   * Валидация криптографических операций
   * @param transaction - Транзакция для валидации
   * @param publicKey - Публичный ключ владельца
   * @returns Результат валидации
   */
  async auditCryptoOperations(transaction: Transaction, publicKey: PublicKey): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    try {
      // Проверка подписи транзакции
      if (!transaction.signatures.some(sig => sig.publicKey.equals(publicKey))) {
        issues.push('Transaction not signed by expected public key');
      }

      // Проверка целостности транзакции
      if (!this.securityManager.verifyTransactionIntegrity(transaction)) {
        issues.push('Transaction integrity compromised');
      }

      // Проверка криптографической подписи
      if (!this.securityManager.isValidSignature(transaction, publicKey)) {
        issues.push('Invalid cryptographic signature');
      }

      // Проверка на повторное воспроизведение
      if (this.securityManager.isReplayAttack(transaction)) {
        issues.push('Potential replay attack detected');
      }

      this.logger.info(`Crypto operations audit completed. Issues found: ${issues.length}`);
      return { valid: issues.length === 0, issues };
    } catch (error) {
      this.logger.error('Error during crypto operations audit', error);
      return { valid: false, issues: ['Error during crypto operations audit'] };
    }
  }

  /**
   * Проверка целостности транзакций
   * @param transaction - Транзакция для проверки
   * @param connection - Подключение к Solana
   * @returns Результат проверки целостности
   */
  async auditTransactionIntegrity(transaction: Transaction, connection: Connection): Promise<{ intact: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    try {
      // Проверка хэша транзакции
      const serializedTx = transaction.serialize();
      const txHash = serializedTx.toString('hex');
      
      if (this.transactionIntegrityChecks.has(txHash)) {
        // Проверка на дубликат
        issues.push('Duplicate transaction detected');
      } else {
        this.transactionIntegrityChecks.set(txHash, true);
      }

      // Проверка на изменение после подписания
      if (this.securityManager.isTransactionModified(transaction)) {
        issues.push('Transaction was modified after signing');
      }

      // Проверка синтаксиса транзакции
      if (!this.securityManager.isValidTransactionSyntax(transaction)) {
        issues.push('Transaction syntax is invalid');
      }

      // Проверка на корректность инструкций
      if (!this.securityManager.areInstructionsValid(transaction)) {
        issues.push('Transaction instructions are invalid');
      }

      this.logger.info(`Transaction integrity audit completed. Issues found: ${issues.length}`);
      return { intact: issues.length === 0, issues };
    } catch (error) {
      this.logger.error('Error during transaction integrity audit', error);
      return { intact: false, issues: ['Error during transaction integrity audit'] };
    }
  }

  /**
   * Мониторинг подозрительной активности
   * @param activityType - Тип активности
   * @param publicKey - Публичный ключ пользователя
   * @returns Результат мониторинга
   */
  async monitorSuspiciousActivity(activityType: string, publicKey: PublicKey): Promise<{ suspicious: boolean; riskLevel: 'low' | 'medium' | 'high' }> {
    const publicKeyStr = publicKey.toBase58();
    const currentTime = Date.now();
    
    // Добавляем активность в лог
    if (!this.activityLog.has(publicKeyStr)) {
      this.activityLog.set(publicKeyStr, 1);
    } else {
      const count = this.activityLog.get(publicKeyStr)! + 1;
      this.activityLog.set(publicKeyStr, count);
    }

    // Проверяем порог подозрительной активности
    const activityCount = this.activityLog.get(publicKeyStr)!;
    const riskLevel = activityCount >= this.suspiciousActivityThreshold * 2 ? 'high' :
                     activityCount >= this.suspiciousActivityThreshold ? 'medium' : 'low';

    const isSuspicious = riskLevel !== 'low';
    
    this.logger.info(`Monitoring suspicious activity for ${publicKeyStr}. Risk level: ${riskLevel}`);
    
    // Очищаем лог активности каждые 10 минут
    if (currentTime % 600000 < 1000) { // 10 минут = 60000 мс
      this.activityLog.clear();
    }

    return { suspicious: isSuspicious, riskLevel };
  }

  /**
   * Проверка на подозрительные транзакции
   * @param transaction - Транзакция для проверки
   * @param walletAdapter - Адаптер кошелька
   * @returns Результат проверки
   */
  async auditSuspiciousTransactions(transaction: Transaction, walletAdapter: WalletAdapter): Promise<{ suspicious: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    try {
      // Проверка на необычные суммы
      const transactionAmount = this.securityManager.getTransactionAmount(transaction);
      if (transactionAmount > 1000) { // 1000 SOL - порог подозрительности
        issues.push('Unusually large transaction amount detected');
      }

      // Проверка на необычные адресаты
      const recipient = this.securityManager.getTransactionRecipient(transaction);
      if (recipient && this.securityManager.isUnusualRecipient(recipient)) {
        issues.push('Transaction to unusual recipient detected');
      }

      // Проверка частоты транзакций
      if (this.securityManager.isHighFrequencyTransaction()) {
        issues.push('High frequency transaction pattern detected');
      }

      // Проверка на аномалии в транзакции
      if (this.securityManager.hasTransactionAnomalies(transaction)) {
        issues.push('Transaction anomalies detected');
      }

      this.logger.info(`Suspicious transaction audit completed. Issues found: ${issues.length}`);
      return { suspicious: issues.length > 0, issues };
    } catch (error) {
      this.logger.error('Error during suspicious transaction audit', error);
      return { suspicious: true, issues: ['Error during suspicious transaction audit'] };
    }
  }

  /**
   * Полный аудит безопасности кошелька
   * @param walletAdapter - Адаптер кошелька
   * @returns Полный отчет об аудите
   */
  async performFullSecurityAudit(walletAdapter: WalletAdapter): Promise<{
    keyStorage: { secure: boolean; issues: string[] };
    cryptoOperations: { valid: boolean; issues: string[] };
    transactionIntegrity: { intact: boolean; issues: string[] };
    suspiciousActivity: { suspicious: boolean; riskLevel: 'low' | 'medium' | 'high' };
    suspiciousTransactions: { suspicious: boolean; issues: string[] };
  }> {
    this.logger.info('Starting full security audit');
    
    // Получаем данные для аудита
    const keypair = walletAdapter.keypair;
    const publicKey = walletAdapter.publicKey;
    const connection = walletAdapter.connection;
    
    // Выполняем все проверки
    const keyStorage = await this.auditKeyStorage(keypair!);
    const cryptoOperations = await this.auditCryptoOperations(new Transaction(), publicKey!);
    const transactionIntegrity = await this.auditTransactionIntegrity(new Transaction(), connection!);
    const suspiciousActivity = await this.monitorSuspiciousActivity('transaction', publicKey!);
    const suspiciousTransactions = await this.auditSuspiciousTransactions(new Transaction(), walletAdapter);
    
    this.logger.info('Full security audit completed');
    
    return {
      keyStorage,
      cryptoOperations,
      transactionIntegrity,
      suspiciousActivity,
      suspiciousTransactions
    };
  }

  /**
   * Сброс логов активности
   */
  resetActivityLogs(): void {
    this.activityLog.clear();
    this.transactionIntegrityChecks.clear();
    this.logger.info('Activity logs reset');
  }
}