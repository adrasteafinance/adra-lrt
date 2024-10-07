import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface TransferDelegateAuthorityAccounts {
  authority: PublicKey
  pool: PublicKey
  newAuthority: PublicKey
}

export function transferDelegateAuthority(
  accounts: TransferDelegateAuthorityAccounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.authority, isSigner: true, isWritable: true },
    { pubkey: accounts.pool, isSigner: false, isWritable: true },
    { pubkey: accounts.newAuthority, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([149, 121, 130, 72, 68, 111, 60, 51])
  const data = identifier
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
