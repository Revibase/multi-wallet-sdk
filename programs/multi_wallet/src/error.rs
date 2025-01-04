use anchor_lang::prelude::*;

#[error_code]
pub enum MultisigError {
    #[msg("Durable nonce is not allowed")]
    DurableNonceDetected,
    #[msg("Found multiple members with the same pubkey")]
    DuplicateMember,
    #[msg("Members array is empty")]
    EmptyMembers,
    #[msg("Too many members, can be up to 65535")]
    TooManyMembers,
    #[msg("Invalid threshold, must be between 1 and number of members")]
    InvalidThreshold,
    #[msg("Threshold must be lower than 10")]
    ThresholdTooHigh,
    #[msg("TransactionMessage is malformed.")]
    InvalidTransactionMessage,
    #[msg("Number of signers does not meet the minumum threshold")]
    NotEnoughSigners,
    #[msg("Wrong number of accounts provided")]
    InvalidNumberOfAccounts,
    #[msg("Invalid account provided")]
    InvalidAccount,
    #[msg("Missing account")]
    MissingAccount,
    #[msg("Account is not owned by Multisig program")]
    IllegalAccountOwner,
    #[msg("Account is protected, it cannot be passed into a CPI as writable")]
    ProtectedAccount,
}
