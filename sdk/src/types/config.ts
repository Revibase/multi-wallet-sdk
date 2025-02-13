import type { PublicKey } from "@solana/web3.js";
import type { Member } from "./permissions.js";

export type ConfigAction =
  | { type: "addMembers"; members: Member[] }
  | { type: "removeMembers"; members: PublicKey[] }
  | { type: "setMembers"; members: Member[] }
  | { type: "setThreshold"; threshold: number }
  | { type: "setMetadata"; metadata: PublicKey | null };
