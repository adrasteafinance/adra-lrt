export type CustomError =
  | UnsupportedStakingAsset
  | NonZeroRstMintSupply
  | NonLiquidMint
  | MintMismatch

export class UnsupportedStakingAsset extends Error {
  static readonly code = 6000
  readonly code = 6000
  readonly name = "UnsupportedStakingAsset"
  readonly msg = "Unsupported Staking Asset"

  constructor(readonly logs?: string[]) {
    super("6000: Unsupported Staking Asset")
  }
}

export class NonZeroRstMintSupply extends Error {
  static readonly code = 6001
  readonly code = 6001
  readonly name = "NonZeroRstMintSupply"
  readonly msg = "The RST mint supply must be zero during initialization"

  constructor(readonly logs?: string[]) {
    super("6001: The RST mint supply must be zero during initialization")
  }
}

export class NonLiquidMint extends Error {
  static readonly code = 6002
  readonly code = 6002
  readonly name = "NonLiquidMint"
  readonly msg = "This mint is not in the list of liquid mints"

  constructor(readonly logs?: string[]) {
    super("6002: This mint is not in the list of liquid mints")
  }
}

export class MintMismatch extends Error {
  static readonly code = 6003
  readonly code = 6003
  readonly name = "MintMismatch"
  readonly msg = "This mint does not match what is expected"

  constructor(readonly logs?: string[]) {
    super("6003: This mint does not match what is expected")
  }
}

export function fromCode(code: number, logs?: string[]): CustomError | null {
  switch (code) {
    case 6000:
      return new UnsupportedStakingAsset(logs)
    case 6001:
      return new NonZeroRstMintSupply(logs)
    case 6002:
      return new NonLiquidMint(logs)
    case 6003:
      return new MintMismatch(logs)
  }

  return null
}
