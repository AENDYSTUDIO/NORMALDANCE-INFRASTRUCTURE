# План улучшения системы стейкинга

## Обзор

В этом документе описывается план расширения функционала стейкинга проекта NormalDance. Это улучшение имеет средний приоритет для Q2-Q3 2025 года, так как обеспечивает более гибкую систему вознаграждений и повышает лояльность пользователей.

## Текущая ситуация

### Существующая система стейкинга

- Базовая система стейкинга токенов
- Фиксированные вознаграждения
- Ограниченные параметры стейкинга
- Нет гибких стратегий стейкинга

### Проблемы текущей реализации

- Ограниченные стратегии стейкинга
- Нет гибких параметров вознаграждений
- Простая система управления
- Нет интеграции с другими функциями

## Цели реализации

### Основные цели

- Реализация различных стратегий стейкинга
- Добавление гибких параметров вознаграждений
- Создание интерфейса управления стейкингом
- Интеграция с системой вознаграждений

### Технические цели

- Поддержка различных типов стейкинга
- Гибкие параметры вознаграждений
- Интеграция с Web3-кошельками
- Совместимость с существующей системой

## План реализации

### Этап 1: Анализ и проектирование (Неделя 1-2)

- Анализ существующей системы стейкинга
- Проектирование новых стратегий
- Подготовка схемы данных
- Создание архитектуры

### Этап 2: Backend разработка (Неделя 3-5)

- Обновление схемы данных
- Реализация новых стратегий
- Создание API для стейкинга
- Интеграция с Web3

### Этап 3: Frontend интеграция (Неделя 6-7)

- Создание интерфейса стейкинга
- Интеграция с Web3-кошельками
- Реализация управления стейкингом
- Тестирование UX

### Этап 4: Тестирование (Неделя 8)

- Тестирование различных стратегий
- Тестирование Web3-интеграции
- Тестирование безопасности
- Исправление выявленных проблем

### Этап 5: Внедрение (Неделя 9)

- Постепенное внедрение системы
- Мониторинг после внедрения
- Обновление документации

## Технические детали

### Архитектура улучшенной системы стейкинга

#### Обновленная схема данных для стейкинга

```prisma
// schema.prisma
enum StakeType {
  FIXED_TERM
  FLEXIBLE
  NFT_BACKED
  LP_TOKENS
}

enum StakeStatus {
  ACTIVE
  INACTIVE
 REWARDS_CLAIMED
  EXPIRED
}

model StakeStrategy {
  id              String        @id @default(cuid())
  name            String
  description     String?
  type            StakeType
 minAmount       Decimal       // Минимальная сумма стейкинга
 maxAmount       Decimal?      // Максимальная сумма (null для неограниченной)
  duration        Int?          // Продолжительность в днях (null для гибких)
  rewardRate      Decimal       // Процент вознаграждения
  rewardFrequency RewardFrequency // Частота начисления вознаграждений
 isActive        Boolean       @default(true)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  stakes          Stake[]
}

enum RewardFrequency {
 HOURLY
  DAILY
  WEEKLY
  MONTHLY
  ON_EXPIRY
}

model Stake {
  id              String        @id @default(cuid())
  userId          String
  user            User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  strategyId      String
  strategy        StakeStrategy @relation(fields: [strategyId], references: [id])
  amount          Decimal
  stakedAt        DateTime      @default(now())
  expiresAt       DateTime?
  lastRewardClaim DateTime?
  totalRewards    Decimal       @default(0)
  status          StakeStatus   @default(ACTIVE)
  metadata        Json?         // Дополнительные данные для NFT-бэкед стейкинга
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([userId])
  @@index([strategyId])
  @@index([status])
  @@index([expiresAt])
}

model StakeReward {
  id        String   @id @default(cuid())
  stakeId   String
  stake     Stake    @relation(fields: [stakeId], references: [id], onDelete: Cascade)
  amount    Decimal
  type      RewardType
  claimed   Boolean  @default(false)
  claimedAt DateTime?
  createdAt DateTime @default(now())

  @@index([stakeId])
  @@index([claimed])
}

enum RewardType {
  BASE_REWARD
  BONUS_REWARD
  REFERRAL_BONUS
  ACHIEVEMENT_BONUS
}
```

### Сервис стейкинга

#### Основной сервис стейкинга

```typescript
// src/lib/staking-service.ts
import { prisma } from "@/lib/db";
import { StakeType, StakeStatus, RewardFrequency } from "@prisma/client";

export interface StakeInput {
  userId: string;
  strategyId: string;
  amount: number;
}

export interface UnstakeInput {
  stakeId: string;
  userId: string;
}

export class StakingService {
  static async createStake(input: StakeInput): Promise<any> {
    try {
      // Получение стратегии стейкинга
      const strategy = await prisma.stakeStrategy.findUnique({
        where: { id: input.strategyId },
      });

      if (!strategy || !strategy.isActive) {
        throw new Error("Invalid or inactive staking strategy");
      }

      // Проверка минимальной суммы
      if (input.amount < Number(strategy.minAmount)) {
        throw new Error(`Minimum stake amount is ${strategy.minAmount}`);
      }

      // Проверка максимальной суммы
      if (strategy.maxAmount && input.amount > Number(strategy.maxAmount)) {
        throw new Error(`Maximum stake amount is ${strategy.maxAmount}`);
      }

      // Проверка баланса пользователя
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (Number(user?.balance) < input.amount) {
        throw new Error("Insufficient balance");
      }

      // Рассчет даты окончания (для фиксированных стратегий)
      let expiresAt: Date | null = null;
      if (strategy.type === "FIXED_TERM" && strategy.duration) {
        expiresAt = new Date(
          Date.now() + strategy.duration * 24 * 60 * 60 * 1000
        );
      }

      // Создание стейка
      const stake = await prisma.stake.create({
        data: {
          userId: input.userId,
          strategyId: input.strategyId,
          amount: input.amount,
          expiresAt,
          status: "ACTIVE",
        },
      });

      // Списание средств с баланса пользователя
      await prisma.user.update({
        where: { id: input.userId },
        data: {
          balance: { decrement: input.amount },
        },
      });

      return stake;
    } catch (error) {
      console.error("Error creating stake:", error);
      throw error;
    }
  }

  static async unstake(input: UnstakeInput): Promise<any> {
    try {
      // Получение стейка
      const stake = await prisma.stake.findUnique({
        where: {
          id: input.stakeId,
          userId: input.userId,
        },
      });

      if (!stake) {
        throw new Error("Stake not found");
      }

      if (stake.status !== "ACTIVE") {
        throw new Error("Stake is not active");
      }

      // Проверка, истек ли срок для фиксированных стратегий
      const strategy = await prisma.stakeStrategy.findUnique({
        where: { id: stake.strategyId },
      });

      if (
        strategy?.type === "FIXED_TERM" &&
        stake.expiresAt &&
        stake.expiresAt > new Date()
      ) {
        throw new Error("Fixed-term stake cannot be unstaked before expiry");
      }

      // Начисление вознаграждений
      const rewards = await this.calculateRewards(stake.id);

      // Обновление стейка
      const updatedStake = await prisma.stake.update({
        where: { id: stake.id },
        data: {
          status: "INACTIVE",
          totalRewards: { increment: rewards.totalRewards },
        },
      });

      // Возврат основной суммы и вознаграждений пользователю
      await prisma.user.update({
        where: { id: input.userId },
        data: {
          balance: {
            increment: Number(stake.amount) + rewards.totalRewards,
          },
        },
      });

      // Создание записей о вознаграждениях
      if (rewards.rewards.length > 0) {
        await prisma.stakeReward.createMany({
          data: rewards.rewards.map((r) => ({
            stakeId: stake.id,
            amount: r.amount,
            type: r.type,
          })),
        });
      }

      return updatedStake;
    } catch (error) {
      console.error("Error unstaking:", error);
      throw error;
    }
  }

  static async calculateRewards(stakeId: string) {
    try {
      const stake = await prisma.stake.findUnique({
        where: { id: stakeId },
        include: {
          strategy: true,
        },
      });

      if (!stake || stake.status !== "ACTIVE") {
        return { totalRewards: 0, rewards: [] };
      }

      // Проверка, нужно ли начислять вознаграждения
      if (stake.strategy.rewardFrequency === "ON_EXPIRY") {
        // Для стратегий с вознаграждением по окончании срока
        if (stake.expiresAt && new Date() < stake.expiresAt) {
          return { totalRewards: 0, rewards: [] };
        }
      }

      // Рассчет вознаграждений (упрощенная логика)
      const timeElapsed =
        (new Date().getTime() - stake.stakedAt.getTime()) /
        (1000 * 60 * 60 * 24); // в днях
      const rewardRate = Number(stake.strategy.rewardRate) / 100; // в процентах

      // Для гибких стратегий - ежедневное начисление
      const baseReward =
        Number(stake.amount) * rewardRate * (timeElapsed / 365);

      // Проверка, были ли уже начислены вознаграждения
      const lastClaim = stake.lastRewardClaim || stake.stakedAt;
      const timeSinceLastClaim =
        (new Date().getTime() - lastClaim.getTime()) / (1000 * 60 * 60 * 24);

      // Только для стратегий с частым начислением
      if (
        stake.strategy.rewardFrequency !== "ON_EXPIRY" &&
        timeSinceLastClaim >= 1
      ) {
        const reward = {
          amount: baseReward,
          type: "BASE_REWARD" as const,
        };

        return {
          totalRewards: reward.amount,
          rewards: [reward],
        };
      }

      return { totalRewards: 0, rewards: [] };
    } catch (error) {
      console.error("Error calculating rewards:", error);
      return { totalRewards: 0, rewards: [] };
    }
  }

  static async getUserStakes(userId: string) {
    return await prisma.stake.findMany({
      where: { userId },
      include: {
        strategy: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getAvailableStrategies() {
    return await prisma.stakeStrategy.findMany({
      where: { isActive: true },
      orderBy: { rewardRate: "desc" },
    });
  }

  static async claimRewards(stakeId: string, userId: string) {
    try {
      // Проверка принадлежности стейка пользователю
      const stake = await prisma.stake.findUnique({
        where: {
          id: stakeId,
          userId,
        },
      });

      if (!stake) {
        throw new Error("Stake not found or does not belong to user");
      }

      // Рассчет вознаграждений
      const rewards = await this.calculateRewards(stakeId);

      if (rewards.totalRewards <= 0) {
        throw new Error("No rewards to claim");
      }

      // Обновление стейка
      const updatedStake = await prisma.stake.update({
        where: { id: stake.id },
        data: {
          totalRewards: { increment: rewards.totalRewards },
          lastRewardClaim: new Date(),
        },
      });

      // Зачисление вознаграждений пользователю
      await prisma.user.update({
        where: { id: userId },
        data: {
          balance: { increment: rewards.totalRewards },
        },
      });

      // Создание записей о вознаграждениях
      await prisma.stakeReward.createMany({
        data: rewards.rewards.map((r) => ({
          stakeId,
          amount: r.amount,
          type: r.type,
          claimed: true,
          claimedAt: new Date(),
        })),
      });

      return updatedStake;
    } catch (error) {
      console.error("Error claiming rewards:", error);
      throw error;
    }
  }
}
```

### Управление стейкингом

#### Компонент управления стейкингом

```tsx
// src/components/StakingManager.tsx
"use client";

import { useState, useEffect } from "react";
import { StakingService } from "@/lib/staking-service";
import { formatCurrency } from "@/lib/utils";

interface StakeStrategy {
  id: string;
  name: string;
  description: string;
  type: string;
  minAmount: number;
  maxAmount: number | null;
  duration: number | null;
  rewardRate: number;
  rewardFrequency: string;
  isActive: boolean;
}

interface UserStake {
  id: string;
  strategy: StakeStrategy;
  amount: number;
  stakedAt: Date;
  expiresAt: Date | null;
  totalRewards: number;
  status: string;
}

const StakingManager = () => {
  const [strategies, setStrategies] = useState<StakeStrategy[]>([]);
  const [userStakes, setUserStakes] = useState<UserStake[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [stakeAmount, setStakeAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [stratData, stakeData] = await Promise.all([
          StakingService.getAvailableStrategies(),
          StakingService.getUserStakes("current-user-id"),
        ]);

        setStrategies(stratData as any[]);
        setUserStakes(stakeData as any[]);
      } catch (err) {
        setError("Failed to load staking data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleStake = async () => {
    if (!selectedStrategy || !stakeAmount) {
      setError("Please select a strategy and enter an amount");
      return;
    }

    try {
      const amount = parseFloat(stakeAmount);
      if (isNaN(amount) || amount <= 0) {
        setError("Invalid amount");
        return;
      }

      await StakingService.createStake({
        userId: "current-user-id",
        strategyId: selectedStrategy,
        amount,
      });

      // Обновление данных
      const updatedStakes = await StakingService.getUserStakes(
        "current-user-id"
      );
      setUserStakes(updatedStakes as any[]);
      setStakeAmount("");
      setError(null);
    } catch (err) {
      setError("Failed to create stake");
      console.error(err);
    }
  };

  const handleUnstake = async (stakeId: string) => {
    try {
      await StakingService.unstake({
        stakeId,
        userId: "current-user-id",
      });

      // Обновление данных
      const updatedStakes = await StakingService.getUserStakes(
        "current-user-id"
      );
      setUserStakes(updatedStakes as any[]);
    } catch (err) {
      setError("Failed to unstake");
      console.error(err);
    }
  };

  const handleClaimRewards = async (stakeId: string) => {
    try {
      await StakingService.claimRewards(stakeId, "current-user-id");

      // Обновление данных
      const updatedStakes = await StakingService.getUserStakes(
        "current-user-id"
      );
      setUserStakes(updatedStakes as any[]);
    } catch (err) {
      setError("Failed to claim rewards");
      console.error(err);
    }
  };

  if (loading) {
    return <div>Loading staking data...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Staking</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Доступные стратегии */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Available Strategies</h3>
          <div className="space-y-4">
            {strategies.map((strategy) => (
              <div
                key={strategy.id}
                className={`p-4 border rounded-lg cursor-pointer ${
                  selectedStrategy === strategy.id
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
                onClick={() => setSelectedStrategy(strategy.id)}
              >
                <h4 className="font-medium">{strategy.name}</h4>
                <p className="text-sm text-gray-600">{strategy.description}</p>
                <div className="mt-2 text-sm">
                  <p>Rate: {strategy.rewardRate}%</p>
                  <p>Type: {strategy.type}</p>
                  <p>Min: {formatCurrency(strategy.minAmount)}</p>
                  {strategy.maxAmount && (
                    <p>Max: {formatCurrency(strategy.maxAmount)}</p>
                  )}
                  {strategy.duration && (
                    <p>Duration: {strategy.duration} days</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Форма стейкинга */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Create Stake</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-70 mb-1">
                Amount
              </label>
              <input
                type="number"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-30 rounded-md"
                placeholder="Enter amount"
              />
            </div>

            <button
              onClick={handleStake}
              disabled={!selectedStrategy || !stakeAmount}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              Stake Tokens
            </button>
          </div>
        </div>
      </div>

      {/* Активные стейки */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Your Stakes</h3>
        {userStakes.length === 0 ? (
          <p className="text-gray-500">No active stakes</p>
        ) : (
          <div className="space-y-4">
            {userStakes.map((stake) => (
              <div
                key={stake.id}
                className="p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{stake.strategy.name}</h4>
                    <p className="text-sm text-gray-600">
                      Amount: {formatCurrency(stake.amount)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Rewards: {formatCurrency(stake.totalRewards)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Status: {stake.status}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {stake.status === "ACTIVE" && (
                      <>
                        <button
                          onClick={() => handleClaimRewards(stake.id)}
                          className="text-sm bg-green-100 text-green-800 py-1 px-2 rounded hover:bg-green-200"
                        >
                          Claim Rewards
                        </button>
                        <button
                          onClick={() => handleUnstake(stake.id)}
                          className="text-sm bg-red-100 text-red-800 py-1 px-2 rounded hover:bg-red-200"
                        >
                          Unstake
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
```

### API для стейкинга

#### API-эндпоинты для управления стейкингом

```typescript
// src/app/api/staking/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { StakingService } from "@/lib/staking-service";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    switch (type) {
      case "strategies":
        const strategies = await StakingService.getAvailableStrategies();
        return NextResponse.json({ strategies });

      case "user-stakes":
        const userStakes = await StakingService.getUserStakes(session.user.id);
        return NextResponse.json({ stakes: userStakes });

      default:
        return NextResponse.json(
          { error: "Invalid type parameter" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error fetching staking data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case "create-stake":
        const { strategyId, amount } = data;

        if (!strategyId || !amount) {
          return NextResponse.json(
            { error: "Missing required fields" },
            { status: 400 }
          );
        }

        const stake = await StakingService.createStake({
          userId: session.user.id,
          strategyId,
          amount: parseFloat(amount),
        });

        return NextResponse.json({ stake });

      case "unstake":
        const { stakeId } = data;

        if (!stakeId) {
          return NextResponse.json(
            { error: "Missing stakeId" },
            { status: 400 }
          );
        }

        const unstaked = await StakingService.unstake({
          stakeId,
          userId: session.user.id,
        });

        return NextResponse.json({ stake: unstaked });

      case "claim-rewards":
        const { stakeId: rewardStakeId } = data;

        if (!rewardStakeId) {
          return NextResponse.json(
            { error: "Missing stakeId" },
            { status: 400 }
          );
        }

        const updatedStake = await StakingService.claimRewards(
          rewardStakeId,
          session.user.id
        );

        return NextResponse.json({ stake: updatedStake });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in staking API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
```

### Интеграция с Web3

#### Web3-интеграция для стейкинга

```typescript
// src/lib/web3-staking-service.ts
import { Connection, PublicKey, Transaction, Keypair } from "@solana/web3.js";
import {
  Token,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { StakeStrategy } from "@prisma/client";

export class Web3StakingService {
  private connection: Connection;

  constructor(rpcUrl: string) {
    this.connection = new Connection(rpcUrl);
  }

  static async createStakeTransaction(
    userPublicKey: PublicKey,
    strategy: StakeStrategy,
    amount: number
  ): Promise<Transaction> {
    const transaction = new Transaction();

    // В реальном приложении здесь будет создание транзакции для стейкинга токенов
    // через смарт-контракт стейкинга на Solana

    // Пример создания транзакции (упрощенный)
    // 1. Проверка баланса токенов пользователя
    // 2. Создание ATA (Associated Token Account) если не существует
    // 3. Перевод токенов на контракт стейкинга
    // 4. Вызов инструкции стейкинга

    return transaction;
  }

  static async createUnstakeTransaction(
    userPublicKey: PublicKey,
    stakeId: string
  ): Promise<Transaction> {
    const transaction = new Transaction();

    // В реальном приложении здесь будет создание транзакции для анстейкинга
    // через смарт-контракт стейкинга на Solana

    return transaction;
  }

  static async getStakeInfo(
    userPublicKey: PublicKey,
    stakeId: string
  ): Promise<any> {
    // В реальном приложении здесь будет получение информации о стейке
    // из смарт-контракта на Solana

    return {
      amount: 0,
      rewards: 0,
      unlockTime: null,
      isActive: false,
    };
  }
}
```

## Риски и меры по их снижению

### Риск 1: Потеря средств пользователей

- **Мера**: Тщательное тестирование смарт-контрактов
- **Мера**: Аудит безопасности

### Риск 2: Неправильное начисление вознаграждений

- **Мера**: Тестирование расчетов вознаграждений
- **Мера**: Мониторинг системы

### Риск 3: Низкая вовлеченность пользователей

- **Мера**: Привлекательные ставки вознаграждений
- **Мера**: Разнообразие стратегий

## Критерии успеха

- Успешная реализация различных стратегий стейкинга
- Гибкие параметры вознаграждений
- Удобный интерфейс управления
- Безопасность и надежность
- Удовлетворенность пользователей

## Ресурсы

- 2-3 разработчика на 9 недель
- Web3-специалист для смарт-контрактов
- QA-инженер для тестирования

## Сроки

- Начало: 15 сентября 2025
- Завершение: 24 октября 2025
- Общее время: 9 недель
