#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;
use state::{Member, MultiWallet, SEED_MULTISIG, SEED_VAULT};
use error::MultisigError;
use state::VaultTransactionMessage;
use utils::ExecutableTransactionMessage;
use anchor_lang::solana_program::sysvar::instructions as tx_instructions;
mod state;
mod error;
mod utils;
use state::ConfigAction;
declare_id!("mu1LDWh4VGHhnZHB85s92HNBapj3b9s5DgzTkiAyeKY");

#[program]
pub mod multi_wallet {
     use super::*;

    /// Creates a new multi-wallet.
    ///
    /// # Parameters
    /// - `ctx`: The context of the multi-wallet creation.
    /// - `create_key`: The member key used to create the multi-wallet.
    /// - `metadata`: An optional metadata for the multi-wallet.
    /// - `label`: An optional label for the multi-wallet.
    ///
    /// # Returns
    /// - `Result<()>`: The result of the multi-wallet creation.
    pub fn create(ctx: Context<CreateMultiWallet>, create_key: Member, metadata: Option<Pubkey>) -> Result<()> {
        let multi_wallet = &mut ctx.accounts.multi_wallet;
        multi_wallet.create_key = create_key.pubkey.key();
        multi_wallet.members = [create_key].to_vec();
        multi_wallet.bump = ctx.bumps.multi_wallet;
        multi_wallet.metadata = metadata;
        multi_wallet.threshold = 1;
        multi_wallet.invariant()?;
        Ok(())
    }

    /// # Parameters
    /// - `ctx`: The context of the multi-action execution.
    /// - `config_actions`: The list of actions to be executed.
    ///
    /// # Returns
    /// - `Result<()>`: The result of the multi-action execution.
    pub fn change_config(ctx: Context<ChangeConfig>, config_actions: Vec<ConfigAction>) -> Result<()> {
        let multi_wallet = &mut ctx.accounts.multi_wallet;
        MultiWallet::durable_nonce_check(&ctx.accounts.instruction_sysvar)?;
        multi_wallet.threshold_check(ctx.remaining_accounts)?;

        for action in config_actions {
            match action {
                ConfigAction::AddMembers(add_members) => {
                    multi_wallet.add_members(add_members);
                }
                ConfigAction::RemoveMembers(remove_members) => {
                    multi_wallet.remove_members(remove_members);
                }
                ConfigAction::SetThreshold(new_threshold) => {
                    multi_wallet.threshold = new_threshold;
                }
                ConfigAction::SetMetadata(metadata) => {
                    multi_wallet.metadata = metadata;
                }
            }
        }

        MultiWallet::realloc_if_needed(
            multi_wallet.to_account_info(),
            multi_wallet.members.len(),
            ctx.accounts.payer.as_ref().map(ToAccountInfo::to_account_info),
            ctx.accounts.system_program.as_ref().map(ToAccountInfo::to_account_info)
        )?;
    
        multi_wallet.invariant()?;
        Ok(())
    }



    /// Executes a vault transaction.
    ///
    /// # Parameters
    /// - `ctx`: The context of the vault transaction execution.
    /// - `vault_index`: The index of the vault.
    /// - `transaction_message`: The transaction message to be executed.
    ///
    /// # Returns
    /// - `Result<()>`: The result of the vault transaction execution.
    pub fn vault_transaction_execute(
        ctx: Context<VaultTransactionExecute>,
        vault_index: u16,
        transaction_message: Vec<u8>,
    ) -> Result<()> {
        let multi_wallet = &mut ctx.accounts.multi_wallet;
        MultiWallet::durable_nonce_check(&ctx.accounts.instruction_sysvar)?;
        multi_wallet.threshold_check(ctx.remaining_accounts)?;
        let vault_transaction_message = VaultTransactionMessage::deserialize(&mut transaction_message.as_slice())?;
        vault_transaction_message.validate()?;

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
        let vault_seed_slices:&[&[u8]] = &[SEED_MULTISIG, multi_wallet_key.as_ref(), SEED_VAULT, vault_index_ref.as_ref()];
        let (vault_pubkey, vault_bump) = Pubkey::find_program_address(vault_seed_slices, ctx.program_id);
        let executable_message = ExecutableTransactionMessage::new_validated(
                vault_transaction_message,
                message_account_infos,
                address_lookup_table_account_infos,
                &vault_pubkey,
            )?;
  
        let vault_signer_seed_slices:&[&[u8]] = &[SEED_MULTISIG, multi_wallet_key.as_ref(), SEED_VAULT, vault_index_ref.as_ref(), &[vault_bump]];
        executable_message.execute_message(
            vault_signer_seed_slices,          
        )?;

        multi_wallet.reload()?;

        Ok(())
    }    
}

#[derive(Accounts)]
#[instruction(create_key: Member)]
pub struct CreateMultiWallet<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init, 
        payer = payer, 
        space = MultiWallet::size(1), 
        seeds = [SEED_MULTISIG, create_key.pubkey.as_ref()],
        bump,
    )]
    pub multi_wallet: Account<'info, MultiWallet>,
    pub system_program: Program<'info, System>
}

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

#[derive(Accounts)]
pub struct VaultTransactionExecute<'info> {
    #[account(
        mut, 
        seeds = [SEED_MULTISIG, multi_wallet.create_key.as_ref()],
        bump = multi_wallet.bump
    )]
    pub multi_wallet: Account<'info, MultiWallet>,
    /// CHECK: instructions sysvar
    #[account(address = tx_instructions::ID)]
    pub instruction_sysvar: UncheckedAccount<'info>
}