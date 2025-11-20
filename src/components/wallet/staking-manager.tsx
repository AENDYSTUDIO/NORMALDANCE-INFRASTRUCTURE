'use client'

import { InvisibleDeflationAdapter } from './invisible-deflation-adapter';
import { TransactionFeeCalculator } from '../../lib/wallet/transaction-fee-calculator';
import { DeflationaryModel } from '../../lib/deflationary-model';

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, Progress } from '@/components/ui'
import { useWalletContext } from './wallet-provider'
import { useTransactions } from './wallet-provider'
import { 
  NDT_PROGRAM_ID, 
  NDT_MINT_ADDRESS,
  formatTokens,
  formatSol,
  createTransaction
} from './wallet-adapter'
import { 
  TrendingUp, 
  Clock, 
  Lock, 
  Unlock,
  Zap,
  AlertCircle,
  CheckCircle,
  Calendar,
  Target
} from '@/components/icons'

interface StakingTier {
  level: 'BRONZE' | 'SILVER' | 'GOLD'
  minAmount: number
  maxAmount: number
  apy: number
  lockPeriods: number[]
  color: string
  icon: string
}

interface StakingPosition {
  id: string
  amount: number
  tier: StakingTier
  lockPeriod: number
  startTime: number
  endTime: number
  rewards: number
  isActive: boolean
}

interface StakingManagerProps {
  className?: string
}

const STAKING_TIERS: StakingTier[] = [
  {
    level: 'BRONZE',
    minAmount: 500000000, // 500 NDT
    maxAmount: 5000000000, // 5,000 NDT
    apy: 5,
    lockPeriods: [1, 3, 6],
    color: 'text-orange-600',
    icon: '🥉'
  },
  {
    level: 'SILVER',
    minAmount: 5000000000, // 5,000 NDT
    maxAmount: 50000000000, // 50,000 NDT
    apy: 15,
    lockPeriods: [3, 6, 12],
    color: 'text-gray-600',
    icon: '🥈'
  },
  {
    level: 'GOLD',
    minAmount: 50000000000, // 50,000 NDT
    maxAmount: 200000000000, // 200,000 NDT
    apy: 25,
    lockPeriods: [6, 12],
    color: 'text-yellow-600',
    icon: '🥇'
  }
]

export function StakingManager({ className }: StakingManagerProps) {
  const { connected, publicKey, balance } = useWalletContext()
  const { sendTransaction } = useTransactions()
  const [ndtBalance, setNdtBalance] = useState<number>(0)
  const [positions, setPositions] = useState<StakingPosition[]>([])
  const [selectedTier, setSelectedTier] = useState<StakingTier | null>(null)
  const [selectedLockPeriod, setSelectedLockPeriod] = useState<number>(3)
 const [stakeAmount, setStakeAmount] = useState<number>(0)
  const [isStaking, setIsStaking] = useState(false)
  const [isUnstaking, setIsUnstaking] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [invisibleDeflationAdapter, setInvisibleDeflationAdapter] = useState<InvisibleDeflationAdapter | null>(null)
  const [feeCalculator, setFeeCalculator] = useState<TransactionFeeCalculator | null>(null)

  // Загрузка стейкинг позиций
  const loadPositions = async () => {
    if (!publicKey) return

    try {
      // Здесь нужно запросить позиции из смарт-контракта
      // Временно используем mock данные
      const mockPositions: StakingPosition[] = [
        {
          id: '1',
          amount: 1000000000, // 1000 NDT
          tier: STAKING_TIERS[1], // SILVER
          lockPeriod: 6,
          startTime: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 дней назад
          endTime: Date.now() + 150 * 24 * 60 * 60 * 1000, // 150 дней до конца
          rewards: 25000000, // 25 NDT
          isActive: true
        }
      ]
      setPositions(mockPositions)
    } catch (err) {
      console.error('Error loading positions:', err)
    }
  }

  // Рассчитать rewards
  const calculateRewards = (amount: number, apy: number, lockPeriod: number): number => {
    const days = lockPeriod * 30
    const yearlyRewards = amount * (apy / 100)
    const dailyRewards = yearlyRewards / 365
    return Math.floor(dailyRewards * days)
  }

  // Стейкинг
  const handleStake = async () => {
    if (!publicKey || !selectedTier || stakeAmount <= 0) return

    setIsStaking(true)
    setError(null)
    setSuccess(null)

    try {
      // Валидация суммы
      if (stakeAmount < selectedTier.minAmount) {
        throw new Error(`Минимальная сумма для ${selectedTier.level}: ${formatTokens(selectedTier.minAmount)}`)
      }
      if (stakeAmount > selectedTier.maxAmount) {
        throw new Error(`Максимальная сумма для ${selectedTier.level}: ${formatTokens(selectedTier.maxAmount)}`)
      }
      if (stakeAmount > ndtBalance) {
        throw new Error('Недостаточно NDT токенов')
      }

      // Создаем транзакцию стейкинга
      const instructions = [
        // Здесь нужно добавить реальные инструкции для вызова смарт-контракта
      ]

      const transaction = await createTransaction(
        new (window as any).solana.Connection('https://api.devnet.solana.com'),
        { publicKey, signTransaction: async () => new Transaction() },
        instructions
      )

      const signature = await sendTransaction({ instructions })
      setSuccess(`Стейкинг успешен! TX: ${signature}`)
      
      // Обновляем позиции
      await loadPositions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка стейкинга')
    } finally {
      setIsStaking(false)
    }
  }

  // Unstaking
  const handleUnstake = async (positionId: string) => {
    if (!publicKey) return

    setIsUnstaking(true)
    setError(null)
    setSuccess(null)

    try {
      const position = positions.find(p => p.id === positionId)
      if (!position) throw new Error('Позиция не найдена')

      // Проверяем, не заблокирована ли позиция
      if (position.endTime > Date.now()) {
        throw new Error('Позиция еще заблокирована')
      }

      // Создаем транзакцию unstaking
      const instructions = [
        // Здесь нужно добавить реальные инструкции для вызова смарт-контракта
      ]

      const transaction = await createTransaction(
        new (window as any).solana.Connection('https://api.devnet.solana.com'),
        { publicKey, signTransaction: async () => new Transaction() },
        instructions
      )

      const signature = await sendTransaction({ instructions })
      setSuccess(`Unstaking успешен! TX: ${signature}`)
      
      // Обновляем позиции
      await loadPositions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка unstaking')
    } finally {
      setIsUnstaking(false)
    }
  }

  // Claim rewards
  const handleClaimRewards = async (positionId: string) => {
    if (!publicKey) return

    setIsClaiming(true)
    setError(null)
    setSuccess(null)

    try {
      const position = positions.find(p => p.id === positionId)
      if (!position) throw new Error('Позиция не найдена')

      // Создаем транзакцию claim rewards
      const instructions = [
        // Здесь нужно добавить реальные инструкции для вызова смарт-контракта
      ]

      const transaction = await createTransaction(
        new (window as any).solana.Connection('https://api.devnet.solana.com'),
        { publicKey, signTransaction: async () => new Transaction() },
        instructions
      )

      const signature = await sendTransaction({ instructions })
      setSuccess(`Rewards claimed! TX: ${signature}`)
      
      // Обновляем позиции
      await loadPositions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка claim rewards')
    } finally {
      setIsClaiming(false)
    }
  }

  // Загрузка данных при монтировании
  useEffect(() => {
    if (connected && publicKey) {
      loadPositions()
      
      // Инициализация InvisibleDeflationAdapter и TransactionFeeCalculator
      // В реальной реализации нужно передать реальные экземпляры
      // которые будут интегрированы с wallet adapter
    }
  }, [connected, publicKey])

  // Рассчитаем общие rewards
  const totalRewards = positions.reduce((sum, position) => sum + position.rewards, 0)

  if (!connected) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Пожалуйста, подключите кошелек для использования Staking Manager
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatTokens(ndtBalance)}
              </div>
              <div className="text-sm text-muted-foreground">NDT Balance</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {positions.length}
              </div>
              <div className="text-sm text-muted-foreground">Active Positions</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatTokens(totalRewards)}
              </div>
              <div className="text-sm text-muted-foreground">Total Rewards</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staking Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Новый стейкинг
          </CardTitle>
          <CardDescription>
            Выберите уровень и период блокировки для стейкинга
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tier Selection */}
          <div className="space-y-3">
            <h4 className="font-medium">Выберите уровень</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {STAKING_TIERS.map((tier) => (
                <div
                  key={tier.level}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedTier?.level === tier.level
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedTier(tier)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{tier.icon}</span>
                    <Badge variant={tier.level === 'GOLD' ? 'default' : 'secondary'}>
                      {tier.level}
                    </Badge>
                  </div>
                  <div className="text-sm font-medium">{tier.apy}% APY</div>
                  <div className="text-xs text-muted-foreground">
                    {formatTokens(tier.minAmount)} - {formatTokens(tier.maxAmount)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lock Period Selection */}
          {selectedTier && (
            <div className="space-y-3">
              <h4 className="font-medium">Период блокировки</h4>
              <div className="flex gap-2">
                {selectedTier.lockPeriods.map((period) => (
                  <Button
                    key={period}
                    variant={selectedLockPeriod === period ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedLockPeriod(period)}
                  >
                    {period} {period === 1 ? 'месяц' : 'месяцев'}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Amount Input */}
          {selectedTier && (
            <div className="space-y-3">
              <h4 className="font-medium">Сумма стейкинга</h4>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={selectedTier.minAmount}
                  max={selectedTier.maxAmount}
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(Number(e.target.value))}
                  className="flex-1 px-3 py-2 border rounded-md"
                  placeholder={`Мин: ${formatTokens(selectedTier.minAmount)}`}
                />
                <Button
                  variant="outline"
                  onClick={() => setStakeAmount(selectedTier.minAmount)}
                  size="sm"
                >
                  Мин
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setStakeAmount(Math.min(selectedTier.maxAmount, ndtBalance))}
                  size="sm"
                >
                  Макс
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                Ожидаемые rewards: {formatTokens(
                  calculateRewards(stakeAmount, selectedTier.apy, selectedLockPeriod)
                )}
              </div>
            </div>
          )}

          {/* Stake Button */}
          {selectedTier && stakeAmount > 0 && (
            <Button
              onClick={handleStake}
              disabled={isStaking}
              className="w-full"
              size="lg"
            >
              {isStaking ? 'Staking...' : `Stake ${formatTokens(stakeAmount)}`}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Active Positions */}
      {positions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Активные позиции
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {positions.map((position) => {
              const timeRemaining = position.endTime - Date.now()
              const daysRemaining = Math.ceil(timeRemaining / (24 * 60 * 60 * 1000))
              const progress = Math.max(0, Math.min(100, (timeRemaining / (position.lockPeriod * 30 * 24 * 60 * 60 * 1000)) * 100))

              return (
                <div key={position.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{position.tier.icon}</span>
                      <div>
                        <div className="font-medium">{position.tier.level} Level</div>
                        <div className="text-sm text-muted-foreground">
                          {formatTokens(position.amount)} NDT • {position.lockPeriod} мес
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{position.tier.apy}% APY</div>
                      <div className="text-sm text-green-600">
                        +{formatTokens(position.rewards)} rewards
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Время блокировки</span>
                      <span className={daysRemaining > 0 ? 'text-orange-600' : 'text-green-600'}>
                        {daysRemaining > 0 ? `${daysRemaining} дней осталось` : 'Заблокирован'}
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  <div className="flex gap-2">
                    {daysRemaining <= 0 && (
                      <Button
                        onClick={() => handleUnstake(position.id)}
                        disabled={isUnstaking}
                        variant="outline"
                        size="sm"
                      >
                        {isUnstaking ? 'Unstaking...' : 'Unstake'}
                      </Button>
                    )}
                    {position.rewards > 0 && (
                      <Button
                        onClick={() => handleClaimRewards(position.id)}
                        disabled={isClaiming}
                        variant="default"
                        size="sm"
                      >
                        {isClaiming ? 'Claiming...' : 'Claim Rewards'}
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Error and Success Messages */}
      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-green-500 text-sm">
          <CheckCircle className="h-4 w-4" />
          {success}
        </div>
      )}
    </div>
  )
}