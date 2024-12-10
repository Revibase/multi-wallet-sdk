import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  SendTransactionError,
  SystemProgram,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { BN } from "bn.js";
import { MultiWallet } from "../target/types/multi_wallet";
import {
  accountsForTransactionExecute,
  transactionMessageToMultisigTransactionMessageBytes,
} from "../utils";
import { vaultTransactionMessageBeet } from "../utils/types/VaultTransactionMessage";

describe("multi_wallet", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.MultiWallet as Program<MultiWallet>;
  const connection = new Connection(
    program.provider.connection.rpcEndpoint,
    "confirmed"
  );
  const payer = Keypair.generate();
  const wallet = Keypair.generate();
  const [multi_wallet] = PublicKey.findProgramAddressSync(
    [Buffer.from("multi_wallet"), wallet.publicKey.toBuffer()],
    program.programId
  );
  const [multi_wallet_vault] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("multi_wallet"),
      multi_wallet.toBuffer(),
      Buffer.from("vault"),
      new BN(0).toArrayLike(Buffer, "le", 2),
    ],
    program.programId
  );
  it("Create Multi Wallet!", async () => {
    const txSig = await connection.requestAirdrop(
      payer.publicKey,
      LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(txSig);

    const tx = await program.methods
      .create()
      .accounts({
        payer: payer.publicKey,
        createKey: wallet.publicKey,
      })
      .signers([wallet, payer])
      .rpc();
    await connection.confirmTransaction(tx);
    console.log("Your transaction signature", tx);
    console.log(await program.account.multiWallet.fetch(multi_wallet));
  });

  it("Set Owner to payer!", async () => {
    const tx = await program.methods
      .changeConfig(null, [payer.publicKey], 2)
      .accountsPartial({
        multiWallet: multi_wallet,
        payer: payer.publicKey,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .remainingAccounts([
        { pubkey: wallet.publicKey, isSigner: true, isWritable: false },
      ])
      .signers([wallet, payer])
      .rpc();
    console.log("Your transaction signature", tx);
    console.log(await program.account.multiWallet.fetch(multi_wallet));
  });

  // it("Set Owner to none!", async () => {
  //   const tx = await program.methods
  //     .changeConfig([payer.publicKey], null, 1)
  //     .accountsPartial({
  //       multiWallet: multi_wallet,
  //       payer: null,
  //       systemProgram: null,
  //     })
  //     .remainingAccounts([
  //       { pubkey: wallet.publicKey, isSigner: true, isWritable: false },
  //       { pubkey: payer.publicKey, isSigner: true, isWritable: false },
  //     ])
  //     .signers([payer, wallet])
  //     .rpc();
  //   console.log("Your transaction signature", tx);
  //   console.log(await program.account.multiWallet.fetch(multi_wallet));
  // });

  it("Wrap transfer transaction!", async () => {
    const ix = SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: multi_wallet_vault,
      lamports: LAMPORTS_PER_SOL * 0.1,
    });
    const tx = new Transaction().add(ix);
    await sendAndConfirmTransaction(connection, tx, [payer]);

    const transferIx = SystemProgram.transfer({
      fromPubkey: multi_wallet_vault,
      toPubkey: payer.publicKey,
      lamports: LAMPORTS_PER_SOL * 0.05,
    });
    const transferTx = new TransactionMessage({
      instructions: [transferIx],
      payerKey: payer.publicKey,
      recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
    });

    const transactionMessageBytes =
      transactionMessageToMultisigTransactionMessageBytes({
        message: transferTx,
      });
    const { accountMetas, lookupTableAccounts } =
      await accountsForTransactionExecute({
        connection: connection,
        message: vaultTransactionMessageBeet.deserialize(
          transactionMessageBytes
        )[0],
        vaultPda: multi_wallet_vault,
        signers: [wallet.publicKey, payer.publicKey],
      });

    const vaultTransactionExecuteIx = await program.methods
      .vaultTransactionExecute(0, transactionMessageBytes)
      .accountsPartial({ multiWallet: multi_wallet })
      .remainingAccounts(accountMetas)
      .instruction();
    const transaction = new VersionedTransaction(
      new TransactionMessage({
        instructions: [vaultTransactionExecuteIx],
        payerKey: payer.publicKey,
        recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
      }).compileToV0Message(lookupTableAccounts)
    );

    transaction.sign([wallet, payer]);

    try {
      const txSig = await connection.sendTransaction(transaction);
      console.log(txSig);
      await connection.confirmTransaction(txSig);
      console.log(await connection.getAccountInfo(multi_wallet_vault));
    } catch (e) {
      console.log(await (e as SendTransactionError).getLogs(connection));
    }
  });
});
