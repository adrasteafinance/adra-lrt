# 1. About Shieldify

Positioned as the first hybrid Web3 Security company, Shieldify shakes things up with a unique subscription-based auditing model that entitles the customer to unlimited audits within its duration, as well as top-notch service quality thanks to a disruptive 6-layered security approach. The company works with very well-established researchers in the space and has secured multiple millions in TVL across protocols, also can audit codebases written in Solidity, Vyper, Rust, Cairo, Move and Go.

Learn more about us at [`shieldify.org`](https://shieldify.org/).

# 2. Disclaimer

This security review does not guarantee bulletproof protection against a hack or exploit. Smart contracts are a novel technological feat with many known and unknown risks. The protocol, which this report is intended for, indemnifies Shieldify Security against any responsibility for any misbehavior, bugs, or exploits affecting the audited code during any part of the project's life cycle. It is also pivotal to acknowledge that modifications made to the audited code, including fixes for the issues described in this report, may introduce new problems and necessitate additional auditing.

# 3. About Adra LRT

Adrastea's main purpose is ultra-accessible real yields on Solana. As a restaking protocol, an input token and an output token (LRT) are needed for the restaking pool. The input token can be any form of asset the pool takes and the output token should be the liquid restaking token issued by the restaking pool. Users transfer the input tokens to the restaking pool and should get the output token (LRT) back. Under the hood, the restaking pool delegates authority delegates/undelegated the input token to AVSs and manages the AVS token. Users should be able to withdraw their funds anytime, even if there is no enough input token liquidity in the restaking pool.

# 4. Risk Classification

|        Severity        | Impact: High | Impact: Medium | Impact: Low |
| :--------------------: | :----------: | :------------: | :---------: |
|  **Likelihood: High**  |   Critical   |      High      |   Medium    |
| **Likelihood: Medium** |     High     |     Medium     |     Low     |
|  **Likelihood: Low**   |    Medium    |      Low       |     Low     |

## 4.1 Impact

- **High** - results in a significant risk for the protocol’s overall well-being. Affects all or most users
- **Medium** - results in a non-critical risk for the protocol affects all or only a subset of users, but is still
  unacceptable
- **Low** - losses will be limited but bearable - and covers vectors similar to griefing attacks that can be easily repaired

## 4.2 Likelihood

- **High** - almost certain to happen and highly lucrative for execution by malicious actors
- **Medium** - still relatively likely, although only conditionally possible
- **Low** - requires a unique set of circumstances and poses non-lucrative cost-of-execution to rewards ratio for the actor

# 5. Security Review Summary

The security review lasted 6 days with a total of 48 hours dedicated by `0xcastle_chain` from the Shieldify team.

Overall, the code is well-written. The audit report contributed by identifying one Critical and one High severity issue,
arbitrary input tokens, token extensions leading to invariant manipulation, and denial of service due to the risk of input token mint being led by freeze authority.

## 5.1 Protocol Summary

| **Project Name**             | Adra LRT                                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Repository**               | [adra-lrt](https://github.com/adrasteafinance/adra-lrt)                                                                               |
| **Type of Project**          | DeFi, Liquid restaking protocol                                                                                                       |
| **Security Review Timeline** | 6 days                                                                                                                                |
| **Review Commit Hash**       | [47ce20e98b23ea7e5e3fb4d9eef089f201de2218](https://github.com/adrasteafinance/adra-lrt/tree/47ce20e98b23ea7e5e3fb4d9eef089f201de2218) |
| **Fixes Review Commit Hash** | N/A                                                                                                                                   |

## 5.2 Scope

The following smart contracts were in the scope of the security review:

| File                                                          | LOC |
| ------------------------------------------------------------- | :-: |
| programs/adra-lrt/src/utils.rs                                |   6 |
| programs/adra-lrt/src/lib.rs                                  |  70 |
| programs/adra-lrt/src/errors.rs                               |  28 |
| programs/adra-lrt/src/state/lrt_pool.rs                       |  12 |
| programs/adra-lrt/src/state/mod.rs                            |   2 |
| programs/adra-lrt/src/contexts/delegate.rs                    | 188 |
| programs/adra-lrt/src/contexts/deposit.rs                     | 110 |
| programs/adra-lrt/src/contexts/initialize.rs                  |  57 |
| programs/adra-lrt/src/contexts/mod.rs                         |  20 |
| programs/adra-lrt/src/contexts/transfer_delegate_authority.rs |  25 |
| programs/adra-lrt/src/contexts/update_mint_limit.rs           |  23 |
| programs/adra-lrt/src/contexts/withdraw.rs                    | 109 |
| programs/adra-lrt/src/contexts/withdraw_stake.rs              | 201 |
| Total                                                         | 851 |

# 6. Findings Summary

The following number of issues have been identified, sorted by their severity:

- **Critical and High** issues: 2
- **Low** issues: 3
- **Info** issues: 1

| **ID** | **Title**                                                                     | **Severity** | **Status** |
| :----: | ----------------------------------------------------------------------------- | :----------: | :--------: |
| [C-01] | Arbitrary Input Tokens and Token Extensions Leading to Invariant Manipulation |   Critical   |    N/A     |
| [H-01] | Risk of Input Token Mint with Freeze Authority Leading to Permanent DoS       |     High     |    N/A     |
| [L-01] | Require New Authority as Co-Signer for Authority Transmission                 |     Low      |    N/A     |
| [L-02] | Insufficient Account Size Checks and Lack of Reallocation Support             |     Low      |    N/A     |
| [L-03] | Missing Event Emissions for State-Changing Functions                          |     Low      |    N/A     |
| [I-01] | Add Pauser Role to Pool Struct for Emergency Pausing                          |     Info     |    N/A     |

# 7. Findings

# [C-01] Arbitrary Input Tokens and Token Extensions Leading to Invariant Manipulation

## Severity

Critical Risk

## Description

The current implementation allows arbitrary input tokens with different extensions, which can lead to manipulation of critical invariants such as `input_decimals == output_decimals`. Specifically, allowing the `closeMint` extension poses a risk as it permits the initializer to modify the mint’s decimal value after creation, breaking important assumptions about token behavior.

For instance, the initializer controls the mint’s decimal value, which could be changed after registration. This disrupts the invariant that `input_decimals == output_decimals`, crucial for operations like deposits and withdrawals based on a 1:1 ratio. Furthermore, other token extensions, such as the `transfer fee` extension, can also be harmful to the protocol.

The current implementation shows an attempt to check the mint's decimal value:

```rust
#[account(
    mint::decimals = input_token_mint.decimals,
    mint::authority = pool,
    mint::freeze_authority = pool,
    mint::token_program = token_program,
    constraint = output_token_mint.supply == 0 @ LRTPoolError::NonZeroRstMintSupply
)]
output_token_mint: Box<InterfaceAccount<'info, Mint>>,
```

However, this does not fully protect against the possibility of manipulating the token's decimal value via the `closeMint` extension or similar risky extensions, leaving the protocol vulnerable. The following function relies on the assumption of matching decimals:

```rust
pub fn calculate_input_token_amount(&self, amount: u64) -> u64 {
    amount
}
```

This invariant is broken if the decimal values of the tokens differ, which could result in an imbalance such as 1:100 or another unintended ratio.

## Impact

Allowing arbitrary token extensions, especially the `closeMint` extension, can lead to a mismatch between input and output token decimals, which directly affects the protocol’s operations. The most significant impact is **loss of user funds**, as users could end up trading tokens at ratios like 1:100 instead of the expected 1:1 due to differences in token decimal values.

Additionally, extensions such as the `transfer fee` extension can further degrade the protocol’s security, leading to unpredictable fees and impacting the fairness and integrity of token exchanges.

## Recommendations

To mitigate these risks, consider the following approaches:

1. **Hard Code the Token Program to SPL Token Program**:
   Ensure that the token program used is restricted to the SPL token program (`spl-token-2022` or `spl-token`), preventing the use of arbitrary tokens with potentially harmful extensions.

2. **Filter Allowed Extensions**:
   If the protocol requires support with extensions, implement a filtering mechanism to allow only safe extensions while rejecting dangerous ones such as `closeMint` and `transfer fee`. Specifically, enforce strict checks on the token's properties to maintain the `input_decimals == output_decimals` invariant.

Implementing these controls will safeguard the protocol from vulnerabilities associated with token extension manipulation and ensure that users' funds are not subject to unexpected losses.

## Team Response

N/A

# [H-01] Risk of Input Token Mint with Freeze Authority Leading to Permanent DoS

## Severity

High Risk

## Description

The current implementation allows the input token mint to have a freeze authority, which can result in a potential denial of service (DoS) attack on the pool. If the input token mint’s freeze authority exercises control, the pool’s input token vault can be frozen, leading to a **permanent loss of funds** for users. This is a critical issue, as frozen token accounts cannot transfer tokens, rendering the pool inoperable.

Here’s the relevant code:

```rust
#[account(
    mint::token_program = token_program,
)]
input_token_mint: Box<InterfaceAccount<'info, Mint>>,

#[account(
    mut,
    associated_token::authority = pool,
    associated_token::mint = input_token_mint,
    associated_token::token_program = token_program
)]
pool_input_token_vault: Box<InterfaceAccount<'info, TokenAccount>>,
```

The pool relies on the assumption that the input token mint is safe, but if the input token mint has a freeze authority, that authority can freeze the pool's input token vault. This could prevent further deposits, withdrawals, or transfers, effectively freezing user funds.

## Impact

- **Denial of Service (DoS)**: The pool’s input token vault can be frozen by the mint’s freeze authority, halting all operations that involve this vault.
- **Permanent Loss of Funds**: If the vault is frozen, users will not be able to withdraw their funds, leading to a potential permanent loss of funds if the freeze is never lifted.

## Recommendations

1. **Validate Absence of Freeze Authority**:
   Ensure that the input token mint does not have a freeze authority or that the pool controls the freeze authority, preventing any external actor from freezing the pool's input token vault.

   Example:

   ```rust
   #[account(
       mint::freeze_authority = COption::None, // Ensure no freeze authority exists
       mint::token_program = token_program,
   )]
   input_token_mint: Box<InterfaceAccount<'info, Mint>>,
   ```

## Team Response

N/A

# [L-01] Require New Authority as Co-Signer for Authority Transmission

## Severity

Low Risk

## Description

The current `TransferDelegateAuthority` function allows for the transfer of delegate authority without any validation or a two-step confirmation process. This lack of validation can lead to critical errors, such as mistakenly transferring the delegate authority to an invalid or unintended address. As a result, control over the pool could be lost, leading to severe consequences for the protocol.

In the current implementation:

```rust
pub struct TransferDelegateAuthority<'info> {
    #[account(mut)]
    authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"lrt_pool", pool.output_token_mint.key().as_ref()],
        bump = pool.bump,
        constraint = pool.delegate_authority == authority.key()
    )]
    pool: Account<'info, LRTPool>,
    new_authority: UncheckedAccount<'info>,
}

impl<'info> TransferDelegateAuthority<'info> {
    pub fn transfer_authority(&mut self) -> Result<()> {
        self.pool.delegate_authority = self.new_authority.key();
        Ok(())
    }
}
```

There is no validation that the `new_authority` is intentional or valid, nor is there a requirement for the new authority to approve the transfer.

## Impact

If the delegate authority is mistakenly set to an invalid address, the protocol would lose control over the pool's functions This could lead to :

- Permanent loss of control over the pool and prevent delegations

## Recommendation

To prevent accidental transfers and loss of control, introduce the following improvements:

1. **Require the New Authority as a Co-Signer**: To ensure that the transfer is intentional, the new authority must also sign the transaction, proving they are aware of and agree to take over the role.

2. **Implement a Two-Step Transfer Process**: Split the admin transfer into two steps: first, initiating the transfer and, second, confirming the transfer by the new authority.

## Team Response

N/A

# [L-02] Insufficient Account Size Checks and Lack of Reallocation Support

## Severity

Low Risk

## Description

The protocol currently relies on hardcoded account sizes, which limits flexibility when updating or upgrading the account structures in the future. The lack of proper account size checks or reallocation support could result in accounts being too small to accommodate new fields or upgrades. For example, if the structure of `LRTPool` is updated, but the account size is fixed, it would lead to failures in adding new data without reallocation.

The protocol needs to account for Solana's support for account data reallocation to ensure that future updates are not restricted by insufficient space.

## Impact

- **Upgrade Limitations**: Without flexible account sizing, future upgrades that require adding fields to structures like `LRTPool` could fail due to insufficient space in accounts.
- **Account Initialization Failures**: When account sizes are not checked or adjusted dynamically, any changes in the structure would necessitate manual resizing and redeployment, causing operational inefficiencies.

## Recommendation

- **Add Padding Space**: Introduce extra padding in account structures like `LRTPool` to accommodate future upgrades without requiring immediate reallocation.

```rs
pub struct LRTPool {
    pub bump: u8,
    pub input_token_mint: Pubkey,
    pub output_token_mint: Pubkey,
    pub delegate_authority: Pubkey,
    pub output_mint_limit: u64,
    pub padding: [u8; 64],  // Padding to support future upgrades
}
```

- **Increase Initial Space Allocation**: Adjust the space allocated during account initialization to account for this padding, ensuring there's enough buffer for future changes. This can be done by increasing the `init` space parameter during account creation.

- **Dynamic Size Checks and Reallocation**: Implement checks for account size limits and enable reallocation to expand account sizes dynamically as needed for updates or protocol changes.

## Team Response

N/A

# [L-03] Missing Event Emissions for State-Changing Functions

## Severity

Low Risk

## Description

The protocol’s state-changing functions, such as `stake`, `deposit`, and `withdraw`, do not emit events after execution. Events are critical for notifying off-chain components (such as explorers, indexers, and dApps) of changes to account states. Without events, it becomes challenging for external systems to track state changes, which can lead to inefficiencies in querying or monitoring the protocol.

For example, in the `stake` and `deposit` functions, there are no event emissions, making it difficult to track when tokens are staked, deposited, or withdrawn from the pool.

## Impact

- **Lack of Transparency**: Off-chain components will not be able to listen to state changes efficiently, making it harder to track or monitor critical actions such as token deposits or staking.

- **Operational Inefficiencies**: Off-chain services may need to repeatedly query on-chain data, increasing the load on the network and slowing down interactions.

## Recommendation

1. **Emit Events for State Changes**: Ensure that every function that changes the state (e.g., `stake`, `deposit`, `withdraw`, `delegate`) emits an event after completing the action. This event should include relevant data such as the amount staked or withdrawn, the accounts involved, and the resulting new state.

Example for `deposit` function:

```rs
#[event]
pub struct DepositEvent {
    pub depositor: Pubkey,
    pub amount: u64,
    pub pool: Pubkey,
    pub timestamp: i64,
}

pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    // transfer input token into the pool
    ctx.accounts.stake(amount)?;

    // calculate mint amount
    let mint_amount = ctx.accounts.calculate_output_token_amount(amount);

    // mint output token
    ctx.accounts.mint_output_token(mint_amount)?;

    // emit the event
    emit!(DepositEvent {
        depositor: ctx.accounts.signer.key(),
        amount,
        pool: ctx.accounts.pool.key(),
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
```

2. **Add Similar Events for Other Functions**: Implement similar events for other state-changing functions like `withdraw` and `delegate` to ensure all state changes are observable by off-chain components.

## Team Response

N/A

# [I-01] Add Pauser Role to Pool Struct for Emergency Pausing

## Severity

Info

## Description

The current pool struct does not include any mechanism for pausing operations in case of malicious activity. By adding a `pauser` role and a `paused` flag, it will be possible to temporarily suspend key functions such as deposits, withdrawals, and staking. This enhancement allows administrators to quickly react to malicious actions or protocol vulnerabilities and halt operations until the issue is resolved.

Here’s the original struct:

```rust
pub struct LRTPool {
    pub bump: u8,
    pub input_token_mint: Pubkey,
    pub output_token_mint: Pubkey,
    pub delegate_authority: Pubkey, // The one who handles delegation
    pub output_mint_limit: u64,
}
```

## Recommendation

1. **Add a Pauser Role**: Introduce a new `pauser` role in the `LRTPool` struct that will be authorized to pause and resume operations.

   ```rust
   pub pauser: Pubkey, // The address that can pause the pool
   ```

2. **Add a Paused Flag**: Include a `paused` boolean flag to check if the pool is paused before allowing deposits, withdrawals, or staking.

   ```rust
   pub paused: bool, // Flag indicating whether deposits/withdrawals are paused
   ```

3. **Check the Paused Flag in Functions**: Before allowing deposits, withdrawals, or staking, ensure the logic checks whether the `paused` flag is set to `true`. If it is, halt the operation.

   Example in a deposit function:

   ```rust
   if pool.paused {
       return Err(LRTPoolError::PoolPaused); // Custom error for paused state
   }
   ```

## Updated Struct Example:

```rust
pub struct LRTPool {
    pub bump: u8,
    pub input_token_mint: Pubkey,
    pub output_token_mint: Pubkey,
    pub delegate_authority: Pubkey,
    pub output_mint_limit: u64,
    pub pauser: Pubkey,      // The one who can pause the pool
    pub paused: bool,        // Flag to indicate if operations are paused
}
```

This addition provides a safeguard to prevent malicious actions from causing further harm, as the pool's operations can be quickly paused in the event of suspicious or dangerous activity.

## Team Response

N/A
