import { LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import { type Member, Permissions } from "../types/index.js";
import { getVaultFromAddress, program } from "../utils/index.js";

export async function createWallet({
  feePayer,
  walletAddress,
  metadata,
}: {
  feePayer: PublicKey;
  walletAddress: PublicKey;
  metadata: PublicKey | null;
}) {
  const vaultPda = getVaultFromAddress(walletAddress);
  const createWalletIx = await program()
    .methods.create(
      {
        pubkey: new PublicKey(walletAddress),
        permissions: Permissions.all(),
      } as Member,
      metadata
    )
    .accounts({
      payer: feePayer,
    })
    .instruction();
  const transferSolIx = SystemProgram.transfer({
    fromPubkey: new PublicKey(feePayer),
    toPubkey: new PublicKey(vaultPda),
    lamports: LAMPORTS_PER_SOL * 0.001,
  });
  return [createWalletIx, transferSolIx];
}
