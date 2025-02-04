use anchor_lang::prelude::*;
use crate::{state::{MultiWallet, SEED_MULTISIG}, ExecutableTransactionMessage, MultisigError, Permission, TransactionBuffer, TransactionMessage, VaultTransactionMessage, SEED_TRANSACTION_BUFFER, SEED_VAULT};
use anchor_lang::solana_program::sysvar::instructions as tx_instructions;

#[derive(Accounts)]
pub struct VaultTransactionExecute<'info> {
    #[account(
        mut,
        close = rent_payer,
        seeds = [
            SEED_MULTISIG,
            transaction_buffer.multi_wallet.as_ref(),
            SEED_TRANSACTION_BUFFER,
            transaction_buffer.creator.as_ref(),
            &transaction_buffer.buffer_index.to_le_bytes(),
        ],
        bump = transaction_buffer.bump,
    )]
    pub transaction_buffer: Box<Account<'info, TransactionBuffer>>,
    #[account(
        mut, 
        address = transaction_buffer.multi_wallet,
    )]
    pub multi_wallet: Box<Account<'info, MultiWallet>>,
    /// CHECK:
    #[account(
        mut,
        constraint = rent_payer.key() == transaction_buffer.rent_payer @MultisigError::InvalidAccount
    )]
    pub rent_payer: UncheckedAccount<'info>,
    /// CHECK: instructions sysvar
    #[account(address = tx_instructions::ID)]
    pub instruction_sysvar: UncheckedAccount<'info>
}


impl<'info> VaultTransactionExecute<'info> {
    fn validate(&self, ctx: &Context<'_, '_, '_, 'info, Self>) -> Result<()> {
        let Self {
            multi_wallet,
            transaction_buffer,
            instruction_sysvar,
            ..
        } = self;
        transaction_buffer.validate_hash()?;
        transaction_buffer.validate_size()?;
        
        MultiWallet::durable_nonce_check(instruction_sysvar)?;
        let account_infos = &[ctx.remaining_accounts, &ctx.accounts.to_account_infos()].concat();
        let unique_signers = multi_wallet.get_unique_signers(account_infos)?;

        require!(
            multi_wallet.threshold
                <= unique_signers
                    .iter()
                    .filter(|x| x.permissions.is_some()
                        && x.permissions.unwrap().has(Permission::VoteTransaction))
                    .count()
                    .try_into()
                    .unwrap(),
            MultisigError::NotEnoughSigners
        );

        require!(
            unique_signers
                .iter()
                .filter(|x| x.permissions.is_some()
                    && x.permissions.unwrap().has(Permission::ExecuteTransaction))
                .count()
                >= 1,
            MultisigError::InsufficientSignerWithExecutePermission
        );

              
        require!(
            multi_wallet.pending_offers.len() == 0,
            MultisigError::MultisigIsCurrentlyLocked
        );

        Ok(())
    }

    #[access_control(ctx.accounts.validate(&ctx))]
    pub fn process(ctx: Context<'_, '_, '_, 'info, Self>, vault_index: u16) -> Result<()> {       
        let multi_wallet = &mut ctx.accounts.multi_wallet;
        let transaction_message = TransactionMessage::deserialize(&mut ctx.accounts.transaction_buffer.buffer.as_slice())?;
        let vault_transaction_message = VaultTransactionMessage::try_from(transaction_message)?;

        let num_lookups = vault_transaction_message.address_table_lookups.len();
        let message_end_index = num_lookups + vault_transaction_message.num_all_account_keys();

        let message_account_infos = ctx
            .remaining_accounts
            .get(num_lookups..message_end_index)
            .ok_or(MultisigError::InvalidNumberOfAccounts)?;

        let address_lookup_table_account_infos = ctx
            .remaining_accounts
            .get(..num_lookups)
            .ok_or(MultisigError::InvalidNumberOfAccounts)?;

        let multi_wallet_key = multi_wallet.key();
        let vault_index_ref = vault_index.to_le_bytes();
        let vault_seed_slices: &[&[u8]] = &[
            SEED_MULTISIG,
            multi_wallet_key.as_ref(),
            SEED_VAULT,
            vault_index_ref.as_ref(),
        ];
        let (vault_pubkey, vault_bump) =
            Pubkey::find_program_address(vault_seed_slices, ctx.program_id);
        let executable_message = ExecutableTransactionMessage::new_validated(
            vault_transaction_message,
            message_account_infos,
            address_lookup_table_account_infos,
            &vault_pubkey,
        )?;

        let vault_signer_seed_slices: &[&[u8]] = &[
            SEED_MULTISIG,
            multi_wallet_key.as_ref(),
            SEED_VAULT,
            vault_index_ref.as_ref(),
            &[vault_bump],
        ];
        executable_message.execute_message(vault_signer_seed_slices)?;

        multi_wallet.reload()?;

        Ok(())
    }
}