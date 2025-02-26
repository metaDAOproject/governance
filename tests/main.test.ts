import conditionalVault from "./conditionalVault/main.test.js";
import amm from "./amm/main.test.js";
import autocrat from "./autocrat/autocrat.js";
import launchpad from "./launchpad/main.test.js";

import { Clock, startAnchor } from "solana-bankrun";
import { BankrunProvider } from "anchor-bankrun";
import * as anchor from "@coral-xyz/anchor";
import {
  AmmClient,
  AutocratClient,
  ConditionalVaultClient,
  LaunchpadClient,
  RAYDIUM_CREATE_POOL_FEE_RECEIVE,
} from "@metadaoproject/futarchy/v0.4";
// import {
//   // AmmClient,
//   // AutocratClient,
//   // ConditionalVaultClient,
//   getVersion,
//   VersionKey
// } from "@metadaoproject/futarchy";
import { PublicKey, Keypair } from "@solana/web3.js";
import {
  createAssociatedTokenAccount,
  createMint,
  mintTo,
  getAccount,
  transfer,
  getMint,
} from "spl-token-bankrun";
import * as token from "@solana/spl-token";
import { assert } from "chai";
import { MPL_TOKEN_METADATA_PROGRAM_ID as UMI_MPL_TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import { toWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";
import * as fs from "fs";
import { RAYDIUM_CONFIG } from "@metadaoproject/futarchy/v0.4";

const MPL_TOKEN_METADATA_PROGRAM_ID = toWeb3JsPublicKey(
  UMI_MPL_TOKEN_METADATA_PROGRAM_ID
);
const RAYDIUM_CP_SWAP_PROGRAM_ID = new PublicKey("CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C");

import mintAndSwap from "./integration/mintAndSwap.test.js";
import scalarMarkets from "./integration/scalarMarkets.test.js";

before(async function () {
  // const version: VersionKey = "0.4";
  // const { AmmClient, AutocratClient, ConditionalVaultClient } = getVersion(version);



  this.context = await startAnchor(
    "./",
    [
      // even though the program is loaded into the test validator, we need
      // to tell banks test client to load it as well
      {
        name: "mpl_token_metadata",
        programId: MPL_TOKEN_METADATA_PROGRAM_ID,
      },
      {
        name: "raydium_cp_swap",
        programId: RAYDIUM_CP_SWAP_PROGRAM_ID,
      }
    ],
    [
      {
        address: RAYDIUM_CONFIG,
        info: {
          data: fs.readFileSync("./tests/fixtures/raydium-amm-config"),
          executable: false,
          owner: RAYDIUM_CP_SWAP_PROGRAM_ID,
          lamports: 1_000_000_000,
        }
      },
      {
        address: RAYDIUM_CREATE_POOL_FEE_RECEIVE,
        info: {
          data: fs.readFileSync("./tests/fixtures/raydium-create-pool-fee-receive"),
          executable: false,
          owner: token.TOKEN_PROGRAM_ID,
          lamports: 6858_402_039_280
        }
      }
    ]
  );
  this.banksClient = this.context.banksClient;
  let provider = new BankrunProvider(this.context);
  anchor.setProvider(provider);

  // umi = createUmi(anchor.AnchorProvider.env().connection);

  this.vaultClient = ConditionalVaultClient.createClient({
    provider: provider as any,
  });
  this.autocratClient = AutocratClient.createClient({
    provider: provider as any,
  });
  this.launchpadClient = LaunchpadClient.createClient({ provider: provider as any });
  this.ammClient = AmmClient.createClient({ provider: provider as any });
  this.payer = provider.wallet.payer;

  this.createTokenAccount = async (mint: PublicKey, owner: PublicKey) => {
    return await createAssociatedTokenAccount(
      this.banksClient,
      this.payer,
      mint,
      owner
    );
  };

  this.createMint = async (mintAuthority: PublicKey, decimals: number) => {
    return await createMint(
      this.banksClient,
      this.payer,
      mintAuthority,
      null,
      decimals
    );
  };

  this.mintTo = async (
    mint: PublicKey,
    to: PublicKey,
    mintAuthority: Keypair,
    amount: number
  ) => {
    const tokenAccount = token.getAssociatedTokenAddressSync(mint, to, true);
    return await mintTo(
      this.banksClient,
      this.payer,
      mint,
      tokenAccount,
      mintAuthority,
      amount
    );
  };

  this.getTokenBalance = async (mint: PublicKey, owner: PublicKey) => {
    const tokenAccount = token.getAssociatedTokenAddressSync(mint, owner, true);
    const storedTokenAccount = await getAccount(this.banksClient, tokenAccount);
    return storedTokenAccount.amount;
  };

  this.getMint = async (mint: PublicKey) => {
    return await getMint(this.banksClient, mint);
  };

  this.assertBalance = async (
    mint: PublicKey,
    owner: PublicKey,
    amount: number
  ) => {
    const balance = await this.getTokenBalance(mint, owner);
    assert.equal(balance.toString(), amount.toString());
    // const tokenAccount = token.getAssociatedTokenAddressSync(mint, owner, true);
    // const storedTokenAccount = await getAccount(this.banksClient, tokenAccount);
    // assert.equal(storedTokenAccount.amount.toString(), amount.toString());
  };

  this.transfer = async (
    mint: PublicKey,
    from: Keypair,
    to: PublicKey,
    amount: number
  ) => {
    return await transfer(
      this.banksClient,
      this.payer,
      token.getAssociatedTokenAddressSync(mint, from.publicKey, true),
      token.getAssociatedTokenAddressSync(mint, to, true),
      from,
      amount
    );
  };

  this.advanceBySlots = async (
    slots: bigint
  ) => {
    const currentClock = await this.context.banksClient.getClock();
    this.context.setClock(
      new Clock(
        currentClock.slot + slots,
        currentClock.epochStartTimestamp,
        currentClock.epoch,
        currentClock.leaderScheduleEpoch,
        50n
      )
    );
  };

});

describe("conditional_vault", conditionalVault);
describe("amm", amm);
describe("autocrat", autocrat);
describe("launchpad", launchpad);
describe("project-wide integration tests", function () {
  it("mint and swap in a single transaction", mintAndSwap);
  it("tests scalar markets (mint, split, swap, redeem) with some fuzzing", scalarMarkets);
});
