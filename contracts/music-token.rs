use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint};
use spl_token::instruction::AuthorityType;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFp1Jff");

#[program]
pub mod music_token {
    use super::*;

    pub fn initialize_token(ctx: Context<InitializeToken>, supply: u64, decimals: u8) -> Result<()> {
        let mint = &mut ctx.accounts.mint;
        mint.authority = ctx.accounts.authority.key();
        mint.supply = supply;
        mint.decimals = decimals;
        mint.is_initialized = true;

        msg!("Music token initialized with supply: {} and decimals: {}", supply, decimals);
        Ok(())
    }

    pub fn mint_tokens(ctx: Context<MintTokens>, amount: u64) -> Result<()> {
        let mint = &ctx.accounts.mint;
        let user_token_account = &ctx.accounts.user_token_account;
        let authority = &ctx.accounts.authority;

        // Проверка авторизации
        require!(mint.authority == authority.key(), ErrorCode::Unauthorized);

        // Минтинг токенов
        let cpi_accounts = token::MintTo {
            mint: mint.to_account_info(),
            to: user_token_account.to_account_info(),
            authority: authority.to_account_info(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        token::mint_to(cpi_ctx, amount)?;

        msg!("Minted {} tokens to user", amount);
        Ok(())
    }

    pub fn burn_tokens(ctx: Context<BurnTokens>, amount: u64) -> Result<()> {
        let mint = &ctx.accounts.mint;
        let user_token_account = &ctx.accounts.user_token_account;
        let authority = &ctx.accounts.authority;

        // Проверка авторизации (для дефляционной модели)
        require!(mint.authority == authority.key(), ErrorCode::Unauthorized);

        // Сжигание токенов (2% от транзакции)
        let burn_amount = amount.checked_mul(2).unwrap().checked_div(100).unwrap();

        let cpi_accounts = token::Burn {
            mint: mint.to_account_info(),
            to: user_token_account.to_account_info(),
            authority: authority.to_account_info(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        token::burn(cpi_ctx, burn_amount)?;

        msg!("Burned {} tokens (2% deflation)", burn_amount);
        Ok(())
    }

    pub fn reward_listener(ctx: Context<RewardListener>, track_id: String) -> Result<()> {
        let reward_amount = 1_000_000; // 1 токен в lamports

        // Минтинг награды за прослушивание
        let mint_ctx = Context::new(
            ctx.program_id,
            MintTokens {
                mint: ctx.accounts.mint.clone(),
                user_token_account: ctx.accounts.user_token_account.clone(),
                authority: ctx.accounts.authority.clone(),
                token_program: ctx.accounts.token_program.clone(),
            },
        );

        mint_tokens(mint_ctx, reward_amount)?;

        msg!("Rewarded listener for track: {} with {} tokens", track_id, reward_amount);
        Ok(())
    }

    pub fn reward_artist(ctx: Context<RewardArtist>, track_id: String) -> Result<()> {
        let reward_amount = 10_000_000; // 10 токенов для артиста

        let mint_ctx = Context::new(
            ctx.program_id,
            MintTokens {
                mint: ctx.accounts.mint.clone(),
                user_token_account: ctx.accounts.user_token_account.clone(),
                authority: ctx.accounts.authority.clone(),
                token_program: ctx.accounts.token_program.clone(),
            },
        );

        mint_tokens(mint_ctx, reward_amount)?;

        msg!("Rewarded artist for track: {} with {} tokens", track_id, reward_amount);
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(supply: u64, decimals: u8)]
pub struct InitializeToken<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        mint::decimals = decimals,
        mint::authority = authority.key(),
    )]
    pub mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct BurnTokens<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RewardListener<'info> {
    pub mint: Account<'info, Mint>,
    pub user_token_account: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RewardArtist<'info> {
    pub mint: Account<'info, Mint>,
    pub user_token_account: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized access")]
    Unauthorized,
}