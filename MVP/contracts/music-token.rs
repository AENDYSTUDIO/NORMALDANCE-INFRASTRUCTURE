// Music Token SPL Contract
// Normal Dance Music Token (NDT)

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, MintTo, Transfer};

declare_id!("NDTToken111111111111111111111111111111111");

#[program]
pub mod music_token {
    use super::*;

    pub fn initialize_music_token(
        ctx: Context<InitializeMusicToken>,
        token_name: String,
        token_symbol: String,
        token_decimals: u8,
        total_supply: u64,
    ) -> Result<()> {
        let token_mint = &ctx.accounts.token_mint;
        let authority = &ctx.accounts.authority;

        // Initialize mint with custom metadata
        let cpi_accounts = MintTo {
            mint: token_mint.to_account_info(),
            to: ctx.accounts.token_vault.to_account_info(),
            authority: authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        
        token::mint_to(cpi_ctx, total_supply * 10_u64.pow(token_decimals as u32))?;

        // Store token metadata
        let metadata = &mut ctx.accounts.token_metadata;
        metadata.name = token_name;
        metadata.symbol = token_symbol;
        metadata.decimals = token_decimals;
        metadata.total_supply = total_supply;
        metadata.created_at = Clock::get()?.unix_timestamp;

        emit!(TokenCreated {
            mint: token_mint.key(),
            name: token_name,
            symbol: token_symbol,
            total_supply,
        });

        Ok(())
    }

    pub fn reward_listeners(
        ctx: Context<RewardListeners>,
        track_id: String,
        listener: Pubkey,
        amount: u64,
    ) -> Result<()> {
        let metadata = &mut ctx.accounts.token_metadata;
        let track_rewards = &mut ctx.accounts.track_rewards;

        // Update track reward pool
        track_rewards.track_id = track_id.clone();
        track_rewards.total_rewards += amount;
        track_rewards.listener_count += 1;

        // Transfer reward tokens to listener
        let cpi_accounts = Transfer {
            from: ctx.accounts.reward_vault.to_account_info(),
            to: ctx.accounts.listener_token_account.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        
        token::transfer(cpi_ctx, amount)?;

        emit!(ListenerRewarded {
            track_id,
            listener,
            amount,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    pub fn stake_tokens(
        ctx: Context<StakeTokens>,
        amount: u64,
        duration: i64, // staking duration in seconds
    ) -> Result<()> {
        let staking_account = &mut ctx.accounts.staking_account;
        
        staking_account.user = ctx.accounts.user.key();
        staking_account.amount = amount;
        staking_account.staked_at = Clock::get()?.unix_timestamp;
        staking_account.duration = duration;
        staking_account.active = true;

        // Transfer tokens to staking vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.staking_vault.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        
        token::transfer(cpi_ctx, amount)?;

        emit!(TokensStaked {
            user: ctx.accounts.user.key(),
            amount,
            duration,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeMusicToken<'info> {
    #[account(init, payer = authority, mint::decimals = 9, mint::authority = authority)]
    pub token_mint: Account<'info, Mint>,
    
    #[account(init, payer = authority, token::mint = token_mint, token::authority = authority)]
    pub token_vault: Account<'info, TokenAccount>,
    
    #[account(init, payer = authority, space = 8 + 64)]
    pub token_metadata: Account<'info, TokenMetadata>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct RewardListeners<'info> {
    #[account(mut)]
    pub reward_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub listener_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub track_rewards: Account<'info, TrackRewards>,
    
    #[account(mut)]
    pub token_metadata: Account<'info, TokenMetadata>,
    
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct StakeTokens<'info> {
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub staking_vault: Account<'info, TokenAccount>,
    
    #[account(init, payer = user, space = 8 + 64)]
    pub staking_account: Account<'info, StakingAccount>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct TokenMetadata {
    pub name: String,
    pub symbol: String,
    pub decimals: u8,
    pub total_supply: u64,
    pub created_at: i64,
}

#[account]
pub struct TrackRewards {
    pub track_id: String,
    pub total_rewards: u64,
    pub listener_count: u64,
}

#[account]
pub struct StakingAccount {
    pub user: Pubkey,
    pub amount: u64,
    pub staked_at: i64,
    pub duration: i64,
    pub active: bool,
}

#[event]
pub struct TokenCreated {
    pub mint: Pubkey,
    pub name: String,
    pub symbol: String,
    pub total_supply: u64,
}

#[event]
pub struct ListenerRewarded {
    pub track_id: String,
    pub listener: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct TokensStaked {
    pub user: Pubkey,
    pub amount: u64,
    pub duration: i64,
    pub timestamp: i64,
}