use crate::state::{Escrow, MultiWallet, SEED_ESCROW, SEED_MULTISIG, SEED_VAULT};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::sysvar::instructions as tx_instructions;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

#[event_cpi]
#[derive(Accounts)]
pub struct ExecuteEscrowAsOwner<'info> {
    #[account(
        mut,
        seeds = [SEED_MULTISIG, escrow.create_key.as_ref()],
        bump = multi_wallet.bump
    )]
    pub multi_wallet: Box<Account<'info, MultiWallet>>,
    #[account(
        mut,
        close = recipient,
        seeds = [SEED_ESCROW, escrow.create_key.as_ref(), escrow.identifier.to_le_bytes().as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Box<Account<'info, Escrow>>,
    #[account(
        mut,
        seeds = [SEED_ESCROW, escrow.create_key.as_ref(), escrow.identifier.to_le_bytes().as_ref(), SEED_VAULT],
        bump = escrow.vault_bump.unwrap()
    )]
    pub escrow_vault: SystemAccount<'info>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = escrow_vault,
        associated_token::token_program = token_program
    )]
    pub escrow_token_vault: Option<Box<InterfaceAccount<'info, TokenAccount>>>,
    #[account(
        init_if_needed,
        payer = recipient,
        associated_token::mint = mint,
        associated_token::authority = recipient,
        associated_token::token_program = token_program
    )]
    pub recipient_token_account: Option<Box<InterfaceAccount<'info, TokenAccount>>>,
    pub mint: Option<Box<InterfaceAccount<'info, Mint>>>,
    /// CHECK: instructions sysvar
    #[account(address = tx_instructions::ID)]
    pub instruction_sysvar: UncheckedAccount<'info>,
    #[account(mut)]
    pub recipient: Signer<'info>,
    pub token_program: Option<Interface<'info, TokenInterface>>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}
