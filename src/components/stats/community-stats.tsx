interface StatItem {
  label: string;
  value: string;
  description: string;
}

const stats: StatItem[] = [
  {
    label: "Активных DAO",
    value: "28",
    description: "Музыкальные сообщества, управляющие мемориалами и роялти",
  },
  {
    label: "Огней памяти",
    value: "12 540",
    description: "Донаты фанатов за последние 30 дней через NFT мемориалы",
  },
  {
    label: "IPFS узлов",
    value: "6",
    description: "Репликация контента в Helia, web3.storage и Pinata",
  },
];

export function CommunityStats() {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#0E011C] p-6 text-white shadow-lg">
      <div className="mb-4 text-sm uppercase tracking-wide text-white/60">Статистика сообщества</div>
      <div className="space-y-5">
        {stats.map((stat) => (
          <article key={stat.label} className="rounded-xl bg-white/5 p-4">
            <p className="text-3xl font-semibold">{stat.value}</p>
            <p className="text-sm text-white/60">{stat.label}</p>
            <p className="mt-2 text-xs text-white/50">{stat.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default CommunityStats;
