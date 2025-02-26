use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Burn, Mint};

use crate::state::{Launch, LaunchState};
use crate::error::LaunchpadError;
use crate::TOKENS_PER_USDC;
use crate::events::{LaunchRefundedEvent, CommonFields};

#[event_cpi]
#[derive(Accounts)]
pub struct Refund<'info> {
    #[account(
        mut,
        has_one = launch_usdc_vault,
        has_one = token_mint,
        has_one = launch_signer,
    )]
    pub launch: Account<'info, Launch>,

    #[account(mut)]
    pub launch_usdc_vault: Account<'info, TokenAccount>,

    /// CHECK: just a signer
    #[account(mut)]
    pub launch_signer: UncheckedAccount<'info>,

    #[account(mut)]
    pub funder: Signer<'info>,

    #[account(mut)]
    pub funder_usdc_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub funder_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub token_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
}

impl Refund<'_> {
    pub fn validate(&self) -> Result<()> {
        require!(self.launch.state == LaunchState::Refunding, LaunchpadError::LaunchNotRefunding);

        Ok(())
    }

    pub fn handle(ctx: Context<Self>) -> Result<()> {
        let launch = &mut ctx.accounts.launch;
        let launch_key = launch.key();

        // Get the amount of tokens the user has
        let user_token_balance = ctx.accounts.funder_token_account.amount;
        require!(user_token_balance > 0, LaunchpadError::InvalidAmount);

        let seeds = &[
            b"launch_signer",
            launch_key.as_ref(),
            &[launch.launch_signer_pda_bump],
        ];
        let signer = &[&seeds[..]];

        // Transfer USDC back to the user
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.launch_usdc_vault.to_account_info(),
                    to: ctx.accounts.funder_usdc_account.to_account_info(),
                    authority: ctx.accounts.launch_signer.to_account_info(),
                },
                signer,
            ),
            user_token_balance.saturating_div(TOKENS_PER_USDC),
        )?;

        // Burn tokens
        token::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Burn {
                    mint: ctx.accounts.token_mint.to_account_info(),
                    from: ctx.accounts.funder_token_account.to_account_info(),
                    authority: ctx.accounts.funder.to_account_info(),
                },
            ),
            user_token_balance,
        )?;
        
        launch.seq_num += 1;

        let clock = Clock::get()?;
        emit_cpi!(LaunchRefundedEvent {
            common: CommonFields::new(&clock, launch.seq_num),
            launch: ctx.accounts.launch.key(),
            funder: ctx.accounts.funder.key(),
            usdc_refunded: user_token_balance.saturating_div(TOKENS_PER_USDC),
            tokens_burned: user_token_balance,
        });

        Ok(())
    }
} 