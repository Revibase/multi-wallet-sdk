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
        CreateMultiWallet::process(ctx, create_key, metadata)
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
        ChangeConfig::process(ctx, config_actions)
    }

    /// Creates a new transaction buffer.
    ///
    /// # Parameters
    /// - `ctx`: Context containing all necessary accounts.
    /// - `args`: Arguments for the transaction buffer creation.
    ///
    /// # Returns
    /// - `Ok(())`: If the transaction buffer is successfully created.
    /// - `Err`: If validation fails or the provided arguments are invalid.
    pub fn transaction_buffer_create<'info>(
        ctx: Context<'_, '_, '_, 'info, TransactionBufferCreate<'info>>,
        args: TransactionBufferCreateArgs,
    ) -> Result<()> {
        TransactionBufferCreate::process(ctx, args)
    }

    /// Extends an existing transaction buffer.
    ///
    /// # Parameters
    /// - `ctx`: Context containing all necessary accounts.
    /// - `args`: Arguments for extending the transaction buffer.
    ///
    /// # Returns
    /// - `Ok(())`: If the transaction buffer is successfully extended.
    /// - `Err`: If validation fails or the provided arguments are invalid.
    pub fn transaction_buffer_extend<'info>(
        ctx: Context<'_, '_, '_, 'info, TransactionBufferExtend<'info>>,
        args: TransactionBufferExtendArgs,
    ) -> Result<()> {
        TransactionBufferExtend::process(ctx, args)
    }

    /// Closes an existing transaction buffer.
    ///
    /// # Parameters
    /// - `ctx`: Context containing all necessary accounts.
    ///
    /// # Returns
    /// - `Ok(())`: If the transaction buffer is successfully closed.
    /// - `Err`: If validation fails or the accounts are invalid.
    pub fn transaction_buffer_close<'info>(
        ctx: Context<'_, '_, '_, 'info, TransactionBufferClose<'info>>,
    ) -> Result<()> {
        TransactionBufferClose::process(ctx)
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
    ) -> Result<()> {
        VaultTransactionExecute::process(ctx, vault_index)
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
    pub fn initiate_escrow_as_non_owner<'info>(
        ctx: Context<'_, '_, '_, 'info, InitializeEscrowAsNonOwner<'info>>,
        identifier: u64,
        new_members: Vec<Member>,
        amount: u64,
        threshold: u8,
    ) -> Result<()> {
        InitializeEscrowAsNonOwner::process(ctx, identifier, new_members, amount, threshold)
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
        InitializeEscrowAsOwner::process(ctx, identifier, recipient, amount, mint)
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
        ExecuteEscrowAsNonOwner::process(ctx, new_members, threshold)
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
        ExecuteEscrowAsOwner::process(ctx)
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
    pub fn cancel_escrow_as_non_owner<'info>(
        ctx: Context<'_, '_, '_, 'info, CancelEscrowAsNonOwner<'info>>,
    ) -> Result<()> {
        CancelEscrowAsNonOwner::process(ctx)
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
        CancelEscrowAsOwner::process(ctx)
    }
}
