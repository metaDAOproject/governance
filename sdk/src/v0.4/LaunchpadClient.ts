import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, AccountInfo } from "@solana/web3.js";
import { Launchpad, IDL as LaunchpadIDL } from "./types/launchpad.js";
import {
  LAUNCHPAD_PROGRAM_ID,
  RAYDIUM_AUTHORITY,
  RAYDIUM_CONFIG,
  RAYDIUM_CP_SWAP_PROGRAM_ID,
  RAYDIUM_CREATE_POOL_FEE_RECEIVE,
} from "./constants.js";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";
import { Launch } from "./types/index.js";
import {
  getDaoTreasuryAddr,
  getLaunchAddr,
  getLaunchSignerAddr,
} from "./utils/pda.js";
import { AutocratClient } from "./AutocratClient.js";
import * as anchor from "@coral-xyz/anchor";

export type CreateLaunchpadClientParams = {
  provider: AnchorProvider;
  launchpadProgramId?: PublicKey;
  autocratProgramId?: PublicKey;
  conditionalVaultProgramId?: PublicKey;
  ammProgramId?: PublicKey;
};

export class LaunchpadClient {
  public launchpad: Program<Launchpad>;
  public provider: AnchorProvider;
  public autocratClient: AutocratClient;

  private constructor(params: CreateLaunchpadClientParams) {
    this.provider = params.provider;
    this.launchpad = new Program(
      LaunchpadIDL,
      params.launchpadProgramId || LAUNCHPAD_PROGRAM_ID,
      this.provider
    );
    this.autocratClient = AutocratClient.createClient({
      provider: this.provider,
      autocratProgramId: params.autocratProgramId,
      conditionalVaultProgramId: params.conditionalVaultProgramId,
      ammProgramId: params.ammProgramId,
    });
  }

  static createClient(params: CreateLaunchpadClientParams): LaunchpadClient {
    return new LaunchpadClient(params);
  }

  getProgramId(): PublicKey {
    return this.launchpad.programId;
  }

  async getLaunch(launch: PublicKey): Promise<Launch> {
    return await this.launchpad.account.launch.fetch(launch);
  }

  async fetchLaunch(launch: PublicKey): Promise<Launch | null> {
    return await this.launchpad.account.launch.fetchNullable(launch);
  }

  async deserializeLaunch(accountInfo: AccountInfo<Buffer>): Promise<Launch> {
    return this.launchpad.coder.accounts.decode("launch", accountInfo.data);
  }

  initializeLaunchIx(
    dao: PublicKey,
    minimumRaiseAmount: BN,
    maximumRaiseAmount: BN,
    usdcMint: PublicKey,
    tokenMint: PublicKey,
    creator: PublicKey = this.provider.publicKey
  ) {
    const [launch] = getLaunchAddr(this.launchpad.programId, dao);
    const [launchSigner] = getLaunchSignerAddr(
      this.launchpad.programId,
      launch
    );
    const usdcVault = getAssociatedTokenAddressSync(
      usdcMint,
      launchSigner,
      true
    );
    const tokenVault = getAssociatedTokenAddressSync(
      tokenMint,
      launchSigner,
      true
    );
    const [daoTreasury] = getDaoTreasuryAddr(
      this.autocratClient.getProgramId(),
      dao
    );
    const treasuryUsdcAccount = getAssociatedTokenAddressSync(
      usdcMint,
      daoTreasury,
      true
    );

    return this.launchpad.methods
      .initializeLaunch({
        minimumRaiseAmount,
      })
      .accounts({
        launch,
        launchSigner,
        usdcVault,
        tokenVault,
        daoTreasury,
        treasuryUsdcAccount,
        creator,
        dao,
        usdcMint,
        tokenMint,
      })
      .preInstructions([
        createAssociatedTokenAccountIdempotentInstruction(
          creator,
          getAssociatedTokenAddressSync(tokenMint, launchSigner, true),
          launchSigner,
          tokenMint
        ),
        createAssociatedTokenAccountIdempotentInstruction(
          creator,
          getAssociatedTokenAddressSync(usdcMint, launchSigner, true),
          launchSigner,
          usdcMint
        ),
        createAssociatedTokenAccountIdempotentInstruction(
          creator,
          getAssociatedTokenAddressSync(usdcMint, daoTreasury, true),
          daoTreasury,
          usdcMint
        ),
      ]);
  }

  startLaunchIx(
    launch: PublicKey,
    creator: PublicKey = this.provider.publicKey
  ) {
    return this.launchpad.methods.startLaunch().accounts({
      launch,
      creator,
    });
  }

  fundIx(
    launch: PublicKey,
    amount: BN,
    usdcMint: PublicKey,
    tokenMint: PublicKey,
    funder: PublicKey = this.provider.publicKey
  ) {
    const [launchSigner] = getLaunchSignerAddr(
      this.launchpad.programId,
      launch
    );
    const usdcVault = getAssociatedTokenAddressSync(
      usdcMint,
      launchSigner,
      true
    );
    const funderUsdcAccount = getAssociatedTokenAddressSync(usdcMint, funder);
    const funderTokenAccount = getAssociatedTokenAddressSync(tokenMint, funder);

    return this.launchpad.methods.fund(amount).accounts({
      launch,
      usdcVault,
      tokenMint,
      funder,
      funderUsdcAccount,
      funderTokenAccount,
      launchSigner,
    });
  }

  completeLaunchIx(
    launch: PublicKey,
    usdcMint: PublicKey,
    tokenMint: PublicKey,
    daoTreasury: PublicKey
  ) {
    const [launchSigner] = getLaunchSignerAddr(
      this.launchpad.programId,
      launch
    );
    const launchUsdcVault = getAssociatedTokenAddressSync(
      usdcMint,
      launchSigner,
      true
    );
    const launchTokenVault = getAssociatedTokenAddressSync(
      tokenMint,
      launchSigner,
      true
    );
    const treasuryUsdcAccount = getAssociatedTokenAddressSync(
      usdcMint,
      daoTreasury,
      true
    );

    const poolStateKp = Keypair.generate();

    const [lpMint] = PublicKey.findProgramAddressSync(
      [
        anchor.utils.bytes.utf8.encode("pool_lp_mint"),
        poolStateKp.publicKey.toBuffer(),
      ],
      RAYDIUM_CP_SWAP_PROGRAM_ID
    );

    const lpVault = getAssociatedTokenAddressSync(lpMint, launchSigner, true);

    const [poolTokenVault] = PublicKey.findProgramAddressSync(
      [
        anchor.utils.bytes.utf8.encode("pool_vault"),
        poolStateKp.publicKey.toBuffer(),
        tokenMint.toBuffer(),
      ],
      RAYDIUM_CP_SWAP_PROGRAM_ID
    );

    const [poolUsdcVault] = PublicKey.findProgramAddressSync(
      [
        anchor.utils.bytes.utf8.encode("pool_vault"),
        poolStateKp.publicKey.toBuffer(),
        usdcMint.toBuffer(),
      ],
      RAYDIUM_CP_SWAP_PROGRAM_ID
    );

    const [observationState] = PublicKey.findProgramAddressSync(
      [
        anchor.utils.bytes.utf8.encode("observation"),
        poolStateKp.publicKey.toBuffer(),
      ],
      RAYDIUM_CP_SWAP_PROGRAM_ID
    );

    return this.launchpad.methods
      .completeLaunch()
      .accounts({
        launch,
        launchSigner,
        launchUsdcVault,
        launchTokenVault,
        usdcMint,
        tokenMint,
        lpMint,
        lpVault,
        poolTokenVault,
        poolUsdcVault,
        poolState: poolStateKp.publicKey,
        observationState,
        treasuryUsdcAccount,
        cpSwapProgram: RAYDIUM_CP_SWAP_PROGRAM_ID,
        authority: RAYDIUM_AUTHORITY,
        ammConfig: RAYDIUM_CONFIG,
        createPoolFee: RAYDIUM_CREATE_POOL_FEE_RECEIVE,
      })
      .signers([poolStateKp]);
  }

  refundIx(
    launch: PublicKey,
    usdcMint: PublicKey,
    tokenMint: PublicKey,
    funder: PublicKey = this.provider.publicKey
  ) {
    const [launchSigner] = getLaunchSignerAddr(
      this.launchpad.programId,
      launch
    );

    const launchUsdcVault = getAssociatedTokenAddressSync(
      usdcMint,
      launchSigner,
      true
    );
    const funderUsdcAccount = getAssociatedTokenAddressSync(usdcMint, funder);
    const funderTokenAccount = getAssociatedTokenAddressSync(tokenMint, funder);

    return this.launchpad.methods.refund().accounts({
      launch,
      launchSigner,
      launchUsdcVault,
      funder,
      funderUsdcAccount,
      funderTokenAccount,
      tokenMint,
    });
  }
}
