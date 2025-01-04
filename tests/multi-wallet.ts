import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { BN } from "bn.js";
import { MultiWallet } from "../target/types/multi_wallet";
import {
  accountsForTransactionExecute,
  transactionMessageSerialize,
  transactionMessageToCompileMessage,
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
    const txSig2 = await connection.requestAirdrop(
      wallet.publicKey,
      LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(txSig2);

    const ix1 = await program.methods
      .create(
        {
          pubkey: wallet.publicKey,
          label: 15,
        },
        new PublicKey("9n6LHACaLSjm6dyQ1unbP4y4Azigq5xGuzRCG2XRZf9v")
      )
      .accounts({
        payer: payer.publicKey,
      })
      .signers([payer])
      .instruction();
    const ix2 = SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: multi_wallet_vault,
      lamports: LAMPORTS_PER_SOL * 0.005,
    });
    const tx = new Transaction().add(ix1, ix2);
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    tx.feePayer = payer.publicKey;
    tx.sign(payer);
    const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
    await connection.confirmTransaction(sig);
    console.log(await program.account.multiWallet.fetch(multi_wallet));
  });

  it("Set Owner to payer!", async () => {
    const tx = await program.methods
      .changeConfig([
        { addMembers: [[{ pubkey: payer.publicKey, label: null }]] },
      ])
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

  it("Set Owner to none!", async () => {
    const tx = await program.methods
      .changeConfig([{ removeMembers: [[payer.publicKey]] }])
      .accountsPartial({
        multiWallet: multi_wallet,
        payer: null,
        systemProgram: null,
      })
      .remainingAccounts([
        { pubkey: wallet.publicKey, isSigner: true, isWritable: false },
        { pubkey: payer.publicKey, isSigner: true, isWritable: false },
      ])
      .signers([payer, wallet])
      .rpc();
    console.log("Your transaction signature", tx);
    console.log(await program.account.multiWallet.fetch(multi_wallet));
  });

  it("Wrap transfer transaction!", async () => {
    // const test = Keypair.generate();
    // const ix = SystemProgram.transfer({
    //   fromPubkey: payer.publicKey,
    //   toPubkey: multi_wallet_vault,
    //   lamports: LAMPORTS_PER_SOL * 0.5,
    // });
    // const tx = new Transaction().add(ix);
    // await sendAndConfirmTransaction(connection, tx, [payer]);
    // const transferIx = SystemProgram.transfer({
    //   fromPubkey: multi_wallet_vault,
    //   toPubkey: test.publicKey,
    //   lamports: LAMPORTS_PER_SOL * 0.3,
    // });
    // const transferTx = new TransactionMessage({
    //   instructions: [transferIx],
    //   payerKey: test.publicKey,
    //   recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
    // });
    // const transactionMessageBytes =
    //   transactionMessageToMultisigTransactionMessageBytes({
    //     message: transferTx,
    //   });
    // const { accountMetas, lookupTableAccounts } =
    //   await accountsForTransactionExecute({
    //     connection: connection,
    //     message: vaultTransactionMessageBeet.deserialize(
    //       transactionMessageBytes
    //     )[0],
    //     vaultPda: multi_wallet_vault,
    //     signers: [wallet.publicKey],
    //   });
    // const vaultTransactionExecuteIx = await program.methods
    //   .vaultTransactionExecute(0, transactionMessageBytes)
    //   .accountsPartial({ multiWallet: multi_wallet })
    //   .remainingAccounts(accountMetas)
    //   .instruction();
    // const transaction = new VersionedTransaction(
    //   new TransactionMessage({
    //     instructions: [vaultTransactionExecuteIx],
    //     payerKey: wallet.publicKey,
    //     recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
    //   }).compileToV0Message(lookupTableAccounts)
    // );
    // transaction.sign([wallet, test]);
    // const txSig = await connection.sendTransaction(transaction);
    // console.log(txSig);
    // await connection.confirmTransaction(txSig);
    // console.log(await connection.getAccountInfo(multi_wallet_vault));
  });
  // const nonceKeypair = Keypair.generate();
  // it("Create Durable Nonce", async () => {
  //   const tx = new Transaction();

  //   // the fee payer can be any account
  //   tx.feePayer = payer.publicKey;

  //   // to create the nonce account, you can use fetch the recent blockhash
  //   // or use a nonce from a different, pre-existing nonce account
  //   tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  //   tx.add(
  //     // create system account with the minimum amount needed for rent exemption.
  //     // NONCE_ACCOUNT_LENGTH is the space a nonce account takes
  //     SystemProgram.createAccount({
  //       fromPubkey: payer.publicKey,
  //       newAccountPubkey: nonceKeypair.publicKey,
  //       lamports: 0.0015 * LAMPORTS_PER_SOL,
  //       space: NONCE_ACCOUNT_LENGTH,
  //       programId: SystemProgram.programId,
  //     }),
  //     // initialise nonce with the created nonceKeypair's pubkey as the noncePubkey
  //     // also specify the authority of the nonce account
  //     SystemProgram.nonceInitialize({
  //       noncePubkey: nonceKeypair.publicKey,
  //       authorizedPubkey: payer.publicKey,
  //     })
  //   );

  //   // sign the transaction with both the nonce keypair and the authority keypair
  //   tx.sign(nonceKeypair, payer);

  //   // send the transaction
  //   const sig = await sendAndConfirmRawTransaction(
  //     connection,
  //     tx.serialize({ requireAllSignatures: false })
  //   );
  //   console.log("Nonce initiated: ", sig);
  // });

  it("Wrap transaction!", async () => {
    const ix = SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: multi_wallet_vault,
      lamports: LAMPORTS_PER_SOL * 0.5,
    });
    const tx = new Transaction().add(ix);
    await sendAndConfirmTransaction(connection, tx, [payer]);

    const test = Keypair.generate();
    const transferIx1 = SystemProgram.transfer({
      fromPubkey: multi_wallet_vault,
      toPubkey: wallet.publicKey,
      lamports: LAMPORTS_PER_SOL * 0.00002,
    });
    const transferIx2 = SystemProgram.transfer({
      fromPubkey: multi_wallet_vault,
      toPubkey: test.publicKey,
      lamports: LAMPORTS_PER_SOL * 0.001,
    });
    const changeConfigIx = await program.methods
      .changeConfig([{ addMembers: [[{ pubkey: test.publicKey, label: 0 }]] }])
      .accountsPartial({
        multiWallet: multi_wallet,
        payer: multi_wallet_vault,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .remainingAccounts([
        { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      ])
      .instruction();

    const transferTx = new TransactionMessage({
      instructions: [transferIx1, transferIx2, changeConfigIx],
      payerKey: wallet.publicKey,
      recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
    });
    const compiledMessage = transactionMessageToCompileMessage({
      message: transferTx,
    });
    const transactionMessageBytes =
      transactionMessageSerialize(compiledMessage);
    const { accountMetas, lookupTableAccounts } =
      await accountsForTransactionExecute({
        connection: connection,
        message: compiledMessage,
        vaultMessage: vaultTransactionMessageBeet.deserialize(
          transactionMessageBytes
        )[0],
        vaultPda: multi_wallet_vault,
        signers: [wallet.publicKey],
      });

    const vaultTransactionExecuteIx = await program.methods
      .vaultTransactionExecute(0, transactionMessageBytes)
      .accountsPartial({ multiWallet: multi_wallet })
      .remainingAccounts(accountMetas)
      .instruction();
    const transaction = new VersionedTransaction(
      new TransactionMessage({
        instructions: [vaultTransactionExecuteIx],
        payerKey: wallet.publicKey,
        recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
      }).compileToV0Message(lookupTableAccounts)
    );
    transaction.sign([wallet]);

    const txSig = await connection.sendTransaction(transaction);

    await connection.confirmTransaction(txSig);
    console.log(await program.account.multiWallet.fetch(multi_wallet));
  });
});
