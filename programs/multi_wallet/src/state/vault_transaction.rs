use anchor_lang::prelude::*;

use crate::MultisigError;

// Concise serialization schema for instructions that make up transaction.
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CompiledInstruction {
    pub program_id_index: u8,
    /// Indices into the tx's `account_keys` list indicating which accounts to pass to the instruction.
    pub account_indexes: Vec<u8>,
    /// Instruction data.
    pub data: Vec<u8>,
}

impl From<CompiledInstruction> for MultisigCompiledInstruction {
    fn from(compiled_instruction: CompiledInstruction) -> Self {
        Self {
            program_id_index: compiled_instruction.program_id_index,
            account_indexes: compiled_instruction.account_indexes.into(),
            data: compiled_instruction.data.into(),
        }
    }
}

/// Address table lookups describe an on-chain address lookup table to use
/// for loading more readonly and writable accounts in a single tx.
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct MessageAddressTableLookup {
    /// Address lookup table account key
    pub account_key: Pubkey,
    /// List of indexes used to load writable account addresses
    pub writable_indexes: Vec<u8>,
    /// List of indexes used to load readonly account addresses
    pub readonly_indexes: Vec<u8>,
}

impl From<MessageAddressTableLookup> for MultisigMessageAddressTableLookup {
    fn from(m: MessageAddressTableLookup) -> Self {
        Self {
            account_key: m.account_key,
            writable_indexes: m.writable_indexes.into(),
            readonly_indexes: m.readonly_indexes.into(),
        }
    }
}

/// Unvalidated instruction data, must be treated as untrusted.
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct TransactionMessage {
    /// The number of signer pubkeys in the account_keys vec.
    pub num_signers: u8,
    /// The number of writable signer pubkeys in the account_keys vec.
    pub num_writable_signers: u8,
    /// The number of writable non-signer pubkeys in the account_keys vec.
    pub num_writable_non_signers: u8,
    /// The list of unique account public keys (including program IDs) that will be used in the provided instructions.
    pub account_keys: Vec<Pubkey>,
    /// The list of instructions to execute.
    pub instructions: Vec<CompiledInstruction>,
    /// List of address table lookups used to load additional accounts
    /// for this transaction.
    pub address_table_lookups: Vec<MessageAddressTableLookup>,
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

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct VaultTransactionMessage {
    /// The number of signer pubkeys in the account_keys vec.
    pub num_signers: u8,
    /// The number of writable signer pubkeys in the account_keys vec.
    pub num_writable_signers: u8,
    /// The number of writable non-signer pubkeys in the account_keys vec.
    pub num_writable_non_signers: u8,
    /// Unique account pubkeys (including program IDs) required for execution of the tx.
    /// The signer pubkeys appear at the beginning of the vec, with writable pubkeys first, and read-only pubkeys following.
    /// The non-signer pubkeys follow with writable pubkeys first and read-only ones following.
    /// Program IDs are also stored at the end of the vec along with other non-signer non-writable pubkeys:
    ///
    /// ```plaintext
    /// [pubkey1, pubkey2, pubkey3, pubkey4, pubkey5, pubkey6, pubkey7, pubkey8]
    ///  |---writable---|  |---readonly---|  |---writable---|  |---readonly---|
    ///  |------------signers-------------|  |----------non-singers-----------|
    /// ```
    pub account_keys: Vec<Pubkey>,
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

        self.account_keys.len() + num_account_keys_from_lookups
    }

    /// Returns true if the account at the specified index is a part of static `account_keys` and was requested to be writable.
    pub fn is_static_writable_index(&self, key_index: usize) -> bool {
        let num_account_keys = self.account_keys.len();
        let num_signers = usize::from(self.num_signers);
        let num_writable_signers = usize::from(self.num_writable_signers);
        let num_writable_non_signers = usize::from(self.num_writable_non_signers);

        if key_index >= num_account_keys {
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
}

impl TryFrom<TransactionMessage> for VaultTransactionMessage {
    type Error = Error;

    fn try_from(message: TransactionMessage) -> Result<Self> {
        let num_all_account_keys = message.account_keys.len()
            + message
                .address_table_lookups
                .iter()
                .map(|lookup| lookup.writable_indexes.len() + lookup.readonly_indexes.len())
                .sum::<usize>();

        require!(
            usize::from(message.num_signers) <= message.account_keys.len(),
            MultisigError::InvalidTransactionMessage
        );
        require!(
            message.num_writable_signers <= message.num_signers,
            MultisigError::InvalidTransactionMessage
        );
        require!(
            usize::from(message.num_writable_non_signers)
                <= message
                    .account_keys
                    .len()
                    .saturating_sub(usize::from(message.num_signers)),
            MultisigError::InvalidTransactionMessage
        );

        for instruction in &message.instructions {
            require!(
                usize::from(instruction.program_id_index) < num_all_account_keys,
                MultisigError::InvalidTransactionMessage
            );

            for account_index in &instruction.account_indexes {
                require!(
                    usize::from(*account_index) < num_all_account_keys,
                    MultisigError::InvalidTransactionMessage
                );
            }
        }

        Ok(Self {
            num_signers: message.num_signers,
            num_writable_signers: message.num_writable_signers,
            num_writable_non_signers: message.num_writable_non_signers,
            account_keys: message.account_keys,
            instructions: message
                .instructions
                .into_iter()
                .map(MultisigCompiledInstruction::from)
                .collect(),
            address_table_lookups: message
                .address_table_lookups
                .into_iter()
                .map(MultisigMessageAddressTableLookup::from)
                .collect(),
        })
    }
}
