use crate::{state::SEED_MULTISIG, MultisigError, TransactionBuffer, SEED_TRANSACTION_BUFFER};
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct TransactionBufferExtendArgs {
    // Buffer to extend the TransactionBuffer with.
    pub buffer: Vec<u8>,
}

#[derive(Accounts)]
#[instruction(args: TransactionBufferExtendArgs)]
pub struct TransactionBufferExtend<'info> {
    #[account(
        mut,
        constraint = transaction_buffer.creator == creator.key() @ MultisigError::UnauthorisedToModifyBuffer,
        seeds = [
            SEED_MULTISIG,
            transaction_buffer.multi_wallet.as_ref(),
            SEED_TRANSACTION_BUFFER,
            creator.key().as_ref(),
            &transaction_buffer.buffer_index.to_le_bytes()
        ],
        bump = transaction_buffer.bump,
    )]
    pub transaction_buffer: Account<'info, TransactionBuffer>,

    pub creator: Signer<'info>,
}

impl TransactionBufferExtend<'_> {
    fn validate(&self, args: &TransactionBufferExtendArgs) -> Result<()> {
        let Self {
            transaction_buffer, ..
        } = self;

        // Extended Buffer size must not exceed final buffer size
        // Calculate remaining space in the buffer
        let current_buffer_size = transaction_buffer.buffer.len() as u16;
        let remaining_space = transaction_buffer
            .final_buffer_size
            .checked_sub(current_buffer_size)
            .unwrap();

        // Check if the new data exceeds the remaining space
        let new_data_size = args.buffer.len() as u16;
        require!(
            new_data_size <= remaining_space,
            MultisigError::FinalBufferSizeExceeded
        );

        Ok(())
    }

    /// Create a new vault transaction.
    #[access_control(ctx.accounts.validate(&args))]
    pub fn process(ctx: Context<Self>, args: TransactionBufferExtendArgs) -> Result<()> {
        // Mutable Accounts
        let transaction_buffer = &mut ctx.accounts.transaction_buffer;

        // Required Data
        let buffer_slice_extension = args.buffer;

        // Extend the Buffer inside the TransactionBuffer
        transaction_buffer
            .buffer
            .extend_from_slice(&buffer_slice_extension);

        // Invariant function on the transaction buffer
        transaction_buffer.invariant()?;

        Ok(())
    }
}
