use crate::{
    state::{Escrow, SEED_ESCROW},
    EscrowEvent, MultiWallet, MultisigError, SEED_MULTISIG, SEED_VAULT,
};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

#[event_cpi]
#[derive(Accounts)]
pub struct CancelEscrowAsNonOwner<'info> {
    #[account(
        mut,
        seeds = [SEED_MULTISIG, escrow.create_key.as_ref()],
        bump = multi_wallet.bump
    )]
    pub multi_wallet: Box<Account<'info, MultiWallet>>,
    #[account(
        mut,
        close = proposer,
        seeds = [SEED_ESCROW, escrow.create_key.as_ref(), escrow.identifier.to_le_bytes().as_ref()],
        bump = escrow.bump,
    )]
    pub escrow: Box<Account<'info, Escrow>>,
    #[account(
        mut,
        seeds = [SEED_ESCROW, escrow.create_key.as_ref(), escrow.identifier.to_le_bytes().as_ref(), SEED_VAULT],
        bump = escrow.vault_bump.unwrap()
    )]
    pub escrow_vault: SystemAccount<'info>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = escrow_vault,
        associated_token::token_program = token_program
    )]
    pub escrow_token_vault: Option<Box<InterfaceAccount<'info, TokenAccount>>>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = proposer,
        associated_token::token_program = token_program
    )]
    pub proposer_token_account: Option<Box<InterfaceAccount<'info, TokenAccount>>>,
    pub mint: Option<Box<InterfaceAccount<'info, Mint>>>,
    #[account(mut)]
    pub proposer: Signer<'info>,
    pub token_program: Option<Interface<'info, TokenInterface>>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> CancelEscrowAsNonOwner<'info> {
    fn validate(&self) -> Result<()> {
        let Self {
            escrow, proposer, ..
        } = self;
        require!(
            escrow.proposer.is_some(),
            MultisigError::UnauthorisedToAcceptEscrowOffer
        );
        require!(
            escrow.proposer.unwrap() == proposer.key(),
            MultisigError::InvalidEscrowProposer
        );
        Ok(())
    }

    #[access_control(ctx.accounts.validate())]
    pub fn process(ctx: Context<'_, '_, '_, 'info, Self>) -> Result<()> {
        let multi_wallet = &mut ctx.accounts.multi_wallet;
        let escrow = &ctx.accounts.escrow;

        multi_wallet.remove_offer(escrow.key());

        escrow.escrow_transfer(
            &ctx.accounts.mint,
            &ctx.accounts.escrow_token_vault,
            &ctx.accounts.proposer_token_account,
            &Some(ctx.accounts.escrow_vault.to_account_info()),
            &Some(ctx.accounts.proposer.to_account_info()),
            &Some(ctx.accounts.escrow_vault.to_account_info()),
            &ctx.accounts.proposer.to_account_info(),
            &ctx.accounts.token_program,
            &ctx.accounts.system_program.to_account_info(),
        )?;

        emit_cpi!(EscrowEvent {
            create_key: escrow.create_key,
            identifier: escrow.identifier,
            is_pending: false,
            is_rejected: false,
            recipient: escrow.recipient,
            proposer: escrow.proposer,
            approver: None,
            new_members: escrow.new_members.clone(),
            threshold: escrow.threshold
        });

        Ok(())
    }
}
