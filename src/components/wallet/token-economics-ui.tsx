import React, { useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import { InvisibleDeflationAdapter } from './invisible-deflation-adapter';

interface TokenEconomicsProps {
  invisibleDeflationAdapter: InvisibleDeflationAdapter;
  tokenMint: PublicKey;
  className?: string;
}

interface DeflationStats {
 totalSupply: number;
  burnedTokens: number;
  currentSupply: number;
  treasuryDistributed: number;
  stakingDistributed: number;
}

const TokenEconomicsUI: React.FC<TokenEconomicsProps> = ({
  invisibleDeflationAdapter,
  tokenMint,
  className = ''
}) => {
  const [stats, setStats] = useState<DeflationStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('all');

  useEffect(() => {
    fetchDeflationStats();
  }, [invisibleDeflationAdapter, tokenMint]);

  const fetchDeflationStats = async () => {
    try {
      setLoading(true);
      const stats = await invisibleDeflationAdapter.getDeflationStats(tokenMint);
      setStats(stats);
      setError(null);
    } catch (err) {
      console.error('Error fetching deflation stats:', err);
      setError('Failed to fetch token economics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <h2 className="text-xl font-bold mb-4">Экономика токенов</h2>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <h2 className="text-xl font-bold mb-4">Экономика токенов</h2>
        <p className="text-red-500">Ошибка загрузки данных: {error || 'Нет данных'}</p>
      </div>
    );
  }

  // Calculate percentages
  const burnPercentage = stats.totalSupply > 0 
    ? (stats.burnedTokens / stats.totalSupply) * 100 
    : 0;
  const currentSupplyPercentage = stats.totalSupply > 0 
    ? (stats.currentSupply / stats.totalSupply) * 100 
    : 0;

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Экономика токенов NDT</h2>
        <select 
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="border rounded px-2 py-1"
        >
          <option value="24h">24ч</option>
          <option value="7d">7д</option>
          <option value="30d">30д</option>
          <option value="all">Все время</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Total Supply Card */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Общее предложение</h3>
          <p className="text-2xl font-bold">{stats.totalSupply.toLocaleString('ru-RU')}</p>
          <p className="text-xs text-gray-400">всего токенов</p>
        </div>

        {/* Current Supply Card */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 className="text-sm font-medium text-blue-500 mb-1">Текущее предложение</h3>
          <p className="text-2xl font-bold text-blue-700">{stats.currentSupply.toLocaleString('ru-RU')}</p>
          <p className="text-xs text-blue-400">{currentSupplyPercentage.toFixed(2)}% от общего</p>
        </div>

        {/* Burned Tokens Card */}
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <h3 className="text-sm font-medium text-red-500 mb-1">Сожжено токенов</h3>
          <p className="text-2xl font-bold text-red-700">{stats.burnedTokens.toLocaleString('ru-RU')}</p>
          <p className="text-xs text-red-400">{burnPercentage.toFixed(2)}% от общего</p>
        </div>

        {/* Treasury Card */}
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <h3 className="text-sm font-medium text-yellow-500 mb-1">Казна</h3>
          <p className="text-2xl font-bold text-yellow-700">{stats.treasuryDistributed.toLocaleString('ru-RU')}</p>
          <p className="text-xs text-yellow-400">распределено</p>
        </div>

        {/* Staking Card */}
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <h3 className="text-sm font-medium text-green-500 mb-1">Стейкинг</h3>
          <p className="text-2xl font-bold text-green-700">{stats.stakingDistributed.toLocaleString('ru-RU')}</p>
          <p className="text-xs text-green-400">в наградах</p>
        </div>

        {/* Burn Rate Card */}
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <h3 className="text-sm font-medium text-purple-500 mb-1">Ставка сжигания</h3>
          <p className="text-2xl font-bold text-purple-700">2%</p>
          <p className="text-xs text-purple-400">от каждой транзакции</p>
        </div>
      </div>

      {/* Burn Progress Visualization */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">Прогресс сжигания</span>
          <span className="text-sm font-medium">{burnPercentage.toFixed(2)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div 
            className="bg-red-600 h-4 rounded-full transition-all duration-500 ease-in-out" 
            style={{ width: `${Math.min(100, burnPercentage)}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>0 токенов</span>
          <span>{stats.totalSupply.toLocaleString('ru-RU')} токенов</span>
        </div>
      </div>

      {/* Fee Distribution Breakdown */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Распределение комиссий (2%)</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="mx-auto bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mb-2">
              <span className="text-red-600 font-bold">1%</span>
            </div>
            <p className="font-medium">Сжигание</p>
            <p className="text-sm text-gray-500">Уничтожается навсегда</p>
          </div>
          <div className="text-center">
            <div className="mx-auto bg-yellow-100 rounded-full w-16 h-16 flex items-center justify-center mb-2">
              <span className="text-yellow-600 font-bold">0.6%</span>
            </div>
            <p className="font-medium">Казна</p>
            <p className="text-sm text-gray-500">Развитие проекта</p>
          </div>
          <div className="text-center">
            <div className="mx-auto bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mb-2">
              <span className="text-green-600 font-bold">0.4%</span>
            </div>
            <p className="font-medium">Стейкинг</p>
            <p className="text-sm text-gray-500">Награды держателям</p>
          </div>
        </div>
      </div>

      {/* Recent Burn Activity */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Недавняя активность сжигания</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                <span className="font-medium">Транзакция #{1000 + i}</span>
              </div>
              <div className="text-right">
                <p className="font-semibold text-red-600">-{Math.floor(Math.random() * 100) + 10} NDT</p>
                <p className="text-xs text-gray-500">2 часа назад</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-2">Как работает дефляционная модель</h4>
        <p className="text-sm text-blue-700 mb-3">
          При каждой транзакции 2% от суммы уничтожаются, что уменьшает общее количество токенов в обращении и потенциально увеличивает ценность оставшихся токенов.
        </p>
        <button 
          onClick={fetchDeflationStats}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Обновить статистику
        </button>
      </div>
    </div>
  );
};

export default TokenEconomicsUI;