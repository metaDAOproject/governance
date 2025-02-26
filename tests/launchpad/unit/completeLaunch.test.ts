import { ComputeBudgetProgram, PublicKey } from "@solana/web3.js";
import { assert } from "chai";
import {
  AutocratClient,
  getLaunchAddr,
  getLaunchSignerAddr,
  LaunchpadClient,
  RAYDIUM_CP_SWAP_PROGRAM_ID,
} from "@metadaoproject/futarchy/v0.4";
import { createMint } from "spl-token-bankrun";
import { BN } from "bn.js";
import { createSetAuthorityInstruction, AuthorityType, getAssociatedTokenAddressSync } from "@solana/spl-token";
import * as anchor from "@coral-xyz/anchor";

export default function suite() {
  let autocratClient: AutocratClient;
  let launchpadClient: LaunchpadClient;
  let dao: PublicKey;
  let daoTreasury: PublicKey;
  let META: PublicKey;
  let USDC: PublicKey;
  let launch: PublicKey;
  let launchSigner: PublicKey;
  let usdcVault: PublicKey;
  let treasuryUsdcAccount: PublicKey;

  const minRaise = new BN(1000_000000); // 1000 USDC
  const SLOTS_PER_DAY = 216_000n; // (24 * 60 * 60 * 1000) / 400

  before(async function () {
    autocratClient = this.autocratClient;
    launchpadClient = this.launchpadClient;
  });

  beforeEach(async function () {
    // Create test tokens
    META = await createMint(this.banksClient, this.payer, this.payer.publicKey, null, 6);
    USDC = await createMint(this.banksClient, this.payer, this.payer.publicKey, null, 6);

    // Initialize DAO
    dao = await autocratClient.initializeDao(META, 400, 5, 5000, USDC);
    [daoTreasury] = PublicKey.findProgramAddressSync(
      [dao.toBuffer()],
      autocratClient.autocrat.programId
    );

    // Get accounts
    [launch] = getLaunchAddr(launchpadClient.getProgramId(), dao);
    [launchSigner] = getLaunchSignerAddr(launchpadClient.getProgramId(), launch);

    usdcVault = getAssociatedTokenAddressSync(USDC, launch, true);
    treasuryUsdcAccount = getAssociatedTokenAddressSync(USDC, daoTreasury, true);

    // Initialize launch
    await launchpadClient.initializeLaunchIx(
      dao,
      minRaise,
      new BN(5000_000000),
      USDC,
      META
    ).preInstructions([
      createSetAuthorityInstruction(
        META,
        this.payer.publicKey,
        AuthorityType.MintTokens,
        launchSigner
      )
    ]).rpc();

    await launchpadClient.startLaunchIx(launch).rpc();
  });

  it("completes launch successfully when minimum raise is met and time has passed", async function () {
    // Fund the launch with exactly minimum raise
    const userUsdcAccount = await this.createTokenAccount(USDC, this.payer.publicKey);
    const userTokenAccount = await this.createTokenAccount(META, this.payer.publicKey);
    await this.mintTo(USDC, this.payer.publicKey, this.payer, minRaise.toNumber());

    await launchpadClient.fundIx(
      launch,
      minRaise,
      USDC,
      META
    ).rpc();

    // Advance clock past 7 days
    await this.advanceBySlots(SLOTS_PER_DAY * 7n);

    // Complete the launch
    await launchpadClient.completeLaunchIx(launch, USDC, META, daoTreasury).preInstructions([ComputeBudgetProgram.setComputeUnitLimit({ units: 1_000_000 })]).rpc();

    const launchAccount = await launchpadClient.fetchLaunch(launch);
    const treasuryBalance = await this.getTokenBalance(USDC, daoTreasury);

    assert.exists(launchAccount.state.complete);
    assert.equal(treasuryBalance.toString(), minRaise.muln(9).divn(10).toString());

    const mint = await this.getMint(META);
    assert.isTrue(mint.mintAuthority.equals(daoTreasury));
  });

  it("fails when launch period has not passed", async function () {
    // Fund the launch with exactly minimum raise
    const userUsdcAccount = await this.createTokenAccount(USDC, this.payer.publicKey);
    const userTokenAccount = await this.createTokenAccount(META, this.payer.publicKey);
    await this.mintTo(USDC, this.payer.publicKey, this.payer, minRaise.toNumber());

    await launchpadClient.fundIx(
      launch,
      minRaise,
      USDC,
      META
    ).rpc();

    // Try to complete immediately (should fail)
    try {
      await launchpadClient.completeLaunchIx(launch, USDC, META, daoTreasury).rpc();
      assert.fail("Should have thrown error");
    } catch (e) {
      assert.include(e.message, "LaunchPeriodNotOver");
    }

    // Advance by 6 days (still not enough)
    await this.advanceBySlots(SLOTS_PER_DAY * 3n);

    try {
      await launchpadClient.completeLaunchIx(launch, USDC, META, daoTreasury).preInstructions([ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1 })]).rpc();
      assert.fail("Should have thrown error");
    } catch (e) {
      assert.include(e.message, "LaunchPeriodNotOver");
    }
  });

  it("moves to refunding state when minimum raise is not met after period", async function () {
    // Fund the launch with less than minimum raise
    const userUsdcAccount = await this.createTokenAccount(USDC, this.payer.publicKey);
    const userTokenAccount = await this.createTokenAccount(META, this.payer.publicKey);
    const partialAmount = minRaise.divn(2);
    await this.mintTo(USDC, this.payer.publicKey, this.payer, partialAmount.toNumber());

    await launchpadClient.fundIx(
      launch,
      partialAmount,
      USDC,
      META
    ).rpc();

    // Advance clock past 7 days
    await this.advanceBySlots(SLOTS_PER_DAY * 7n);

    // Complete the launch
    await launchpadClient.completeLaunchIx(launch, USDC, META, daoTreasury).rpc();

    const launchAccount = await launchpadClient.fetchLaunch(launch);
    const treasuryBalance = await this.getTokenBalance(USDC, daoTreasury);

    assert.exists(launchAccount.state.refunding);
    assert.equal(treasuryBalance.toString(), "0");
  });

  it("fails when launch is not in live state", async function () {
    // Advance clock past 7 days
    await this.advanceBySlots(SLOTS_PER_DAY * 7n);

    // Complete launch first time
    await launchpadClient.completeLaunchIx(launch, USDC, META, daoTreasury).rpc();

    // Try to complete again
    try {
      // CU price so that the VM doesn't think it's a duplicate tx
      await launchpadClient.completeLaunchIx(launch, USDC, META, daoTreasury).preInstructions([ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1 }), ComputeBudgetProgram.setComputeUnitLimit({ units: 1_000_000 })]).rpc();
      assert.fail("Should have thrown error");
    } catch (e) {
      assert.include(e.message, "InvalidLaunchState");
    }
  });
} 