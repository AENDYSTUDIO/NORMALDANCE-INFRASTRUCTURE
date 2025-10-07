"use client";

import { ArtistDashboard } from "@/components/artist/artist-dashboard";
import { Marketplace } from "@/components/marketplace/marketplace";
import { MusicPlayer } from "@/components/music/music-player";
import { UploadMusic } from "@/components/music/upload-music";
import { TelegramMiniApp } from "@/components/telegram/telegram-mini-app";
import { TransactionHistory } from "@/components/transactions/transaction-history";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConnectWallet } from "@/components/wallet/connect-wallet";
import {
  Code,
  Cpu,
  Globe,
  History,
  Music,
  Play,
  ShoppingCart,
  Smartphone,
  Store,
  Target,
  TrendingUp,
  Trophy,
  Upload,
  User,
  Users,
  Volume2,
  Wallet,
  Zap,
} from "lucide-react";
import { useState } from "react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("marketplace");
  const [solanaConnected, setSolanaConnected] = useState(false);
  const [tonConnected, setTonConnected] = useState(false);
  const [telegramUser, setTelegramUser] = useState<any>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-purple-950 dark:via-pink-950 dark:to-blue-950">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
              <Music className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              NormalDance 🎵
            </h1>
          </div>

          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
            Web3 Music Platform with Telegram Mini App Integration • Solana &
            TON Blockchain Support • NFT Marketplace & Streaming
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <span className="px-4 py-2 bg-purple-100 dark:bg-purple-900 rounded-full text-purple-800 dark:text-purple-200 text-sm font-medium">
              Next.js 15
            </span>
            <span className="px-4 py-2 bg-blue-100 dark:bg-blue-900 rounded-full text-blue-800 dark:text-blue-200 text-sm font-medium">
              TypeScript
            </span>
            <span className="px-4 py-2 bg-green-100 dark:bg-green-90 rounded-full text-green-800 dark:text-green-200 text-sm font-medium">
              Tailwind CSS
            </span>
            <span className="px-4 py-2 bg-yellow-100 dark:bg-yellow-90 rounded-full text-yellow-800 dark:text-yellow-200 text-sm font-medium">
              Solana
            </span>
            <span className="px-4 py-2 bg-red-100 dark:bg-red-90 rounded-full text-red-800 dark:text-red-20 text-sm font-medium">
              TON
            </span>
            <span className="px-4 py-2 bg-cyan-100 dark:bg-cyan-900 rounded-full text-cyan-800 dark:text-cyan-200 text-sm font-medium">
              Telegram
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
            <Card className="border-purple-200 dark:border-purple-800 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Volume2 className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                </div>
                <CardTitle className="text-lg">Music Streaming</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  2% transaction fees support artist revenue and platform
                  development
                </p>
              </CardContent>
            </Card>

            <Card className="border-pink-200 dark:border-pink-800 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader>
                <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Store className="h-6 w-6 text-pink-600 dark:text-pink-300" />
                </div>
                <CardTitle className="text-lg">NFT Marketplace</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Solana-based NFT trading with IPFS storage and cross-chain
                  compatibility
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 dark:border-blue-800 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                </div>
                <CardTitle className="text-lg">Instant Payouts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Blockchain-powered instant payments with minimal gas fees
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mb-8">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 text-lg">
              <Smartphone className="h-5 w-5 mr-2" />
              Launch Telegram Mini-App
            </Button>
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section className="py-16 px-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 bg-gradient-to-r from-purple-600 to-pink-60 bg-clip-text text-transparent">
            Technology Stack
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-6 w-6 text-purple-600" />
                  Frontend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Next.js 15 with App Router</li>
                  <li>• TypeScript 5</li>
                  <li>• Tailwind CSS 4</li>
                  <li>• Radix UI Components</li>
                  <li>• Framer Motion animations</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-6 w-6 text-blue-600" />
                  Web3 & Blockchain
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Solana Integration</li>
                  <li>• @solana/pay</li>
                  <li>• TON Connect</li>
                  <li>• IPFS/Helia Storage</li>
                  <li>• Phantom Wallet</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-green-200 dark:border-green-80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-6 w-6 text-green-600" />
                  Backend & Infrastructure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Node.js & Express</li>
                  <li>• PostgreSQL + Prisma ORM</li>
                  <li>• Redis caching</li>
                  <li>• Socket.IO real-time</li>
                  <li>• Next.js API Routes</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Project Status Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Project Status
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-purple-200 dark:border-purple-80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-purple-600" />
                  Completed Modules
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>✅ Architecture & Setup</li>
                  <li>✅ Authentication System</li>
                  <li>✅ Solana Pay Integration</li>
                  <li>✅ Telegram Mini-App Backend</li>
                  <li>✅ NFT Marketplace Core</li>
                  <li>✅ Music Streaming Platform</li>
                  <li>✅ IPFS Migration to Helia</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-blue-200 dark:border-blue-80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-6 w-6 text-blue-600" />
                  In Development
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>🔄 AI-Powered Recommendations</li>
                  <li>🔄 Advanced Analytics</li>
                  <li>🔄 DAO Governance</li>
                  <li>🔄 Staking System</li>
                  <li>🔄 Mobile App</li>
                  <li>🔄 Cross-chain Bridge</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <Card className="inline-block border-green-200 dark:border-green-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-4 text-sm">
                  <span className="flex items-center gap-2">
                    <Code className="h-4 w-4 text-green-600" />
                    121,484+ lines of code
                  </span>
                  <span className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    75% Ready
                  </span>
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-600" />0 Beta Users
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-16 px-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Platform Features
          </h2>

          {(solanaConnected || tonConnected) && (
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-5 mb-8">
                <TabsTrigger
                  value="marketplace"
                  className="flex items-center gap-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span className="hidden sm:inline">Marketplace</span>
                </TabsTrigger>
                <TabsTrigger value="player" className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  <span className="hidden sm:inline">Player</span>
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  <span className="hidden sm:inline">Upload</span>
                </TabsTrigger>
                <TabsTrigger
                  value="dashboard"
                  className="flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="flex items-center gap-2"
                >
                  <History className="h-4 w-4" />
                  <span className="hidden sm:inline">History</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="marketplace" className="mt-6">
                <Marketplace
                  solanaConnected={solanaConnected}
                  tonConnected={tonConnected}
                />
              </TabsContent>

              <TabsContent value="player" className="mt-6">
                <MusicPlayer />
              </TabsContent>

              <TabsContent value="upload" className="mt-6">
                <UploadMusic
                  solanaConnected={solanaConnected}
                  tonConnected={tonConnected}
                />
              </TabsContent>

              <TabsContent value="dashboard" className="mt-6">
                <ArtistDashboard
                  solanaConnected={solanaConnected}
                  tonConnected={tonConnected}
                />
              </TabsContent>

              <TabsContent value="history" className="mt-6">
                <TransactionHistory
                  solanaConnected={solanaConnected}
                  tonConnected={tonConnected}
                />
              </TabsContent>
            </Tabs>
          )}

          {!solanaConnected && !tonConnected && (
            <Card className="border-purple-200 dark:border-purple-800">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Welcome to NormalDance Platform
                </CardTitle>
                <CardDescription className="text-lg">
                  The dual-chain music NFT marketplace supporting Solana and TON
                  blockchains
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-purple-10 dark:bg-purple-900 rounded-full flex items-center justify-center">
                      <Wallet className="h-8 w-8 text-purple-600 dark:text-purple-300" />
                    </div>
                    <h3 className="font-semibold mb-2">Dual Wallet Support</h3>
                    <p className="text-sm text-muted-foreground">
                      Connect Phantom (Solana) or TON Connect wallets
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-pink-100 dark:bg-pink-900 rounded-full flex items-center justify-center">
                      <Music className="h-8 w-8 text-pink-600 dark:text-pink-300" />
                    </div>
                    <h3 className="font-semibold mb-2">Music NFTs</h3>
                    <p className="text-sm text-muted-foreground">
                      Mint, buy, and sell music as unique NFTs
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-90 rounded-full flex items-center justify-center">
                      <Play className="h-8 w-8 text-blue-600 dark:text-blue-300" />
                    </div>
                    <h3 className="font-semibold mb-2">Streaming</h3>
                    <p className="text-sm text-muted-foreground">
                      Stream your purchased music instantly
                    </p>
                  </div>
                </div>
                <ConnectWallet
                  onSolanaConnect={setSolanaConnected}
                  onTonConnect={setTonConnected}
                  solanaConnected={solanaConnected}
                  tonConnected={tonConnected}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Telegram Integration */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Telegram Mini-App Integration
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Access the full platform experience directly through Telegram with
            our Mini-App integration
          </p>
          <TelegramMiniApp onTelegramAuth={setTelegramUser} />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">About</h3>
              <p className="text-sm text-muted-foreground">
                A dual-chain music NFT platform supporting Solana and TON
                blockchains with Telegram Mini App integration.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Features</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Music NFT Minting</li>
                <li>• Dual Blockchain Support</li>
                <li>• Telegram Integration</li>
                <li>• Music Streaming</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Blockchains</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Solana (Phantom Wallet)</li>
                <li>• TON (TON Connect)</li>
                <li>• Cross-chain transfers</li>
                <li>• Low gas fees</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Community</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Telegram Community</li>
                <li>• Artist Support</li>
                <li>• Developer API</li>
                <li>• Documentation</li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 NormalDance Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
