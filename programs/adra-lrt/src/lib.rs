use anchor_lang::prelude::*;
use contexts::*;

mod contexts;
mod errors;
mod state;
mod utils;

declare_id!("Lrt1aE9sgjyi6B9QEdcuzHC8GhU32N3PM9RSKLBeD7b");

#[program]
pub mod adra_lrt {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, limit: u64) -> Result<()> {
        ctx.accounts.initialize(ctx.bumps, limit)
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        // transfer input token into the pool
        ctx.accounts.stake(amount)?;
        // calculate mint amount
        let mint_amount = ctx.accounts.calculate_output_token_amount(amount);
        // mint output token
        ctx.accounts.mint_output_token(mint_amount)?;
        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        // burn output token from user first
        ctx.accounts.burn_output_token(amount)?;
        // calculate withdraw amount
        let withdraw_amount = ctx.accounts.calculate_input_token_amount(amount);
        // transfer input token back to user's vault
        ctx.accounts.unstake(withdraw_amount)?;
        Ok(())
    }

    // user can always withdraw stake to get sSol back even if there is no sSol liquidity in the pool
    pub fn withdraw_delegated_stake(ctx: Context<WithdrawStake>, amount: u64) -> Result<()> {
        // burn output token from user first
        ctx.accounts.burn_output_token(amount)?;
        // calculate withdraw amount
        let withdraw_amount = ctx.accounts.calculate_input_token_amount(amount);
        // undelegate avs token
        ctx.accounts.undelegate(withdraw_amount)?;
        // transfer input token back to user's vault
        ctx.accounts.unstake(withdraw_amount)?;
        Ok(())
    }

    pub fn transfer_delegate_authority(ctx: Context<TransferDelegateAuthority>) -> Result<()> {
        ctx.accounts.transfer_authority()?;
        Ok(())
    }

    pub fn delegate(ctx: Context<Delegate>, amount: u64) -> Result<()> {
        ctx.accounts.delegate(amount)?;
        Ok(())
    }

    pub fn undelegate(ctx: Context<Delegate>, amount: u64) -> Result<()> {
        ctx.accounts.undelegate(amount)?;
        Ok(())
    }

    pub fn update_mint_limit(ctx: Context<UpdateMintLimit>, limit: u64) -> Result<()> {
        ctx.accounts.update_mint_limit(limit)
    }
}
