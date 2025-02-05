import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";
import { fetchEscrowData } from "../methods/fetchEscrowData.js";
import { getEscrow, getEscrowNativeVault, program } from "../utils/index.js";

export async function cancelEscrowAsOwner({
  connection,
  rentCollector,
  signers,
  identifier,
  walletAddress,
  mint = null,
  tokenProgram = null,
}: {
  connection: Connection;
  rentCollector: PublicKey;
  signers: PublicKey[];
  identifier: number;
  walletAddress: PublicKey;
  mint?: PublicKey | null;
  tokenProgram?: PublicKey | null;
}) {
  const escrow = getEscrow(walletAddress, identifier);
  const escrowData = await fetchEscrowData(
    connection,
    walletAddress,
    identifier
  );
  let escrowVault = null;
  let escrowTokenVault = null;
  let proposerTokenAccount = null;

  if (escrowData.proposer) {
    escrowVault = getEscrowNativeVault(walletAddress, identifier);
    if (mint && tokenProgram) {
      escrowTokenVault = getAssociatedTokenAddressSync(
        mint,
        escrowVault,
        true,
        tokenProgram
      );
      proposerTokenAccount = getAssociatedTokenAddressSync(
        mint,
        escrowData.proposer,
        false,
        tokenProgram
      );
    }
  }

  return await program.methods
    .cancelEscrowAsOwner()
    .accountsPartial({
      escrow,
      proposer: escrowData.proposer || rentCollector,
      escrowVault,
      escrowTokenVault,
      proposerTokenAccount,
      mint,
      tokenProgram,
    })
    .remainingAccounts([
      ...signers.map((signer) => ({
        pubkey: signer,
        isSigner: true,
        isWritable: false,
      })),
    ])
    .instruction();
}
