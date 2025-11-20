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
  solToLamports,
  createTransaction
} from './wallet-adapter'
import {
  Coins,
  TrendingUp,
  Clock,
  Lock,
  Unlock,
  Zap,
  AlertCircle
} from '@/components/icons'
import { Connection, PublicKey, Transaction } from '@solana/web3.js'

interface StakingInfo {
  total_staked: number
  apy: number
  level: 'BRONZE' | 'SILVER' | 'GOLD'
  lock_period_months: number
  pending_rewards: number
  lock_period_remaining: number
}

interface NDTManagerProps {
  className?: string
}

export function NDTManager({ className }: NDTManagerProps) {
  const { connected, publicKey, balance } = useWalletContext()
  const { sendTransaction } = useTransactions()
  const [ndtBalance, setNdtBalance] = useState<number>(0)
  const [stakingInfo, setStakingInfo] = useState<StakingInfo | null>(null)
  const [isStaking, setIsStaking] = useState(false)
  const [isUnstaking, setIsUnstaking] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [invisibleDeflationAdapter, setInvisibleDeflationAdapter] = useState<InvisibleDeflationAdapter | null>(null)
  const [feeCalculator, setFeeCalculator] = useState<TransactionFeeCalculator | null>(null)

  // Загрузка информации о стейкинге
  const loadStakingInfo = async () => {
    if (!publicKey) return

    try {
      // Здесь нужно вызвать смарт-контракт для получения информации
      // Временно используем mock данные
      const mockInfo: StakingInfo = {
        total_staked: 1000000000, // 1000 NDT
        apy: 15,
        level: 'SILVER',
        lock_period_months: 6,
        pending_rewards: 50000000, // 50 NDT
        lock_period_remaining: 30 * 24 * 60 * 60, // 30 дней
      }
      setStakingInfo(mockInfo)
    } catch (err) {
      console.error('Error loading staking info:', err)
    }
  }

  // Стейкинг токенов
  const handleStake = async (amount: number, lockPeriod: number) => {
    if (!publicKey) return

    setIsStaking(true)
    setError(null)
    setSuccess(null)

    try {
      // Создаем инструкции для стейкинга
      const instructions = [
        // Здесь нужно добавить реальные инструкции для вызова смарт-контракта
        // Временно используем mock транзакцию
      ]

      const transaction = await createTransaction(
        new Connection('https://api.devnet.solana.com'),
        { publicKey, signTransaction: async () => new Transaction() },
        instructions
      )

      const signature = await sendTransaction({ instructions })
      setSuccess(`Стейкинг успешен! TX: ${signature}`)
      
      // Обновляем информацию
      await loadStakingInfo()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка стейкинга')
    } finally {
      setIsStaking(false)
    }
  }

  // Unstaking токенов
  const handleUnstake = async (amount: number) => {
    if (!publicKey) return

    setIsUnstaking(true)
    setError(null)
    setSuccess(null)

    try {
      // Создаем инструкции для unstaking
      const instructions = [
        // Здесь нужно добавить реальные инструкции для вызова смарт-контракта
      ]

      const transaction = await createTransaction(
        new Connection('https://api.devnet.solana.com'),
        { publicKey, signTransaction: async () => new Transaction() },
        instructions
      )

      const signature = await sendTransaction({ instructions })
      setSuccess(`Unstaking успешен! TX: ${signature}`)
      
      // Обновляем информацию
      await loadStakingInfo()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка unstaking')
    } finally {
      setIsUnstaking(false)
    }
  }

  // Claim rewards
  const handleClaimRewards = async () => {
    if (!publicKey) return

    setIsClaiming(true)
    setError(null)
    setSuccess(null)

    try {
      // Создаем инструкции для claim rewards
      const instructions = [
        // Здесь нужно добавить реальные инструкции для вызова смарт-контракта
      ]

      const transaction = await createTransaction(
        new Connection('https://api.devnet.solana.com'),
        { publicKey, signTransaction: async () => new Transaction() },
        instructions
      )

      const signature = await sendTransaction({ instructions })
      setSuccess(`Rewards claimed! TX: ${signature}`)
      
      // Обновляем информацию
      await loadStakingInfo()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка claim rewards')
    } finally {
      setIsClaiming(false)
    }
  }

  // Загрузка данных при монтировании
  useEffect(() => {
    if (connected && publicKey) {
      loadStakingInfo()
      
      // Инициализация InvisibleDeflationAdapter и TransactionFeeCalculator
      // В реальной реализации нужно передать реальные экземпляры
      // которые будут интегрированы с wallet adapter
    }
  }, [connected, publicKey])

  if (!connected) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Пожалуйста, подключите кошелек для использования NDT Manager
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* NDT Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            NDT Токены
          </CardTitle>
          <CardDescription>
            Управление вашими NDT токенами и стейкингом
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Баланс NDT:</span>
            <Badge variant="secondary" className="font-mono">
              {formatTokens(ndtBalance)}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Баланс SOL:</span>
            <span className="font-mono">{formatSol(balance || 0)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Staking Info Card */}
      {stakingInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Стейкинг Информация
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium">Застейкено:</span>
                <div className="text-lg font-bold">{formatTokens(stakingInfo.total_staked)}</div>
              </div>
              <div>
                <span className="text-sm font-medium">Уровень:</span>
                <Badge variant={stakingInfo.level === 'GOLD' ? 'default' : 'secondary'}>
                  {stakingInfo.level}
                </Badge>
              </div>
              <div>
                <span className="text-sm font-medium">APY:</span>
                <div className="text-lg font-bold text-green-600">{stakingInfo.apy}%</div>
              </div>
              <div>
                <span className="text-sm font-medium">Период блокировки:</span>
                <div className="text-lg font-bold">{stakingInfo.lock_period_months} мес.</div>
              </div>
            </div>

            {stakingInfo.pending_rewards > 0 && (
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Накопленные rewards:</span>
                  <span className="font-bold text-green-600">
                    {formatTokens(stakingInfo.pending_rewards)}
                  </span>
                </div>
                <Button 
                  onClick={handleClaimRewards}
                  disabled={isClaiming}
                  className="w-full mt-2"
                  size="sm"
                >
                  {isClaiming ? 'Claiming...' : 'Claim Rewards'}
                </Button>
              </div>
            )}

            {stakingInfo.lock_period_remaining > 0 && (
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium">
                    Осталось до разблокировки: {Math.ceil(stakingInfo.lock_period_remaining / (24 * 60 * 60))} дней
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Staking Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Действия стейкинга</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stake Form */}
          <div className="space-y-3">
            <h4 className="font-medium">Стейкинг NDT</h4>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                onClick={() => handleStake(100000000, 3)} // 100 NDT, 3 месяца
                disabled={isStaking}
                size="sm"
              >
                100 NDT / 3 мес
              </Button>
              <Button
                variant="outline"
                onClick={() => handleStake(500000000, 6)} // 500 NDT, 6 месяцев
                disabled={isStaking}
                size="sm"
              >
                500 NDT / 6 мес
              </Button>
              <Button
                variant="outline"
                onClick={() => handleStake(1000000000, 12)} // 1000 NDT, 12 месяцев
                disabled={isStaking}
                size="sm"
              >
                1000 NDT / 12 мес
              </Button>
            </div>
          </div>

          {/* Unstake Button */}
          {stakingInfo && stakingInfo.total_staked > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Unstaking</h4>
              <Button
                onClick={() => handleUnstake(stakingInfo.total_staked)}
                disabled={isUnstaking || stakingInfo.lock_period_remaining > 0}
                variant="destructive"
                className="w-full"
                size="sm"
              >
                {isUnstaking ? 'Unstaking...' : 'Unstake All'}
              </Button>
            </div>
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
              <Zap className="h-4 w-4" />
              {success}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Staking Tiers Info */}
      <Card>
        <CardHeader>
          <CardTitle>Уровни стейкинга</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Bronze</Badge>
                <span className="text-sm">500+ NDT</span>
              </div>
              <span className="text-sm font-medium">5-10% APY</span>
            </div>
            <Progress value={20} className="h-2" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="default">Silver</Badge>
                <span className="text-sm">5,000+ NDT</span>
              </div>
              <span className="text-sm font-medium">10-15% APY</span>
            </div>
            <Progress value={50} className="h-2" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-yellow-500 text-white">Gold</Badge>
                <span className="text-sm">50,000+ NDT</span>
              </div>
              <span className="text-sm font-medium">15-25% APY</span>
            </div>
            <Progress value={80} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}