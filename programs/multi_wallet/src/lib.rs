#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;

mod contexts;
mod error;
mod state;
mod utils;

use contexts::*;
use error::*;
use state::*;
use utils::*;

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
    pub fn create(
        ctx: Context<CreateMultiWallet>,
        create_key: Member,
        metadata: Option<Pubkey>,
    ) -> Result<()> {
        let multi_wallet = &mut ctx.accounts.multi_wallet;
        multi_wallet.create_key = create_key.pubkey.key();
        multi_wallet.members = [create_key].to_vec();
        multi_wallet.bump = ctx.bumps.multi_wallet;
        multi_wallet.metadata = metadata;
        multi_wallet.threshold = 1;
        multi_wallet.pending_offers = Vec::new();
        MultiWallet::check_state_validity(&multi_wallet.threshold, &multi_wallet.members)?;
        Ok(())
    }

    /// # Parameters
    /// - `ctx`: The context of the multi-action execution.
    /// - `config_actions`: The list of actions to be executed.
    ///
    /// # Returns
    /// - `Result<()>`: The result of the multi-action execution.
    pub fn change_config<'info>(
        ctx: Context<'_, '_, '_, 'info, ChangeConfig<'info>>,
        config_actions: Vec<ConfigAction>,
    ) -> Result<()> {
        let account_infos = &[ctx.remaining_accounts, &ctx.accounts.to_account_infos()].concat();
        let multi_wallet = &mut ctx.accounts.multi_wallet;
        multi_wallet.validate(account_infos, &ctx.accounts.instruction_sysvar, false)?;

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

        emit_cpi!(ChangeConfigEvent {
            create_key: multi_wallet.create_key,
            members: multi_wallet.members.clone(),
            threshold: multi_wallet.threshold,
            metadata: multi_wallet.metadata,
        });

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
    pub fn vault_transaction_execute<'info>(
        ctx: Context<'_, '_, '_, 'info, VaultTransactionExecute<'info>>,
        vault_index: u16,
        transaction_message: Vec<u8>,
    ) -> Result<()> {
        let account_infos = &[ctx.remaining_accounts, &ctx.accounts.to_account_infos()].concat();
        let multi_wallet = &mut ctx.accounts.multi_wallet;
        multi_wallet.validate(account_infos, &ctx.accounts.instruction_sysvar, false)?;
        let vault_transaction_message =
            VaultTransactionMessage::deserialize(&mut transaction_message.as_slice())?;
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

    /// Initializes an escrow. This function locks funds into an escrow vault
    /// and sets up the necessary metadata for the escrow.
    ///
    /// # Parameters
    /// - `ctx`: The context containing all relevant accounts for initializing the escrow.
    /// - `identifier`: A unique identifier for the escrow, used to distinguish it from others.
    /// - `new_members`: A vector of new members to be added to the multi-wallet after the escrow is executed.
    /// - `amount`: The amount to be transferred to the escrow.
    ///
    /// # Returns
    /// - `Ok(())`: If the escrow is successfully initialized and funds are transferred to the escrow vault.
    /// - `Err`: If any validation fails or the transfer operation encounters an issue.
    ///
    pub fn initiate_escrow_as_non_owner(
        ctx: Context<InitializeEscrowAsNonOwner>,
        identifier: u64,
        new_members: Vec<Member>,
        amount: u64,
        threshold: u8,
    ) -> Result<()> {
        let multi_wallet = &mut ctx.accounts.multi_wallet;
        require!(
            multi_wallet
                .members
                .iter()
                .find(|x| x.pubkey.eq(ctx.accounts.member.key))
                .is_some(),
            MultisigError::RequiresAtLeastOneMember
        );
        require!(multi_wallet.threshold > 1, MultisigError::MissingOwner);
        MultiWallet::check_state_validity(&threshold, &new_members)?;
        let escrow = &mut ctx.accounts.escrow;
        multi_wallet.add_offer(escrow.key());

        MultiWallet::realloc_if_needed(
            multi_wallet.to_account_info(),
            multi_wallet.members.len(),
            multi_wallet.pending_offers.len(),
            Some(ctx.accounts.payer.to_account_info()),
            Some(ctx.accounts.system_program.to_account_info()),
        )?;

        let mint = ctx.accounts.mint.as_ref().map_or(None, |x| Some(x.key()));
        escrow.bump = ctx.bumps.escrow;
        escrow.vault_bump = Some(ctx.bumps.escrow_vault);
        escrow.identifier = identifier;
        escrow.create_key = multi_wallet.create_key;
        escrow.new_members = Some(new_members);
        escrow.recipient = Recipient {
            pubkey: None,
            mint,
            amount,
        };
        escrow.proposer = Some(ctx.accounts.payer.key());
        escrow.threshold = Some(threshold);

        escrow.escrow_transfer(
            &ctx.accounts.mint,
            &ctx.accounts.payer_token_account,
            &ctx.accounts.escrow_token_vault,
            &Some(ctx.accounts.payer.to_account_info()),
            &Some(ctx.accounts.escrow_vault.to_account_info()),
            &None,
            &ctx.accounts.payer.to_account_info(),
            &ctx.accounts.token_program,
            &ctx.accounts.system_program.to_account_info(),
        )?;

        emit_cpi!(EscrowEvent {
            create_key: escrow.create_key,
            identifier: escrow.identifier,
            is_pending: true,
            is_rejected: false,
            recipient: escrow.recipient,
            approver: None,
            proposer: escrow.proposer,
            new_members: escrow.new_members.clone(),
            threshold: escrow.threshold
        });

        Ok(())
    }

    /// Executes an escrow. This function transfers funds from the escrow vault
    /// to the recipient and updates the members of the multi-wallet as specified in the escrow.
    ///
    /// # Parameters
    /// - `ctx`: The context containing all relevant accounts required for executing the escrow.
    /// - `new_members`: A vector of new members to be added to the multi-wallet after the escrow is executed.
    /// - `threshold`: Number of signatures required for the multisig transaction to be approved.
    ///
    /// # Returns
    /// - `Ok(())`: If the escrow is successfully executed, funds are transferred, and the multi-wallet is updated.
    /// - `Err`: If any validation fails, the escrow is not locked, or the transfer operation encounters an issue.
    ///
    pub fn execute_escrow_as_non_owner<'info>(
        ctx: Context<'_, '_, '_, 'info, ExecuteEscrowAsNonOwner<'info>>,
        new_members: Vec<Member>,
        threshold: u8,
    ) -> Result<()> {
        let multi_wallet = &mut ctx.accounts.multi_wallet;
        let escrow = &ctx.accounts.escrow;
        require!(
            multi_wallet.pending_offers.contains(&escrow.key()),
            MultisigError::EscrowDoesNotExist
        );
        require!(
            escrow.proposer.is_none(),
            MultisigError::UnauthorisedToAcceptEscrowOffer
        );
        require!(
            escrow.recipient.pubkey.is_some()
                && ctx.accounts.recipient.key() == escrow.recipient.pubkey.unwrap(),
            MultisigError::InvalidEscrowRecipient
        );
        multi_wallet.set_members(new_members.clone());
        multi_wallet.set_threshold(threshold);

        escrow.escrow_transfer(
            &ctx.accounts.mint,
            &ctx.accounts.payer_token_account,
            &ctx.accounts.recipient_token_account,
            &Some(ctx.accounts.payer.to_account_info()),
            &Some(ctx.accounts.recipient.to_account_info()),
            &None,
            &ctx.accounts.payer.to_account_info(),
            &ctx.accounts.token_program,
            &ctx.accounts.system_program.to_account_info(),
        )?;

        MultiWallet::check_state_validity(&multi_wallet.threshold, &multi_wallet.members)?;
        multi_wallet.clear_pending_offers();
        emit_cpi!(EscrowEvent {
            create_key: multi_wallet.create_key,
            identifier: escrow.identifier,
            is_pending: false,
            is_rejected: false,
            recipient: escrow.recipient,
            approver: Some(ctx.accounts.payer.key()),
            proposer: escrow.proposer,
            new_members: Some(new_members.clone()),
            threshold: Some(threshold)
        });

        Ok(())
    }

    /// Initializes an escrow as an owner. This function locks the multi-wallet
    /// and prepares the escrow account with the specified metadata and recipient details.
    ///
    /// # Parameters
    /// - `ctx`: The context containing all relevant accounts required for initializing the escrow.
    /// - `identifier`: A unique identifier for the escrow, used to distinguish it from others.
    /// - `recipient`: The recipient's account,
    /// - `amount`: The amount to be transferred.
    /// - `mint`: Token mint that needs to be transferred(if any)
    ///
    /// # Returns
    /// - `Ok(())`: If the escrow is successfully initialized and the multi-wallet is locked.
    /// - `Err`: If any validation fails or the multi-wallet does not meet the required threshold.
    ///
    pub fn initiate_escrow_as_owner<'info>(
        ctx: Context<'_, '_, '_, 'info, InitializeEscrowAsOwner<'info>>,
        identifier: u64,
        recipient: Pubkey,
        amount: u64,
        mint: Option<Pubkey>,
    ) -> Result<()> {
        let account_infos = &[ctx.remaining_accounts, &ctx.accounts.to_account_infos()].concat();
        let escrow = &mut ctx.accounts.escrow;
        let multi_wallet = &mut ctx.accounts.multi_wallet;

        multi_wallet.validate(account_infos, &ctx.accounts.instruction_sysvar, true)?;
        require!(multi_wallet.threshold > 1, MultisigError::MissingOwner);
        multi_wallet.add_offer(escrow.key());

        MultiWallet::realloc_if_needed(
            multi_wallet.to_account_info(),
            multi_wallet.members.len(),
            multi_wallet.pending_offers.len(),
            Some(ctx.accounts.payer.to_account_info()),
            Some(ctx.accounts.system_program.to_account_info()),
        )?;

        escrow.bump = ctx.bumps.escrow;
        escrow.vault_bump = None;
        escrow.identifier = identifier;
        escrow.create_key = multi_wallet.create_key;
        escrow.new_members = None;
        escrow.threshold = None;
        escrow.recipient = Recipient {
            pubkey: Some(recipient),
            amount,
            mint,
        };
        escrow.proposer = None;

        emit_cpi!(EscrowEvent {
            create_key: escrow.create_key,
            identifier: escrow.identifier,
            is_pending: true,
            is_rejected: false,
            recipient: escrow.recipient,
            approver: None,
            proposer: escrow.proposer,
            new_members: escrow.new_members.clone(),
            threshold: escrow.threshold
        });
        Ok(())
    }

    /// Executes an escrow as an owner. This function transfers funds from the escrow vault
    /// to the recipient, updates the multi-wallet's members as specified in the escrow, and
    /// ensures the multi-wallet remains valid.
    ///
    /// # Parameters
    /// - `ctx`: The context containing all relevant accounts required for executing the escrow.
    ///
    /// # Returns
    /// - `Ok(())`: If the escrow is successfully executed, funds are transferred, and the multi-wallet is updated.
    /// - `Err`: If validation fails, the escrow is not properly initialized, or the transfer encounters an issue.
    ///
    pub fn execute_escrow_as_owner<'info>(
        ctx: Context<'_, '_, '_, 'info, ExecuteEscrowAsOwner<'info>>,
    ) -> Result<()> {
        let account_infos = &[ctx.remaining_accounts, &ctx.accounts.to_account_infos()].concat();
        let escrow = &ctx.accounts.escrow;
        let multi_wallet = &mut ctx.accounts.multi_wallet;

        multi_wallet.validate(account_infos, &ctx.accounts.instruction_sysvar, true)?;
        require!(
            multi_wallet.pending_offers.contains(&escrow.key()),
            MultisigError::EscrowDoesNotExist
        );
        require!(
            escrow.proposer.is_some(),
            MultisigError::UnauthorisedToAcceptEscrowOffer
        );
        multi_wallet.set_members(escrow.new_members.as_ref().unwrap().clone());
        multi_wallet.set_threshold(escrow.threshold.unwrap());

        escrow.escrow_transfer(
            &ctx.accounts.mint,
            &ctx.accounts.escrow_token_vault,
            &ctx.accounts.recipient_token_account,
            &Some(ctx.accounts.escrow_vault.to_account_info()),
            &Some(ctx.accounts.recipient.to_account_info()),
            &Some(ctx.accounts.escrow_vault.to_account_info()),
            &ctx.accounts.recipient.to_account_info(),
            &ctx.accounts.token_program,
            &ctx.accounts.system_program.to_account_info(),
        )?;

        MultiWallet::check_state_validity(&multi_wallet.threshold, &multi_wallet.members)?;
        multi_wallet.clear_pending_offers();
        emit_cpi!(EscrowEvent {
            create_key: multi_wallet.create_key,
            identifier: escrow.identifier,
            is_pending: false,
            is_rejected: false,
            recipient: Recipient {
                pubkey: Some(ctx.accounts.recipient.key()),
                mint: escrow.recipient.mint,
                amount: escrow.recipient.amount,
            },
            approver: Some(ctx.accounts.recipient.key()),
            proposer: escrow.proposer,
            new_members: escrow.new_members.clone(),
            threshold: escrow.threshold
        });

        Ok(())
    }

    /// Cancels an escrow as an owner. This function unlocks the multi-wallet and invalidates the escrow,
    /// preventing it from being executed.
    ///
    /// # Parameters
    /// - `ctx`: The context containing all relevant accounts required for canceling the escrow.
    ///
    /// # Returns
    /// - `Ok(())`: If the escrow is successfully canceled and the multi-wallet is unlocked.
    /// - `Err`: If validation fails or the accounts provided are invalid.
    ///
    pub fn cancel_escrow_as_owner<'info>(
        ctx: Context<'_, '_, '_, 'info, CancelEscrowAsOwner<'info>>,
    ) -> Result<()> {
        let account_infos = &[ctx.remaining_accounts, &ctx.accounts.to_account_infos()].concat();
        let escrow = &ctx.accounts.escrow;
        let multi_wallet = &mut ctx.accounts.multi_wallet;

        multi_wallet.validate(account_infos, &ctx.accounts.instruction_sysvar, true)?;
        multi_wallet.remove_offer(escrow.key());

        if escrow.proposer.is_some() {
            if escrow.proposer.unwrap() == ctx.accounts.proposer.key() {
                escrow.escrow_transfer(
                    &ctx.accounts.mint,
                    &ctx.accounts.escrow_token_vault,
                    &ctx.accounts.proposer_token_account,
                    &ctx.accounts
                        .escrow_vault
                        .as_ref()
                        .map_or(None, |x| Some(x.to_account_info())),
                    &Some(ctx.accounts.proposer.to_account_info()),
                    &ctx.accounts
                        .escrow_vault
                        .as_ref()
                        .map_or(None, |x| Some(x.to_account_info())),
                    &ctx.accounts.proposer.to_account_info(),
                    &ctx.accounts.token_program,
                    &ctx.accounts.system_program.to_account_info(),
                )?;
            } else {
                return err!(MultisigError::InvalidEscrowProposer);
            }
        }

        emit_cpi!(EscrowEvent {
            create_key: escrow.create_key,
            identifier: escrow.identifier,
            is_pending: false,
            is_rejected: true,
            recipient: escrow.recipient,
            approver: None,
            proposer: escrow.proposer,
            new_members: escrow.new_members.clone(),
            threshold: escrow.threshold
        });
        Ok(())
    }

    /// Cancels an escrow as a proposer. This function returns the locked funds in the escrow
    /// vault back to the proposer and invalidates the escrow, preventing further execution.
    ///
    /// # Parameters
    /// - `ctx`: The context containing all relevant accounts required for canceling the escrow.
    ///
    /// # Returns
    /// - `Ok(())`: If the escrow is successfully canceled and funds are returned to the proposer.
    /// - `Err`: If any validation fails or the transfer operation encounters an issue.
    ///
    pub fn cancel_escrow_as_proposer(ctx: Context<CancelEscrowAsNonOwner>) -> Result<()> {
        let multi_wallet = &mut ctx.accounts.multi_wallet;
        let escrow = &ctx.accounts.escrow;

        multi_wallet.remove_offer(escrow.key());

        require!(
            escrow.proposer.is_some(),
            MultisigError::UnauthorisedToAcceptEscrowOffer
        );
        require!(
            escrow.proposer.unwrap() == ctx.accounts.proposer.key(),
            MultisigError::InvalidEscrowProposer
        );
        escrow.escrow_transfer(
            &ctx.accounts.mint,
            &ctx.accounts.escrow_token_vault,
            &ctx.accounts.proposer_token_account,
            &Some(ctx.accounts.escrow_vault.to_account_info()),
            &Some(ctx.accounts.proposer.to_account_info()),
            &Some(ctx.accounts.escrow_vault.to_account_info()),
            &ctx.accounts.proposer.to_account_info(),
            &ctx.accounts.token_program,
            &ctx.accounts.system_program.to_account_info(),
        )?;

        emit_cpi!(EscrowEvent {
            create_key: escrow.create_key,
            identifier: escrow.identifier,
            is_pending: false,
            is_rejected: false,
            recipient: escrow.recipient,
            proposer: escrow.proposer,
            approver: None,
            new_members: escrow.new_members.clone(),
            threshold: escrow.threshold
        });

        Ok(())
    }
}
