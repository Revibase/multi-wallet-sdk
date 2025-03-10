/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/multi_wallet.json`.
 */
export type MultiWallet = {
  address: "mu1LDWh4VGHhnZHB85s92HNBapj3b9s5DgzTkiAyeKY";
  metadata: {
    name: "multiWallet";
    version: "0.1.0";
    spec: "0.1.0";
    description: "Created with Anchor";
  };
  instructions: [
    {
      name: "cancelEscrowAsNonOwner";
      docs: [
        "Cancels an escrow as a proposer. This function returns the locked funds in the escrow",
        "vault back to the proposer and invalidates the escrow, preventing further execution.",
        "",
        "# Parameters",
        "- `ctx`: The context containing all relevant accounts required for canceling the escrow.",
        "",
        "# Returns",
        "- `Ok(())`: If the escrow is successfully canceled and funds are returned to the proposer.",
        "- `Err`: If any validation fails or the transfer operation encounters an issue.",
        ""
      ];
      discriminator: [219, 234, 45, 214, 232, 65, 209, 96];
      accounts: [
        {
          name: "multiWallet";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  109,
                  117,
                  108,
                  116,
                  105,
                  95,
                  119,
                  97,
                  108,
                  108,
                  101,
                  116
                ];
              },
              {
                kind: "account";
                path: "escrow.create_key";
                account: "escrow";
              }
            ];
          };
        },
        {
          name: "escrow";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [101, 115, 99, 114, 111, 119];
              },
              {
                kind: "account";
                path: "escrow.create_key";
                account: "escrow";
              },
              {
                kind: "account";
                path: "escrow.identifier";
                account: "escrow";
              }
            ];
          };
        },
        {
          name: "escrowVault";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [101, 115, 99, 114, 111, 119];
              },
              {
                kind: "account";
                path: "escrow.create_key";
                account: "escrow";
              },
              {
                kind: "account";
                path: "escrow.identifier";
                account: "escrow";
              },
              {
                kind: "const";
                value: [118, 97, 117, 108, 116];
              }
            ];
          };
        },
        {
          name: "escrowTokenVault";
          writable: true;
          optional: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "escrowVault";
              },
              {
                kind: "account";
                path: "tokenProgram";
              },
              {
                kind: "account";
                path: "mint";
              }
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: "proposerTokenAccount";
          writable: true;
          optional: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "proposer";
              },
              {
                kind: "account";
                path: "tokenProgram";
              },
              {
                kind: "account";
                path: "mint";
              }
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: "mint";
          optional: true;
        },
        {
          name: "proposer";
          writable: true;
          signer: true;
        },
        {
          name: "tokenProgram";
          optional: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "associatedTokenProgram";
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
        },
        {
          name: "eventAuthority";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ];
              }
            ];
          };
        },
        {
          name: "program";
        }
      ];
      args: [];
    },
    {
      name: "cancelEscrowAsOwner";
      docs: [
        "Cancels an escrow as an owner. This function unlocks the multi-wallet and invalidates the escrow,",
        "preventing it from being executed.",
        "",
        "# Parameters",
        "- `ctx`: The context containing all relevant accounts required for canceling the escrow.",
        "",
        "# Returns",
        "- `Ok(())`: If the escrow is successfully canceled and the multi-wallet is unlocked.",
        "- `Err`: If validation fails or the accounts provided are invalid.",
        ""
      ];
      discriminator: [22, 155, 132, 143, 51, 185, 186, 247];
      accounts: [
        {
          name: "multiWallet";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  109,
                  117,
                  108,
                  116,
                  105,
                  95,
                  119,
                  97,
                  108,
                  108,
                  101,
                  116
                ];
              },
              {
                kind: "account";
                path: "escrow.create_key";
                account: "escrow";
              }
            ];
          };
        },
        {
          name: "escrow";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [101, 115, 99, 114, 111, 119];
              },
              {
                kind: "account";
                path: "escrow.create_key";
                account: "escrow";
              },
              {
                kind: "account";
                path: "escrow.identifier";
                account: "escrow";
              }
            ];
          };
        },
        {
          name: "escrowVault";
          writable: true;
          optional: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [101, 115, 99, 114, 111, 119];
              },
              {
                kind: "account";
                path: "escrow.create_key";
                account: "escrow";
              },
              {
                kind: "account";
                path: "escrow.identifier";
                account: "escrow";
              },
              {
                kind: "const";
                value: [118, 97, 117, 108, 116];
              }
            ];
          };
        },
        {
          name: "escrowTokenVault";
          writable: true;
          optional: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "escrowVault";
              },
              {
                kind: "account";
                path: "tokenProgram";
              },
              {
                kind: "account";
                path: "mint";
              }
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: "proposerTokenAccount";
          writable: true;
          optional: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "proposer";
              },
              {
                kind: "account";
                path: "tokenProgram";
              },
              {
                kind: "account";
                path: "mint";
              }
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: "proposer";
          writable: true;
        },
        {
          name: "instructionSysvar";
          address: "Sysvar1nstructions1111111111111111111111111";
        },
        {
          name: "mint";
          optional: true;
        },
        {
          name: "tokenProgram";
          optional: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "associatedTokenProgram";
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
        },
        {
          name: "eventAuthority";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ];
              }
            ];
          };
        },
        {
          name: "program";
        }
      ];
      args: [];
    },
    {
      name: "changeConfig";
      docs: [
        "# Parameters",
        "- `ctx`: The context of the multi-action execution.",
        "- `config_actions`: The list of actions to be executed.",
        "",
        "# Returns",
        "- `Result<()>`: The result of the multi-action execution."
      ];
      discriminator: [24, 158, 114, 115, 94, 210, 244, 233];
      accounts: [
        {
          name: "multiWallet";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  109,
                  117,
                  108,
                  116,
                  105,
                  95,
                  119,
                  97,
                  108,
                  108,
                  101,
                  116
                ];
              },
              {
                kind: "account";
                path: "multi_wallet.create_key";
                account: "multiWallet";
              }
            ];
          };
        },
        {
          name: "payer";
          writable: true;
          signer: true;
          optional: true;
        },
        {
          name: "systemProgram";
          optional: true;
          address: "11111111111111111111111111111111";
        },
        {
          name: "instructionSysvar";
          address: "Sysvar1nstructions1111111111111111111111111";
        },
        {
          name: "eventAuthority";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ];
              }
            ];
          };
        },
        {
          name: "program";
        }
      ];
      args: [
        {
          name: "configActions";
          type: {
            vec: {
              defined: {
                name: "configAction";
              };
            };
          };
        }
      ];
    },
    {
      name: "create";
      docs: [
        "Creates a new multi-wallet.",
        "",
        "# Parameters",
        "- `ctx`: The context of the multi-wallet creation.",
        "- `create_key`: The member key used to create the multi-wallet.",
        "- `metadata`: An optional metadata for the multi-wallet.",
        "- `label`: An optional label for the multi-wallet.",
        "",
        "# Returns",
        "- `Result<()>`: The result of the multi-wallet creation."
      ];
      discriminator: [24, 30, 200, 40, 5, 28, 7, 119];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "multiWallet";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  109,
                  117,
                  108,
                  116,
                  105,
                  95,
                  119,
                  97,
                  108,
                  108,
                  101,
                  116
                ];
              },
              {
                kind: "arg";
                path: "create_key.pubkey";
              }
            ];
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "eventAuthority";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ];
              }
            ];
          };
        },
        {
          name: "program";
        }
      ];
      args: [
        {
          name: "createKey";
          type: {
            defined: {
              name: "member";
            };
          };
        },
        {
          name: "metadata";
          type: {
            option: "pubkey";
          };
        }
      ];
    },
    {
      name: "executeEscrowAsNonOwner";
      docs: [
        "Executes an escrow. This function transfers funds from the escrow vault",
        "to the recipient and updates the members of the multi-wallet as specified in the escrow.",
        "",
        "# Parameters",
        "- `ctx`: The context containing all relevant accounts required for executing the escrow.",
        "- `new_members`: A vector of new members to be added to the multi-wallet after the escrow is executed.",
        "- `threshold`: Number of signatures required for the multisig transaction to be approved.",
        "",
        "# Returns",
        "- `Ok(())`: If the escrow is successfully executed, funds are transferred, and the multi-wallet is updated.",
        "- `Err`: If any validation fails, the escrow is not locked, or the transfer operation encounters an issue.",
        ""
      ];
      discriminator: [63, 186, 102, 94, 23, 177, 217, 130];
      accounts: [
        {
          name: "multiWallet";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  109,
                  117,
                  108,
                  116,
                  105,
                  95,
                  119,
                  97,
                  108,
                  108,
                  101,
                  116
                ];
              },
              {
                kind: "account";
                path: "escrow.create_key";
                account: "escrow";
              }
            ];
          };
        },
        {
          name: "escrow";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [101, 115, 99, 114, 111, 119];
              },
              {
                kind: "account";
                path: "escrow.create_key";
                account: "escrow";
              },
              {
                kind: "account";
                path: "escrow.identifier";
                account: "escrow";
              }
            ];
          };
        },
        {
          name: "recipientTokenAccount";
          writable: true;
          optional: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "recipient";
              },
              {
                kind: "account";
                path: "tokenProgram";
              },
              {
                kind: "account";
                path: "mint";
              }
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: "payerTokenAccount";
          writable: true;
          optional: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "payer";
              },
              {
                kind: "account";
                path: "tokenProgram";
              },
              {
                kind: "account";
                path: "mint";
              }
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: "mint";
          optional: true;
        },
        {
          name: "recipient";
          writable: true;
        },
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "tokenProgram";
          optional: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "associatedTokenProgram";
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
        },
        {
          name: "eventAuthority";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ];
              }
            ];
          };
        },
        {
          name: "program";
        }
      ];
      args: [
        {
          name: "newMembers";
          type: {
            vec: {
              defined: {
                name: "member";
              };
            };
          };
        },
        {
          name: "threshold";
          type: "u8";
        }
      ];
    },
    {
      name: "executeEscrowAsOwner";
      docs: [
        "Executes an escrow as an owner. This function transfers funds from the escrow vault",
        "to the recipient, updates the multi-wallet's members as specified in the escrow, and",
        "ensures the multi-wallet remains valid.",
        "",
        "# Parameters",
        "- `ctx`: The context containing all relevant accounts required for executing the escrow.",
        "",
        "# Returns",
        "- `Ok(())`: If the escrow is successfully executed, funds are transferred, and the multi-wallet is updated.",
        "- `Err`: If validation fails, the escrow is not properly initialized, or the transfer encounters an issue.",
        ""
      ];
      discriminator: [119, 121, 203, 21, 159, 211, 44, 59];
      accounts: [
        {
          name: "multiWallet";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  109,
                  117,
                  108,
                  116,
                  105,
                  95,
                  119,
                  97,
                  108,
                  108,
                  101,
                  116
                ];
              },
              {
                kind: "account";
                path: "escrow.create_key";
                account: "escrow";
              }
            ];
          };
        },
        {
          name: "escrow";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [101, 115, 99, 114, 111, 119];
              },
              {
                kind: "account";
                path: "escrow.create_key";
                account: "escrow";
              },
              {
                kind: "account";
                path: "escrow.identifier";
                account: "escrow";
              }
            ];
          };
        },
        {
          name: "escrowVault";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [101, 115, 99, 114, 111, 119];
              },
              {
                kind: "account";
                path: "escrow.create_key";
                account: "escrow";
              },
              {
                kind: "account";
                path: "escrow.identifier";
                account: "escrow";
              },
              {
                kind: "const";
                value: [118, 97, 117, 108, 116];
              }
            ];
          };
        },
        {
          name: "escrowTokenVault";
          writable: true;
          optional: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "escrowVault";
              },
              {
                kind: "account";
                path: "tokenProgram";
              },
              {
                kind: "account";
                path: "mint";
              }
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: "recipientTokenAccount";
          writable: true;
          optional: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "recipient";
              },
              {
                kind: "account";
                path: "tokenProgram";
              },
              {
                kind: "account";
                path: "mint";
              }
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: "mint";
          optional: true;
        },
        {
          name: "instructionSysvar";
          address: "Sysvar1nstructions1111111111111111111111111";
        },
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "recipient";
          writable: true;
        },
        {
          name: "tokenProgram";
          optional: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "associatedTokenProgram";
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
        },
        {
          name: "eventAuthority";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ];
              }
            ];
          };
        },
        {
          name: "program";
        }
      ];
      args: [];
    },
    {
      name: "initiateEscrowAsNonOwner";
      docs: [
        "Initializes an escrow. This function locks funds into an escrow vault",
        "and sets up the necessary metadata for the escrow.",
        "",
        "# Parameters",
        "- `ctx`: The context containing all relevant accounts for initializing the escrow.",
        "- `identifier`: A unique identifier for the escrow, used to distinguish it from others.",
        "- `new_members`: A vector of new members to be added to the multi-wallet after the escrow is executed.",
        "- `amount`: The amount to be transferred to the escrow.",
        "",
        "# Returns",
        "- `Ok(())`: If the escrow is successfully initialized and funds are transferred to the escrow vault.",
        "- `Err`: If any validation fails or the transfer operation encounters an issue.",
        ""
      ];
      discriminator: [207, 60, 39, 74, 34, 156, 127, 180];
      accounts: [
        {
          name: "multiWallet";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  109,
                  117,
                  108,
                  116,
                  105,
                  95,
                  119,
                  97,
                  108,
                  108,
                  101,
                  116
                ];
              },
              {
                kind: "account";
                path: "multi_wallet.create_key";
                account: "multiWallet";
              }
            ];
          };
        },
        {
          name: "escrow";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [101, 115, 99, 114, 111, 119];
              },
              {
                kind: "account";
                path: "multi_wallet.create_key";
                account: "multiWallet";
              },
              {
                kind: "arg";
                path: "identifier";
              }
            ];
          };
        },
        {
          name: "escrowVault";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [101, 115, 99, 114, 111, 119];
              },
              {
                kind: "account";
                path: "multi_wallet.create_key";
                account: "multiWallet";
              },
              {
                kind: "arg";
                path: "identifier";
              },
              {
                kind: "const";
                value: [118, 97, 117, 108, 116];
              }
            ];
          };
        },
        {
          name: "escrowTokenVault";
          writable: true;
          optional: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "escrowVault";
              },
              {
                kind: "account";
                path: "tokenProgram";
              },
              {
                kind: "account";
                path: "mint";
              }
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: "proposerTokenAccount";
          writable: true;
          optional: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "proposer";
              },
              {
                kind: "account";
                path: "tokenProgram";
              },
              {
                kind: "account";
                path: "mint";
              }
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: "mint";
          optional: true;
        },
        {
          name: "proposer";
          writable: true;
          signer: true;
        },
        {
          name: "member";
          signer: true;
        },
        {
          name: "tokenProgram";
          optional: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "associatedTokenProgram";
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
        },
        {
          name: "eventAuthority";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ];
              }
            ];
          };
        },
        {
          name: "program";
        }
      ];
      args: [
        {
          name: "identifier";
          type: "u64";
        },
        {
          name: "newMembers";
          type: {
            vec: {
              defined: {
                name: "member";
              };
            };
          };
        },
        {
          name: "amount";
          type: "u64";
        },
        {
          name: "threshold";
          type: "u8";
        }
      ];
    },
    {
      name: "initiateEscrowAsOwner";
      docs: [
        "Initializes an escrow as an owner. This function locks the multi-wallet",
        "and prepares the escrow account with the specified metadata and recipient details.",
        "",
        "# Parameters",
        "- `ctx`: The context containing all relevant accounts required for initializing the escrow.",
        "- `identifier`: A unique identifier for the escrow, used to distinguish it from others.",
        "- `recipient`: The recipient's account,",
        "- `amount`: The amount to be transferred.",
        "- `mint`: Token mint that needs to be transferred(if any)",
        "",
        "# Returns",
        "- `Ok(())`: If the escrow is successfully initialized and the multi-wallet is locked.",
        "- `Err`: If any validation fails or the multi-wallet does not meet the required threshold.",
        ""
      ];
      discriminator: [255, 237, 252, 101, 179, 193, 143, 27];
      accounts: [
        {
          name: "multiWallet";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  109,
                  117,
                  108,
                  116,
                  105,
                  95,
                  119,
                  97,
                  108,
                  108,
                  101,
                  116
                ];
              },
              {
                kind: "account";
                path: "multi_wallet.create_key";
                account: "multiWallet";
              }
            ];
          };
        },
        {
          name: "escrow";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [101, 115, 99, 114, 111, 119];
              },
              {
                kind: "account";
                path: "multi_wallet.create_key";
                account: "multiWallet";
              },
              {
                kind: "arg";
                path: "identifier";
              }
            ];
          };
        },
        {
          name: "instructionSysvar";
          address: "Sysvar1nstructions1111111111111111111111111";
        },
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "eventAuthority";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ];
              }
            ];
          };
        },
        {
          name: "program";
        }
      ];
      args: [
        {
          name: "identifier";
          type: "u64";
        },
        {
          name: "recipient";
          type: "pubkey";
        },
        {
          name: "amount";
          type: "u64";
        },
        {
          name: "mint";
          type: {
            option: "pubkey";
          };
        }
      ];
    },
    {
      name: "transactionBufferClose";
      docs: [
        "Closes an existing transaction buffer.",
        "",
        "# Parameters",
        "- `ctx`: Context containing all necessary accounts.",
        "",
        "# Returns",
        "- `Ok(())`: If the transaction buffer is successfully closed.",
        "- `Err`: If validation fails or the accounts are invalid."
      ];
      discriminator: [17, 182, 208, 228, 136, 24, 178, 102];
      accounts: [
        {
          name: "multiWallet";
        },
        {
          name: "transactionBuffer";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  109,
                  117,
                  108,
                  116,
                  105,
                  95,
                  119,
                  97,
                  108,
                  108,
                  101,
                  116
                ];
              },
              {
                kind: "account";
                path: "multiWallet";
              },
              {
                kind: "const";
                value: [
                  116,
                  114,
                  97,
                  110,
                  115,
                  97,
                  99,
                  116,
                  105,
                  111,
                  110,
                  95,
                  98,
                  117,
                  102,
                  102,
                  101,
                  114
                ];
              },
              {
                kind: "account";
                path: "creator";
              },
              {
                kind: "account";
                path: "transaction_buffer.buffer_index";
                account: "transactionBuffer";
              }
            ];
          };
        },
        {
          name: "creator";
          signer: true;
        },
        {
          name: "rentPayer";
          writable: true;
        }
      ];
      args: [];
    },
    {
      name: "transactionBufferCreate";
      docs: [
        "Creates a new transaction buffer.",
        "",
        "# Parameters",
        "- `ctx`: Context containing all necessary accounts.",
        "- `args`: Arguments for the transaction buffer creation.",
        "",
        "# Returns",
        "- `Ok(())`: If the transaction buffer is successfully created.",
        "- `Err`: If validation fails or the provided arguments are invalid."
      ];
      discriminator: [245, 201, 113, 108, 37, 63, 29, 89];
      accounts: [
        {
          name: "multiWallet";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  109,
                  117,
                  108,
                  116,
                  105,
                  95,
                  119,
                  97,
                  108,
                  108,
                  101,
                  116
                ];
              },
              {
                kind: "account";
                path: "multi_wallet.create_key";
                account: "multiWallet";
              }
            ];
          };
        },
        {
          name: "transactionBuffer";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  109,
                  117,
                  108,
                  116,
                  105,
                  95,
                  119,
                  97,
                  108,
                  108,
                  101,
                  116
                ];
              },
              {
                kind: "account";
                path: "multiWallet";
              },
              {
                kind: "const";
                value: [
                  116,
                  114,
                  97,
                  110,
                  115,
                  97,
                  99,
                  116,
                  105,
                  111,
                  110,
                  95,
                  98,
                  117,
                  102,
                  102,
                  101,
                  114
                ];
              },
              {
                kind: "account";
                path: "creator";
              },
              {
                kind: "arg";
                path: "args.buffer_index";
              }
            ];
          };
        },
        {
          name: "creator";
          signer: true;
        },
        {
          name: "rentPayer";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "args";
          type: {
            defined: {
              name: "transactionBufferCreateArgs";
            };
          };
        }
      ];
    },
    {
      name: "transactionBufferExtend";
      docs: [
        "Extends an existing transaction buffer.",
        "",
        "# Parameters",
        "- `ctx`: Context containing all necessary accounts.",
        "- `args`: Arguments for extending the transaction buffer.",
        "",
        "# Returns",
        "- `Ok(())`: If the transaction buffer is successfully extended.",
        "- `Err`: If validation fails or the provided arguments are invalid."
      ];
      discriminator: [230, 157, 67, 56, 5, 238, 245, 146];
      accounts: [
        {
          name: "transactionBuffer";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  109,
                  117,
                  108,
                  116,
                  105,
                  95,
                  119,
                  97,
                  108,
                  108,
                  101,
                  116
                ];
              },
              {
                kind: "account";
                path: "transaction_buffer.multi_wallet";
                account: "transactionBuffer";
              },
              {
                kind: "const";
                value: [
                  116,
                  114,
                  97,
                  110,
                  115,
                  97,
                  99,
                  116,
                  105,
                  111,
                  110,
                  95,
                  98,
                  117,
                  102,
                  102,
                  101,
                  114
                ];
              },
              {
                kind: "account";
                path: "creator";
              },
              {
                kind: "account";
                path: "transaction_buffer.buffer_index";
                account: "transactionBuffer";
              }
            ];
          };
        },
        {
          name: "creator";
          signer: true;
        }
      ];
      args: [
        {
          name: "args";
          type: {
            defined: {
              name: "transactionBufferExtendArgs";
            };
          };
        }
      ];
    },
    {
      name: "vaultTransactionExecute";
      docs: [
        "Executes a vault transaction.",
        "",
        "# Parameters",
        "- `ctx`: The context of the vault transaction execution.",
        "- `vault_index`: The index of the vault.",
        "- `transaction_message`: The transaction message to be executed.",
        "",
        "# Returns",
        "- `Result<()>`: The result of the vault transaction execution."
      ];
      discriminator: [194, 8, 161, 87, 153, 164, 25, 171];
      accounts: [
        {
          name: "transactionBuffer";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  109,
                  117,
                  108,
                  116,
                  105,
                  95,
                  119,
                  97,
                  108,
                  108,
                  101,
                  116
                ];
              },
              {
                kind: "account";
                path: "transaction_buffer.multi_wallet";
                account: "transactionBuffer";
              },
              {
                kind: "const";
                value: [
                  116,
                  114,
                  97,
                  110,
                  115,
                  97,
                  99,
                  116,
                  105,
                  111,
                  110,
                  95,
                  98,
                  117,
                  102,
                  102,
                  101,
                  114
                ];
              },
              {
                kind: "account";
                path: "transaction_buffer.creator";
                account: "transactionBuffer";
              },
              {
                kind: "account";
                path: "transaction_buffer.buffer_index";
                account: "transactionBuffer";
              }
            ];
          };
        },
        {
          name: "multiWallet";
          writable: true;
        },
        {
          name: "rentPayer";
          writable: true;
        },
        {
          name: "instructionSysvar";
          address: "Sysvar1nstructions1111111111111111111111111";
        }
      ];
      args: [
        {
          name: "vaultIndex";
          type: "u16";
        }
      ];
    }
  ];
  accounts: [
    {
      name: "escrow";
      discriminator: [31, 213, 123, 187, 186, 22, 218, 155];
    },
    {
      name: "multiWallet";
      discriminator: [100, 242, 252, 66, 54, 82, 77, 90];
    },
    {
      name: "transactionBuffer";
      discriminator: [90, 36, 35, 219, 93, 225, 110, 96];
    }
  ];
  events: [
    {
      name: "configEvent";
      discriminator: [162, 6, 172, 68, 201, 128, 119, 230];
    },
    {
      name: "escrowEvent";
      discriminator: [241, 51, 61, 3, 5, 32, 113, 144];
    }
  ];
  errors: [
    {
      code: 6000;
      name: "durableNonceDetected";
      msg: "Durable nonce detected. Durable nonce is not allowed for this transaction.";
    },
    {
      code: 6001;
      name: "duplicateMember";
      msg: "Duplicate public keys found in the members array. Each member must have a unique public key.";
    },
    {
      code: 6002;
      name: "emptyMembers";
      msg: "The members array cannot be empty. Add at least one member.";
    },
    {
      code: 6003;
      name: "tooManyMembers";
      msg: "Too many members specified. A maximum of 65,535 members is allowed.";
    },
    {
      code: 6004;
      name: "invalidThreshold";
      msg: "Invalid threshold specified. The threshold must be between 1 and the total number of members.";
    },
    {
      code: 6005;
      name: "thresholdTooHigh";
      msg: "Threshold exceeds the maximum allowed limit of 2. Please choose a lower value.";
    },
    {
      code: 6006;
      name: "invalidTransactionMessage";
      msg: "The provided TransactionMessage is malformed or improperly formatted.";
    },
    {
      code: 6007;
      name: "notEnoughSigners";
      msg: "Insufficient signers. The number of signers must meet or exceed the minimum threshold.";
    },
    {
      code: 6008;
      name: "invalidNumberOfAccounts";
      msg: "Incorrect number of accounts provided. Verify the account count matches the expected number.";
    },
    {
      code: 6009;
      name: "invalidAccount";
      msg: "One or more accounts provided are invalid. Ensure all accounts meet the requirements.";
    },
    {
      code: 6010;
      name: "missingAccount";
      msg: "Required account is missing. Ensure all necessary accounts are included.";
    },
    {
      code: 6011;
      name: "illegalAccountOwner";
      msg: "Account is not owned by the Multisig program. Only accounts under the Multisig program can be used.";
    },
    {
      code: 6012;
      name: "multisigIsCurrentlyLocked";
      msg: "The Multisig must be unlocked before performing this operation. Unlock it and try again.";
    },
    {
      code: 6013;
      name: "escrowDoesNotExist";
      msg: "The escrow account doesn't exist.";
    },
    {
      code: 6014;
      name: "missingOwner";
      msg: "The members array cannot have a length of one. Add an additional member.";
    },
    {
      code: 6015;
      name: "invalidEscrowProposer";
      msg: "The proposer must match the account stated in the escrow.";
    },
    {
      code: 6016;
      name: "invalidEscrowRecipient";
      msg: "The recipient nust match the account stated in the escrow.";
    },
    {
      code: 6017;
      name: "insufficientSignerWithExecutePermission";
      msg: "Require at least one signer to have the execute permission.";
    },
    {
      code: 6018;
      name: "insufficientSignerWithInitiatePermission";
      msg: "Require at least one signer to have the initiate permission.";
    },
    {
      code: 6019;
      name: "insufficientSignersWithVotePermission";
      msg: "Require threshold to be lesser than or equal to the number of members with vote permission.";
    },
    {
      code: 6020;
      name: "unauthorisedToAcceptEscrowOffer";
      msg: "You do not have permission to accept this offer.";
    },
    {
      code: 6021;
      name: "unauthorisedToModifyBuffer";
      msg: "Only the creator of the transaction buffer have permission to modify the buffer.";
    },
    {
      code: 6022;
      name: "finalBufferHashMismatch";
      msg: "Final message buffer hash doesnt match the expected hash";
    },
    {
      code: 6023;
      name: "finalBufferSizeExceeded";
      msg: "Final buffer size cannot exceed 4000 bytes";
    },
    {
      code: 6024;
      name: "finalBufferSizeMismatch";
      msg: "Final buffer size mismatch";
    }
  ];
  types: [
    {
      name: "configAction";
      type: {
        kind: "enum";
        variants: [
          {
            name: "setMembers";
            fields: [
              {
                vec: {
                  defined: {
                    name: "member";
                  };
                };
              }
            ];
          },
          {
            name: "addMembers";
            fields: [
              {
                vec: {
                  defined: {
                    name: "member";
                  };
                };
              }
            ];
          },
          {
            name: "removeMembers";
            fields: [
              {
                vec: "pubkey";
              }
            ];
          },
          {
            name: "setThreshold";
            fields: ["u8"];
          },
          {
            name: "setMetadata";
            fields: [
              {
                option: "pubkey";
              }
            ];
          }
        ];
      };
    },
    {
      name: "configEvent";
      type: {
        kind: "struct";
        fields: [
          {
            name: "createKey";
            type: "pubkey";
          },
          {
            name: "members";
            type: {
              vec: {
                defined: {
                  name: "member";
                };
              };
            };
          },
          {
            name: "threshold";
            type: "u8";
          },
          {
            name: "metadata";
            type: {
              option: "pubkey";
            };
          }
        ];
      };
    },
    {
      name: "escrow";
      type: {
        kind: "struct";
        fields: [
          {
            name: "createKey";
            type: "pubkey";
          },
          {
            name: "identifier";
            type: "u64";
          },
          {
            name: "bump";
            type: "u8";
          },
          {
            name: "proposer";
            type: {
              option: "pubkey";
            };
          },
          {
            name: "vaultBump";
            type: {
              option: "u8";
            };
          },
          {
            name: "recipient";
            type: {
              defined: {
                name: "recipient";
              };
            };
          },
          {
            name: "newMembers";
            type: {
              option: {
                vec: {
                  defined: {
                    name: "member";
                  };
                };
              };
            };
          },
          {
            name: "threshold";
            type: {
              option: "u8";
            };
          }
        ];
      };
    },
    {
      name: "escrowEvent";
      type: {
        kind: "struct";
        fields: [
          {
            name: "createKey";
            type: "pubkey";
          },
          {
            name: "identifier";
            type: "u64";
          },
          {
            name: "isPending";
            type: "bool";
          },
          {
            name: "isRejected";
            type: "bool";
          },
          {
            name: "proposer";
            type: {
              option: "pubkey";
            };
          },
          {
            name: "approver";
            type: {
              option: "pubkey";
            };
          },
          {
            name: "recipient";
            type: {
              defined: {
                name: "recipient";
              };
            };
          },
          {
            name: "newMembers";
            type: {
              option: {
                vec: {
                  defined: {
                    name: "member";
                  };
                };
              };
            };
          },
          {
            name: "threshold";
            type: {
              option: "u8";
            };
          }
        ];
      };
    },
    {
      name: "member";
      type: {
        kind: "struct";
        fields: [
          {
            name: "pubkey";
            type: "pubkey";
          },
          {
            name: "permissions";
            type: {
              option: {
                defined: {
                  name: "permissions";
                };
              };
            };
          }
        ];
      };
    },
    {
      name: "multiWallet";
      type: {
        kind: "struct";
        fields: [
          {
            name: "createKey";
            type: "pubkey";
          },
          {
            name: "threshold";
            type: "u8";
          },
          {
            name: "bump";
            type: "u8";
          },
          {
            name: "members";
            type: {
              vec: {
                defined: {
                  name: "member";
                };
              };
            };
          },
          {
            name: "pendingOffers";
            type: {
              vec: "pubkey";
            };
          },
          {
            name: "metadata";
            type: {
              option: "pubkey";
            };
          }
        ];
      };
    },
    {
      name: "permissions";
      docs: ["Bitmask for permissions."];
      type: {
        kind: "struct";
        fields: [
          {
            name: "mask";
            type: "u8";
          }
        ];
      };
    },
    {
      name: "recipient";
      type: {
        kind: "struct";
        fields: [
          {
            name: "amount";
            type: "u64";
          },
          {
            name: "pubkey";
            type: {
              option: "pubkey";
            };
          },
          {
            name: "mint";
            type: {
              option: "pubkey";
            };
          }
        ];
      };
    },
    {
      name: "transactionBuffer";
      type: {
        kind: "struct";
        fields: [
          {
            name: "multiWallet";
            docs: ["The multisig this belongs to."];
            type: "pubkey";
          },
          {
            name: "creator";
            docs: ["Member of the Multisig who created the TransactionBuffer."];
            type: "pubkey";
          },
          {
            name: "rentPayer";
            docs: ["Rent payer for the transaction buffer"];
            type: "pubkey";
          },
          {
            name: "bump";
            docs: ["transaction bump"];
            type: "u8";
          },
          {
            name: "bufferIndex";
            docs: ["Index to seed address derivation"];
            type: "u8";
          },
          {
            name: "vaultIndex";
            docs: ["Vault index of the transaction this buffer belongs to."];
            type: "u8";
          },
          {
            name: "finalBufferHash";
            docs: ["Hash of the final assembled transaction message."];
            type: {
              array: ["u8", 32];
            };
          },
          {
            name: "finalBufferSize";
            docs: ["The size of the final assembled transaction message."];
            type: "u16";
          },
          {
            name: "buffer";
            docs: ["The buffer of the transaction message."];
            type: "bytes";
          }
        ];
      };
    },
    {
      name: "transactionBufferCreateArgs";
      type: {
        kind: "struct";
        fields: [
          {
            name: "bufferIndex";
            docs: [
              "Index of the buffer account to seed the account derivation"
            ];
            type: "u8";
          },
          {
            name: "vaultIndex";
            docs: ["Index of the vault this transaction belongs to."];
            type: "u8";
          },
          {
            name: "finalBufferHash";
            docs: ["Hash of the final assembled transaction message."];
            type: {
              array: ["u8", 32];
            };
          },
          {
            name: "finalBufferSize";
            docs: ["Final size of the buffer."];
            type: "u16";
          },
          {
            name: "buffer";
            docs: ["Initial slice of the buffer."];
            type: "bytes";
          }
        ];
      };
    },
    {
      name: "transactionBufferExtendArgs";
      type: {
        kind: "struct";
        fields: [
          {
            name: "buffer";
            type: "bytes";
          }
        ];
      };
    }
  ];
};
