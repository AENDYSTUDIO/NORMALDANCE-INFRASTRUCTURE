import GraveyardGrid from '@/components/grave/GraveyardGrid'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'G.rave - Цифровое кладбище музыки',
  description: 'Вечные мемориалы для музыкантов на блокчейне'
}

export default function GravePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Заголовок */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            G.rave
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Цифровое посмертие для музыкантов → вечный доход для наследников
          </p>
          <div className="flex justify-center gap-4 mb-8">
            <a href="#memorials" className="btn btn-primary">
              Создать мемориал
            </a>
            <a href="#donate" className="btn btn-secondary">
              Поддержать наследие
            </a>
          </div>
        </div>

        {/* Статистика */}
        <div className="stats shadow w-full mb-12">
          <div className="stat">
            <div className="stat-figure text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
              </svg>
            </div>
            <div className="stat-title text-white">Мемориалов</div>
            <div className="stat-value text-primary">∞</div>
            <div className="stat-desc text-gray-300">Вечная память</div>
          </div>
          
          <div className="stat">
            <div className="stat-figure text-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
            <div className="stat-title text-white">Хранение</div>
            <div className="stat-value text-secondary">$0</div>
            <div className="stat-desc text-gray-300">Бесплатно навсегда</div>
          </div>
          
          <div className="stat">
            <div className="stat-figure text-accent">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"></path>
              </svg>
            </div>
            <div className="stat-title text-white">Блокчейн</div>
            <div className="stat-value text-accent">100%</div>
            <div className="stat-desc text-gray-300">Неизменяемость</div>
          </div>
        </div>

        {/* Основной контент */}
        <div id="memorials">
          <GraveyardGrid />
        </div>

        {/* Информация о системе */}
        <div className="mt-16 bg-white/10 backdrop-blur-lg rounded-2xl p-8">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">
            Как работает G.rave?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🪦</div>
              <h3 className="text-xl font-bold text-white mb-2">Создание мемориала</h3>
              <p className="text-gray-300">
                Загрузите аудио, фото и биографию артиста на IPFS. 
                Создайте NFT-мемориал на блокчейне.
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-bold text-white mb-2">Пожертвования</h3>
              <p className="text-gray-300">
                Сообщество жертвует в мемориальный фонд. 
                98% идет наследникам, 2% - платформе.
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-4">♾️</div>
              <h3 className="text-xl font-bold text-white mb-2">Вечное хранение</h3>
              <p className="text-gray-300">
                Музыка и память сохраняются навсегда в блокчейне 
                и IPFS. Никто не может удалить или изменить.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
