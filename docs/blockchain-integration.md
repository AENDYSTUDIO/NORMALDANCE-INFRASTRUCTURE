# 🔗 Интеграция с блокчейном NORMALDANCE

## Обзор блокчейн архитектуры

NORMALDANCE интегрируется с несколькими блокчейн сетями для обеспечения децентрализованного хранения контента, токеномики и транзакций. Основные сети: Solana (основная), TON (Telegram интеграция) и Ethereum (совместимость).

## Смарт-контракты

### 1. NDT Token Contract (Solana)

**Адрес контракта:** `NDT111111111111111111111111111111111111111111`

**Технологии:** Anchor Framework, Rust

#### Основные функции

```rust
// Инициализация токена с deflationary моделью
pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    let ndt = &mut ctx.accounts.ndt;
    ndt.authority = authority.key();
    ndt.total_supply = 0;
    ndt.burn_percentage = 2; // 2% сжигание
    ndt.staking_apr = 5; // 5% базовый APY
    ndt.staking_rewards_percentage = 20; // 20% от burn -> staking
    ndt.treasury_percentage = 30; // 30% от burn -> treasury
    Ok(())
}
```

#### Deflationary механизм

- **2% burn** на каждой транзакции
- **Распределение сожженных токенов:**
  - 20% → Staking rewards
  - 30% → Treasury (DAO)
  - 50% → Полное сжигание

#### Staking система

```rust
pub fn stake(ctx: Context<Stake>, amount: u64, lock_period: u64) -> Result<()> {
    // Тир система по объему стейкинга
    let tier_multiplier = get_tier_multiplier(total_staked);
    // Множитель по времени блокировки
    let time_multiplier = get_time_multiplier(lock_period);
    // Расчет APY: base_apr * tier_multiplier * time_multiplier
    let apr = calculate_apr(ndt.staking_apr, tier_multiplier, time_multiplier);
    Ok(())
}
```

**Тиры стейкинга:**

- Bronze: 500k+ NDT → 1.2x multiplier
- Silver: 5M+ NDT → 1.5x multiplier
- Gold: 50M+ NDT → 2x multiplier

**Периоды блокировки:**

- 3 месяца → 1.2x multiplier
- 6 месяцев → 1.5x multiplier
- 12 месяцев → 2x multiplier

### 2. Royalty Distribution Contract

**Назначение:** Автоматическое распределение роялти между правообладателями

#### Логика распределения

```rust
pub fn distribute_royalty(ctx: Context<DistributeRoyalty>, track_id: String, amount: u64) -> Result<()> {
    // 1. Определение долей
    let artist_share = 70;    // 70% артисту
    let platform_share = 20;  // 20% платформе
    let curator_share = 10;   // 10% куратору

    // 2. Расчет сумм
    let artist_amount = amount * artist_share / 100;
    let platform_amount = amount * platform_share / 100;
    let curator_amount = amount * curator_share / 100;

    // 3. Перевод средств
    transfer_to_artist(artist_amount)?;
    transfer_to_platform(platform_amount)?;
    transfer_to_curator(curator_amount)?;

    Ok(())
}
```

### 3. Track NFT Contract

**Стандарт:** SPL Token + Metaplex Metadata

#### Структура NFT

```rust
pub struct TrackNFT {
    pub mint: Pubkey,           // NFT mint address
    pub track_id: String,       // ID трека в базе данных
    pub artist: Pubkey,         // Адрес артиста
    pub royalty_percentage: u8, // Процент роялти
    pub total_supply: u64,      // Общий тираж
    pub metadata_uri: String,   // IPFS hash метаданных
}
```

#### Метаданные NFT

```json
{
  "name": "Midnight Dreams",
  "symbol": "NDT",
  "description": "Exclusive NFT for the track 'Midnight Dreams'",
  "image": "ipfs://Qm...",
  "animation_url": "ipfs://Qm...",
  "attributes": [
    {
      "trait_type": "Genre",
      "value": "Electronic"
    },
    {
      "trait_type": "BPM",
      "value": "128"
    },
    {
      "trait_type": "Duration",
      "value": "245"
    }
  ],
  "properties": {
    "royalty_percentage": 5,
    "streaming_rights": true,
    "commercial_rights": false
  }
}
```

### 4. Staking Contract

**Назначение:** Управление стейкингом токенов NDT

#### Функции контракта

- `stake(amount, lock_period)` - Стейкинг с блокировкой
- `unstake(amount)` - Вывод после истечения блокировки
- `claim_rewards()` - Получение накопленных rewards
- `delegate_stake(validator)` - Делегирование голоса

## Протоколы безопасности

### Multi-signature кошельки

```rust
pub struct MultiSigWallet {
    pub owners: Vec<Pubkey>,     // Список владельцев
    pub threshold: u8,           // Минимальное количество подписей
    pub nonce: u64,              // Номер транзакции
    pub pending_txs: Vec<Tx>,    // Ожидающие транзакции
}
```

**Использование:**

- Управление treasury
- Критические обновления контрактов
- Экстренные паузы системы

### Timelock контроллер

```rust
pub fn queue_transaction(target: Pubkey, value: u64, data: Vec<u8>, eta: u64) -> Result<()> {
    // Добавление транзакции в очередь с задержкой
    require!(eta >= block.timestamp + delay, "ETA too early");
    queued_txs[tx_id] = QueuedTx { target, value, data, eta };
    Ok(())
}

pub fn execute_transaction(tx_id: u64) -> Result<()> {
    let tx = queued_txs[tx_id];
    require!(block.timestamp >= tx.eta, "ETA not reached");
    // Выполнение транзакции
    Ok(())
}
```

**Задержки:**

- Критические изменения: 7 дней
- Обновления параметров: 3 дня
- Экстренные паузы: 1 час

### Audit trail

```rust
#[event]
pub struct SecurityEvent {
    pub event_type: SecurityEventType,
    pub actor: Pubkey,
    pub target: Pubkey,
    pub amount: Option<u64>,
    pub metadata: String,
    pub timestamp: i64,
}
```

## Механизмы консенсуса

### Solana Consensus

**Proof of Stake (PoS)** с Tower BFT

#### Валидаторы

- **Минимальный стейк:** 1 SOL
- **Количество валидаторов:** ~2000 активных
- **Время блока:** ~400ms
- **TPS:** до 65,000

#### Наша интеграция

```rust
// Подтверждение транзакций
pub fn confirm_transaction(signature: &str) -> Result<ConfirmationStatus> {
    let commitment_config = CommitmentConfig::confirmed();
    let status = rpc_client.get_signature_status_with_commitment(signature, commitment_config)?;

    match status {
        Some(SignatureStatus::Confirmed) => Ok(ConfirmationStatus::Confirmed),
        Some(SignatureStatus::Finalized) => Ok(ConfirmationStatus::Finalized),
        _ => Ok(ConfirmationStatus::Pending),
    }
}
```

### TON Consensus

**Proof of Stake** с Threaded Byzantine Fault Tolerance

#### Особенности

- **Время блока:** 5 секунд
- **Шардинг:** Динамическое разделение сети
- **TPS:** до 100,000
- **Стоимость:** ~$0.0001 per transaction

#### Telegram Mini App интеграция

```typescript
// TON Connect для Telegram
const tonConnect = new TonConnectSDK({
  manifestUrl: "https://normaldance.com/ton-manifest.json",
});

// Подключение кошелька
await tonConnect.connectWallet();

// Отправка платежа
const transaction = {
  validUntil: Date.now() + 1000000,
  messages: [
    {
      address: recipientAddress,
      amount: amount.toString(),
    },
  ],
};

await tonConnect.sendTransaction(transaction);
```

## Кросс-чейн интеграция

### Wormhole Bridge

**Протокол:** Wormhole v2

```rust
// Отправка токенов через мост
pub fn bridge_tokens(ctx: Context<BridgeTokens>, amount: u64, target_chain: u16) -> Result<()> {
    // 1. Lock токены на Solana
    lock_tokens(amount)?;

    // 2. Создание VAA (Verified Action Approval)
    let vaa = create_vaa(target_chain, amount, recipient)?;

    // 3. Отправка через Wormhole
    wormhole::post_vaa(vaa)?;

    Ok(())
}
```

### Поддерживаемые сети

1. **Solana** (основная)
2. **TON** (Telegram)
3. **Ethereum** (DeFi интеграция)
4. **BSC** (расширение аудитории)

## Экономическая модель

### Tokenomics NDT

- **Общий объем:** 1,000,000,000 NDT
- **Распределение:**
  - Community: 40%
  - Treasury: 30%
  - Team: 20%
  - Investors: 10%

### Deflationary давление

```rust
// Автоматическое сжигание
pub fn apply_deflation(amount: u64) -> u64 {
    let burn_amount = amount * BURN_PERCENTAGE / 100;
    let transfer_amount = amount - burn_amount;

    // Распределение burn
    let staking_rewards = burn_amount * STAKING_REWARDS_PERCENTAGE / 100;
    let treasury = burn_amount * TREASURY_PERCENTAGE / 100;
    let actual_burn = burn_amount - staking_rewards - treasury;

    // Сжигание токенов
    burn_tokens(actual_burn)?;

    transfer_amount
}
```

### Staking rewards

- **Базовый APY:** 5%
- **Максимальный APY:** 20% (Gold tier + 12 месяцев)
- **Распределение:** Еженедельно

## Мониторинг и аналитика

### On-chain метрики

```rust
pub struct BlockchainMetrics {
    pub total_transactions: u64,
    pub active_users: u64,
    pub total_value_locked: u64,
    pub burn_rate: f64,
    pub staking_ratio: f64,
}
```

### Alert системы

- **High priority:** Contract exploits, large transfers
- **Medium priority:** Failed transactions, high gas fees
- **Low priority:** Performance degradation, unusual patterns

## Аудит и безопасность

### Проведенные аудиты

1. **Certik** - Smart contract security audit (2024)
2. **OpenZeppelin** - Code review (2024)
3. **Trail of Bits** - Cryptographic assessment (2024)

### Bug bounty программа

- **Максимальная награда:** $100,000
- **Критерии:** Critical/High severity vulnerabilities
- **Платформа:** Immunefi

## Будущие улучшения

### Layer 2 решения

- **Solana SVM:** Для снижения комиссий
- **TON TVM:** Оптимизация для Mini Apps

### Cross-chain DEX

- **Jupiter aggregator:** Для Solana
- **TON DEX:** Нативная интеграция

### Governance

- **DAO структура:** On-chain голосование
- **Proposal system:** Snapshot integration

---

_Блокчейн интеграция NORMALDANCE обеспечивает децентрализацию, безопасность и экономическую устойчивость платформы._
