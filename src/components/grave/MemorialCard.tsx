'use client'

import React, { useState } from 'react'
import DonateForm from './DonateForm'

interface Memorial {
  id: string
  artistName: string
  ipfsHash: string
  fundBalance: number
  heirs: string[]
  isActive: boolean
  createdAt: string
}

interface MemorialCardProps {
  memorial: Memorial
  onDonate: () => void
}

export default function MemorialCard({ memorial, onDonate }: MemorialCardProps) {
  const [showDonateForm, setShowDonateForm] = useState(false)
  const [isDonating, setIsDonating] = useState(false)

  const handleDonate = async (amount: number, message: string) => {
    setIsDonating(true)
    try {
      const response = await fetch('/api/grave/donations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memorialId: memorial.id,
          amount: amount,
          message: message
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setShowDonateForm(false)
        onDonate()
        // Показываем уведомление
        alert('Пожертвование отправлено! Спасибо за поддержку наследия.')
      } else {
        alert('Ошибка при отправке пожертвования: ' + data.error)
      }
    } catch (error) {
      console.error('Ошибка пожертвования:', error)
      alert('Ошибка при отправке пожертвования')
    } finally {
      setIsDonating(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatBalance = (balance: number) => {
    return `${balance.toFixed(4)} ETH`
  }

  return (
    <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300">
      <figure className="px-10 pt-10">
        <div className="w-full h-48 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
          <div className="text-6xl">🪦</div>
        </div>
      </figure>
      
      <div className="card-body items-center text-center">
        <h2 className="card-title text-2xl mb-2">{memorial.artistName}</h2>
        
        <div className="space-y-2 w-full">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Фонд:</span>
            <span className="font-bold text-green-600">
              {formatBalance(memorial.fundBalance)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Наследников:</span>
            <span className="font-bold">{memorial.heirs.length}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Создан:</span>
            <span className="text-sm">{formatDate(memorial.createdAt)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Статус:</span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${memorial.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm">{memorial.isActive ? 'Активен' : 'Неактивен'}</span>
            </div>
          </div>
        </div>
        
        <div className="card-actions justify-center mt-4 w-full">
          <button
            onClick={() => setShowDonateForm(true)}
            className="btn btn-primary flex-1"
            disabled={!memorial.isActive}
          >
            💰 Пожертвовать
          </button>
          
          <button
            onClick={() => window.open(`https://ipfs.io/ipfs/${memorial.ipfsHash}`, '_blank')}
            className="btn btn-secondary flex-1"
          >
            👁️ Посмотреть
          </button>
        </div>
        
        {memorial.heirs.length > 0 && (
          <div className="mt-4 p-3 bg-gray-100 rounded-lg w-full">
            <p className="text-xs text-gray-600 mb-2">Наследники:</p>
            <div className="flex flex-wrap gap-1">
              {memorial.heirs.map((heir, index) => (
                <span
                  key={index}
                  className="badge badge-outline text-xs"
                >
                  {heir.slice(0, 6)}...{heir.slice(-4)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно пожертвования */}
      {showDonateForm && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">
              Пожертвовать в мемориал {memorial.artistName}
            </h3>
            
            <DonateForm
              onDonate={handleDonate}
              onCancel={() => setShowDonateForm(false)}
              isDonating={isDonating}
            />
          </div>
        </div>
      )}
    </div>
  )
}
