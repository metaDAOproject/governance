import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";

export const AUTOCRAT_PROGRAM_ID = new PublicKey(
  "autowMzCbM29YXMgVG3T62Hkgo7RcyrvgQQkd54fDQL"
);
export const AMM_PROGRAM_ID = new PublicKey(
  "AMMyu265tkBpRW21iGQxKGLaves3gKm2JcMUqfXNSpqD"
);
export const CONDITIONAL_VAULT_PROGRAM_ID = new PublicKey(
  "VLTX1ishMBbcX3rdBWGssxawAo1Q2X2qxYFYqiGodVg"
);

export const MPL_TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

export const RAYDIUM_CP_SWAP_PROGRAM_ID = new PublicKey(
  "CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C"
);

export const META_MINT = new PublicKey(
  "3gN1WVEJwSHNWjo7hr87DgZp6zkf8kWgAJD29DmfE2Gr"
);
export const MAINNET_USDC = new PublicKey(
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
);

export const USDC_DECIMALS = 6;

export const AUTOCRAT_LUTS: PublicKey[] = [];

export const LAUNCHPAD_PROGRAM_ID = new PublicKey(
  "AfJJJ5UqxhBKoE3grkKAZZsoXDE9kncbMKvqSHGsCNrE"
);

export const RAYDIUM_AUTHORITY = PublicKey.findProgramAddressSync(
  [anchor.utils.bytes.utf8.encode("vault_and_lp_mint_auth_seed")],
  RAYDIUM_CP_SWAP_PROGRAM_ID
)[0];

export const RAYDIUM_CONFIG = new PublicKey(
  "D4FPEruKEHrG5TenZ2mpDGEfu1iUvTiqBxvpU8HLBvC2"
);
export const RAYDIUM_CREATE_POOL_FEE_RECEIVE = new PublicKey(
  "DNXgeM9EiiaAbaWvwjHj9fQQLAX5ZsfHyvmYUNRAdNC8"
);
