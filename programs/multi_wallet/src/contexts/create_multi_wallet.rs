use anchor_lang::prelude::*;
use crate::{state::{MultiWallet, SEED_MULTISIG}, Member};

#[derive(Accounts)]
#[instruction(create_key: Member)]
pub struct CreateMultiWallet<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init, 
        payer = payer, 
        space = MultiWallet::size(1,0), 
        seeds = [SEED_MULTISIG, create_key.pubkey.as_ref()],
        bump,
    )]
    pub multi_wallet: Account<'info, MultiWallet>,
    pub system_program: Program<'info, System>
}