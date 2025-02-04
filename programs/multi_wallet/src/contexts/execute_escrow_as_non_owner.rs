use crate::{
    state::{Escrow, MultiWallet, SEED_ESCROW},
    EscrowEvent, Member, MultisigError, SEED_MULTISIG,
};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

#[event_cpi]
#[derive(Accounts)]
pub struct ExecuteEscrowAsNonOwner<'info> {
    #[account(
        mut,
        seeds = [SEED_MULTISIG, escrow.create_key.as_ref()],
        bump = multi_wallet.bump
    )]
    pub multi_wallet: Box<Account<'info, MultiWallet>>,
    #[account(
        mut,
        close = payer,
        seeds = [SEED_ESCROW, escrow.create_key.as_ref(), escrow.identifier.to_le_bytes().as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Box<Account<'info, Escrow>>,
    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = recipient,
        associated_token::token_program = token_program
    )]
    pub recipient_token_account: Option<Box<InterfaceAccount<'info, TokenAccount>>>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = payer,
        associated_token::token_program = token_program
    )]
    pub payer_token_account: Option<Box<InterfaceAccount<'info, TokenAccount>>>,
    pub mint: Option<Box<InterfaceAccount<'info, Mint>>>,
    /// CHECK:
    #[account(mut)]
    pub recipient: UncheckedAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub token_program: Option<Interface<'info, TokenInterface>>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> ExecuteEscrowAsNonOwner<'info> {
    fn validate(&self) -> Result<()> {
        let Self {
            multi_wallet,
            escrow,
            recipient,
            ..
        } = self;

        require!(
            multi_wallet.pending_offers.contains(&escrow.key()),
            MultisigError::EscrowDoesNotExist
        );
        require!(
            escrow.proposer.is_none(),
            MultisigError::UnauthorisedToAcceptEscrowOffer
        );
        require!(
            escrow.recipient.pubkey.is_some()
                && recipient.key() == escrow.recipient.pubkey.unwrap(),
            MultisigError::InvalidEscrowRecipient
        );
        Ok(())
    }

    #[access_control(ctx.accounts.validate())]
    pub fn process(
        ctx: Context<'_, '_, '_, 'info, Self>,
        new_members: Vec<Member>,
        threshold: u8,
    ) -> Result<()> {
        let multi_wallet = &mut ctx.accounts.multi_wallet;
        let escrow = &ctx.accounts.escrow;

        multi_wallet.set_members(new_members.clone());
        multi_wallet.set_threshold(threshold);

        escrow.escrow_transfer(
            &ctx.accounts.mint,
            &ctx.accounts.payer_token_account,
            &ctx.accounts.recipient_token_account,
            &Some(ctx.accounts.payer.to_account_info()),
            &Some(ctx.accounts.recipient.to_account_info()),
            &None,
            &ctx.accounts.payer.to_account_info(),
            &ctx.accounts.token_program,
            &ctx.accounts.system_program.to_account_info(),
        )?;

        MultiWallet::check_state_validity(&multi_wallet.threshold, &multi_wallet.members)?;
        multi_wallet.clear_pending_offers();

        emit_cpi!(EscrowEvent {
            create_key: multi_wallet.create_key,
            identifier: escrow.identifier,
            is_pending: false,
            is_rejected: false,
            recipient: escrow.recipient,
            approver: Some(ctx.accounts.payer.key()),
            proposer: escrow.proposer,
            new_members: Some(new_members.clone()),
            threshold: Some(threshold)
        });

        Ok(())
    }
}
