import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface UndelegateArgs {
  amount: BN
}

export interface UndelegateAccounts {
  signer: PublicKey
  avs: PublicKey
  avsTokenMint: PublicKey
  avsInputTokenVault: PublicKey
  inputTokenMint: PublicKey
  poolInputTokenVault: PublicKey
  poolAvsTokenVault: PublicKey
  pool: PublicKey
  avsProgram: PublicKey
  tokenProgram: PublicKey
  associatedTokenProgram: PublicKey
  systemProgram: PublicKey
}

export const layout = borsh.struct([borsh.u64("amount")])

export function undelegate(
  args: UndelegateArgs,
  accounts: UndelegateAccounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.signer, isSigner: true, isWritable: true },
    { pubkey: accounts.avs, isSigner: false, isWritable: true },
    { pubkey: accounts.avsTokenMint, isSigner: false, isWritable: true },
    { pubkey: accounts.avsInputTokenVault, isSigner: false, isWritable: true },
    { pubkey: accounts.inputTokenMint, isSigner: false, isWritable: true },
    { pubkey: accounts.poolInputTokenVault, isSigner: false, isWritable: true },
    { pubkey: accounts.poolAvsTokenVault, isSigner: false, isWritable: true },
    { pubkey: accounts.pool, isSigner: false, isWritable: true },
    { pubkey: accounts.avsProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
    {
      pubkey: accounts.associatedTokenProgram,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([131, 148, 180, 198, 91, 104, 42, 238])
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
