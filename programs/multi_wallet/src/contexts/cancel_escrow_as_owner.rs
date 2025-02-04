use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token_interface::{Mint, TokenAccount, TokenInterface}};
use crate::{state::{Escrow, MultiWallet, SEED_ESCROW}, EscrowEvent, MultisigError, Permission, SEED_MULTISIG, SEED_VAULT};
use anchor_lang::solana_program::sysvar::instructions as tx_instructions;

#[event_cpi]
#[derive(Accounts)]
pub struct CancelEscrowAsOwner<'info> {
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
    pub escrow_vault: Option<SystemAccount<'info>>,
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
    /// CHECK:
    #[account(mut)]
    pub proposer: UncheckedAccount<'info>,
    /// CHECK: instructions sysvar
    #[account(address = tx_instructions::ID)]
    pub instruction_sysvar: UncheckedAccount<'info>,
    pub mint: Option<Box<InterfaceAccount<'info, Mint>>>,
    pub token_program: Option<Interface<'info, TokenInterface>>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}


impl<'info> CancelEscrowAsOwner<'info> {
    fn validate(&self, ctx: &Context<'_, '_, '_, 'info, Self>) -> Result<()> {
        let Self {
            multi_wallet,
            instruction_sysvar,
            ..
        } = self;
        MultiWallet::durable_nonce_check(instruction_sysvar)?;
        let account_infos = &[ctx.remaining_accounts, &ctx.accounts.to_account_infos()].concat();
        let unique_signers = multi_wallet.get_unique_signers(account_infos)?;

        require!(
            multi_wallet.threshold <= unique_signers.iter().filter(|x| x.permissions.is_some() && x.permissions.unwrap().has(Permission::VoteEscrow)).count().try_into().unwrap(),
            MultisigError::NotEnoughSigners
        );

        require!(
           unique_signers.iter().filter(|x| x.permissions.is_some() && x.permissions.unwrap().has(Permission::ExecuteEscrow)).count() >= 1,
            MultisigError::InsufficientSignerWithExecutePermission
        );


        Ok(())
    }

    #[access_control(ctx.accounts.validate(&ctx))]
    pub fn process(ctx: Context<'_, '_, '_, 'info, Self>) -> Result<()> {
        let escrow = &ctx.accounts.escrow;
        let multi_wallet = &mut ctx.accounts.multi_wallet;
        multi_wallet.remove_offer(escrow.key());

        if escrow.proposer.is_some() {
            if escrow.proposer.unwrap() == ctx.accounts.proposer.key() {
                escrow.escrow_transfer(
                    &ctx.accounts.mint,
                    &ctx.accounts.escrow_token_vault,
                    &ctx.accounts.proposer_token_account,
                    &ctx.accounts
                        .escrow_vault
                        .as_ref()
                        .map_or(None, |x| Some(x.to_account_info())),
                    &Some(ctx.accounts.proposer.to_account_info()),
                    &ctx.accounts
                        .escrow_vault
                        .as_ref()
                        .map_or(None, |x| Some(x.to_account_info())),
                    &ctx.accounts.proposer.to_account_info(),
                    &ctx.accounts.token_program,
                    &ctx.accounts.system_program.to_account_info(),
                )?;
            } else {
                return err!(MultisigError::InvalidEscrowProposer);
            }
        }

        emit_cpi!(EscrowEvent {
            create_key: escrow.create_key,
            identifier: escrow.identifier,
            is_pending: false,
            is_rejected: escrow.proposer.is_some(),
            recipient: escrow.recipient,
            approver: None,
            proposer: escrow.proposer,
            new_members: escrow.new_members.clone(),
            threshold: escrow.threshold
        });
        Ok(())
    }
}
