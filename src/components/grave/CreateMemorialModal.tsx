'use client'

import React, { useState } from 'react'

interface CreateMemorialModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function CreateMemorialModal({ onClose, onSuccess }: CreateMemorialModalProps) {
  const [formData, setFormData] = useState({
    artistName: '',
    ipfsHash: '',
    heirs: [''],
    message: ''
  })
  const [isCreating, setIsCreating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.artistName || !formData.ipfsHash) {
      alert('Заполните обязательные поля')
      return
    }

    setIsCreating(true)
    
    try {
      const response = await fetch('/api/grave/memorials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artistName: formData.artistName,
          ipfsHash: formData.ipfsHash,
          heirs: formData.heirs.filter(heir => heir.trim() !== ''),
          message: formData.message
        })
      })

      const data = await response.json()
      
      if (data.success) {
        onSuccess()
        alert('Мемориал создан успешно! 🪦')
      } else {
        alert('Ошибка при создании мемориала: ' + data.error)
      }
    } catch (error) {
      console.error('Ошибка создания мемориала:', error)
      alert('Ошибка при создании мемориала')
    } finally {
      setIsCreating(false)
    }
  }

  const addHeir = () => {
    setFormData(prev => ({
      ...prev,
      heirs: [...prev.heirs, '']
    }))
  }

  const removeHeir = (index: number) => {
    setFormData(prev => ({
      ...prev,
      heirs: prev.heirs.filter((_, i) => i !== index)
    }))
  }

  const updateHeir = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      heirs: prev.heirs.map((heir, i) => i === index ? value : heir)
    }))
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-2xl mb-6">
          🪦 Создать цифровой мемориал
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="label">
              <span className="label-text font-semibold">Имя артиста *</span>
            </label>
            <input
              type="text"
              placeholder="DJ Eternal, Producer Ghost..."
              className="input input-bordered w-full"
              value={formData.artistName}
              onChange={(e) => setFormData(prev => ({ ...prev, artistName: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="label">
              <span className="label-text font-semibold">IPFS Hash *</span>
            </label>
            <input
              type="text"
              placeholder="QmYourIPFSHash123..."
              className="input input-bordered w-full"
              value={formData.ipfsHash}
              onChange={(e) => setFormData(prev => ({ ...prev, ipfsHash: e.target.value }))}
              required
            />
            <div className="label">
              <span className="label-text-alt">
                Содержит: аудио, фото, биографию артиста
              </span>
            </div>
          </div>

          <div>
            <label className="label">
              <span className="label-text font-semibold">Наследники (получатели доходов)</span>
            </label>
            
            <div className="space-y-2">
              {formData.heirs.map((heir, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="0x123...abc"
                    className="input input-bordered flex-1"
                    value={heir}
                    onChange={(e) => updateHeir(index, e.target.value)}
                  />
                  {formData.heirs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeHeir(index)}
                      className="btn btn-error btn-sm"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              
              <button
                type="button"
                onClick={addHeir}
                className="btn btn-outline btn-sm"
              >
                + Добавить наследника
              </button>
            </div>
            
            <div className="label">
              <span className="label-text-alt">
                Адреса кошельков, которые будут получать доходы от мемориала
              </span>
            </div>
          </div>

          <div>
            <label className="label">
              <span className="label-text font-semibold">Сообщение</span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full"
              placeholder="Память о легендарном артисте..."
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <div className="text-yellow-500">⚠️</div>
              <div className="text-sm text-yellow-700">
                <p><strong>Важно:</strong></p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Мемориал создается навсегда в блокчейне</li>
                  <li>IPFS hash должен содержать все материалы</li>
                  <li>Наследники получают 98% от пожертвований</li>
                  <li>2% идет на поддержку платформы</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="modal-action">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
              disabled={isCreating}
            >
              Отмена
            </button>
            
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isCreating || !formData.artistName || !formData.ipfsHash}
            >
              {isCreating ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Создание...
                </>
              ) : (
                'Создать мемориал'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
