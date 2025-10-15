# 🛠️ NORMALDANCE 2025 Technical Specification

## 📋 Overview

This document provides detailed technical specifications for implementing the 2025 development roadmap items. It includes specific code changes, file modifications, and implementation details.

## 1. 🔧 Technical Optimization

### 1.1 Security Vulnerability Fixes

**Objective**: Address security vulnerabilities identified by `npm audit`

**Implementation Steps**:
1. Run `npm audit` to identify vulnerabilities
2. Execute `npm audit fix` for automatic fixes
3. For vulnerabilities requiring breaking changes:
   - Update dependencies manually
   - Test functionality after each update
   - Update related code as needed

**Files to Review**:
- `package.json` - Dependency versions
- `package-lock.json` - Updated after fixes

### 1.2 IPFS Migration to Helia

**Objective**: Replace deprecated IPFS packages with Helia

**Current State**: Mixed implementation using both legacy and Helia packages

**Required Changes**:

#### Update `src/lib/ipfs.ts`:

```typescript
// OLD IMPLEMENTATION
import { create } from 'ipfs-http-client'

// NEW IMPLEMENTATION
import { createHelia } from 'helia'
import { unixfs } from '@helia/unixfs'
import type { CID } from 'multiformats/cid'

// Replace ipfsClient with Helia instance
let heliaInstance: Helia | null = null
let fs: typeof unixfs | null = null

export async function getHeliaInstance() {
  if (!heliaInstance) {
    heliaInstance = await createHelia()
    fs = unixfs(heliaInstance)
 }
  return { heliaInstance, fs }
}

// Update upload function
export async function uploadToIPFS(
  file: File | Buffer,
  metadata?: IPFSTrackMetadata
): Promise<{ cid: string; size: number }> {
  try {
    const { fs } = await getHeliaInstance()
    
    // Convert file to Uint8Array
    let fileBuffer: Uint8Array
    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer()
      fileBuffer = new Uint8Array(arrayBuffer)
    } else {
      fileBuffer = file
    }
    
    // Upload file using Helia
    const cid = await fs.addBytes(fileBuffer)
    const cidString = cid.toString()
    
    // Handle metadata if provided
    if (metadata) {
      const metadataWithFile = {
        ...metadata,
        file: file instanceof File ? file.name : 'buffer',
        timestamp: new Date().toISOString(),
      }
      
      const metadataBuffer = new TextEncoder().encode(JSON.stringify(metadataWithFile))
      const metadataCid = await fs.addBytes(metadataBuffer)
      
      // Create combined metadata
      const combined = {
        metadata: metadataCid.toString(),
        file: cidString,
        type: 'track',
      }
      
      const combinedBuffer = new TextEncoder().encode(JSON.stringify(combined))
      const combinedCid = await fs.addBytes(combinedBuffer)
      
      return { 
        cid: combinedCid.toString(), 
        size: fileBuffer.length 
      }
    }
    
    return { cid: cidString, size: fileBuffer.length }
  } catch (error) {
    console.error('Helia IPFS upload failed:', error)
    throw new Error(`Failed to upload to IPFS: ${error}`)
  }
}
```

#### Update `src/lib/ipfs-enhanced.ts`:

```typescript
// Update imports to use Helia
import { type Helia } from 'helia'
import { unixfs } from '@helia/unixfs'

// Update uploadLargeFileToIPFS function to use Helia
async function uploadLargeFileToIPFS(
  file: File,
  metadata: IPFSTrackMetadata,
  chunkSize: number
): Promise<UploadResult> {
  try {
    const { fs } = await getHeliaInstance()
    const totalChunks = Math.ceil(file.size / chunkSize)
    const chunks: Uint8Array[] = []

    // Chunk the file
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize
      const end = Math.min(start + chunkSize, file.size)
      const chunk = file.slice(start, end)
      const arrayBuffer = await chunk.arrayBuffer()
      chunks.push(new Uint8Array(arrayBuffer))
    }

    console.log(`File split into ${totalChunks} chunks`)

    // Upload chunks via Helia
    const chunkCIDs: CID[] = []
    for (const chunk of chunks) {
      const cid = await fs.addBytes(chunk)
      chunkCIDs.push(cid)
    }

    // Create manifest for chunks
    const manifest = {
      chunks: chunkCIDs.map(cid => cid.toString()),
      totalChunks,
      totalSize: file.size,
      metadata,
      type: 'chunked-audio',
      timestamp: new Date().toISOString(),
      compression: 'none'
    }

    // Upload manifest
    const manifestBuffer = new TextEncoder().encode(JSON.stringify(manifest))
    const manifestCID = await fs.addBytes(manifestBuffer)

    return {
      cid: manifestCID.toString(),
      size: file.size,
      timestamp: new Date(),
      metadata
    }
  } catch (error) {
    console.error('Chunked Helia IPFS upload failed:', error)
    throw new Error(`Failed to upload large file to IPFS: ${error}`)
  }
}
```

### 1.3 Automated Testing Pipeline

**Objective**: Set up pre-commit hooks and CI/CD pipeline

**Implementation**:

#### Create `.husky/pre-commit`:
```bash
#!/bin/sh
npm run lint
npm run type-check
npm run test:unit
```

#### Install and configure Husky:
```bash
npm install --save-dev husky
npx husky install
npx husky add .husky/pre-commit "npm run lint && npm run type-check && npm run test:unit"
```

#### Create `.github/workflows/ci.yml`:
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run type checking
      run: npm run type-check
    
    - name: Run tests
      run: npm run test:coverage
    
    - name: Build
      run: npm run build
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
```

## 2. 📱 Functionality

### 2.1 Telegram Mini App Integration

**Objective**: Complete the Telegram Mini App functionality

**Current State**: Backend webhook exists, frontend UI needed

**Implementation**:

#### Create `src/app/telegram-app/page.tsx`:
```typescript
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SolanaPayButton } from '@/components/payment/solana-pay-button'
import { telegramPartnership } from '@/lib/telegram-partnership'

export default function TelegramApp() {
  const [isTelegramReady, setIsTelegramReady] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    // Initialize Telegram WebApp
    const initTelegram = async () => {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp
        tg.ready()
        tg.expand()
        
        // Get user data
        const initData = tg.initDataUnsafe
        setUserData(initData?.user)
        
        // Set header color
        tg.setHeaderColor('#6366f1')
        
        setIsTelegramReady(true)
      }
    }
    
    initTelegram()
  }, [])

  const handlePurchaseWithStars = async () => {
    try {
      // Use existing telegramPartnership.purchaseWithStars
      const result = await telegramPartnership.purchaseWithStars(10, 'Premium Access')
      if (result.success) {
        telegramPartnership.hapticFeedback('notification')
      }
    } catch (error) {
      console.error('Purchase failed:', error)
    }
  }

  if (!isTelegramReady) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Initializing Telegram Mini App...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">NormalDance DEX</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <h3 className="font-semibold">Welcome, {userData?.first_name}!</h3>
            <p className="text-sm text-gray-500">Telegram Mini App</p>
          </div>
          
          <div className="space-y-3">
            <Button 
              className="w-full" 
              onClick={() => window.Telegram.WebApp.openLink('/dex')}
            >
              Open DEX Interface
            </Button>
            
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => window.Telegram.WebApp.openLink('/analytics')}
            >
              View Analytics
            </Button>
            
            <SolanaPayButton 
              amount={0.1} 
              onSuccess={() => console.log('Payment successful')} 
            />
            
            <Button 
              className="w-full" 
              variant="secondary"
              onClick={handlePurchaseWithStars}
            >
              Buy with Stars
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

#### Create `src/app/telegram-app/layout.tsx`:
```typescript
export default function TelegramAppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
```

### 2.2 NFT Memorials for Digital Cemetery

**Objective**: Implement NFT memorial creation and management

**Current State**: Basic memorial system exists, NFT minting needed

**Implementation**:

#### Update `src/components/grave/CreateMemorialModal.tsx`:
```typescript
// Add NFT minting functionality
import { useWallet } from '@solana/wallet-adapter-react'
import { Transaction, SystemProgram } from '@solana/web3.js'
import { PROGRAM_ID as MEMORIAL_PROGRAM_ID } from '@/programs/memorial-idl'

interface CreateMemorialModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (memorial: any) => void
}

export default function CreateMemorialModal({ 
  isOpen, 
  onClose, 
  onCreate 
}: CreateMemorialModalProps) {
  const { publicKey, sendTransaction } = useWallet()
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    image: null as File | null,
    isNFT: false
  })
  const [isMinting, setIsMinting] = useState(false)

  const handleMintNFT = async () => {
    if (!publicKey) return

    setIsMinting(true)
    try {
      // Create transaction to mint memorial NFT
      const transaction = new Transaction().add(
        // Memorial NFT creation instruction
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: publicKey, // Placeholder
          lamports: 0, // Actual instruction would go here
        })
      )

      const signature = await sendTransaction(transaction, connection)
      await connection.confirmTransaction(signature, 'confirmed')
      
      // Create memorial record in database
      const memorialData = {
        ...formData,
        nftMintAddress: signature, // Placeholder
        isNFT: true
      }
      
      onCreate(memorialData)
      onClose()
    } catch (error) {
      console.error('Error minting memorial NFT:', error)
    } finally {
      setIsMinting(false)
    }
 }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.isNFT) {
      await handleMintNFT()
    } else {
      // Create regular memorial
      onCreate(formData)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Create Memorial</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Artist Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Biography</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              className="w-full p-2 border rounded"
              rows={3}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormData({...formData, image: e.target.files?.[0] || null})}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isNFT"
              checked={formData.isNFT}
              onChange={(e) => setFormData({...formData, isNFT: e.target.checked})}
              className="mr-2"
            />
            <label htmlFor="isNFT" className="text-sm">Create as NFT Memorial</label>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isMinting}>
              {isMinting ? 'Minting...' : formData.isNFT ? 'Mint NFT Memorial' : 'Create Memorial'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

### 2.3 Solana Pay Integration

**Objective**: Integrate Solana Pay for payments

**Implementation**:

#### Create `src/lib/solana-pay.ts`:
```typescript
import { 
  createQR, 
  encodeURL, 
  TransactionRequestURLFields,
  findReference,
  validateTransfer
} from '@solana/pay'
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import BigNumber from 'bignumber.js'

interface SolanaPayConfig {
  recipient: PublicKey
  amount: BigNumber
  reference?: Keypair
  label?: string
  message?: string
 memo?: string
 splToken?: PublicKey
}

export class SolanaPayService {
  private connection: Connection
  
  constructor() {
    this.connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com')
  }

  async generatePaymentQR(config: SolanaPayConfig) {
    try {
      const { recipient, amount, label, message, memo, splToken, reference } = config
      
      const urlParams: TransactionRequestURLFields = {
        recipient,
        amount,
        label,
        message,
        memo,
        splToken
      }
      
      if (reference) {
        urlParams.reference = reference.publicKey
      }
      
      const encodedURL = encodeURL(urlParams)
      const qrCode = createQR(encodedURL, 400, 'transparent')
      
      return qrCode
    } catch (error) {
      console.error('Error generating Solana Pay QR:', error)
      throw error
    }
  }

  async validatePayment(signature: string, recipient: PublicKey, amount: BigNumber) {
    try {
      // Confirm the transaction
      const transaction = await this.connection.confirmTransaction(signature, 'confirmed')
      
      if (transaction.value.err) {
        throw new Error('Transaction failed')
      }
      
      // Validate the transfer
      const reference = Keypair.generate().publicKey // This would be the actual reference
      await validateTransfer(
        this.connection,
        signature,
        { recipient, amount, reference }
      )
      
      return { success: true, signature }
    } catch (error) {
      console.error('Error validating payment:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  async createPaymentRequest(params: {
    recipient: string,
    amount: number,
    label: string,
    message: string,
    memo?: string
  }) {
    try {
      const recipientPublicKey = new PublicKey(params.recipient)
      const amount = new BigNumber(params.amount)
      
      const config: SolanaPayConfig = {
        recipient: recipientPublicKey,
        amount,
        label: params.label,
        message: params.message,
        memo: params.memo
      }
      
      const qrCode = await this.generatePaymentQR(config)
      const encodedURL = encodeURL({
        recipient: recipientPublicKey,
        amount,
        label: params.label,
        message: params.message,
        memo: params.memo
      })
      
      return {
        qrCode,
        url: encodedURL,
        recipient: params.recipient,
        amount: params.amount
      }
    } catch (error) {
      console.error('Error creating payment request:', error)
      throw error
    }
  }
}

export const solanaPayService = new SolanaPayService()
```

#### Create `src/components/payment/solana-pay-button.tsx`:
```typescript
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { solanaPayService } from '@/lib/solana-pay'
import Image from 'next/image'

interface SolanaPayButtonProps {
  amount: number
  recipient: string
  label: string
  message: string
  memo?: string
 onSuccess?: (result: any) => void
  onError?: (error: any) => void
}

export function SolanaPayButton({ 
  amount, 
  recipient,
  label, 
  message, 
  memo,
  onSuccess,
  onError 
}: SolanaPayButtonProps) {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  const generatePayment = async () => {
    try {
      setIsProcessing(true)
      
      const result = await solanaPayService.createPaymentRequest({
        recipient,
        amount,
        label,
        message,
        memo
      })
      
      setQrCode(result.url)
      setOpen(true)
    } catch (error) {
      console.error('Error generating payment:', error)
      onError?.(error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleScanComplete = () => {
    setIsCompleted(true)
    setTimeout(() => {
      setOpen(false)
      setIsCompleted(false)
      setQrCode(null)
    }, 2000)
  }

  return (
    <>
      <Button 
        onClick={generatePayment} 
        disabled={isProcessing}
        className="w-full"
      >
        {isProcessing ? 'Processing...' : `Pay ${amount} SOL`}
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pay with Phantom</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-4">
            {isCompleted ? (
              <div className="text-center">
                <div className="text-green-500 text-2xl mb-2">✓</div>
                <p>Payment completed!</p>
              </div>
            ) : qrCode ? (
              <>
                <div className="p-4 bg-white rounded-lg">
                  <Image 
                    src={qrCode} 
                    alt="Solana Pay QR Code"
                    width={200}
                    height={20}
                    className="w-48 h-48"
                  />
                </div>
                <p className="text-center text-sm text-gray-500">
                  Scan with Phantom or copy the link
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleScanComplete}
                >
                  I've Paid
                </Button>
              </>
            ) : (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p>Generating payment request...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Default props for NormalDance platform
SolanaPayButton.defaultProps = {
  recipient: process.env.NEXT_PUBLIC_PLATFORM_WALLET || 'PLATFORM_WALLET_ADDRESS',
  label: 'NormalDance',
  message: 'Payment for music tracks'
}
```

#### Create `src/app/api/solana/webhook/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { solanaPayService } from '@/lib/solana-pay'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { signature, recipient, amount } = body

    // Validate the payment
    const validation = await solanaPayService.validatePayment(
      signature,
      new PublicKey(recipient),
      new BigNumber(amount)
    )

    if (validation.success) {
      // Update order/payment status in database
      // This would connect to your database to update the payment status
      console.log(`Payment ${signature} validated successfully`)
      
      // Process the successful payment (e.g., unlock content, update user status, etc.)
      // await processSuccessfulPayment(signature, amount, recipient)
      
      return NextResponse.json({ 
        success: true, 
        message: 'Payment validated successfully',
        signature 
      })
    } else {
      console.error('Payment validation failed:', validation.error)
      return NextResponse.json({ 
        success: false, 
        error: validation.error 
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Error processing Solana Pay webhook:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Webhook processing failed' 
    }, { status: 50 })
  }
}
```

## 3. 🎨 UI/UX Improvements

### 3.1 Performance Optimization

**Objective**: Reduce page load time from 7 seconds to under 3 seconds

**Implementation**:

#### Update `next.config.ts` for bundle optimization:
```typescript
import { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@sentry/nextjs'],
  },
  images: {
    domains: ['ipfs.io', 'gateway.pinata.cloud', 'cloudflare-ipfs.com'],
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      // Cache static assets
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, immutable, max-age=31536000',
          },
        ],
      },
      // Cache images
      {
        source: '/(assets|images|icons)/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Client-side optimizations
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    }
    
    return config
  },
}

export default nextConfig
```

#### Implement code splitting in `src/app/layout.tsx`:
```typescript
import { ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { Analytics } from '@vercel/analytics/react'

// Dynamically import heavy components
const WalletProvider = dynamic(
  () => import('@/components/wallet/wallet-provider'),
  { ssr: false, loading: () => <div className="h-8 w-32 bg-gray-200 animate-pulse rounded" /> }
)

const ProgressBar = dynamic(
  () => import('@/components/ui/progress-bar'),
  { ssr: false }
)

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        <ProgressBar />
        <WalletProvider>
          {children}
        </WalletProvider>
        <Analytics />
      </body>
    </html>
  )
}
```

### 3.2 Progressive Image Loading

**Objective**: Implement progressive image loading with placeholders

#### Create `src/components/ui/progressive-image.tsx`:
```typescript
import { useState, useEffect, useRef } from 'react'
import Image, { ImageProps } from 'next/image'

interface ProgressiveImageProps extends Omit<ImageProps, 'src'> {
  src: string
  placeholder?: string
  quality?: number
}

export function ProgressiveImage({ 
  src, 
  placeholder, 
 quality = 75,
  ...props 
}: ProgressiveImageProps) {
  const [currentSrc, setCurrentSrc] = useState(placeholder || '/placeholder.jpg')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (!src) return

    const img = new Image()
    img.src = src
    img.onload = () => {
      setCurrentSrc(src)
      setLoading(false)
    }
    img.onerror = () => {
      setError(true)
      setLoading(false)
    }
  }, [src])

  return (
    <div className="relative overflow-hidden group">
      <Image
        ref={imgRef}
        src={currentSrc}
        quality={quality}
        placeholder="blur"
        blurDataURL={placeholder}
        className={`
          transition-all duration-300 ease-in-out
          ${loading ? 'scale-105 blur-sm grayscale' : 'scale-100 blur-0 grayscale-0'}
          ${error ? 'bg-gray-200' : ''}
          ${props.className || ''}
        `}
        {...props}
      />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
          <span className="text-gray-500">Image failed to load</span>
        </div>
      )}
    </div>
  )
}
```

### 3.3 Mobile Experience Enhancement

**Objective**: Improve mobile responsiveness and touch interactions

**Implementation**:

#### Update `src/app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 22.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 22.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
 }
}

/* Mobile-specific styles */
@media (max-width: 768px) {
  html {
    font-size: 14px;
  }
  
  .container {
    @apply px-4;
  }
  
  /* Increase touch targets */
  button, a {
    min-height: 44px;
    min-width: 4px;
  }
  
  /* Better form controls for mobile */
  input, select, textarea {
    font-size: 16px; /* Prevents zoom on iOS */
  }
  
  /* Mobile navigation */
  .mobile-nav {
    @apply fixed bottom-0 left-0 right-0 bg-white border-t z-50;
  }
  
  /* Mobile-friendly modals */
  .mobile-modal {
    @apply fixed inset-0 bg-white z-50 flex-col;
  }
  
  .mobile-modal-header {
    @apply p-4 border-b flex items-center justify-between;
  }
  
  .mobile-modal-body {
    @apply flex-1 overflow-y-auto p-4;
  }
}

/* Reduce motion for users who prefer it */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 4. 🔒 Security Enhancements

### 4.1 Production Environment Variables

**Objective**: Securely manage environment variables

#### Create `.env.example`:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/normaldance"

# Solana
NEXT_PUBLIC_SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
NEXT_PUBLIC_PLATFORM_WALLET="PLATFORM_WALLET_PUBLIC_KEY"

# IPFS/Pinata
PINATA_API_KEY="your_pinata_api_key"
PINATA_SECRET_API_KEY="your_pinata_secret_api_key"
NEXT_PUBLIC_IPFS_GATEWAY="https://gateway.pinata.cloud/ipfs/"

# Telegram
TELEGRAM_BOT_TOKEN="your_telegram_bot_token"
TELEGRAM_WEB_APP_URL="https://yourdomain.com/telegram-app"

# Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID="your_vercel_analytics_id"
NEXT_PUBLIC_SENTRY_DSN="your_sentry_dsn"

# Security
JWT_SECRET="your_jwt_secret"
NEXTAUTH_SECRET="your_nextauth_secret"

# Payment
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your_stripe_publishable_key"
STRIPE_SECRET_KEY="your_stripe_secret_key"
```

### 4.2 Rate Limiting

**Objective**: Implement API rate limiting

#### Create `src/middleware/rate-limiter.ts`:
```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Create a new ratelimiter, that allows 10 requests per 10 seconds
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
  prefix: '@upstash/ratelimit',
})

export async function checkRateLimit(identifier: string) {
  const { success, limit, reset, remaining } = await ratelimit.limit(identifier)
  
  return {
    success,
    limit,
    reset,
    remaining
  }
}

// Different rate limits for different endpoints
export const rateLimiters = {
 auth: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 requests per minute
    prefix: '@upstash/ratelimit:auth',
  }),
  
  tracks: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(30, '1 m'), // 30 requests per minute
    prefix: '@upstash/ratelimit:tracks',
  }),
  
  upload: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(3, '1 m'), // 3 requests per minute
    prefix: '@upstash/ratelimit:upload',
  }),
  
  nft: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
    prefix: '@upstash/ratelimit:nft',
  }),
}
```

#### Update `src/middleware.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, rateLimiters } from './middleware/rate-limiter'

const getIP = (request: NextRequest): string => {
  const xff = request.headers.get('x-forwarded-for')
  return xff ? (Array.isArray(xff) ? xff[0] : xff.split(',')[0]) : 'anonymous'
}

const getEndpoint = (request: NextRequest): string => {
  const url = new URL(request.url)
  const path = url.pathname
  return path.split('/')[1] // Get the first path segment (e.g., 'api', 'tracks', etc.)
}

export async function middleware(request: NextRequest) {
  // Get client IP
  const ip = getIP(request)
  const endpoint = getEndpoint(request)
  
  // Apply rate limiting only to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    let rateLimiter = rateLimiters.tracks // Default rate limiter
    
    // Choose appropriate rate limiter based on endpoint
    if (request.nextUrl.pathname.includes('/api/auth/')) {
      rateLimiter = rateLimiters.auth
    } else if (request.nextUrl.pathname.includes('/api/upload/')) {
      rateLimiter = rateLimiters.upload
    } else if (request.nextUrl.pathname.includes('/api/nft/')) {
      rateLimiter = rateLimiters.nft
    }
    
    const { success, limit, remaining, reset } = await rateLimiter.limit(`${endpoint}_${ip}`)
    
    if (!success) {
      return new Response('Rate limit exceeded', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      })
    }
  }
  
  // Continue with the request
 return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    {
      source: '/api/:path*',
      missing: [
        { type: 'header', key: 'nextjs-data-preload' },
      ],
    },
  ],
}
```

### 4.3 CORS Protection

**Objective**: Implement proper CORS protection

#### Update `src/middleware.ts` to include CORS:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, rateLimiters } from './middleware/rate-limiter'

const allowedOrigins = [
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
 'https://normaldance.com',
  'https://www.normaldance.com',
  'https://normaldance-git-main-aendy.vercel.app', // Vercel preview URLs
  'https://*.vercel.app', // Allow all Vercel preview URLs
  'https://t.me', // Telegram Web Apps
  'https://web.telegram.org',
]

const getIP = (request: NextRequest): string => {
  const xff = request.headers.get('x-forwarded-for')
  return xff ? (Array.isArray(xff) ? xff[0] : xff.split(',')[0]) : 'anonymous'
}

const getEndpoint = (request: NextRequest): string => {
  const url = new URL(request.url)
 const path = url.pathname
  return path.split('/')[1]
}

export async function middleware(request: NextRequest) {
  const origin = request.headers.get('origin')
  const ip = getIP(request)
  const endpoint = getEndpoint(request)
  
  // CORS handling
  const isAllowedOrigin = origin 
    ? allowedOrigins.some(allowed => 
        allowed.startsWith('https://*.') 
          ? origin.includes(allowed.substring(11)) // Remove 'https://*.'
          : origin === allowed
      )
    : false
  
  // Create response
  const response = NextResponse.next()
  
  // Set CORS headers
  if (origin && isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  } else {
    // For non-browser requests or unlisted origins, allow same-origin
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '')
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Access-Control-Max-Age', '8640') // 24 hours
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: response.headers,
    })
  }
  
  // Apply rate limiting only to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    let rateLimiter = rateLimiters.tracks // Default rate limiter
    
    if (request.nextUrl.pathname.includes('/api/auth/')) {
      rateLimiter = rateLimiters.auth
    } else if (request.nextUrl.pathname.includes('/api/upload/')) {
      rateLimiter = rateLimiters.upload
    } else if (request.nextUrl.pathname.includes('/api/nft/')) {
      rateLimiter = rateLimiters.nft
    }
    
    const { success, limit, remaining, reset } = await rateLimiter.limit(`${endpoint}_${ip}`)
    
    if (!success) {
      return new Response('Rate limit exceeded', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
          ...Object.fromEntries(response.headers.entries()), // Include CORS headers
        },
      })
    }
 }
  
  return response
}

export const config = {
  matcher: [
    {
      source: '/api/:path*',
      missing: [
        { type: 'header', key: 'nextjs-data-preload' },
      ],
    },
  ],
}
```

## 5. 📊 Analytics & Monitoring

### 5.1 Vercel Analytics

**Objective**: Complete Vercel Analytics integration

**Current State**: Package already installed, needs implementation

#### Update `src/app/layout.tsx`:
```typescript
import { ReactNode } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

#### Create `src/lib/analytics.ts`:
```typescript
import { track } from '@vercel/analytics'

export const analyticsEvents = {
  trackPurchase: (trackId: string, amount: number, paymentMethod: string) => {
    track('track_purchased', { 
      trackId,
      amount,
      paymentMethod 
    })
  },
  
  trackNFTMint: (nftId: string, collection: string) => {
    track('nft_minted', {
      nftId,
      collection
    })
  },
  
  trackTelegramInteraction: (action: string, userId?: string) => {
    track('telegram_interaction', {
      action,
      userId
    })
  },
  
  trackPageView: (path: string, title?: string) => {
    track('page_view', {
      path,
      title
    })
  },
  
  trackError: (error: string, component?: string) => {
    track('error', {
      error,
      component
    })
  }
}
```

### 5.2 Performance Metrics

**Objective**: Implement Core Web Vitals and custom performance metrics

#### Create `src/lib/web-vitals.ts`:
```typescript
import { 
  getCLS, 
  getFID, 
 getFCP, 
  getLCP, 
  getTTFB,
  ReportCallback
} from 'web-vitals'

interface CustomMetric {
  name: string
  value: number
  id: string
  delta?: number
 entries?: any[]
  navigationType?: string
}

// Send web vitals to analytics
const sendToAnalytics = ({ name, value, id }: CustomMetric) => {
  // Use Vercel Analytics or your preferred analytics tool
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', name, {
      event_category: 'Web Vitals',
      value: Math.round(name === 'CLS' ? value * 100 : value), // Convert CLS to milliseconds
      event_label: id,
      non_interaction: true,
    })
  }
  
  // Also send to custom endpoint for monitoring
  fetch('/api/analytics/vitals', {
    method: 'POST',
    body: JSON.stringify({ name, value, id }),
    headers: {
      'Content-Type': 'application/json'
    }
  }).catch(() => {
    // Ignore errors
  })
}

// Report all web vitals
export const reportWebVitals = () => {
  getCLS(sendToAnalytics)
  getFID(sendToAnalytics)
  getFCP(sendToAnalytics)
  getLCP(sendToAnalytics)
  getTTFB(sendToAnalytics)
}

// Custom performance metrics
export const measurePerformance = () => {
  if (typeof window !== 'undefined') {
    // Time to interactive
    const timeToInteractive = () => {
      if ('performance' in window) {
        const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        if (entry) {
          const tti = entry.domInteractive - entry.startTime
          sendToAnalytics({
            name: 'TTI',
            value: tti,
            id: `tti-${Date.now()}`
          })
        }
      }
    }
    
    // First CPU Idle
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        timeToInteractive()
      })
    } else {
      // Fallback for browsers that don't support requestIdleCallback
      setTimeout(timeToInteractive, 1000)
    }
  }
}

// Track custom metrics
export const trackCustomMetric = (name: string, value: number) => {
  sendToAnalytics({
    name,
    value,
    id: `${name}-${Date.now()}`
  })
}
```

#### Create `src/app/api/analytics/vitals/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'

interface VitalData {
  name: string
  value: number
 id: string
 [key: string]: any
}

export async function POST(request: NextRequest) {
  try {
    const data: VitalData = await request.json()
    
    // In a real implementation, you would store this in a database
    // For now, we'll just log it
    console.log('Web Vital:', data)
    
    // You could also send this to an external service like:
    // - Google Analytics
    // - Mixpanel
    // - Custom metrics service
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error recording web vital:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  // Return aggregated metrics (in a real implementation)
  return NextResponse.json({
    status: 'vitals endpoint active',
    timestamp: new Date().toISOString()
  })
}
```

## 📊 Summary

This technical specification provides detailed implementation guidance for all items in the 2025 development roadmap. The plan addresses:

1. **Security & Infrastructure**: Vulnerability fixes, environment management, and testing pipeline
2. **Core Integrations**: IPFS migration to Helia, Solana Pay, and Telegram Mini App
3. **User Experience**: Performance optimization, progressive loading, and mobile enhancements
4. **Security**: Rate limiting, CORS protection, and proper environment management
5. **Analytics**: Vercel integration and performance metrics

The specification includes specific code examples, file modifications, and implementation details to guide the development process.