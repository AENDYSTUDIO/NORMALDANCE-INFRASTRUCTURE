'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Telegram, Smartphone, CheckCircle, AlertCircle } from 'lucide-react'

interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
}

interface TelegramMiniAppProps {
  onTelegramAuth: (user: TelegramUser) => void
}

export function TelegramMiniApp({ onTelegramAuth }: TelegramMiniAppProps) {
  const [isTelegramApp, setIsTelegramApp] = useState(false)
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Check if running inside Telegram Mini App
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      setIsTelegramApp(true)
      const webApp = window.Telegram.WebApp
      
      // Initialize WebApp
      webApp.ready()
      webApp.expand()
      
      // Get user data if available
      if (webApp.initDataUnsafe?.user) {
        setTelegramUser(webApp.initDataUnsafe.user)
        onTelegramAuth(webApp.initDataUnsafe.user)
      }
    }
  }, [onTelegramAuth])

  const handleTelegramAuth = () => {
    if (isTelegramApp && window.Telegram?.WebApp) {
      const webApp = window.Telegram.WebApp
      
      // Request user authentication if not already available
      if (!telegramUser) {
        setIsLoading(true)
        webApp.requestContact((success) => {
          setIsLoading(false)
          if (success && webApp.initDataUnsafe?.user) {
            setTelegramUser(webApp.initDataUnsafe.user)
            onTelegramAuth(webApp.initDataUnsafe.user)
          }
        })
      }
    } else {
      // Open Telegram bot for authentication
      const botUsername = 'MusicNFTBot' // Replace with your bot username
      const authUrl = `https://t.me/${botUsername}?start=webapp`
      window.open(authUrl, '_blank')
    }
  }

  const showTelegramAlert = (message: string) => {
    if (isTelegramApp && window.Telegram?.WebApp) {
      window.Telegram.WebApp.showAlert(message)
    } else {
      alert(message)
    }
  }

  return (
    <Card className="border-blue-200 dark:border-blue-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Telegram className="h-5 w-5 text-blue-600" />
          Telegram Mini App
        </CardTitle>
        <CardDescription>
          {isTelegramApp 
            ? 'You are accessing this platform through Telegram Mini App'
            : 'Open in Telegram for enhanced experience'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Indicator */}
        <div className="flex items-center space-x-2">
          {isTelegramApp ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-600">
                Telegram Mini App Active
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-600">
                Web Browser Mode
              </span>
            </>
          )}
        </div>

        {/* User Info */}
        {telegramUser && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-semibold mb-2">Telegram User</h4>
            <div className="space-y-1 text-sm">
              <p><strong>Name:</strong> {telegramUser.first_name} {telegramUser.last_name || ''}</p>
              {telegramUser.username && (
                <p><strong>Username:</strong> @{telegramUser.username}</p>
              )}
              <p><strong>ID:</strong> {telegramUser.id}</p>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="space-y-2">
          <h4 className="font-semibold">Telegram Features</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Badge variant="secondary" className="justify-center">
              <Smartphone className="h-3 w-3 mr-1" />
              Mobile Optimized
            </Badge>
            <Badge variant="secondary" className="justify-center">
              <CheckCircle className="h-3 w-3 mr-1" />
              Quick Auth
            </Badge>
            <Badge variant="secondary" className="justify-center">
              <Telegram className="h-3 w-3 mr-1" />
              Native Payments
            </Badge>
            <Badge variant="secondary" className="justify-center">
              <Smartphone className="h-3 w-3 mr-1" />
              Push Notifications
            </Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          {!telegramUser && (
            <Button 
              onClick={handleTelegramAuth}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Connecting...
                </>
              ) : (
                <>
                  <Telegram className="h-4 w-4 mr-2" />
                  {isTelegramApp ? 'Authenticate with Telegram' : 'Open in Telegram'}
                </>
              )}
            </Button>
          )}
          
          {isTelegramApp && (
            <Button 
              variant="outline" 
              onClick={() => showTelegramAlert('Welcome to MusicNFT Platform!')}
              className="w-full"
            >
              Test Telegram Integration
            </Button>
          )}
        </div>

        {/* Instructions */}
        {!isTelegramApp && (
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">How to use Telegram Mini App:</h4>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>Open Telegram and search for @MusicNFTBot</li>
              <li>Click the "Launch App" button in the bot</li>
              <li>Enjoy the enhanced mobile experience</li>
              <li>Use Telegram authentication for quick access</li>
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  )
}