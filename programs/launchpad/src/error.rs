use anchor_lang::prelude::*;

#[error_code]
pub enum LaunchpadError {
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Supply must be zero")]
    SupplyNonZero,
    #[msg("Invalid launch state")]
    InvalidLaunchState,
    #[msg("Launch period not over")]
    LaunchPeriodNotOver,
    #[msg("Launch needs to be in refunding state to get a refund")]
    LaunchNotRefunding,
    #[msg("Launch must be initialized to be started")]
    LaunchNotInitialized,
    #[msg("Freeze authority can't be set on launchpad tokens")]
    FreezeAuthoritySet,
} 