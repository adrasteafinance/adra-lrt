use crate::errors::LRTPoolError;
use crate::state::LRTPool;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct UpdateMintLimit<'info> {
    #[account(mut)]
    authority: Signer<'info>,
    #[account(
        mut,
        seeds = [b"lrt_pool", pool.output_token_mint.key().as_ref()],
        bump = pool.bump,
        constraint = pool.delegate_authority == authority.key() @ LRTPoolError::InvalidDelegateAuthority
    )]
    pool: Account<'info, LRTPool>,
}

impl<'info> UpdateMintLimit<'info> {
    pub fn update_mint_limit(&mut self, limit: u64) -> Result<()> {
        self.pool.output_mint_limit = limit;
        Ok(())
    }
}
