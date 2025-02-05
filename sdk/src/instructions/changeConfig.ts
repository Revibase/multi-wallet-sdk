import { PublicKey } from "@solana/web3.js";
import { type Member } from "../types/index.js";
import { getMultiSigFromAddress, program } from "../utils/index.js";

type ConfigAction =
  | { type: "addMembers"; members: Member[] }
  | { type: "removeMembers"; members: PublicKey[] }
  | { type: "setMembers"; members: Member[] }
  | { type: "setThreshold"; threshold: number }
  | { type: "setMetadata"; metadata: PublicKey | null };

export async function changeConfig({
  signers,
  walletAddress,
  feePayer,
  configActions,
}: {
  signers: PublicKey[];
  walletAddress: PublicKey;
  feePayer: PublicKey;
  configActions: ConfigAction[];
}) {
  const multisigPda = getMultiSigFromAddress(walletAddress);
  const config: any[] = [];
  for (const action of configActions) {
    switch (action.type) {
      case "addMembers":
        config.push({ addMembers: [action.members] });
        break;
      case "removeMembers":
        config.push({ removeMembers: [action.members] });
        break;
      case "setMembers":
        config.push({ setMembers: [action.members] });
        break;
      case "setThreshold":
        config.push({ setThreshold: [action.threshold] });
        break;
      case "setMetadata":
        config.push({ setMetadata: [action.metadata] });
        break;
    }
  }

  return await program.methods
    .changeConfig(config)
    .accountsPartial({
      multiWallet: multisigPda,
      payer: feePayer,
    })
    .remainingAccounts(
      signers.map((x) => ({
        pubkey: x,
        isSigner: true,
        isWritable: false,
      }))
    )
    .instruction();
}
