use crate::{error::MultisigError, id};
use anchor_lang::solana_program::sysvar::instructions as tx_instructions;
use anchor_lang::{prelude::*, system_program};
use std::collections::HashSet;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub enum ConfigAction {
    AddMembers(Vec<Member>),
    RemoveMembers(Vec<Pubkey>),
    SetThreshold(u8),
    SetMetadata(Option<Pubkey>),
}


#[derive(AnchorDeserialize, AnchorSerialize, InitSpace, Eq, PartialEq, Clone, Hash)]
pub struct Member {
    pub pubkey: Pubkey,
    pub permissions: Option<Permissions>,
}

#[derive(Clone, Copy)]
pub enum Permission {
    InitiateTransaction = 1 << 0,
    VoteTransaction = 1 << 1,
    ExecuteTransaction = 1 << 2,
    InitiateEscrow = 1 << 3,
    VoteEscrow = 1 << 4,
    ExecuteEscrow = 1 << 5,
}

/// Bitmask for permissions.
#[derive(
    AnchorSerialize, AnchorDeserialize, InitSpace, Eq, PartialEq, Clone, Copy, Default, Debug,Hash
)]
pub struct Permissions {
    pub mask: u8,
}

impl Permissions {
    /// Currently unused.
    pub fn from_vec(permissions: &[Permission]) -> Self {
        let mut mask = 0;
        for permission in permissions {
            mask |= *permission as u8;
        }
        Self { mask }
    }

    pub fn has(&self, permission: Permission) -> bool {
        self.mask & (permission as u8) != 0
    }
}

#[account]
pub struct MultiWallet {
    pub create_key: Pubkey,
    pub threshold: u8,
    pub bump: u8,
    pub members: Vec<Member>,
    pub pending_offers: Vec<Pubkey>,
    pub metadata: Option<Pubkey>,
}

 // Helper struct to track permission counts
#[derive(Default)]
struct PermissionCounts {
    escrow_voters: usize,
    transaction_voters: usize,
    transaction_initiators: usize,
    escrow_initiators: usize,
    transaction_executors: usize,
    escrow_executors: usize,
}

impl MultiWallet {
    pub fn size(members_length: usize, num_offers: usize) -> usize {
        8  + // anchor account discriminator
        32 + // create_key
        1  + // threshold
        1  + // bump
        4  + // members vector length
        members_length * 34 + // members
        4 + // bool
        num_offers * 32 + 
        1 + // option
        32 // metadata
    }

    pub fn durable_nonce_check(instruction_sysvar: &AccountInfo) -> Result<()> {
        let ixn = tx_instructions::load_instruction_at_checked(0, instruction_sysvar)?;
        require!(
            !(ixn.program_id == system_program::ID && ixn.data.first() == Some(&4)),
            MultisigError::DurableNonceDetected
        );
        Ok(())
    }


    pub fn get_unique_signers(
        &self,
        all_accounts: &[AccountInfo],
    ) -> Result<HashSet<&Member>> {
       
        let unique_signers: HashSet<_> = self.members
            .iter()
            .filter(|member| {
                all_accounts.iter().any(|x| x.is_signer && x.key().eq(&member.pubkey))
            })
            .collect();
        Ok(unique_signers)
    }

    /// Returns `true` if the account was reallocated.
    pub fn realloc_if_needed<'a>(
        multi_wallet: AccountInfo<'a>,
        members_length: usize,
        num_offers: usize,
        rent_payer: Option<AccountInfo<'a>>,
        system_program: Option<AccountInfo<'a>>,
    ) -> Result<bool> {
        // Sanity checks
        require_keys_eq!(
            *multi_wallet.owner,
            id(),
            MultisigError::IllegalAccountOwner
        );

        let current_account_size = multi_wallet.data.borrow().len();
        let new_account_size = Self::size(members_length, num_offers);

        // Check if we need to reallocate space.
        if current_account_size >= new_account_size {
            return Ok(false);
        }

        // Reallocate more space.
        AccountInfo::realloc(&multi_wallet, new_account_size, false)?;

        // If more lamports are needed, transfer them to the account.
        let rent_exempt_lamports = Rent::get()
            .unwrap()
            .minimum_balance(new_account_size)
            .max(1);
        let top_up_lamports =
            rent_exempt_lamports.saturating_sub(multi_wallet.to_account_info().lamports());

        if top_up_lamports > 0 {
            let system_program = system_program.ok_or(MultisigError::MissingAccount)?;
            require_keys_eq!(
                *system_program.key,
                system_program::ID,
                MultisigError::InvalidAccount
            );

            let rent_payer = rent_payer.ok_or(MultisigError::MissingAccount)?;

            system_program::transfer(
                CpiContext::new(
                    system_program,
                    system_program::Transfer {
                        from: rent_payer,
                        to: multi_wallet,
                    },
                ),
                top_up_lamports,
            )?;
        }

        Ok(true)
    }

    // Makes sure the multisig state is valid.
    // This must be called at the end of every instruction that modifies a Multisig account.
    pub fn check_state_validity(threshold: &u8, members: &Vec<Member>) -> Result<()> {

        let member_count = members.len();
        require!(member_count > 0, MultisigError::EmptyMembers);
        require!(member_count <= usize::from(u16::MAX), MultisigError::TooManyMembers);
        require!(*threshold > 0, MultisigError::InvalidThreshold);
        require!(*threshold as usize <= member_count, MultisigError::InvalidThreshold);

        let mut seen = std::collections::HashSet::new();
        let mut permission_counts = PermissionCounts::default();

        for member in members {
            // Check for duplicate public keys
            if !seen.insert(&member.pubkey) {
                return Err(MultisigError::DuplicateMember.into());
            }

            // Count permissions
            if let Some(permissions) = &member.permissions {
                if permissions.has(Permission::VoteEscrow) {
                    permission_counts.escrow_voters += 1;
                }
                if permissions.has(Permission::VoteTransaction) {
                    permission_counts.transaction_voters += 1;
                }
                if permissions.has(Permission::InitiateTransaction) {
                    permission_counts.transaction_initiators += 1;
                }
                if permissions.has(Permission::InitiateEscrow) {
                    permission_counts.escrow_initiators += 1;
                }
                if permissions.has(Permission::ExecuteTransaction) {
                    permission_counts.transaction_executors += 1;
                }
                if permissions.has(Permission::ExecuteEscrow) {
                    permission_counts.escrow_executors += 1;
                }
            }
        }

        // Validate counts against the threshold
        require!(
            *threshold as usize <= 2,
            MultisigError::ThresholdTooHigh
        );

        require!(
            *threshold as usize <= permission_counts.transaction_voters,
            MultisigError::InsufficientSignersWithVotePermission
        );
        require!(
            *threshold as usize <= permission_counts.escrow_voters,
            MultisigError::InsufficientSignersWithVotePermission
        );


        // Ensure at least one member can initiate and execute transactions or escrows
        require!(
            permission_counts.transaction_initiators >= 1,
            MultisigError::InsufficientSignerWithInitiatePermission
        );
        require!(
            permission_counts.escrow_initiators >= 1,
            MultisigError::InsufficientSignerWithInitiatePermission
        );
        require!(
            permission_counts.transaction_executors >= 1,
            MultisigError::InsufficientSignerWithExecutePermission
        );
        require!(
            permission_counts.escrow_executors >= 1,
            MultisigError::InsufficientSignerWithExecutePermission
        );

        Ok(())
    }
    
    /// Add `new_member` to the multisig `members` vec and sort the vec.
    pub fn add_members(&mut self, new_members: Vec<Member>) {
        self.members.extend(new_members);
    }

    /// Remove `member_pubkeys` from the multisig `members` vec.
    pub fn remove_members(&mut self, member_pubkeys: Vec<Pubkey>) {
        let set: HashSet<_> = member_pubkeys.iter().collect();
        self.members.retain(|x| !set.contains(&x.pubkey));
    }

    pub fn set_members(&mut self, new_members: Vec<Member>) {
        self.members = new_members;
    }

    /// Sets the threshold of an existing multi-wallet.
    pub fn set_threshold(&mut self, new_threshold: u8) {
        self.threshold = new_threshold;
    }

    /// Sets the metadata of an existing multi-wallet.
    pub fn set_metadata(&mut self, metadata: Option<Pubkey>) {
        self.metadata = metadata;
    }

    pub fn add_offer(&mut self, offer: Pubkey) {
        self.pending_offers.push(offer);
    }

    pub fn remove_offer(&mut self, offer:Pubkey) {
        self.pending_offers.retain(|x| !x.eq(&offer));
    }

    pub fn clear_pending_offers<'info>(&mut self) {
     self.pending_offers.clear();
    }
}

