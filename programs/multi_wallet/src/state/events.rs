use anchor_lang::prelude::*;

use super::{Member, Recipient};

#[event]
pub struct ConfigEvent {
    pub create_key: Pubkey,
    pub members: Vec<Member>,
    pub threshold: u8,
    pub metadata: Option<Pubkey>,
}

#[event]
pub struct EscrowEvent {
    pub create_key: Pubkey,
    pub identifier: u64,
    pub is_pending: bool,
    pub is_rejected: bool,
    pub proposer: Option<Pubkey>,
    pub approver: Option<Pubkey>,
    pub recipient: Recipient,
    pub new_members: Option<Vec<Member>>,
    pub threshold: Option<u8>,
}
