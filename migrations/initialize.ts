import * as anchor from "@coral-xyz/anchor";
import { PublicKey, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, createAssociatedTokenAccountIdempotentInstruction, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { initialize, InitializeArgs, InitializeAccounts } from "../sdk/generated/instructions";
import { newTransactionWithComputeUnitPriceAndLimit } from "../scripts/helpers";
import { LRTPool } from "../sdk/generated/accounts";

const main = async () => {
    const provider = anchor.AnchorProvider.env();

    const accounts = {
        rstMint: new PublicKey("sSo14endRuUbvQaJS3dq36Q829a3A6BEfoeeRGJywEh"),
        pool: new PublicKey("wYPqKV6XuRBSBU1zYiYB1ZTPhkR8PsDRz5kKgmSyum1"),
        adraSOLMint: new PublicKey("4tARAT4ssRYhrENCTxxZrmjL741eE2G23Q1zLPDW2ipf"),
        delegateAuthority: new PublicKey("9T1qYHXbY5N6UJBvkmwcju5rjRtEMBUumuJUD8zLDrNi"),
    }

    const poolInputTokenVault = getAssociatedTokenAddressSync(
        accounts.rstMint,
        accounts.pool,
        true
      );
  
      const createInputVaultIx =
        createAssociatedTokenAccountIdempotentInstruction(
          provider.wallet.publicKey,
          poolInputTokenVault,
          accounts.pool,
          accounts.rstMint
        );
  
      let ix = initialize(
        {
          limit: new anchor.BN(300 * LAMPORTS_PER_SOL),
        } as InitializeArgs,
        {
          signer: provider.publicKey,
          delegateAuthority: accounts.delegateAuthority,
          inputTokenMint: accounts.rstMint,
          poolInputTokenVault,
          outputTokenMint: accounts.adraSOLMint,
          pool: accounts.pool,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        } as InitializeAccounts
      );
      let tx = newTransactionWithComputeUnitPriceAndLimit();

    tx.add(createInputVaultIx, ix);
    await provider.sendAndConfirm(tx);
}

main();