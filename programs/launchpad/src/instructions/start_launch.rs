use anchor_lang::prelude::*;
use crate::state::{Launch, LaunchState};
use crate::error::LaunchpadError;
use crate::events::{LaunchStartedEvent, CommonFields};

#[event_cpi]
#[derive(Accounts)]
pub struct StartLaunch<'info> {
    #[account(
        mut,
        has_one = creator,
    )]
    pub launch: Account<'info, Launch>,

    pub creator: Signer<'info>,
}

impl StartLaunch<'_> {
    pub fn validate(&self) -> Result<()> {
        require!(
            self.launch.state == LaunchState::Initialized,
            LaunchpadError::LaunchNotInitialized
        );

        Ok(())
    }

    pub fn handle(ctx: Context<Self>) -> Result<()> {
        let launch = &mut ctx.accounts.launch;
        let clock = Clock::get()?;

        launch.state = LaunchState::Live;
        launch.slot_started = clock.slot;

        launch.seq_num += 1;

        emit_cpi!(LaunchStartedEvent {
            common: CommonFields::new(&clock, launch.seq_num),
            launch: ctx.accounts.launch.key(),
            creator: ctx.accounts.creator.key(),
            slot_started: clock.slot,
        });

        Ok(())
    }
}
