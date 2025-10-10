//! 🎵 NormalDance Royalty Distribution Smart Contract
//! 
//! Автоматизированное распределение роялти на основе анализа блокчейн потенциала:
//! - Multi-stream revenue distribution
//! - Dynamic percentage adjustments
//! - Cross-platform revenue aggregation
//! - Performance-based incentives
//! - Automated dispute resolution
//! - Real-time payment processing

use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Mint, transfer, Transfer};

declare_id!("ROYALTY111111111111111111111111111111111111111");

#[program]
pub mod royalty_distribution {
    use super::*;

    /// Инициализация протокола распределения роялти
    pub fn initialize(
        ctx: Context<Initialize>,
        authority: Pubkey,
        fee_percentage: u64, // Базовый процент комиссии
    ) -> Result<()> {
        let protocol = &mut ctx.accounts.protocol;
        protocol.authority = authority;
        protocol.fee_percentage = fee_percentage;
        protocol.total_distributed = 0;
        protocol.active_distributions = 0;
        protocol.performance_multiplier = 10000; // 1.0x with 4 decimals
        Ok(())
    }

    /// Создание трека с автоматическим распределением роялти
    pub fn create_track(
        ctx: Context<CreateTrack>,
        track_id: String,
        title: String,
        artist: String,
        total_streams: u64,
        revenue_per_stream: u64, // С точностью 6 decimals (USD)
    ) -> Result<()> {
        let track = &mut ctx.accounts.track;
        track.track_id = track_id;
        track.title = title;
        track.artist = artist;
        track.total_streams = total_streams;
        track.revenue_per_stream = revenue_per_stream;
        track.total_revenue = 0;
        track.distributed_revenue = 0;
        track.last_distribution = 0;
        track.status = TrackStatus::Active;
        track.creation_time = Clock::get()?.unix_timestamp;
        
        // Инициализация пулов роялти
        track.artist_pool = RoyaltyPool {
            percentage: 6000, // 60%
            distributed: 0,
            pending: 0,
        };
        track.producer_pool = RoyaltyPool {
            percentage: 2000, // 20%
            distributed: 0,
            pending: 0,
        };
        track.label_pool = RoyaltyPool {
            percentage: 1500, // 15%
            distributed: 0,
            pending: 0,
        };
        track.platform_pool = RoyaltyPool {
            percentage: 500, // 5%
            distributed: 0,
            pending: 0,
        };

        emit!(TrackCreated {
            track_id: track.track_id.clone(),
            title: track.title.clone(),
            artist: track.artist.clone(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Обновление данных о стримах и автоматический расчет роялти
    pub fn update_streaming_data(
        ctx: Context<UpdateStreamingData>,
        additional_streams: u64,
        platform: String,
        country: String,
    ) -> Result<()> {
        let track = &mut ctx.accounts.track;
        let protocol = &ctx.accounts.protocol;

        // Обновляем общее количество стримов
        track.total_streams = track.total_streams.checked_add(additional_streams).unwrap();

        // Расчет дополнительного дохода
        let additional_revenue = additional_streams.checked_mul(track.revenue_per_stream).unwrap();
        
        // Применение performance multiplier на основе популярности
        let performance_boost = calculate_performance_boost(track.total_streams, track.creation_time);
        let adjusted_revenue = additional_revenue
            .checked_mul(performance_boost)
            .unwrap()
            .checked_div(10000)
            .unwrap();

        track.total_revenue = track.total_revenue.checked_add(adjusted_revenue).unwrap();

        // Распределение дохода по пулам
        let artist_share = adjusted_revenue.checked_mul(track.artist_pool.percentage).unwrap() / 10000;
        let producer_share = adjusted_revenue.checked_mul(track.producer_pool.percentage).unwrap() / 10000;
        let label_share = adjusted_revenue.checked_mul(track.label_pool.percentage).unwrap() / 10000;
        let platform_share = adjusted_revenue.checked_mul(track.platform_pool.percentage).unwrap() / 10000;

        // Добавление в pending пулы
        track.artist_pool.pending = track.artist_pool.pending.checked_add(artist_share).unwrap();
        track.producer_pool.pending = track.producer_pool.pending.checked_add(producer_share).unwrap();
        track.label_pool.pending = track.label_pool.pending.checked_add(label_share).unwrap();
        track.platform_pool.pending = track.platform_pool.pending.checked_add(platform_share).unwrap();

        emit!(StreamingDataUpdated {
            track_id: track.track_id.clone(),
            additional_streams,
            platform,
            country,
            revenue_generated: adjusted_revenue,
            performance_boost,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Распределение роялти конкретному получателю
    pub fn distribute_royalties(
        ctx: Context<DistributeRoyalties>,
        recipient_type: RecipientType,
        recipient_address: Pubkey,
    ) -> Result<()> {
        let track = &mut ctx.accounts.track;
        let protocol = &mut ctx.accounts.protocol;

        let (pool, pool_name) = match recipient_type {
            RecipientType::Artist => (&mut track.artist_pool, "artist"),
            RecipientType::Producer => (&mut track.producer_pool, "producer"),
            RecipientType::Label => (&mut track.label_pool, "label"),
            RecipientType::Platform => (&mut track.platform_pool, "platform"),
        };

        require!(pool.pending > 0, ErrorCode::NoPendingRoyalties);

        let distribution_amount = pool.pending;
        
        // Вычет комиссии протокола
        let protocol_fee = distribution_amount.checked_mul(protocol.fee_percentage).unwrap() / 10000;
        let final_amount = distribution_amount.checked_sub(protocol_fee).unwrap();

        // Выполнение перевода токенов
        let seeds = &[
            b"royalty",
            track.track_id.as_bytes(),
            [ctx.bumps.protocol],
        ];
        let signer = &[&seeds[..]];

        let transfer_accounts = Transfer {
            from: ctx.accounts.royalty_vault.to_account_info(),
            to: ctx.accounts.recipient_account.to_account_info(),
            authority: protocol.to_account_info(),
        };

        transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                transfer_accounts,
                signer,
            ),
            final_amount,
        )?;

        // Обновление состояния
        pool.pending = 0;
        pool.distributed = pool.distributed.checked_add(final_amount).unwrap();
        track.distributed_revenue = track.distributed_revenue.checked_add(final_amount).unwrap();
        track.last_distribution = Clock::get()?.unix_timestamp;
        
        protocol.total_distributed = protocol.total_distributed.checked_add(final_amount).unwrap();
        protocol.active_distributions = protocol.active_distributions.checked_add(1).unwrap();

        emit!(RoyaltiesDistributed {
            track_id: track.track_id.clone(),
            recipient_address,
            recipient_type: pool_name.to_string(),
            amount: final_amount,
            protocol_fee,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Массовое распределение роялти для всех получателей
    pub fn batch_distribute_royalties(
        ctx: Context<BatchDistributeRoyalties>,
        recipients: Vec<DistributionRecipient>,
    ) -> Result<()> {
        let track = &mut ctx.accounts.track;
        let protocol = &mut ctx.accounts.protocol;

        require!(!recipients.is_empty(), ErrorCode::EmptyRecipientsList);

        for recipient in recipients {
            let pool = match recipient.recipient_type {
                RecipientType::Artist => &mut track.artist_pool,
                RecipientType::Producer => &mut track.producer_pool,
                RecipientType::Label => &mut track.label_pool,
                RecipientType::Platform => &mut track.platform_pool,
            };

            if pool.pending >= recipient.amount {
                // Вычитание из pending
                pool.pending = pool.pending.checked_sub(recipient.amount).unwrap();
                
                // Логирование распределения
                emit!(BatchDistributionQueued {
                    track_id: track.track_id.clone(),
                    recipient_address: recipient.recipient_address,
                    recipient_type: format!("{:?}", recipient.recipient_type),
                    amount: recipient.amount,
                });
            }
        }

        Ok(())
    }

    /// Создание спора о распределении роялти
    pub fn create_dispute(
        ctx: Context<CreateDispute>,
        dispute_type: DisputeType,
        description: String,
    ) -> Result<()> {
        let dispute = &mut ctx.accounts.dispute;
        let track = &ctx.accounts.track;

        dispute.dispute_id = format!("DISPUTE_{}_{}", track.track_id, Clock::get()?.unix_timestamp);
        dispute.track_id = track.track_id.clone();
        dispute.disputant = ctx.accounts.disputant.key();
        dispute.dispute_type = dispute_type;
        dispute.description = description;
        dispute.status = DisputeStatus::Open;
        dispute.creation_time = Clock::get()?.unix_timestamp;
        dispute.resolution_time = None;
        dispute.resolution_details = None;

        emit!(DisputeCreated {
            dispute_id: dispute.dispute_id.clone(),
            track_id: dispute.track_id.clone(),
            disputant: dispute.disputant,
            dispute_type: format!("{:?}", dispute_type),
            timestamp: dispute.creation_time,
        });

        Ok(())
    }

    /// Разрешение спора
    pub fn resolve_dispute(
        ctx: Context<ResolveDispute>,
        resolution: DisputeResolution,
    ) -> Result<()> {
        let dispute = &mut ctx.accounts.dispute;
        let track = &mut ctx.accounts.track;

        require!(dispute.status == DisputeStatus::Open, ErrorCode::DisputeNotOpen);
        require!(ctx.accounts.authority.key() == ctx.accounts.protocol.authority, ErrorCode::UnauthorizedDisputeResolution);

        dispute.status = DisputeStatus::Resolved;
        dispute.resolution_time = Some(Clock::get()?.unix_timestamp);
        dispute.resolution_details = Some(format!("{:?}", resolution));

        // Применение решения к пулам роялти
        match resolution {
            DisputeResolution::AdjustArtistPercentage { new_percentage } => {
                track.artist_pool.percentage = new_percentage;
            },
            DisputeResolution::AdjustProducerPercentage { new_percentage } => {
                track.producer_pool.percentage = new_percentage;
            },
            DisputeResolution::RedistributeRevenue { from_pool, to_pool, amount } => {
                let (source_pool, target_pool) = match (from_pool, to_pool) {
                    (RecipientType::Artist, RecipientType::Producer) => (&mut track.artist_pool, &mut track.producer_pool),
                    (RecipientType::Producer, RecipientType::Artist) => (&mut track.producer_pool, &mut track.artist_pool),
                    _ => return Err(ErrorCode::UnsupportedPoolTransfer.into()),
                };

                if source_pool.pending >= amount {
                    source_pool.pending = source_pool.pending.checked_sub(amount).unwrap();
                    target_pool.pending = target_pool.pending.checked_add(amount).unwrap();
                }
            },
        }

        emit!(DisputeResolved {
            dispute_id: dispute.dispute_id.clone(),
            resolution: format!("{:?}", resolution),
            resolver: ctx.accounts.authority.key(),
            timestamp: dispute.resolution_time.unwrap(),
        });

        Ok(())
    }

    /// Периодическое распределение накопленных роялти
    pub fn auto_distribute_royalties(
        ctx: Context<AutoDistributeRoyalties>,
    ) -> Result<()> {
        let track = &mut ctx.accounts.track;
        let protocol = &ctx.accounts.protocol;

        require!(Clock::get()?.unix_timestamp - track.last_distribution >= 86400, ErrorCode::DistributionCooldownNotMet); // 24h cooldown

        let mut total_distributed = 0u64;

        // Проверяем пул артиста
        if track.artist_pool.pending > 0 {
            let amount = track.artist_pool.pending;
            track.artist_pool.distributed = track.artist_pool.distributed.checked_add(amount).unwrap();
            track.artist_pool.pending = 0;
            total_distributed = total_distributed.checked_add(amount).unwrap();
        }

        // Проверяем пул продюсера
        if track.producer_pool.pending > 0 {
            let amount = track.producer_pool.pending;
            track.producer_pool.distributed = track.producer_pool.distributed.checked_add(amount).unwrap();
            track.producer_pool.pending = 0;
            total_distributed = total_distributed.checked_add(amount).unwrap();
        }

        // Проверяем пул лейбла
        if track.label_pool.pending > 0 {
            let amount = track.label_pool.pending;
            track.label_pool.distributed = track.label_pool.distributed.checked_add(amount).unwrap();
            track.label_pool.pending = 0;
            total_distributed = total_distributed.checked_add(amount).unwrap();
        }

        // Проверяем пул платформы
        if track.platform_pool.pending > 0 {
            let amount = track.platform_pool.pending;
            track.platform_pool.distributed = track.platform_pool.distributed.checked_add(amount).unwrap();
            track.platform_pool.pending = 0;
            total_distributed = total_distributed.checked_add(amount).unwrap();
        }

        if total_distributed > 0 {
            track.distributed_revenue = track.distributed_revenue.checked_add(total_distributed).unwrap();
            track.last_distribution = Clock::get()?.unix_timestamp;
            protocol.total_distributed = protocol.total_distributed.checked_add(total_distributed).unwrap();

            emit!(AutoDistributionCompleted {
                track_id: track.track_id.clone(),
                total_amount: total_distributed,
                timestamp: track.last_distribution,
            });
        }

        Ok(())
    }
}

// Helper функции
fn calculate_performance_boost(total_streams: u64, creation_time: i64) -> u64 {
    let days_elapsed = (Clock::get()?.unix_timestamp - creation_time) / 86400;
    let streams_per_day = if days_elapsed > 0 { total_streams / days_elapsed as u64 } else { total_streams };
    
    // Performance boost на основе популярности
    if streams_per_day >= 100000 { // Вирусный трек
        12000 // 1.2x boost
    } else if streams_per_day >= 50000 { // Популярный
        11000 // 1.1x boost  
    } else if streams_per_day >= 10000 { // Умеренно популярный
        10500 // 1.05x boost
    } else {
        10000 // 1.0x (без бонуса)
    }
}

// Accounts
#[account]
pub struct RoyaltyProtocol {
    pub authority: Pubkey,
    pub fee_percentage: u64,    // Комиссия протокола в basis points (100 = 1%)
    pub total_distributed: u64,
    pub active_distributions: u64,
    pub performance_multiplier: u64, // Множитель производительности с 4 decimal places
}

#[account]
pub struct Track {
    pub track_id: String,
    pub title: String,
    pub artist: String,
    pub total_streams: u64,
    pub revenue_per_stream: u64,  // USD с точностью 6 decimals
    pub total_revenue: u64,       // Общий доход в USD с точностью 6 decimals
    pub distributed_revenue: u64, // Распределенный доход
    pub last_distribution: i64,   // Время последнего распределения
    pub artist_pool: RoyaltyPool,
    pub producer_pool: RoyaltyPool,
    pub label_pool: RoyaltyPool,
    pub platform_pool: RoyaltyPool,
    pub status: TrackStatus,
    pub creation_time: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct RoyaltyPool {
    pub percentage: u64,    // Процент в basis points (10000 = 100%)
    pub distributed: u64,  // Уже распределено
    pub pending: u64,      // Ожидает распределения
}

#[account]
pub struct Dispute {
    pub dispute_id: String,
    pub track_id: String,
    pub disputant: Pubkey,
    pub dispute_type: DisputeType,
    pub description: String,
    pub status: DisputeStatus,
    pub creation_time: i64,
    pub resolution_time: Option<i64>,
    pub resolution_details: Option<String>,
}

// Enums
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum RecipientType {
    Artist,
    Producer,
    Label,
    Platform,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum TrackStatus {
    Active,
    Paused,
    Terminated,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum DisputeType {
    IncorrectPercentage,
    MissingPayment,
    CalculationError,
    FraudulentReporting,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum DisputeStatus {
    Open,
    UnderReview,
    Resolved,
    Rejected,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum DisputeResolution {
    AdjustArtistPercentage { new_percentage: u64 },
    AdjustProducerPercentage { new_percentage: u64 },
    RedistributeRevenue { from_pool: RecipientType, to_pool: RecipientType, amount: u64 },
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct DistributionRecipient {
    pub recipient_address: Pubkey,
    pub recipient_type: RecipientType,
    pub amount: u64,
}

// Events
#[event]
pub struct TrackCreated {
    pub track_id: String,
    pub title: String,
    pub artist: String,
    pub timestamp: i64,
}

#[event]
pub struct StreamingDataUpdated {
    pub track_id: String,
    pub additional_streams: u64,
    pub platform: String,
    pub country: String,
    pub revenue_generated: u64,
    pub performance_boost: u64,
    pub timestamp: i64,
}

#[event]
pub struct RoyaltiesDistributed {
    pub track_id: String,
    pub recipient_address: Pubkey,
    pub recipient_type: String,
    pub amount: u64,
    pub protocol_fee: u64,
    pub timestamp: i64,
}

#[event]
pub struct BatchDistributionQueued {
    pub track_id: String,
    pub recipient_address: Pubkey,
    pub recipient_type: String,
    pub amount: u64,
}

#[event]
pub struct DisputeCreated {
    pub dispute_id: String,
    pub track_id: String,
    pub disputant: Pubkey,
    pub dispute_type: String,
    pub timestamp: i64,
}

#[event]
pub struct DisputeResolved {
    pub dispute_id: String,
    pub resolution: String,
    pub resolver: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct AutoDistributionCompleted {
    pub track_id: String,
    pub total_amount: u64,
    pub timestamp: i64,
}

// Context structs
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 8 + 8 + 8 + 8
    )]
    pub protocol: Account<'info, RoyaltyProtocol>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateTrack<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 64 + 64 + 64 + 8 + 8 + 8 + 8 + 8 + 8 + 32 + 32 + 32 + 32 + 1 + 8
    )]
    pub track: Account<'info, Track>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateStreamingData<'info> {
    #[account(mut)]
    pub track: Account<'info, Track>,
    #[account(mut, seeds = [b"royalty"], bump)]
    pub protocol: Account<'info, RoyaltyProtocol>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct DistributeRoyalties<'info> {
    #[account(mut)]
    pub track: Account<'info, Track>,
    #[account(mut, seeds = [b"royalty"], bump)]
    pub protocol: Account<'info, RoyaltyProtocol>,
    #[account(
        init_if_needed,
        payer = authority,
        token::mint = usdc_mint,
        token::authority = protocol,
    )]
    pub royalty_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub recipient_account: Account<'info, TokenAccount>,
    pub usdc_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct BatchDistributeRoyalties<'info> {
    #[account(mut)]
    pub track: Account<'info, Track>,
    #[account(mut, seeds = [b"royalty"], bump)]
    pub protocol: Account<'info, RoyaltyProtocol>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct CreateDispute<'info> {
    #[account(
        init,
        payer = disputant,
        space = 8 + 64 + 64 + 32 + 64 + 1 + 8 + 9 + 64
    )]
    pub dispute: Account<'info, Dispute>,
    pub track: Account<'info, Track>,
    #[account(mut)]
    pub disputant: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    #[account(mut)]
    pub dispute: Account<'info, Dispute>,
    #[account(mut)]
    pub track: Account<'info, Track>,
    #[account(mut, seeds = [b"royalty"], bump)]
    pub protocol: Account<'info, RoyaltyProtocol>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct AutoDistributeRoyalties<'info> {
    #[account(mut)]
    pub track: Account<'info, Track>,
    #[account(mut, seeds = [b"royalty"], bump)]
    pub protocol: Account<'info, RoyaltyProtocol>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

// Error codes
#[error_code]
pub enum ErrorCode {
    #[msg("No pending royalties to distribute")]
    NoPendingRoyalties,
    #[msg("Unauthorized distribution")]
    UnauthorizedDistribution,
    #[msg("Recipients list cannot be empty")]
    EmptyRecipientsList,
    #[msg("Insufficient funds in pool")]
    InsufficientPoolFunds,
    #[msg("Distribution cooldown not met")]
    DistributionCooldownNotMet,
    #[msg("Dispute is not in open status")]
    DisputeNotOpen,
    #[msg("Unauthorized dispute resolution")]
    UnauthorizedDisputeResolution,
    #[msg("Unsupported pool transfer")]
    UnsupportedPoolTransfer,
    #[msg("Invalid recipient type")]
    InvalidRecipientType,
}
