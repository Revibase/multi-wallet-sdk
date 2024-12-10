
use anchor_lang::prelude::*;
use state::{MultiWallet, SEED_MULTISIG, SEED_VAULT};
use anchor_lang::system_program::{transfer, Transfer};
use error::MultisigError;
use state::VaultTransactionMessage;
use utils::ExecutableTransactionMessage;
use anchor_lang::solana_program::sysvar::instructions as tx_instructions;
mod state;
mod error;
mod utils;

declare_id!("mu1LDWh4VGHhnZHB85s92HNBapj3b9s5DgzTkiAyeKY");

#[program]
pub mod multi_wallet {
    use super::*;
 
    pub fn create(ctx: Context<CreateMultiWallet>) -> Result<()> {
        let multi_wallet = &mut ctx.accounts.multi_wallet;
        multi_wallet.create_key = ctx.accounts.create_key.key();
        multi_wallet.members = [ctx.accounts.create_key.key()].to_vec();
        multi_wallet.bump = ctx.bumps.multi_wallet;
        multi_wallet.threshold = 1;

        transfer(CpiContext::new(ctx.accounts.system_program.to_account_info(), Transfer{
            from: ctx.accounts.payer.to_account_info(),
            to: ctx.accounts.vault.to_account_info()
        }), 1000000)?;

        multi_wallet.invariant()?;
        Ok(())
    }

    pub fn change_config(ctx: Context<ChangeConfig>, remove_members: Option<Vec<Pubkey>> , add_members: Option<Vec<Pubkey>>, new_threshold: Option<u16>) -> Result<()> {
        let multi_wallet = &mut ctx.accounts.multi_wallet;
        multi_wallet.validate(ctx.remaining_accounts, &ctx.accounts.instruction_sysvar)?;

        if remove_members.is_some() {
            multi_wallet.remove_members(remove_members.unwrap());
        }
        if add_members.is_some() {
            multi_wallet.add_members(add_members.unwrap());
        }
        if new_threshold.is_some() {
            multi_wallet.threshold = new_threshold.unwrap();
        }

        MultiWallet::realloc_if_needed(
            multi_wallet.to_account_info(),
            multi_wallet.members.len(),
            ctx.accounts
                .payer
                .as_ref()
                .map(ToAccountInfo::to_account_info),
            ctx.accounts
                .system_program
                .as_ref()
                .map(ToAccountInfo::to_account_info),
        )?;

        multi_wallet.invariant()?;
        Ok(())
    }


    pub fn vault_transaction_execute(
        ctx: Context<VaultTransactionExecute>,
        vault_index: u16,
        transaction_message: Vec<u8>,
    ) -> Result<()> {
        let multi_wallet = &mut ctx.accounts.multi_wallet;
        multi_wallet.validate(ctx.remaining_accounts, &ctx.accounts.instruction_sysvar)?;

        let vault_transaction_message = VaultTransactionMessage::deserialize(&mut transaction_message.as_slice())?;
        vault_transaction_message.validate()?;

        let num_lookups = vault_transaction_message.address_table_lookups.len();
        let message_account_infos = ctx
        .remaining_accounts
        .get(num_lookups..vault_transaction_message.num_transaction_keys as usize)
        .ok_or(MultisigError::InvalidNumberOfAccounts)?;
        let address_lookup_table_account_infos = ctx
            .remaining_accounts
            .get(..num_lookups)
            .ok_or(MultisigError::InvalidNumberOfAccounts)?;


        let multi_wallet_key = multi_wallet.key();
        let vault_index_ref = vault_index.to_le_bytes();
        let vault_seeds:&[&[u8]] = &[SEED_MULTISIG, multi_wallet_key.as_ref(), SEED_VAULT, vault_index_ref.as_ref()];
        let (vault_pubkey, vault_bump) = Pubkey::find_program_address(vault_seeds, ctx.program_id);

        let executable_message = ExecutableTransactionMessage::new_validated(
                vault_transaction_message,
                message_account_infos,
                address_lookup_table_account_infos,
                &vault_pubkey,
            )?;
  
        let vault_signer_seeds:&[&[u8]] = &[SEED_MULTISIG, multi_wallet_key.as_ref(), SEED_VAULT, vault_index_ref.as_ref(), &[vault_bump]];
        executable_message.execute_message(
            vault_signer_seeds,
            &[],
        )?;

        Ok(())
    }    
}

#[derive(Accounts)]
pub struct CreateMultiWallet<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init, 
        payer = payer, 
        space = MultiWallet::size(1), 
        seeds = [SEED_MULTISIG, create_key.key().as_ref()],
        bump,
    )]
    pub multi_wallet: Account<'info, MultiWallet>,
    #[account(
        mut,
        seeds = [SEED_MULTISIG, multi_wallet.key().as_ref(), SEED_VAULT, 0_u16.to_le_bytes().as_ref()],
        bump
    )]
    pub vault: SystemAccount<'info>,
    pub create_key: Signer<'info>,
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