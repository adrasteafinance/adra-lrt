import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface InitializeAccounts {
  signer: PublicKey
  solayerAdmin: PublicKey
  lstMint: PublicKey
  lstVault: PublicKey
  rstMint: PublicKey
  pool: PublicKey
  associatedTokenProgram: PublicKey
  tokenProgram: PublicKey
  systemProgram: PublicKey
}

export function initialize(
  accounts: InitializeAccounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.signer, isSigner: true, isWritable: true },
    { pubkey: accounts.solayerAdmin, isSigner: true, isWritable: false },
    { pubkey: accounts.lstMint, isSigner: false, isWritable: false },
    { pubkey: accounts.lstVault, isSigner: false, isWritable: true },
    { pubkey: accounts.rstMint, isSigner: false, isWritable: false },
    { pubkey: accounts.pool, isSigner: false, isWritable: true },
    {
      pubkey: accounts.associatedTokenProgram,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([175, 175, 109, 31, 13, 152, 155, 237])
  const data = identifier
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
