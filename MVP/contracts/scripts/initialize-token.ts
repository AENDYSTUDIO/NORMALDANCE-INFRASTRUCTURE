import { Connection, PublicKey, Keypair, SystemProgram, Transaction } from '@solana/web3.js'
import { 
  createInitializeMint2Instruction, 
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token'
import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor'
import { MusicToken } from '../target/types/music_token'

// Configuration
const RPC_URL = 'https://api.devnet.solana.com'
const TOKEN_NAME = 'Normal Dance Token'
const TOKEN_SYMBOL = 'NDT'
const TOKEN_DECIMALS = 9
const TOTAL_SUPPLY = 1_000_000_000 // 1 billion tokens

async function initializeMusicToken() {
  // Setup connection
  const connection = new Connection(RPC_URL, 'confirmed')
  
  // Load wallet from environment or file
  const wallet = new Wallet(
    // Your keypair here - load from environment or file
    Keypair.generate() // Replace with actual keypair
  )
  
  const provider = new AnchorProvider(connection, wallet, {
    commitment: 'confirmed'
  })
  
  // Load program
  const program = new Program<MusicToken>(
    // Load IDL from target/idl/music_token.json
    require('../target/idl/music_token.json'),
    new PublicKey('NDTToken111111111111111111111111111111111'), // Program ID
    provider
  )

  try {
    console.log('🎵 Initializing Normal Dance Token...')
    
    // Generate new mint keypair
    const mintKeypair = Keypair.generate()
    const mintPubkey = mintKeypair.publicKey
    
    console.log(`📍 Token Mint: ${mintPubkey.toString()}`)
    
    // Calculate rent for mint
    const rentExemptBalance = await getMinimumBalanceForRentExemptMint(connection)
    
    // Create transaction
    const transaction = new Transaction()
    
    // Add create account instruction for mint
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: mintPubkey,
        space: MINT_SIZE,
        lamports: rentExemptBalance,
        programId: TOKEN_PROGRAM_ID,
      })
    )
    
    // Add initialize mint instruction
    transaction.add(
      createInitializeMint2Instruction(
        mintPubkey,
        wallet.publicKey, // mint authority
        null, // freeze authority (none)
        TOKEN_DECIMALS
      )
    )
    
    // Send transaction
    const signature = await provider.sendAndConfirm(transaction, [mintKeypair])
    
    console.log(`✅ Token initialized! Signature: ${signature}`)
    console.log(`🪙 Token Address: ${mintPubkey.toString()}`)
    console.log(`📊 Total Supply: ${TOTAL_SUPPLY} ${TOKEN_SYMBOL}`)
    
    // Initialize program accounts
    const [tokenMetadataPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('token_metadata')],
      program.programId
    )
    
    const [tokenVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('token_vault')],
      program.programId
    )
    
    await program.methods
      .initializeMusicToken(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        TOKEN_DECIMALS,
        TOTAL_SUPPLY
      )
      .accounts({
        tokenMint: mintPubkey,
        tokenVault: tokenVaultPda,
        tokenMetadata: tokenMetadataPda,
        authority: wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: PublicKey.findProgramAddressSync([Buffer.from('sysvar_rent')], SystemProgram.programId)[0],
      })
      .rpc()
    
    console.log('🎉 Music Token successfully initialized!')
    console.log('📝 Token Details:')
    console.log(`   Name: ${TOKEN_NAME}`)
    console.log(`   Symbol: ${TOKEN_SYMBOL}`)
    console.log(`   Decimals: ${TOKEN_DECIMALS}`)
    console.log(`   Total Supply: ${TOTAL_SUPPLY}`)
    console.log(`   Mint Address: ${mintPubkey.toString()}`)
    
    // Save token info to file
    const tokenInfo = {
      name: TOKEN_NAME,
      symbol: TOKEN_SYMBOL,
      decimals: TOKEN_DECIMALS,
      totalSupply: TOTAL_SUPPLY,
      mintAddress: mintPubkey.toString(),
      programId: program.programId.toString(),
      network: 'devnet'
    }
    
    require('fs').writeFileSync(
      './token-info.json',
      JSON.stringify(tokenInfo, null, 2)
    )
    
    console.log('💾 Token info saved to token-info.json')
    
  } catch (error) {
    console.error('❌ Failed to initialize token:', error)
  }
}

// Run if called directly
if (require.main === module) {
  initializeMusicToken().catch(console.error)
}

export { initializeMusicToken }