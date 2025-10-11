"use client";

import Link from "next/link";

import { NFTMemorials, NFT_MEMORIALS } from "@/components/memorials";
import { Button } from "@/components/ui/button";

const memorials = NFT_MEMORIALS;

const featureBlocks = [
  {
    title: "Голос DAO",
    description:
      "Каждый мемориал поддерживается фандомом. Управление роялти и обновлениями реализовано через голосование в DAO.",
  },
  {
    title: "Дефляционная экономика 2%",
    description:
      "98% донатов отправляются семье или фонду артиста, 2% — на поддержание инфраструктуры Normal Dance.",
  },
  {
    title: "Вечное хранение",
    description:
      "Музыка и артефакты лежат в IPFS/Filecoin, а ключевые события фиксируются в блокчейне TON и Solana.",
  },
  {
    title: "Web3 доступ",
    description:
      "TON, Solana, Ethereum. Поддержка Phantom, Ton Wallet и Ledger. Интеграция с Telegram Mini App.",
  },
];

export default function NFTMemorialsLandingPage() {
  return (
    <main className="relative mx-auto flex max-w-6xl flex-col gap-12 px-4 py-16 text-white">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#130221] via-[#1F0644] to-[#060212]" />

      <section className="flex flex-col gap-8 lg:flex-row lg:items-center">
        <div className="flex-1 space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-sm uppercase tracking-wide text-white/80">
            NFT • TON • SOLANA • IPFS
          </span>
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">
            NFT-мемориалы Normal Dance —
            <span className="block bg-gradient-to-r from-[#b993ff] via-[#7b61ff] to-[#e45cff] bg-clip-text text-transparent drop-shadow-lg">
              музыка и память навсегда on-chain
            </span>
          </h1>
          <p className="max-w-2xl text-lg text-white/80">
            Создавайте цифровые мемориалы артистов с пожизненной монетизацией, динамическими 3D-винилами и DAO управлением. Все активы хранятся децентрализованно, а доступ открыт из Telegram Mini App.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" className="bg-white text-purple-700 hover:bg-gray-100">
              Запустить мемориал
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/grave/demo">Посмотреть 3D демо</Link>
            </Button>
          </div>
        </div>
        <div className="flex flex-1 justify-center lg:justify-end">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
            <NFTMemorials compact memorials={memorials.slice(0, 3)} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 rounded-3xl border border-white/10 bg-black/30 p-8 md:grid-cols-2">
        {featureBlocks.map((feature) => (
          <div key={feature.title} className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm">
            <h3 className="text-xl font-semibold">{feature.title}</h3>
            <p className="mt-2 text-sm text-white/70">{feature.description}</p>
          </div>
        ))}
      </section>

      <section className="space-y-8 rounded-3xl border border-white/10 bg-black/40 p-8">
        <header className="space-y-2">
          <h2 className="text-3xl font-bold">Поток NFT-пожертвований</h2>
          <p className="text-white/70">
            Каждая транзакция в мемориале отображается в реальном времени: донаты, стейкинг, выкуп долей фанатами, governance-голоса.
          </p>
        </header>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5">
            <p className="text-emerald-200">Mint & Stake</p>
            <p className="mt-2 text-2xl font-semibold">≈ 12 540 TON</p>
            <p className="text-sm text-white/60">За 30 дней донатов по всем мемориалам</p>
          </div>
          <div className="rounded-2xl border border-purple-400/30 bg-purple-500/10 p-5">
            <p className="text-purple-200">Fan Shares</p>
            <p className="mt-2 text-2xl font-semibold">+18% / месяц</p>
            <p className="text-sm text-white/60">Рост стоимости долей после релиза</p>
          </div>
          <div className="rounded-2xl border border-blue-400/30 bg-sky-500/10 p-5">
            <p className="text-sky-200">Telegram Mini App</p>
            <p className="mt-2 text-2xl font-semibold">9 840 MAU</p>
            <p className="text-sm text-white/60">Активных пользователей мемориалов</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-gradient-to-r from-purple-800/60 to-fuchsia-700/60 p-8">
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold">Готовы перейти на вечный формат музыки?</h2>
            <p className="max-w-2xl text-white/80">
              Команда Normal Dance интегрирует ваш каталог и активирует NFT-мемориалы с on-chain аналитикой, токеномикой и 3D визуализацией.
            </p>
          </div>
          <Button size="lg" className="bg-white text-purple-700 hover:bg-slate-100">
            Связаться с командой
          </Button>
        </div>
      </section>
    </main>
  );
}
