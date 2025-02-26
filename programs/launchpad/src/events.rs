use anchor_lang::prelude::*;
use crate::state::LaunchState;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CommonFields {
    pub slot: u64,
    pub unix_timestamp: i64,
    pub seq_num: u64,
}

impl CommonFields {
    pub fn new(clock: &Clock, seq_num: u64) -> Self {
        Self {
            slot: clock.slot,
            unix_timestamp: clock.unix_timestamp,
            seq_num
        }
    }
}

#[event]
pub struct LaunchInitializedEvent {
    pub common: CommonFields,
    pub launch: Pubkey,
    pub dao: Pubkey,
    pub dao_treasury: Pubkey,
    pub token_mint: Pubkey,
    pub creator: Pubkey,
    pub usdc_mint: Pubkey,
    pub pda_bump: u8,
}

#[event]
pub struct LaunchStartedEvent {
    pub common: CommonFields,
    pub launch: Pubkey,
    pub creator: Pubkey,
    pub slot_started: u64,
}

#[event]
pub struct LaunchFundedEvent {
    pub common: CommonFields,
    pub launch: Pubkey,
    pub funder: Pubkey,
    pub amount: u64,
    pub total_committed: u64,
}

#[event]
pub struct LaunchCompletedEvent {
    pub common: CommonFields,
    pub launch: Pubkey,
    pub final_state: LaunchState,
    pub total_committed: u64,
}

#[event]
pub struct LaunchRefundedEvent {
    pub common: CommonFields,
    pub launch: Pubkey,
    pub funder: Pubkey,
    pub usdc_refunded: u64,
    pub tokens_burned: u64,
}