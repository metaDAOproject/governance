import { PublicKey, Keypair } from "@solana/web3.js";
import { assert } from "chai";
import {
  AutocratClient,
  getLaunchAddr,
  LaunchpadClient,
} from "@metadaoproject/futarchy/v0.4";
import { createMint, mintTo } from "spl-token-bankrun";
import { BN } from "bn.js";
import { createMintToInstruction, createTransferInstruction, getAssociatedTokenAddressSync } from "@solana/spl-token";
import * as token from "@solana/spl-token";

export default function suite() {
  let autocratClient: AutocratClient;
  let launchpadClient: LaunchpadClient;
  let dao: PublicKey;
  let daoTreasury: PublicKey;
  let META: PublicKey;
  let USDC: PublicKey;

  before(async function () {
    autocratClient = this.autocratClient;
    launchpadClient = this.launchpadClient;
  });

  beforeEach(async function () {
    // Create test tokens
    META = await createMint(this.banksClient, this.payer, this.payer.publicKey, null, 6);
    USDC = await createMint(this.banksClient, this.payer, this.payer.publicKey, null, 6);

    // Initialize DAO first since we need it for the launch
    dao = await autocratClient.initializeDao(META, 400, 5, 5000, USDC);
    [daoTreasury] = PublicKey.findProgramAddressSync(
      [dao.toBuffer()],
      autocratClient.autocrat.programId
    );

  });

  it("initializes a launch with valid parameters", async function () {
    const minRaise = new BN(1000_000000); // 1000 USDC
    const maxRaise = new BN(5000_000000); // 5000 USDC

    const [launchAddr, pdaBump] = getLaunchAddr(launchpadClient.getProgramId(), dao);

    await launchpadClient.initializeLaunchIx(
      dao,
      minRaise,
      maxRaise,
      USDC,
      META
    ).preInstructions([
      token.createSetAuthorityInstruction(
        META,
        this.payer.publicKey,
        token.AuthorityType.MintTokens,
        launchAddr
      ),
    ]).rpc();

    const launch = await launchpadClient.fetchLaunch(launchAddr);

    assert.equal(launch.minimumRaiseAmount.toString(), minRaise.toString());
    assert.ok(launch.dao.equals(dao));
    assert.ok(launch.daoTreasury.equals(daoTreasury));
    assert.equal(launch.committedAmount.toString(), "0");
    assert.equal(launch.pdaBump, pdaBump);
  });

  it("fails when vault doesn't have mint authority", async function () {
    const minRaise = new BN(1000_000000); // 1000 USDC
    const maxRaise = new BN(5000_000000); // 5000 USDC

    try {
      await launchpadClient.initializeLaunchIx(
        dao,
        minRaise,
        maxRaise,
        USDC,
        META
      ).rpc();
      assert.fail("Should have thrown error");
    } catch (e) {
      assert.include(e.message, "ConstraintMintMintAuthority");
    }
  });

  it("fails when freeze authority is set", async function () {
    const minRaise = new BN(1000_000000); // 1000 USDC
    const maxRaise = new BN(5000_000000); // 5000 USDC

    const [launchAddr] = getLaunchAddr(launchpadClient.getProgramId(), dao);

    const META2 = await createMint(this.banksClient, this.payer, this.payer.publicKey, this.payer.publicKey, 6);
    try {
      await launchpadClient.initializeLaunchIx(
        dao,
        minRaise,
        maxRaise,
        USDC,
        META2
      )
        .preInstructions([
          token.createSetAuthorityInstruction(
            META2,
            this.payer.publicKey,
            token.AuthorityType.MintTokens,
            launchAddr
          ),
        ])
        .rpc();
      assert.fail("Should have thrown error");
    } catch (e) {
      assert.include(e.message, "FreezeAuthoritySet");
    }
  });

  it("fails when supply has already been minted", async function () {
    const minRaise = new BN(1000_000000); // 1000 USDC
    const maxRaise = new BN(5000_000000); // 5000 USDC

    await this.createTokenAccount(META, this.payer.publicKey);

    await this.mintTo(META, this.payer.publicKey, this.payer, 1000n);

    const [launchAddr, pdaBump] = getLaunchAddr(launchpadClient.getProgramId(), dao);

    try {
      await launchpadClient.initializeLaunchIx(
        dao,
        minRaise,
        maxRaise,
        USDC,
        META
      ).preInstructions([
        token.createSetAuthorityInstruction(
          META,
          this.payer.publicKey,
          token.AuthorityType.MintTokens,
          launchAddr
        )
      ]).rpc();
      assert.fail("Should have thrown error");
    } catch (e) {
      assert.include(e.message, "SupplyNonZero");
    }
  });
}
