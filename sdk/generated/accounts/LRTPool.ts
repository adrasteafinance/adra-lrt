import { PublicKey, Connection } from "@solana/web3.js"
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface LRTPoolFields {
  bump: number
  inputTokenMint: PublicKey
  outputTokenMint: PublicKey
  delegateAuthority: PublicKey
  outputMintLimit: BN
}

export interface LRTPoolJSON {
  bump: number
  inputTokenMint: string
  outputTokenMint: string
  delegateAuthority: string
  outputMintLimit: string
}

export class LRTPool {
  readonly bump: number
  readonly inputTokenMint: PublicKey
  readonly outputTokenMint: PublicKey
  readonly delegateAuthority: PublicKey
  readonly outputMintLimit: BN

  static readonly discriminator = Buffer.from([
    69, 185, 38, 138, 138, 223, 0, 216,
  ])

  static readonly layout = borsh.struct([
    borsh.u8("bump"),
    borsh.publicKey("inputTokenMint"),
    borsh.publicKey("outputTokenMint"),
    borsh.publicKey("delegateAuthority"),
    borsh.u64("outputMintLimit"),
  ])

  constructor(fields: LRTPoolFields) {
    this.bump = fields.bump
    this.inputTokenMint = fields.inputTokenMint
    this.outputTokenMint = fields.outputTokenMint
    this.delegateAuthority = fields.delegateAuthority
    this.outputMintLimit = fields.outputMintLimit
  }

  static async fetch(
    c: Connection,
    address: PublicKey,
    programId: PublicKey = PROGRAM_ID
  ): Promise<LRTPool | null> {
    const info = await c.getAccountInfo(address)

    if (info === null) {
      return null
    }
    if (!info.owner.equals(programId)) {
      throw new Error("account doesn't belong to this program")
    }

    return this.decode(info.data)
  }

  static async fetchMultiple(
    c: Connection,
    addresses: PublicKey[],
    programId: PublicKey = PROGRAM_ID
  ): Promise<Array<LRTPool | null>> {
    const infos = await c.getMultipleAccountsInfo(addresses)

    return infos.map((info) => {
      if (info === null) {
        return null
      }
      if (!info.owner.equals(programId)) {
        throw new Error("account doesn't belong to this program")
      }

      return this.decode(info.data)
    })
  }

  static decode(data: Buffer): LRTPool {
    if (!data.slice(0, 8).equals(LRTPool.discriminator)) {
      throw new Error("invalid account discriminator")
    }

    const dec = LRTPool.layout.decode(data.slice(8))

    return new LRTPool({
      bump: dec.bump,
      inputTokenMint: dec.inputTokenMint,
      outputTokenMint: dec.outputTokenMint,
      delegateAuthority: dec.delegateAuthority,
      outputMintLimit: dec.outputMintLimit,
    })
  }

  toJSON(): LRTPoolJSON {
    return {
      bump: this.bump,
      inputTokenMint: this.inputTokenMint.toString(),
      outputTokenMint: this.outputTokenMint.toString(),
      delegateAuthority: this.delegateAuthority.toString(),
      outputMintLimit: this.outputMintLimit.toString(),
    }
  }

  static fromJSON(obj: LRTPoolJSON): LRTPool {
    return new LRTPool({
      bump: obj.bump,
      inputTokenMint: new PublicKey(obj.inputTokenMint),
      outputTokenMint: new PublicKey(obj.outputTokenMint),
      delegateAuthority: new PublicKey(obj.delegateAuthority),
      outputMintLimit: new BN(obj.outputMintLimit),
    })
  }
}
