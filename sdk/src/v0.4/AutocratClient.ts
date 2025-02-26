import { AnchorProvider, IdlTypes, Program } from "@coral-xyz/anchor";
import {
  AccountInfo,
  AccountMeta,
  AddressLookupTableAccount,
  ComputeBudgetProgram,
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { PriceMath } from "./utils/priceMath.js";
import { ProposalInstruction, InitializeDaoParams } from "./types/index.js";

import { Autocrat, IDL as AutocratIDL } from "./types/autocrat.js";
import {
  ConditionalVault,
  IDL as ConditionalVaultIDL,
} from "./types/conditional_vault.js";

import BN from "bn.js";
import {
  AMM_PROGRAM_ID,
  AUTOCRAT_PROGRAM_ID,
  CONDITIONAL_VAULT_PROGRAM_ID,
  MAINNET_USDC,
  USDC_DECIMALS,
} from "./constants.js";
import {
  DEFAULT_CU_PRICE,
  InstructionUtils,
  MaxCUs,
  getAmmAddr,
  getAmmLpMintAddr,
  getConditionalTokenMintAddr,
  getDaoTreasuryAddr,
  getEventAuthorityAddr,
  getProposalAddr,
  getQuestionAddr,
  getVaultAddr,
  getVaultFinalizeMintAddr,
  getVaultRevertMintAddr,
} from "./utils/index.js";
import { ConditionalVaultClient } from "./ConditionalVaultClient.js";
import { AmmClient } from "./AmmClient.js";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
  unpackMint,
} from "@solana/spl-token";
import { sha256 } from "@noble/hashes/sha256";
import { Dao, Proposal } from "./types/index.js";

export type CreateClientParams = {
  provider: AnchorProvider;
  autocratProgramId?: PublicKey;
  conditionalVaultProgramId?: PublicKey;
  ammProgramId?: PublicKey;
};

export type ProposalVaults = {
  baseVault: PublicKey;
  quoteVault: PublicKey;
};

export class AutocratClient {
  public readonly provider: AnchorProvider;
  public readonly autocrat: Program<Autocrat>;
  public readonly vaultClient: ConditionalVaultClient;
  public readonly ammClient: AmmClient;
  public readonly luts: AddressLookupTableAccount[];

  constructor(
    provider: AnchorProvider,
    autocratProgramId: PublicKey,
    conditionalVaultProgramId: PublicKey,
    ammProgramId: PublicKey,
    luts: AddressLookupTableAccount[]
  ) {
    this.provider = provider;
    this.autocrat = new Program<Autocrat>(
      AutocratIDL,
      autocratProgramId,
      provider
    );
    this.vaultClient = ConditionalVaultClient.createClient({
      provider,
      conditionalVaultProgramId,
    });
    this.ammClient = AmmClient.createClient({ provider, ammProgramId });
    this.luts = luts;
  }

  public static createClient(
    createAutocratClientParams: CreateClientParams
  ): AutocratClient {
    let {
      provider,
      autocratProgramId,
      conditionalVaultProgramId,
      ammProgramId,
    } = createAutocratClientParams;

    const luts: AddressLookupTableAccount[] = [];

    return new AutocratClient(
      provider,
      autocratProgramId || AUTOCRAT_PROGRAM_ID,
      conditionalVaultProgramId || CONDITIONAL_VAULT_PROGRAM_ID,
      ammProgramId || AMM_PROGRAM_ID,
      luts
    );
  }

  getProgramId(): PublicKey {
    return this.autocrat.programId;
  }

  async getProposal(proposal: PublicKey): Promise<Proposal> {
    return this.autocrat.account.proposal.fetch(proposal);
  }

  async getDao(dao: PublicKey): Promise<Dao> {
    return this.autocrat.account.dao.fetch(dao);
  }

  async fetchProposal(proposal: PublicKey): Promise<Proposal | null> {
    return this.autocrat.account.proposal.fetchNullable(proposal);
  }

  async fetchDao(dao: PublicKey): Promise<Dao | null> {
    return this.autocrat.account.dao.fetchNullable(dao);
  }

  async deserializeProposal(
    accountInfo: AccountInfo<Buffer>
  ): Promise<Proposal> {
    return this.autocrat.coder.accounts.decode("proposal", accountInfo.data);
  }

  async deserializeDao(accountInfo: AccountInfo<Buffer>): Promise<Dao> {
    return this.autocrat.coder.accounts.decode("dao", accountInfo.data);
  }

  getProposalPdas(
    proposal: PublicKey,
    baseMint: PublicKey,
    quoteMint: PublicKey,
    dao: PublicKey
  ): {
    question: PublicKey;
    baseVault: PublicKey;
    quoteVault: PublicKey;
    passBaseMint: PublicKey;
    passQuoteMint: PublicKey;
    failBaseMint: PublicKey;
    failQuoteMint: PublicKey;
    passAmm: PublicKey;
    failAmm: PublicKey;
    passLp: PublicKey;
    failLp: PublicKey;
  } {
    let vaultProgramId = this.vaultClient.vaultProgram.programId;
    const [question] = getQuestionAddr(
      vaultProgramId,
      sha256(`Will ${proposal} pass?/FAIL/PASS`),
      proposal,
      2
    );
    const [daoTreasury] = getDaoTreasuryAddr(this.autocrat.programId, dao);
    const [baseVault] = getVaultAddr(
      this.vaultClient.vaultProgram.programId,
      question,
      baseMint
    );
    const [quoteVault] = getVaultAddr(
      this.vaultClient.vaultProgram.programId,
      question,
      quoteMint
    );

    const [failBaseMint] = getConditionalTokenMintAddr(
      vaultProgramId,
      baseVault,
      0
    );
    const [failQuoteMint] = getConditionalTokenMintAddr(
      vaultProgramId,
      quoteVault,
      0
    );

    const [passBaseMint] = getConditionalTokenMintAddr(
      vaultProgramId,
      baseVault,
      1
    );
    const [passQuoteMint] = getConditionalTokenMintAddr(
      vaultProgramId,
      quoteVault,
      1
    );

    const [passAmm] = getAmmAddr(
      this.ammClient.program.programId,
      passBaseMint,
      passQuoteMint
    );
    const [failAmm] = getAmmAddr(
      this.ammClient.program.programId,
      failBaseMint,
      failQuoteMint
    );

    const [passLp] = getAmmLpMintAddr(
      this.ammClient.program.programId,
      passAmm
    );
    const [failLp] = getAmmLpMintAddr(
      this.ammClient.program.programId,
      failAmm
    );

    return {
      question,
      baseVault,
      quoteVault,
      passBaseMint,
      passQuoteMint,
      failBaseMint,
      failQuoteMint,
      passAmm,
      failAmm,
      passLp,
      failLp,
    };
  }

  async initializeDao(
    tokenMint: PublicKey,
    tokenPriceUiAmount: number,
    minBaseFutarchicLiquidity: number,
    minQuoteFutarchicLiquidity: number,
    usdcMint: PublicKey = MAINNET_USDC,
    daoKeypair: Keypair = Keypair.generate()
  ): Promise<PublicKey> {
    let tokenDecimals = unpackMint(
      tokenMint,
      await this.provider.connection.getAccountInfo(tokenMint)
    ).decimals;

    let scaledPrice = PriceMath.getAmmPrice(
      tokenPriceUiAmount,
      tokenDecimals,
      USDC_DECIMALS
    );

    // console.log(
    //   PriceMath.getHumanPrice(scaledPrice, tokenDecimals, USDC_DECIMALS)
    // );

    await this.initializeDaoIx(
      daoKeypair,
      tokenMint,
      {
        twapInitialObservation: scaledPrice,
        twapMaxObservationChangePerUpdate: scaledPrice.divn(50),
        minQuoteFutarchicLiquidity: new BN(minQuoteFutarchicLiquidity).mul(
          new BN(10).pow(new BN(USDC_DECIMALS))
        ),
        minBaseFutarchicLiquidity: new BN(minBaseFutarchicLiquidity).mul(
          new BN(10).pow(new BN(tokenDecimals))
        ),
        passThresholdBps: null,
        slotsPerProposal: null,
      },
      usdcMint
    )
      .postInstructions([
        ComputeBudgetProgram.setComputeUnitLimit({
          units: MaxCUs.initializeDao,
        }),
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: DEFAULT_CU_PRICE,
        }),
      ])
      .rpc({ maxRetries: 5 });

    return daoKeypair.publicKey;
  }

  initializeDaoIx(
    daoKeypair: Keypair,
    tokenMint: PublicKey,
    params: InitializeDaoParams,
    usdcMint: PublicKey = MAINNET_USDC
  ) {
    return this.autocrat.methods
      .initializeDao(params)
      .accounts({
        dao: daoKeypair.publicKey,
        tokenMint,
        usdcMint,
      })
      .signers([daoKeypair]);
  }

  async initializeProposal(
    dao: PublicKey,
    descriptionUrl: string,
    instruction: ProposalInstruction,
    baseTokensToLP: BN,
    quoteTokensToLP: BN
  ): Promise<PublicKey> {
    const storedDao = await this.getDao(dao);

    const nonce = new BN(Math.random() * 2 ** 50);

    let [proposal] = getProposalAddr(
      this.autocrat.programId,
      this.provider.publicKey,
      nonce
    );

    await this.vaultClient.initializeQuestion(
      sha256(`Will ${proposal} pass?/FAIL/PASS`),
      proposal,
      2
    );

    const {
      baseVault,
      quoteVault,
      passAmm,
      failAmm,
      passBaseMint,
      passQuoteMint,
      failBaseMint,
      failQuoteMint,
      question,
    } = this.getProposalPdas(
      proposal,
      storedDao.tokenMint,
      storedDao.usdcMint,
      dao
    );

    // it's important that these happen in a single atomic transaction
    await this.vaultClient
      .initializeVaultIx(question, storedDao.tokenMint, 2)
      .postInstructions(
        await InstructionUtils.getInstructions(
          this.vaultClient.initializeVaultIx(question, storedDao.usdcMint, 2),
          this.ammClient.initializeAmmIx(
            passBaseMint,
            passQuoteMint,
            storedDao.twapInitialObservation,
            storedDao.twapMaxObservationChangePerUpdate
          ),
          this.ammClient.initializeAmmIx(
            failBaseMint,
            failQuoteMint,
            storedDao.twapInitialObservation,
            storedDao.twapMaxObservationChangePerUpdate
          )
        )
      )
      .rpc();

    await this.vaultClient
      .splitTokensIx(
        question,
        baseVault,
        storedDao.tokenMint,
        baseTokensToLP,
        2
      )
      .postInstructions(
        await InstructionUtils.getInstructions(
          this.vaultClient.splitTokensIx(
            question,
            quoteVault,
            storedDao.usdcMint,
            quoteTokensToLP,
            2
          )
        )
      )
      .rpc();

    await this.ammClient
      .addLiquidityIx(
        passAmm,
        passBaseMint,
        passQuoteMint,
        quoteTokensToLP,
        baseTokensToLP,
        new BN(0)
      )
      .postInstructions(
        await InstructionUtils.getInstructions(
          this.ammClient.addLiquidityIx(
            failAmm,
            failBaseMint,
            failQuoteMint,
            quoteTokensToLP,
            baseTokensToLP,
            new BN(0)
          )
        )
      )
      .rpc();

    // this is how many original tokens are created
    const lpTokens = quoteTokensToLP;

    await this.initializeProposalIx(
      descriptionUrl,
      instruction,
      dao,
      storedDao.tokenMint,
      storedDao.usdcMint,
      lpTokens,
      lpTokens,
      nonce,
      question
    ).rpc();

    return proposal;
  }

  // async createProposalTxAndPDAs(
  //   dao: PublicKey,
  //   descriptionUrl: string,
  //   instruction: ProposalInstruction,
  //   baseTokensToLP: BN,
  //   quoteTokensToLP: BN
  // ): Promise<
  //   [
  //     Transaction[],
  //     {
  //       proposalAcct: PublicKey;
  //       baseCondVaultAcct: PublicKey;
  //       quoteCondVaultAcct: PublicKey;
  //       passMarketAcct: PublicKey;
  //       failMarketAcct: PublicKey;
  //     }
  //   ]
  // > {
  //   const storedDao = await this.getDao(dao);

  //   const nonce = new BN(Math.random() * 2 ** 50);

  //   let [proposal] = getProposalAddr(
  //     this.autocrat.programId,
  //     this.provider.publicKey,
  //     nonce
  //   );

  //   const {
  //     baseVault,
  //     quoteVault,
  //     passAmm,
  //     failAmm,
  //     passBaseMint,
  //     passQuoteMint,
  //     failBaseMint,
  //     failQuoteMint,
  //   } = this.getProposalPdas(
  //     proposal,
  //     storedDao.tokenMint,
  //     storedDao.usdcMint,
  //     dao
  //   );

  //   // it's important that these happen in a single atomic transaction
  //   const initVaultTx = await this.vaultClient
  //     .initializeVaultIx(proposal, storedDao.tokenMint)
  //     .postInstructions(
  //       await InstructionUtils.getInstructions(
  //         this.vaultClient.initializeVaultIx(proposal, storedDao.usdcMint),
  //         this.ammClient.createAmmIx(
  //           passBaseMint,
  //           passQuoteMint,
  //           storedDao.twapInitialObservation,
  //           storedDao.twapMaxObservationChangePerUpdate
  //         ),
  //         this.ammClient.createAmmIx(
  //           failBaseMint,
  //           failQuoteMint,
  //           storedDao.twapInitialObservation,
  //           storedDao.twapMaxObservationChangePerUpdate
  //         )
  //       )
  //     )
  //     .transaction();

  //   const mintConditionalTokensTx = await this.vaultClient
  //     .mintConditionalTokensIx(baseVault, storedDao.tokenMint, baseTokensToLP)
  //     .postInstructions(
  //       await InstructionUtils.getInstructions(
  //         this.vaultClient.mintConditionalTokensIx(
  //           quoteVault,
  //           storedDao.usdcMint,
  //           quoteTokensToLP
  //         )
  //       )
  //     )
  //     .transaction();

  //   const addLiquidityTx = await this.ammClient
  //     .addLiquidityIx(
  //       passAmm,
  //       passBaseMint,
  //       passQuoteMint,
  //       quoteTokensToLP,
  //       baseTokensToLP,
  //       new BN(0)
  //     )
  //     .postInstructions(
  //       await InstructionUtils.getInstructions(
  //         this.ammClient.addLiquidityIx(
  //           failAmm,
  //           failBaseMint,
  //           failQuoteMint,
  //           quoteTokensToLP,
  //           baseTokensToLP,
  //           new BN(0)
  //         )
  //       )
  //     )
  //     .transaction();

  //   // this is how many original tokens are created
  //   const lpTokens = quoteTokensToLP;

  //   const initTx = await this.initializeProposalIx(
  //     descriptionUrl,
  //     instruction,
  //     dao,
  //     storedDao.tokenMint,
  //     storedDao.usdcMint,
  //     lpTokens,
  //     lpTokens,
  //     nonce,
  //     question
  //   ).transaction();

  //   return [
  //     [initVaultTx, mintConditionalTokensTx, addLiquidityTx, initTx],
  //     {
  //       baseCondVaultAcct: baseVault,
  //       quoteCondVaultAcct: quoteVault,
  //       failMarketAcct: failAmm,
  //       passMarketAcct: passAmm,
  //       proposalAcct: proposal,
  //     },
  //   ];
  // }

  initializeProposalIx(
    descriptionUrl: string,
    instruction: ProposalInstruction,
    dao: PublicKey,
    baseMint: PublicKey,
    quoteMint: PublicKey,
    passLpTokensToLock: BN,
    failLpTokensToLock: BN,
    nonce: BN,
    question: PublicKey
  ) {
    let [proposal] = getProposalAddr(
      this.autocrat.programId,
      this.provider.publicKey,
      nonce
    );
    const [daoTreasury] = getDaoTreasuryAddr(this.autocrat.programId, dao);
    const { baseVault, quoteVault, passAmm, failAmm } = this.getProposalPdas(
      proposal,
      baseMint,
      quoteMint,
      dao
    );

    const [passLp] = getAmmLpMintAddr(
      this.ammClient.program.programId,
      passAmm
    );
    const [failLp] = getAmmLpMintAddr(
      this.ammClient.program.programId,
      failAmm
    );

    const passLpVaultAccount = getAssociatedTokenAddressSync(
      passLp,
      daoTreasury,
      true
    );
    const failLpVaultAccount = getAssociatedTokenAddressSync(
      failLp,
      daoTreasury,
      true
    );

    return this.autocrat.methods
      .initializeProposal({
        descriptionUrl,
        instruction,
        passLpTokensToLock,
        failLpTokensToLock,
        nonce,
      })
      .accounts({
        question,
        proposal,
        dao,
        baseVault,
        quoteVault,
        passAmm,
        failAmm,
        passLpMint: passLp,
        failLpMint: failLp,
        passLpUserAccount: getAssociatedTokenAddressSync(
          passLp,
          this.provider.publicKey
        ),
        failLpUserAccount: getAssociatedTokenAddressSync(
          failLp,
          this.provider.publicKey
        ),
        passLpVaultAccount,
        failLpVaultAccount,
        proposer: this.provider.publicKey,
      })
      .preInstructions([
        createAssociatedTokenAccountIdempotentInstruction(
          this.provider.publicKey,
          passLpVaultAccount,
          daoTreasury,
          passLp
        ),
        createAssociatedTokenAccountIdempotentInstruction(
          this.provider.publicKey,
          failLpVaultAccount,
          daoTreasury,
          failLp
        ),
      ]);
  }

  async finalizeProposal(proposal: PublicKey) {
    let storedProposal = await this.getProposal(proposal);
    let storedDao = await this.getDao(storedProposal.dao);

    return this.finalizeProposalIx(
      proposal,
      storedProposal.instruction,
      storedProposal.dao,
      storedDao.tokenMint,
      storedDao.usdcMint,
      storedProposal.proposer
    ).rpc();
  }

  finalizeProposalIx(
    proposal: PublicKey,
    instruction: any,
    dao: PublicKey,
    daoToken: PublicKey,
    usdc: PublicKey,
    proposer: PublicKey
  ) {
    let vaultProgramId = this.vaultClient.vaultProgram.programId;

    const [daoTreasury] = getDaoTreasuryAddr(this.autocrat.programId, dao);
    const { question, passAmm, failAmm } = this.getProposalPdas(
      proposal,
      daoToken,
      usdc,
      dao
    );

    const [passLp] = getAmmLpMintAddr(
      this.ammClient.program.programId,
      passAmm
    );
    const [failLp] = getAmmLpMintAddr(
      this.ammClient.program.programId,
      failAmm
    );

    const [vaultEventAuthority] = getEventAuthorityAddr(vaultProgramId);

    return this.autocrat.methods.finalizeProposal().accounts({
      proposal,
      passAmm,
      failAmm,
      dao,
      question,
      // baseVault,
      // quoteVault,
      passLpUserAccount: getAssociatedTokenAddressSync(passLp, proposer),
      failLpUserAccount: getAssociatedTokenAddressSync(failLp, proposer),
      passLpVaultAccount: getAssociatedTokenAddressSync(
        passLp,
        daoTreasury,
        true
      ),
      failLpVaultAccount: getAssociatedTokenAddressSync(
        failLp,
        daoTreasury,
        true
      ),
      vaultProgram: this.vaultClient.vaultProgram.programId,
      treasury: daoTreasury,
      vaultEventAuthority,
    });
  }

  async executeProposal(proposal: PublicKey) {
    let storedProposal = await this.getProposal(proposal);

    return this.executeProposalIx(
      proposal,
      storedProposal.dao,
      storedProposal.instruction
    ).rpc();
  }

  executeProposalIx(proposal: PublicKey, dao: PublicKey, instruction: any) {
    const [daoTreasury] = getDaoTreasuryAddr(this.autocrat.programId, dao);
    return this.autocrat.methods
      .executeProposal()
      .accounts({
        proposal,
        dao,
        // daoTreasury,
      })
      .remainingAccounts(
        instruction.accounts
          .concat({
            pubkey: instruction.programId,
            isWritable: false,
            isSigner: false,
          })
          .map((meta: AccountMeta) =>
            meta.pubkey.equals(daoTreasury)
              ? { ...meta, isSigner: false }
              : meta
          )
      );
  }

  // cranks the TWAPs of multiple proposals' markets. there's a limit on the
  // number of proposals you can pass in, which I can't determine rn because
  // there aren't enough proposals on devnet
  async crankProposalMarkets(
    proposals: PublicKey[],
    priorityFeeMicroLamports: number
  ) {
    const amms: PublicKey[] = [];

    for (const proposal of proposals) {
      const storedProposal = await this.getProposal(proposal);
      amms.push(storedProposal.passAmm);
      amms.push(storedProposal.failAmm);
    }

    while (true) {
      let ixs: TransactionInstruction[] = [];

      for (const amm of amms) {
        ixs.push(await this.ammClient.crankThatTwapIx(amm).instruction());
      }

      let tx = new Transaction();
      tx.add(
        ComputeBudgetProgram.setComputeUnitLimit({ units: 4_000 * ixs.length })
      );
      tx.add(
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: priorityFeeMicroLamports,
        })
      );
      tx.add(...ixs);
      try {
        await this.provider.sendAndConfirm(tx);
      } catch (err) {
        console.log("err", err);
      }

      await new Promise((resolve) => setTimeout(resolve, 65 * 1000)); // 65,000 milliseconds = 1 minute and 5 seconds
    }
  }
}
