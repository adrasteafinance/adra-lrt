import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface UnrestakeArgs {
  amount: BN
}

export interface UnrestakeAccounts {
  signer: PublicKey
  lstMint: PublicKey
  lstAta: PublicKey
  rstAta: PublicKey
  rstMint: PublicKey
  vault: PublicKey
  pool: PublicKey
  associatedTokenProgram: PublicKey
  tokenProgram: PublicKey
  systemProgram: PublicKey
}

export const layout = borsh.struct([borsh.u64("amount")])

export function unrestake(
  args: UnrestakeArgs,
  accounts: UnrestakeAccounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.signer, isSigner: true, isWritable: true },
    { pubkey: accounts.lstMint, isSigner: false, isWritable: false },
    { pubkey: accounts.lstAta, isSigner: false, isWritable: true },
    { pubkey: accounts.rstAta, isSigner: false, isWritable: true },
    { pubkey: accounts.rstMint, isSigner: false, isWritable: true },
    { pubkey: accounts.vault, isSigner: false, isWritable: true },
    { pubkey: accounts.pool, isSigner: false, isWritable: false },
    {
      pubkey: accounts.associatedTokenProgram,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([10, 177, 161, 238, 250, 37, 120, 24])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      amount: args.amount,
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
