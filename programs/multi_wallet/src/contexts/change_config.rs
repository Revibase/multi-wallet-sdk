use anchor_lang::prelude::*;
use crate::{state::{MultiWallet, Permission, SEED_MULTISIG}, ConfigAction, ConfigEvent, MultisigError};
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

impl<'info> ChangeConfig<'info> {
    fn validate(&self, ctx: &Context<'_, '_, '_, 'info, Self>,) -> Result<()> {
        let Self {
            multi_wallet,
            instruction_sysvar,
            ..
        } = self;
        MultiWallet::durable_nonce_check(instruction_sysvar)?;
        let account_infos = &[ctx.remaining_accounts, &ctx.accounts.to_account_infos()].concat();
        let unique_signers = multi_wallet.get_unique_signers(account_infos)?;
        
        require!(
            unique_signers.iter().filter(|x| x.permissions.is_some() && x.permissions.unwrap().has(Permission::InitiateTransaction)).count() >= 1,
            MultisigError::InsufficientSignerWithInitiatePermission
        );
        require!(
            multi_wallet.threshold <= unique_signers.iter().filter(|x| x.permissions.is_some() && x.permissions.unwrap().has(Permission::VoteTransaction)).count().try_into().unwrap(),
            MultisigError::NotEnoughSigners
        );

        require!(
           unique_signers.iter().filter(|x| x.permissions.is_some() && x.permissions.unwrap().has(Permission::ExecuteTransaction)).count() >= 1,
            MultisigError::InsufficientSignerWithExecutePermission
        );
      
        require!(
            multi_wallet.pending_offers.len() == 0,
            MultisigError::MultisigIsCurrentlyLocked
        );
      
        Ok(())
    }

    #[access_control(ctx.accounts.validate(&ctx))]
    pub fn process(ctx: Context<'_, '_, '_, 'info, Self>,  config_actions: Vec<ConfigAction>,) -> Result<()> {   
        let multi_wallet = &mut ctx.accounts.multi_wallet;
        for action in config_actions {
            match action {
                ConfigAction::SetMembers(set_members) => {
                    multi_wallet.set_members(set_members);
                }
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
            multi_wallet.pending_offers.len(),
            ctx.accounts
                .payer
                .as_ref()
                .map(ToAccountInfo::to_account_info),
            ctx.accounts
                .system_program
                .as_ref()
                .map(ToAccountInfo::to_account_info),
        )?;

        MultiWallet::check_state_validity(&multi_wallet.threshold, &multi_wallet.members)?;

        emit_cpi!(ConfigEvent {
            create_key: multi_wallet.create_key,
            members: multi_wallet.members.clone(),
            threshold: multi_wallet.threshold,
            metadata: multi_wallet.metadata,
        });

        Ok(())
    }
}