import { Program } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { MultiWalletIdl } from "../idl/multi_wallet.js";
import { type MultiWallet } from "../types/index.js";

let programInstance: Program<MultiWallet> | null = null;

export const initMultiWalletProgram = (connection: Connection) => {
  programInstance = new Program<MultiWallet>(MultiWalletIdl as MultiWallet, {
    connection,
  });
};

export const program = () => {
  if (!programInstance) {
    throw new Error(
      "Program is not initialized. Call initMultiWalletProgram(connection) first."
    );
  }
  return programInstance;
};

export const JITO_TIP_ACCOUNTS = [
  "96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5",
  "HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe",
  "Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY",
  "ADaUMid9yfUytqMBgopwbj2DTLSokTSzL1zt6iGPaS49",
  "DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh",
  "ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt",
  "DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL",
  "3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT",
];

export const ADDRESS_LOOK_UP_TABLE = new PublicKey(
  "Hg5CGGARH2PSh7ceV8KVqZ6VqW5bnFqdFabziVddHsDZ"
);
