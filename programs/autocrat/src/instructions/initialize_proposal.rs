use super::*;

use amm::state::ONE_MINUTE_IN_SLOTS;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct InitializeProposalParams {
    pub description_url: String,
    pub instruction: ProposalInstruction,
    pub pass_lp_tokens_to_lock: u64,
    pub fail_lp_tokens_to_lock: u64,
    pub nonce: u64,
}

#[derive(Accounts)]
#[instruction(args: InitializeProposalParams)]
#[event_cpi]
pub struct InitializeProposal<'info> {
    #[account(
        init,
        payer = proposer,
        space = 2000,
        seeds = [b"proposal", proposer.key().as_ref(), &args.nonce.to_le_bytes()],
        bump
    )]
    pub proposal: Box<Account<'info, Proposal>>,
    #[account(mut)]
    pub dao: Box<Account<'info, Dao>>,
    #[account(
        constraint = question.oracle == proposal.key()
    )]
    pub question: Box<Account<'info, Question>>,
    #[account(
        constraint = quote_vault.underlying_token_mint == dao.usdc_mint,
        has_one = question,
    )]
    pub quote_vault: Account<'info, ConditionalVaultAccount>,
    #[account(
        constraint = base_vault.underlying_token_mint == dao.token_mint,
        has_one = question,
    )]
    pub base_vault: Account<'info, ConditionalVaultAccount>,
    #[account(
        constraint = pass_amm.base_mint == base_vault.conditional_token_mints[PASS_INDEX],
        constraint = pass_amm.quote_mint == quote_vault.conditional_token_mints[PASS_INDEX],
    )]
    pub pass_amm: Box<Account<'info, Amm>>,
    #[account(constraint = pass_amm.lp_mint == pass_lp_mint.key())]
    pub pass_lp_mint: Account<'info, Mint>,
    #[account(constraint = fail_amm.lp_mint == fail_lp_mint.key())]
    pub fail_lp_mint: Account<'info, Mint>,
    #[account(
        constraint = fail_amm.base_mint == base_vault.conditional_token_mints[FAIL_INDEX],
        constraint = fail_amm.quote_mint == quote_vault.conditional_token_mints[FAIL_INDEX],
    )]
    pub fail_amm: Box<Account<'info, Amm>>,
    #[account(
        mut,
        associated_token::mint = pass_amm.lp_mint,
        associated_token::authority = proposer,
    )]
    pub pass_lp_user_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = fail_amm.lp_mint,
        associated_token::authority = proposer,
    )]
    pub fail_lp_user_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = pass_amm.lp_mint,
        associated_token::authority = dao.treasury,
    )]
    pub pass_lp_vault_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = fail_amm.lp_mint,
        associated_token::authority = dao.treasury,
    )]
    pub fail_lp_vault_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub proposer: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

impl InitializeProposal<'_> {
    pub fn validate(&self) -> Result<()> {
        let clock = Clock::get()?;

        for amm in [&self.pass_amm, &self.fail_amm] {
            // an attacker is able to crank 5 observations before a proposal starts
            require!(
                clock.slot < amm.created_at_slot + (5 * ONE_MINUTE_IN_SLOTS),
                AutocratError::AmmTooOld
            );

            require_eq!(
                amm.oracle.initial_observation,
                self.dao.twap_initial_observation,
                AutocratError::InvalidInitialObservation
            );

            require_eq!(
                amm.oracle.max_observation_change_per_update,
                self.dao.twap_max_observation_change_per_update,
                AutocratError::InvalidMaxObservationChange
            );
        }

        // Should never be the case because the oracle is the proposal account, and you can't re-initialize a proposal
        assert!(!self.question.is_resolved());

        Ok(())
    }

    pub fn handle(ctx: Context<Self>, params: InitializeProposalParams) -> Result<()> {
        let Self {
            base_vault,
            quote_vault,
            question,
            proposal,
            dao,
            pass_amm,
            fail_amm,
            pass_lp_mint,
            fail_lp_mint,
            pass_lp_user_account,
            fail_lp_user_account,
            pass_lp_vault_account,
            fail_lp_vault_account,
            proposer,
            token_program,
            system_program: _,
            event_authority: _,
            program: _,
        } = ctx.accounts;

        let InitializeProposalParams {
            description_url,
            instruction,
            pass_lp_tokens_to_lock,
            fail_lp_tokens_to_lock,
            nonce,
        } = params;

        require_gte!(
            pass_lp_user_account.amount,
            pass_lp_tokens_to_lock,
            AutocratError::InsufficientLpTokenBalance
        );
        require_gte!(
            fail_lp_user_account.amount,
            fail_lp_tokens_to_lock,
            AutocratError::InsufficientLpTokenBalance
        );

        let (pass_base_liquidity, pass_quote_liquidity) =
            pass_amm.get_base_and_quote_withdrawable(pass_lp_tokens_to_lock, pass_lp_mint.supply);
        let (fail_base_liquidity, fail_quote_liquidity) =
            fail_amm.get_base_and_quote_withdrawable(fail_lp_tokens_to_lock, fail_lp_mint.supply);

        for base_liquidity in [pass_base_liquidity, fail_base_liquidity] {
            require_gte!(
                base_liquidity,
                dao.min_base_futarchic_liquidity,
                AutocratError::InsufficientLpTokenLock
            );
        }

        for quote_liquidity in [pass_quote_liquidity, fail_quote_liquidity] {
            require_gte!(
                quote_liquidity,
                dao.min_quote_futarchic_liquidity,
                AutocratError::InsufficientLpTokenLock
            );
        }

        for (amount, from, to) in [
            (
                pass_lp_tokens_to_lock,
                &pass_lp_user_account,
                &pass_lp_vault_account,
            ),
            (
                fail_lp_tokens_to_lock,
                &fail_lp_user_account,
                &fail_lp_vault_account,
            ),
        ] {
            token::transfer(
                CpiContext::new(
                    token_program.to_account_info(),
                    Transfer {
                        from: from.to_account_info(),
                        to: to.to_account_info(),
                        authority: proposer.to_account_info(),
                    },
                ),
                amount,
            )?;
        }

        let clock = Clock::get()?;

        dao.proposal_count += 1;

        proposal.set_inner(Proposal {
            number: dao.proposal_count,
            proposer: proposer.key(),
            description_url,
            slot_enqueued: clock.slot,
            state: ProposalState::Pending,
            instruction: instruction.clone(),
            pass_amm: pass_amm.key(),
            fail_amm: fail_amm.key(),
            base_vault: base_vault.key(),
            quote_vault: quote_vault.key(),
            dao: dao.key(),
            pass_lp_tokens_locked: pass_lp_tokens_to_lock,
            fail_lp_tokens_locked: fail_lp_tokens_to_lock,
            nonce,
            pda_bump: ctx.bumps.proposal,
            question: question.key(),
        });

        emit_cpi!(InitializeProposalEvent {
            common: CommonFields::new(&clock),
            proposal: proposal.key(),
            dao: dao.key(),
            question: question.key(),
            pass_amm: pass_amm.key(),
            fail_amm: fail_amm.key(),
            base_vault: base_vault.key(),
            quote_vault: quote_vault.key(),
            pass_lp_mint: pass_lp_mint.key(),
            fail_lp_mint: fail_lp_mint.key(),
            proposer: proposer.key(),
            nonce,
            number: dao.proposal_count,
            pass_lp_tokens_locked: pass_lp_tokens_to_lock,
            fail_lp_tokens_locked: fail_lp_tokens_to_lock,
            pda_bump: ctx.bumps.proposal,
            instruction,
        });

        Ok(())
    }
}
