"use client";

export interface NFTMemorial {
  id: string;
  artistName: string;
  trackTitle: string;
  genre: string;
  bpm: number;
  candlesLit: number;
  likes: number;
  shares: number;
  mintedBy: string;
  imageUrl: string;
  createdAt: string;
}

export const NFT_MEMORIALS: NFTMemorial[] = [
  {
    id: "avicii-2018",
    artistName: "Avicii",
    trackTitle: "Wake Me Up (Memorial Edition)",
    genre: "Progressive House",
    bpm: 128,
    candlesLit: 2734,
    likes: 18420,
    shares: 6210,
    mintedBy: "Global Fan DAO",
    imageUrl: "/memorials/avicii.jpg",
    createdAt: "2018-04-20"
  },
  {
    id: "sophi-2021",
    artistName: "SOPHIE",
    trackTitle: "Infatuation (Forever Mix)",
    genre: "Hyperpop",
    bpm: 140,
    candlesLit: 1189,
    likes: 9412,
    shares: 3124,
    mintedBy: "Trans Voices Collective",
    imageUrl: "/memorials/sophie.jpg",
    createdAt: "2021-02-05"
  },
  {
    id: "chester-2017",
    artistName: "Chester Bennington",
    trackTitle: "One More Light (Eternal)",
    genre: "Alternative Rock",
    bpm: 96,
    candlesLit: 3421,
    likes: 21452,
    shares: 10334,
    mintedBy: "Linkin Park Community",
    imageUrl: "/memorials/chester.jpg",
    createdAt: "2017-07-24"
  },
  {
    id: "cooper-2024",
    artistName: "DJ Cooper",
    trackTitle: "Last Dance",
    genre: "Techno",
    bpm: 132,
    candlesLit: 864,
    likes: 4121,
    shares: 958,
    mintedBy: "Berlin Underground Guild",
    imageUrl: "/memorials/cooper.jpg",
    createdAt: "2024-06-11"
  }
];

export interface NFTMemorialsProps {
  compact?: boolean;
  memorials?: NFTMemorial[];
}

export function NFTMemorials({ compact = false, memorials = NFT_MEMORIALS }: NFTMemorialsProps) {
  return (
    <section className="relative isolate overflow-hidden rounded-3xl border border-white/10 bg-black/40 p-6 shadow-lg backdrop-blur">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-3xl font-bold text-white">NFT Memorials</h2>
          <p className="mt-1 text-sm text-white/70">
            Каждая мемориальная NFT хранит музыку, истории и свет, который фанаты продолжают дарить артисту.
          </p>
        </div>
        <div className="flex items-center gap-6 text-sm text-white/60">
          <div>
            <p className="text-white text-lg font-semibold">
              {memorials.reduce((total, item) => total + item.candlesLit, 0).toLocaleString("ru-RU")}
            </p>
            <p>Огней памяти</p>
          </div>
          <div>
            <p className="text-white text-lg font-semibold">
              {memorials.length}
            </p>
            <p>Активных мемориалов</p>
          </div>
        </div>
      </div>

      <div className={`grid gap-6 ${compact ? "md:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-3"}`}>
        {memorials.map((memorial) => (
          <article
            key={memorial.id}
            className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-5 transition hover:border-purple-400/60 hover:bg-white/10"
          >
            <div className="relative mb-4 overflow-hidden rounded-xl">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition group-hover:opacity-100" />
              <img
                src={memorial.imageUrl}
                alt={memorial.artistName}
                className="aspect-[4/3] w-full object-cover"
                loading="lazy"
              />
              <div className="absolute bottom-4 left-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/80">
                <span className="rounded-full bg-purple-500/70 px-3 py-1 text-white">{memorial.genre}</span>
                <span className="rounded-full bg-black/60 px-3 py-1 text-white">{memorial.bpm} BPM</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-xl font-semibold text-white">{memorial.artistName}</h3>
                <p className="text-sm text-white/70">{memorial.trackTitle}</p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-sm text-white/70">
                <div className="rounded-lg bg-white/5 p-2">
                  <p className="text-base font-semibold text-white">{memorial.candlesLit.toLocaleString("ru-RU")}</p>
                  <p className="text-xs uppercase tracking-wide text-white/60">Огней</p>
                </div>
                <div className="rounded-lg bg-white/5 p-2">
                  <p className="text-base font-semibold text-white">{memorial.likes.toLocaleString("ru-RU")}</p>
                  <p className="text-xs uppercase tracking-wide text-white/60">Лайков</p>
                </div>
                <div className="rounded-lg bg-white/5 p-2">
                  <p className="text-base font-semibold text-white">{memorial.shares.toLocaleString("ru-RU")}</p>
                  <p className="text-xs uppercase tracking-wide text-white/60">Шеров</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-white/60">
                <span className="rounded-full bg-black/40 px-3 py-1">
                  С {new Date(memorial.createdAt).toLocaleDateString("ru-RU")}
                </span>
                <span>DAO: {memorial.mintedBy}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default NFTMemorials;
