// This repo outputs the bs58 serialized instruction for updating vault limits,
// Its meant to be used with Squads where you can create a transaction proposal.

import * as anchor from "@coral-xyz/anchor";
import { PublicKey, LAMPORTS_PER_SOL, Connection } from "@solana/web3.js";
import { UpdateMintLimitAccounts, UpdateMintLimitArgs, updateMintLimit } from "../sdk/generated/instructions";
import bs58 from "bs58";


const main = async () => {
    const connection = new Connection(process.env.SOLANA_MAINNET!);
    const newLimitLamports = 400 * LAMPORTS_PER_SOL;

    const accounts = {
        pool: new PublicKey("wYPqKV6XuRBSBU1zYiYB1ZTPhkR8PsDRz5kKgmSyum1"),
        delegateAuthority: new PublicKey("9T1qYHXbY5N6UJBvkmwcju5rjRtEMBUumuJUD8zLDrNi"),
    }

    const updateMintLimitIx = updateMintLimit({
        limit: new anchor.BN(newLimitLamports),
    } as UpdateMintLimitArgs, {
        authority: accounts.delegateAuthority,
        pool: accounts.pool,
    } as UpdateMintLimitAccounts);

    const { lastValidBlockHeight, blockhash } = await connection.getLatestBlockhash()
    let tx = new anchor.web3.Transaction({
        lastValidBlockHeight,
        blockhash,
        feePayer: accounts.delegateAuthority,
    }).add(updateMintLimitIx);

    console.log("bs58 encoded instruction: ");
    console.log(bs58.encode(tx.compileMessage().serialize()))
}

main();