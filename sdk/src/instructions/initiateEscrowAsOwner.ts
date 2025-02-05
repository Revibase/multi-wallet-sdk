import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { getMultiSigFromAddress, program } from "../utils/index.js";

export async function initiateEscrowAsOwner({
  signers,
  identifier,
  walletAddress,
  amount,
  recipient,
  feePayer,
  mint = null,
}: {
  signers: PublicKey[];
  feePayer: PublicKey;
  identifier: number;
  walletAddress: PublicKey;
  amount: number;
  recipient: PublicKey;
  mint?: PublicKey | null;
}) {
  const multisigPda = getMultiSigFromAddress(walletAddress);

  return await program.methods
    .initiateEscrowAsOwner(new BN(identifier), recipient, new BN(amount), mint)
    .accountsPartial({
      multiWallet: multisigPda,
      payer: feePayer,
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
