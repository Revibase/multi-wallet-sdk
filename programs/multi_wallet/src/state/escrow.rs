use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};
use anchor_spl::token_interface::{
    close_account, transfer_checked, CloseAccount, Mint, TokenAccount, TokenInterface,
    TransferChecked,
};

use crate::{MultisigError, SEED_ESCROW};

use super::{Member, SEED_VAULT};

#[account]
#[derive(Default, Debug, Copy)]
pub struct Recipient {
    pub amount: u64,
    pub pubkey: Option<Pubkey>,
    pub mint: Option<Pubkey>, // if none it means the mint is native sol
}

#[account]
pub struct Escrow {
    pub create_key: Pubkey,
    pub identifier: u64,
    pub bump: u8,
    pub proposer: Option<Pubkey>,
    pub vault_bump: Option<u8>,
    pub recipient: Recipient,
    pub new_members: Option<Vec<Member>>,
    pub threshold: Option<u8>,
}

impl Escrow {
    pub fn size(new_members_length: usize) -> usize {
        8  + // anchor account discriminator
        32 + // multi_wallet
		8  + // identifier
		1  + // bump
        1  + // option 
        32 + // proposer
        1  + // vault bump
        80 + // recipient
		1  + // optional
		4  + // vector
        new_members_length * 34 +
        2 // threshold
    }

    pub fn escrow_transfer<'info>(
        &self,
        mint: &Option<Box<InterfaceAccount<'info, Mint>>>,
        from: &Option<Box<InterfaceAccount<'info, TokenAccount>>>,
        to: &Option<Box<InterfaceAccount<'info, TokenAccount>>>,
        from_native: &Option<AccountInfo<'info>>,
        to_native: &Option<AccountInfo<'info>>,
        escrow_vault: &Option<AccountInfo<'info>>,
        payer: &AccountInfo<'info>,
        token_program: &Option<Interface<'info, TokenInterface>>,
        system_program: &AccountInfo<'info>,
    ) -> Result<()> {
        if self.recipient.amount == 0 {
            return Ok(());
        }
        let multi_wallet_key = self.create_key.key();
        let identifier = self.identifier.to_le_bytes();
        let authority = escrow_vault.as_ref().map_or(payer, |x| x.as_ref());

        match self.recipient.mint {
            // Token transfer case
            Some(expected_mint) => {
                let mint_account = mint.as_ref().ok_or(MultisigError::MissingAccount)?;
                let from_account = from.as_ref().ok_or(MultisigError::MissingAccount)?;
                let to_account = to.as_ref().ok_or(MultisigError::MissingAccount)?;
                let token_account = token_program
                    .as_ref()
                    .ok_or(MultisigError::MissingAccount)?;

                require!(
                    expected_mint == mint_account.key(),
                    MultisigError::MissingAccount
                );

                let transfer_ctx = CpiContext::new(
                    token_account.to_account_info(),
                    TransferChecked {
                        from: from_account.to_account_info(),
                        mint: mint_account.to_account_info(),
                        to: to_account.to_account_info(),
                        authority: authority.to_account_info(),
                    },
                );
                if escrow_vault.is_some() {
                    let signer_seeds: &[&[&[u8]]] = &[&[
                        SEED_ESCROW,
                        multi_wallet_key.as_ref(),
                        identifier.as_ref(),
                        SEED_VAULT,
                        &[self.vault_bump.unwrap()],
                    ]];
                    transfer_checked(
                        transfer_ctx.with_signer(signer_seeds),
                        self.recipient.amount,
                        mint_account.decimals,
                    )?;
                } else {
                    transfer_checked(transfer_ctx, self.recipient.amount, mint_account.decimals)?;
                }

                // Close account if balance is zero
                if from_account.amount == 0 {
                    let close_ctx = CpiContext::new(
                        token_account.to_account_info(),
                        CloseAccount {
                            account: from_account.to_account_info(),
                            destination: payer.to_account_info(),
                            authority: authority.to_account_info(),
                        },
                    );
                    if escrow_vault.is_some() {
                        let signer_seeds: &[&[&[u8]]] = &[&[
                            SEED_ESCROW,
                            multi_wallet_key.as_ref(),
                            identifier.as_ref(),
                            SEED_VAULT,
                            &[self.vault_bump.unwrap()],
                        ]];
                        close_account(close_ctx.with_signer(signer_seeds))?;
                    } else {
                        close_account(close_ctx)?;
                    }
                }
            }
            // Native transfer case
            None => {
                let from_native_account =
                    from_native.as_ref().ok_or(MultisigError::MissingAccount)?;
                let to_native_account = to_native.as_ref().ok_or(MultisigError::MissingAccount)?;

                let transfer_ctx = CpiContext::new(
                    system_program.to_account_info(),
                    Transfer {
                        from: from_native_account.to_account_info(),
                        to: to_native_account.to_account_info(),
                    },
                );
                if escrow_vault.is_some() {
                    let signer_seeds: &[&[&[u8]]] = &[&[
                        SEED_ESCROW,
                        multi_wallet_key.as_ref(),
                        identifier.as_ref(),
                        SEED_VAULT,
                        &[self.vault_bump.unwrap()],
                    ]];
                    transfer(
                        transfer_ctx.with_signer(signer_seeds),
                        self.recipient.amount,
                    )?;
                } else {
                    transfer(transfer_ctx, self.recipient.amount)?;
                };
            }
        }

        Ok(())
    }
}
