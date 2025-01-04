use crate::{error::MultisigError, id};
use anchor_lang::solana_program::sysvar::instructions as tx_instructions;
use anchor_lang::{prelude::*, system_program};
use std::collections::HashSet;

#[account]
#[derive(Default, Debug)]
pub struct Member {
    pub pubkey: Pubkey,
    pub label: Option<u8>,
}

#[account]
#[derive(Default, Debug)]
pub struct MultiWallet {
    pub create_key: Pubkey,
    pub threshold: u8,
    pub bump: u8,
    pub members: Vec<Member>,
    pub metadata: Option<Pubkey>,
}

impl MultiWallet {
    pub fn size(members_length: usize) -> usize {
        8  + // anchor account discriminator
        32 + // create_key
        1  + // threshold
        1  + // bump
        4  + // members vector length
        members_length * 34 + // members
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

    pub fn threshold_check(&self, remaining_accounts: &[AccountInfo]) -> Result<()> {
        let unique_signers: HashSet<_> = remaining_accounts
            .iter()
            .filter(|account| {
                account.is_signer && self.members.iter().any(|x| x.pubkey.eq(&account.key()))
            })
            .map(|account| account.key)
            .collect();

        require!(
            self.threshold <= unique_signers.len().try_into().unwrap(),
            MultisigError::NotEnoughSigners
        );

        Ok(())
    }

    /// Returns `true` if the account was reallocated.
    pub fn realloc_if_needed<'a>(
        multi_wallet: AccountInfo<'a>,
        members_length: usize,
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
        let account_size_to_fit_members = MultiWallet::size(members_length);

        // Check if we need to reallocate space.
        if current_account_size >= account_size_to_fit_members {
            return Ok(false);
        }

        // Reallocate more space.
        AccountInfo::realloc(&multi_wallet, account_size_to_fit_members, false)?;

        // If more lamports are needed, transfer them to the account.
        let rent_exempt_lamports = Rent::get()
            .unwrap()
            .minimum_balance(account_size_to_fit_members)
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
    pub fn invariant(&self) -> Result<()> {
        let Self {
            threshold, members, ..
        } = self;

        require!(
            members.len() <= usize::from(u16::MAX),
            MultisigError::TooManyMembers
        );

        require!(members.len() > 0, MultisigError::EmptyMembers);

        let has_duplicates = members.windows(2).any(|win| win[0].pubkey == win[1].pubkey);
        require!(!has_duplicates, MultisigError::DuplicateMember);

        require!(*threshold > 0, MultisigError::InvalidThreshold);

        require!(*threshold < 10, MultisigError::ThresholdTooHigh);

        require!(
            usize::from(*threshold) <= members.len(),
            MultisigError::InvalidThreshold
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

    /// Sets the threshold of an existing multi-wallet.
    pub fn set_threshold(&mut self, new_threshold: u8) {
        self.threshold = new_threshold;
    }

    /// Sets the metadata of an existing multi-wallet.
    pub fn set_metadata(&mut self, metadata: Option<Pubkey>) {
        self.metadata = metadata;
    }
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub enum ConfigAction {
    AddMembers(Vec<Member>),
    RemoveMembers(Vec<Pubkey>),
    SetThreshold(u8),
    SetMetadata(Option<Pubkey>),
}
