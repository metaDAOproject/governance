import * as token from "@solana/spl-token";
import { Keypair, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import {
    AutocratClient,
    ConditionalVaultClient,
    getLaunchAddr,
    getLaunchSignerAddr,
    LaunchpadClient,
} from "@metadaoproject/futarchy/v0.4";
import { BN } from "bn.js";
import { DEVNET_MUSDC } from "./consts.js";

const provider = anchor.AnchorProvider.env();
const payer = provider.wallet["payer"];
const autocrat: AutocratClient = AutocratClient.createClient({ provider });
const vaultProgram: ConditionalVaultClient =
    ConditionalVaultClient.createClient({ provider });
const launchpad: LaunchpadClient = LaunchpadClient.createClient({ provider });


async function main() {
    const XYZ = await token.createMint(provider.connection, payer, payer.publicKey, null, 6);


    const dao = await autocrat.initializeDao(XYZ, 0.001, 100 * 1_000, 100, DEVNET_MUSDC);


    const [launchAddr] = getLaunchAddr(launchpad.getProgramId(), dao);
    const [launchSigner] = getLaunchSignerAddr(launchpad.getProgramId(), launchAddr);

    const tx = await launchpad.initializeLaunchIx(
        dao,
        new BN(100),
        new BN(0),
        DEVNET_MUSDC,
        XYZ
    ).preInstructions([
        token.createSetAuthorityInstruction(
            XYZ,
            payer.publicKey,
            token.AuthorityType.MintTokens,
            launchSigner
        ),
    ]).rpc();



    console.log(dao.toBase58());

    console.log(tx);
    return;
}

main();
