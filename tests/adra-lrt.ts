import {
  AddedAccount,
  AddedProgram,
  AccountInfoBytes,
  start,
  ProgramTestContext,
} from "solana-bankrun";
import { BankrunProvider } from "anchor-bankrun";
import {
  PublicKey,
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
  StakeProgram,
} from "@solana/web3.js";
import {
  initialize,
  InitializeAccounts,
  InitializeArgs,
  DepositArgs,
  DepositAccounts,
  deposit,
  delegate,
  DelegateArgs,
  DelegateAccounts,
  withdrawDelegatedStake,
  WithdrawDelegatedStakeArgs,
  WithdrawDelegatedStakeAccounts,
} from "../sdk/generated/instructions";
import {
  restake,
  RestakeAccounts,
  RestakeArgs,
  unrestake,
  UnrestakeArgs,
  UnrestakeAccounts,
} from "./restaking_program_sdk/instructions";
import {
  AccountLayout,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import * as anchor from "@coral-xyz/anchor";
import {
  DepositSolParams,
  STAKE_POOL_PROGRAM_ID,
  StakePoolInstruction,
  StakePool,
  getStakePoolAccount,
  WithdrawStakeParams,
  stakePoolInfo,
} from "@solana/spl-stake-pool";
import { LRTPool } from "../sdk/generated/accounts";
import { assert } from "chai";

const fetchAddedAccounts = async (
  connection: Connection,
  accounts: PublicKey[]
): Promise<AddedAccount[]> => {
  let addedAccounts: AddedAccount[] = [];

  const N = 100;
  for (let i = 0; i < accounts.length; i += N) {
    const slice = accounts.slice(i, i + N);
    const fetchedAccounts = await connection.getMultipleAccountsInfo(slice);
    fetchedAccounts.forEach((accountInfo, index) => {
      if (accountInfo === null) return;
      const address = slice[index];
      addedAccounts.push({
        address,
        info: {
          data: Buffer.from(accountInfo.data),
          executable: accountInfo.executable,
          lamports: accountInfo.lamports,
          owner: accountInfo.owner,
          rentEpoch: accountInfo.rentEpoch,
        } as AccountInfoBytes,
      });
    });
  }

  return addedAccounts;
};

const fetchSolayerInfo = async (
  url: string = "https://app.solayer.org/api/info"
) => {
  try {
    const response = await fetch(url, {
      method: "GET", // The API is accessed via a GET request.
      headers: {
        "Content-Type": "application/json", // Specify that we're working with JSON.
      },
    });

    // Check if the response is OK (status code 200-299)
    if (!response.ok) {
      throw new Error(`Error fetching data: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching Solayer info:", error);
  }
};

const fetchSsolPrice = async (
  connection: Connection,
  stakePoolAddress: PublicKey
) => {
  let info = await stakePoolInfo(connection, stakePoolAddress);
  let nativeSolStaked = info.details.reserveStakeLamports;
  for (let i = 0; i < info.details.stakeAccounts.length; i++) {
    nativeSolStaked += parseInt(
      info.details.stakeAccounts[i].validatorLamports
    );
  }
  let lstSupply = parseInt(info.poolTokenSupply);
  let conversionRate = nativeSolStaked / lstSupply;
  return conversionRate;
};

const signAndSendTransaction = async (
  provider: BankrunProvider,
  tx: Transaction,
  signers?: anchor.web3.Signer[]
) => {
  let [recentBlockhash] =
    await provider.context.banksClient.getLatestBlockhash();
  tx.recentBlockhash = recentBlockhash;
  tx.feePayer = provider.publicKey;
  tx = await provider.wallet.signTransaction(tx);
  await provider.sendAndConfirm(tx, signers);
};

describe("adra-lrt", () => {
  let context: ProgramTestContext;
  let provider: BankrunProvider;
  let delegateAuthority = Keypair.generate();
  //let adraSOLMint = //Keypair.generate();
  let connection = new Connection("https://api.mainnet-beta.solana.com");
  const accounts = {
    solayerStakePool: new PublicKey(
      "po1osKDWYF9oiVEGmzKA4eTs8eMveFRMox3bUKazGN2"
    ),
    withdrawAuthority: new PublicKey(
      "H5rmot8ejBUWzMPt6E44h27xj5obbSz3jVuK4AsJpHmv"
    ),
    restakingPool: new PublicKey(
      "3sk58CzpitB9jsnVzZWwqeCn2zcXVherhALBh88Uw9GQ"
    ),
    restakingPoolVault: new PublicKey(
      "4eimDGZonDS41b7YEEtxuX1JbSRLanH2BLJfG5sqbCsB"
    ),
    rstMint: new PublicKey("sSo14endRuUbvQaJS3dq36Q829a3A6BEfoeeRGJywEh"),
    lstMint: new PublicKey("sSo1wxKKr6zW2hqf5hZrp2CawLibcwi1pMBqk5bg2G4"),
    avs: new PublicKey("HBkJwH6rjUUBK1wNhBuYgo9Wnk1iCx2phduyxWCQj6uk"),
    avsTokenMint: new PublicKey("sonickAJFiVLcYXx25X9vpF293udaWqDMUCiGtk7dg2"),
    avsTokenVault: new PublicKey(
      "Bc7hj6aFhBRihZ8dYp8qXWbuDBXYMya4dzFGmHezLnB7"
    ),
    validatorAccount: new PublicKey(
      "CpWqBteUJodiTcGYWsxq4WTaBPoZJyKkBbkWwAMXSyTK"
    ),
    // clock: SYSVAR_CLOCK_PUBKEY,
    validatorList: new PublicKey("nk5E1Gc2rCuU2MDTRqdcQdiMfV9KnZ6JHykA1cTJQ56"),
    managerFeeAccount: new PublicKey(
      "ARs3HTD79nsaUdDKqfGhgbNMVJkXVdRs2EpHAm4LNEcq"
    ),
    adraSOLMint: new PublicKey("4tARAT4ssRYhrENCTxxZrmjL741eE2G23Q1zLPDW2ipf"),
  };
  const programs = {
    lrtTemplate: new PublicKey("Lrt1aE9sgjyi6B9QEdcuzHC8GhU32N3PM9RSKLBeD7b"),
    solayer: new PublicKey("sSo1iU21jBrU9VaJ8PJib1MtorefUV4fzC9GURa2KNn"),
    stakePool: new PublicKey("SPoo1Ku8WFXoNDMHPsrGSTSG1Y47rzgn41SLUNakuHy"),
    endoAvs: new PublicKey("endoLNCKTqDn8gSVnN2hDdpgACUPWHZTwoYnnMybpAT"),
  };
  const pool = PublicKey.findProgramAddressSync(
    [Buffer.from("lrt_pool"), accounts.adraSOLMint.toBuffer()],
    programs.lrtTemplate
  )[0];

  before(async () => {
    const addedPrograms: AddedProgram[] = Object.values(programs).map(
      (programId) => {
        return {
          name: programId.toString(),
          programId,
        };
      }
    );

    const addedAccounts = await fetchAddedAccounts(
      connection,
      Object.values(accounts)
    );

    context = await start(addedPrograms, addedAccounts);
    provider = new BankrunProvider(context);
  });

  it("Initialize program", async () => {
    // Create instructions for creating a mint
    // Allocate space and create the mint account on-chain
    // const createMintAccountTx = SystemProgram.createAccount({
    //   fromPubkey: provider.publicKey,
    //   newAccountPubkey: accounts.adraSOLMint,
    //   space: MINT_SIZE, // Space required for a mint account
    //   lamports: await getMinimumBalanceForRentExemptMint(connection), // Minimum balance for rent-exemption
    //   programId: TOKEN_PROGRAM_ID, // The Token program ID
    // });

    // // Initialize the mint account
    // const initializeMintTx = createInitializeMintInstruction(
    //   adraSOLMint.publicKey,
    //   9,
    //   pool,
    //   pool
    // );

    const poolInputTokenVault = getAssociatedTokenAddressSync(
      accounts.rstMint,
      pool,
      true
    );

    const createInputVaultIx =
      createAssociatedTokenAccountIdempotentInstruction(
        provider.wallet.publicKey,
        poolInputTokenVault,
        pool,
        accounts.rstMint
      );

    let ix = initialize(
      {
        limit: new anchor.BN(10 * LAMPORTS_PER_SOL),
      } as InitializeArgs,
      {
        signer: provider.publicKey,
        delegateAuthority: provider.publicKey,
        inputTokenMint: accounts.rstMint,
        poolInputTokenVault,
        outputTokenMint: accounts.adraSOLMint,
        pool,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      } as InitializeAccounts
    );

    let [recentBlockhash, _] = await context.banksClient.getLatestBlockhash(
      "finalized"
    );
    let tx = new Transaction().add(...[createInputVaultIx, ix]);
    tx.recentBlockhash = recentBlockhash;
    tx.feePayer = provider.wallet.publicKey;
    tx = await provider.wallet.signTransaction(tx);

    await provider.sendAndConfirm(tx);
  });

  it("Deposit to get SOL -> adraSOL", async () => {
    let inputAmount = 10 * LAMPORTS_PER_SOL;
    // Need to setup instructions to:
    // 1. spl-stake-pool deposit to get LST
    let lstAta = getAssociatedTokenAddressSync(
      accounts.lstMint,
      provider.publicKey,
      true
    );
    let rstAta = getAssociatedTokenAddressSync(
      accounts.rstMint,
      provider.publicKey,
      true
    );
    let adraSolAta = getAssociatedTokenAddressSync(
      accounts.adraSOLMint,
      provider.publicKey,
      true
    );
    let createLstAtaIx = createAssociatedTokenAccountIdempotentInstruction(
      provider.publicKey,
      lstAta,
      provider.publicKey,
      accounts.lstMint
    );
    let createRstAtaIx = createAssociatedTokenAccountIdempotentInstruction(
      provider.publicKey,
      rstAta,
      provider.publicKey,
      accounts.rstMint
    );
    let createAdraSolAtaIx = createAssociatedTokenAccountIdempotentInstruction(
      provider.publicKey,
      adraSolAta,
      provider.publicKey,
      accounts.adraSOLMint
    );

    // Fetch stake pool
    const stakePool: StakePool = (
      await getStakePoolAccount(connection, accounts.solayerStakePool)
    ).account.data;

    const ssolPrice = await fetchSsolPrice(
      connection,
      accounts.solayerStakePool
    );

    const withdrawAuthority = PublicKey.findProgramAddressSync(
      [accounts.solayerStakePool.toBuffer(), Buffer.from("withdraw")],
      STAKE_POOL_PROGRAM_ID
    )[0];

    let stake_for_lst_ix = StakePoolInstruction.depositSol({
      stakePool: accounts.solayerStakePool,
      withdrawAuthority,
      reserveStake: stakePool.reserveStake,
      fundingAccount: provider.publicKey,
      destinationPoolAccount: lstAta,
      managerFeeAccount: stakePool.managerFeeAccount,
      referralPoolAccount: lstAta,
      poolMint: stakePool.poolMint,
      lamports: inputAmount,
    } as DepositSolParams);
    // 2. Restake with Solayer to get sSOL
    // NOTE: This calculation can also be done by simulation
    const restakeAmount = new anchor.BN(Math.floor(inputAmount / ssolPrice));

    let restake_ix = restake(
      {
        amount: restakeAmount,
      } as RestakeArgs,
      {
        signer: provider.publicKey,
        lstMint: accounts.lstMint,
        lstAta,
        rstAta,
        rstMint: accounts.rstMint,
        vault: accounts.restakingPoolVault,
        pool: accounts.restakingPool,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      } as RestakeAccounts
    );

    // 3. Deposit sSOL to get adraSOL
    let deposit_ix = deposit(
      {
        amount: restakeAmount,
      } as DepositArgs,
      {
        signer: provider.publicKey,
        inputTokenMint: accounts.rstMint,
        signerInputTokenVault: rstAta,
        poolInputTokenVault: getAssociatedTokenAddressSync(
          accounts.rstMint,
          pool,
          true
        ),
        outputTokenMint: accounts.adraSOLMint,
        signerOutputTokenVault: adraSolAta,
        pool,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      } as DepositAccounts
    );

    // Run Tx
    let tx = new Transaction().add(
      ...[
        createLstAtaIx,
        createRstAtaIx,
        createAdraSolAtaIx,
        stake_for_lst_ix,
        restake_ix,
        deposit_ix,
      ]
    );
    let [recentBlockhash, _] = await context.banksClient.getLatestBlockhash(
      "finalized"
    );
    tx.recentBlockhash = recentBlockhash;
    tx.feePayer = provider.wallet.publicKey;
    tx = await provider.wallet.signTransaction(tx);

    await provider.sendAndConfirm(tx);
    // Check if the destination account has the correct amount of LST
    let accountInfo = await context.banksClient.getAccount(adraSolAta);
    let tokenAccount = AccountLayout.decode(accountInfo.data);
    assert(Number(tokenAccount.amount.toString()) > 0);
  });

  it("delegate stake", async () => {
    let delegateAmount = new anchor.BN(5 * LAMPORTS_PER_SOL);

    let ix = delegate(
      {
        amount: delegateAmount,
      } as DelegateArgs,
      {
        signer: provider.publicKey,
        avs: accounts.avs,
        avsTokenMint: accounts.avsTokenMint,
        avsInputTokenVault: accounts.avsTokenVault,
        inputTokenMint: accounts.rstMint,
        poolInputTokenVault: getAssociatedTokenAddressSync(
          accounts.rstMint,
          pool,
          true
        ),
        poolAvsTokenVault: getAssociatedTokenAddressSync(
          accounts.avsTokenMint,
          pool,
          true
        ),
        pool,
        avsProgram: programs.endoAvs,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      } as DelegateAccounts
    );

    await signAndSendTransaction(provider, new Transaction().add(ix));
  });

  it("withdraw stake", async () => {
    const stakePool: StakePool = (
      await getStakePoolAccount(connection, accounts.solayerStakePool)
    ).account.data;

    let rstAta = getAssociatedTokenAddressSync(
      accounts.rstMint,
      provider.publicKey,
      true
    );
    let lstAta = getAssociatedTokenAddressSync(
      accounts.lstMint,
      provider.publicKey,
      true
    );
    let poolInputTokenVault = getAssociatedTokenAddressSync(
      accounts.rstMint,
      pool,
      true
    );
    let poolAvsTokenVault = getAssociatedTokenAddressSync(
      accounts.avsTokenMint,
      pool,
      true
    );

    let accountInfo = await context.banksClient.getAccount(poolAvsTokenVault);
    let tokenAccount = AccountLayout.decode(accountInfo.data);
    let amount = new anchor.BN(tokenAccount.amount.toString());

    let ix = withdrawDelegatedStake(
      {
        amount,
      } as WithdrawDelegatedStakeArgs,
      {
        signer: provider.publicKey,
        inputTokenMint: accounts.rstMint,
        signerInputTokenVault: rstAta,
        poolInputTokenVault,
        outputTokenMint: accounts.adraSOLMint,
        signerOutputTokenVault: getAssociatedTokenAddressSync(
          accounts.adraSOLMint,
          provider.publicKey,
          true
        ),
        pool,
        avs: accounts.avs,
        avsTokenMint: accounts.avsTokenMint,
        avsInputTokenVault: getAssociatedTokenAddressSync(
          accounts.rstMint,
          accounts.avs,
          true
        ),
        poolAvsTokenVault,
        avsProgram: programs.endoAvs,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      } as WithdrawDelegatedStakeAccounts
    );

    let unrestake_ix = unrestake(
      {
        amount,
      } as UnrestakeArgs,
      {
        signer: provider.publicKey,
        lstMint: accounts.lstMint,
        lstAta,
        rstAta,
        rstMint: accounts.rstMint,
        vault: accounts.restakingPoolVault,
        pool: accounts.restakingPool,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      } as UnrestakeAccounts
    );

    // TODO: Add ALT
    let stakeAccountKp = Keypair.generate();
    const createStakeAccountIx = SystemProgram.createAccount({
      fromPubkey: provider.publicKey,
      newAccountPubkey: stakeAccountKp.publicKey,
      space: StakeProgram.space,
      lamports: await connection.getMinimumBalanceForRentExemption(
        StakeProgram.space
      ),
      programId: StakeProgram.programId,
    });

    await signAndSendTransaction(
      provider,
      new Transaction().add(...[ix, unrestake_ix, createStakeAccountIx]),
      [stakeAccountKp]
    );

    const currentBalance = await context.banksClient.getBalance(
      provider.publicKey
    );

    let accountInfoLst = await context.banksClient.getAccount(lstAta);
    let tokenAccountLst = AccountLayout.decode(accountInfoLst.data);
    let lstAmount = new anchor.BN(tokenAccountLst.amount.toString());

    let withdrawStakeIx = StakePoolInstruction.withdrawStake({
      stakePool: accounts.solayerStakePool,
      validatorList: stakePool.validatorList,
      withdrawAuthority: accounts.withdrawAuthority,
      validatorStake: accounts.validatorAccount,
      destinationStake: stakeAccountKp.publicKey,
      destinationStakeAuthority: provider.publicKey,
      sourceTransferAuthority: provider.publicKey,
      sourcePoolAccount: lstAta,
      managerFeeAccount: stakePool.managerFeeAccount,
      poolMint: stakePool.poolMint,
      poolTokens: lstAmount.toNumber(),
    } as WithdrawStakeParams);

    // deactivate stake account
    let deactivateIx = StakeProgram.deactivate({
      stakePubkey: stakeAccountKp.publicKey,
      authorizedPubkey: provider.publicKey,
    });

    let withdrawIx = StakeProgram.withdraw({
      stakePubkey: stakeAccountKp.publicKey,
      authorizedPubkey: provider.publicKey,
      toPubkey: provider.publicKey,
      lamports: lstAmount.toNumber(),
    });

    await signAndSendTransaction(
      provider,
      new Transaction().add(...[withdrawStakeIx, deactivateIx, withdrawIx])
    );

    const newBalance = await context.banksClient.getBalance(provider.publicKey);

    assert(newBalance > currentBalance);
  });
});
