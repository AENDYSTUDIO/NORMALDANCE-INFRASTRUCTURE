import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useWallet } from '@solana/wallet-adapter-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Play, Upload, Music, Users } from 'lucide-react'

export default function HomePage() {
  const { connected } = useWallet()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-16">
          <div className="flex items-center space-x-2">
            <Music className="h-8 w-8 text-purple-400" />
            <h1 className="text-2xl font-bold text-white">NORMAL DANCE</h1>
          </div>
          
          <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700" />
        </header>

        {/* Hero Section */}
        <section className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-4">
            Music NFTs on Solana
          </h2>
          <p className="text-xl text-purple-200 mb-8 max-w-2xl mx-auto">
            Upload your music, mint it as an NFT, and share with the world. 
            Simple, fast, and decentralized.
          </p>
          
          {!connected && (
            <div className="bg-purple-800/50 backdrop-blur-sm rounded-lg p-6 max-w-md mx-auto">
              <p className="text-purple-200 mb-4">
                Connect your Phantom wallet to get started
              </p>
            </div>
          )}
        </section>

        {/* Features Grid */}
        {connected && (
          <section className="grid md:grid-cols-3 gap-6 mb-16">
            <Card className="bg-purple-800/20 backdrop-blur-sm border-purple-700">
              <CardHeader>
                <Upload className="h-12 w-12 text-purple-400 mb-4" />
                <CardTitle className="text-white">Upload Music</CardTitle>
                <CardDescription className="text-purple-200">
                  Upload your tracks in MP3, WAV, or FLAC format
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  Upload Track
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-purple-800/20 backdrop-blur-sm border-purple-700">
              <CardHeader>
                <Music className="h-12 w-12 text-purple-400 mb-4" />
                <CardTitle className="text-white">Mint NFT</CardTitle>
                <CardDescription className="text-purple-200">
                  Turn your music into unique NFTs on Solana
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-purple-600 hover:bg-purple-700" variant="outline">
                  Create NFT
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-purple-800/20 backdrop-blur-sm border-purple-700">
              <CardHeader>
                <Play className="h-12 w-12 text-purple-400 mb-4" />
                <CardTitle className="text-white">Discover</CardTitle>
                <CardDescription className="text-purple-200">
                  Explore music from independent artists
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-purple-600 hover:bg-purple-700" variant="outline">
                  Browse Music
                </Button>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Stats Section */}
        <section className="text-center">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div>
              <div className="text-3xl font-bold text-purple-400 mb-2">0</div>
              <div className="text-purple-200">Artists</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-400 mb-2">0</div>
              <div className="text-purple-200">Tracks</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-400 mb-2">0</div>
              <div className="text-purple-200">NFTs Minted</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}