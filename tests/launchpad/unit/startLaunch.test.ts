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
import { createSetAuthorityInstruction, AuthorityType, getAssociatedTokenAddressSync } from "@solana/spl-token";

export default function suite() {
  let autocratClient: AutocratClient;
  let launchpadClient: LaunchpadClient;
  let dao: PublicKey;
  let META: PublicKey;
  let USDC: PublicKey;
  let launch: PublicKey;
  let launchSigner: PublicKey;
  const minRaise = new BN(1000_000000); // 1000 USDC

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

    // Get launch address
    [launch] = getLaunchAddr(launchpadClient.getProgramId(), dao);
    [launchSigner] = getLaunchSignerAddr(launchpadClient.getProgramId(), launch);
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
  });

  it("starts launch correctly", async function () {
    // Check initial state
    let launchAccount = await launchpadClient.fetchLaunch(launch);
    assert.equal(launchAccount.slotStarted.toString(), "0");
    assert.exists(launchAccount.state.initialized);

    // Get current slot for comparison
    const slot = await this.banksClient.getClock().then(clock => clock.slot);

    // Start the launch
    await launchpadClient.startLaunchIx(launch).rpc();

    // Check final state
    launchAccount = await launchpadClient.fetchLaunch(launch);
    assert.equal(launchAccount.slotStarted.toString(), slot.toString());
    assert.exists(launchAccount.state.live);
  });
} 