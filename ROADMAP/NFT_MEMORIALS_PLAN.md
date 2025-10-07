# План улучшения системы NFT memorials

## Обзор

В этом документе описывается план улучшения системы NFT memorials для проекта NormalDance. Это улучшение имеет высокий приоритет для Q2 2025 года, так как реализует уникальную функцию платформы - создание NFT-мемориалов для Digital Cemetery.

## Текущая ситуация

### Существующая реализация

- Базовая концепция Digital Cemetery
- Ограниченная функциональность NFT
- Отсутствие системы мемориалов
- Нет интеграции с NFT-мемориалами

### Проблемы текущей реализации

- Отсутствие полноценной системы NFT memorials
- Нет возможности создания персонализированных мемориалов
- Нет интеграции с основной системой NFT
- Ограниченные возможности кастомизации

## Цели реализации

### Основные цели

- Создание полнофункциональной системы NFT memorials
- Интеграция с Digital Cemetery
- Возможность минтинга и управления мемориалами
- Уникальная функция платформы

### Технические цели

- Разработка смарт-контракта для NFT memorials
- Создание интерфейса для создания мемориалов
- Реализация системы управления
- Интеграция с системой Digital Cemetery

## План реализации

### Этап 1: Подготовка (Неделя 1-2)

- Анализ требований к NFT memorials
- Создание архитектуры смарт-контрактов
- Подготовка тестовой среды
- Проектирование UX интерфейса

### Этап 2: Разработка смарт-контрактов (Неделя 3-5)

- Разработка основного контракта для NFT memorials
- Реализация логики минтинга
- Реализация управления метаданными
- Тестирование смарт-контрактов

### Этап 3: Разработка интерфейса (Неделя 6-8)

- Создание интерфейса для создания мемориалов
- Реализация редактора персонализированных мемориалов
- Интеграция с кошельками
- Реализация системы управления

### Этап 4: Интеграция и тестирование (Неделя 9-10)

- Интеграция с Digital Cemetery
- Тестирование полного пользовательского пути
- Тестирование безопасности
- Подготовка к внедрению

### Этап 5: Внедрение (Неделя 11)

- Внедрение в продакшн
- Мониторинг после запуска
- Обновление документации

## Технические детали

### Архитектура смарт-контрактов

#### Основной контракт для NFT memorials

```rust
// programs/nft-memorials/src/lib.rs
use anchor_lang::prelude::*;
use anchor_spl::{
    token::{Token, Mint, TokenAccount},
    metadata::{Metadata, MetadataProgram},
};

declare_id!("..."); // Program ID

#[program]
pub mod nft_memorials {
    use super::*;

    pub fn create_memorial(
        ctx: Context<CreateMemorial>,
        memorial_id: String,
        metadata: MemorialMetadata,
    ) -> Result<()> {
        let memorial = &mut ctx.accounts.memorial;
        memorial.id = memorial_id;
        memorial.owner = ctx.accounts.owner.key();
        memorial.metadata = metadata;
        memorial.created_at = Clock::get()?.unix_timestamp;

        emit!(MemorialCreated {
            memorial_id: memorial.id.clone(),
            owner: memorial.owner,
        });

        Ok(())
    }

    pub fn update_memorial(
        ctx: Context<UpdateMemorial>,
        metadata: MemorialMetadata,
    ) -> Result<()> {
        let memorial = &mut ctx.accounts.memorial;
        memorial.metadata = metadata;
        memorial.updated_at = Some(Clock::get()?.unix_timestamp);

        emit!(MemorialUpdated {
            memorial_id: memorial.id.clone(),
        });

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(memorial_id: String)]
pub struct CreateMemorial<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + 32 + 200 + 8 + 8, // discriminator + owner + metadata + timestamps
        seeds = [b"memorial", owner.key().as_ref(), memorial_id.as_bytes()],
        bump
    )]
    pub memorial: Account<'info, Memorial>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateMemorial<'info> {
    #[account(
        mut,
        has_one = owner,
        seeds = [b"memorial", owner.key().as_ref(), memorial.id.as_bytes()],
        bump
    )]
    pub memorial: Account<'info, Memorial>,
    #[account(mut)]
    pub owner: Signer<'info>,
}

#[account]
pub struct Memorial {
    pub id: String,
    pub owner: Pubkey,
    pub metadata: MemorialMetadata,
    pub created_at: i64,
    pub updated_at: Option<i64>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct MemorialMetadata {
    pub name: String,
    pub description: String,
    pub image_url: String,
    pub attributes: Vec<Attribute>,
    pub dedication: String,
    pub memories: Vec<String>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Attribute {
    pub trait_type: String,
    pub value: String,
}
```

### Интерфейс создания мемориалов

#### Компонент создания мемориала

```tsx
// src/components/MemorialCreator.tsx
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { createMemorial } from "@/lib/nft-memorials";

const MemorialCreator = () => {
  const { connected, publicKey } = useWallet();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    dedication: "",
    memories: [""],
    attributes: [{ trait_type: "", value: "" }],
  });
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateMemorial = async () => {
    if (!connected || !publicKey) {
      alert("Пожалуйста, подключите кошелек");
      return;
    }

    setIsCreating(true);

    try {
      const memorialId = await createMemorial({
        ...formData,
        owner: publicKey.toBase58(),
      });

      alert(`Мемориал успешно создан: ${memorialId}`);
      // Сброс формы
      setFormData({
        name: "",
        description: "",
        dedication: "",
        memories: [""],
        attributes: [{ trait_type: "", value: "" }],
      });
    } catch (error) {
      console.error("Ошибка создания мемориала:", error);
      alert("Ошибка при создании мемориала");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="memorial-creator">
      <h2>Создать NFT-мемориал</h2>

      <div className="form-group">
        <label>Имя мемориала</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label>Описание</label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />
      </div>

      <div className="form-group">
        <label>Посвящение</label>
        <input
          type="text"
          value={formData.dedication}
          onChange={(e) =>
            setFormData({ ...formData, dedication: e.target.value })
          }
        />
      </div>

      <div className="form-group">
        <label>Воспоминания</label>
        {formData.memories.map((memory, index) => (
          <textarea
            key={index}
            value={memory}
            onChange={(e) => {
              const newMemories = [...formData.memories];
              newMemories[index] = e.target.value;
              setFormData({ ...formData, memories: newMemories });
            }}
          />
        ))}
        <button
          type="button"
          onClick={() =>
            setFormData({
              ...formData,
              memories: [...formData.memories, ""],
            })
          }
        >
          Добавить воспоминание
        </button>
      </div>

      <button
        onClick={handleCreateMemorial}
        disabled={isCreating || !connected}
      >
        {isCreating ? "Создание..." : "Создать мемориал"}
      </button>
    </div>
  );
};
```

### Интеграция с Digital Cemetery

#### Отображение мемориалов в Digital Cemetery

```tsx
// src/components/DigitalCemetery.tsx
import { useEffect, useState } from "react";
import { getMemorials } from "@/lib/nft-memorials";

const DigitalCemetery = () => {
  const [memorials, setMemorials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMemorials = async () => {
      try {
        const data = await getMemorials();
        setMemorials(data);
      } catch (error) {
        console.error("Ошибка загрузки мемориалов:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMemorials();
  }, []);

  if (loading) {
    return <div>Загрузка мемориалов...</div>;
  }

  return (
    <div className="digital-cemetery">
      <h2>Digital Cemetery</h2>
      <div className="memorials-grid">
        {memorials.map((memorial) => (
          <div key={memorial.id} className="memorial-card">
            <img
              src={memorial.metadata.image_url}
              alt={memorial.metadata.name}
            />
            <h3>{memorial.metadata.name}</h3>
            <p>{memorial.metadata.dedication}</p>
            <div className="memories">
              {memorial.metadata.memories.slice(0, 3).map((memory, idx) => (
                <p key={idx} className="memory-preview">
                  {memory}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Управление мемориалами

#### Компонент управления мемориалом

```tsx
// src/components/MemorialManager.tsx
import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { getOwnerMemorials, updateMemorial } from "@/lib/nft-memorials";

const MemorialManager = () => {
  const { publicKey } = useWallet();
  const [memorials, setMemorials] = useState([]);
  const [editingMemorial, setEditingMemorial] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMemorials = async () => {
      if (!publicKey) return;

      try {
        const data = await getOwnerMemorials(publicKey.toBase58());
        setMemorials(data);
      } catch (error) {
        console.error("Ошибка загрузки мемориалов:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMemorials();
  }, [publicKey]);

  const handleUpdateMemorial = async (updatedData) => {
    try {
      await updateMemorial(editingMemorial.id, updatedData);
      setEditingMemorial(null);
      // Обновить список мемориалов
      const updatedList = await getOwnerMemorials(publicKey.toBase58());
      setMemorials(updatedList);
    } catch (error) {
      console.error("Ошибка обновления мемориала:", error);
      alert("Ошибка при обновлении мемориала");
    }
  };

  if (loading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="memorial-manager">
      <h2>Управление мемориалами</h2>

      {memorials.map((memorial) => (
        <div key={memorial.id} className="memorial-item">
          <h3>{memorial.metadata.name}</h3>
          <p>{memorial.metadata.description}</p>

          {editingMemorial?.id === memorial.id ? (
            <MemorialEditor
              memorial={editingMemorial}
              onSave={handleUpdateMemorial}
              onCancel={() => setEditingMemorial(null)}
            />
          ) : (
            <button onClick={() => setEditingMemorial(memorial)}>
              Редактировать
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
```

## Риски и меры по их снижению

### Риск 1: Проблемы с безопасностью смарт-контрактов

- **Мера**: Тщательное тестирование смарт-контрактов
- **Мера**: Аудит безопасности

### Риск 2: Низкий интерес пользователей

- **Мера**: Исследование целевой аудитории
- **Мера**: A/B тестирование UX

### Риск 3: Проблемы с масштабированием

- **Мера**: Оптимизация смарт-контрактов
- **Мера**: Эффективное хранение метаданных

## Критерии успеха

- Успешная реализация NFT-мемориалов
- Интеграция с Digital Cemetery
- Удовлетворенность пользователей
- Уникальность функции платформы
- Безопасность и надежность

## Ресурсы

- 2-3 разработчика на 11 недель
- Web3-специалист
- QA-инженер для тестирования

## Сроки

- Начало: 1 марта 2025
- Завершение: 10 мая 2025
- Общее время: 11 недель
