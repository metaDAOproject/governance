export type Autocrat = {
  version: "0.4.0";
  name: "autocrat";
  instructions: [
    {
      name: "initializeDao";
      accounts: [
        {
          name: "dao";
          isMut: true;
          isSigner: true;
        },
        {
          name: "payer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "usdcMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "eventAuthority";
          isMut: false;
          isSigner: false;
        },
        {
          name: "program";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "params";
          type: {
            defined: "InitializeDaoParams";
          };
        }
      ];
    },
    {
      name: "initializeProposal";
      accounts: [
        {
          name: "proposal";
          isMut: true;
          isSigner: false;
        },
        {
          name: "dao";
          isMut: true;
          isSigner: false;
        },
        {
          name: "question";
          isMut: false;
          isSigner: false;
        },
        {
          name: "quoteVault";
          isMut: false;
          isSigner: false;
        },
        {
          name: "baseVault";
          isMut: false;
          isSigner: false;
        },
        {
          name: "passAmm";
          isMut: false;
          isSigner: false;
        },
        {
          name: "passLpMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "failLpMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "failAmm";
          isMut: false;
          isSigner: false;
        },
        {
          name: "passLpUserAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "failLpUserAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "passLpVaultAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "failLpVaultAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "proposer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "eventAuthority";
          isMut: false;
          isSigner: false;
        },
        {
          name: "program";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "params";
          type: {
            defined: "InitializeProposalParams";
          };
        }
      ];
    },
    {
      name: "finalizeProposal";
      accounts: [
        {
          name: "proposal";
          isMut: true;
          isSigner: false;
        },
        {
          name: "passAmm";
          isMut: false;
          isSigner: false;
        },
        {
          name: "failAmm";
          isMut: false;
          isSigner: false;
        },
        {
          name: "dao";
          isMut: false;
          isSigner: false;
        },
        {
          name: "question";
          isMut: true;
          isSigner: false;
        },
        {
          name: "treasury";
          isMut: false;
          isSigner: false;
        },
        {
          name: "passLpUserAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "failLpUserAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "passLpVaultAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "failLpVaultAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "vaultProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "vaultEventAuthority";
          isMut: false;
          isSigner: false;
        },
        {
          name: "eventAuthority";
          isMut: false;
          isSigner: false;
        },
        {
          name: "program";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "executeProposal";
      accounts: [
        {
          name: "proposal";
          isMut: true;
          isSigner: false;
        },
        {
          name: "dao";
          isMut: false;
          isSigner: false;
        },
        {
          name: "eventAuthority";
          isMut: false;
          isSigner: false;
        },
        {
          name: "program";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "updateDao";
      accounts: [
        {
          name: "dao";
          isMut: true;
          isSigner: false;
        },
        {
          name: "treasury";
          isMut: false;
          isSigner: true;
        },
        {
          name: "eventAuthority";
          isMut: false;
          isSigner: false;
        },
        {
          name: "program";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "daoParams";
          type: {
            defined: "UpdateDaoParams";
          };
        }
      ];
    }
  ];
  accounts: [
    {
      name: "dao";
      type: {
        kind: "struct";
        fields: [
          {
            name: "treasuryPdaBump";
            type: "u8";
          },
          {
            name: "treasury";
            type: "publicKey";
          },
          {
            name: "tokenMint";
            type: "publicKey";
          },
          {
            name: "usdcMint";
            type: "publicKey";
          },
          {
            name: "proposalCount";
            type: "u32";
          },
          {
            name: "passThresholdBps";
            type: "u16";
          },
          {
            name: "slotsPerProposal";
            type: "u64";
          },
          {
            name: "twapInitialObservation";
            docs: [
              "For manipulation-resistance the TWAP is a time-weighted average observation,",
              "where observation tries to approximate price but can only move by",
              "`twap_max_observation_change_per_update` per update. Because it can only move",
              "a little bit per update, you need to check that it has a good initial observation.",
              "Otherwise, an attacker could create a very high initial observation in the pass",
              "market and a very low one in the fail market to force the proposal to pass.",
              "",
              "We recommend setting an initial observation around the spot price of the token,",
              "and max observation change per update around 2% the spot price of the token.",
              "For example, if the spot price of META is $400, we'd recommend setting an initial",
              "observation of 400 (converted into the AMM prices) and a max observation change per",
              "update of 8 (also converted into the AMM prices). Observations can be updated once",
              "a minute, so 2% allows the proposal market to reach double the spot price or 0",
              "in 50 minutes."
            ];
            type: "u128";
          },
          {
            name: "twapMaxObservationChangePerUpdate";
            type: "u128";
          },
          {
            name: "minQuoteFutarchicLiquidity";
            docs: [
              "As an anti-spam measure and to help liquidity, you need to lock up some liquidity",
              "in both futarchic markets in order to create a proposal.",
              "",
              "For example, for META, we can use a `min_quote_futarchic_liquidity` of",
              "5000 * 1_000_000 (5000 USDC) and a `min_base_futarchic_liquidity` of",
              "10 * 1_000_000_000 (10 META)."
            ];
            type: "u64";
          },
          {
            name: "minBaseFutarchicLiquidity";
            type: "u64";
          },
          {
            name: "seqNum";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "proposal";
      type: {
        kind: "struct";
        fields: [
          {
            name: "number";
            type: "u32";
          },
          {
            name: "proposer";
            type: "publicKey";
          },
          {
            name: "descriptionUrl";
            type: "string";
          },
          {
            name: "slotEnqueued";
            type: "u64";
          },
          {
            name: "state";
            type: {
              defined: "ProposalState";
            };
          },
          {
            name: "instruction";
            type: {
              defined: "ProposalInstruction";
            };
          },
          {
            name: "passAmm";
            type: "publicKey";
          },
          {
            name: "failAmm";
            type: "publicKey";
          },
          {
            name: "baseVault";
            type: "publicKey";
          },
          {
            name: "quoteVault";
            type: "publicKey";
          },
          {
            name: "dao";
            type: "publicKey";
          },
          {
            name: "passLpTokensLocked";
            type: "u64";
          },
          {
            name: "failLpTokensLocked";
            type: "u64";
          },
          {
            name: "nonce";
            docs: [
              "We need to include a per-proposer nonce to prevent some weird proposal",
              "front-running edge cases. Using a `u64` means that proposers are unlikely",
              "to run into collisions, even if they generate nonces randomly - I've run",
              "the math :D"
            ];
            type: "u64";
          },
          {
            name: "pdaBump";
            type: "u8";
          },
          {
            name: "question";
            type: "publicKey";
          }
        ];
      };
    }
  ];
  types: [
    {
      name: "CommonFields";
      type: {
        kind: "struct";
        fields: [
          {
            name: "slot";
            type: "u64";
          },
          {
            name: "unixTimestamp";
            type: "i64";
          }
        ];
      };
    },
    {
      name: "InitializeDaoParams";
      type: {
        kind: "struct";
        fields: [
          {
            name: "twapInitialObservation";
            type: "u128";
          },
          {
            name: "twapMaxObservationChangePerUpdate";
            type: "u128";
          },
          {
            name: "minQuoteFutarchicLiquidity";
            type: "u64";
          },
          {
            name: "minBaseFutarchicLiquidity";
            type: "u64";
          },
          {
            name: "passThresholdBps";
            type: {
              option: "u16";
            };
          },
          {
            name: "slotsPerProposal";
            type: {
              option: "u64";
            };
          }
        ];
      };
    },
    {
      name: "InitializeProposalParams";
      type: {
        kind: "struct";
        fields: [
          {
            name: "descriptionUrl";
            type: "string";
          },
          {
            name: "instruction";
            type: {
              defined: "ProposalInstruction";
            };
          },
          {
            name: "passLpTokensToLock";
            type: "u64";
          },
          {
            name: "failLpTokensToLock";
            type: "u64";
          },
          {
            name: "nonce";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "UpdateDaoParams";
      type: {
        kind: "struct";
        fields: [
          {
            name: "passThresholdBps";
            type: {
              option: "u16";
            };
          },
          {
            name: "slotsPerProposal";
            type: {
              option: "u64";
            };
          },
          {
            name: "twapInitialObservation";
            type: {
              option: "u128";
            };
          },
          {
            name: "twapMaxObservationChangePerUpdate";
            type: {
              option: "u128";
            };
          },
          {
            name: "minQuoteFutarchicLiquidity";
            type: {
              option: "u64";
            };
          },
          {
            name: "minBaseFutarchicLiquidity";
            type: {
              option: "u64";
            };
          }
        ];
      };
    },
    {
      name: "ProposalAccount";
      type: {
        kind: "struct";
        fields: [
          {
            name: "pubkey";
            type: "publicKey";
          },
          {
            name: "isSigner";
            type: "bool";
          },
          {
            name: "isWritable";
            type: "bool";
          }
        ];
      };
    },
    {
      name: "ProposalInstruction";
      type: {
        kind: "struct";
        fields: [
          {
            name: "programId";
            type: "publicKey";
          },
          {
            name: "accounts";
            type: {
              vec: {
                defined: "ProposalAccount";
              };
            };
          },
          {
            name: "data";
            type: "bytes";
          }
        ];
      };
    },
    {
      name: "ProposalState";
      type: {
        kind: "enum";
        variants: [
          {
            name: "Pending";
          },
          {
            name: "Passed";
          },
          {
            name: "Failed";
          },
          {
            name: "Executed";
          }
        ];
      };
    }
  ];
  events: [
    {
      name: "InitializeDaoEvent";
      fields: [
        {
          name: "common";
          type: {
            defined: "CommonFields";
          };
          index: false;
        },
        {
          name: "dao";
          type: "publicKey";
          index: false;
        },
        {
          name: "tokenMint";
          type: "publicKey";
          index: false;
        },
        {
          name: "usdcMint";
          type: "publicKey";
          index: false;
        },
        {
          name: "treasury";
          type: "publicKey";
          index: false;
        },
        {
          name: "passThresholdBps";
          type: "u16";
          index: false;
        },
        {
          name: "slotsPerProposal";
          type: "u64";
          index: false;
        },
        {
          name: "twapInitialObservation";
          type: "u128";
          index: false;
        },
        {
          name: "twapMaxObservationChangePerUpdate";
          type: "u128";
          index: false;
        },
        {
          name: "minQuoteFutarchicLiquidity";
          type: "u64";
          index: false;
        },
        {
          name: "minBaseFutarchicLiquidity";
          type: "u64";
          index: false;
        }
      ];
    },
    {
      name: "UpdateDaoEvent";
      fields: [
        {
          name: "common";
          type: {
            defined: "CommonFields";
          };
          index: false;
        },
        {
          name: "dao";
          type: "publicKey";
          index: false;
        },
        {
          name: "passThresholdBps";
          type: "u16";
          index: false;
        },
        {
          name: "slotsPerProposal";
          type: "u64";
          index: false;
        },
        {
          name: "twapInitialObservation";
          type: "u128";
          index: false;
        },
        {
          name: "twapMaxObservationChangePerUpdate";
          type: "u128";
          index: false;
        },
        {
          name: "minQuoteFutarchicLiquidity";
          type: "u64";
          index: false;
        },
        {
          name: "minBaseFutarchicLiquidity";
          type: "u64";
          index: false;
        }
      ];
    },
    {
      name: "InitializeProposalEvent";
      fields: [
        {
          name: "common";
          type: {
            defined: "CommonFields";
          };
          index: false;
        },
        {
          name: "proposal";
          type: "publicKey";
          index: false;
        },
        {
          name: "dao";
          type: "publicKey";
          index: false;
        },
        {
          name: "question";
          type: "publicKey";
          index: false;
        },
        {
          name: "quoteVault";
          type: "publicKey";
          index: false;
        },
        {
          name: "baseVault";
          type: "publicKey";
          index: false;
        },
        {
          name: "passAmm";
          type: "publicKey";
          index: false;
        },
        {
          name: "failAmm";
          type: "publicKey";
          index: false;
        },
        {
          name: "passLpMint";
          type: "publicKey";
          index: false;
        },
        {
          name: "failLpMint";
          type: "publicKey";
          index: false;
        },
        {
          name: "proposer";
          type: "publicKey";
          index: false;
        },
        {
          name: "nonce";
          type: "u64";
          index: false;
        },
        {
          name: "number";
          type: "u32";
          index: false;
        },
        {
          name: "passLpTokensLocked";
          type: "u64";
          index: false;
        },
        {
          name: "failLpTokensLocked";
          type: "u64";
          index: false;
        },
        {
          name: "pdaBump";
          type: "u8";
          index: false;
        },
        {
          name: "instruction";
          type: {
            defined: "ProposalInstruction";
          };
          index: false;
        }
      ];
    },
    {
      name: "FinalizeProposalEvent";
      fields: [
        {
          name: "common";
          type: {
            defined: "CommonFields";
          };
          index: false;
        },
        {
          name: "proposal";
          type: "publicKey";
          index: false;
        },
        {
          name: "dao";
          type: "publicKey";
          index: false;
        },
        {
          name: "passMarketTwap";
          type: "u128";
          index: false;
        },
        {
          name: "failMarketTwap";
          type: "u128";
          index: false;
        },
        {
          name: "threshold";
          type: "u128";
          index: false;
        },
        {
          name: "state";
          type: {
            defined: "ProposalState";
          };
          index: false;
        }
      ];
    },
    {
      name: "ExecuteProposalEvent";
      fields: [
        {
          name: "common";
          type: {
            defined: "CommonFields";
          };
          index: false;
        },
        {
          name: "proposal";
          type: "publicKey";
          index: false;
        },
        {
          name: "dao";
          type: "publicKey";
          index: false;
        }
      ];
    }
  ];
  errors: [
    {
      code: 6000;
      name: "AmmTooOld";
      msg: "Amms must have been created within 5 minutes (counted in slots) of proposal initialization";
    },
    {
      code: 6001;
      name: "InvalidInitialObservation";
      msg: "An amm has an `initial_observation` that doesn't match the `dao`'s config";
    },
    {
      code: 6002;
      name: "InvalidMaxObservationChange";
      msg: "An amm has a `max_observation_change_per_update` that doesn't match the `dao`'s config";
    },
    {
      code: 6003;
      name: "InvalidSettlementAuthority";
      msg: "One of the vaults has an invalid `settlement_authority`";
    },
    {
      code: 6004;
      name: "ProposalTooYoung";
      msg: "Proposal is too young to be executed or rejected";
    },
    {
      code: 6005;
      name: "MarketsTooYoung";
      msg: "Markets too young for proposal to be finalized. TWAP might need to be cranked";
    },
    {
      code: 6006;
      name: "ProposalAlreadyFinalized";
      msg: "This proposal has already been finalized";
    },
    {
      code: 6007;
      name: "InvalidVaultNonce";
      msg: "A conditional vault has an invalid nonce. A nonce should encode the proposal number";
    },
    {
      code: 6008;
      name: "ProposalNotPassed";
      msg: "This proposal can't be executed because it isn't in the passed state";
    },
    {
      code: 6009;
      name: "InsufficientLpTokenBalance";
      msg: "The proposer has fewer pass or fail LP tokens than they requested to lock";
    },
    {
      code: 6010;
      name: "InsufficientLpTokenLock";
      msg: "The LP tokens passed in have less liquidity than the DAO's `min_quote_futarchic_liquidity` or `min_base_futachic_liquidity`";
    }
  ];
};

export const IDL: Autocrat = {
  version: "0.4.0",
  name: "autocrat",
  instructions: [
    {
      name: "initializeDao",
      accounts: [
        {
          name: "dao",
          isMut: true,
          isSigner: true,
        },
        {
          name: "payer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "usdcMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "eventAuthority",
          isMut: false,
          isSigner: false,
        },
        {
          name: "program",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "params",
          type: {
            defined: "InitializeDaoParams",
          },
        },
      ],
    },
    {
      name: "initializeProposal",
      accounts: [
        {
          name: "proposal",
          isMut: true,
          isSigner: false,
        },
        {
          name: "dao",
          isMut: true,
          isSigner: false,
        },
        {
          name: "question",
          isMut: false,
          isSigner: false,
        },
        {
          name: "quoteVault",
          isMut: false,
          isSigner: false,
        },
        {
          name: "baseVault",
          isMut: false,
          isSigner: false,
        },
        {
          name: "passAmm",
          isMut: false,
          isSigner: false,
        },
        {
          name: "passLpMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "failLpMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "failAmm",
          isMut: false,
          isSigner: false,
        },
        {
          name: "passLpUserAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "failLpUserAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "passLpVaultAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "failLpVaultAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "proposer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "eventAuthority",
          isMut: false,
          isSigner: false,
        },
        {
          name: "program",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "params",
          type: {
            defined: "InitializeProposalParams",
          },
        },
      ],
    },
    {
      name: "finalizeProposal",
      accounts: [
        {
          name: "proposal",
          isMut: true,
          isSigner: false,
        },
        {
          name: "passAmm",
          isMut: false,
          isSigner: false,
        },
        {
          name: "failAmm",
          isMut: false,
          isSigner: false,
        },
        {
          name: "dao",
          isMut: false,
          isSigner: false,
        },
        {
          name: "question",
          isMut: true,
          isSigner: false,
        },
        {
          name: "treasury",
          isMut: false,
          isSigner: false,
        },
        {
          name: "passLpUserAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "failLpUserAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "passLpVaultAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "failLpVaultAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "vaultProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "vaultEventAuthority",
          isMut: false,
          isSigner: false,
        },
        {
          name: "eventAuthority",
          isMut: false,
          isSigner: false,
        },
        {
          name: "program",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "executeProposal",
      accounts: [
        {
          name: "proposal",
          isMut: true,
          isSigner: false,
        },
        {
          name: "dao",
          isMut: false,
          isSigner: false,
        },
        {
          name: "eventAuthority",
          isMut: false,
          isSigner: false,
        },
        {
          name: "program",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "updateDao",
      accounts: [
        {
          name: "dao",
          isMut: true,
          isSigner: false,
        },
        {
          name: "treasury",
          isMut: false,
          isSigner: true,
        },
        {
          name: "eventAuthority",
          isMut: false,
          isSigner: false,
        },
        {
          name: "program",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "daoParams",
          type: {
            defined: "UpdateDaoParams",
          },
        },
      ],
    },
  ],
  accounts: [
    {
      name: "dao",
      type: {
        kind: "struct",
        fields: [
          {
            name: "treasuryPdaBump",
            type: "u8",
          },
          {
            name: "treasury",
            type: "publicKey",
          },
          {
            name: "tokenMint",
            type: "publicKey",
          },
          {
            name: "usdcMint",
            type: "publicKey",
          },
          {
            name: "proposalCount",
            type: "u32",
          },
          {
            name: "passThresholdBps",
            type: "u16",
          },
          {
            name: "slotsPerProposal",
            type: "u64",
          },
          {
            name: "twapInitialObservation",
            docs: [
              "For manipulation-resistance the TWAP is a time-weighted average observation,",
              "where observation tries to approximate price but can only move by",
              "`twap_max_observation_change_per_update` per update. Because it can only move",
              "a little bit per update, you need to check that it has a good initial observation.",
              "Otherwise, an attacker could create a very high initial observation in the pass",
              "market and a very low one in the fail market to force the proposal to pass.",
              "",
              "We recommend setting an initial observation around the spot price of the token,",
              "and max observation change per update around 2% the spot price of the token.",
              "For example, if the spot price of META is $400, we'd recommend setting an initial",
              "observation of 400 (converted into the AMM prices) and a max observation change per",
              "update of 8 (also converted into the AMM prices). Observations can be updated once",
              "a minute, so 2% allows the proposal market to reach double the spot price or 0",
              "in 50 minutes.",
            ],
            type: "u128",
          },
          {
            name: "twapMaxObservationChangePerUpdate",
            type: "u128",
          },
          {
            name: "minQuoteFutarchicLiquidity",
            docs: [
              "As an anti-spam measure and to help liquidity, you need to lock up some liquidity",
              "in both futarchic markets in order to create a proposal.",
              "",
              "For example, for META, we can use a `min_quote_futarchic_liquidity` of",
              "5000 * 1_000_000 (5000 USDC) and a `min_base_futarchic_liquidity` of",
              "10 * 1_000_000_000 (10 META).",
            ],
            type: "u64",
          },
          {
            name: "minBaseFutarchicLiquidity",
            type: "u64",
          },
          {
            name: "seqNum",
            type: "u64",
          },
        ],
      },
    },
    {
      name: "proposal",
      type: {
        kind: "struct",
        fields: [
          {
            name: "number",
            type: "u32",
          },
          {
            name: "proposer",
            type: "publicKey",
          },
          {
            name: "descriptionUrl",
            type: "string",
          },
          {
            name: "slotEnqueued",
            type: "u64",
          },
          {
            name: "state",
            type: {
              defined: "ProposalState",
            },
          },
          {
            name: "instruction",
            type: {
              defined: "ProposalInstruction",
            },
          },
          {
            name: "passAmm",
            type: "publicKey",
          },
          {
            name: "failAmm",
            type: "publicKey",
          },
          {
            name: "baseVault",
            type: "publicKey",
          },
          {
            name: "quoteVault",
            type: "publicKey",
          },
          {
            name: "dao",
            type: "publicKey",
          },
          {
            name: "passLpTokensLocked",
            type: "u64",
          },
          {
            name: "failLpTokensLocked",
            type: "u64",
          },
          {
            name: "nonce",
            docs: [
              "We need to include a per-proposer nonce to prevent some weird proposal",
              "front-running edge cases. Using a `u64` means that proposers are unlikely",
              "to run into collisions, even if they generate nonces randomly - I've run",
              "the math :D",
            ],
            type: "u64",
          },
          {
            name: "pdaBump",
            type: "u8",
          },
          {
            name: "question",
            type: "publicKey",
          },
        ],
      },
    },
  ],
  types: [
    {
      name: "CommonFields",
      type: {
        kind: "struct",
        fields: [
          {
            name: "slot",
            type: "u64",
          },
          {
            name: "unixTimestamp",
            type: "i64",
          },
        ],
      },
    },
    {
      name: "InitializeDaoParams",
      type: {
        kind: "struct",
        fields: [
          {
            name: "twapInitialObservation",
            type: "u128",
          },
          {
            name: "twapMaxObservationChangePerUpdate",
            type: "u128",
          },
          {
            name: "minQuoteFutarchicLiquidity",
            type: "u64",
          },
          {
            name: "minBaseFutarchicLiquidity",
            type: "u64",
          },
          {
            name: "passThresholdBps",
            type: {
              option: "u16",
            },
          },
          {
            name: "slotsPerProposal",
            type: {
              option: "u64",
            },
          },
        ],
      },
    },
    {
      name: "InitializeProposalParams",
      type: {
        kind: "struct",
        fields: [
          {
            name: "descriptionUrl",
            type: "string",
          },
          {
            name: "instruction",
            type: {
              defined: "ProposalInstruction",
            },
          },
          {
            name: "passLpTokensToLock",
            type: "u64",
          },
          {
            name: "failLpTokensToLock",
            type: "u64",
          },
          {
            name: "nonce",
            type: "u64",
          },
        ],
      },
    },
    {
      name: "UpdateDaoParams",
      type: {
        kind: "struct",
        fields: [
          {
            name: "passThresholdBps",
            type: {
              option: "u16",
            },
          },
          {
            name: "slotsPerProposal",
            type: {
              option: "u64",
            },
          },
          {
            name: "twapInitialObservation",
            type: {
              option: "u128",
            },
          },
          {
            name: "twapMaxObservationChangePerUpdate",
            type: {
              option: "u128",
            },
          },
          {
            name: "minQuoteFutarchicLiquidity",
            type: {
              option: "u64",
            },
          },
          {
            name: "minBaseFutarchicLiquidity",
            type: {
              option: "u64",
            },
          },
        ],
      },
    },
    {
      name: "ProposalAccount",
      type: {
        kind: "struct",
        fields: [
          {
            name: "pubkey",
            type: "publicKey",
          },
          {
            name: "isSigner",
            type: "bool",
          },
          {
            name: "isWritable",
            type: "bool",
          },
        ],
      },
    },
    {
      name: "ProposalInstruction",
      type: {
        kind: "struct",
        fields: [
          {
            name: "programId",
            type: "publicKey",
          },
          {
            name: "accounts",
            type: {
              vec: {
                defined: "ProposalAccount",
              },
            },
          },
          {
            name: "data",
            type: "bytes",
          },
        ],
      },
    },
    {
      name: "ProposalState",
      type: {
        kind: "enum",
        variants: [
          {
            name: "Pending",
          },
          {
            name: "Passed",
          },
          {
            name: "Failed",
          },
          {
            name: "Executed",
          },
        ],
      },
    },
  ],
  events: [
    {
      name: "InitializeDaoEvent",
      fields: [
        {
          name: "common",
          type: {
            defined: "CommonFields",
          },
          index: false,
        },
        {
          name: "dao",
          type: "publicKey",
          index: false,
        },
        {
          name: "tokenMint",
          type: "publicKey",
          index: false,
        },
        {
          name: "usdcMint",
          type: "publicKey",
          index: false,
        },
        {
          name: "treasury",
          type: "publicKey",
          index: false,
        },
        {
          name: "passThresholdBps",
          type: "u16",
          index: false,
        },
        {
          name: "slotsPerProposal",
          type: "u64",
          index: false,
        },
        {
          name: "twapInitialObservation",
          type: "u128",
          index: false,
        },
        {
          name: "twapMaxObservationChangePerUpdate",
          type: "u128",
          index: false,
        },
        {
          name: "minQuoteFutarchicLiquidity",
          type: "u64",
          index: false,
        },
        {
          name: "minBaseFutarchicLiquidity",
          type: "u64",
          index: false,
        },
      ],
    },
    {
      name: "UpdateDaoEvent",
      fields: [
        {
          name: "common",
          type: {
            defined: "CommonFields",
          },
          index: false,
        },
        {
          name: "dao",
          type: "publicKey",
          index: false,
        },
        {
          name: "passThresholdBps",
          type: "u16",
          index: false,
        },
        {
          name: "slotsPerProposal",
          type: "u64",
          index: false,
        },
        {
          name: "twapInitialObservation",
          type: "u128",
          index: false,
        },
        {
          name: "twapMaxObservationChangePerUpdate",
          type: "u128",
          index: false,
        },
        {
          name: "minQuoteFutarchicLiquidity",
          type: "u64",
          index: false,
        },
        {
          name: "minBaseFutarchicLiquidity",
          type: "u64",
          index: false,
        },
      ],
    },
    {
      name: "InitializeProposalEvent",
      fields: [
        {
          name: "common",
          type: {
            defined: "CommonFields",
          },
          index: false,
        },
        {
          name: "proposal",
          type: "publicKey",
          index: false,
        },
        {
          name: "dao",
          type: "publicKey",
          index: false,
        },
        {
          name: "question",
          type: "publicKey",
          index: false,
        },
        {
          name: "quoteVault",
          type: "publicKey",
          index: false,
        },
        {
          name: "baseVault",
          type: "publicKey",
          index: false,
        },
        {
          name: "passAmm",
          type: "publicKey",
          index: false,
        },
        {
          name: "failAmm",
          type: "publicKey",
          index: false,
        },
        {
          name: "passLpMint",
          type: "publicKey",
          index: false,
        },
        {
          name: "failLpMint",
          type: "publicKey",
          index: false,
        },
        {
          name: "proposer",
          type: "publicKey",
          index: false,
        },
        {
          name: "nonce",
          type: "u64",
          index: false,
        },
        {
          name: "number",
          type: "u32",
          index: false,
        },
        {
          name: "passLpTokensLocked",
          type: "u64",
          index: false,
        },
        {
          name: "failLpTokensLocked",
          type: "u64",
          index: false,
        },
        {
          name: "pdaBump",
          type: "u8",
          index: false,
        },
        {
          name: "instruction",
          type: {
            defined: "ProposalInstruction",
          },
          index: false,
        },
      ],
    },
    {
      name: "FinalizeProposalEvent",
      fields: [
        {
          name: "common",
          type: {
            defined: "CommonFields",
          },
          index: false,
        },
        {
          name: "proposal",
          type: "publicKey",
          index: false,
        },
        {
          name: "dao",
          type: "publicKey",
          index: false,
        },
        {
          name: "passMarketTwap",
          type: "u128",
          index: false,
        },
        {
          name: "failMarketTwap",
          type: "u128",
          index: false,
        },
        {
          name: "threshold",
          type: "u128",
          index: false,
        },
        {
          name: "state",
          type: {
            defined: "ProposalState",
          },
          index: false,
        },
      ],
    },
    {
      name: "ExecuteProposalEvent",
      fields: [
        {
          name: "common",
          type: {
            defined: "CommonFields",
          },
          index: false,
        },
        {
          name: "proposal",
          type: "publicKey",
          index: false,
        },
        {
          name: "dao",
          type: "publicKey",
          index: false,
        },
      ],
    },
  ],
  errors: [
    {
      code: 6000,
      name: "AmmTooOld",
      msg: "Amms must have been created within 5 minutes (counted in slots) of proposal initialization",
    },
    {
      code: 6001,
      name: "InvalidInitialObservation",
      msg: "An amm has an `initial_observation` that doesn't match the `dao`'s config",
    },
    {
      code: 6002,
      name: "InvalidMaxObservationChange",
      msg: "An amm has a `max_observation_change_per_update` that doesn't match the `dao`'s config",
    },
    {
      code: 6003,
      name: "InvalidSettlementAuthority",
      msg: "One of the vaults has an invalid `settlement_authority`",
    },
    {
      code: 6004,
      name: "ProposalTooYoung",
      msg: "Proposal is too young to be executed or rejected",
    },
    {
      code: 6005,
      name: "MarketsTooYoung",
      msg: "Markets too young for proposal to be finalized. TWAP might need to be cranked",
    },
    {
      code: 6006,
      name: "ProposalAlreadyFinalized",
      msg: "This proposal has already been finalized",
    },
    {
      code: 6007,
      name: "InvalidVaultNonce",
      msg: "A conditional vault has an invalid nonce. A nonce should encode the proposal number",
    },
    {
      code: 6008,
      name: "ProposalNotPassed",
      msg: "This proposal can't be executed because it isn't in the passed state",
    },
    {
      code: 6009,
      name: "InsufficientLpTokenBalance",
      msg: "The proposer has fewer pass or fail LP tokens than they requested to lock",
    },
    {
      code: 6010,
      name: "InsufficientLpTokenLock",
      msg: "The LP tokens passed in have less liquidity than the DAO's `min_quote_futarchic_liquidity` or `min_base_futachic_liquidity`",
    },
  ],
};
