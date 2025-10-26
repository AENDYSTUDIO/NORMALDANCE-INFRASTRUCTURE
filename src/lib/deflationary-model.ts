import { Mint } from "@solana/spl-token";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { useEffect, useState } from "react";

export interface DeflationaryConfig {
  totalSupply: number;
  burnPercentage: number; // Процент сжигания при транзакциях
  stakingRewardsPercentage: number; // Процент для стейкинга rewards
  treasuryPercentage: number; // Процент в казну
  maxSupply: number;
  decimals: number;
}

export interface TransactionData {
  amount: number;
  from: PublicKey;
  to: PublicKey;
  timestamp: number;
  type: "transfer" | "stake" | "unstake" | "reward" | "burn";
}

export interface BurnEvent {
  amount: number;
  totalBurned: number;
  transactionHash: string;
  timestamp: number;
  reason: string;
}

export interface TreasuryData {
  totalCollected: number;
  totalDistributed: number;
  lastDistribution: number;
}

// Константы комиссий (basis points)
export const FEE_BPS = 200; // 2 %
export const TREASURY_BPS = 60; // 0.6 % (30% от 2% сжигания)
export const STAKING_BPS = 40; // 0.4 % (20% от 2% сжигания)

export function calcDistribution(amount: number) {
  const burn = Math.floor((amount * 200) / 10_000); // 2% burn
  const treasury = Math.floor((amount * 60) / 10_000); // 0.6% treasury (30% of 2%)
  const staking = Math.floor((amount * 40) / 10_000); // 0.4% staking (20% of 2%)
  const net = amount - burn - treasury - staking;
  return { burn, treasury, staking, net };
}

// Конфигурация дефляционной модели
export const DEFALATIONARY_CONFIG: DeflationaryConfig = {
  totalSupply: 1000000000, // 1,000,000,000 NDT
  burnPercentage: 2, // 2% сжигания при каждой транзакции
  stakingRewardsPercentage: 20, // 20% от сжигания идет на rewards
  treasuryPercentage: 30, // 30% от сжигания идет в казну
  maxSupply: 2000000000, // Максимальный供应 2B NDT
  decimals: 9,
};

// Класс для управления дефляционной моделью
export class DeflationaryModel {
  private connection: Connection;
  private config: DeflationaryConfig;
  private mint?: Mint;

  constructor(
    connection: Connection,
    config: DeflationaryConfig = DEFALATIONARY_CONFIG
  ) {
    this.connection = connection;
    this.config = config;
    // Mint будет инициализирован позже при необходимости
    // this.mint = new Mint({ address: NDT_MINT_ADDRESS });
  }

  // Рассчитать количество токенов для сжигания
  calculateBurnAmount(amount: number): number {
    return Math.floor(amount * (this.config.burnPercentage / 100));
  }

  // Рассчитать rewards для стейкинга
  calculateStakingRewards(burnAmount: number): number {
    return Math.floor(
      burnAmount * (this.config.stakingRewardsPercentage / 100)
    );
  }

  // Рассчитать сумму для казны
  calculateTreasuryAmount(burnAmount: number): number {
    return Math.floor(burnAmount * (this.config.treasuryPercentage / 100));
  }

  // Создать транзакцию с сжиганием
  async createBurnTransaction(
    amount: number,
    from: PublicKey,
    to: PublicKey,
    reason: string = "transaction"
  ): Promise<{ transaction: Transaction; burnEvent: BurnEvent }> {
    if (amount <= 0) {
      throw new Error("Amount must be positive");
    }
    const {
      burn: burnAmount,
      staking: stakingRewards,
      treasury: treasuryAmount,
      net,
    } = calcDistribution(amount);

    const transaction = new Transaction();

    // 1. Перевод токенов (основная сумма минус burn)
    const transferAmount = net;
    if (transferAmount > 0) {
      // Добавляем инструкцию перевода
      // Здесь нужно использовать SPL Token program
      // transaction.add(createTransferInstruction(...))
    }

    // 2. Сжигание токенов
    // Добавляем инструкцию сжигания
    // transaction.add(createBurnInstruction(...))

    // 3. Распределение rewards и treasury
    // Добавляем инструкции распределения

    const burnEvent: BurnEvent = {
      amount: burnAmount,
      totalBurned: await this.getTotalBurned(),
      transactionHash: "", // Будет заполнен после отправки
      timestamp: Date.now(),
      reason,
    };

    return { transaction, burnEvent };
  }

  // Получить общее количество сожженных токенов
  async getTotalBurned(): Promise<number> {
    // Здесь нужно запросить данные из смарт-контракта
    // Временно возвращаем mock значение
    return 50000000; // 50M NDT сожжено
  }

  // Получить текущий supply
  async getCurrentSupply(): Promise<number> {
    // Здесь нужно запросить данные из смарт-контракта
    const totalBurned = await this.getTotalBurned();
    return this.config.totalSupply - totalBurned;
  }

  // Получить информацию о казне
  async getTreasuryData(): Promise<TreasuryData> {
    // Здесь нужно запросить данные из смарт-контракта
    return {
      totalCollected: 15000000, // 15M NDT собрано
      totalDistributed: 5000000, // 5M NDT распределено
      lastDistribution: Date.now() - 86400000, // 24 часа назад
    };
  }

  // Получить статистику дефляции
  async getDeflationStats(): Promise<{
    currentSupply: number;
    totalBurned: number;
    burnRate: number;
    daysToZero: number;
    treasuryBalance: number;
  }> {
    const currentSupply = await this.getCurrentSupply();
    const totalBurned = await this.getTotalBurned();
    const treasuryData = await this.getTreasuryData();

    // Рассчитываем burn rate (среднее сжигание в день)
    const burnRate = totalBurned / 30; // Предполагаем 30 дней работы

    // Рассчитываем дни до полного сжигания
    const daysToZero = currentSupply / burnRate;

    return {
      currentSupply,
      totalBurned,
      burnRate,
      daysToZero,
      treasuryBalance:
        treasuryData.totalCollected - treasuryData.totalDistributed,
    };
  }

  // Форматировать отображение токенов с учетом дефляции
  formatTokenAmount(amount: number): string {
    return new Intl.NumberFormat("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: this.config.decimals,
    }).format(amount);
  }

  // Получить информацию о дефляционной модели
  getDeflationInfo(): {
    config: DeflationaryConfig;
    description: string;
    benefits: string[];
  } {
    return {
      config: this.config,
      description:
        "Дефляционная модель NDT токена с автоматическим сжиганием при каждой транзакции",
      benefits: [
        "Автоматическое сжигание 2% от каждой транзакции",
        "20% от сожженных токенов идет на стейкинг rewards",
        "30% от сожженных токенов идет в казну платформы",
        "Сокращение общего供应 со временем",
        "Увеличение ценности оставшихся токенов",
      ],
    };
  }
}

// Хук для использования дефляционной модели
export function useDeflationaryModel(connection?: Connection) {
  const [model, setModel] = useState<DeflationaryModel | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (connection) {
      const deflationaryModel = new DeflationaryModel(connection);
      setModel(deflationaryModel);
    }
  }, [connection]);

  const loadStats = async () => {
    if (!model) return;

    setLoading(true);
    try {
      const stats = await model.getDeflationStats();
      setStats(stats);
    } catch (error) {
      console.error("Error loading deflation stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    model,
    stats,
    loading,
    loadStats,
  };
}

// Утилиты для работы с дефляционной моделью
export const deflationUtils = {
  // Рассчитать эффективную цену с учетом дефляции
  calculateEffectivePrice(basePrice: number, burnPercentage: number): number {
    return basePrice * (1 + burnPercentage / 100);
  },

  // Рассчитать ROI для стейкинга с учетом дефляции
  calculateStakingROI(
    stakeAmount: number,
    apy: number,
    days: number,
    burnRate: number
  ): number {
    const baseReturn = stakeAmount * (apy / 100) * (days / 365);
    const deflationBonus = stakeAmount * (burnRate / 100) * (days / 365);
    return baseReturn + deflationBonus;
  },

  // Форматировать прогресс дефляции
  formatDeflationProgress(totalBurned: number, totalSupply: number): string {
    const percentage = (totalBurned / totalSupply) * 100;
    return `${percentage.toFixed(2)}% сожжено`;
  },

  // Получить цвет для прогресса дефляции
  getDeflationColor(percentage: number): string {
    if (percentage < 5) return "text-green-600";
    if (percentage < 15) return "text-yellow-600";
    return "text-red-600";
  },
};
