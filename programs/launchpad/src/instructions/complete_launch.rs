use anchor_lang::Discriminator;
use anchor_lang::{prelude::*, system_program};
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, MintTo, SetAuthority, Token, TokenAccount, Transfer};
use anchor_spl::token::spl_token::instruction::AuthorityType;

use crate::error::LaunchpadError;
use crate::events::{CommonFields, LaunchCompletedEvent};
use crate::state::{Launch, LaunchState};
use crate::TOKENS_PER_USDC;
use raydium_cpmm_cpi::{
    cpi, instruction,
    program::RaydiumCpmm,
    states::{AmmConfig, OBSERVATION_SEED, POOL_LP_MINT_SEED, POOL_VAULT_SEED},
};

#[event_cpi]
#[derive(Accounts)]
pub struct CompleteLaunch<'info> {
    #[account(
        mut,
        has_one = treasury_usdc_account,
        has_one = launch_usdc_vault,
        has_one = launch_token_vault,
        has_one = launch_signer,
    )]
    pub launch: Account<'info, Launch>,

    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: just a signer
    #[account(mut)]
    pub launch_signer: UncheckedAccount<'info>,

    /// CHECK: pool vault and lp mint authority
    #[account(
        seeds = [
            raydium_cpmm_cpi::AUTH_SEED.as_bytes(),
        ],
        seeds::program = cp_swap_program,
        bump,
    )]
    pub authority: UncheckedAccount<'info>,

    #[account(
        mut,
        token::mint = usdc_mint,
        token::authority = launch_signer,
    )]
    pub launch_usdc_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = token_mint,
        token::authority = launch_signer,
    )]
    pub launch_token_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub treasury_usdc_account: Account<'info, TokenAccount>,

    /// Which config the pool belongs to.
    pub amm_config: Box<Account<'info, AmmConfig>>,

    /// CHECK: Initialize an account to store the pool state, init by cp-swap
    #[account(mut)]
    pub pool_state: Signer<'info>,

    /// Token_0 mint, the key must smaller then token_1 mint.
    #[account(mut)]
    pub token_mint: Box<Account<'info, Mint>>,

    /// Token_1 mint, the key must grater then token_0 mint.
    pub usdc_mint: Box<Account<'info, Mint>>,

    /// CHECK: pool lp mint, init by cp-swap
    #[account(
        mut,
        seeds = [
            POOL_LP_MINT_SEED.as_bytes(),
            pool_state.key().as_ref(),
        ],
        seeds::program = cp_swap_program,
        bump,
    )]
    pub lp_mint: UncheckedAccount<'info>,

    /// CHECK: creator lp ATA token account, init by cp-swap
    #[account(mut)]
    pub lp_vault: UncheckedAccount<'info>,

    /// CHECK: Token_0 vault for the pool, init by cp-swap
    #[account(
        mut,
        seeds = [
            POOL_VAULT_SEED.as_bytes(),
            pool_state.key().as_ref(),
            token_mint.key().as_ref()
        ],
        seeds::program = cp_swap_program,
        bump,
    )]
    pub pool_token_vault: UncheckedAccount<'info>,

    /// CHECK: Token_1 vault for the pool, init by cp-swap
    #[account(
        mut,
        seeds = [
            POOL_VAULT_SEED.as_bytes(),
            pool_state.key().as_ref(),
            usdc_mint.key().as_ref()
        ],
        seeds::program = cp_swap_program,
        bump,
    )]
    pub pool_usdc_vault: UncheckedAccount<'info>,

    /// create pool fee account
    #[account(
        mut,
        address= raydium_cpmm_cpi::create_pool_fee_reveiver::id(),
    )]
    pub create_pool_fee: Box<Account<'info, TokenAccount>>,

    /// CHECK: an account to store oracle observations, init by cp-swap
    #[account(
        mut,
        seeds = [
            OBSERVATION_SEED.as_bytes(),
            pool_state.key().as_ref(),
        ],
        seeds::program = cp_swap_program,
        bump,
    )]
    pub observation_state: UncheckedAccount<'info>,

    pub cp_swap_program: Program<'info, RaydiumCpmm>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl CompleteLaunch<'_> {
    pub fn validate(&self) -> Result<()> {
        let clock = Clock::get()?;

        // 7 days in slots (assuming 400ms per slot)
        const SLOTS_PER_DAY: u64 = 216_000; // (24 * 60 * 60 * 1000) / 400
        const REQUIRED_SLOTS: u64 = SLOTS_PER_DAY * 5;

        require!(
            self.launch.state == LaunchState::Live,
            LaunchpadError::InvalidLaunchState
        );

        require!(
            clock.slot >= self.launch.slot_started.saturating_add(REQUIRED_SLOTS),
            LaunchpadError::LaunchPeriodNotOver
        );

        Ok(())
    }

    pub fn handle(ctx: Context<Self>) -> Result<()> {
        let launch = &mut ctx.accounts.launch;

        let launch_usdc_balance = ctx.accounts.launch_usdc_vault.amount;

        if launch_usdc_balance >= launch.minimum_raise_amount {
            let usdc_to_lp = launch_usdc_balance.saturating_div(10);
            let usdc_to_dao = launch_usdc_balance.saturating_sub(usdc_to_lp);
            let token_to_lp = usdc_to_lp.saturating_mul(TOKENS_PER_USDC);

            let launch_key = launch.key();

            let seeds = &[
                b"launch_signer",
                launch_key.as_ref(),
                &[launch.launch_signer_pda_bump],
            ];
            let signer = &[&seeds[..]];

            token::mint_to(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    MintTo {
                        mint: ctx.accounts.token_mint.to_account_info(),
                        to: ctx.accounts.launch_token_vault.to_account_info(),
                        authority: ctx.accounts.launch_signer.to_account_info(),
                    },
                    signer,
                ),
                token_to_lp,
            )?;

            token::set_authority(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    SetAuthority {
                        account_or_mint: ctx.accounts.token_mint.to_account_info(),
                        current_authority: ctx.accounts.launch_signer.to_account_info(),
                    },
                    signer,
                ),
                AuthorityType::MintTokens,
                Some(launch.dao_treasury),
            )?;

            system_program::transfer(
                CpiContext::new(
                    ctx.accounts.system_program.to_account_info(),
                    system_program::Transfer {
                        from: ctx.accounts.payer.to_account_info(),
                        to: ctx.accounts.launch_signer.to_account_info(),
                    },
                ),
                3_000_000_000,
            )?;


            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.launch_usdc_vault.to_account_info(),
                        to: ctx.accounts.treasury_usdc_account.to_account_info(),
                        authority: ctx.accounts.launch_signer.to_account_info(),
                    },
                    signer,
                ),
                usdc_to_dao,
            )?;

            let (
                token_0_mint,
                token_1_mint,
                token_0_vault,
                token_1_vault,
                creator_token_0,
                creator_token_1,
                init_amount_0,
                init_amount_1,
            ) = if ctx.accounts.token_mint.key() < ctx.accounts.usdc_mint.key() {
                (
                    ctx.accounts.token_mint.to_account_info(),
                    ctx.accounts.usdc_mint.to_account_info(),
                    ctx.accounts.pool_token_vault.to_account_info(),
                    ctx.accounts.pool_usdc_vault.to_account_info(),
                    ctx.accounts.launch_token_vault.to_account_info(),
                    ctx.accounts.launch_usdc_vault.to_account_info(),
                    token_to_lp,
                    usdc_to_lp,
                )
            } else {
                (
                    ctx.accounts.usdc_mint.to_account_info(),
                    ctx.accounts.token_mint.to_account_info(),
                    ctx.accounts.pool_usdc_vault.to_account_info(),
                    ctx.accounts.pool_token_vault.to_account_info(),
                    ctx.accounts.launch_usdc_vault.to_account_info(),
                    ctx.accounts.launch_token_vault.to_account_info(),
                    usdc_to_lp,
                    token_to_lp,
                )
            };

            let cpi_accounts = cpi::accounts::Initialize {
                creator: ctx.accounts.launch_signer.to_account_info(),
                amm_config: ctx.accounts.amm_config.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
                pool_state: ctx.accounts.pool_state.to_account_info(),
                lp_mint: ctx.accounts.lp_mint.to_account_info(),
                creator_lp_token: ctx.accounts.lp_vault.to_account_info(),
                create_pool_fee: ctx.accounts.create_pool_fee.to_account_info(),
                observation_state: ctx.accounts.observation_state.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
                token_0_program: ctx.accounts.token_program.to_account_info(),
                token_1_program: ctx.accounts.token_program.to_account_info(),
                associated_token_program: ctx.accounts.associated_token_program.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
                token_0_mint,
                token_1_mint,
                token_0_vault,
                token_1_vault,
                creator_token_0,
                creator_token_1,
            };

            let ix = instruction::Initialize {
                init_amount_0,
                init_amount_1,
                open_time: 0,
            };
            let mut ix_data = Vec::with_capacity(256);
            ix_data.extend_from_slice(&instruction::Initialize::discriminator());
            AnchorSerialize::serialize(&ix, &mut ix_data)?;

            let ix = solana_program::instruction::Instruction {
                program_id: ctx.accounts.cp_swap_program.key(),
                accounts: cpi_accounts
                    .to_account_metas(None)
                    .into_iter()
                    .zip(cpi_accounts.to_account_infos())
                    .map(|mut pair| {
                        pair.0.is_signer = pair.1.is_signer;
                        if pair.0.pubkey == ctx.accounts.launch_signer.key() {
                            pair.0.is_signer = true;
                        }
                        pair.0
                    })
                    .collect(),
                data: ix_data,
            };
            solana_program::program::invoke_signed(&ix, &cpi_accounts.to_account_infos(), signer)?;

            launch.state = LaunchState::Complete;
        } else {
            launch.state = LaunchState::Refunding;
        }

        launch.seq_num += 1;

        let clock = Clock::get()?;
        emit_cpi!(LaunchCompletedEvent {
            common: CommonFields::new(&clock, launch.seq_num),
            launch: launch.key(),
            final_state: launch.state,
            total_committed: launch.committed_amount,
        });

        Ok(())
    }
}
