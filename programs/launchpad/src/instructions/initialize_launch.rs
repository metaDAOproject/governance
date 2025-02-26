use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use anchor_spl::associated_token::AssociatedToken;
use autocrat::ID as AUTOCRAT_PROGRAM_ID;
use autocrat::Dao;

use crate::state::{Launch, LaunchState};
use crate::events::{LaunchInitializedEvent, CommonFields};
use crate::error::LaunchpadError;

#[derive(AnchorSerialize, AnchorDeserialize, Copy, Clone)]
pub struct InitializeLaunchArgs {
    pub minimum_raise_amount: u64,
}

#[event_cpi]
#[derive(Accounts)]
pub struct InitializeLaunch<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + std::mem::size_of::<Launch>(),
        seeds = [b"launch", dao.key().as_ref()],
        bump
    )]
    pub launch: Account<'info, Launch>,

    /// CHECK: This is the launch signer
    pub launch_signer: UncheckedAccount<'info>,

    #[account(
        associated_token::mint = usdc_mint,
        associated_token::authority = launch_signer
    )]
    pub usdc_vault: Account<'info, TokenAccount>,

    #[account(
        associated_token::mint = token_mint,
        associated_token::authority = launch_signer
    )]
    pub token_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub creator: Signer<'info>,
    
    pub dao: Account<'info, Dao>,

    #[account(
        constraint = dao_treasury.key() == dao.treasury
    )]
    /// CHECK: This is the DAO treasury
    pub dao_treasury: AccountInfo<'info>,

    #[account(
        associated_token::mint = usdc_mint,
        associated_token::authority = dao_treasury
    )]
    pub treasury_usdc_account: Account<'info, TokenAccount>,

    
    /// CHECK: This is USDC mint
    #[account(
        constraint = dao.usdc_mint == usdc_mint.key(),
        mint::decimals = 6,
    )]
    pub usdc_mint: Account<'info, Mint>,

    /// CHECK: This is USDC mint
    #[account(
        mint::decimals = 6,
        mint::authority = launch_signer,
    )]
    pub token_mint: Account<'info, Mint>,
    
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl InitializeLaunch<'_> {
    pub fn validate(&self, _args: InitializeLaunchArgs) -> Result<()> {
        require_eq!(self.token_mint.supply, 0, LaunchpadError::SupplyNonZero);

        require!(self.token_mint.freeze_authority.is_none(), LaunchpadError::FreezeAuthoritySet);

        Ok(())
    }

    pub fn handle(
        ctx: Context<Self>,
        args: InitializeLaunchArgs,
    ) -> Result<()> {
        let (dao_treasury, _) = Pubkey::find_program_address(
            &[ctx.accounts.dao.key().as_ref()],
            &AUTOCRAT_PROGRAM_ID
        );

        // We need a launch treasury because it needs to be the SOL payer for the raydium pool,
        // and it doesn't work with PDAs that have data
        let (launch_signer, launch_signer_pda_bump) =
            Pubkey::find_program_address(&[b"launch_signer", ctx.accounts.launch.key().as_ref()], ctx.program_id);

        ctx.accounts.launch.set_inner(Launch {
            minimum_raise_amount: args.minimum_raise_amount,
            dao: ctx.accounts.dao.key(),
            creator: ctx.accounts.creator.key(),
            dao_treasury,
            treasury_usdc_account: ctx.accounts.treasury_usdc_account.key(),
            launch_signer,
            launch_signer_pda_bump,
            launch_usdc_vault: ctx.accounts.usdc_vault.key(),
            launch_token_vault: ctx.accounts.token_vault.key(),
            committed_amount: 0,
            token_mint: ctx.accounts.token_mint.key(),
            pda_bump: ctx.bumps.launch,
            seq_num: 0,
            state: LaunchState::Initialized,
            slot_started: 0,
        });

        let clock = Clock::get()?;
        emit_cpi!(LaunchInitializedEvent {
            common: CommonFields::new(&clock, 0),
            launch: ctx.accounts.launch.key(),
            dao: ctx.accounts.dao.key(),
            dao_treasury: ctx.accounts.dao_treasury.key(),
            creator: ctx.accounts.creator.key(),
            usdc_mint: ctx.accounts.usdc_mint.key(),
            token_mint: ctx.accounts.token_mint.key(),
            pda_bump: ctx.bumps.launch,
        });

        Ok(())
    }
}