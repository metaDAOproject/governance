# Futarchy

![License BSLv1.1](https://img.shields.io/badge/License-BSLv1.1-lightgray.svg)

Programs for market-driven governance.

## Scripts

The scripts folder contains a few scripts that you can use to interact with the Meta-DAO.
Today, the only way to create proposals is via script. You can do this by modifying the
`initializeProposal.ts` script and replacing its `pubkey`, `accounts`, and `data` with the
SVM instruction that you want to use in your proposal.

Then, run `anchor run propose --provider.cluster CLUSTER`, where `CLUSTER` is replaced with
either devnet, mainnet, or (recommended) an RPC URL.

### Initialize Proposal

The initialize proposal script initializes conditional vaults, which also attempts to upload metadata for conditional tokens. If a previous attempt to call this script failed part way through and off-chain metadata has already been uploaded, you can use this metadata and bypass another attempt to upload off-chain metadata.

Simply prepend the script with the following environment variable structure: `[PASS|FAIL]_[TOKEN]_METADATA_URI`. For example, to override pass and fail META metadata uploads, include `PASS_META_METADATA_URI` and `FAIL_META_METADATA_URI`.

The actual script invocation might look something like this:

```bash
PASS_META_METADATA_URI=\"<P_URI>\" FAIL_META_METADATA_URI=\"<F_URI>\" anchor run propose
```

where `P_URI` and `F_URI` are replaced with their respective values.

## Deployments

| program           | tag  | program ID                                   |
| ----------------- | ---- | -------------------------------------------- |
| launchpad         | develop | AfJJJ5UqxhBKoE3grkKAZZsoXDE9kncbMKvqSHGsCNrE |
| autocrat          | develop | autowMzCbM29YXMgVG3T62Hkgo7RcyrvgQQkd54fDQL  |
| amm               | develop | AMMyu265tkBpRW21iGQxKGLaves3gKm2JcMUqfXNSpqD |
| conditional_vault | develop | VLTX1ishMBbcX3rdBWGssxawAo1Q2X2qxYFYqiGodVg  |
| autocrat          | v0.3 | autoQP9RmUNkzzKRXsMkWicDVZ3h29vvyMDcAYjCxxg  |
| amm               | v0.3 | AMM5G2nxuKUwCLRYTW7qqEwuoqCtNSjtbipwEmm2g8bH |
| conditional_vault | v0.3 | VAU1T7S5UuEHmMvXtXMVmpEoQtZ2ya7eRb7gcN47wDp  |
| autocrat_v0       | v0.2 | metaRK9dUBnrAdZN6uUDKvxBVKW5pyCbPVmLtUZwtBp  |
| autocrat_migrator | v0.2 | MigRDW6uxyNMDBD8fX2njCRyJC4YZk2Rx9pDUZiAESt  |
| conditional_vault | v0.2 | vAuLTQjV5AZx5f3UgE75wcnkxnQowWxThn1hGjfCVwP  |
| autocrat_v0       | v0.1 | metaX99LHn3A7Gr7VAcCfXhpfocvpMpqQ3eyp3PGUUq  |
| autocrat_migrator | v0.1 | migkwAXrXFN34voCYQUhFQBXZJjHrWnpEXbSGTqZdB3  |
| autocrat_v0       | v0   | meta3cxKzFBmWYgCVozmvCQAS3y9b3fGxrG9HkHL7Wi  |
| conditional_vault | v0   | vaU1tVLj8RFk7mNj1BxqgAsMKKaL8UvEUHvU3tdbZPe  |

All programs are immutable and verifiable, and have been verified with the OtterSec API.

The META token mint is METADDFL6wWMWEoKTFJwcThTbUmtarRJZjRpzUvkxhr.

## Run Instructions

The run instructions are located in the [Run Instructions](RUN_INSTRUCTIONS.md) document.
