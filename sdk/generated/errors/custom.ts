export type CustomError =
  | NonZeroRstMintSupply
  | InsufficientSSOLFundsForWithdraw
  | InsufficientStakedSOLFundsForWithdraw
  | InsufficientSSOLFundsForDelegate
  | InsufficientAvsTokenForUndelegate
  | MissingAccounts
  | OutputMintLimitExceeded
  | InvalidDelegateAuthority

export class NonZeroRstMintSupply extends Error {
  static readonly code = 6000
  readonly code = 6000
  readonly name = "NonZeroRstMintSupply"
  readonly msg = "The RST mint supply must be zero during initialization"

  constructor(readonly logs?: string[]) {
    super("6000: The RST mint supply must be zero during initialization")
  }
}

export class InsufficientSSOLFundsForWithdraw extends Error {
  static readonly code = 6001
  readonly code = 6001
  readonly name = "InsufficientSSOLFundsForWithdraw"
  readonly msg = "Insufficient sSOL funds for withdraw"

  constructor(readonly logs?: string[]) {
    super("6001: Insufficient sSOL funds for withdraw")
  }
}

export class InsufficientStakedSOLFundsForWithdraw extends Error {
  static readonly code = 6002
  readonly code = 6002
  readonly name = "InsufficientStakedSOLFundsForWithdraw"
  readonly msg = "Insufficient Staked SOL funds for withdraw"

  constructor(readonly logs?: string[]) {
    super("6002: Insufficient Staked SOL funds for withdraw")
  }
}

export class InsufficientSSOLFundsForDelegate extends Error {
  static readonly code = 6003
  readonly code = 6003
  readonly name = "InsufficientSSOLFundsForDelegate"
  readonly msg = "Insufficient sSOL funds for delegate"

  constructor(readonly logs?: string[]) {
    super("6003: Insufficient sSOL funds for delegate")
  }
}

export class InsufficientAvsTokenForUndelegate extends Error {
  static readonly code = 6004
  readonly code = 6004
  readonly name = "InsufficientAvsTokenForUndelegate"
  readonly msg = "Insufficient Staked SOL funds for delegate"

  constructor(readonly logs?: string[]) {
    super("6004: Insufficient Staked SOL funds for delegate")
  }
}

export class MissingAccounts extends Error {
  static readonly code = 6005
  readonly code = 6005
  readonly name = "MissingAccounts"
  readonly msg = "Missing necessary accounts"

  constructor(readonly logs?: string[]) {
    super("6005: Missing necessary accounts")
  }
}

export class OutputMintLimitExceeded extends Error {
  static readonly code = 6006
  readonly code = 6006
  readonly name = "OutputMintLimitExceeded"
  readonly msg = "Mint output exceeds limit"

  constructor(readonly logs?: string[]) {
    super("6006: Mint output exceeds limit")
  }
}

export class InvalidDelegateAuthority extends Error {
  static readonly code = 6007
  readonly code = 6007
  readonly name = "InvalidDelegateAuthority"
  readonly msg = "Invalid delegate authority"

  constructor(readonly logs?: string[]) {
    super("6007: Invalid delegate authority")
  }
}

export function fromCode(code: number, logs?: string[]): CustomError | null {
  switch (code) {
    case 6000:
      return new NonZeroRstMintSupply(logs)
    case 6001:
      return new InsufficientSSOLFundsForWithdraw(logs)
    case 6002:
      return new InsufficientStakedSOLFundsForWithdraw(logs)
    case 6003:
      return new InsufficientSSOLFundsForDelegate(logs)
    case 6004:
      return new InsufficientAvsTokenForUndelegate(logs)
    case 6005:
      return new MissingAccounts(logs)
    case 6006:
      return new OutputMintLimitExceeded(logs)
    case 6007:
      return new InvalidDelegateAuthority(logs)
  }

  return null
}
