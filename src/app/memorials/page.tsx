"use client";

import { NFTMemorials, NFT_MEMORIALS } from '@/components/memorials';

const memorials = NFT_MEMORIALS;

export default function MemorialsPage() {
  const totalLikes = memorials.reduce((sum, memorial) => sum + memorial.likes, 0);
  const totalShares = memorials.reduce((sum, memorial) => sum + memorial.shares, 0);
  const totalCandles = memorials.reduce((sum, memorial) => sum + memorial.candlesLit, 0);

  return (
    <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-900/20 via-blue-900/40 opacity-20" />
      <header className="text-center text-white">
        <h1 className="text-4xl font-bold md:text-5xl">🎵 Music NFT Memorials</h1>
        <p className="mt-3 text-lg text-white/80">
          Вечные цифровые мемориалы, созданные фанатами и DAO сообществами.
        </p>
        <p className="text-white/60">
          Солана + TON • IPFS хранение • DAO управление • Экономика памяти 2%
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-6">
          <div className="rounded-2xl border border-white/10 bg-black/40 px-6 py-4">
            <p className="text-3xl font-semibold">{memorials.length}</p>
            <p className="text-sm uppercase tracking-wide text-white/60">Активных мемориалов</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 px-6 py-4">
            <p className="text-3xl font-semibold">{totalCandles.toLocaleString('ru-RU')}</p>
            <p className="text-sm uppercase tracking-wide text-white/60">Огней памяти</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 px-6 py-4">
            <p className="text-3xl font-semibold">{totalLikes.toLocaleString('ru-RU')}</p>
            <p className="text-sm uppercase tracking-wide text-white/60">Лайков</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 px-6 py-4">
            <p className="text-3xl font-semibold">{totalShares.toLocaleString('ru-RU')}</p>
            <p className="text-sm uppercase tracking-wide text-white/60">Шеров</p>
          </div>
        </div>
      </header>

      <NFTMemorials compact memorials={memorials} />
    </div>
  );
}
