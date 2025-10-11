import GraveVinyl from '@/components/grave/GraveVinyl';
import GraveDonateButton from '@/components/grave/GraveDonateButton';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'G.rave 2.0 Demo - 3D Eternal Vinyl',
  description: 'Interactive 3D vinyl memorial with TON blockchain donations'
};

export default function GraveDemoPage() {
  // Demo memorial data
  const memorial = {
    id: 'demo-avicii',
    artistName: 'Avicii',
    bpm: 128,
    tracks: 150,
    candlesLit: 2734,
    isPlaying: true,
    memorialAddress: 'EQDemo...Memorial', // TODO: Replace with real TON address after deployment
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            G.rave 2.0 Demo
          </h1>
          <p className="text-xl text-gray-300 mb-4">
            Interactive 3D Eternal Vinyl • TON Blockchain • IPFS Storage
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <div className="badge badge-lg badge-primary gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-4 h-4 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Three.js
            </div>
            <div className="badge badge-lg badge-secondary gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-4 h-4 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
              TON Contract
            </div>
            <div className="badge badge-lg badge-accent gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-4 h-4 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
              </svg>
              70% Ready
            </div>
          </div>
        </div>

        {/* 3D Vinyl Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Vinyl (2 columns) */}
          <div className="lg:col-span-2">
            <div className="card bg-base-100 shadow-2xl">
              <div className="card-body p-4">
                <GraveVinyl
                  bpm={memorial.bpm}
                  tracks={memorial.tracks}
                  name={memorial.artistName}
                  candlesLit={memorial.candlesLit}
                  isPlaying={memorial.isPlaying}
                />
              </div>
            </div>
          </div>

          {/* Info & Actions (1 column) */}
          <div className="space-y-6">
            {/* Memorial Info Card */}
            <div className="card bg-gradient-to-br from-purple-900 to-pink-900 text-white shadow-2xl">
              <div className="card-body">
                <h2 className="card-title text-3xl mb-4">
                  {memorial.artistName}
                  <div className="badge badge-secondary">Demo</div>
                </h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-black/30 rounded">
                    <span className="text-sm font-semibold">BPM:</span>
                    <span className="text-lg">{memorial.bpm}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-2 bg-black/30 rounded">
                    <span className="text-sm font-semibold">Tracks:</span>
                    <span className="text-lg">{memorial.tracks}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-2 bg-black/30 rounded">
                    <span className="text-sm font-semibold">Candles Lit:</span>
                    <span className="text-lg font-bold text-yellow-300">
                      🕯️ {memorial.candlesLit.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="card-actions justify-center mt-6">
                  <GraveDonateButton
                    memorialId={memorial.id}
                    memorialAddress={memorial.memorialAddress}
                    artistName={memorial.artistName}
                    onSuccess={() => {
                      // Reload page to show updated candles
                      window.location.reload();
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Features Card */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title text-lg">✨ Features</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>3D vinyl spins eternally</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Grooves based on BPM & tracks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Real-time glow on donations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Multi-chain: TON/SOL/ETH</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500">⏳</span>
                    <span>Click-to-play audio (coming)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500">⏳</span>
                    <span>Top-27 leaderboard (coming)</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Tech Stack Card */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title text-lg">🛠️ Tech Stack</h3>
                <div className="flex flex-wrap gap-2">
                  <div className="badge badge-outline">Three.js R160</div>
                  <div className="badge badge-outline">React Three Fiber</div>
                  <div className="badge badge-outline">FunC</div>
                  <div className="badge badge-outline">TON Connect</div>
                  <div className="badge badge-outline">IPFS</div>
                  <div className="badge badge-outline">Next.js 15</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="card bg-base-100 shadow-xl mb-8">
          <div className="card-body">
            <h2 className="card-title text-3xl mb-6 justify-center">
              How G.rave 2.0 Works
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6">
                <div className="text-6xl mb-4">🪦</div>
                <h3 className="text-xl font-bold mb-2">1. Create Memorial</h3>
                <p className="text-gray-600">
                  Upload artist's music, photos, and bio to IPFS. 
                  Mint NFT memorial on TON blockchain.
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="text-6xl mb-4">🕯️</div>
                <h3 className="text-xl font-bold mb-2">2. Light Candles</h3>
                <p className="text-gray-600">
                  Fans donate via TON/SOL/ETH. 98% goes to family, 
                  2% to platform. Vinyl glows brighter with each candle.
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="text-6xl mb-4">♾️</div>
                <h3 className="text-xl font-bold mb-2">3. Eternal Storage</h3>
                <p className="text-gray-600">
                  Memorial lives forever on blockchain + IPFS. 
                  $0 storage cost. Immutable and censorship-resistant.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="alert alert-info shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <h3 className="font-bold">This is a demo!</h3>
            <div className="text-xs">
              TON contract pending deployment. In production, donations will be processed on-chain.
              <a href="/grave" className="link link-primary ml-2">View all memorials →</a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
