import { Connection, PublicKey, Keypair } from '@solana/web3.js'
import { 
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from '@solana/spl-token'

// Token configuration
const TOKEN_MINT = new PublicKey('NDTToken111111111111111111111111111111111') // Replace with actual mint
const RPC_URL = 'https://api.devnet.solana.com'

export class MusicTokenService {
  private connection: Connection
  private tokenMint: PublicKey

  constructor() {
    this.connection = new Connection(RPC_URL, 'confirmed')
    this.tokenMint = TOKEN_MINT
  }

  /**
   * Get or create token account for user
   */
  async getUserTokenAccount(userWallet: PublicKey): Promise<PublicKey> {
    try {
      // Get associated token account address
      const tokenAccount = await getAssociatedTokenAddress(
        this.tokenMint,
        userWallet,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )

      // Check if account exists
      const accountInfo = await this.connection.getAccountInfo(tokenAccount)
      
      if (!accountInfo) {
        // Create account if it doesn't exist
        const createAccountInstruction = createAssociatedTokenAccountInstruction(
          userWallet, // payer
          tokenAccount, // associated token account
          userWallet, // owner
          this.tokenMint // token mint
        )
        
        // This would be sent to the user to sign
        console.log('Create token account instruction:', createAccountInstruction)
      }

      return tokenAccount
    } catch (error) {
      console.error('Error getting user token account:', error)
      throw error
    }
  }

  /**
   * Get user token balance
   */
  async getUserTokenBalance(userWallet: PublicKey): Promise<number> {
    try {
      const tokenAccount = await this.getUserTokenAccount(userWallet)
      const accountInfo = await this.connection.getTokenAccountBalance(tokenAccount)
      return Number(accountInfo.value.amount) / Math.pow(10, 9) // Assuming 9 decimals
    } catch (error) {
      console.error('Error getting token balance:', error)
      return 0
    }
  }

  /**
   * Reward user with tokens for listening
   */
  async rewardListener(
    listenerWallet: PublicKey,
    trackId: string,
    amount: number
  ): Promise<string> {
    try {
      // This would be called by the platform authority
      // Implementation depends on your smart contract structure
      
      const rewardAmount = amount * Math.pow(10, 9) // Convert to token units
      
      // Call smart contract to reward listener
      // This is a simplified example
      console.log(`Rewarding ${listenerWallet.toString()} with ${amount} NDT for track ${trackId}`)
      
      return 'reward_transaction_signature'
    } catch (error) {
      console.error('Error rewarding listener:', error)
      throw error
    }
  }

  /**
   * Stake tokens for rewards
   */
  async stakeTokens(
    userWallet: PublicKey,
    amount: number,
    durationDays: number
  ): Promise<string> {
    try {
      const stakeAmount = amount * Math.pow(10, 9)
      const durationSeconds = durationDays * 24 * 60 * 60
      
      console.log(`Staking ${amount} NDT for ${durationDays} days`)
      
      // Call staking function in smart contract
      return 'stake_transaction_signature'
    } catch (error) {
      console.error('Error staking tokens:', error)
      throw error
    }
  }

  /**
   * Get token information
   */
  async getTokenInfo(): Promise<any> {
    try {
      const mintInfo = await this.connection.getParsedAccountInfo(this.tokenMint)
      return mintInfo
    } catch (error) {
      console.error('Error getting token info:', error)
      throw error
    }
  }
}

// Singleton instance
export const musicTokenService = new MusicTokenService()