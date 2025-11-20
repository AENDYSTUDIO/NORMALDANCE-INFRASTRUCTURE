
'use client'

import { useState, useEffect, useCallback } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button, Input, Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Progress, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui'
import { 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Lock,
  Unlock,
  Calculator,
  AlertCircle,
  CheckCircle,
  Loader2,
  Star,
  Zap,
  Calendar,
  Target,
  Activity,
  BarChart3,
  PieChart,
  Shield,
  Rocket,
  Gift,
  Sparkles,
  TrendingDown,
  RefreshCw
} from '@/components/icons'
import { formatNumber } from '@/lib/utils'
import { InvisibleDeflationAdapter } from '../wallet/invisible-deflation-adapter';

interface StakingPool {
  id: string
  name: string
  type: 'fixed' | 'flexible' | 'liquidity' | 'nft' | 'tiered'
  apy: number
  minAmount: number
  maxAmount: number
  duration: number
  totalStaked: number
  participants: number
  isAvailable: boolean
  description: string
  riskLevel: 'low' | 'medium' | 'high'
  earlyWithdrawalPenalty: number
  compoundFrequency: 'daily' | 'weekly' | 'monthly'
  performanceFee: number
  bonus?: {
    type: 'referral' | 'lockup' | 'volume'
    value: number
    description: string
  }
}

interface UserStake {
  id: string
  poolName: string
  poolId: string
  amount: number
  apy: number
  startDate: string
  endDate: string
  earned: number
  status: 'active' | 'completed' | 'withdrawn' | 'penalized'
  type: string
  compoundCount: number
  lastCompoundDate?: string
}

interface StakingRewards {
  daily: number
  weekly: number
  monthly: number
  yearly: number
  total: number
}

interface StakingAnalytics {
  apyHistory: Array<{ date: string; apy: number }>
  volumeHistory: Array<{ date: string; volume: number }>
  userRank: number
  totalParticipants: number
  successRate: number
}

// Mock data for enhanced staking pools
const mockStakingPools: StakingPool[] = [
  {
    id: '1',
    name: 'Standard Fixed',
    type: 'fixed',
    apy: 12.5,
    minAmount: 100,
    maxAmount: 10000,
    duration: 30,
    totalStaked: 50000,
    participants: 1234,
    isAvailable: true,
    description: 'Фиксированный стейкинг с предсказуемой доходностью',
    riskLevel: 'low',
    earlyWithdrawalPenalty: 25,
    compoundFrequency: 'daily',
    performanceFee: 10,
    bonus: {
      type: 'lockup',
      value: 2,
      description: '+2% за полный срок блокировки'
    }
  },
  {
    id: '2',
    name: 'Premium Flexible',
    type: 'flexible',
    apy: 8.5,
    minAmount: 500,
    maxAmount: 50000,
    duration: 0,
    totalStaked: 120000,
    participants: 567,
    isAvailable: true,
    description: 'Гибкий стейкинг с возможностью снятия в любой момент',
    riskLevel: 'low',
    earlyWithdrawalPenalty: 5,
    compoundFrequency: 'weekly',
    performanceFee: 5
  },
  {
    id: '3',
    name: 'Liquidity Mining',
    type: 'liquidity',
    apy: 18.0,
    minAmount: 1000,
    maxAmount: 100000,
    duration: 90,
    totalStaked: 300000,
    participants: 89,
    isAvailable: true,
    description: 'Стейкинг ликвидности для DEX пулов',
    riskLevel: 'medium',
    earlyWithdrawalPenalty: 15,
    compoundFrequency: 'daily',
    performanceFee: 20,
    bonus: {
      type: 'volume',
      value: 5,
      description: '+5% за объем свыше 10,000 NDT'
    }
  },
  {
    id: '4',
    name: 'NFT Staking Elite',
    type: 'nft',
    apy: 25.0,
    minAmount: 5000,
    maxAmount: 50000,
    duration: 180,
    totalStaked: 150000,
    participants: 34,
    isAvailable: true,
    description: 'Эксклюзивный стейкинг для держателей NFT',
    riskLevel: 'medium',
    earlyWithdrawalPenalty: 10,
    compoundFrequency: 'monthly',
    performanceFee: 15
  },
  {
    id: '5',
    name: 'Tiered VIP',
    type: 'tiered',
    apy: 30.0,
    minAmount: 25000,
    maxAmount: 250000,
    duration: 365,
    totalStaked: 750000,
    participants: 12,
    isAvailable: true,
    description: 'VIP стейкинг с прогрессивной доходностью',
    riskLevel: 'high',
    earlyWithdrawalPenalty: 30,
    compoundFrequency: 'daily',
    performanceFee: 25,
    bonus: {
      type: 'referral',
      value: 10,
      description: '+10% за привлечение VIP клиентов'
    }
  }
]

const mockUserStakes: UserStake[] = [
  {
    id: '1',
    poolName: 'Standard Fixed',
    poolId: '1',
    amount: 1000,
    apy: 12.5,
    startDate: '2024-01-15T10:00:00Z',
    endDate: '2024-02-14T10:00:00Z',
    earned: 10.42,
    status: 'active',
    type: 'fixed',
    compoundCount: 15
  },
  {
    id: '2',
    poolName: 'Premium Flexible',
    poolId: '2',
    amount: 5000,
    apy: 8.5,
    startDate: '2024-01-10T10:00:00Z',
    endDate: null,
    earned: 35.21,
    status: 'active',
    type: 'flexible',
    compoundCount: 3
  }
]

export function StakingInterface() {
  const [userBalance, setUserBalance] = useState(15000)
  const [selectedPool, setSelectedPool] = useState<StakingPool>(mockStakingPools[0])
  const [stakeAmount, setStakeAmount] = useState('')
  const [isStaking, setIsStaking] = useState(false)
  const [isUnstaking, setIsUnstaking] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [stakes, setStakes] = useState<UserStake[]>(mockUserStakes)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [rewards, setRewards] = useState<StakingRewards>({
    daily: 0,
    weekly: 0,
    monthly: 0,
    yearly: 0,
    total: 0
  })
  const [analytics, setAnalytics] = useState<StakingAnalytics | null>(null)
  const [autoCompound, setAutoCompound] = useState(true)
  const [compoundFrequency, setCompoundFrequency] = useState('daily')
  const [invisibleDeflationAdapter, setInvisibleDeflationAdapter] = useState<InvisibleDeflationAdapter | null>(null)

  // Расчет вознаграждений с учетом сложного процента
  const calculateRewards = useCallback((amount: number, apy: number, days: number, compound: string): StakingRewards => {
    const frequencies = {
      daily: 365,
      weekly: 52,
      monthly: 12
    }
    
    const compoundPerYear = frequencies[compound as keyof typeof frequencies] || 365
    const rate = apy / 100
    const years = days / 365
    
    // Формула сложного процента: A = P(1 + r/n)^(nt)
    const totalAmount = amount * Math.pow(1 + rate / compoundPerYear, compoundPerYear * years)
    const totalEarned = totalAmount - amount
    
    return {
      daily: (totalEarned / days) * 1,
      weekly: (totalEarned / days) * 7,
      monthly: (totalEarned / days) * 30,
      yearly: totalEarned / years,
      total: totalEarned
    }
  }, [])

  // Обновление вознаграждений в реальном времени
  useEffect(() => {
    if (stakeAmount && selectedPool) {
      const amount = parseFloat(stakeAmount) || 0
      const calculatedRewards = calculateRewards(
        amount,
        selectedPool.apy,
        selectedPool.duration,
        selectedPool.compoundFrequency
      )
      setRewards(calculatedRewards)
    }
  }, [stakeAmount, selectedPool, calculateRewards])

  // Симуляция обновления вознаграждений для активных стейков
  useEffect(() => {
    const interval = setInterval(() => {
      setStakes(prev => prev.map(stake => {
        if (stake.status === 'active') {
          const dailyReward = (stake.amount * stake.apy / 100) / 365
          return {
            ...stake,
            earned: stake.earned + dailyReward
          }
        }
        return stake
      }))
    }, 5000) // Обновление каждые 5 секунд

    return () => clearInterval(interval)
  }, [])

  // Инициализация аналитики
  useEffect(() => {
    const mockAnalytics: StakingAnalytics = {
      apyHistory: [
        { date: '2024-01', apy: 12.0 },
        { date: '2024-02', apy: 12.5 },
        { date: '2024-03', apy: 13.2 },
        { date: '2024-04', apy: 12.8 }
      ],
      volumeHistory: [
        { date: '2024-01', volume: 45000 },
        { date: '2024-02', volume: 52000 },
        { date: '2024-03', volume: 68000 },
        { date: '2024-04', volume: 75000 }
      ],
      userRank: 127,
      totalParticipants: 2341,
      successRate: 98.5
    }
    setAnalytics(mockAnalytics)
  }, [])

  const handleStake = async () => {
    const amount = parseFloat(stakeAmount)
    if (!amount || amount <= 0) {
      setError('Пожалуйста, введите корректную сумму')
      return
    }

    if (amount > userBalance) {
      setError('Недостаточно средств на балансе')
      return
    }

    if (amount < selectedPool.minAmount) {
      setError(`Минимальная сумма для стейкинга: ${selectedPool.minAmount} NDT`)
      return
    }

    if (amount > selectedPool.maxAmount && selectedPool.maxAmount > 0) {
      setError(`Максимальная сумма для стейкинга: ${selectedPool.maxAmount} NDT`)
      return
    }

    setIsStaking(true)
    setError(null)
    setSuccess(null)

    try {
      // Simulate staking transaction
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Update user balance
      setUserBalance(prev => prev - amount)
      
      // Add new stake
      const newStake: UserStake = {
        id: Date.now().toString(),
        poolName: selectedPool.name,
        poolId: selectedPool.id,
        amount,
        apy: selectedPool.apy,
        startDate: new Date().toISOString(),
        endDate: selectedPool.duration > 0 
          ? new Date(Date.now() + selectedPool.duration * 24 * 60 * 60 * 1000).toISOString()
          : null,
        earned: 0,
        status: 'active',
        type: selectedPool.type,
        compoundCount: 0
      }
      
      setStakes(prev => [newStake, ...prev])
      setSuccess(`Успешно заблокировано ${amount} NDT в пуле ${selectedPool.name}`)
      setStakeAmount('')
    } catch (err) {
      setError('Ошибка при стейкинге. Пожалуйста, попробуйте снова.')
    } finally {
      setIsStaking(false)
    }
  }

  const handleUnstake = async (stakeId: string, early = false) => {
    setIsUnstaking(true)
    setError(null)

    try {
      // Simulate unstaking transaction
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const stake = stakes.find(s => s.id === stakeId)
      if (!stake) return

      // Calculate penalty for early withdrawal
      let penaltyAmount = 0
      if (early && selectedPool.earlyWithdrawalPenalty > 0) {
        const daysPassed = (Date.now() - new Date(stake.startDate).getTime()) / (1000 * 60 * 60 * 24)
        const totalDays = selectedPool.duration || 30
        const remainingDays = Math.max(0, totalDays - daysPassed)
        penaltyAmount = (stake.amount * selectedPool.earlyWithdrawalPenalty / 100) * (remainingDays / totalDays)
      }

      // Update stake status
      setStakes(prev => prev.map(s => 
        s.id === stakeId 
          ? { 
              ...s, 
              status: penaltyAmount > 0 ? 'penalized' : 'completed',
              earned: s.earned - penaltyAmount
            } 
          : s
      ))
      
      // Return funds to balance (minus penalty)
      const returnAmount = stake.amount - penaltyAmount
      setUserBalance(prev => prev + returnAmount)
      
      if (penaltyAmount > 0) {
        setSuccess(`Средства разблокированы со штрафом ${penaltyAmount.toFixed(2)} NDT`)
      } else {
        setSuccess('Средства успешно разблокированы')
      }
    } catch (err) {
      setError('Ошибка при разблокировке средств. Пожалуйста, попробуйте снова.')
    } finally {
      setIsUnstaking(false)
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'fixed': return <Lock className="h-4 w-4" />
      case 'flexible': return <RefreshCw className="h-4 w-4" />
      case 'liquidity': return <Activity className="h-4 w-4" />
      case 'nft': return <Gift className="h-4 w-4" />
      case 'tiered': return <Star className="h-4 w-4" />
      default: return <Target className="h-4 w-4" />
    }
  }

  const totalStaked = stakes.reduce((sum, stake) => sum + stake.amount, 0)
  const totalEarned = stakes.reduce((sum, stake) => sum + stake.earned, 0)
  const activeStakes = stakes.filter(s => s.status === 'active')
  
  // Function to update stake rewards with deflation consideration
  const updateStakeRewardsWithDeflation = useCallback(() => {
    if (invisibleDeflationAdapter) {
      setStakes(prev => prev.map(stake => {
        if (stake.status === 'active') {
          // Calculate daily reward with deflation consideration
          const dailyReward = (stake.amount * stake.apy / 100) / 365;
          
          // Apply deflation model to the rewards
          const deflationResult = invisibleDeflationAdapter.calculateFees(dailyReward);
          const netReward = dailyReward - deflationResult.feeAmount;
          
          return {
            ...stake,
            earned: stake.earned + netReward
          }
        }
        return stake
      }))
    } else {
      // Fallback to original behavior if no deflation adapter
      setStakes(prev => prev.map(stake => {
        if (stake.status === 'active') {
          const dailyReward = (stake.amount * stake.apy / 100) / 365
          return {
            ...stake,
            earned: stake.earned + dailyReward
          }
        }
        return stake
      }))
    }
  }, [invisibleDeflationAdapter])
  
  // Update rewards with deflation consideration
  useEffect(() => {
    const interval = setInterval(() => {
      updateStakeRewardsWithDeflation();
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [updateStakeRewardsWithDeflation])

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Hero section */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-4">Стейкинг NDT</h1>
              <p className="text-lg mb-6 opacity-90">
                Зарабатывайте пассивный доход с разными стратегиями стейкинга
              </p>
              <div className="flex gap-4">
                <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
                  <Zap className="h-4 w-4 mr-2" />
                  Начать стейкинг
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Аналитика
                </Button>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="text-right">
                <div className="text-3xl font-bold">{formatNumber(totalEarned)} NDT</div>
                <div className="text-sm opacity-75">Всего заработано</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Баланс NDT</p>
                  <p className="text-2xl font-bold">{formatNumber(userBalance)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Всего заблокировано</p>
                  <p className="text-2xl font-bold">{formatNumber(totalStaked)}</p>
                </div>
                <Lock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Заработано</p>
                  <p className="text-2xl font-bold text-green-600">{formatNumber(totalEarned)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Активные стейки</p>
                  <p className="text-2xl font-bold">{activeStakes.length}</p>
                </div>
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Обзор</TabsTrigger>
            <TabsTrigger value="stake">Стейкинг</TabsTrigger>
            <TabsTrigger value="my-stakes">Мои стейки</TabsTrigger>
            <TabsTrigger value="analytics">Аналитика</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Pool overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Доступные пулы стейкинга</CardTitle>
                  <CardDescription>
                    Выберите стратегию, которая подходит вам
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockStakingPools.map((pool) => (
                      <div
                        key={pool.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedPool.id === pool.id 
                            ? 'border-primary bg-primary/5 shadow-md' 
                            : 'hover:bg-accent'
                        }`}
                        onClick={() => setSelectedPool(pool)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            {getTypeIcon(pool.type)}
                            <h4 className="font-medium">{pool.name}</h4>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getRiskColor(pool.riskLevel)}>
                              {pool.riskLevel}
                            </Badge>
                            <Badge variant="secondary">{pool.apy}% APY</Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{pool.description}</p>
                        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                          <div>
                            <span>Мин: {pool.minAmount} NDT</span>
                          </div>
                          <div>
                            <span>Макс: {pool.maxAmount} NDT</span>
                          </div>
                          <div>
                            <span>Срок: {pool.duration > 0 ? pool.duration + ' дн' : 'Без срока'}</span>
                          </div>
                          <div>
                            <span>Участников: {pool.participants}</span>
                          </div>
                        </div>
                        {pool.bonus && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                            <span className="text-blue-700 font-medium">Бонус:</span> {pool.bonus.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Selected pool details */}
              <Card>
                <CardHeader>
                  <CardTitle>Детали пула</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Название пула</span>
                      <span className="text-sm font-medium">{selectedPool.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Тип стейкинга</span>
                      <div className="flex items-center space-x-1">
                        {getTypeIcon(selectedPool.type)}
                        <span className="text-sm font-medium capitalize">{selectedPool.type}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Годовая доходность (APY)</span>
                      <span className="text-sm font-medium text-green-600">{selectedPool.apy}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Срок блокировки</span>
                      <span className="text-sm font-medium">
                        {selectedPool.duration > 0 ? selectedPool.duration + ' дней' : 'Без ограничений'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Минимальная сумма</span>
                      <span className="text-sm font-medium">{selectedPool.minAmount} NDT</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Максимальная сумма</span>
                      <span className="text-sm font-medium">{selectedPool.maxAmount} NDT</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Частота капитализации</span>
                      <span className="text-sm font-medium capitalize">{selectedPool.compoundFrequency}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Общий объем стейкинга</span>
                        <span className="text-sm font-medium">{formatNumber(selectedPool.totalStaked)} NDT</span>
                      </div>
                      <Progress 
                        value={(selectedPool.totalStaked / 1000000) * 100} 
                        className="h-2"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Участников</span>
                      <span className="text-sm font-medium">{selectedPool.participants}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Важная информация</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Штраф за ранний вывод: {selectedPool.earlyWithdrawalPenalty}%</li>
                      <li>• Комиссия за управление: {selectedPool.performanceFee}%</li>
                      <li>• Риск уровня: {selectedPool.riskLevel}</li>
                      {selectedPool.bonus && (
                        <li className="text-blue-700">• Бонус: {selectedPool.bonus.description}</li>
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="stake" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Staking form */}
              <Card>
                <CardHeader>
                  <CardTitle>Стейкинг NDT</CardTitle>
                  <CardDescription>
                    Выберите пул и заблокируйте ваши токены для получения дохода
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Pool selection */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Выберите пул</label>
                    <div className="space-y-2">
                      {mockStakingPools.map((pool) => (
                        <div
                          key={pool.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedPool.id === pool.id ? 'border-primary bg-primary/5' : 'hover:bg-accent'
                          }`}
                          onClick={() => setSelectedPool(pool)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              {getTypeIcon(pool.type)}
                              <h4 className="font-medium">{pool.name}</h4>
                            </div>
                            <Badge variant="secondary">{pool.apy}% APY</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{pool.description}</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Мин: {pool.minAmount} NDT</span>
                            <span>Макс: {pool.maxAmount} NDT</span>
                            <span>{pool.duration > 0 ? pool.duration + ' дн' : 'Без срока'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Amount input */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Сумма для стейкинга</label>
                    <Input
                      type="number"
                      placeholder="Введите сумму NDT"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                    />
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <span>Доступно: {formatNumber(userBalance)} NDT</span>
                      <span>Мин: {selectedPool.minAmount} NDT</span>
                    </div>
                  </div>

                  {/* Rewards preview */}
                  {stakeAmount && (
                    <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                      <CardContent className="p-4">
                        <h4 className="text-sm font-medium mb-3 text-green-800 dark:text-green-200">
                          Ожидаемые вознаграждения
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Дневной доход:</span>
                            <span className="font-medium text-green-600">
                              {formatNumber(rewards.daily)} NDT
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Недельный доход:</span>
                            <span className="font-medium text-green-600">
                              {formatNumber(rewards.weekly)} NDT
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Месячный доход:</span>
                            <span className="font-medium text-green-600">
                              {formatNumber(rewards.monthly)} NDT
                            </span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span>Общий доход за срок:</span>
                            <span className="font-bold text-green-600">
                              {formatNumber(rewards.total)} NDT
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Compound settings */}
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Автоматическая капитализация</label>
                      <Button
                        variant={autoCompound ? "default" : "outline"}
                        size="sm"
                        onClick={() => setAutoCompound(!autoCompound)}
                      >
                        {autoCompound ? 'Включено' : 'Выключено'}
                      </Button>
                    </div>
                    {autoCompound && (
                      <div className="text-xs text-muted-foreground">
                        Капитализация: {selectedPool.compoundFrequency}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleStake}
                      disabled={isStaking || !stakeAmount}
                      className="flex-1"
                    >
                      {isStaking ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Обработка...
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          Заблокировать
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setStakeAmount('')}
                      disabled={isStaking}
                    >
                      Очистить
                    </Button>
                  </div>

                  {/* Error and success messages */}
                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-md">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <span className="text-sm text-destructive">{error}</span>
                    </div>
                  )}
                  {success && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-md">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">{success}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Visualization */}
              <Card>
                <CardHeader>
                  <CardTitle>Визуализация доходности</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stakeAmount ? (
                    <>
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Инвестиция</span>
                            <span className="text-sm font-medium">{formatNumber(parseFloat(stakeAmount) || 0)} NDT</span>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Ожидаемый доход</span>
                            <span className="text-sm font-medium text-green-600">
                              +{formatNumber(rewards.total)} NDT
                            </span>
                          </div>
                          <Progress 
                            value={(rewards.total / (parseFloat(stakeAmount) || 1)) * 100} 
                            className="h-2"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Итоговая сумма</span>
                            <span className="text-sm font-medium text-purple-600">
                              {formatNumber((parseFloat(stakeAmount) || 0) + rewards.total)} NDT
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-lg font-bold text-blue-600">{selectedPool.apy}%</div>
                          <div className="text-xs text-muted-foreground">APY</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-lg font-bold text-green-600">{selectedPool.duration}</div>
                          <div className="text-xs text-muted-foreground">Дней</div>
                        </div>
                      </div>

                      <div className="p-3 bg-purple-50 rounded-lg">
                        <h4 className="text-sm font-medium mb-2 text-purple-800">График роста</h4>
                        <div className="h-32 bg-white/50 rounded flex items-end justify-around p-2">
                          <div className="w-4 bg-purple-400 rounded-t" style={{ height: '20%' }} />
                          <div className="w-4 bg-purple-400 rounded-t" style={{ height: '35%' }} />
                          <div className="w-4 bg-purple-400 rounded-t" style={{ height: '50%' }} />
                          <div className="w-4 bg-purple-400 rounded-t" style={{ height: '70%' }} />
                          <div className="w-4 bg-purple-600 rounded-t" style={{ height: '90%' }} />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>Месяц 1</span>
                          <span>Месяц 3</span>
                          <span>Месяц 6</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Введите сумму для просмотра визуализации доходности</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="my-stakes" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Мои стейки</CardTitle>
                  <CardDescription>
                    Управляйте вашими активными стейками
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stakes.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Lock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>У вас нет активных стейков</p>
                        <p className="text-sm">Начните стейкинг, чтобы зарабатывать пассивный доход</p>
                      </div>
                    ) : (
                      stakes.map((stake) => (
                        <div key={stake.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-medium">{stake.poolName}</h4>
                              <p className="text-sm text-muted-foreground">
                                {new Date(stake.startDate).toLocaleDateString('ru-RU')}
                                {stake.endDate && ` - ${new Date(stake.endDate).toLocaleDateString('ru-RU')}`}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={stake.status === 'active' ? 'default' : 'secondary'}>
                                {stake.status === 'active' ? 'Активен' : 
                                 stake.status === 'completed' ? 'Завершен' :
                                 stake.status === 'penalized' ? 'Со штрафом' : 'Выведен'}
                              </Badge>
                              {stake.type && (
                                <Badge variant="outline" className="text-xs">
                                  {stake.type}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Сумма:</span>
                              <p className="font-medium">{formatNumber(stake.amount)} NDT</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">APY:</span>
                              <p className="font-medium">{stake.apy}%</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Заработано:</span>
                              <p className="font-medium text-green-600">{formatNumber(stake.earned)} NDT</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Капитализаций:</span>
                              <p className="font-medium">{stake.compoundCount}</p>
                            </div>
                            <div className="flex items-center justify-end">
                              {stake.status === 'active' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUnstake(stake.id, true)}
                                  disabled={isUnstaking}
                                >
                                  {isUnstaking ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Unlock className="h-4 w-4 mr-2" />
                                      Вывести
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Real-time earnings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Доход в реальном времени
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activeStakes.length > 0 ? (
                    <>
                      <div className="space-y-3">
                        {activeStakes.map((stake, index) => (
                          <div key={stake.id} className="p-3 bg-muted rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">{stake.poolName}</span>
                              <Badge variant="outline" className="text-xs">
                                {stake.apy}%
                              </Badge>
                            </div>
                            <div className="space-y-1 text-xs text-muted-foreground">
                              <div className="flex justify-between">
                                <span>Текущий доход:</span>
                                <span className="text-green-600 font-medium">
                                  +{formatNumber(stake.earned)} NDT
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Дневной прирост:</span>
                                <span className="text-blue-600 font-medium">
                                  +{formatNumber((stake.amount * stake.apy / 100) / 365)} NDT
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4 border-t">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {formatNumber(totalEarned)}
                          </div>
                          <div className="text-sm text-muted-foreground">Всего заработано</div>
                        </div>
                      </div>

                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                          <span>Средняя доходность:</span>
                          <span className="font-medium text-green-600">
                            {activeStakes.length > 0 
                              ? (activeStakes.reduce((sum, s) => sum + s.apy, 0) / activeStakes.length).toFixed(1)
                              : 0}%
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Нет активных стейков</p>
                      <p className="text-sm">Начните стейкинг для получения дохода</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {analytics ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>История APY</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.apyHistory.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{item.date}</span>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              item.apy >= 13 ? 'bg-green-500' : 
                              item.apy >= 12 ? 'bg-yellow-500' : 'bg-red-500'
                            }`} />
                            <span className="text-sm font-medium">{item.apy}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Объем стейкинга</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.volumeHistory.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{item.date}</span>
                          <span className="text-sm font-medium">{formatNumber(item.volume)} NDT</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Аналитика недоступна</div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
