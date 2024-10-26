// This repo outputs the bs58 serialized instruction for undelegation,
// Its meant to be used with Squads where you can create a transaction proposal.

import * as anchor from "@coral-xyz/anchor";
import { PublicKey, LAMPORTS_PER_SOL, SystemProgram, Connection, Transaction } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, createAssociatedTokenAccountIdempotentInstruction, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { undelegate, UndelegateAccounts, UndelegateArgs } from "../sdk/generated/instructions";
import bs58 from "bs58";


const main = async () => {
    const connection = new Connection(process.env.SOLANA_MAINNET!);
    const lamportsToUndelegate = 1 * LAMPORTS_PER_SOL;

    const accounts = {
        rstMint: new PublicKey("sSo14endRuUbvQaJS3dq36Q829a3A6BEfoeeRGJywEh"),
        pool: new PublicKey("wYPqKV6XuRBSBU1zYiYB1ZTPhkR8PsDRz5kKgmSyum1"),
        adraSOLMint: new PublicKey("4tARAT4ssRYhrENCTxxZrmjL741eE2G23Q1zLPDW2ipf"),
        delegateAuthority: new PublicKey("9T1qYHXbY5N6UJBvkmwcju5rjRtEMBUumuJUD8zLDrNi"),
        avs: new PublicKey("HBkJwH6rjUUBK1wNhBuYgo9Wnk1iCx2phduyxWCQj6uk"),
        avsTokenMint: new PublicKey("sonickAJFiVLcYXx25X9vpF293udaWqDMUCiGtk7dg2"),
        avsTokenVault: new PublicKey(
          "Bc7hj6aFhBRihZ8dYp8qXWbuDBXYMya4dzFGmHezLnB7"
        ),
        avsProgram: new PublicKey("endoLNCKTqDn8gSVnN2hDdpgACUPWHZTwoYnnMybpAT"),
    }

    const poolInputTokenVault = getAssociatedTokenAddressSync(
        accounts.rstMint,
        accounts.pool,
        true
      );
    const poolAvsTokenVault = getAssociatedTokenAddressSync(
        accounts.avsTokenMint,
        accounts.pool,
        true
      );

    const inputTokenBalance = await connection.getTokenAccountBalance(poolInputTokenVault);
    console.log("Input Token Balance: ", inputTokenBalance.value);
    console.log("Amount: ", lamportsToUndelegate);

    const createAccountIx = createAssociatedTokenAccountIdempotentInstruction(
        accounts.delegateAuthority,
        poolAvsTokenVault,
        accounts.pool,
        accounts.avsTokenMint,
    );

    const undelegateIx = undelegate({
        amount: new anchor.BN(lamportsToUndelegate),
    } as UndelegateArgs, {
        signer: accounts.delegateAuthority,
        avs: accounts.avs,
        avsTokenMint: accounts.avsTokenMint,
        avsInputTokenVault: accounts.avsTokenVault,
        inputTokenMint: accounts.rstMint,
        poolInputTokenVault,
        poolAvsTokenVault: getAssociatedTokenAddressSync(
          accounts.avsTokenMint,
          accounts.pool,
          true
        ),
        pool: accounts.pool,
        avsProgram: accounts.avsProgram,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
    } as UndelegateAccounts);

    const { lastValidBlockHeight, blockhash } = await connection.getLatestBlockhash()
    let tx = new anchor.web3.Transaction({
        lastValidBlockHeight,
        blockhash,
        feePayer: accounts.delegateAuthority,
    }).add(createAccountIx, undelegateIx);

    console.log("bs58 encoded instruction: ");
    console.log(bs58.encode(tx.compileMessage().serialize()))
}

main();