use anchor_lang::prelude::*;
use crate::state::{Escrow, MultiWallet, SEED_ESCROW, SEED_MULTISIG};
use anchor_lang::solana_program::sysvar::instructions as tx_instructions;

#[event_cpi]
#[derive(Accounts)]
#[instruction(identifier: u64)]
pub struct InitializeEscrowAsOwner<'info> {
    #[account(
        mut, 
        seeds = [SEED_MULTISIG, multi_wallet.create_key.as_ref()],
        bump = multi_wallet.bump
    )]
    pub multi_wallet: Box<Account<'info, MultiWallet>>,
    #[account(
        init, 
        payer = payer,
        space = Escrow::size(0),
        seeds = [SEED_ESCROW, multi_wallet.create_key.key().as_ref(), identifier.to_le_bytes().as_ref()],
        bump
    )]
    pub escrow: Box<Account<'info, Escrow>>,
    /// CHECK: instructions sysvar
    #[account(address = tx_instructions::ID)]
    pub instruction_sysvar: UncheckedAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}
