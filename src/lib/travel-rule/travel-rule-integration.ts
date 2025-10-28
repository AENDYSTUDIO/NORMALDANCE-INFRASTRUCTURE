/**
 * 🔄 Travel Rule Integration Service
 *
 * Сервис для интеграции Travel Rule с существующими транзакционными системами
 * NormalDance Music Platform
 */

import { TravelRuleService } from "./travel-rule-service";
import { TravelRuleConfig, VASPInfo, TravelRuleMessage, CATMessage, OFACMessage } from "./types";
import { AMLService } from "../aml-kyc/aml-service";
import { db } from "../db";
import { generateId } from "../aml-kyc/utils";

export interface TravelRuleIntegrationConfig {
  enabled: boolean;
  autoTriggerThreshold: number; // Порог в USD для автоматического Travel Rule
  supportedTransactionTypes: string[];
  vaspInfo: VASPInfo;
}

export class TravelRuleIntegrationService {
  private travelRuleService: TravelRuleService;
  private amlService: AMLService;
  private config: TravelRuleIntegrationConfig;

  constructor(config: TravelRuleIntegrationConfig) {
    this.config = config;
    
    // Создание конфигурации для Travel Rule сервиса
    const travelRuleConfig: TravelRuleConfig = {
      vaspInfo: config.vaspInfo,
      protocols: {
        ivms101: {
          enabled: false, // Пока отключаем
          endpoint: "",
          version: "1.0",
        },
        cat: {
          enabled: true,
          endpoint: "/api/travel-rule/cat",
          version: "1.0",
        },
        ofac: {
          enabled: true,
          endpoint: "/api/travel-rule/ofac",
          updateInterval: 24,
        },
      },
      security: {
        encryption: {
          algorithm: "AES-256-GCM",
          keyRotationInterval: 30,
        },
        signature: {
          algorithm: "ECDSA",
          keyId: "normaldance-signing-key",
        },
      },
      compliance: {
        autoScreening: true,
        screeningThreshold: 70,
        reportingThreshold: 10000, // $10,000 USD
        retentionPeriod: 2555, // 7 лет
      },
      timeouts: {
        messageExpiry: 24, // 24 часа
        responseTimeout: 30, // 30 минут
        retryAttempts: 3,
      },
    };

    this.travelRuleService = new TravelRuleService(travelRuleConfig);
    this.amlService = new AMLService();
  }

  /**
   * Обработка транзакции и автоматический запуск Travel Rule
   */
  async processTransaction(transaction: {
    id: string;
    hash: string;
    fromAddress: string;
    toAddress: string;
    amount: number;
    currency: string;
    type: string;
    userId?: string;
    timestamp: string;
    blockNumber?: number;
  }): Promise<{
    travelRuleTriggered: boolean;
    messageId?: string;
    status?: string;
    error?: string;
  }> {
    try {
      // Проверка, включен ли Travel Rule
      if (!this.config.enabled) {
        return {
          travelRuleTriggered: false,
          error: "Travel Rule is disabled",
        };
      }

      // Проверка типа транзакции
      if (!this.config.supportedTransactionTypes.includes(transaction.type)) {
        return {
          travelRuleTriggered: false,
          error: `Transaction type ${transaction.type} not supported for Travel Rule`,
        };
      }

      // Проверка порога для автоматического запуска
      const amountInUSD = await this.convertToUSD(transaction.amount, transaction.currency);
      if (amountInUSD < this.config.autoTriggerThreshold) {
        return {
          travelRuleTriggered: false,
          error: `Transaction amount ${amountInUSD} USD below threshold ${this.config.autoTriggerThreshold} USD`,
        };
      }

      // Проверка, является ли получатель внешним VASP
      const recipientVasp = await this.identifyRecipientVASP(transaction.toAddress);
      if (!recipientVasp) {
        return {
          travelRuleTriggered: false,
          error: "Recipient is not a registered VASP",
        };
      }

      // Получение информации о пользователе
      const userInfo = await this.getUserInfo(transaction.userId);
      if (!userInfo) {
        return {
          travelRuleTriggered: false,
          error: "User information not found",
        };
      }

      // Создание Travel Rule сообщения
      const travelRuleMessage = await this.createTravelRuleMessage(
        transaction,
        userInfo,
        recipientVasp
      );

      // Отправка Travel Rule сообщения
      const sendResult = await this.travelRuleService.sendTravelRuleMessage({
        transactionId: transaction.id,
        recipientVaspId: recipientVasp.id,
        protocol: "CAT", // По умолчанию используем CAT
        message: travelRuleMessage,
        priority: this.determinePriority(amountInUSD),
      });

      if (sendResult.success) {
        // Логирование успешной отправки
        await this.logTravelRuleTransaction(transaction.id, sendResult.messageId!, "SENT");

        return {
          travelRuleTriggered: true,
          messageId: sendResult.messageId,
          status: sendResult.status,
        };
      } else {
        // Логирование ошибки
        await this.logTravelRuleTransaction(transaction.id, undefined, "FAILED", sendResult.error);

        return {
          travelRuleTriggered: false,
          error: sendResult.error,
        };
      }
    } catch (error) {
      console.error("Error processing transaction for Travel Rule:", error);
      return {
        travelRuleTriggered: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Обработка входящего Travel Rule сообщения
   */
  async handleIncomingTravelRuleMessage(messageId: string): Promise<{
    success: boolean;
    status?: string;
    error?: string;
  }> {
    try {
      // Получение сообщения
      const messages = await this.travelRuleService.receiveTravelRuleMessages({
        messageId,
      });

      if (!messages.success || messages.messages.length === 0) {
        return {
          success: false,
          error: "Travel Rule message not found",
        };
      }

      const message = messages.messages[0];

      // Обработка сообщения
      const processResult = await this.travelRuleService.processIncomingMessage(
        message.id,
        message.protocol
      );

      if (processResult.success) {
        // Дополнительная обработка в зависимости от протокола
        await this.processProtocolSpecificMessage(message);

        return {
          success: true,
          status: processResult.status,
        };
      } else {
        return {
          success: false,
          status: processResult.status,
          error: processResult.error,
        };
      }
    } catch (error) {
      console.error("Error handling incoming Travel Rule message:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Получение статистики Travel Rule
   */
  async getTravelRuleStatistics(): Promise<{
    totalMessages: number;
    sentMessages: number;
    receivedMessages: number;
    completedMessages: number;
    failedMessages: number;
    averageProcessingTime: number;
    integrationStats: {
      totalTransactions: number;
      travelRuleTriggered: number;
      triggerRate: number;
      averageTransactionAmount: number;
    };
  }> {
    try {
      // Получение базовой статистики
      const basicStats = await this.travelRuleService.getStatistics();

      // Получение статистики интеграции
      const integrationStats = await this.getIntegrationStatistics();

      return {
        ...basicStats,
        integrationStats,
      };
    } catch (error) {
      console.error("Error getting Travel Rule statistics:", error);
      return {
        totalMessages: 0,
        sentMessages: 0,
        receivedMessages: 0,
        completedMessages: 0,
        failedMessages: 0,
        averageProcessingTime: 0,
        integrationStats: {
          totalTransactions: 0,
          travelRuleTriggered: 0,
          triggerRate: 0,
          averageTransactionAmount: 0,
        },
      };
    }
  }

  // Приватные методы

  /**
   * Конвертация суммы в USD
   */
  private async convertToUSD(amount: number, currency: string): Promise<number> {
    // В реальной системе здесь будет интеграция с API для получения курсов
    // Пока используем упрощенные курсы
    const rates: Record<string, number> = {
      USD: 1,
      EUR: 1.1,
      GBP: 1.25,
      SOL: 25, // Примерный курс
      NDT: 0.1, // Примерный курс
      USDC: 1,
      USDT: 1,
    };

    return amount * (rates[currency] || 1);
  }

  /**
   * Идентификация VASP получателя
   */
  private async identifyRecipientVASP(address: string): Promise<any> {
    try {
      // В реальной системе здесь будет проверка адреса в реестре VASP
      // Пока используем моковую логику
      
      // Проверка на внутренние адреса
      const isInternal = await this.isInternalAddress(address);
      if (isInternal) {
        return null;
      }

      // Моковая идентификация внешних VASP
      const externalVASPs = {
        "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsY": {
          id: "vasp_cryptoexchange",
          name: "CryptoExchange Pro",
          type: "EXCHANGE",
        },
        "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": {
          id: "vasp_securewallet",
          name: "SecureWallet",
          type: "WALLET_PROVIDER",
        },
      };

      return externalVASPs[address] || null;
    } catch (error) {
      console.error("Error identifying recipient VASP:", error);
      return null;
    }
  }

  /**
   * Проверка, является ли адрес внутренним
   */
  private async isInternalAddress(address: string): Promise<boolean> {
    try {
      // Проверка в базе данных пользователей
      const user = await db.user.findFirst({
        where: { wallet: address },
      });

      return !!user;
    } catch (error) {
      console.error("Error checking internal address:", error);
      return false;
    }
  }

  /**
   * Получение информации о пользователе
   */
  private async getUserInfo(userId?: string): Promise<any> {
    if (!userId) {
      return null;
    }

    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        include: {
          kycProfile: true,
        },
      });

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        walletAddress: user.wallet,
        email: user.email,
        username: user.username,
        kycLevel: user.kycProfile?.level || "BASIC",
        kycStatus: user.kycProfile?.status || "PENDING",
        personalData: user.kycProfile?.personalData,
        addresses: user.kycProfile?.addresses,
      };
    } catch (error) {
      console.error("Error getting user info:", error);
      return null;
    }
  }

  /**
   * Создание Travel Rule сообщения
   */
  private async createTravelRuleMessage(
    transaction: any,
    userInfo: any,
    recipientVasp: any
  ): Promise<CATMessage> {
    const timestamp = new Date().toISOString();

    // Создание CAT сообщения
    const catMessage: CATMessage = {
      header: {
        version: "1.0",
        messageId: generateId("cat_msg"),
        timestamp,
        sender: {
          vaspId: this.config.vaspInfo.id,
          name: this.config.vaspInfo.name,
          endpoint: "/api/travel-rule/cat",
        },
        recipient: {
          vaspId: recipientVasp.id,
          name: recipientVasp.name,
          endpoint: "", // Будет определено из реестра VASP
        },
      },
      payload: {
        transaction: {
          id: transaction.id,
          blockchain: "SOLANA",
          asset: transaction.currency,
          amount: transaction.amount,
          fromAddress: transaction.fromAddress,
          toAddress: transaction.toAddress,
          timestamp,
        },
        originator: {
          type: "NATURAL",
          name: `${userInfo.personalData?.firstName || ""} ${userInfo.personalData?.lastName || ""}`.trim(),
          dateOfBirth: userInfo.personalData?.dateOfBirth,
          nationality: userInfo.personalData?.nationality,
          address: userInfo.addresses?.[0]?.street,
          identificationNumber: userInfo.personalData?.taxIdentificationNumber,
        },
        beneficiary: {
          type: "NATURAL", // По умолчанию, в реальной системе нужно определить
          name: "External User", // Будет заполнено получающим VASP
        },
        purpose: "MUSIC_STREAMING_PAYMENT",
        sourceOfFunds: "PERSONAL_FUNDS",
      },
      security: {
        signature: "", // Будет добавлено сервисом шифрования
        publicKey: "",
        algorithm: "ECDSA",
      },
    };

    return catMessage;
  }

  /**
   * Определение приоритета на основе суммы
   */
  private determinePriority(amountInUSD: number): "LOW" | "MEDIUM" | "HIGH" {
    if (amountInUSD >= 50000) return "HIGH";
    if (amountInUSD >= 10000) return "MEDIUM";
    return "LOW";
  }

  /**
   * Обработка специфичного для протокола сообщения
   */
  private async processProtocolSpecificMessage(message: any): Promise<void> {
    try {
      switch (message.protocol) {
        case "CAT":
          await this.processCATMessage(message);
          break;
        case "OFAC":
          await this.processOFACMessage(message);
          break;
        default:
          console.log(`No specific processing for protocol: ${message.protocol}`);
      }
    } catch (error) {
      console.error("Error processing protocol specific message:", error);
    }
  }

  /**
   * Обработка CAT сообщения
   */
  private async processCATMessage(message: any): Promise<void> {
    // Дополнительная обработка CAT сообщений
    console.log(`Processing CAT message: ${message.id}`);
    
    // Здесь может быть логика для автоматического подтверждения
    // или дополнительной проверки
  }

  /**
   * Обработка OFAC сообщения
   */
  private async processOFACMessage(message: any): Promise<void> {
    // Дополнительная обработка OFAC сообщений
    console.log(`Processing OFAC message: ${message.id}`);
    
    // Здесь может быть логика для автоматической блокировки
    // или дополнительной проверки
  }

  /**
   * Логирование Travel Rule транзакции
   */
  private async logTravelRuleTransaction(
    transactionId: string,
    messageId?: string,
    status?: string,
    error?: string
  ): Promise<void> {
    try {
      await db.travelRuleAuditLog.create({
        data: {
          action: "PROCESS_TRANSACTION",
          entityType: "TRANSACTION",
          entityId: transactionId,
          newValues: {
            messageId,
            status,
            error,
            timestamp: new Date().toISOString(),
          },
        },
      });
    } catch (logError) {
      console.error("Error logging Travel Rule transaction:", logError);
    }
  }

  /**
   * Получение статистики интеграции
   */
  private async getIntegrationStatistics(): Promise<{
    totalTransactions: number;
    travelRuleTriggered: number;
    triggerRate: number;
    averageTransactionAmount: number;
  }> {
    try {
      // В реальной системе здесь будет запрос к базе данных
      // Пока возвращаем моковые данные
      return {
        totalTransactions: 1000,
        travelRuleTriggered: 150,
        triggerRate: 15,
        averageTransactionAmount: 2500,
      };
    } catch (error) {
      console.error("Error getting integration statistics:", error);
      return {
        totalTransactions: 0,
        travelRuleTriggered: 0,
        triggerRate: 0,
        averageTransactionAmount: 0,
      };
    }
  }
}

// Экспорт сервиса
export { TravelRuleIntegrationService };