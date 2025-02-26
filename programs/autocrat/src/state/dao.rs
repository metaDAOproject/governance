pub use super::*;

#[account]
pub struct Dao {
    pub treasury_pda_bump: u8,
    pub treasury: Pubkey,
    pub token_mint: Pubkey,
    pub usdc_mint: Pubkey,
    pub proposal_count: u32,
    // the percentage, in basis points, the pass price needs to be above the
    // fail price in order for the proposal to pass
    pub pass_threshold_bps: u16,
    pub slots_per_proposal: u64,
    /// For manipulation-resistance the TWAP is a time-weighted average observation,
    /// where observation tries to approximate price but can only move by
    /// `twap_max_observation_change_per_update` per update. Because it can only move
    /// a little bit per update, you need to check that it has a good initial observation.
    /// Otherwise, an attacker could create a very high initial observation in the pass
    /// market and a very low one in the fail market to force the proposal to pass.
    ///
    /// We recommend setting an initial observation around the spot price of the token,
    /// and max observation change per update around 2% the spot price of the token.
    /// For example, if the spot price of META is $400, we'd recommend setting an initial
    /// observation of 400 (converted into the AMM prices) and a max observation change per
    /// update of 8 (also converted into the AMM prices). Observations can be updated once
    /// a minute, so 2% allows the proposal market to reach double the spot price or 0
    /// in 50 minutes.
    pub twap_initial_observation: u128,
    pub twap_max_observation_change_per_update: u128,
    /// As an anti-spam measure and to help liquidity, you need to lock up some liquidity
    /// in both futarchic markets in order to create a proposal.
    ///
    /// For example, for META, we can use a `min_quote_futarchic_liquidity` of
    /// 5000 * 1_000_000 (5000 USDC) and a `min_base_futarchic_liquidity` of
    /// 10 * 1_000_000_000 (10 META).
    pub min_quote_futarchic_liquidity: u64,
    pub min_base_futarchic_liquidity: u64,
    pub seq_num: u64,
}
