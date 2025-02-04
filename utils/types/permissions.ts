import * as beet from "@metaplex-foundation/beet";
import * as beetSolana from "@metaplex-foundation/beet-solana";
import { PublicKey } from "@solana/web3.js";

export type IPermissions = {
  mask: number;
};

/**
 * @category userTypes
 * @category generated
 */
export const permissionsBeet = new beet.BeetArgsStruct<IPermissions>(
  [["mask", beet.u8]],
  "Permissions"
);

export type Member = {
  key: PublicKey;
  permissions: IPermissions;
};

/**
 * @category userTypes
 * @category generated
 */
export const memberBeet = new beet.BeetArgsStruct<Member>(
  [
    ["key", beetSolana.publicKey],
    ["permissions", permissionsBeet],
  ],
  "Member"
);

export const Permission = {
  InitiateTransaction: 1,
  VoteTransaction: 2,
  ExecuteTransaction: 4,
  InitiateEscrow: 8,
  VoteEscrow: 16,
  ExecuteEscrow: 32,
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

export class Permissions implements IPermissions {
  private constructor(readonly mask: number) {}

  static fromPermissions(permissions: Permission[]) {
    return new Permissions(
      permissions.reduce((mask, permission) => mask | permission, 0)
    );
  }

  static all() {
    return new Permissions(
      Object.values(Permission).reduce(
        (mask, permission) => mask | permission,
        0
      )
    );
  }

  static has(permissions: IPermissions, permission: Permission) {
    return (permissions.mask & permission) === permission;
  }
}
