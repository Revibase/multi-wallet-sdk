use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token_interface::{Mint, TokenAccount, TokenInterface}};
use crate::{state::{Escrow, Member, MultiWallet, SEED_ESCROW, SEED_MULTISIG, SEED_VAULT}, EscrowEvent, MultisigError, Permission, Recipient};

#[event_cpi]
#[derive(Accounts)]
#[instruction(identifier: u64, new_owners: Vec<Member>)]
pub struct InitializeEscrowAsNonOwner<'info> {
    #[account(
        mut,
        seeds = [SEED_MULTISIG, multi_wallet.create_key.as_ref()],
        bump = multi_wallet.bump
    )]
    pub multi_wallet: Box<Account<'info, MultiWallet>>,
    #[account(
        init, 
        payer = proposer,
        space = Escrow::size(new_owners.len()),
        seeds = [SEED_ESCROW, multi_wallet.create_key.key().as_ref(), identifier.to_le_bytes().as_ref()],
        bump
    )]
    pub escrow: Box<Account<'info, Escrow>>,
    #[account(
        mut,
        seeds = [SEED_ESCROW, multi_wallet.create_key.key().as_ref(), identifier.to_le_bytes().as_ref(), SEED_VAULT],
        bump
    )]
    pub escrow_vault: SystemAccount<'info>,
    #[account(
        init_if_needed,
        payer = proposer,
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
    pub member: Signer<'info>,
    pub token_program: Option<Interface<'info, TokenInterface>>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}


impl<'info> InitializeEscrowAsNonOwner<'info> {
    fn validate(&self, threshold: &u8, new_members: &Vec<Member>) -> Result<()> {
        let Self {
            multi_wallet,
            member,
            ..
        } = self;
        require!(
            multi_wallet
                .members
                .iter()
                .filter(|x| x.pubkey.eq(member.key) && x.permissions.is_some() && x.permissions.unwrap().has(Permission::InitiateEscrow)).count() == 1,
            MultisigError::InsufficientSignerWithInitiatePermission
        );
        require!(multi_wallet.threshold > 1, MultisigError::MissingOwner);
        MultiWallet::check_state_validity(threshold, new_members)?;

        Ok(())
    }

    #[access_control(ctx.accounts.validate(&threshold, &new_members))]
    pub fn process(ctx: Context<'_, '_, '_, 'info, Self>, identifier: u64, new_members: Vec<Member>, amount: u64, threshold: u8,) -> Result<()> {
        let multi_wallet = &mut ctx.accounts.multi_wallet;
        let escrow = &mut ctx.accounts.escrow;

        multi_wallet.add_offer(escrow.key());

        MultiWallet::realloc_if_needed(
            multi_wallet.to_account_info(),
            multi_wallet.members.len(),
            multi_wallet.pending_offers.len(),
            Some(ctx.accounts.proposer.to_account_info()),
            Some(ctx.accounts.system_program.to_account_info()),
        )?;

        let mint = ctx.accounts.mint.as_ref().map_or(None, |x| Some(x.key()));
        escrow.bump = ctx.bumps.escrow;
        escrow.vault_bump = Some(ctx.bumps.escrow_vault);
        escrow.identifier = identifier;
        escrow.create_key = multi_wallet.create_key;
        escrow.new_members = Some(new_members);
        escrow.recipient = Recipient {
            pubkey: None,
            mint,
            amount,
        };
        escrow.proposer = Some(ctx.accounts.proposer.key());
        escrow.threshold = Some(threshold);

        escrow.escrow_transfer(
            &ctx.accounts.mint,
            &ctx.accounts.proposer_token_account,
            &ctx.accounts.escrow_token_vault,
            &Some(ctx.accounts.proposer.to_account_info()),
            &Some(ctx.accounts.escrow_vault.to_account_info()),
            &None,
            &ctx.accounts.proposer.to_account_info(),
            &ctx.accounts.token_program,
            &ctx.accounts.system_program.to_account_info(),
        )?;

        emit_cpi!(EscrowEvent {
            create_key: escrow.create_key,
            identifier: escrow.identifier,
            is_pending: true,
            is_rejected: false,
            recipient: escrow.recipient,
            approver: None,
            proposer: escrow.proposer,
            new_members: escrow.new_members.clone(),
            threshold: escrow.threshold
        });

        Ok(())
    }
}