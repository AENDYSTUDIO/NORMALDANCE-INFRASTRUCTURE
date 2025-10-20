use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use std::str::FromStr;

declare_id!("NDT111111111111111111111111111111111111111111");

#[program]
pub mod ndt {
    use super::*;

    // Инициализация токена NDT
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let ndt = &mut ctx.accounts.ndt;
        let authority = &ctx.accounts.authority;
        
        ndt.authority = authority.key();
        ndt.total_supply = 0;
        ndt.burn_percentage = 2; // 2% сжигание при транзакциях
        ndt.staking_apr = 5; // 5% базовый APY для стейкинга
        ndt.staking_rewards_percentage = 20; // 20% от сжигания идет на стейкинг rewards
        ndt.treasury_percentage = 30; // 30% от сжигания идет в казну
        
        Ok(())
    }

    // Минт токенов (для начального распределения)
    pub fn mint(ctx: Context<MintTokens>, amount: u64) -> Result<()> {
        let ndt = &mut ctx.accounts.ndt;
        let mint_account = &ctx.accounts.mint;
        let authority = &ctx.accounts.authority;
        
        require!(authority.key() == ndt.authority, ErrorCode::Unauthorized);
        
        // Увеличиваем общий объем
        ndt.total_supply = ndt.total_supply.checked_add(amount).unwrap();
        
        // Создаем токены
        let seeds = &[b"ndt".as_ref(), &[ctx.bumps.ndt]];
        let signer = &[&seeds[..]];
        
        anchor_spl::token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::MintTo {
                    mint: mint_account.to_account_info(),
                    to: ctx.accounts.destination.to_account_info(),
                    authority: ndt.to_account_info(),
                },
            ),
            signer,
            amount,
        )?;
        
        Ok(())
    }

    // Транзакция с автоматическим сжиганием и распределением
    pub fn transfer(ctx: Context<Transfer>, amount: u64) -> Result<()> {
        let ndt = &mut ctx.accounts.ndt;
        let from = &ctx.accounts.from;
        let to = &ctx.accounts.to;
        let authority = &ctx.accounts.authority;
        
        // Рассчитываем количество для сжигания (2% от суммы)
        let burn_amount = amount.checked_mul(ndt.burn_percentage).unwrap() / 100;
        let transfer_amount = amount.checked_sub(burn_amount).unwrap();
        
        // Рассчитываем распределение сожженных токенов
        let staking_rewards_amount = burn_amount.checked_mul(ndt.staking_rewards_percentage).unwrap() / 100;
        let treasury_amount = burn_amount.checked_mul(ndt.treasury_percentage).unwrap() / 100;
        // Оставшаяся часть идет на сжигание (могут быть небольшие расхождения из-за округления)
        let actual_burn_amount = burn_amount.checked_sub(staking_rewards_amount).unwrap().checked_sub(treasury_amount).unwrap();
        
        // Переводим токены
        anchor_spl::token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::Transfer {
                    from: from.to_account_info(),
                    to: to.to_account_info(),
                    authority: authority.to_account_info(),
                },
            ),
            transfer_amount,
        )?;
        
        // Сжигаем токены
        anchor_spl::token::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::Burn {
                    mint: ctx.accounts.mint.to_account_info(),
                    from: from.to_account_info(),
                    authority: authority.to_account_info(),
                },
            ),
            actual_burn_amount,
        )?;
        
        // Обновляем общий объем
        ndt.total_supply = ndt.total_supply.checked_sub(actual_burn_amount).unwrap();
        
        emit!(TransferEvent {
            from: from.key(),
            to: to.key(),
            amount: transfer_amount,
            burn_amount: actual_burn_amount,
            staking_rewards_amount,
            treasury_amount,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }

    // Стейкинг токенов
    pub fn stake(ctx: Context<Stake>, amount: u64, lock_period: u64) -> Result<()> {
        let ndt = &mut ctx.accounts.ndt;
        let staker = &ctx.accounts.staker;
        let staking_account = &mut ctx.accounts.staking_account;
        let authority = &ctx.accounts.authority;
        
        // Переводим токены на стейкинг
        anchor_spl::token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::Transfer {
                    from: staker.to_account_info(),
                    to: staking_account.to_account_info(),
                    authority: authority.to_account_info(),
                },
            ),
            amount,
        )?;
        
        // Обновляем стейкинг аккаунт
        staking_account.amount = staking_account.amount.checked_add(amount).unwrap();
        staking_account.lock_period = lock_period;
        staking_account.stake_time = Clock::get()?.unix_timestamp;
        
        // Рассчитываем rewards на основе уровня и срока
        let tier_multiplier = get_tier_multiplier(staking_account.total_staked);
        let time_multiplier = get_time_multiplier(lock_period);
        let apr = ndt.staking_apr.checked_mul(tier_multiplier).unwrap() / 100;
        let apr = apr.checked_mul(time_multiplier).unwrap() / 100;
        
        staking_account.apr = apr;
        staking_account.last_claim_time = Clock::get()?.unix_timestamp;
        
        emit!(StakeEvent {
            staker: staker.key(),
            amount,
            lock_period,
            apr,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }

    // Unstaking токенов
    pub fn unstake(ctx: Context<Unstake>, amount: u64) -> Result<()> {
        let ndt = &mut ctx.accounts.ndt;
        let staker = &ctx.accounts.staker;
        let staking_account = &mut ctx.accounts.staking_account;
        let authority = &ctx.accounts.authority;
        
        require!(staking_account.amount >= amount, ErrorCode::InsufficientFunds);
        
        // Проверяем, истек ли период блокировки
        let current_time = Clock::get()?.unix_timestamp;
        require!(
            current_time >= staking_account.stake_time + staking_account.lock_period,
            ErrorCode::LockPeriodNotExpired
        );
        
        // Возвращаем токены
        anchor_spl::token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::Transfer {
                    from: staking_account.to_account_info(),
                    to: staker.to_account_info(),
                    authority: authority.to_account_info(),
                },
            ),
            amount,
        )?;
        
        // Обновляем стейкинг аккаунт
        staking_account.amount = staking_account.amount.checked_sub(amount).unwrap();
        
        emit!(UnstakeEvent {
            staker: staker.key(),
            amount,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }

    // Claim rewards
    pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
        let ndt = &mut ctx.accounts.ndt;
        let staker = &ctx.accounts.staker;
        let staking_account = &mut ctx.accounts.staking_account;
        let rewards_account = &mut ctx.accounts.rewards_account;
        let authority = &ctx.accounts.authority;
        
        let current_time = Clock::get()?.unix_timestamp;
        let time_elapsed = current_time.checked_sub(staking_account.last_claim_time).unwrap();
        
        // Рассчитываем накопленные rewards
        let rewards = staking_account.amount
            .checked_mul(staking_account.apr as u64)
            .unwrap()
            .checked_mul(time_elapsed)
            .unwrap()
            .checked_div(365 * 24 * 60 * 60) // Год в секундах
            .unwrap()
            .checked_div(100) // APR в процентах
            .unwrap();
        
        require!(rewards > 0, ErrorCode::NoRewardsToClaim);
        
        // Выпускаем новые токены как rewards
        let seeds = &[b"ndt".as_ref(), &[ctx.bumps.ndt]];
        let signer = &[&seeds[..]];
        
        anchor_spl::token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: rewards_account.to_account_info(),
                    authority: ndt.to_account_info(),
                },
            ),
            signer,
            rewards,
        )?;
        
        // Обновляем время последнего claim
        staking_account.last_claim_time = current_time;
        
        emit!(ClaimRewardsEvent {
            staker: staker.key(),
            rewards,
            timestamp: current_time,
        });
        
        Ok(())
    }
}

// Helper функции
fn get_tier_multiplier(total_staked: u64) -> u64 {
    if total_staked >= 50_000_000 { // Gold tier
        200 // 2x multiplier
    } else if total_staked >= 5_000_000 { // Silver tier
        150 // 1.5x multiplier
    } else if total_staked >= 500_000 { // Bronze tier
        120 // 1.2x multiplier
    } else {
        100 // 1x multiplier
    }
}

fn get_time_multiplier(lock_period: u64) -> u64 {
    if lock_period >= 365 * 24 * 60 * 60 { // 12 месяцев
        200 // 2x multiplier
    } else if lock_period >= 180 * 24 * 60 * 60 { // 6 месяцев
        150 // 1.5x multiplier
    } else if lock_period >= 90 * 24 * 60 * 60 { // 3 месяца
        120 // 1.2x multiplier
    } else {
        100 // 1x multiplier
    }
}

// Accounts
#[account]
pub struct NdtState {
    pub authority: Pubkey,
    pub total_supply: u64,
    pub burn_percentage: u64, // Percentage of tokens burned per transaction
    pub staking_apr: u64,    // Base APR for staking
    pub staking_rewards_percentage: u64, // Percentage of burned tokens for staking rewards
    pub treasury_percentage: u64,       // Percentage of burned tokens for treasury
}

#[account]
pub struct StakingAccount {
    pub staker: Pubkey,
    pub amount: u64,
    pub lock_period: u64,    // Lock period in seconds
    pub stake_time: i64,      // Unix timestamp when staked
    pub last_claim_time: i64,
    pub apr: u64,            // Current APR
    pub total_staked: u64,   // Total staked by this user
}

// Events
#[event]
pub struct TransferEvent {
    pub from: Pubkey,
    pub to: Pubkey,
    pub amount: u64,
    pub burn_amount: u64,
    pub staking_rewards_amount: u64,
    pub treasury_amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct StakeEvent {
    pub staker: Pubkey,
    pub amount: u64,
    pub lock_period: u64,
    pub apr: u64,
    pub timestamp: i64,
}

#[event]
pub struct UnstakeEvent {
    pub staker: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct ClaimRewardsEvent {
    pub staker: Pubkey,
    pub rewards: u64,
    pub timestamp: i64,
}

// Contexts
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, seeds = [b"ndt"], bump)]
    pub ndt: Account<'info, NdtState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(mut, seeds = [b"ndt"], bump)]
    pub ndt: Account<'info, NdtState>,
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub destination: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Transfer<'info> {
    #[account(mut, seeds = [b"ndt"], bump)]
    pub ndt: Account<'info, NdtState>,
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub from: Account<'info, TokenAccount>,
    #[account(mut)]
    pub to: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut, seeds = [b"ndt"], bump)]
    pub ndt: Account<'info, NdtState>,
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub staker: Account<'info, TokenAccount>,
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 8 + 8 + 8 + 8 + 8 + 8,
        seeds = [b"staking", staker.key().as_ref()],
        bump
    )]
    pub staking_account: Account<'info, StakingAccount>,
    #[account(mut)]
    pub rewards_account: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(mut, seeds = [b"ndt"], bump)]
    pub ndt: Account<'info, NdtState>,
    #[account(mut)]
    pub staker: Account<'info, TokenAccount>,
    #[account(mut, seeds = [b"staking", staker.key().as_ref()], bump)]
    pub staking_account: Account<'info, StakingAccount>,
    #[account(mut)]
    pub rewards_account: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(mut, seeds = [b"ndt"], bump)]
    pub ndt: Account<'info, NdtState>,
    #[account(mut)]
    pub staker: Account<'info, TokenAccount>,
    #[account(mut, seeds = [b"staking", staker.key().as_ref()], bump)]
    pub staking_account: Account<'info, StakingAccount>,
    #[account(mut)]
    pub rewards_account: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

// Error codes
#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Insufficient funds")]
    InsufficientFunds,
    #[msg("Lock period has not expired")]
    LockPeriodNotExpired,
    #[msg("No rewards to claim")]
    NoRewardsToClaim,
}