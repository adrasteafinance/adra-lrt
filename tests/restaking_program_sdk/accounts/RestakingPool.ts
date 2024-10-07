import { PublicKey, Connection } from "@solana/web3.js"
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface RestakingPoolFields {
  lstMint: PublicKey
  rstMint: PublicKey
  bump: number
}

export interface RestakingPoolJSON {
  lstMint: string
  rstMint: string
  bump: number
}

export class RestakingPool {
  readonly lstMint: PublicKey
  readonly rstMint: PublicKey
  readonly bump: number

  static readonly discriminator = Buffer.from([
    12, 5, 100, 143, 125, 94, 26, 214,
  ])

  static readonly layout = borsh.struct([
    borsh.publicKey("lstMint"),
    borsh.publicKey("rstMint"),
    borsh.u8("bump"),
  ])

  constructor(fields: RestakingPoolFields) {
    this.lstMint = fields.lstMint
    this.rstMint = fields.rstMint
    this.bump = fields.bump
  }

  static async fetch(
    c: Connection,
    address: PublicKey,
    programId: PublicKey = PROGRAM_ID
  ): Promise<RestakingPool | null> {
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
  ): Promise<Array<RestakingPool | null>> {
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

  static decode(data: Buffer): RestakingPool {
    if (!data.slice(0, 8).equals(RestakingPool.discriminator)) {
      throw new Error("invalid account discriminator")
    }

    const dec = RestakingPool.layout.decode(data.slice(8))

    return new RestakingPool({
      lstMint: dec.lstMint,
      rstMint: dec.rstMint,
      bump: dec.bump,
    })
  }

  toJSON(): RestakingPoolJSON {
    return {
      lstMint: this.lstMint.toString(),
      rstMint: this.rstMint.toString(),
      bump: this.bump,
    }
  }

  static fromJSON(obj: RestakingPoolJSON): RestakingPool {
    return new RestakingPool({
      lstMint: new PublicKey(obj.lstMint),
      rstMint: new PublicKey(obj.rstMint),
      bump: obj.bump,
    })
  }
}
