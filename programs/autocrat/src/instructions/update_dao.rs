use super::*;

#[derive(Debug, Clone, Copy, AnchorSerialize, AnchorDeserialize, PartialEq, Eq)]
pub struct UpdateDaoParams {
    pub pass_threshold_bps: Option<u16>,
    pub slots_per_proposal: Option<u64>,
    pub twap_initial_observation: Option<u128>,
    pub twap_max_observation_change_per_update: Option<u128>,
    pub min_quote_futarchic_liquidity: Option<u64>,
    pub min_base_futarchic_liquidity: Option<u64>,
}

#[derive(Accounts)]
#[event_cpi]
pub struct UpdateDao<'info> {
    #[account(mut, has_one = treasury)]
    pub dao: Account<'info, Dao>,
    pub treasury: Signer<'info>,
}

impl UpdateDao<'_> {
    pub fn handle(ctx: Context<Self>, dao_params: UpdateDaoParams) -> Result<()> {
        let dao = &mut ctx.accounts.dao;

        macro_rules! update_dao_if_passed {
            ($field:ident) => {
                if let Some(value) = dao_params.$field {
                    dao.$field = value;
                }
            };
        }

        update_dao_if_passed!(pass_threshold_bps);
        update_dao_if_passed!(slots_per_proposal);
        update_dao_if_passed!(twap_initial_observation);
        update_dao_if_passed!(twap_max_observation_change_per_update);
        update_dao_if_passed!(min_quote_futarchic_liquidity);
        update_dao_if_passed!(min_base_futarchic_liquidity);

        dao.seq_num += 1;

        let clock = Clock::get()?;
        emit_cpi!(UpdateDaoEvent {
            common: CommonFields::new(&clock),
            dao: dao.key(),
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
