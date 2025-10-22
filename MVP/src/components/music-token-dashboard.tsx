'use client'

import { useState, useEffect } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Coins, Music, TrendingUp, Clock, CheckCircle } from 'lucide-react'

interface TokenBalance {
  balance: number
  rewards: number
  staked: number
}

export function MusicTokenDashboard() {
  const { publicKey, connected } = useWallet()
  const { connection } = useConnection()
  const [tokenBalance, setTokenBalance] = useState<TokenBalance>({
    balance: 0,
    rewards: 0,
    staked: 0
  })
  const [stakeAmount, setStakeAmount] = useState('')
  const [stakeDuration, setStakeDuration] = useState('30')
  const [loading, setLoading] = useState(false)

  // Fetch user's token data
  useEffect(() => {
    if (connected && publicKey) {
      fetchTokenData()
    }
  }, [connected, publicKey])

  const fetchTokenData = async () => {
    if (!publicKey) return

    try {
      // Fetch token balance
      const balanceResponse = await fetch(`/api/token/balance?wallet=${publicKey.toString()}`)
      const balanceData = await balanceResponse.json()
      
      // Fetch rewards
      const rewardsResponse = await fetch(`/api/rewards?userWallet=${publicKey.toString()}`)
      const rewardsData = await rewardsResponse.json()
      
      // Fetch staking positions
      const stakingResponse = await fetch(`/api/staking?userWallet=${publicKey.toString()}`)
      const stakingData = await stakingResponse.json()

      setTokenBalance({
        balance: balanceData.balance || 0,
        rewards: rewardsData.totalEarned || 0,
        staked: stakingData.totalStaked || 0
      })
    } catch (error) {
      console.error('Error fetching token data:', error)
    }
  }

  const handleStake = async () => {
    if (!publicKey || !stakeAmount) return

    setLoading(true)
    try {
      const response = await fetch('/api/staking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userWallet: publicKey.toString(),
          amount: parseFloat(stakeAmount),
          durationDays: parseInt(stakeDuration)
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setStakeAmount('')
        fetchTokenData() // Refresh data
        alert(`Successfully staked ${stakeAmount} NDT!`)
      } else {
        alert('Staking failed: ' + result.error)
      }
    } catch (error) {
      console.error('Staking error:', error)
      alert('Staking failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!connected) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6 text-center">
          <Coins className="h-12 w-12 text-purple-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
          <p className="text-gray-400">Connect your Phantom wallet to manage NDT tokens</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Token Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-purple-800/20 backdrop-blur-sm border-purple-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm">Available Balance</p>
                <p className="text-2xl font-bold text-white">{tokenBalance.balance.toFixed(2)}</p>
                <p className="text-purple-300 text-xs">NDT Tokens</p>
              </div>
              <Coins className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-800/20 backdrop-blur-sm border-green-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-200 text-sm">Total Earned</p>
                <p className="text-2xl font-bold text-white">{tokenBalance.rewards.toFixed(2)}</p>
                <p className="text-green-300 text-xs">From Listening</p>
              </div>
              <Music className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-800/20 backdrop-blur-sm border-blue-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm">Staked Tokens</p>
                <p className="text-2xl font-bold text-white">{tokenBalance.staked.toFixed(2)}</p>
                <p className="text-blue-300 text-xs">Earning Rewards</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Token Management Tabs */}
      <Card className="bg-purple-800/20 backdrop-blur-sm border-purple-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Coins className="h-5 w-5" />
            NDT Token Management
          </CardTitle>
          <CardDescription className="text-purple-200">
            Manage your Normal Dance Tokens - stake for rewards or earn by listening
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="stake" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="stake">Stake Tokens</TabsTrigger>
              <TabsTrigger value="rewards">Listening Rewards</TabsTrigger>
              <TabsTrigger value="history">Transaction History</TabsTrigger>
            </TabsList>

            <TabsContent value="stake" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stake-amount">Amount to Stake</Label>
                  <Input
                    id="stake-amount"
                    type="number"
                    placeholder="Enter NDT amount"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    min="1"
                    max={tokenBalance.balance}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Available: {tokenBalance.balance.toFixed(2)} NDT
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="stake-duration">Staking Period</Label>
                  <select
                    id="stake-duration"
                    value={stakeDuration}
                    onChange={(e) => setStakeDuration(e.target.value)}
                    className="w-full p-2 rounded bg-purple-900/50 border border-purple-600 text-white"
                  >
                    <option value="7">7 Days (5% APY)</option>
                    <option value="30">30 Days (10% APY)</option>
                    <option value="90">90 Days (15% APY)</option>
                    <option value="365">365 Days (25% APY)</option>
                  </select>
                </div>
              </div>

              <div className="bg-purple-900/30 p-4 rounded-lg">
                <h4 className="font-semibold text-white mb-2">Estimated Rewards</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-purple-300">Stake Amount</p>
                    <p className="text-white font-semibold">{stakeAmount || '0'} NDT</p>
                  </div>
                  <div>
                    <p className="text-purple-300">Duration</p>
                    <p className="text-white font-semibold">{stakeDuration} days</p>
                  </div>
                  <div>
                    <p className="text-purple-300">Est. Rewards</p>
                    <p className="text-green-400 font-semibold">
                      {stakeAmount ? (parseFloat(stakeAmount) * 0.10 * parseInt(stakeDuration) / 365).toFixed(2) : '0'} NDT
                    </p>
                  </div>
                  <div>
                    <p className="text-purple-300">Total Return</p>
                    <p className="text-green-400 font-semibold">
                      {stakeAmount ? (parseFloat(stakeAmount) * (1 + 0.10 * parseInt(stakeDuration) / 365)).toFixed(2) : '0'} NDT
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleStake}
                disabled={!stakeAmount || parseFloat(stakeAmount) > tokenBalance.balance || loading}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {loading ? 'Processing...' : 'Stake Tokens'}
              </Button>
            </TabsContent>

            <TabsContent value="rewards" className="space-y-4">
              <div className="bg-green-900/30 p-4 rounded-lg">
                <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <Music className="h-4 w-4" />
                  How to Earn NDT Tokens
                </h4>
                <ul className="space-y-2 text-sm text-green-200">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    Listen to tracks - earn 0.1 NDT base reward
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    Listen longer - up to 5x bonus for 5+ minutes
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    Discover new artists - bonus rewards
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    Share music - referral bonuses
                  </li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-green-800/20 border-green-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-200 text-sm">Today's Earnings</p>
                        <p className="text-xl font-bold text-white">0.00 NDT</p>
                      </div>
                      <Clock className="h-6 w-6 text-green-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-green-800/20 border-green-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-200 text-sm">This Week</p>
                        <p className="text-xl font-bold text-white">{tokenBalance.rewards.toFixed(2)} NDT</p>
                      </div>
                      <TrendingUp className="h-6 w-6 text-green-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <div className="text-center py-8">
                <Coins className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">Transaction History</h4>
                <p className="text-purple-200">Your transaction history will appear here</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}