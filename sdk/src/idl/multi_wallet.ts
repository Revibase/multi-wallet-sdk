export const MultiWalletIdl = {
  address: "mu1LDWh4VGHhnZHB85s92HNBapj3b9s5DgzTkiAyeKY",
  metadata: {
    name: "multi_wallet",
    version: "0.1.0",
    spec: "0.1.0",
    description: "Created with Anchor",
  },
  instructions: [
    {
      name: "cancel_escrow_as_non_owner",
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
        "",
      ],
      discriminator: [219, 234, 45, 214, 232, 65, 209, 96],
      accounts: [
        {
          name: "multi_wallet",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  109, 117, 108, 116, 105, 95, 119, 97, 108, 108, 101, 116,
                ],
              },
              {
                kind: "account",
                path: "escrow.create_key",
                account: "Escrow",
              },
            ],
          },
        },
        {
          name: "escrow",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [101, 115, 99, 114, 111, 119],
              },
              {
                kind: "account",
                path: "escrow.create_key",
                account: "Escrow",
              },
              {
                kind: "account",
                path: "escrow.identifier",
                account: "Escrow",
              },
            ],
          },
        },
        {
          name: "escrow_vault",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [101, 115, 99, 114, 111, 119],
              },
              {
                kind: "account",
                path: "escrow.create_key",
                account: "Escrow",
              },
              {
                kind: "account",
                path: "escrow.identifier",
                account: "Escrow",
              },
              {
                kind: "const",
                value: [118, 97, 117, 108, 116],
              },
            ],
          },
        },
        {
          name: "escrow_token_vault",
          writable: true,
          optional: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "escrow_vault",
              },
              {
                kind: "account",
                path: "token_program",
              },
              {
                kind: "account",
                path: "mint",
              },
            ],
            program: {
              kind: "const",
              value: [
                140, 151, 37, 143, 78, 36, 137, 241, 187, 61, 16, 41, 20, 142,
                13, 131, 11, 90, 19, 153, 218, 255, 16, 132, 4, 142, 123, 216,
                219, 233, 248, 89,
              ],
            },
          },
        },
        {
          name: "proposer_token_account",
          writable: true,
          optional: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "proposer",
              },
              {
                kind: "account",
                path: "token_program",
              },
              {
                kind: "account",
                path: "mint",
              },
            ],
            program: {
              kind: "const",
              value: [
                140, 151, 37, 143, 78, 36, 137, 241, 187, 61, 16, 41, 20, 142,
                13, 131, 11, 90, 19, 153, 218, 255, 16, 132, 4, 142, 123, 216,
                219, 233, 248, 89,
              ],
            },
          },
        },
        {
          name: "mint",
          optional: true,
        },
        {
          name: "proposer",
          writable: true,
          signer: true,
        },
        {
          name: "token_program",
          optional: true,
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111",
        },
        {
          name: "associated_token_program",
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
        },
        {
          name: "event_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  95, 95, 101, 118, 101, 110, 116, 95, 97, 117, 116, 104, 111,
                  114, 105, 116, 121,
                ],
              },
            ],
          },
        },
        {
          name: "program",
        },
      ],
      args: [],
    },
    {
      name: "cancel_escrow_as_owner",
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
        "",
      ],
      discriminator: [22, 155, 132, 143, 51, 185, 186, 247],
      accounts: [
        {
          name: "multi_wallet",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  109, 117, 108, 116, 105, 95, 119, 97, 108, 108, 101, 116,
                ],
              },
              {
                kind: "account",
                path: "escrow.create_key",
                account: "Escrow",
              },
            ],
          },
        },
        {
          name: "escrow",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [101, 115, 99, 114, 111, 119],
              },
              {
                kind: "account",
                path: "escrow.create_key",
                account: "Escrow",
              },
              {
                kind: "account",
                path: "escrow.identifier",
                account: "Escrow",
              },
            ],
          },
        },
        {
          name: "escrow_vault",
          writable: true,
          optional: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [101, 115, 99, 114, 111, 119],
              },
              {
                kind: "account",
                path: "escrow.create_key",
                account: "Escrow",
              },
              {
                kind: "account",
                path: "escrow.identifier",
                account: "Escrow",
              },
              {
                kind: "const",
                value: [118, 97, 117, 108, 116],
              },
            ],
          },
        },
        {
          name: "escrow_token_vault",
          writable: true,
          optional: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "escrow_vault",
              },
              {
                kind: "account",
                path: "token_program",
              },
              {
                kind: "account",
                path: "mint",
              },
            ],
            program: {
              kind: "const",
              value: [
                140, 151, 37, 143, 78, 36, 137, 241, 187, 61, 16, 41, 20, 142,
                13, 131, 11, 90, 19, 153, 218, 255, 16, 132, 4, 142, 123, 216,
                219, 233, 248, 89,
              ],
            },
          },
        },
        {
          name: "proposer_token_account",
          writable: true,
          optional: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "proposer",
              },
              {
                kind: "account",
                path: "token_program",
              },
              {
                kind: "account",
                path: "mint",
              },
            ],
            program: {
              kind: "const",
              value: [
                140, 151, 37, 143, 78, 36, 137, 241, 187, 61, 16, 41, 20, 142,
                13, 131, 11, 90, 19, 153, 218, 255, 16, 132, 4, 142, 123, 216,
                219, 233, 248, 89,
              ],
            },
          },
        },
        {
          name: "proposer",
          writable: true,
        },
        {
          name: "instruction_sysvar",
          address: "Sysvar1nstructions1111111111111111111111111",
        },
        {
          name: "mint",
          optional: true,
        },
        {
          name: "token_program",
          optional: true,
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111",
        },
        {
          name: "associated_token_program",
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
        },
        {
          name: "event_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  95, 95, 101, 118, 101, 110, 116, 95, 97, 117, 116, 104, 111,
                  114, 105, 116, 121,
                ],
              },
            ],
          },
        },
        {
          name: "program",
        },
      ],
      args: [],
    },
    {
      name: "change_config",
      docs: [
        "# Parameters",
        "- `ctx`: The context of the multi-action execution.",
        "- `config_actions`: The list of actions to be executed.",
        "",
        "# Returns",
        "- `Result<()>`: The result of the multi-action execution.",
      ],
      discriminator: [24, 158, 114, 115, 94, 210, 244, 233],
      accounts: [
        {
          name: "multi_wallet",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  109, 117, 108, 116, 105, 95, 119, 97, 108, 108, 101, 116,
                ],
              },
              {
                kind: "account",
                path: "multi_wallet.create_key",
                account: "MultiWallet",
              },
            ],
          },
        },
        {
          name: "payer",
          writable: true,
          signer: true,
          optional: true,
        },
        {
          name: "system_program",
          optional: true,
          address: "11111111111111111111111111111111",
        },
        {
          name: "instruction_sysvar",
          address: "Sysvar1nstructions1111111111111111111111111",
        },
        {
          name: "event_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  95, 95, 101, 118, 101, 110, 116, 95, 97, 117, 116, 104, 111,
                  114, 105, 116, 121,
                ],
              },
            ],
          },
        },
        {
          name: "program",
        },
      ],
      args: [
        {
          name: "config_actions",
          type: {
            vec: {
              defined: {
                name: "ConfigAction",
              },
            },
          },
        },
      ],
    },
    {
      name: "create",
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
        "- `Result<()>`: The result of the multi-wallet creation.",
      ],
      discriminator: [24, 30, 200, 40, 5, 28, 7, 119],
      accounts: [
        {
          name: "payer",
          writable: true,
          signer: true,
        },
        {
          name: "multi_wallet",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  109, 117, 108, 116, 105, 95, 119, 97, 108, 108, 101, 116,
                ],
              },
              {
                kind: "arg",
                path: "create_key.pubkey",
              },
            ],
          },
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111",
        },
      ],
      args: [
        {
          name: "create_key",
          type: {
            defined: {
              name: "Member",
            },
          },
        },
        {
          name: "metadata",
          type: {
            option: "pubkey",
          },
        },
      ],
    },
    {
      name: "execute_escrow_as_non_owner",
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
        "",
      ],
      discriminator: [63, 186, 102, 94, 23, 177, 217, 130],
      accounts: [
        {
          name: "multi_wallet",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  109, 117, 108, 116, 105, 95, 119, 97, 108, 108, 101, 116,
                ],
              },
              {
                kind: "account",
                path: "escrow.create_key",
                account: "Escrow",
              },
            ],
          },
        },
        {
          name: "escrow",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [101, 115, 99, 114, 111, 119],
              },
              {
                kind: "account",
                path: "escrow.create_key",
                account: "Escrow",
              },
              {
                kind: "account",
                path: "escrow.identifier",
                account: "Escrow",
              },
            ],
          },
        },
        {
          name: "recipient_token_account",
          writable: true,
          optional: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "recipient",
              },
              {
                kind: "account",
                path: "token_program",
              },
              {
                kind: "account",
                path: "mint",
              },
            ],
            program: {
              kind: "const",
              value: [
                140, 151, 37, 143, 78, 36, 137, 241, 187, 61, 16, 41, 20, 142,
                13, 131, 11, 90, 19, 153, 218, 255, 16, 132, 4, 142, 123, 216,
                219, 233, 248, 89,
              ],
            },
          },
        },
        {
          name: "payer_token_account",
          writable: true,
          optional: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "payer",
              },
              {
                kind: "account",
                path: "token_program",
              },
              {
                kind: "account",
                path: "mint",
              },
            ],
            program: {
              kind: "const",
              value: [
                140, 151, 37, 143, 78, 36, 137, 241, 187, 61, 16, 41, 20, 142,
                13, 131, 11, 90, 19, 153, 218, 255, 16, 132, 4, 142, 123, 216,
                219, 233, 248, 89,
              ],
            },
          },
        },
        {
          name: "mint",
          optional: true,
        },
        {
          name: "recipient",
          writable: true,
        },
        {
          name: "payer",
          writable: true,
          signer: true,
        },
        {
          name: "token_program",
          optional: true,
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111",
        },
        {
          name: "associated_token_program",
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
        },
        {
          name: "event_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  95, 95, 101, 118, 101, 110, 116, 95, 97, 117, 116, 104, 111,
                  114, 105, 116, 121,
                ],
              },
            ],
          },
        },
        {
          name: "program",
        },
      ],
      args: [
        {
          name: "new_members",
          type: {
            vec: {
              defined: {
                name: "Member",
              },
            },
          },
        },
        {
          name: "threshold",
          type: "u8",
        },
      ],
    },
    {
      name: "execute_escrow_as_owner",
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
        "",
      ],
      discriminator: [119, 121, 203, 21, 159, 211, 44, 59],
      accounts: [
        {
          name: "multi_wallet",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  109, 117, 108, 116, 105, 95, 119, 97, 108, 108, 101, 116,
                ],
              },
              {
                kind: "account",
                path: "escrow.create_key",
                account: "Escrow",
              },
            ],
          },
        },
        {
          name: "escrow",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [101, 115, 99, 114, 111, 119],
              },
              {
                kind: "account",
                path: "escrow.create_key",
                account: "Escrow",
              },
              {
                kind: "account",
                path: "escrow.identifier",
                account: "Escrow",
              },
            ],
          },
        },
        {
          name: "escrow_vault",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [101, 115, 99, 114, 111, 119],
              },
              {
                kind: "account",
                path: "escrow.create_key",
                account: "Escrow",
              },
              {
                kind: "account",
                path: "escrow.identifier",
                account: "Escrow",
              },
              {
                kind: "const",
                value: [118, 97, 117, 108, 116],
              },
            ],
          },
        },
        {
          name: "escrow_token_vault",
          writable: true,
          optional: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "escrow_vault",
              },
              {
                kind: "account",
                path: "token_program",
              },
              {
                kind: "account",
                path: "mint",
              },
            ],
            program: {
              kind: "const",
              value: [
                140, 151, 37, 143, 78, 36, 137, 241, 187, 61, 16, 41, 20, 142,
                13, 131, 11, 90, 19, 153, 218, 255, 16, 132, 4, 142, 123, 216,
                219, 233, 248, 89,
              ],
            },
          },
        },
        {
          name: "recipient_token_account",
          writable: true,
          optional: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "recipient",
              },
              {
                kind: "account",
                path: "token_program",
              },
              {
                kind: "account",
                path: "mint",
              },
            ],
            program: {
              kind: "const",
              value: [
                140, 151, 37, 143, 78, 36, 137, 241, 187, 61, 16, 41, 20, 142,
                13, 131, 11, 90, 19, 153, 218, 255, 16, 132, 4, 142, 123, 216,
                219, 233, 248, 89,
              ],
            },
          },
        },
        {
          name: "mint",
          optional: true,
        },
        {
          name: "instruction_sysvar",
          address: "Sysvar1nstructions1111111111111111111111111",
        },
        {
          name: "payer",
          writable: true,
          signer: true,
        },
        {
          name: "recipient",
          writable: true,
        },
        {
          name: "token_program",
          optional: true,
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111",
        },
        {
          name: "associated_token_program",
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
        },
        {
          name: "event_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  95, 95, 101, 118, 101, 110, 116, 95, 97, 117, 116, 104, 111,
                  114, 105, 116, 121,
                ],
              },
            ],
          },
        },
        {
          name: "program",
        },
      ],
      args: [],
    },
    {
      name: "initiate_escrow_as_non_owner",
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
        "",
      ],
      discriminator: [207, 60, 39, 74, 34, 156, 127, 180],
      accounts: [
        {
          name: "multi_wallet",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  109, 117, 108, 116, 105, 95, 119, 97, 108, 108, 101, 116,
                ],
              },
              {
                kind: "account",
                path: "multi_wallet.create_key",
                account: "MultiWallet",
              },
            ],
          },
        },
        {
          name: "escrow",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [101, 115, 99, 114, 111, 119],
              },
              {
                kind: "account",
                path: "multi_wallet.create_key",
                account: "MultiWallet",
              },
              {
                kind: "arg",
                path: "identifier",
              },
            ],
          },
        },
        {
          name: "escrow_vault",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [101, 115, 99, 114, 111, 119],
              },
              {
                kind: "account",
                path: "multi_wallet.create_key",
                account: "MultiWallet",
              },
              {
                kind: "arg",
                path: "identifier",
              },
              {
                kind: "const",
                value: [118, 97, 117, 108, 116],
              },
            ],
          },
        },
        {
          name: "escrow_token_vault",
          writable: true,
          optional: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "escrow_vault",
              },
              {
                kind: "account",
                path: "token_program",
              },
              {
                kind: "account",
                path: "mint",
              },
            ],
            program: {
              kind: "const",
              value: [
                140, 151, 37, 143, 78, 36, 137, 241, 187, 61, 16, 41, 20, 142,
                13, 131, 11, 90, 19, 153, 218, 255, 16, 132, 4, 142, 123, 216,
                219, 233, 248, 89,
              ],
            },
          },
        },
        {
          name: "proposer_token_account",
          writable: true,
          optional: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "proposer",
              },
              {
                kind: "account",
                path: "token_program",
              },
              {
                kind: "account",
                path: "mint",
              },
            ],
            program: {
              kind: "const",
              value: [
                140, 151, 37, 143, 78, 36, 137, 241, 187, 61, 16, 41, 20, 142,
                13, 131, 11, 90, 19, 153, 218, 255, 16, 132, 4, 142, 123, 216,
                219, 233, 248, 89,
              ],
            },
          },
        },
        {
          name: "mint",
          optional: true,
        },
        {
          name: "proposer",
          writable: true,
          signer: true,
        },
        {
          name: "member",
          signer: true,
        },
        {
          name: "token_program",
          optional: true,
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111",
        },
        {
          name: "associated_token_program",
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
        },
        {
          name: "event_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  95, 95, 101, 118, 101, 110, 116, 95, 97, 117, 116, 104, 111,
                  114, 105, 116, 121,
                ],
              },
            ],
          },
        },
        {
          name: "program",
        },
      ],
      args: [
        {
          name: "identifier",
          type: "u64",
        },
        {
          name: "new_members",
          type: {
            vec: {
              defined: {
                name: "Member",
              },
            },
          },
        },
        {
          name: "amount",
          type: "u64",
        },
        {
          name: "threshold",
          type: "u8",
        },
      ],
    },
    {
      name: "initiate_escrow_as_owner",
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
        "",
      ],
      discriminator: [255, 237, 252, 101, 179, 193, 143, 27],
      accounts: [
        {
          name: "multi_wallet",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  109, 117, 108, 116, 105, 95, 119, 97, 108, 108, 101, 116,
                ],
              },
              {
                kind: "account",
                path: "multi_wallet.create_key",
                account: "MultiWallet",
              },
            ],
          },
        },
        {
          name: "escrow",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [101, 115, 99, 114, 111, 119],
              },
              {
                kind: "account",
                path: "multi_wallet.create_key",
                account: "MultiWallet",
              },
              {
                kind: "arg",
                path: "identifier",
              },
            ],
          },
        },
        {
          name: "instruction_sysvar",
          address: "Sysvar1nstructions1111111111111111111111111",
        },
        {
          name: "payer",
          writable: true,
          signer: true,
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111",
        },
        {
          name: "event_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  95, 95, 101, 118, 101, 110, 116, 95, 97, 117, 116, 104, 111,
                  114, 105, 116, 121,
                ],
              },
            ],
          },
        },
        {
          name: "program",
        },
      ],
      args: [
        {
          name: "identifier",
          type: "u64",
        },
        {
          name: "recipient",
          type: "pubkey",
        },
        {
          name: "amount",
          type: "u64",
        },
        {
          name: "mint",
          type: {
            option: "pubkey",
          },
        },
      ],
    },
    {
      name: "transaction_buffer_close",
      docs: [
        "Closes an existing transaction buffer.",
        "",
        "# Parameters",
        "- `ctx`: Context containing all necessary accounts.",
        "",
        "# Returns",
        "- `Ok(())`: If the transaction buffer is successfully closed.",
        "- `Err`: If validation fails or the accounts are invalid.",
      ],
      discriminator: [17, 182, 208, 228, 136, 24, 178, 102],
      accounts: [
        {
          name: "multi_wallet",
        },
        {
          name: "transaction_buffer",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  109, 117, 108, 116, 105, 95, 119, 97, 108, 108, 101, 116,
                ],
              },
              {
                kind: "account",
                path: "multi_wallet",
              },
              {
                kind: "const",
                value: [
                  116, 114, 97, 110, 115, 97, 99, 116, 105, 111, 110, 95, 98,
                  117, 102, 102, 101, 114,
                ],
              },
              {
                kind: "account",
                path: "creator",
              },
              {
                kind: "account",
                path: "transaction_buffer.buffer_index",
                account: "TransactionBuffer",
              },
            ],
          },
        },
        {
          name: "creator",
          signer: true,
        },
        {
          name: "rent_payer",
          writable: true,
        },
      ],
      args: [],
    },
    {
      name: "transaction_buffer_create",
      docs: [
        "Creates a new transaction buffer.",
        "",
        "# Parameters",
        "- `ctx`: Context containing all necessary accounts.",
        "- `args`: Arguments for the transaction buffer creation.",
        "",
        "# Returns",
        "- `Ok(())`: If the transaction buffer is successfully created.",
        "- `Err`: If validation fails or the provided arguments are invalid.",
      ],
      discriminator: [245, 201, 113, 108, 37, 63, 29, 89],
      accounts: [
        {
          name: "multi_wallet",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  109, 117, 108, 116, 105, 95, 119, 97, 108, 108, 101, 116,
                ],
              },
              {
                kind: "account",
                path: "multi_wallet.create_key",
                account: "MultiWallet",
              },
            ],
          },
        },
        {
          name: "transaction_buffer",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  109, 117, 108, 116, 105, 95, 119, 97, 108, 108, 101, 116,
                ],
              },
              {
                kind: "account",
                path: "multi_wallet",
              },
              {
                kind: "const",
                value: [
                  116, 114, 97, 110, 115, 97, 99, 116, 105, 111, 110, 95, 98,
                  117, 102, 102, 101, 114,
                ],
              },
              {
                kind: "account",
                path: "creator",
              },
              {
                kind: "arg",
                path: "args.buffer_index",
              },
            ],
          },
        },
        {
          name: "creator",
          signer: true,
        },
        {
          name: "rent_payer",
          writable: true,
          signer: true,
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111",
        },
      ],
      args: [
        {
          name: "args",
          type: {
            defined: {
              name: "TransactionBufferCreateArgs",
            },
          },
        },
      ],
    },
    {
      name: "transaction_buffer_extend",
      docs: [
        "Extends an existing transaction buffer.",
        "",
        "# Parameters",
        "- `ctx`: Context containing all necessary accounts.",
        "- `args`: Arguments for extending the transaction buffer.",
        "",
        "# Returns",
        "- `Ok(())`: If the transaction buffer is successfully extended.",
        "- `Err`: If validation fails or the provided arguments are invalid.",
      ],
      discriminator: [230, 157, 67, 56, 5, 238, 245, 146],
      accounts: [
        {
          name: "transaction_buffer",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  109, 117, 108, 116, 105, 95, 119, 97, 108, 108, 101, 116,
                ],
              },
              {
                kind: "account",
                path: "transaction_buffer.multi_wallet",
                account: "TransactionBuffer",
              },
              {
                kind: "const",
                value: [
                  116, 114, 97, 110, 115, 97, 99, 116, 105, 111, 110, 95, 98,
                  117, 102, 102, 101, 114,
                ],
              },
              {
                kind: "account",
                path: "creator",
              },
              {
                kind: "account",
                path: "transaction_buffer.buffer_index",
                account: "TransactionBuffer",
              },
            ],
          },
        },
        {
          name: "creator",
          signer: true,
        },
      ],
      args: [
        {
          name: "args",
          type: {
            defined: {
              name: "TransactionBufferExtendArgs",
            },
          },
        },
      ],
    },
    {
      name: "vault_transaction_execute",
      docs: [
        "Executes a vault transaction.",
        "",
        "# Parameters",
        "- `ctx`: The context of the vault transaction execution.",
        "- `vault_index`: The index of the vault.",
        "- `transaction_message`: The transaction message to be executed.",
        "",
        "# Returns",
        "- `Result<()>`: The result of the vault transaction execution.",
      ],
      discriminator: [194, 8, 161, 87, 153, 164, 25, 171],
      accounts: [
        {
          name: "transaction_buffer",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  109, 117, 108, 116, 105, 95, 119, 97, 108, 108, 101, 116,
                ],
              },
              {
                kind: "account",
                path: "transaction_buffer.multi_wallet",
                account: "TransactionBuffer",
              },
              {
                kind: "const",
                value: [
                  116, 114, 97, 110, 115, 97, 99, 116, 105, 111, 110, 95, 98,
                  117, 102, 102, 101, 114,
                ],
              },
              {
                kind: "account",
                path: "transaction_buffer.creator",
                account: "TransactionBuffer",
              },
              {
                kind: "account",
                path: "transaction_buffer.buffer_index",
                account: "TransactionBuffer",
              },
            ],
          },
        },
        {
          name: "multi_wallet",
          writable: true,
        },
        {
          name: "rent_payer",
          writable: true,
        },
        {
          name: "instruction_sysvar",
          address: "Sysvar1nstructions1111111111111111111111111",
        },
      ],
      args: [
        {
          name: "vault_index",
          type: "u16",
        },
      ],
    },
  ],
  accounts: [
    {
      name: "Escrow",
      discriminator: [31, 213, 123, 187, 186, 22, 218, 155],
    },
    {
      name: "MultiWallet",
      discriminator: [100, 242, 252, 66, 54, 82, 77, 90],
    },
    {
      name: "TransactionBuffer",
      discriminator: [90, 36, 35, 219, 93, 225, 110, 96],
    },
  ],
  events: [
    {
      name: "ChangeConfigEvent",
      discriminator: [201, 112, 93, 219, 95, 244, 24, 240],
    },
    {
      name: "EscrowEvent",
      discriminator: [241, 51, 61, 3, 5, 32, 113, 144],
    },
  ],
  errors: [
    {
      code: 6000,
      name: "DurableNonceDetected",
      msg: "Durable nonce detected. Durable nonce is not allowed for this transaction.",
    },
    {
      code: 6001,
      name: "DuplicateMember",
      msg: "Duplicate public keys found in the members array. Each member must have a unique public key.",
    },
    {
      code: 6002,
      name: "EmptyMembers",
      msg: "The members array cannot be empty. Add at least one member.",
    },
    {
      code: 6003,
      name: "TooManyMembers",
      msg: "Too many members specified. A maximum of 65,535 members is allowed.",
    },
    {
      code: 6004,
      name: "InvalidThreshold",
      msg: "Invalid threshold specified. The threshold must be between 1 and the total number of members.",
    },
    {
      code: 6005,
      name: "ThresholdTooHigh",
      msg: "Threshold exceeds the maximum allowed limit of 2. Please choose a lower value.",
    },
    {
      code: 6006,
      name: "InvalidTransactionMessage",
      msg: "The provided TransactionMessage is malformed or improperly formatted.",
    },
    {
      code: 6007,
      name: "NotEnoughSigners",
      msg: "Insufficient signers. The number of signers must meet or exceed the minimum threshold.",
    },
    {
      code: 6008,
      name: "InvalidNumberOfAccounts",
      msg: "Incorrect number of accounts provided. Verify the account count matches the expected number.",
    },
    {
      code: 6009,
      name: "InvalidAccount",
      msg: "One or more accounts provided are invalid. Ensure all accounts meet the requirements.",
    },
    {
      code: 6010,
      name: "MissingAccount",
      msg: "Required account is missing. Ensure all necessary accounts are included.",
    },
    {
      code: 6011,
      name: "IllegalAccountOwner",
      msg: "Account is not owned by the Multisig program. Only accounts under the Multisig program can be used.",
    },
    {
      code: 6012,
      name: "MultisigIsCurrentlyLocked",
      msg: "The Multisig must be unlocked before performing this operation. Unlock it and try again.",
    },
    {
      code: 6013,
      name: "EscrowDoesNotExist",
      msg: "The escrow account doesn't exist.",
    },
    {
      code: 6014,
      name: "MissingOwner",
      msg: "The members array cannot have a length of one. Add an additional member.",
    },
    {
      code: 6015,
      name: "InvalidEscrowProposer",
      msg: "The proposer must match the account stated in the escrow.",
    },
    {
      code: 6016,
      name: "InvalidEscrowRecipient",
      msg: "The recipient nust match the account stated in the escrow.",
    },
    {
      code: 6017,
      name: "InsufficientSignerWithExecutePermission",
      msg: "Require at least one signer to have the execute permission.",
    },
    {
      code: 6018,
      name: "InsufficientSignerWithInitiatePermission",
      msg: "Require at least one signer to have the initiate permission.",
    },
    {
      code: 6019,
      name: "InsufficientSignersWithVotePermission",
      msg: "Require threshold to be lesser than or equal to the number of members with vote permission.",
    },
    {
      code: 6020,
      name: "UnauthorisedToAcceptEscrowOffer",
      msg: "You do not have permission to accept this offer.",
    },
    {
      code: 6021,
      name: "UnauthorisedToModifyBuffer",
      msg: "Only the creator of the transaction buffer have permission to modify the buffer.",
    },
    {
      code: 6022,
      name: "FinalBufferHashMismatch",
      msg: "Final message buffer hash doesnt match the expected hash",
    },
    {
      code: 6023,
      name: "FinalBufferSizeExceeded",
      msg: "Final buffer size cannot exceed 4000 bytes",
    },
    {
      code: 6024,
      name: "FinalBufferSizeMismatch",
      msg: "Final buffer size mismatch",
    },
  ],
  types: [
    {
      name: "ChangeConfigEvent",
      type: {
        kind: "struct",
        fields: [
          {
            name: "create_key",
            type: "pubkey",
          },
          {
            name: "members",
            type: {
              vec: {
                defined: {
                  name: "Member",
                },
              },
            },
          },
          {
            name: "threshold",
            type: "u8",
          },
          {
            name: "metadata",
            type: {
              option: "pubkey",
            },
          },
        ],
      },
    },
    {
      name: "ConfigAction",
      type: {
        kind: "enum",
        variants: [
          {
            name: "SetMembers",
            fields: [
              {
                vec: {
                  defined: {
                    name: "Member",
                  },
                },
              },
            ],
          },
          {
            name: "AddMembers",
            fields: [
              {
                vec: {
                  defined: {
                    name: "Member",
                  },
                },
              },
            ],
          },
          {
            name: "RemoveMembers",
            fields: [
              {
                vec: "pubkey",
              },
            ],
          },
          {
            name: "SetThreshold",
            fields: ["u8"],
          },
          {
            name: "SetMetadata",
            fields: [
              {
                option: "pubkey",
              },
            ],
          },
        ],
      },
    },
    {
      name: "Escrow",
      type: {
        kind: "struct",
        fields: [
          {
            name: "create_key",
            type: "pubkey",
          },
          {
            name: "identifier",
            type: "u64",
          },
          {
            name: "bump",
            type: "u8",
          },
          {
            name: "proposer",
            type: {
              option: "pubkey",
            },
          },
          {
            name: "vault_bump",
            type: {
              option: "u8",
            },
          },
          {
            name: "recipient",
            type: {
              defined: {
                name: "Recipient",
              },
            },
          },
          {
            name: "new_members",
            type: {
              option: {
                vec: {
                  defined: {
                    name: "Member",
                  },
                },
              },
            },
          },
          {
            name: "threshold",
            type: {
              option: "u8",
            },
          },
        ],
      },
    },
    {
      name: "EscrowEvent",
      type: {
        kind: "struct",
        fields: [
          {
            name: "create_key",
            type: "pubkey",
          },
          {
            name: "identifier",
            type: "u64",
          },
          {
            name: "is_pending",
            type: "bool",
          },
          {
            name: "is_rejected",
            type: "bool",
          },
          {
            name: "proposer",
            type: {
              option: "pubkey",
            },
          },
          {
            name: "approver",
            type: {
              option: "pubkey",
            },
          },
          {
            name: "recipient",
            type: {
              defined: {
                name: "Recipient",
              },
            },
          },
          {
            name: "new_members",
            type: {
              option: {
                vec: {
                  defined: {
                    name: "Member",
                  },
                },
              },
            },
          },
          {
            name: "threshold",
            type: {
              option: "u8",
            },
          },
        ],
      },
    },
    {
      name: "Member",
      type: {
        kind: "struct",
        fields: [
          {
            name: "pubkey",
            type: "pubkey",
          },
          {
            name: "permissions",
            type: {
              option: {
                defined: {
                  name: "Permissions",
                },
              },
            },
          },
        ],
      },
    },
    {
      name: "MultiWallet",
      type: {
        kind: "struct",
        fields: [
          {
            name: "create_key",
            type: "pubkey",
          },
          {
            name: "threshold",
            type: "u8",
          },
          {
            name: "bump",
            type: "u8",
          },
          {
            name: "members",
            type: {
              vec: {
                defined: {
                  name: "Member",
                },
              },
            },
          },
          {
            name: "pending_offers",
            type: {
              vec: "pubkey",
            },
          },
          {
            name: "metadata",
            type: {
              option: "pubkey",
            },
          },
        ],
      },
    },
    {
      name: "Permissions",
      docs: ["Bitmask for permissions."],
      type: {
        kind: "struct",
        fields: [
          {
            name: "mask",
            type: "u8",
          },
        ],
      },
    },
    {
      name: "Recipient",
      type: {
        kind: "struct",
        fields: [
          {
            name: "amount",
            type: "u64",
          },
          {
            name: "pubkey",
            type: {
              option: "pubkey",
            },
          },
          {
            name: "mint",
            type: {
              option: "pubkey",
            },
          },
        ],
      },
    },
    {
      name: "TransactionBuffer",
      type: {
        kind: "struct",
        fields: [
          {
            name: "multi_wallet",
            docs: ["The multisig this belongs to."],
            type: "pubkey",
          },
          {
            name: "creator",
            docs: ["Member of the Multisig who created the TransactionBuffer."],
            type: "pubkey",
          },
          {
            name: "rent_payer",
            docs: ["Rent payer for the transaction buffer"],
            type: "pubkey",
          },
          {
            name: "bump",
            docs: ["transaction bump"],
            type: "u8",
          },
          {
            name: "buffer_index",
            docs: ["Index to seed address derivation"],
            type: "u8",
          },
          {
            name: "vault_index",
            docs: ["Vault index of the transaction this buffer belongs to."],
            type: "u8",
          },
          {
            name: "final_buffer_hash",
            docs: ["Hash of the final assembled transaction message."],
            type: {
              array: ["u8", 32],
            },
          },
          {
            name: "final_buffer_size",
            docs: ["The size of the final assembled transaction message."],
            type: "u16",
          },
          {
            name: "buffer",
            docs: ["The buffer of the transaction message."],
            type: "bytes",
          },
        ],
      },
    },
    {
      name: "TransactionBufferCreateArgs",
      type: {
        kind: "struct",
        fields: [
          {
            name: "buffer_index",
            docs: [
              "Index of the buffer account to seed the account derivation",
            ],
            type: "u8",
          },
          {
            name: "vault_index",
            docs: ["Index of the vault this transaction belongs to."],
            type: "u8",
          },
          {
            name: "final_buffer_hash",
            docs: ["Hash of the final assembled transaction message."],
            type: {
              array: ["u8", 32],
            },
          },
          {
            name: "final_buffer_size",
            docs: ["Final size of the buffer."],
            type: "u16",
          },
          {
            name: "buffer",
            docs: ["Initial slice of the buffer."],
            type: "bytes",
          },
        ],
      },
    },
    {
      name: "TransactionBufferExtendArgs",
      type: {
        kind: "struct",
        fields: [
          {
            name: "buffer",
            type: "bytes",
          },
        ],
      },
    },
  ],
};
