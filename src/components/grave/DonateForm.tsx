'use client'

import React, { useState } from 'react'

interface DonateFormProps {
  onDonate: (amount: number, message: string) => void
  onCancel: () => void
  isDonating: boolean
}

export default function DonateForm({ onDonate, onCancel, isDonating }: DonateFormProps) {
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const numAmount = parseFloat(amount)
    if (numAmount <= 0) {
      alert('Сумма должна быть больше 0')
      return
    }
    
    onDonate(numAmount, message)
  }

  const presetAmounts = [0.001, 0.01, 0.1, 0.5, 1.0]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">
          <span className="label-text">Сумма пожертвования (ETH)</span>
        </label>
        
        <div className="space-y-2">
          <input
            type="number"
            step="0.001"
            min="0.001"
            placeholder="0.001"
            className="input input-bordered w-full"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          
          <div className="flex flex-wrap gap-2">
            {presetAmounts.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(preset.toString())}
                className="btn btn-sm btn-outline"
              >
                {preset} ETH
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="label">
          <span className="label-text">Сообщение (необязательно)</span>
        </label>
        <textarea
          className="textarea textarea-bordered w-full"
          placeholder="Спасибо за музыку! 🎵"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
        />
      </div>

      <div className="bg-blue-50 p-3 rounded-lg">
        <div className="flex items-start gap-2">
          <div className="text-blue-500">ℹ️</div>
          <div className="text-sm text-blue-700">
            <p><strong>Как это работает:</strong></p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>2% идет на поддержку платформы</li>
              <li>98% поступает в мемориальный фонд</li>
              <li>Наследники получают доходы автоматически</li>
              <li>Все транзакции записываются в блокчейн</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="modal-action">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-ghost"
          disabled={isDonating}
        >
          Отмена
        </button>
        
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isDonating || !amount}
        >
          {isDonating ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Отправка...
            </>
          ) : (
            'Отправить пожертвование'
          )}
        </button>
      </div>
    </form>
  )
}
