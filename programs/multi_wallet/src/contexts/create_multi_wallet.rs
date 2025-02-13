use anchor_lang::prelude::*;
use crate::{state::{ConfigEvent, MultiWallet, SEED_MULTISIG}, Member};

#[event_cpi]
#[derive(Accounts)]
#[instruction(create_key: Member)]
pub struct CreateMultiWallet<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init, 
        payer = payer, 
        space = MultiWallet::size(1,0), 
        seeds = [SEED_MULTISIG, create_key.pubkey.as_ref()],
        bump,
    )]
    pub multi_wallet: Account<'info, MultiWallet>,
    pub system_program: Program<'info, System>
}

impl<'info> CreateMultiWallet<'info> {
    pub fn process(ctx: Context<Self>, create_key: Member, metadata: Option<Pubkey>) -> Result<()> {
        let multi_wallet = &mut ctx.accounts.multi_wallet;
        multi_wallet.create_key = create_key.pubkey.key();
        multi_wallet.members = [create_key].to_vec();
        multi_wallet.bump = ctx.bumps.multi_wallet;
        multi_wallet.metadata = metadata;
        multi_wallet.threshold = 1;
        multi_wallet.pending_offers = Vec::new();
        MultiWallet::check_state_validity(&multi_wallet.threshold, &multi_wallet.members)?;

        emit_cpi!(ConfigEvent {
            create_key: multi_wallet.create_key,
            members: multi_wallet.members.clone(),
            threshold: multi_wallet.threshold,
            metadata: multi_wallet.metadata,
        });
        Ok(())
    }
}