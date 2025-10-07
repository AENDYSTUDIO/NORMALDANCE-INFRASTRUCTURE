'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Wallet, Smartphone, CheckCircle } from 'lucide-react'

interface ConnectWalletProps {
  onSolanaConnect: (connected: boolean) => void
  onTonConnect: (connected: boolean) => void
  solanaConnected: boolean
  tonConnected: boolean
}

export function ConnectWallet({ onSolanaConnect, onTonConnect, solanaConnected, tonConnected }: ConnectWalletProps) {
  const [isConnecting, setIsConnecting] = useState<'solana' | 'ton' | null>(null)

  const connectSolana = async () => {
    setIsConnecting('solana')
    try {
      // Check if Phantom wallet is installed
      if (typeof window !== 'undefined' && 'solana' in window) {
        const phantom = (window as any).solana
        if (phantom?.isPhantom) {
          const response = await phantom.connect()
          console.log('Connected to Phantom wallet:', response.publicKey.toString())
          onSolanaConnect(true)
        }
      } else {
        // Open Phantom wallet download page
        window.open('https://phantom.app/', '_blank')
      }
    } catch (error) {
      console.error('Failed to connect to Phantom wallet:', error)
    } finally {
      setIsConnecting(null)
    }
  }

  const connectTon = async () => {
    setIsConnecting('ton')
    try {
      // TON Connect implementation
      console.log('Connecting to TON wallet...')
      // For now, simulate connection
      setTimeout(() => {
        onTonConnect(true)
        setIsConnecting(null)
      }, 2000)
    } catch (error) {
      console.error('Failed to connect to TON wallet:', error)
      setIsConnecting(null)
    }
  }

  const disconnectSolana = () => {
    if (typeof window !== 'undefined' && 'solana' in window) {
      const phantom = (window as any).solana
      phantom?.disconnect()
    }
    onSolanaConnect(false)
  }

  const disconnectTon = () => {
    onTonConnect(false)
  }

  if (solanaConnected || tonConnected) {
    return (
      <div className="flex items-center space-x-2">
        {solanaConnected && (
          <div className="flex items-center space-x-2 px-3 py-1 bg-purple-100 dark:bg-purple-900 rounded-full">
            <CheckCircle className="h-4 w-4 text-purple-600 dark:text-purple-300" />
            <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
              Solana
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={disconnectSolana}
              className="h-auto p-0 text-purple-600 hover:text-purple-800"
            >
              ×
            </Button>
          </div>
        )}
        {tonConnected && (
          <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 rounded-full">
            <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-300" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              TON
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={disconnectTon}
              className="h-auto p-0 text-blue-600 hover:text-blue-800"
            >
              ×
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
          <Wallet className="h-4 w-4 mr-2" />
          Connect Wallet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Your Wallet</DialogTitle>
          <DialogDescription>
            Choose your preferred blockchain wallet to get started
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={connectSolana}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-purple-600 dark:text-purple-300" />
                </div>
                Phantom Wallet
              </CardTitle>
              <CardDescription>
                Connect your Phantom wallet for Solana blockchain
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                variant="outline"
                disabled={isConnecting === 'solana'}
              >
                {isConnecting === 'solana' ? 'Connecting...' : 'Connect Phantom'}
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={connectTon}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <Smartphone className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                </div>
                TON Connect
              </CardTitle>
              <CardDescription>
                Connect your TON wallet for The Open Network
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                variant="outline"
                disabled={isConnecting === 'ton'}
              >
                {isConnecting === 'ton' ? 'Connecting...' : 'Connect TON'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}