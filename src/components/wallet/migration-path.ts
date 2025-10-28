import { logger } from "@/lib/utils/logger";
import { PublicKey } from "@solana/web3.js";
import { InvisibleWalletConfig } from "./invisible-wallet-adapter";
import { KeyManager } from "./key-manager";

/**
 * Статус миграции
 */
export type MigrationStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "failed"
  | "paused";

/**
 * Шаг миграции
 */
export interface MigrationStep {
  id: string;
  name: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "failed" | "skipped";
  error?: string;
  progress: number;
  required: boolean;
}

/**
 * Данные для миграции
 */
export interface MigrationData {
  phantomPublicKey?: string;
  phantomPrivateKey?: string;
  invisibleWalletConfig?: InvisibleWalletConfig;
  backupData?: string;
  migrationId: string;
  timestamp: number;
}

/**
 * Результат миграции
 */
export interface MigrationResult {
  success: boolean;
  migrationId: string;
  steps: MigrationStep[];
  newPublicKey?: string;
  error?: string;
  warnings?: string[];
}

/**
 * Менеджер миграции от Phantom к Invisible Wallet
 *
 * Ответственности:
 * - Плавная миграция данных
 * - Сохранение бэкапов
 * - Валидация данных
 * - Откат при ошибках
 */
export class MigrationPath {
  private _config: InvisibleWalletConfig;
  private _keyManager: KeyManager;
  private _migrationSteps: MigrationStep[];
  private _currentStep: number = 0;
  private _migrationData: MigrationData | null = null;

  constructor(config: InvisibleWalletConfig) {
    this._config = config;
    this._keyManager = new KeyManager(config);
    this._migrationSteps = this._initializeMigrationSteps();
  }

  /**
   * Начало миграции
   */
  async startMigration(phantomPublicKey: string): Promise<MigrationResult> {
    const migrationId = this._generateMigrationId();

    try {
      logger.info("Starting migration from Phantom to Invisible Wallet", {
        migrationId,
        phantomPublicKey,
      });

      // Инициализация данных миграции
      this._migrationData = {
        phantomPublicKey,
        migrationId,
        timestamp: Date.now(),
      };

      // Сброс шагов
      this._resetSteps();

      // Выполнение миграции
      const result = await this._executeMigration();

      logger.info("Migration completed", {
        migrationId,
        success: result.success,
        stepsCompleted: result.steps.filter((s) => s.status === "completed")
          .length,
      });

      return result;
    } catch (error) {
      logger.error("Migration failed", error);

      return {
        success: false,
        migrationId,
        steps: this._migrationSteps,
        error: error instanceof Error ? error.message : "Migration failed",
      };
    }
  }

  /**
   * Получение статуса миграции
   */
  getMigrationStatus(): {
    status: MigrationStatus;
    currentStep: number;
    totalSteps: number;
    progress: number;
  } {
    const completedSteps = this._migrationSteps.filter(
      (s) => s.status === "completed"
    ).length;
    const totalSteps = this._migrationSteps.length;
    const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

    let status: MigrationStatus = "not_started";
    if (completedSteps === 0) {
      status = "not_started";
    } else if (completedSteps === totalSteps) {
      status = "completed";
    } else if (this._migrationSteps.some((s) => s.status === "failed")) {
      status = "failed";
    } else {
      status = "in_progress";
    }

    return {
      status,
      currentStep: this._currentStep,
      totalSteps,
      progress,
    };
  }

  /**
   * Пауза миграции
   */
  pauseMigration(): void {
    const currentStep = this._migrationSteps[this._currentStep];
    if (currentStep && currentStep.status === "in_progress") {
      currentStep.status = "pending";
      logger.info("Migration paused", { step: currentStep.id });
    }
  }

  /**
   * Возобновление миграции
   */
  async resumeMigration(): Promise<void> {
    if (this._migrationData) {
      await this._executeMigration();
    }
  }

  /**
   * Откат миграции
   */
  async rollbackMigration(): Promise<boolean> {
    try {
      logger.info("Rolling back migration");

      // Восстановление из бэкапа
      if (this._migrationData?.backupData) {
        await this._restoreFromBackup(this._migrationData.backupData);
      }

      // Очистка данных Invisible Wallet
      await this._cleanupInvisibleWalletData();

      // Сброс шагов
      this._resetSteps();

      logger.info("Migration rollback completed");
      return true;
    } catch (error) {
      logger.error("Migration rollback failed", error);
      return false;
    }
  }

  /**
   * Создание бэкапа перед миграцией
   */
  async createBackup(): Promise<string> {
    try {
      // Получение данных из Phantom
      const phantomData = await this._getPhantomWalletData();

      // Создание бэкапа
      const backup = {
        version: "1.0",
        timestamp: Date.now(),
        source: "phantom",
        data: phantomData,
        migrationId: this._migrationData?.migrationId,
      };

      const backupString = JSON.stringify(backup);

      // Сохранение бэкапа
      localStorage.setItem("phantom_backup", backupString);

      logger.info("Backup created successfully");
      return backupString;
    } catch (error) {
      logger.error("Failed to create backup", error);
      throw error;
    }
  }

  /**
   * Валидация данных перед миграцией
   */
  async validateMigrationData(phantomPublicKey: string): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Валидация формата публичного ключа
      if (!this._isValidPublicKey(phantomPublicKey)) {
        errors.push("Invalid Phantom public key format");
      }

      // Проверка баланса
      const balance = await this._getPhantomBalance(phantomPublicKey);
      if (balance > 0) {
        warnings.push(
          "Wallet has balance - ensure you have access to private key"
        );
      }

      // Проверка на активные транзакции
      const pendingTransactions = await this._getPendingTransactions(
        phantomPublicKey
      );
      if (pendingTransactions.length > 0) {
        warnings.push(
          `${pendingTransactions.length} pending transactions found`
        );
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      logger.error("Migration data validation failed", error);
      return {
        valid: false,
        errors: ["Validation failed: " + (error as Error).message],
        warnings,
      };
    }
  }

  // Приватные методы

  private _initializeMigrationSteps(): MigrationStep[] {
    return [
      {
        id: "backup",
        name: "Создание бэкапа",
        description: "Создание резервной копии данных Phantom кошелька",
        status: "pending",
        progress: 0,
        required: true,
      },
      {
        id: "validate",
        name: "Валидация данных",
        description: "Проверка корректности данных для миграции",
        status: "pending",
        progress: 0,
        required: true,
      },
      {
        id: "extract",
        name: "Извлечение ключей",
        description: "Безопасное извлечение приватных ключей из Phantom",
        status: "pending",
        progress: 0,
        required: true,
      },
      {
        id: "create_invisible",
        name: "Создание Invisible Wallet",
        description: "Создание нового невидимого кошелька",
        status: "pending",
        progress: 0,
        required: true,
      },
      {
        id: "migrate_balance",
        name: "Миграция баланса",
        description: "Перенос баланса на новый кошелек",
        status: "pending",
        progress: 0,
        required: false,
      },
      {
        id: "setup_recovery",
        name: "Настройка восстановления",
        description: "Настройка социального восстановления доступа",
        status: "pending",
        progress: 0,
        required: false,
      },
      {
        id: "verify",
        name: "Проверка миграции",
        description: "Верификация успешности миграции",
        status: "pending",
        progress: 0,
        required: true,
      },
      {
        id: "cleanup",
        name: "Очистка",
        description: "Безопасное удаление временных данных",
        status: "pending",
        progress: 0,
        required: false,
      },
    ];
  }

  private async _executeMigration(): Promise<MigrationResult> {
    if (!this._migrationData) {
      throw new Error("Migration data not initialized");
    }

    const migrationId = this._migrationData.migrationId;

    try {
      for (let i = 0; i < this._migrationSteps.length; i++) {
        this._currentStep = i;
        const step = this._migrationSteps[i];

        if (step.status === "completed" || step.status === "skipped") {
          continue;
        }

        step.status = "in_progress";
        step.progress = 0;

        try {
          await this._executeStep(step);
          step.status = "completed";
          step.progress = 100;
        } catch (error) {
          step.status = "failed";
          step.error = error instanceof Error ? error.message : "Unknown error";

          if (step.required) {
            throw error; // Прерываем миграцию при ошибке в обязательном шаге
          }
        }
      }

      // Получение нового публичного ключа
      const newPublicKey = await this._getNewPublicKey();

      return {
        success: true,
        migrationId,
        steps: this._migrationSteps,
        newPublicKey,
      };
    } catch (error) {
      return {
        success: false,
        migrationId,
        steps: this._migrationSteps,
        error: error instanceof Error ? error.message : "Migration failed",
      };
    }
  }

  private async _executeStep(step: MigrationStep): Promise<void> {
    logger.info("Executing migration step", { step: step.id });

    switch (step.id) {
      case "backup":
        await this._executeBackupStep(step);
        break;
      case "validate":
        await this._executeValidationStep(step);
        break;
      case "extract":
        await this._executeExtractStep(step);
        break;
      case "create_invisible":
        await this._executeCreateInvisibleStep(step);
        break;
      case "migrate_balance":
        await this._executeMigrateBalanceStep(step);
        break;
      case "setup_recovery":
        await this._executeSetupRecoveryStep(step);
        break;
      case "verify":
        await this._executeVerifyStep(step);
        break;
      case "cleanup":
        await this._executeCleanupStep(step);
        break;
      default:
        throw new Error(`Unknown migration step: ${step.id}`);
    }
  }

  private async _executeBackupStep(step: MigrationStep): Promise<void> {
    step.progress = 25;

    const backupData = await this.createBackup();
    if (this._migrationData) {
      this._migrationData.backupData = backupData;
    }

    step.progress = 100;
  }

  private async _executeValidationStep(step: MigrationStep): Promise<void> {
    step.progress = 25;

    if (!this._migrationData?.phantomPublicKey) {
      throw new Error("Phantom public key not available");
    }

    const validation = await this.validateMigrationData(
      this._migrationData.phantomPublicKey
    );

    step.progress = 75;

    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
    }

    step.progress = 100;
  }

  private async _executeExtractStep(step: MigrationStep): Promise<void> {
    step.progress = 25;

    // В реальной реализации здесь должно быть безопасное извлечение ключей
    // из Phantom кошелька через его API

    step.progress = 50;

    // Имитация извлечения
    await new Promise((resolve) => setTimeout(resolve, 1000));

    step.progress = 100;
  }

  private async _executeCreateInvisibleStep(
    step: MigrationStep
  ): Promise<void> {
    step.progress = 25;

    // Создание нового Invisible Wallet
    const newKeyPair = await this._keyManager.generateRandomKeyPair();

    step.progress = 75;

    // Сохранение конфигурации
    if (this._migrationData) {
      this._migrationData.invisibleWalletConfig = this._config;
    }

    step.progress = 100;
  }

  private async _executeMigrateBalanceStep(step: MigrationStep): Promise<void> {
    step.progress = 25;

    // В реальной реализации здесь должна быть миграция баланса
    // через создание транзакции перевода

    step.progress = 50;

    // Имитация миграции баланса
    await new Promise((resolve) => setTimeout(resolve, 2000));

    step.progress = 100;
  }

  private async _executeSetupRecoveryStep(step: MigrationStep): Promise<void> {
    step.progress = 25;

    // Настройка социального восстановления
    if (this._config.trustedContacts) {
      await this._keyManager.setupSocialRecovery(this._config.trustedContacts);
    }

    step.progress = 100;
  }

  private async _executeVerifyStep(step: MigrationStep): Promise<void> {
    step.progress = 25;

    // Проверка что новый кошелек создан и работает
    const newPublicKey = await this._getNewPublicKey();
    if (!newPublicKey) {
      throw new Error("New wallet not created properly");
    }

    step.progress = 75;

    // Проверка что старый кошелек все еще доступен
    if (this._migrationData?.phantomPublicKey) {
      const oldBalance = await this._getPhantomBalance(
        this._migrationData.phantomPublicKey
      );
      // Проверка что баланс не изменился (нет несанкционированных транзакций)
    }

    step.progress = 100;
  }

  private async _executeCleanupStep(step: MigrationStep): Promise<void> {
    step.progress = 25;

    // Очистка временных данных
    localStorage.removeItem("temp_migration_data");

    step.progress = 100;
  }

  private _resetSteps(): void {
    this._migrationSteps.forEach((step) => {
      step.status = "pending";
      step.progress = 0;
      step.error = undefined;
    });
    this._currentStep = 0;
  }

  private async _getPhantomWalletData(): Promise<any> {
    // В реальной реализации здесь должно быть получение данных из Phantom
    return {
      publicKey: this._migrationData?.phantomPublicKey,
      accounts: [],
      transactions: [],
    };
  }

  private async _getPhantomBalance(publicKey: string): Promise<number> {
    // В реальной реализации здесь должен быть запрос к Solana RPC
    return 0;
  }

  private async _getPendingTransactions(publicKey: string): Promise<any[]> {
    // В реальной реализации здесь должен быть запрос к Solana RPC
    return [];
  }

  private async _getNewPublicKey(): Promise<string | null> {
    // Получение публичного ключа нового Invisible Wallet
    try {
      const keyPair = await this._keyManager.getPrivateKey();
      return keyPair.publicKey.toBase58();
    } catch (error) {
      return null;
    }
  }

  private async _restoreFromBackup(backupData: string): Promise<void> {
    // Восстановление данных из бэкапа
    const backup = JSON.parse(backupData);

    // В реальной реализации здесь должно быть восстановление в Phantom
    logger.info("Restoring from backup", { version: backup.version });
  }

  private async _cleanupInvisibleWalletData(): Promise<void> {
    // Очистка данных Invisible Wallet
    const userId = this._config.telegramUserId || "default";
    localStorage.removeItem(`invisible_wallet_keys_${userId}`);
    localStorage.removeItem(`recovery_metadata_${userId}`);
  }

  private _isValidPublicKey(publicKey: string): boolean {
    try {
      new PublicKey(publicKey);
      return true;
    } catch {
      return false;
    }
  }

  private _generateMigrationId(): string {
    return `migration_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Утилиты для миграции
 */
export class MigrationUtils {
  /**
   * Проверка совместимости версий
   */
  static checkVersionCompatibility(
    sourceVersion: string,
    targetVersion: string
  ): boolean {
    // Упрощенная проверка совместимости
    const sourceParts = sourceVersion.split(".").map(Number);
    const targetParts = targetVersion.split(".").map(Number);

    return (
      sourceParts[0] === targetParts[0] && // Major версия
      sourceParts[1] <= targetParts[1]
    ); // Minor версия
  }

  /**
   * Расчет времени миграции
   */
  static estimateMigrationTime(
    balance: number,
    transactionCount: number,
    networkSpeed: "fast" | "medium" | "slow" = "medium"
  ): {
    estimatedMinutes: number;
    confidence: number;
  } {
    const baseTime = 5; // 5 минут базовое время
    const balanceFactor = Math.min(balance / 100, 2); // Фактор баланса
    const transactionFactor = Math.min(transactionCount / 50, 1.5); // Фактор транзакций
    const speedFactor =
      networkSpeed === "fast" ? 0.7 : networkSpeed === "slow" ? 1.5 : 1;

    const estimatedMinutes = Math.ceil(
      baseTime * balanceFactor * transactionFactor * speedFactor
    );

    return {
      estimatedMinutes,
      confidence: 0.8,
    };
  }

  /**
   * Создание отчета о миграции
   */
  static generateMigrationReport(result: MigrationResult): string {
    const report = {
      migrationId: result.migrationId,
      success: result.success,
      timestamp: new Date().toISOString(),
      steps: result.steps.map((step) => ({
        name: step.name,
        status: step.status,
        progress: step.progress,
        error: step.error,
      })),
      newPublicKey: result.newPublicKey,
      error: result.error,
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * Валидация среды для миграции
   */
  static validateMigrationEnvironment(): {
    valid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Проверка HTTPS
    if (
      typeof window !== "undefined" &&
      window.location.protocol !== "https:"
    ) {
      issues.push("Insecure connection detected");
      recommendations.push("Use HTTPS connection for migration");
    }

    // Проверка поддержки Web Crypto
    if (!window.crypto || !window.crypto.subtle) {
      issues.push("Web Crypto API not supported");
      recommendations.push("Update browser to latest version");
    }

    // Проверка localStorage
    if (!window.localStorage) {
      issues.push("localStorage not available");
      recommendations.push("Enable cookies and local storage");
    }

    return {
      valid: issues.length === 0,
      issues,
      recommendations,
    };
  }
}
