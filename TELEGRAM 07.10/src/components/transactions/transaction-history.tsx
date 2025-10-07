'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { History, ArrowUpRight, ArrowDownLeft, ExternalLink, Search, Filter, Wallet } from 'lucide-react'

interface Transaction {
  id: string
  type: 'MINT' | 'PURCHASE' | 'SALE'
  blockchain: 'Solana' | 'TON'
  hash: string
  amount: number
  currency: string
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  timestamp: string
  from?: string
  to?: string
  trackTitle?: string
  gasFee?: number
}

const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'PURCHASE',
    blockchain: 'Solana',
    hash: '0x1234...5678',
    amount: 0.5,
    currency: 'SOL',
    status: 'COMPLETED',
    timestamp: '2024-01-15T10:30:00Z',
    from: 'Your Wallet',
    to: 'Artist One',
    trackTitle: 'Cosmic Journey',
    gasFee: 0.00001
  },
  {
    id: '2',
    type: 'MINT',
    blockchain: 'Solana',
    hash: '0x8765...4321',
    amount: 0.002,
    currency: 'SOL',
    status: 'COMPLETED',
    timestamp: '2024-01-14T15:45:00Z',
    trackTitle: 'Neon Nights',
    gasFee: 0.00002
  },
  {
    id: '3',
    type: 'SALE',
    blockchain: 'TON',
    hash: '0x9876...1234',
    amount: 2.5,
    currency: 'TON',
    status: 'COMPLETED',
    timestamp: '2024-01-13T09:20:00Z',
    from: 'Buyer Wallet',
    to: 'Your Wallet',
    trackTitle: 'Digital Dreams',
    gasFee: 0.001
  },
  {
    id: '4',
    type: 'PURCHASE',
    blockchain: 'TON',
    hash: '0x5432...8765',
    amount: 1.2,
    currency: 'TON',
    status: 'PENDING',
    timestamp: '2024-01-12T14:15:00Z',
    from: 'Your Wallet',
    to: 'Artist Four',
    trackTitle: 'Sunset Melody',
    gasFee: 0.001
  },
  {
    id: '5',
    type: 'MINT',
    blockchain: 'Solana',
    hash: '0x2468...1357',
    amount: 0.003,
    currency: 'SOL',
    status: 'FAILED',
    timestamp: '2024-01-11T11:30:00Z',
    trackTitle: 'Urban Beats',
    gasFee: 0.00001
  }
]

interface TransactionHistoryProps {
  solanaConnected: boolean
  tonConnected: boolean
}

export function TransactionHistory({ solanaConnected, tonConnected }: TransactionHistoryProps) {
  const [transactions] = useState<Transaction[]>(mockTransactions)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterBlockchain, setFilterBlockchain] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [activeTab, setActiveTab] = useState('all')

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (tx.trackTitle && tx.trackTitle.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = filterType === 'all' || tx.type === filterType
    const matchesBlockchain = filterBlockchain === 'all' || tx.blockchain === filterBlockchain
    const matchesStatus = filterStatus === 'all' || tx.status === filterStatus
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'solana' && tx.blockchain === 'Solana') ||
                      (activeTab === 'ton' && tx.blockchain === 'TON')
    
    return matchesSearch && matchesType && matchesBlockchain && matchesStatus && matchesTab
  })

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-600 hover:bg-green-700'
      case 'PENDING':
        return 'bg-yellow-600 hover:bg-yellow-700'
      case 'FAILED':
        return 'bg-red-600 hover:bg-red-700'
      default:
        return 'bg-gray-600 hover:bg-gray-700'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PURCHASE':
        return <ArrowDownLeft className="h-4 w-4 text-red-600" />
      case 'SALE':
        return <ArrowUpRight className="h-4 w-4 text-green-600" />
      case 'MINT':
        return <Wallet className="h-4 w-4 text-purple-600" />
      default:
        return <History className="h-4 w-4 text-gray-600" />
    }
  }

  if (!solanaConnected && !tonConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Transaction History
          </CardTitle>
          <CardDescription>
            Connect your wallet to view your transaction history
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">
            Please connect your wallet to view your transaction history
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Transaction History
          </CardTitle>
          <CardDescription>
            View your complete transaction history across Solana and TON blockchains
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="MINT">Mint</SelectItem>
                  <SelectItem value="PURCHASE">Purchase</SelectItem>
                  <SelectItem value="SALE">Sale</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blockchain Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Transactions</TabsTrigger>
          <TabsTrigger value="solana" disabled={!solanaConnected}>
            Solana
          </TabsTrigger>
          <TabsTrigger value="ton" disabled={!tonConnected}>
            TON
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">Type</th>
                      <th className="text-left p-4 font-medium">Track</th>
                      <th className="text-left p-4 font-medium">Blockchain</th>
                      <th className="text-left p-4 font-medium">Amount</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Date</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            {getTypeIcon(tx.type)}
                            <span className="font-medium">{tx.type}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="font-medium">{tx.trackTitle || 'N/A'}</p>
                            {tx.from && tx.to && (
                              <p className="text-sm text-muted-foreground">
                                {tx.from} → {tx.to}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge 
                            className={
                              tx.blockchain === 'Solana' 
                                ? 'bg-purple-600 hover:bg-purple-700' 
                                : 'bg-blue-600 hover:bg-blue-700'
                            }
                          >
                            {tx.blockchain}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="font-medium">{tx.amount} {tx.currency}</p>
                            {tx.gasFee && (
                              <p className="text-sm text-muted-foreground">
                                Gas: {tx.gasFee} {tx.currency}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className={getStatusColor(tx.status)}>
                            {tx.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {formatDate(tx.timestamp)}
                        </td>
                        <td className="p-4">
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredTransactions.length === 0 && (
                <div className="text-center py-12">
                  <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No transactions found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your filters or search terms
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Purchases</p>
                <p className="text-2xl font-bold">
                  {transactions.filter(tx => tx.type === 'PURCHASE').length}
                </p>
              </div>
              <ArrowDownLeft className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
                <p className="text-2xl font-bold">
                  {transactions.filter(tx => tx.type === 'SALE').length}
                </p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">NFTs Minted</p>
                <p className="text-2xl font-bold">
                  {transactions.filter(tx => tx.type === 'MINT').length}
                </p>
              </div>
              <Wallet className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}