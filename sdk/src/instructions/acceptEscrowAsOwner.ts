import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { getEscrow, getEscrowNativeVault, program } from "../utils/index.js";

export async function acceptEscrowAsOwner({
  signers,
  recipient,
  feePayer,
  identifier,
  walletAddress,
  mint = null,
  tokenProgram = null,
}: {
  recipient: PublicKey;
  feePayer: PublicKey;
  signers: PublicKey[];
  identifier: number;
  walletAddress: PublicKey;
  mint?: PublicKey | null;
  tokenProgram?: PublicKey | null;
}) {
  const escrow = getEscrow(walletAddress, identifier);
  const escrowVault = getEscrowNativeVault(walletAddress, identifier);
  let escrowTokenVault = null;
  let recipientTokenAccount = null;
  if (mint && tokenProgram) {
    escrowTokenVault = getAssociatedTokenAddressSync(
      mint,
      escrowVault,
      true,
      tokenProgram
    );
    recipientTokenAccount = getAssociatedTokenAddressSync(
      mint,
      recipient,
      false,
      tokenProgram
    );
  }
  return await program()
    .methods.executeEscrowAsOwner()
    .accountsPartial({
      payer: feePayer,
      escrow,
      recipient,
      escrowVault,
      escrowTokenVault,
      recipientTokenAccount,
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
