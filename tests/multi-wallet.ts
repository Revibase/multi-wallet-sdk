import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";
import { sha256 } from "@noble/hashes/sha256";
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
import { expect } from "chai";
import { MultiWallet } from "../target/types/multi_wallet";
import {
  accountsForTransactionExecute,
  transactionMessageSerialize,
  transactionMessageToCompileMessage,
} from "../utils";
import { Permission, Permissions } from "../utils/types/permissions";
import { transactionMessageBeet } from "../utils/types/transactionMessage";
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
          permissions: Permissions.all(),
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
    // Validation
    const accountData = await program.account.multiWallet.fetch(multi_wallet);
    expect(accountData.createKey.toBase58()).equal(wallet.publicKey.toBase58());
    expect(accountData.members.length).equal(1); // Only creator is a member
    expect(accountData.threshold).equal(1); // Single-sig wallet
    expect(accountData.metadata.toBase58()).equal(
      "9n6LHACaLSjm6dyQ1unbP4y4Azigq5xGuzRCG2XRZf9v"
    );

    const vaultBalance = await connection.getBalance(multi_wallet_vault);
    expect(vaultBalance).equal(LAMPORTS_PER_SOL * 0.005);
  });

  it("Set Owner to payer!", async () => {
    const tx = await program.methods
      .changeConfig([
        {
          addMembers: [
            [
              {
                pubkey: payer.publicKey,
                permissions: Permissions.fromPermissions([
                  Permission.VoteEscrow,
                  Permission.VoteTransaction,
                ]),
              },
            ],
          ],
        },
        { setThreshold: [2] },
        {
          setMetadata: [null],
        },
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
    const accountData = await program.account.multiWallet.fetch(multi_wallet);
    expect(accountData.members.length).equal(2); // Creator + Payer
    expect(accountData.members[1].pubkey.toBase58()).equal(
      payer.publicKey.toBase58()
    );
    expect(accountData.threshold).equal(2);
  });

  it("Set Owner to none!", async () => {
    const tx = await program.methods
      .changeConfig([
        { removeMembers: [[payer.publicKey]] },
        { setThreshold: [1] },
      ])
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
    const accountData = await program.account.multiWallet.fetch(multi_wallet);
    expect(accountData.members.length).equal(1); // Only creator remains
    expect(accountData.members[0].pubkey.toBase58()).equal(
      wallet.publicKey.toBase58()
    );
  });

  const test = Keypair.generate();
  it("Wrap transaction!", async () => {
    const ix = SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: multi_wallet_vault,
      lamports: LAMPORTS_PER_SOL * 0.5,
    });
    const tx = new Transaction().add(ix);
    await sendAndConfirmTransaction(connection, tx, [payer]);

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
      .changeConfig([
        {
          addMembers: [
            [{ pubkey: test.publicKey, permissions: Permissions.all() }],
          ],
        },
        { setThreshold: [2] },
      ])
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

    const [transactionBuffer] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("multi_wallet"),
        multi_wallet.toBuffer(),
        Buffer.from("transaction_buffer"),
        wallet.publicKey.toBuffer(),
        new BN(0).toArrayLike(Buffer, "le", 1),
      ],
      program.programId
    );
    const hash = sha256(transactionMessageBytes);

    const transactionBufferIx = await program.methods
      .transactionBufferCreate({
        bufferIndex: 0,
        vaultIndex: 0,
        finalBufferHash: Array.from(hash),
        finalBufferSize: transactionMessageBytes.length,
        buffer: transactionMessageBytes,
      })
      .accountsPartial({
        multiWallet: multi_wallet,
        creator: wallet.publicKey,
        rentPayer: wallet.publicKey,
      })
      .signers([wallet])
      .instruction();

    const transactionBufferTx = new VersionedTransaction(
      new TransactionMessage({
        instructions: [transactionBufferIx],
        payerKey: wallet.publicKey,
        recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
      }).compileToV0Message([])
    );
    transactionBufferTx.sign([wallet]);
    console.log(transactionBufferTx.serialize().length);

    const sig = await connection.sendTransaction(transactionBufferTx);

    await connection.confirmTransaction(sig);

    const { accountMetas, lookupTableAccounts } =
      await accountsForTransactionExecute({
        connection: connection,
        message: compiledMessage,
        transactionMessage: transactionMessageBeet.deserialize(
          transactionMessageBytes
        )[0],
        vaultPda: multi_wallet_vault,
        signers: [wallet.publicKey],
      });

    const vaultTransactionExecuteIx = await program.methods
      .vaultTransactionExecute(0)
      .accountsPartial({
        multiWallet: multi_wallet,
        rentPayer: wallet.publicKey,
        transactionBuffer,
      })
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
    console.log(transaction.serialize().length);

    const txSig = await connection.sendTransaction(transaction);

    await connection.confirmTransaction(txSig);
    const accountData = await program.account.multiWallet.fetch(multi_wallet);

    expect(accountData.members.length).equal(2); // wallet + test
    expect(accountData.threshold).equal(2);
  });

  it("Initiates an escrow as proposer using native sol and closing the escrow as proposer", async () => {
    const [native_vault] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        wallet.publicKey.toBuffer(),
        new anchor.BN(1).toArrayLike(Buffer, "le", 8),
        Buffer.from("vault"),
      ],
      program.programId
    );
    const tx = await program.methods
      .initiateEscrowAsNonOwner(
        new anchor.BN(1),
        [
          { pubkey: payer.publicKey, permissions: Permissions.all() },
          { pubkey: wallet.publicKey, permissions: Permissions.all() },
        ],
        new anchor.BN(LAMPORTS_PER_SOL * 0.001),
        2
      )
      .accountsPartial({
        member: wallet.publicKey,
        multiWallet: multi_wallet,
        proposer: payer.publicKey,
        escrowVault: native_vault,
        escrowTokenVault: null,
        proposerTokenAccount: null,
        mint: null,
        tokenProgram: null,
      })
      .signers([payer, wallet])
      .rpc();

    console.log("Initiated escrow as proposer:", tx);

    const [escrow] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        wallet.publicKey.toBuffer(),
        new anchor.BN(1).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    const escrowData = await program.account.escrow.fetch(escrow);
    expect(escrowData.identifier.toNumber()).equal(1);
    expect(escrowData.recipient.amount.toNumber()).equal(
      LAMPORTS_PER_SOL * 0.001
    );
    expect(escrowData.proposer.toBase58()).equal(payer.publicKey.toBase58());
    const tx2 = await program.methods
      .cancelEscrowAsNonOwner()
      .accountsPartial({
        escrow,
        proposer: payer.publicKey,
        escrowVault: native_vault,
        escrowTokenVault: null,
        proposerTokenAccount: null,
        mint: null,
        tokenProgram: null,
      })
      .signers([payer])
      .rpc();

    console.log("Close escrow as proposer:", tx2);
  });

  it("Initiates an escrow as proposer using native sol and closing the escrow as owner", async () => {
    const [native_vault] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        wallet.publicKey.toBuffer(),
        new anchor.BN(1).toArrayLike(Buffer, "le", 8),
        Buffer.from("vault"),
      ],
      program.programId
    );
    const tx = await program.methods
      .initiateEscrowAsNonOwner(
        new anchor.BN(1),
        [
          { pubkey: payer.publicKey, permissions: Permissions.all() },
          { pubkey: wallet.publicKey, permissions: Permissions.all() },
        ],
        new anchor.BN(LAMPORTS_PER_SOL * 0.001),
        2
      )
      .accountsPartial({
        member: wallet.publicKey,
        multiWallet: multi_wallet,
        proposer: payer.publicKey,
        escrowVault: native_vault,
        escrowTokenVault: null,
        proposerTokenAccount: null,
        mint: null,
        tokenProgram: null,
      })
      .signers([payer, wallet])
      .rpc();

    console.log("Initiated escrow as proposer:", tx);
    const [escrow] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        wallet.publicKey.toBuffer(),
        new anchor.BN(1).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    const tx2 = await program.methods
      .cancelEscrowAsOwner()
      .accountsPartial({
        escrow,
        proposer: payer.publicKey,
        escrowVault: native_vault,
        escrowTokenVault: null,
        proposerTokenAccount: null,
        mint: null,
        tokenProgram: null,
      })
      .signers([wallet, test])
      .remainingAccounts([
        { pubkey: wallet.publicKey, isSigner: true, isWritable: false },
        { pubkey: test.publicKey, isSigner: true, isWritable: false },
      ])
      .rpc();

    console.log("Closed escrow as owner:", tx2);
  });

  it("2 x Initiates an escrow as proposer using native sol and accepting escrow as owner then cancelling any pending escrow", async () => {
    const getRandomId = () => Math.random() * 1000000;
    const getEscrow = (randomId: number) =>
      PublicKey.findProgramAddressSync(
        [
          Buffer.from("escrow"),
          wallet.publicKey.toBuffer(),
          new anchor.BN(randomId).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      )[0];
    const getNativeVault = (randomId: number) =>
      PublicKey.findProgramAddressSync(
        [
          Buffer.from("escrow"),
          wallet.publicKey.toBuffer(),
          new anchor.BN(randomId).toArrayLike(Buffer, "le", 8),
          Buffer.from("vault"),
        ],
        program.programId
      )[0];
    const initiateEscrow = async (randomId: number) => {
      const native_vault = getNativeVault(randomId);
      const tx = await program.methods
        .initiateEscrowAsNonOwner(
          new anchor.BN(randomId),
          [
            { pubkey: payer.publicKey, permissions: Permissions.all() },
            { pubkey: wallet.publicKey, permissions: Permissions.all() },
          ],
          new anchor.BN(LAMPORTS_PER_SOL * 0.001),
          2
        )
        .accountsPartial({
          member: wallet.publicKey,
          multiWallet: multi_wallet,
          proposer: payer.publicKey,
          escrowVault: native_vault,
          escrowTokenVault: null,
          proposerTokenAccount: null,
          mint: null,
          tokenProgram: null,
        })
        .signers([payer, wallet])
        .rpc();

      console.log("Initiated escrow as proposer:", tx);
    };
    let id = getRandomId();
    let id2 = getRandomId();
    await initiateEscrow(id);
    await initiateEscrow(id2);

    const tx2 = await program.methods
      .executeEscrowAsOwner()
      .accountsPartial({
        payer: wallet.publicKey,
        escrow: getEscrow(id),
        recipient: wallet.publicKey,
        escrowVault: getNativeVault(id),
        escrowTokenVault: null,
        recipientTokenAccount: null,
        mint: null,
        tokenProgram: null,
      })
      .signers([wallet, test])
      .remainingAccounts([
        { pubkey: test.publicKey, isSigner: true, isWritable: false },
      ])
      .rpc();

    console.log("Accepted escrow as owner:", tx2);
    const tx3 = await program.methods
      .cancelEscrowAsNonOwner()
      .accountsPartial({
        escrow: getEscrow(id2),
        proposer: payer.publicKey,
        escrowVault: getNativeVault(id2),
        escrowTokenVault: null,
        proposerTokenAccount: null,
        mint: null,
        tokenProgram: null,
      })
      .signers([payer])
      .rpc();

    console.log("Close escrow as proposer:", tx3);
  });

  it("Initiates an escrow as owner using native sol and closing the escrow as owner", async () => {
    const tx = await program.methods
      .initiateEscrowAsOwner(
        new anchor.BN(1),
        wallet.publicKey,
        new anchor.BN(LAMPORTS_PER_SOL * 0.001),
        null
      )
      .accountsPartial({
        multiWallet: multi_wallet,
        payer: wallet.publicKey,
      })
      .signers([wallet, payer])
      .remainingAccounts([
        { pubkey: payer.publicKey, isSigner: true, isWritable: false },
      ])
      .rpc();

    console.log("Initiated escrow as owner:", tx);

    const [escrow] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        wallet.publicKey.toBuffer(),
        new anchor.BN(1).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );
    const tx2 = await program.methods
      .cancelEscrowAsOwner()
      .accountsPartial({
        escrow,
        proposer: wallet.publicKey,
        escrowVault: null,
        escrowTokenVault: null,
        proposerTokenAccount: null,
        mint: null,
        tokenProgram: null,
      })
      .signers([wallet, payer])
      .remainingAccounts([
        { pubkey: wallet.publicKey, isSigner: true, isWritable: false },
        { pubkey: payer.publicKey, isSigner: true, isWritable: false },
      ])
      .rpc();

    console.log("Closed escrow as proposer:", tx2);
  });

  it("Initiates an escrow as owner using native sol and accepting the escrow as proposer", async () => {
    const tx = await program.methods
      .initiateEscrowAsOwner(
        new anchor.BN(1),
        wallet.publicKey,
        new anchor.BN(LAMPORTS_PER_SOL * 0.001),
        null
      )
      .accountsPartial({
        multiWallet: multi_wallet,
        payer: wallet.publicKey,
      })
      .signers([wallet, payer])
      .remainingAccounts([
        { pubkey: payer.publicKey, isSigner: true, isWritable: false },
      ])
      .rpc();

    console.log("Initiated escrow as owner:", tx);

    const [escrow] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        wallet.publicKey.toBuffer(),
        new anchor.BN(1).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );
    const tx2 = await program.methods
      .executeEscrowAsNonOwner(
        [
          { pubkey: test.publicKey, permissions: Permissions.all() },
          { pubkey: wallet.publicKey, permissions: Permissions.all() },
        ],
        2
      )
      .accountsPartial({
        escrow,
        payer: payer.publicKey,
        recipient: wallet.publicKey,
        recipientTokenAccount: null,
        payerTokenAccount: null,
        mint: null,
        tokenProgram: null,
      })
      .signers([payer])
      .rpc();
    console.log("Accepted escrow as proposer:", tx2);
  });
});
