'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Tabs, TabsContent, TabsList, TabsTrigger, Progress, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, Alert, AlertDescription } from '@/components/ui'
import {
  Vote,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Settings,
  TrendingUp,
  BarChart3,
  Shield,
  Zap,
  Target,
  Calendar,
  User,
  ArrowUp,
  ArrowDown,
  Minus,
  Eye,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  RefreshCw,
  Filter,
  Search,
  SortAsc,
  SortDesc
} from '@/components/icons'
import { cn } from '@/lib/utils'
import { daoGovernance, Proposal, GovernanceSettings, DAOToken } from '@/lib/dao-governance'

interface DAOGovernanceProps {
  userAddress: string
  className?: string
}

export function DAOGovernance({ userAddress, className }: DAOGovernanceProps) {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [governanceSettings, setGovernanceSettings] = useState<GovernanceSettings | null>(null)
  const [tokenInfo, setTokenInfo] = useState<DAOToken | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState<'proposals' | 'create' | 'settings' | 'stats'>('proposals')
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showVoteDialog, setShowVoteDialog] = useState(false)
  const [voteReason, setVoteReason] = useState('')
  const [selectedVote, setSelectedVote] = useState<'for' | 'against' | 'abstain' | null>(null)
  const [filters, setFilters] = useState({
    status: 'all' as 'all' | 'active' | 'passed' | 'rejected' | 'executed',
    category: 'all' as 'all' | 'platform' | 'economic' | 'technical' | 'community',
    search: ''
  })
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'votes' | 'status'>('newest')

  // Загрузка данных
  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const [proposalsData, settings, token] = await Promise.all([
        daoGovernance.getProposals(50, 0),
        daoGovernance.getGovernanceSettings(),
        daoGovernance.getTokenInfo()
      ])
      
      setProposals(proposalsData)
      setGovernanceSettings(settings)
      setTokenInfo(token)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  // Загрузка данных при монтировании
  useEffect(() => {
    loadData()
  }, [loadData])

  // Фильтрация и сортировка предложений
  const filteredProposals = proposals
    .filter(proposal => {
      if (filters.status !== 'all' && proposal.status !== filters.status) return false
      if (filters.category !== 'all' && proposal.category !== filters.category) return false
      if (filters.search && !proposal.title.toLowerCase().includes(filters.search.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'votes':
          return (b.forVotes + b.againstVotes + b.abstainVotes) - (a.forVotes + a.againstVotes + a.abstainVotes)
        case 'status':
          return a.status.localeCompare(b.status)
        default:
          return 0
      }
    })

  // Создание предложения
  const handleCreateProposal = async (formData: {
    title: string
    description: string
    category: string
    targets: string[]
    values: number[]
    calldatas: string[]
  }) => {
    try {
      setLoading(true)
      const proposalId = await daoGovernance.createProposal(
        formData.targets,
        formData.values,
        formData.calldatas,
        formData.description
      )
      
      // Обновляем список предложений
      await loadData()
      setShowCreateDialog(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create proposal')
    } finally {
      setLoading(false)
    }
  }

  // Голосование
  const handleVote = async (proposalId: string, support: 'for' | 'against' | 'abstain') => {
    try {
      setLoading(true)
      await daoGovernance.vote(proposalId, support, voteReason)
      
      // Обновляем данные
      await loadData()
      setShowVoteDialog(false)
      setVoteReason('')
      setSelectedVote(null)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to vote')
    } finally {
      setLoading(false)
    }
  }

  // Выполнение предложения
  const handleExecuteProposal = async (proposalId: string) => {
    try {
      setLoading(true)
      await daoGovernance.executeProposal(proposalId)
      
      // Обновляем данные
      await loadData()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to execute proposal')
    } finally {
      setLoading(false)
    }
  }

  // Получение статуса предложения
  const getProposalStatus = (proposal: Proposal) => {
    const now = new Date()
    const startTime = new Date(proposal.startTime)
    const endTime = new Date(proposal.endTime)
    
    if (now < startTime) return 'pending'
    if (now > endTime) {
      if (proposal.forVotes > proposal.againstVotes) return 'passed'
      return 'rejected'
    }
    return 'active'
  }

  // Получение цвета статуса
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-blue-500'
      case 'passed': return 'text-green-500'
      case 'rejected': return 'text-red-500'
      case 'executed': return 'text-purple-500'
      case 'pending': return 'text-yellow-500'
      default: return 'text-gray-500'
    }
  }

  // Получение иконки статуса
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Clock className="h-4 w-4" />
      case 'passed': return <CheckCircle className="h-4 w-4" />
      case 'rejected': return <XCircle className="h-4 w-4" />
      case 'executed': return <Shield className="h-4 w-4" />
      case 'pending': return <AlertCircle className="h-4 w-4" />
      default: return <Minus className="h-4 w-4" />
    }
  }

  // Форматирование времени
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  // Форматирование чисел
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  if (loading && proposals.length === 0) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Загрузка данных DAO...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button size="sm" variant="outline" onClick={loadData} className="ml-2">
                <RefreshCw className="h-4 w-4 mr-1" />
                Повторить
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* Заголовок и статистика */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-primary" />
              <CardTitle>DAO Управление</CardTitle>
              <Badge variant="secondary" className="ml-2">
                <Users className="h-3 w-3 mr-1" />
                Децентрализованное
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="outline" onClick={loadData}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Обновить
              </Button>
              <Button size="sm" onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Создать предложение
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{proposals.length}</div>
              <div className="text-sm text-muted-foreground">Предложений</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {proposals.filter(p => getProposalStatus(p) === 'passed').length}
              </div>
              <div className="text-sm text-muted-foreground">Принято</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {proposals.filter(p => getProposalStatus(p) === 'active').length}
              </div>
              <div className="text-sm text-muted-foreground">Активных</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">
                {tokenInfo ? formatNumber(Number(tokenInfo.circulatingSupply)) : '0'}
              </div>
              <div className="text-sm text-muted-foreground">Токенов в обращении</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Основной контент */}
      <Tabs value={selectedTab} onValueChange={(value: unknown) => setSelectedTab(value)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="proposals">Предложения</TabsTrigger>
          <TabsTrigger value="create">Создать</TabsTrigger>
          <TabsTrigger value="settings">Настройки</TabsTrigger>
          <TabsTrigger value="stats">Статистика</TabsTrigger>
        </TabsList>

        {/* Список предложений */}
        <TabsContent value="proposals" className="space-y-4">
          {/* Фильтры и поиск */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Поиск предложений..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filters.status} onValueChange={(value: unknown) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    <SelectItem value="active">Активные</SelectItem>
                    <SelectItem value="passed">Принятые</SelectItem>
                    <SelectItem value="rejected">Отклоненные</SelectItem>
                    <SelectItem value="executed">Выполненные</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.category} onValueChange={(value: unknown) => setFilters(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все категории</SelectItem>
                    <SelectItem value="platform">Платформа</SelectItem>
                    <SelectItem value="economic">Экономика</SelectItem>
                    <SelectItem value="technical">Техническое</SelectItem>
                    <SelectItem value="community">Сообщество</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(value: unknown) => setSortBy(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Новые</SelectItem>
                    <SelectItem value="oldest">Старые</SelectItem>
                    <SelectItem value="votes">По голосам</SelectItem>
                    <SelectItem value="status">По статусу</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Список предложений */}
          <div className="space-y-4">
            {filteredProposals.length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center text-muted-foreground">
                    <Vote className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Нет предложений для отображения</p>
                    <p className="text-sm">Попробуйте изменить фильтры или создать новое предложение</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredProposals.map((proposal) => {
                const status = getProposalStatus(proposal)
                const totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes
                const forPercentage = totalVotes > 0 ? (proposal.forVotes / totalVotes) * 100 : 0
                const againstPercentage = totalVotes > 0 ? (proposal.againstVotes / totalVotes) * 100 : 0
                const abstainPercentage = totalVotes > 0 ? (proposal.abstainVotes / totalVotes) * 100 : 0

                return (
                  <Card key={proposal.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold">{proposal.title}</h3>
                            <Badge variant="outline" className={cn('text-xs', getStatusColor(status))}>
                              {getStatusIcon(status)}
                              <span className="ml-1 capitalize">{status}</span>
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {proposal.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {proposal.description}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span className="flex items-center space-x-1">
                              <User className="h-3 w-3" />
                              <span>{proposal.proposer}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatTime(proposal.createdAt)}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>До {formatTime(proposal.endTime)}</span>
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedProposal(proposal)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Подробнее
                          </Button>
                          {status === 'active' && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedProposal(proposal)
                                setShowVoteDialog(true)
                              }}
                            >
                              <Vote className="h-4 w-4 mr-1" />
                              Голосовать
                            </Button>
                          )}
                          {status === 'passed' && (
                            <Button
                              size="sm"
                              onClick={() => handleExecuteProposal(proposal.id)}
                            >
                              <Zap className="h-4 w-4 mr-1" />
                              Выполнить
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Результаты голосования */}
                      {totalVotes > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span>Результаты голосования</span>
                            <span className="font-medium">{formatNumber(totalVotes)} голосов</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <ArrowUp className="h-4 w-4 text-green-500" />
                                <span className="text-sm">За</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium">{formatNumber(proposal.forVotes)}</span>
                                <span className="text-xs text-muted-foreground">({forPercentage.toFixed(1)}%)</span>
                              </div>
                            </div>
                            <Progress value={forPercentage} className="h-2" />
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <ArrowDown className="h-4 w-4 text-red-500" />
                                <span className="text-sm">Против</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium">{formatNumber(proposal.againstVotes)}</span>
                                <span className="text-xs text-muted-foreground">({againstPercentage.toFixed(1)}%)</span>
                              </div>
                            </div>
                            <Progress value={againstPercentage} className="h-2" />
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Minus className="h-4 w-4 text-gray-500" />
                                <span className="text-sm">Воздержался</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium">{formatNumber(proposal.abstainVotes)}</span>
                                <span className="text-xs text-muted-foreground">({abstainPercentage.toFixed(1)}%)</span>
                              </div>
                            </div>
                            <Progress value={abstainPercentage} className="h-2" />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>

        {/* Создание предложения */}
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Создать новое предложение</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Название предложения</label>
                  <Input placeholder="Введите название предложения" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Описание</label>
                  <Textarea placeholder="Опишите детали предложения" rows={4} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Категория</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите категорию" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="platform">Платформа</SelectItem>
                      <SelectItem value="economic">Экономика</SelectItem>
                      <SelectItem value="technical">Техническое</SelectItem>
                      <SelectItem value="community">Сообщество</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline">Отмена</Button>
                  <Button>Создать предложение</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Настройки */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Настройки управления</CardTitle>
            </CardHeader>
            <CardContent>
              {governanceSettings ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Задержка голосования</label>
                      <Input value={governanceSettings.votingDelay} disabled />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Период голосования</label>
                      <Input value={governanceSettings.votingPeriod} disabled />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Порог предложений</label>
                      <Input value={governanceSettings.proposalThreshold} disabled />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Кворум</label>
                      <Input value={governanceSettings.quorumNumerator} disabled />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Настройки недоступны</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Статистика */}
        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Статистика DAO</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Статистика недоступна</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Диалог голосования */}
      <Dialog open={showVoteDialog} onOpenChange={setShowVoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Голосование за предложение</DialogTitle>
            <DialogDescription>
              Выберите вашу позицию по предложению
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedProposal && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium">{selectedProposal.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedProposal.description}
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Ваша позиция</label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={selectedVote === 'for' ? 'default' : 'outline'}
                  onClick={() => setSelectedVote('for')}
                  className="flex items-center space-x-2"
                >
                  <ArrowUp className="h-4 w-4" />
                  <span>За</span>
                </Button>
                <Button
                  variant={selectedVote === 'against' ? 'default' : 'outline'}
                  onClick={() => setSelectedVote('against')}
                  className="flex items-center space-x-2"
                >
                  <ArrowDown className="h-4 w-4" />
                  <span>Против</span>
                </Button>
                <Button
                  variant={selectedVote === 'abstain' ? 'default' : 'outline'}
                  onClick={() => setSelectedVote('abstain')}
                  className="flex items-center space-x-2"
                >
                  <Minus className="h-4 w-4" />
                  <span>Воздержался</span>
                </Button>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Причина (опционально)</label>
              <Textarea
                placeholder="Объясните вашу позицию"
                value={voteReason}
                onChange={(e) => setVoteReason(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowVoteDialog(false)}>
                Отмена
              </Button>
              <Button
                onClick={() => selectedProposal && selectedVote && handleVote(selectedProposal.id, selectedVote)}
                disabled={!selectedVote}
              >
                Проголосовать
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
