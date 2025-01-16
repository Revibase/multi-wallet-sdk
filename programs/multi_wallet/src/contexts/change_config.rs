use anchor_lang::prelude::*;
use crate::state::{MultiWallet, SEED_MULTISIG};
use anchor_lang::solana_program::sysvar::instructions as tx_instructions;
#[event_cpi]
#[derive(Accounts)]
pub struct ChangeConfig<'info> {
    #[account(
        mut, 
        seeds = [SEED_MULTISIG, multi_wallet.create_key.as_ref()],
        bump = multi_wallet.bump
    )]
    pub multi_wallet: Account<'info, MultiWallet>,
    #[account(mut)]
    pub payer: Option<Signer<'info>>,
    pub system_program: Option<Program<'info, System>>,
    /// CHECK: instructions sysvar
    #[account(address = tx_instructions::ID)]
    pub instruction_sysvar: UncheckedAccount<'info>
}