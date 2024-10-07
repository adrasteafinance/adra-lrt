import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface WithdrawDelegatedStakeArgs {
  amount: BN
}

export interface WithdrawDelegatedStakeAccounts {
  signer: PublicKey
  inputTokenMint: PublicKey
  signerInputTokenVault: PublicKey
  poolInputTokenVault: PublicKey
  outputTokenMint: PublicKey
  signerOutputTokenVault: PublicKey
  pool: PublicKey
  avs: PublicKey
  avsTokenMint: PublicKey
  avsInputTokenVault: PublicKey
  poolAvsTokenVault: PublicKey
  avsProgram: PublicKey
  associatedTokenProgram: PublicKey
  tokenProgram: PublicKey
  systemProgram: PublicKey
}

export const layout = borsh.struct([borsh.u64("amount")])

export function withdrawDelegatedStake(
  args: WithdrawDelegatedStakeArgs,
  accounts: WithdrawDelegatedStakeAccounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.signer, isSigner: true, isWritable: true },
    { pubkey: accounts.inputTokenMint, isSigner: false, isWritable: true },
    {
      pubkey: accounts.signerInputTokenVault,
      isSigner: false,
      isWritable: true,
    },
    { pubkey: accounts.poolInputTokenVault, isSigner: false, isWritable: true },
    { pubkey: accounts.outputTokenMint, isSigner: false, isWritable: true },
    {
      pubkey: accounts.signerOutputTokenVault,
      isSigner: false,
      isWritable: true,
    },
    { pubkey: accounts.pool, isSigner: false, isWritable: true },
    { pubkey: accounts.avs, isSigner: false, isWritable: true },
    { pubkey: accounts.avsTokenMint, isSigner: false, isWritable: true },
    { pubkey: accounts.avsInputTokenVault, isSigner: false, isWritable: true },
    { pubkey: accounts.poolAvsTokenVault, isSigner: false, isWritable: true },
    { pubkey: accounts.avsProgram, isSigner: false, isWritable: false },
    {
      pubkey: accounts.associatedTokenProgram,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([203, 159, 183, 190, 144, 29, 114, 230])
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
