import * as anchor from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { expect } from "chai";
import {
  acceptEscrowAsNonOwner,
  acceptEscrowAsOwner,
  cancelEscrowAsNonOwner,
  cancelEscrowAsOwner,
  changeConfig,
  createTransactionBundle,
  createWallet,
  fetchEscrowData,
  fetchMultiWalletData,
  getVaultFromAddress,
  initiateEscrowAsNonOwner,
  initiateEscrowAsOwner,
  MultiWallet,
  Permission,
  Permissions,
} from "../sdk";

describe("multi_wallet", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.MultiWallet as anchor.Program<MultiWallet>;
  const connection = new Connection(
    program.provider.connection.rpcEndpoint,
    "confirmed"
  );
  const payer = Keypair.generate();
  const wallet = Keypair.generate();
  const multi_wallet_vault = getVaultFromAddress(wallet.publicKey);
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

    const ixs = await createWallet({
      feePayer: payer.publicKey,
      walletAddress: wallet.publicKey,
      metadata: new PublicKey("9n6LHACaLSjm6dyQ1unbP4y4Azigq5xGuzRCG2XRZf9v"),
    });

    const tx = new Transaction().add(...ixs);
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    tx.feePayer = payer.publicKey;
    tx.sign(payer);
    const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
    await connection.confirmTransaction(sig);
    // Validation
    const accountData = await fetchMultiWalletData(
      connection,
      wallet.publicKey
    );
    expect(accountData.createKey.toBase58()).equal(wallet.publicKey.toBase58());
    expect(accountData.members.length).equal(1); // Only creator is a member
    expect(accountData.threshold).equal(1); // Single-sig wallet
    expect(accountData.metadata.toBase58()).equal(
      "9n6LHACaLSjm6dyQ1unbP4y4Azigq5xGuzRCG2XRZf9v"
    );

    const vaultBalance = await connection.getBalance(multi_wallet_vault);
    expect(vaultBalance).equal(LAMPORTS_PER_SOL * 0.001);
  });

  it("Set Owner to payer!", async () => {
    const ix = await changeConfig({
      signers: [wallet.publicKey],
      walletAddress: wallet.publicKey,
      feePayer: payer.publicKey,
      configActions: [
        {
          type: "addMembers",
          members: [
            {
              pubkey: payer.publicKey,
              permissions: Permissions.fromPermissions([
                Permission.VoteEscrow,
                Permission.VoteTransaction,
              ]),
            },
          ],
        },
        { type: "setThreshold", threshold: 2 },
        { type: "setMetadata", metadata: null },
      ],
    });
    const tx = new Transaction().add(ix);
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    tx.feePayer = payer.publicKey;

    const sig = await sendAndConfirmTransaction(connection, tx, [
      payer,
      wallet,
    ]);
    console.log("Your transaction signature", sig);
    const accountData = await fetchMultiWalletData(
      connection,
      wallet.publicKey
    );
    expect(accountData.members.length).equal(2); // Creator + Payer
    expect(accountData.members[1].pubkey.toBase58()).equal(
      payer.publicKey.toBase58()
    );
    expect(accountData.threshold).equal(2);
  });

  it("Set Owner to none!", async () => {
    const ix = await changeConfig({
      signers: [payer.publicKey, wallet.publicKey],
      walletAddress: wallet.publicKey,
      feePayer: payer.publicKey,
      configActions: [
        { type: "removeMembers", members: [payer.publicKey] },
        { type: "setThreshold", threshold: 1 },
      ],
    });
    const tx = new Transaction().add(ix);
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    tx.feePayer = payer.publicKey;

    const sig = await sendAndConfirmTransaction(connection, tx, [
      payer,
      wallet,
    ]);
    console.log("Your transaction signature", sig);
    const accountData = await fetchMultiWalletData(
      connection,
      wallet.publicKey
    );
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

    const changeConfigIx = await changeConfig({
      signers: [wallet.publicKey],
      walletAddress: wallet.publicKey,
      feePayer: payer.publicKey,
      configActions: [
        {
          type: "addMembers",
          members: [{ pubkey: test.publicKey, permissions: Permissions.all() }],
        },
        { type: "setThreshold", threshold: 2 },
      ],
    });

    const { result } = await createTransactionBundle({
      connection,
      feePayer: payer.publicKey,
      instructions: [transferIx1, transferIx2, changeConfigIx],
      walletAddress: wallet.publicKey,
      signers: [wallet.publicKey],
      creator: wallet.publicKey,
      tipAmount: LAMPORTS_PER_SOL * 0.001,
    });
    for (const x of result) {
      const tx = new Transaction().add(...x.ixs);
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      tx.feePayer = x.feePayer;
      await sendAndConfirmTransaction(connection, tx, [wallet, payer]);
    }

    const accountData = await fetchMultiWalletData(
      connection,
      wallet.publicKey
    );

    expect(accountData.members.length).equal(2); // wallet + test
    expect(accountData.threshold).equal(2);
  });

  it("Initiates an escrow as proposer using native sol and closing the escrow as proposer", async () => {
    const identifier = Math.round(Math.random() * Number.MAX_SAFE_INTEGER);
    const ix = await initiateEscrowAsNonOwner({
      identifier,
      walletAddress: wallet.publicKey,
      member: wallet.publicKey,
      newOwners: [
        { pubkey: payer.publicKey, permissions: Permissions.all() },
        { pubkey: wallet.publicKey, permissions: Permissions.all() },
      ],
      proposer: payer.publicKey,
      amount: LAMPORTS_PER_SOL * 0.001,
      threshold: 2,
    });

    const tx = new Transaction().add(ix);
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    tx.feePayer = payer.publicKey;

    const sig = await sendAndConfirmTransaction(connection, tx, [
      payer,
      wallet,
    ]);

    console.log("Initiated escrow as proposer:", sig);

    const escrowData = await fetchEscrowData(
      connection,
      wallet.publicKey,
      identifier
    );

    expect(escrowData.identifier.toNumber()).equal(identifier);
    expect(escrowData.recipient.amount.toNumber()).equal(
      LAMPORTS_PER_SOL * 0.001
    );
    expect(escrowData.proposer.toBase58()).equal(payer.publicKey.toBase58());

    const ix2 = await cancelEscrowAsNonOwner({
      proposer: payer.publicKey,
      identifier,
      walletAddress: wallet.publicKey,
    });
    const tx2 = new Transaction().add(ix2);
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    tx.feePayer = payer.publicKey;

    const sig2 = await sendAndConfirmTransaction(connection, tx2, [payer]);

    console.log("Close escrow as proposer:", sig2);
  });

  it("Initiates an escrow as proposer using native sol and closing the escrow as owner", async () => {
    const identifier = Math.round(Math.random() * Number.MAX_SAFE_INTEGER);
    const ix = await initiateEscrowAsNonOwner({
      identifier,
      walletAddress: wallet.publicKey,
      member: wallet.publicKey,
      newOwners: [
        { pubkey: payer.publicKey, permissions: Permissions.all() },
        { pubkey: wallet.publicKey, permissions: Permissions.all() },
      ],
      proposer: payer.publicKey,
      amount: LAMPORTS_PER_SOL * 0.001,
      threshold: 2,
    });

    const tx = new Transaction().add(ix);
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    tx.feePayer = payer.publicKey;

    const sig = await sendAndConfirmTransaction(connection, tx, [
      payer,
      wallet,
    ]);

    console.log("Initiated escrow as proposer:", sig);
    const ix2 = await cancelEscrowAsOwner({
      connection,
      rentCollector: payer.publicKey,
      signers: [wallet.publicKey, test.publicKey],
      identifier,
      walletAddress: wallet.publicKey,
    });
    const tx2 = new Transaction().add(ix2);
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    tx.feePayer = payer.publicKey;

    const sig2 = await sendAndConfirmTransaction(connection, tx2, [
      payer,
      test,
      wallet,
    ]);
    console.log("Closed escrow as owner:", sig2);
  });

  it("2 x Initiates an escrow as proposer using native sol and accepting escrow as owner then cancelling any pending escrow", async () => {
    const getRandomId = () => Math.random() * 1000000;

    const initiateEscrow = async (randomId: number) => {
      const ix = await initiateEscrowAsNonOwner({
        identifier: randomId,
        walletAddress: wallet.publicKey,
        member: wallet.publicKey,
        newOwners: [
          { pubkey: payer.publicKey, permissions: Permissions.all() },
          { pubkey: wallet.publicKey, permissions: Permissions.all() },
        ],
        proposer: payer.publicKey,
        amount: LAMPORTS_PER_SOL * 0.001,
        threshold: 2,
      });

      const tx = new Transaction().add(ix);
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      tx.feePayer = payer.publicKey;

      const sig = await sendAndConfirmTransaction(connection, tx, [
        payer,
        wallet,
      ]);
      console.log("Initiated escrow as proposer:", sig);
    };
    let id = getRandomId();
    let id2 = getRandomId();
    await initiateEscrow(id);
    await initiateEscrow(id2);
    const ix = await acceptEscrowAsOwner({
      signers: [test.publicKey, wallet.publicKey],
      recipient: wallet.publicKey,
      feePayer: payer.publicKey,
      walletAddress: wallet.publicKey,
      identifier: id,
    });

    const tx = new Transaction().add(ix);
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    tx.feePayer = payer.publicKey;
    const sig = await sendAndConfirmTransaction(connection, tx, [
      test,
      payer,
      wallet,
    ]);
    console.log("Accepted escrow as owner:", sig);

    const ix2 = await cancelEscrowAsNonOwner({
      proposer: payer.publicKey,
      identifier: id2,
      walletAddress: wallet.publicKey,
    });
    const tx2 = new Transaction().add(ix2);
    tx2.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    tx2.feePayer = payer.publicKey;

    const sig2 = await sendAndConfirmTransaction(connection, tx2, [payer]);

    console.log("Close escrow as proposer:", sig2);
  });

  it("Initiates an escrow as owner using native sol and closing the escrow as owner", async () => {
    const identifier = Math.round(Math.random() * Number.MAX_SAFE_INTEGER);
    const ix = await initiateEscrowAsOwner({
      identifier,
      walletAddress: wallet.publicKey,
      amount: LAMPORTS_PER_SOL * 0.001,
      feePayer: payer.publicKey,
      recipient: wallet.publicKey,
      signers: [wallet.publicKey, payer.publicKey],
    });
    const tx = new Transaction().add(ix);
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    tx.feePayer = payer.publicKey;

    const sig = await sendAndConfirmTransaction(connection, tx, [
      payer,
      wallet,
    ]);

    console.log("Initiated escrow as owner:", sig);
    const ix2 = await cancelEscrowAsOwner({
      connection,
      rentCollector: wallet.publicKey,
      signers: [wallet.publicKey, payer.publicKey],
      identifier,
      walletAddress: wallet.publicKey,
    });
    const tx2 = new Transaction().add(ix2);
    tx2.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    tx2.feePayer = payer.publicKey;

    const sig2 = await sendAndConfirmTransaction(connection, tx2, [
      payer,
      wallet,
    ]);

    console.log("Closed escrow as proposer:", sig2);
  });

  it("Initiates an escrow as owner using native sol and accepting the escrow as proposer", async () => {
    const identifier = Math.round(Math.random() * Number.MAX_SAFE_INTEGER);
    const ix = await initiateEscrowAsOwner({
      identifier,
      walletAddress: wallet.publicKey,
      amount: LAMPORTS_PER_SOL * 0.001,
      feePayer: payer.publicKey,
      recipient: wallet.publicKey,
      signers: [wallet.publicKey, payer.publicKey],
    });
    const tx = new Transaction().add(ix);
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    tx.feePayer = payer.publicKey;

    const sig = await sendAndConfirmTransaction(connection, tx, [
      payer,
      wallet,
    ]);

    console.log("Initiated escrow as owner:", sig);

    const ix2 = await acceptEscrowAsNonOwner({
      recipient: wallet.publicKey,
      feePayer: payer.publicKey,
      identifier,
      walletAddress: wallet.publicKey,
      threshold: 2,
      newMembers: [
        { pubkey: test.publicKey, permissions: Permissions.all() },
        { pubkey: wallet.publicKey, permissions: Permissions.all() },
      ],
    });

    const tx2 = new Transaction().add(ix2);
    tx2.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    tx2.feePayer = payer.publicKey;

    const sig2 = await sendAndConfirmTransaction(connection, tx2, [payer]);

    console.log("Accepted escrow as proposer:", sig2);
  });
});
