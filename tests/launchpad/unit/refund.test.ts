import { PublicKey } from "@solana/web3.js";
import { assert } from "chai";
import {
  AutocratClient,
  getLaunchAddr,
  getLaunchSignerAddr,
  LaunchpadClient,
} from "@metadaoproject/futarchy/v0.4";
import { createMint } from "spl-token-bankrun";
import { BN } from "bn.js";
import { getAssociatedTokenAddressSync, createSetAuthorityInstruction, AuthorityType } from "@solana/spl-token";

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
  let funderUsdcAccount: PublicKey;

  const minRaise = new BN(1000_000000); // 1000 USDC
  const maxRaise = new BN(5000_000000); // 5000 USDC
  const SLOTS_PER_DAY = 216_000n;

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
    usdcVault = getAssociatedTokenAddressSync(USDC, launchSigner, true);
    funderUsdcAccount = getAssociatedTokenAddressSync(USDC, this.payer.publicKey);

    // Initialize launch
    await launchpadClient.initializeLaunchIx(
      dao,
      minRaise,
      maxRaise,
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

    // Setup funder accounts
    await this.createTokenAccount(META, this.payer.publicKey);
    await this.createTokenAccount(USDC, this.payer.publicKey);
  });

  it("allows refunds when launch is in refunding state", async function () {
    // Fund the launch with less than minimum raise
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

    // Complete the launch (moves to refunding state)
    await launchpadClient.completeLaunchIx(launch, USDC, META, daoTreasury).rpc();

    const initialUsdcBalance = await this.getTokenBalance(USDC, this.payer.publicKey);
    const initialMetaBalance = await this.getTokenBalance(META, this.payer.publicKey);

    // Get refund
    await launchpadClient.refundIx(launch, USDC, META).rpc();

    const finalUsdcBalance = await this.getTokenBalance(USDC, this.payer.publicKey);
    const finalMetaBalance = await this.getTokenBalance(META, this.payer.publicKey);
    
    assert.equal((finalUsdcBalance - initialUsdcBalance).toString(), partialAmount.toString());
    assert.equal(finalMetaBalance, 0, "META tokens should be burned during refund");
  });

  it("fails when launch is not in refunding state", async function () {
    try {
      await launchpadClient.refundIx(launch, USDC, META).rpc();
      assert.fail("Should have thrown error");
    } catch (e) {
      assert.include(e.message, "LaunchNotRefunding");
    }
  });

  it("fails when user has no tokens to refund", async function () {
    // Move to refunding state without any funding
    await this.advanceBySlots(SLOTS_PER_DAY * 7n);
    await launchpadClient.completeLaunchIx(launch, USDC, META, daoTreasury).rpc();

    try {
      await launchpadClient.refundIx(launch, USDC, META).rpc();
      assert.fail("Should have thrown error");
    } catch (e) {
      assert.include(e.message, "InvalidAmount");
    }
  });
} 