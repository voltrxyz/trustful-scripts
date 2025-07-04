/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/voltr_trustful_adaptor.json`.
 */
export type VoltrTrustfulAdaptor = {
  "address": "3pnpK9nrs1R65eMV1wqCXkDkhSgN18xb1G5pgYPwoZjJ",
  "metadata": {
    "name": "voltrTrustfulAdaptor",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "borrowCurve",
      "discriminator": [
        90,
        14,
        246,
        231,
        99,
        14,
        124,
        198
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  95,
                  115,
                  116,
                  114,
                  97,
                  116,
                  101,
                  103,
                  121,
                  95,
                  97,
                  117,
                  116,
                  104
                ]
              },
              {
                "kind": "account",
                "path": "strategyInitReceipt"
              },
              {
                "kind": "account",
                "path": "strategyInitReceipt"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                13,
                180,
                88,
                140,
                0,
                40,
                46,
                57,
                6,
                188,
                144,
                247,
                144,
                212,
                112,
                104,
                17,
                232,
                204,
                36,
                178,
                156,
                202,
                153,
                27,
                77,
                112,
                219,
                58,
                165,
                141,
                57
              ]
            }
          }
        },
        {
          "name": "strategy",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  117,
                  114,
                  118,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "vaultAssetMint",
          "writable": true
        },
        {
          "name": "authorityTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "vaultAssetMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
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
              ]
            }
          }
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "strategyInitReceipt"
        },
        {
          "name": "destinationTokenAccount",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "params",
          "type": {
            "option": {
              "defined": {
                "name": "borrowCurveParams"
              }
            }
          }
        }
      ],
      "returns": "u64"
    },
    {
      "name": "depositArbitrary",
      "discriminator": [
        117,
        73,
        131,
        148,
        12,
        99,
        191,
        180
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "strategy"
        },
        {
          "name": "vaultAssetMint",
          "writable": true
        },
        {
          "name": "authorityTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "vaultAssetMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
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
              ]
            }
          }
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "destinationTokenAccount",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "params",
          "type": {
            "option": {
              "defined": {
                "name": "depositArbitraryParams"
              }
            }
          }
        }
      ],
      "returns": "u64"
    },
    {
      "name": "initializeArbitrary",
      "discriminator": [
        251,
        45,
        95,
        238,
        92,
        108,
        238,
        129
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "strategy"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initializeCurve",
      "discriminator": [
        170,
        84,
        186,
        253,
        131,
        149,
        95,
        213
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "strategy",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  117,
                  114,
                  118,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "repayCurve",
      "discriminator": [
        36,
        81,
        59,
        35,
        131,
        18,
        177,
        97
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  95,
                  115,
                  116,
                  114,
                  97,
                  116,
                  101,
                  103,
                  121,
                  95,
                  97,
                  117,
                  116,
                  104
                ]
              },
              {
                "kind": "account",
                "path": "strategyInitReceipt"
              },
              {
                "kind": "account",
                "path": "strategyInitReceipt"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                13,
                180,
                88,
                140,
                0,
                40,
                46,
                57,
                6,
                188,
                144,
                247,
                144,
                212,
                112,
                104,
                17,
                232,
                204,
                36,
                178,
                156,
                202,
                153,
                27,
                77,
                112,
                219,
                58,
                165,
                141,
                57
              ]
            }
          }
        },
        {
          "name": "strategy",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  117,
                  114,
                  118,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "vaultAssetMint",
          "writable": true
        },
        {
          "name": "authorityTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "vaultAssetMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
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
              ]
            }
          }
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "strategyInitReceipt"
        },
        {
          "name": "sourceAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "account",
                "path": "strategy"
              }
            ]
          }
        },
        {
          "name": "sourceTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "sourceAuthority"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "vaultAssetMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
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
              ]
            }
          }
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "params",
          "type": {
            "option": {
              "defined": {
                "name": "repayCurveParams"
              }
            }
          }
        }
      ],
      "returns": "u64"
    },
    {
      "name": "transferCurve",
      "discriminator": [
        233,
        97,
        132,
        132,
        247,
        45,
        78,
        78
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "authority",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  95,
                  115,
                  116,
                  114,
                  97,
                  116,
                  101,
                  103,
                  121,
                  95,
                  97,
                  117,
                  116,
                  104
                ]
              },
              {
                "kind": "account",
                "path": "strategyInitReceipt"
              },
              {
                "kind": "account",
                "path": "strategyInitReceipt"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                13,
                180,
                88,
                140,
                0,
                40,
                46,
                57,
                6,
                188,
                144,
                247,
                144,
                212,
                112,
                104,
                17,
                232,
                204,
                36,
                178,
                156,
                202,
                153,
                27,
                77,
                112,
                219,
                58,
                165,
                141,
                57
              ]
            }
          }
        },
        {
          "name": "strategy",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  117,
                  114,
                  118,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "vaultAssetMint",
          "writable": true
        },
        {
          "name": "userTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "vaultAssetMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
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
              ]
            }
          }
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "strategyInitReceipt"
        },
        {
          "name": "sourceAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "account",
                "path": "strategy"
              }
            ]
          }
        },
        {
          "name": "sourceTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "sourceAuthority"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "vaultAssetMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
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
              ]
            }
          }
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "borrowRateBps",
          "type": "u16"
        }
      ]
    },
    {
      "name": "withdrawArbitrary",
      "discriminator": [
        35,
        58,
        217,
        109,
        98,
        184,
        147,
        14
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "strategy"
        },
        {
          "name": "vaultAssetMint",
          "writable": true
        },
        {
          "name": "authorityTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "vaultAssetMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
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
              ]
            }
          }
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "sourceAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "account",
                "path": "strategy"
              }
            ]
          }
        },
        {
          "name": "sourceTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "sourceAuthority"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "vaultAssetMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
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
              ]
            }
          }
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "params",
          "type": {
            "option": {
              "defined": {
                "name": "withdrawArbitraryParams"
              }
            }
          }
        }
      ],
      "returns": "u64"
    }
  ],
  "accounts": [
    {
      "name": "strategyInitReceipt",
      "discriminator": [
        51,
        8,
        192,
        253,
        115,
        78,
        112,
        214
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidAmount",
      "msg": "Invalid amount provided."
    },
    {
      "code": 6001,
      "name": "mathOverflow",
      "msg": "Math overflow."
    },
    {
      "code": 6002,
      "name": "invalidAuthority",
      "msg": "Invalid authority."
    }
  ],
  "types": [
    {
      "name": "borrowCurveParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "placeholderVecLen",
            "type": "u32"
          },
          {
            "name": "borrowRateBps",
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "depositArbitraryParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "placeholderVecLen",
            "type": "u32"
          },
          {
            "name": "endValue",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "repayCurveParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "placeholderVecLen",
            "type": "u32"
          },
          {
            "name": "borrowRateBps",
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "strategyInitReceipt",
      "serialization": "bytemuckunsafe",
      "repr": {
        "kind": "c"
      },
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "docs": [
              "The vault associated with this strategy."
            ],
            "type": "pubkey"
          },
          {
            "name": "strategy",
            "docs": [
              "The strategy address."
            ],
            "type": "pubkey"
          },
          {
            "name": "adaptorProgram",
            "docs": [
              "The adaptor program address."
            ],
            "type": "pubkey"
          },
          {
            "name": "positionValue",
            "docs": [
              "The position value."
            ],
            "type": "u64"
          },
          {
            "name": "lastUpdatedTs",
            "docs": [
              "The last updated timestamp."
            ],
            "type": "u64"
          },
          {
            "name": "version",
            "docs": [
              "A version number (1 byte)."
            ],
            "type": "u8"
          },
          {
            "name": "bump",
            "docs": [
              "The bump for the strategy init receipt."
            ],
            "type": "u8"
          },
          {
            "name": "vaultStrategyAuthBump",
            "docs": [
              "The bump for the vault strategy auth."
            ],
            "type": "u8"
          },
          {
            "name": "padding0",
            "docs": [
              "6 bytes of padding to align future 8-byte fields on 8-byte boundaries."
            ],
            "type": {
              "array": [
                "u8",
                5
              ]
            }
          },
          {
            "name": "reserved",
            "docs": [
              "Reserved space for future fields"
            ],
            "type": {
              "array": [
                "u8",
                64
              ]
            }
          }
        ]
      }
    },
    {
      "name": "withdrawArbitraryParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "placeholderVecLen",
            "type": "u32"
          },
          {
            "name": "endValue",
            "type": "u64"
          }
        ]
      }
    }
  ]
};
