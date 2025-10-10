"use client";

import { Suspense } from 'react';
import { NFTMemorials, default as NFTMemorialsComponent } from '@/components/memorials/index';

export default function MemorialsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <NFTMemorials compact={true} />
      
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/40 opacity-10">
        <div className="absolute inset-0 bg-black/20 blur-xl" />
      </div>
      
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          🎵 Music NFT Memorials
        </h1>
        <p className="text-xl text-white/90">
          Preserve your musical moments forever as NFTs
        </p>
        <p className="text-white/80">
          Powered by AI recommendations and blockchain technology
        </p>
        
        {/* Quick Stats */}
        <div className="flex justify-center gap-8 mt-4">
          <div className="text-white/90">
            <div className="text-2xl font-bold">{default().length}</div>
            <p className="text-white/80">
              Active Memorials
            </p>
          </div>
        </div>
      
        <div className="text-white/90">
          <div className="text-xl font-bold">
            {default().reduce((sum, m) => sum + m.likes, 0)} Total Likes
          </div>
          <div className="text-white/80">
            {default().reduce((sum, m) => sum + m.shares, 0)} Total Shares
          </div>
        </div>
      </div>
    </div>
  );
}

export default MemorialsPage;
