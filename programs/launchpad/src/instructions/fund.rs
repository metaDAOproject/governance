use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer, MintTo};

use crate::state::{Launch, LaunchState};
use crate::error::LaunchpadError;
use crate::TOKENS_PER_USDC;
use crate::events::{LaunchFundedEvent, CommonFields};

#[event_cpi]
#[derive(Accounts)]
pub struct Fund<'info> {
    #[account(
        mut, 
        has_one = token_mint,
        has_one = launch_signer,
        constraint = launch.state == LaunchState::Live @ LaunchpadError::InvalidLaunchState
    )]
    pub launch: Account<'info, Launch>,

    /// CHECK: just a signer
    pub launch_signer: UncheckedAccount<'info>,

    #[account(
        mut,
        constraint = usdc_vault.key() == launch.launch_usdc_vault
    )]
    pub usdc_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub token_mint: Account<'info, Mint>,

    #[account(mut)]
    pub funder: Signer<'info>,

    #[account(mut)]
    pub funder_usdc_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub funder_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

impl Fund<'_> {
    pub fn validate(&self, amount: u64) -> Result<()> {
        require!(amount > 0, LaunchpadError::InvalidAmount);

        Ok(())
    }

    pub fn handle(ctx: Context<Self>, amount: u64) -> Result<()> {
        // Transfer USDC from funder to vault
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.funder_usdc_account.to_account_info(),
                    to: ctx.accounts.usdc_vault.to_account_info(),
                    authority: ctx.accounts.funder.to_account_info(),
                },
            ),
            amount,
        )?;

        // Transfer tokens from vault to funder (10,000 * USDC amount)
        // We don't need to worry about decimals because both USDC and token
        // have 6 decimals
        let token_amount = amount * TOKENS_PER_USDC;

        let launch_key = ctx.accounts.launch.key();

        let seeds = &[
            b"launch_signer",
            launch_key.as_ref(),
            &[ctx.accounts.launch.launch_signer_pda_bump],
        ];
        let signer = &[&seeds[..]];

        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.token_mint.to_account_info(),
                    to: ctx.accounts.funder_token_account.to_account_info(),
                    authority: ctx.accounts.launch_signer.to_account_info(),
                },
                signer,
            ),
            token_amount,
        )?;

        // Update committed amount
        ctx.accounts.launch.committed_amount += amount;

        ctx.accounts.launch.seq_num += 1;

        let clock = Clock::get()?;
        emit_cpi!(LaunchFundedEvent {
            common: CommonFields::new(&clock, ctx.accounts.launch.seq_num),
            launch: ctx.accounts.launch.key(),
            funder: ctx.accounts.funder.key(),
            amount,
            total_committed: ctx.accounts.launch.committed_amount,
        });

        Ok(())
    }
} 