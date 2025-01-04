use crate::error::MultisigError;
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct VaultTransactionMessage {
    /// The number of signer pubkeys in the account_keys vec.
    pub num_signers: u8,
    /// The number of writable signer pubkeys in the account_keys vec.
    pub num_writable_signers: u8,
    /// The number of writable non-signer pubkeys in the account_keys vec.
    pub num_writable_non_signers: u8,
    /// The number of account keys in the transaction message. (only static, no dynamic)
    pub num_account_keys: u8,
    /// List of instructions making up the tx.
    pub instructions: Vec<MultisigCompiledInstruction>,
    /// List of address table lookups used to load additional accounts
    /// for this transaction.
    pub address_table_lookups: Vec<MultisigMessageAddressTableLookup>,
}

impl VaultTransactionMessage {
    /// Returns the number of all the account keys (static + dynamic) in the message.
    pub fn num_all_account_keys(&self) -> usize {
        let num_account_keys_from_lookups = self
            .address_table_lookups
            .iter()
            .map(|lookup| lookup.writable_indexes.len() + lookup.readonly_indexes.len())
            .sum::<usize>();

        usize::from(self.num_account_keys) + num_account_keys_from_lookups
    }

    /// Returns true if the account at the specified index is a part of static `account_keys` and was requested to be writable.
    pub fn is_static_writable_index(&self, key_index: usize) -> bool {
        let num_signers = usize::from(self.num_signers);
        let num_writable_signers = usize::from(self.num_writable_signers);
        let num_writable_non_signers = usize::from(self.num_writable_non_signers);

        if key_index >= self.num_account_keys.into() {
            // `index` is not a part of static `account_keys`.
            return false;
        }

        if key_index < num_writable_signers {
            // `index` is within the range of writable signer keys.
            return true;
        }

        if key_index >= num_signers {
            // `index` is within the range of non-signer keys.
            let index_into_non_signers = key_index.saturating_sub(num_signers);
            // Whether `index` is within the range of writable non-signer keys.
            return index_into_non_signers < num_writable_non_signers;
        }

        false
    }

    /// Returns true if the account at the specified index was requested to be a signer.
    pub fn is_signer_index(&self, key_index: usize) -> bool {
        key_index < usize::from(self.num_signers)
    }

    pub fn validate(&self) -> Result<()> {
        require!(
            self.num_signers <= self.num_account_keys,
            MultisigError::InvalidTransactionMessage
        );
        require!(
            self.num_writable_signers <= self.num_signers,
            MultisigError::InvalidTransactionMessage
        );
        require!(
            self.num_writable_non_signers <= self.num_account_keys.saturating_sub(self.num_signers),
            MultisigError::InvalidTransactionMessage
        );

        // Validate that all program ID indices and account indices are within the bounds of the account keys.
        for instruction in &self.instructions {
            require!(
                usize::from(instruction.program_id_index) < self.num_all_account_keys(),
                MultisigError::InvalidTransactionMessage
            );

            for account_index in &instruction.account_indexes {
                require!(
                    usize::from(*account_index) < self.num_all_account_keys(),
                    MultisigError::InvalidTransactionMessage
                );
            }
        }

        Ok(())
    }
}

/// Concise serialization schema for instructions that make up a transaction.
/// Closely mimics the Solana transaction wire format.
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct MultisigCompiledInstruction {
    pub program_id_index: u8,
    /// Indices into the tx's `account_keys` list indicating which accounts to pass to the instruction.
    pub account_indexes: Vec<u8>,
    /// Instruction data.
    pub data: Vec<u8>,
}

/// Address table lookups describe an on-chain address lookup table to use
/// for loading more readonly and writable accounts into a transaction.
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct MultisigMessageAddressTableLookup {
    /// Address lookup table account key.
    pub account_key: Pubkey,
    /// List of indexes used to load writable accounts.
    pub writable_indexes: Vec<u8>,
    /// List of indexes used to load readonly accounts.
    pub readonly_indexes: Vec<u8>,
}
