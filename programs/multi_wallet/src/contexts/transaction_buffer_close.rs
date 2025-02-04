use crate::{
    state::{MultiWallet, SEED_MULTISIG},
    MultisigError, TransactionBuffer, SEED_TRANSACTION_BUFFER,
};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct TransactionBufferClose<'info> {
    #[account(
        address = transaction_buffer.multi_wallet,
    )]
    pub multi_wallet: Account<'info, MultiWallet>,

    #[account(
        mut,
        close = rent_payer,
        constraint = transaction_buffer.creator == creator.key() @ MultisigError::UnauthorisedToModifyBuffer,
        seeds = [
            SEED_MULTISIG,
            multi_wallet.key().as_ref(),
            SEED_TRANSACTION_BUFFER,
            creator.key().as_ref(),
            &transaction_buffer.buffer_index.to_le_bytes()
        ],
        bump = transaction_buffer.bump
    )]
    pub transaction_buffer: Account<'info, TransactionBuffer>,

    pub creator: Signer<'info>,

    /// CHECK:
    #[account(
        mut,
        constraint = rent_payer.key() == transaction_buffer.rent_payer @MultisigError::InvalidAccount
    )]
    pub rent_payer: UncheckedAccount<'info>,
}

impl TransactionBufferClose<'_> {
    fn validate(&self) -> Result<()> {
        Ok(())
    }

    /// Close a transaction buffer account.
    #[access_control(ctx.accounts.validate())]
    pub fn process(ctx: Context<Self>) -> Result<()> {
        Ok(())
    }
}
