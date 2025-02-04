use crate::{
    state::{Escrow, MultiWallet, SEED_ESCROW, SEED_MULTISIG, SEED_VAULT},
    EscrowEvent, MultisigError, Permission, Recipient,
};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::sysvar::instructions as tx_instructions;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

#[event_cpi]
#[derive(Accounts)]
pub struct ExecuteEscrowAsOwner<'info> {
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
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = recipient,
        associated_token::token_program = token_program
    )]
    pub recipient_token_account: Option<Box<InterfaceAccount<'info, TokenAccount>>>,
    pub mint: Option<Box<InterfaceAccount<'info, Mint>>>,
    /// CHECK: instructions sysvar
    #[account(address = tx_instructions::ID)]
    pub instruction_sysvar: UncheckedAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK:
    #[account(mut)]
    pub recipient: UncheckedAccount<'info>,
    pub token_program: Option<Interface<'info, TokenInterface>>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> ExecuteEscrowAsOwner<'info> {
    fn validate(&self, ctx: &Context<'_, '_, '_, 'info, Self>) -> Result<()> {
        let Self {
            multi_wallet,
            escrow,
            instruction_sysvar,
            ..
        } = self;

        MultiWallet::durable_nonce_check(instruction_sysvar)?;
        let account_infos = &[ctx.remaining_accounts, &ctx.accounts.to_account_infos()].concat();
        let unique_signers = multi_wallet.get_unique_signers(account_infos)?;

        require!(
            multi_wallet.threshold
                <= unique_signers
                    .iter()
                    .filter(|x| x.permissions.is_some()
                        && x.permissions.unwrap().has(Permission::VoteEscrow))
                    .count()
                    .try_into()
                    .unwrap(),
            MultisigError::NotEnoughSigners
        );

        require!(
            unique_signers
                .iter()
                .filter(|x| x.permissions.is_some()
                    && x.permissions.unwrap().has(Permission::ExecuteEscrow))
                .count()
                >= 1,
            MultisigError::InsufficientSignerWithExecutePermission
        );

        require!(
            multi_wallet.pending_offers.contains(&escrow.key()),
            MultisigError::EscrowDoesNotExist
        );
        require!(
            escrow.proposer.is_some(),
            MultisigError::UnauthorisedToAcceptEscrowOffer
        );
        Ok(())
    }

    #[access_control(ctx.accounts.validate(&ctx))]
    pub fn process(ctx: Context<'_, '_, '_, 'info, Self>) -> Result<()> {
        let escrow = &ctx.accounts.escrow;
        let multi_wallet = &mut ctx.accounts.multi_wallet;

        multi_wallet.set_members(escrow.new_members.as_ref().unwrap().clone());
        multi_wallet.set_threshold(escrow.threshold.unwrap());

        escrow.escrow_transfer(
            &ctx.accounts.mint,
            &ctx.accounts.escrow_token_vault,
            &ctx.accounts.recipient_token_account,
            &Some(ctx.accounts.escrow_vault.to_account_info()),
            &Some(ctx.accounts.recipient.to_account_info()),
            &Some(ctx.accounts.escrow_vault.to_account_info()),
            &ctx.accounts.recipient.to_account_info(),
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
            recipient: Recipient {
                pubkey: Some(ctx.accounts.recipient.key()),
                mint: escrow.recipient.mint,
                amount: escrow.recipient.amount,
            },
            approver: Some(ctx.accounts.recipient.key()),
            proposer: escrow.proposer,
            new_members: escrow.new_members.clone(),
            threshold: escrow.threshold
        });

        Ok(())
    }
}
