use super::*;

#[derive(Debug, Clone, Copy, AnchorSerialize, AnchorDeserialize, PartialEq, Eq)]
pub struct InitializeDaoParams {
    pub twap_initial_observation: u128,
    pub twap_max_observation_change_per_update: u128,
    pub min_quote_futarchic_liquidity: u64,
    pub min_base_futarchic_liquidity: u64,
    pub pass_threshold_bps: Option<u16>,
    pub slots_per_proposal: Option<u64>,
}

#[derive(Accounts)]
#[event_cpi]
pub struct InitializeDAO<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + std::mem::size_of::<Dao>()
    )]
    pub dao: Account<'info, Dao>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_mint: Account<'info, Mint>,
    // todo: statically check that this is USDC given a feature flag
    #[account(mint::decimals = 6)]
    pub usdc_mint: Account<'info, Mint>,
}

impl InitializeDAO<'_> {
    pub fn handle(ctx: Context<Self>, params: InitializeDaoParams) -> Result<()> {
        let InitializeDaoParams {
            twap_initial_observation,
            twap_max_observation_change_per_update,
            min_base_futarchic_liquidity,
            min_quote_futarchic_liquidity,
            pass_threshold_bps,
            slots_per_proposal,
        } = params;

        let dao = &mut ctx.accounts.dao;

        let (treasury, treasury_pda_bump) =
            Pubkey::find_program_address(&[dao.key().as_ref()], ctx.program_id);

        dao.set_inner(Dao {
            token_mint: ctx.accounts.token_mint.key(),
            usdc_mint: ctx.accounts.usdc_mint.key(),
            treasury_pda_bump,
            treasury,
            proposal_count: 0,
            pass_threshold_bps: pass_threshold_bps.unwrap_or(DEFAULT_PASS_THRESHOLD_BPS),
            slots_per_proposal: slots_per_proposal.unwrap_or(THREE_DAYS_IN_SLOTS),
            twap_initial_observation,
            twap_max_observation_change_per_update,
            min_base_futarchic_liquidity,
            min_quote_futarchic_liquidity,
            seq_num: 0,
        });

        let clock = Clock::get()?;
        emit_cpi!(InitializeDaoEvent {
            common: CommonFields::new(&clock),
            dao: dao.key(),
            token_mint: ctx.accounts.token_mint.key(),
            usdc_mint: ctx.accounts.usdc_mint.key(),
            treasury,
            pass_threshold_bps: dao.pass_threshold_bps,
            slots_per_proposal: dao.slots_per_proposal,
            twap_initial_observation: dao.twap_initial_observation,
            twap_max_observation_change_per_update: dao.twap_max_observation_change_per_update,
            min_quote_futarchic_liquidity: dao.min_quote_futarchic_liquidity,
            min_base_futarchic_liquidity: dao.min_base_futarchic_liquidity,
        });

        Ok(())
    }
}
