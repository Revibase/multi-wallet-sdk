import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { type Member } from "../types/index.js";
import {
  getEscrowNativeVault,
  getMultiSigFromAddress,
  program,
} from "../utils/index.js";

export async function initiateEscrowAsNonOwner({
  identifier,
  walletAddress,
  amount,
  member,
  proposer,
  newOwners,
  threshold,
  mint = null,
  tokenProgram = null,
}: {
  identifier: number;
  newOwners: Member[];
  member: PublicKey;
  walletAddress: PublicKey;
  amount: number;
  proposer: PublicKey;
  threshold: number;
  mint?: PublicKey | null;
  tokenProgram?: PublicKey | null;
}) {
  const multisigPda = getMultiSigFromAddress(walletAddress);
  const escrowVault = getEscrowNativeVault(walletAddress, identifier);
  let escrowTokenVault = null;
  let proposerTokenAccount = null;
  if (mint && tokenProgram) {
    escrowTokenVault = getAssociatedTokenAddressSync(
      mint,
      escrowVault,
      true,
      tokenProgram
    );
    proposerTokenAccount = getAssociatedTokenAddressSync(
      mint,
      proposer,
      false,
      tokenProgram
    );
  }

  return await program()
    .methods.initiateEscrowAsNonOwner(
      new BN(identifier),
      newOwners,
      new BN(amount),
      threshold
    )
    .accountsPartial({
      member,
      multiWallet: multisigPda,
      proposer,
      escrowVault,
      escrowTokenVault,
      proposerTokenAccount,
      mint,
      tokenProgram,
    })
    .instruction();
}
