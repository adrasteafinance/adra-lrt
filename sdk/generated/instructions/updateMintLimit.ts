import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface UpdateMintLimitArgs {
  limit: BN
}

export interface UpdateMintLimitAccounts {
  authority: PublicKey
  pool: PublicKey
}

export const layout = borsh.struct([borsh.u64("limit")])

export function updateMintLimit(
  args: UpdateMintLimitArgs,
  accounts: UpdateMintLimitAccounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.authority, isSigner: true, isWritable: true },
    { pubkey: accounts.pool, isSigner: false, isWritable: true },
  ]
  const identifier = Buffer.from([179, 103, 247, 14, 80, 175, 163, 27])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      limit: args.limit,
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
