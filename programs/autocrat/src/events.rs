use anchor_lang::prelude::*;

use crate::{ProposalInstruction, ProposalState};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CommonFields {
    pub slot: u64,
    pub unix_timestamp: i64,
}

impl CommonFields {
    pub fn new(clock: &Clock) -> Self {
        Self {
            slot: clock.slot,
            unix_timestamp: clock.unix_timestamp,
        }
    }
}

#[event]
pub struct InitializeDaoEvent {
    pub common: CommonFields,
    pub dao: Pubkey,
    pub token_mint: Pubkey,
    pub usdc_mint: Pubkey,
    pub treasury: Pubkey,
    pub pass_threshold_bps: u16,
    pub slots_per_proposal: u64,
    pub twap_initial_observation: u128,
    pub twap_max_observation_change_per_update: u128,
    pub min_quote_futarchic_liquidity: u64,
    pub min_base_futarchic_liquidity: u64,
}

#[event]
pub struct UpdateDaoEvent {
    pub common: CommonFields,
    pub dao: Pubkey,
    pub pass_threshold_bps: u16,
    pub slots_per_proposal: u64,
    pub twap_initial_observation: u128,
    pub twap_max_observation_change_per_update: u128,
    pub min_quote_futarchic_liquidity: u64,
    pub min_base_futarchic_liquidity: u64,
}

#[event]
pub struct InitializeProposalEvent {
    pub common: CommonFields,
    pub proposal: Pubkey,
    pub dao: Pubkey,
    pub question: Pubkey,
    pub quote_vault: Pubkey,
    pub base_vault: Pubkey,
    pub pass_amm: Pubkey,
    pub fail_amm: Pubkey,
    pub pass_lp_mint: Pubkey,
    pub fail_lp_mint: Pubkey,
    pub proposer: Pubkey,
    pub nonce: u64,
    pub number: u32,
    pub pass_lp_tokens_locked: u64,
    pub fail_lp_tokens_locked: u64,
    pub pda_bump: u8,
    pub instruction: ProposalInstruction,
}

#[event]
pub struct FinalizeProposalEvent {
    pub common: CommonFields,
    pub proposal: Pubkey,
    pub dao: Pubkey,
    pub pass_market_twap: u128,
    pub fail_market_twap: u128,
    pub threshold: u128,
    pub state: ProposalState,
}

#[event]
pub struct ExecuteProposalEvent {
    pub common: CommonFields,
    pub proposal: Pubkey,
    pub dao: Pubkey,
} 