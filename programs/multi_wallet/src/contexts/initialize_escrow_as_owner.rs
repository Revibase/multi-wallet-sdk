use anchor_lang::prelude::*;
use crate::{state::{Escrow, MultiWallet, SEED_ESCROW, SEED_MULTISIG}, EscrowEvent, MultisigError, Permission, Recipient};
use anchor_lang::solana_program::sysvar::instructions as tx_instructions;

#[event_cpi]
#[derive(Accounts)]
#[instruction(identifier: u64)]
pub struct InitializeEscrowAsOwner<'info> {
    #[account(
        mut, 
        seeds = [SEED_MULTISIG, multi_wallet.create_key.as_ref()],
        bump = multi_wallet.bump
    )]
    pub multi_wallet: Box<Account<'info, MultiWallet>>,
    #[account(
        init, 
        payer = payer,
        space = Escrow::size(0),
        seeds = [SEED_ESCROW, multi_wallet.create_key.key().as_ref(), identifier.to_le_bytes().as_ref()],
        bump
    )]
    pub escrow: Box<Account<'info, Escrow>>,
    /// CHECK: instructions sysvar
    #[account(address = tx_instructions::ID)]
    pub instruction_sysvar: UncheckedAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

impl<'info> InitializeEscrowAsOwner<'info> {
    fn validate(&self, ctx: &Context<'_, '_, '_, 'info, Self>) -> Result<()> {
        let Self {
            multi_wallet,
            instruction_sysvar,
            ..
        } = self;
        MultiWallet::durable_nonce_check(instruction_sysvar)?;
        let account_infos = &[ctx.remaining_accounts, &ctx.accounts.to_account_infos()].concat();
        let unique_signers = multi_wallet.get_unique_signers(account_infos)?;

        require!(multi_wallet.threshold > 1, MultisigError::MissingOwner);


        require!(
            unique_signers.iter().filter(|x| x.permissions.is_some() && x.permissions.unwrap().has(Permission::InitiateEscrow)).count() >= 1,
             MultisigError::InsufficientSignerWithInitiatePermission
         );

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
    pub fn process(ctx: Context<'_, '_, '_, 'info, Self>, identifier: u64, recipient: Pubkey, amount: u64, mint: Option<Pubkey>) -> Result<()> {
        let multi_wallet = &mut ctx.accounts.multi_wallet;
        let escrow = &mut ctx.accounts.escrow;
        multi_wallet.add_offer(escrow.key());

        MultiWallet::realloc_if_needed(
            multi_wallet.to_account_info(),
            multi_wallet.members.len(),
            multi_wallet.pending_offers.len(),
            Some(ctx.accounts.payer.to_account_info()),
            Some(ctx.accounts.system_program.to_account_info()),
        )?;

        escrow.bump = ctx.bumps.escrow;
        escrow.vault_bump = None;
        escrow.identifier = identifier;
        escrow.create_key = multi_wallet.create_key;
        escrow.new_members = None;
        escrow.threshold = None;
        escrow.recipient = Recipient {
            pubkey: Some(recipient),
            amount,
            mint,
        };
        escrow.proposer = None;

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