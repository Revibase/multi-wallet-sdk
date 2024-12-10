use crate::{error::MultisigError, id};
use anchor_lang::solana_program::sysvar::instructions as tx_instructions;
use anchor_lang::{prelude::*, system_program};
use std::{cmp::max, collections::HashSet};

#[account]
#[derive(Default, Debug)]
pub struct MultiWallet {
    pub create_key: Pubkey,
    pub threshold: u16,
    pub bump: u8,
    pub members: Vec<Pubkey>,
}
impl MultiWallet {
    pub fn size(members_length: usize) -> usize {
        8  + // anchor account discriminator
        32 + // create_key
        2  + // threshold
        1  + // bump
        4  + // members vector length
        members_length * 32 // members
    }

    pub fn validate(
        &self,
        remaining_accounts: &[AccountInfo],
        instruction_sysvar: &AccountInfo,
    ) -> Result<()> {
        MultiWallet::ensure_durable_nonce_is_not_used(instruction_sysvar)?;
        self.check_if_threshold_requirements_is_met(remaining_accounts)?;
        Ok(())
    }

    fn ensure_durable_nonce_is_not_used(instruction_sysvar: &AccountInfo) -> Result<()> {
        let ixn = tx_instructions::load_instruction_at_checked(0, instruction_sysvar)?;
        require!(
            !(ixn.program_id == system_program::ID && ixn.data.first() == Some(&4)),
            MultisigError::DurableNonceDetected
        );
        Ok(())
    }

    fn check_if_threshold_requirements_is_met(
        &self,
        remaining_accounts: &[AccountInfo],
    ) -> Result<()> {
        let mut unique_keys = HashSet::new();

        let unique_signers = remaining_accounts
            .iter()
            .filter(|account| unique_keys.insert(account.key))
            .filter(|account| account.is_signer && self.is_member(account.key()))
            .collect::<Vec<&AccountInfo>>();
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

        let new_size = max(
            current_account_size + (2 * 32), // We need to allocate more space. To avoid doing this operation too often, we increment it by 2 members.
            account_size_to_fit_members,
        );
        // Reallocate more space.
        AccountInfo::realloc(&multi_wallet, new_size, false)?;

        // If more lamports are needed, transfer them to the account.
        let rent_exempt_lamports = Rent::get().unwrap().minimum_balance(new_size).max(1);
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

        let has_duplicates = members.windows(2).any(|win| win[0].key() == win[1].key());
        require!(!has_duplicates, MultisigError::DuplicateMember);

        require!(*threshold > 0, MultisigError::InvalidThreshold);

        require!(
            usize::from(*threshold) <= members.len(),
            MultisigError::InvalidThreshold
        );

        Ok(())
    }

    /// Returns `Some(index)` if `member_pubkey` is a member, with `index` into the `members` vec.
    /// `None` otherwise.
    pub fn is_member(&self, member_pubkey: Pubkey) -> bool {
        self.members.contains(&member_pubkey)
    }

    /// Add `new_member` to the multisig `members` vec and sort the vec.
    pub fn add_members(&mut self, new_members: Vec<Pubkey>) {
        self.members.extend(new_members);
    }

    /// Remove `member_pubkey` from the multisig `members` vec.
    pub fn remove_members(&mut self, member_pubkeys: Vec<Pubkey>) {
        let set: HashSet<_> = member_pubkeys.into_iter().collect();
        self.members.retain(|x| !set.contains(x));
    }
}
