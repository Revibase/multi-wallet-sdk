use crate::{
    state::{MultiWallet, SEED_MULTISIG},
    MultisigError, Permission, TransactionBuffer, MAX_BUFFER_SIZE, SEED_TRANSACTION_BUFFER,
};
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct TransactionBufferCreateArgs {
    /// Index of the buffer account to seed the account derivation
    pub buffer_index: u8,
    /// Index of the vault this transaction belongs to.
    pub vault_index: u8,
    /// Hash of the final assembled transaction message.
    pub final_buffer_hash: [u8; 32],
    /// Final size of the buffer.
    pub final_buffer_size: u16,
    /// Initial slice of the buffer.
    pub buffer: Vec<u8>,
}

#[derive(Accounts)]
#[instruction(args: TransactionBufferCreateArgs)]
pub struct TransactionBufferCreate<'info> {
    #[account(
        seeds = [SEED_MULTISIG, multi_wallet.create_key.as_ref()],
        bump = multi_wallet.bump
    )]
    pub multi_wallet: Account<'info, MultiWallet>,

    #[account(
        init,
        payer = rent_payer,
        space = TransactionBuffer::size(args.final_buffer_size)?,
        seeds = [
            SEED_MULTISIG,
            multi_wallet.key().as_ref(),
            SEED_TRANSACTION_BUFFER,
            creator.key().as_ref(),
            &args.buffer_index.to_le_bytes(),
        ],
        bump
    )]
    pub transaction_buffer: Account<'info, TransactionBuffer>,

    pub creator: Signer<'info>,

    #[account(mut)]
    pub rent_payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

impl TransactionBufferCreate<'_> {
    fn validate(&self, args: &TransactionBufferCreateArgs) -> Result<()> {
        let Self {
            multi_wallet,
            creator,
            ..
        } = self;

        require!(
            multi_wallet
                .members
                .iter()
                .filter(|x| x.pubkey.eq(creator.key)
                    && x.permissions.is_some()
                    && x.permissions.unwrap().has(Permission::InitiateTransaction))
                .count()
                == 1,
            MultisigError::InsufficientSignerWithInitiatePermission
        );

        require!(
            args.final_buffer_size as usize <= MAX_BUFFER_SIZE,
            MultisigError::FinalBufferSizeExceeded
        );

        Ok(())
    }

    #[access_control(ctx.accounts.validate(&args))]
    pub fn process(ctx: Context<Self>, args: TransactionBufferCreateArgs) -> Result<()> {
        // Mutable Accounts
        let transaction_buffer = &mut ctx.accounts.transaction_buffer;

        // Readonly Accounts
        let multi_wallet = &ctx.accounts.multi_wallet;
        let creator = &mut ctx.accounts.creator;
        let rent_payer = &ctx.accounts.rent_payer;

        // Get the buffer index.
        let buffer_index = args.buffer_index;

        // Initialize the transaction fields.
        transaction_buffer.multi_wallet = multi_wallet.key();
        transaction_buffer.creator = creator.key();
        transaction_buffer.rent_payer = rent_payer.key();
        transaction_buffer.vault_index = args.vault_index;
        transaction_buffer.buffer_index = buffer_index;
        transaction_buffer.final_buffer_hash = args.final_buffer_hash;
        transaction_buffer.final_buffer_size = args.final_buffer_size;
        transaction_buffer.buffer = args.buffer;
        transaction_buffer.bump = ctx.bumps.transaction_buffer;

        // Invariant function on the transaction buffer
        transaction_buffer.invariant()?;

        Ok(())
    }
}
