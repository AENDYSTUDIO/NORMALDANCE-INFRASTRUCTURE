import { ethers } from 'ethers'

export interface Proposal {
  id: string
  title: string
  description: string
  proposer: string
  category: 'platform' | 'economic' | 'technical' | 'community'
  status: 'draft' | 'active' | 'passed' | 'rejected' | 'executed'
  startTime: Date
  endTime: Date
  votingPower: number
  forVotes: number
  againstVotes: number
  abstainVotes: number
  quorum: number
  executionDelay: number
  createdAt: Date
  updatedAt: Date
}

export interface Vote {
  id: string
  proposalId: string
  voter: string
  support: 'for' | 'against' | 'abstain'
  votingPower: number
  reason?: string
  createdAt: Date
}

export interface DAOToken {
  address: string
  name: string
  symbol: string
  decimals: number
  totalSupply: string
  circulatingSupply: string
}

export interface GovernanceSettings {
  votingDelay: number // Блоки до начала голосования
  votingPeriod: number // Блоки для голосования
  proposalThreshold: number // Минимальные токены для создания предложения
  quorumNumerator: number // Кворум в процентах
  executionDelay: number // Задержка перед выполнением
  timelockDelay: number // Задержка timelock
}

export interface Delegation {
  delegator: string
  delegatee: string
  votingPower: number
  createdAt: Date
}

export class DAOGovernance {
  private provider: ethers.Provider
  private signer: ethers.Signer | null = null
  private governanceContract: ethers.Contract | null = null
  private tokenContract: ethers.Contract | null = null
  private timelockContract: ethers.Contract | null = null

  constructor(provider: ethers.Provider) {
    this.provider = provider
  }

  // Инициализация контрактов
  async initialize(
    governanceAddress: string,
    tokenAddress: string,
    timelockAddress: string,
    signer?: ethers.Signer
  ): Promise<void> {
    this.signer = signer || null
    
    // ABI для контрактов (упрощенные версии)
    const governanceABI = [
      'function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) returns (uint256)',
      'function castVote(uint256 proposalId, uint8 support) external',
      'function castVoteWithReason(uint256 proposalId, uint8 support, string calldata reason) external',
      'function execute(uint256 proposalId) external',
      'function getProposal(uint256 proposalId) external view returns (address, uint256, uint256, uint256, uint256, uint256, uint256, uint256, address, bytes32)',
      'function state(uint256 proposalId) external view returns (uint8)',
      'function quorumVotes() external view returns (uint256)',
      'function proposalThreshold() external view returns (uint256)',
      'function votingDelay() external view returns (uint256)',
      'function votingPeriod() external view returns (uint256)',
      'function hasVoted(uint256 proposalId, address account) external view returns (bool)',
      'function getVotes(address account, uint256 blockNumber) external view returns (uint256)',
      'function getVotes(address account) external view returns (uint256)',
      'event ProposalCreated(uint256 indexed proposalId, address indexed proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 startBlock, uint256 endBlock, string description)',
      'event VoteCast(address indexed voter, uint256 indexed proposalId, uint8 support, uint256 weight, string reason)',
      'event ProposalExecuted(uint256 indexed proposalId)'
    ]

    const tokenABI = [
      'function name() external view returns (string)',
      'function symbol() external view returns (string)',
      'function decimals() external view returns (uint8)',
      'function totalSupply() external view returns (uint256)',
      'function balanceOf(address account) external view returns (uint256)',
      'function delegate(address delegatee) external',
      'function delegates(address account) external view returns (address)',
      'function getVotes(address account) external view returns (uint256)',
      'function getPastVotes(address account, uint256 blockNumber) external view returns (uint256)',
      'function delegateBySig(address delegatee, uint256 nonce, uint256 expiry, uint8 v, bytes32 r, bytes32 s) external',
      'event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate)',
      'event DelegateVotesChanged(address indexed delegate, uint256 previousBalance, uint256 newBalance)'
    ]

    const timelockABI = [
      'function delay() external view returns (uint256)',
      'function GRACE_PERIOD() external view returns (uint256)',
      'function executeTransaction(address target, uint256 value, string signature, bytes data, uint256 eta) external payable returns (bytes)',
      'function queueTransaction(address target, uint256 value, string signature, bytes data, uint256 eta) external returns (bytes32)',
      'function cancelTransaction(address target, uint256 value, string signature, bytes data, uint256 eta) external',
      'function executeTransaction(address target, uint256 value, string signature, bytes data, uint256 eta) external payable returns (bytes)'
    ]

    this.governanceContract = new ethers.Contract(governanceAddress, governanceABI, this.signer || this.provider)
    this.tokenContract = new ethers.Contract(tokenAddress, tokenABI, this.signer || this.provider)
    this.timelockContract = new ethers.Contract(timelockAddress, timelockABI, this.signer || this.provider)
  }

  // Создание предложения
  async createProposal(
    targets: string[],
    values: number[],
    calldatas: string[],
    description: string
  ): Promise<string> {
    if (!this.governanceContract || !this.signer) {
      throw new Error('DAO not initialized or signer not provided')
    }

    try {
      const tx = await this.governanceContract.propose(
        targets,
        values,
        calldatas,
        description
      )
      
      const receipt = await tx.wait()
      
      // Извлекаем ID предложения из события
      const proposalCreatedEvent = receipt.logs.find(
        (log: { topics: string[] }) => log.topics[0] === this.governanceContract!.interface.getEvent('ProposalCreated').topicHash
      )
      
      if (proposalCreatedEvent) {
        const decoded = this.governanceContract.interface.parseLog(proposalCreatedEvent)
        return decoded.args.proposalId.toString()
      }
      
      throw new Error('Failed to extract proposal ID from transaction')
    } catch (error) {
      console.error('Error creating proposal:', error)
      throw error
    }
  }

  // Голосование за предложение
  async vote(
    proposalId: string,
    support: 'for' | 'against' | 'abstain',
    reason?: string
  ): Promise<void> {
    if (!this.governanceContract || !this.signer) {
      throw new Error('DAO not initialized or signer not provided')
    }

    const supportValue = support === 'for' ? 1 : support === 'against' ? 0 : 2

    try {
      let tx
      if (reason) {
        tx = await this.governanceContract.castVoteWithReason(proposalId, supportValue, reason)
      } else {
        tx = await this.governanceContract.castVote(proposalId, supportValue)
      }
      
      await tx.wait()
    } catch (error) {
      console.error('Error voting:', error)
      throw error
    }
  }

  // Выполнение предложения
  async executeProposal(proposalId: string): Promise<void> {
    if (!this.governanceContract || !this.signer) {
      throw new Error('DAO not initialized or signer not provided')
    }

    try {
      const tx = await this.governanceContract.execute(proposalId)
      await tx.wait()
    } catch (error) {
      console.error('Error executing proposal:', error)
      throw error
    }
  }

  // Получение информации о предложении
  async getProposal(proposalId: string): Promise<Proposal | null> {
    if (!this.governanceContract) {
      throw new Error('DAO not initialized')
    }

    try {
      const proposalData = await this.governanceContract.getProposal(proposalId)
      const state = await this.governanceContract.state(proposalId)
      
      const statusMap = {
        0: 'pending',
        1: 'active',
        2: 'canceled',
        3: 'defeated',
        4: 'succeeded',
        5: 'queued',
        6: 'expired',
        7: 'executed'
      }

      return {
        id: proposalId,
        title: '', // Нужно парсить из description
        description: '', // Нужно парсить из description
        proposer: proposalData[0],
        category: 'platform', // Нужно определять по содержимому
        status: statusMap[state] as any,
        startTime: new Date(proposalData[3] * 1000),
        endTime: new Date(proposalData[4] * 1000),
        votingPower: proposalData[5].toString(),
        forVotes: proposalData[6].toString(),
        againstVotes: proposalData[7].toString(),
        abstainVotes: proposalData[8].toString(),
        quorum: proposalData[9].toString(),
        executionDelay: 0, // Нужно получать из настроек
        createdAt: new Date(),
        updatedAt: new Date()
      }
    } catch (error) {
      console.error('Error getting proposal:', error)
      return null
    }
  }

  // Получение голосов пользователя
  async getUserVotes(proposalId: string, userAddress: string): Promise<Vote | null> {
    if (!this.governanceContract) {
      throw new Error('DAO not initialized')
    }

    try {
      const hasVoted = await this.governanceContract.hasVoted(proposalId, userAddress)
      if (!hasVoted) return null

      // В реальном проекте нужно получать детали голоса из событий
      return {
        id: `${proposalId}-${userAddress}`,
        proposalId,
        voter: userAddress,
        support: 'for', // Нужно получать из событий
        votingPower: 0, // Нужно получать из событий
        createdAt: new Date()
      }
    } catch (error) {
      console.error('Error getting user votes:', error)
      return null
    }
  }

  // Делегирование голосов
  async delegate(delegatee: string): Promise<void> {
    if (!this.tokenContract || !this.signer) {
      throw new Error('DAO not initialized or signer not provided')
    }

    try {
      const tx = await this.tokenContract.delegate(delegatee)
      await tx.wait()
    } catch (error) {
      console.error('Error delegating votes:', error)
      throw error
    }
  }

  // Получение делегата пользователя
  async getDelegate(userAddress: string): Promise<string | null> {
    if (!this.tokenContract) {
      throw new Error('DAO not initialized')
    }

    try {
      const delegate = await this.tokenContract.delegates(userAddress)
      return delegate === ethers.ZeroAddress ? null : delegate
    } catch (error) {
      console.error('Error getting delegate:', error)
      return null
    }
  }

  // Получение баланса токенов
  async getTokenBalance(userAddress: string): Promise<string> {
    if (!this.tokenContract) {
      throw new Error('DAO not initialized')
    }

    try {
      const balance = await this.tokenContract.balanceOf(userAddress)
      return balance.toString()
    } catch (error) {
      console.error('Error getting token balance:', error)
      return '0'
    }
  }

  // Получение голосующей силы
  async getVotingPower(userAddress: string): Promise<string> {
    if (!this.tokenContract) {
      throw new Error('DAO not initialized')
    }

    try {
      const votes = await this.tokenContract.getVotes(userAddress)
      return votes.toString()
    } catch (error) {
      console.error('Error getting voting power:', error)
      return '0'
    }
  }

  // Получение настроек управления
  async getGovernanceSettings(): Promise<GovernanceSettings> {
    if (!this.governanceContract || !this.tokenContract || !this.timelockContract) {
      throw new Error('DAO not initialized')
    }

    try {
      const [
        votingDelay,
        votingPeriod,
        proposalThreshold,
        quorumVotes,
        timelockDelay
      ] = await Promise.all([
        this.governanceContract.votingDelay(),
        this.governanceContract.votingPeriod(),
        this.governanceContract.proposalThreshold(),
        this.governanceContract.quorumVotes(),
        this.timelockContract.delay()
      ])

      return {
        votingDelay: Number(votingDelay),
        votingPeriod: Number(votingPeriod),
        proposalThreshold: Number(proposalThreshold),
        quorumNumerator: Number(quorumVotes),
        executionDelay: 0, // Нужно получать из настроек
        timelockDelay: Number(timelockDelay)
      }
    } catch (error) {
      console.error('Error getting governance settings:', error)
      throw error
    }
  }

  // Получение информации о токене
  async getTokenInfo(): Promise<DAOToken | null> {
    if (!this.tokenContract) {
      throw new Error('DAO not initialized')
    }

    try {
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        this.tokenContract.name(),
        this.tokenContract.symbol(),
        this.tokenContract.decimals(),
        this.tokenContract.totalSupply()
      ])

      return {
        address: await this.tokenContract.getAddress(),
        name,
        symbol,
        decimals: Number(decimals),
        totalSupply: totalSupply.toString(),
        circulatingSupply: totalSupply.toString() // Упрощенно
      }
    } catch (error) {
      console.error('Error getting token info:', error)
      return null
    }
  }

  // Получение списка предложений
  async getProposals(limit: number = 20, offset: number = 0): Promise<Proposal[]> {
    // В реальном проекте нужно получать из событий или API
    // Для демонстрации возвращаем пустой массив
    return []
  }

  // Получение статистики DAO
  async getDAOStats(): Promise<{
    totalProposals: number
    activeProposals: number
    totalVoters: number
    totalVotingPower: string
    participationRate: number
  }> {
    // В реальном проекте нужно получать из событий или API
    return {
      totalProposals: 0,
      activeProposals: 0,
      totalVoters: 0,
      totalVotingPower: '0',
      participationRate: 0
    }
  }

  // Проверка прав пользователя
  async checkUserPermissions(userAddress: string): Promise<{
    canPropose: boolean
    canVote: boolean
    canExecute: boolean
    votingPower: string
    proposalThreshold: string
  }> {
    if (!this.governanceContract || !this.tokenContract) {
      throw new Error('DAO not initialized')
    }

    try {
      const [votingPower, proposalThreshold] = await Promise.all([
        this.getVotingPower(userAddress),
        this.governanceContract.proposalThreshold()
      ])

      const canPropose = BigInt(votingPower) >= BigInt(proposalThreshold)
      const canVote = BigInt(votingPower) > 0n
      const canExecute = false // Нужно проверять статус предложений

      return {
        canPropose,
        canVote,
        canExecute,
        votingPower,
        proposalThreshold: proposalThreshold.toString()
      }
    } catch (error) {
      console.error('Error checking user permissions:', error)
      throw error
    }
  }
}

// Экспорт глобального экземпляра
export const daoGovernance = new DAOGovernance(ethers.getDefaultProvider())
