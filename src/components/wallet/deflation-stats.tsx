"use client";

import { useMemo } from "react";

interface DeflationMetrics {
  burned: number;
  distributed: number;
  treasury: number;
  transactions: number;
  lastUpdated: string;
}

const formatNumber = (value: number, decimals = 2) =>
  value.toLocaleString("ru-RU", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

export default function DeflationStats() {
  const metrics = useMemo<DeflationMetrics>(() => ({
    burned: 128_450.23,
    distributed: 5_920_000,
    treasury: 812_340.56,
    transactions: 42_318,
    lastUpdated: new Date().toISOString(),
  }), []);

  return (
    <section className="grid gap-4 rounded-3xl border border-white/10 bg-[#080112] p-6 text-white lg:grid-cols-2">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold">Дефляционная экономика NDT</h2>
        <p className="text-sm text-white/60">
          2% комиссии с каждой транзакции распределяются по смарт-контракту:
          1% — сжигание токенов, 0.7% — фондам артистов, 0.3% — казначейству Normal Dance.
        </p>
        <p className="text-xs text-white/50">
          Обновлено: {new Date(metrics.lastUpdated).toLocaleString("ru-RU")}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-xs uppercase tracking-wide text-red-200">Сожжено</p>
          <p className="mt-2 text-2xl font-semibold text-red-100">
            {formatNumber(metrics.burned)} NDT
          </p>
          <p className="text-xs text-red-200/70">С 2024 года</p>
        </article>

        <article className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4">
          <p className="text-xs uppercase tracking-wide text-emerald-200">Фонды артистов</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-100">
            {formatNumber(metrics.distributed, 0)} USDc экв.
          </p>
          <p className="text-xs text-emerald-200/70">Переведено семьям</p>
        </article>

        <article className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
          <p className="text-xs uppercase tracking-wide text-sky-200">Казначейство</p>
          <p className="mt-2 text-2xl font-semibold text-sky-100">
            {formatNumber(metrics.treasury)} NDT
          </p>
          <p className="text-xs text-sky-200/70">Доступно для развития</p>
        </article>

        <article className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4 lg:col-span-2 xl:col-span-3">
          <p className="text-xs uppercase tracking-wide text-purple-200">
            Транзакций через дефляционную систему
          </p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <p className="text-3xl font-semibold text-purple-100">
              {metrics.transactions.toLocaleString("ru-RU")}
            </p>
            <div className="text-xs text-purple-200/70">
              <p>Последние 30 дней: +12%</p>
              <p>Средний чек: 84.30 NDT</p>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
