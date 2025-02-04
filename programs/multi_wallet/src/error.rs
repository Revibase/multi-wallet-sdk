use anchor_lang::prelude::*;

#[error_code]
pub enum MultisigError {
    #[msg("Durable nonce detected. Durable nonce is not allowed for this transaction.")]
    DurableNonceDetected,

    #[msg("Duplicate public keys found in the members array. Each member must have a unique public key.")]
    DuplicateMember,

    #[msg("The members array cannot be empty. Add at least one member.")]
    EmptyMembers,

    #[msg("Too many members specified. A maximum of 65,535 members is allowed.")]
    TooManyMembers,

    #[msg("Invalid threshold specified. The threshold must be between 1 and the total number of members.")]
    InvalidThreshold,

    #[msg("Threshold exceeds the maximum allowed limit of 2. Please choose a lower value.")]
    ThresholdTooHigh,

    #[msg("The provided TransactionMessage is malformed or improperly formatted.")]
    InvalidTransactionMessage,

    #[msg(
        "Insufficient signers. The number of signers must meet or exceed the minimum threshold."
    )]
    NotEnoughSigners,

    #[msg("Incorrect number of accounts provided. Verify the account count matches the expected number.")]
    InvalidNumberOfAccounts,

    #[msg("One or more accounts provided are invalid. Ensure all accounts meet the requirements.")]
    InvalidAccount,

    #[msg("Required account is missing. Ensure all necessary accounts are included.")]
    MissingAccount,

    #[msg("Account is not owned by the Multisig program. Only accounts under the Multisig program can be used.")]
    IllegalAccountOwner,

    #[msg(
        "The Multisig must be unlocked before performing this operation. Unlock it and try again."
    )]
    MultisigIsCurrentlyLocked,

    #[msg("The escrow account doesn't exist.")]
    EscrowDoesNotExist,

    #[msg("The members array cannot have a length of one. Add an additional member.")]
    MissingOwner,

    #[msg("The proposer must match the account stated in the escrow.")]
    InvalidEscrowProposer,

    #[msg("The recipient nust match the account stated in the escrow.")]
    InvalidEscrowRecipient,

    #[msg("Require at least one signer to have the execute permission.")]
    InsufficientSignerWithExecutePermission,

    #[msg("Require at least one signer to have the initiate permission.")]
    InsufficientSignerWithInitiatePermission,

    #[msg("Require threshold to be lesser than or equal to the number of members with vote permission.")]
    InsufficientSignersWithVotePermission,

    #[msg("You do not have permission to accept this offer.")]
    UnauthorisedToAcceptEscrowOffer,

    #[msg("Only the creator of the transaction buffer have permission to modify the buffer.")]
    UnauthorisedToModifyBuffer,

    #[msg("Final message buffer hash doesnt match the expected hash")]
    FinalBufferHashMismatch,

    #[msg("Final buffer size cannot exceed 4000 bytes")]
    FinalBufferSizeExceeded,

    #[msg("Final buffer size mismatch")]
    FinalBufferSizeMismatch,
}
