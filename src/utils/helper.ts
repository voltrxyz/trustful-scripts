import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  AddressLookupTableAccount,
  AddressLookupTableProgram,
  ComputeBudgetProgram,
  Connection,
  Keypair,
  PublicKey,
  TransactionConfirmationStrategy,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

export const sendAndConfirmOptimisedTx = async (
  instructions: TransactionInstruction[],
  heliusRpcUrl: string,
  payerKp: Keypair,
  signers: Keypair[] = [],
  addressLookupTableAccounts: AddressLookupTableAccount[] = [],
  computeUnitLimit: number | null = null
) => {
  const connection = new Connection(heliusRpcUrl);
  let optimalCUs: number;
  if (computeUnitLimit) {
    optimalCUs = computeUnitLimit;
  } else {
    const testInstructions = [
      ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 }),
      ...instructions,
    ];

    const cuTransaction = new VersionedTransaction(
      new TransactionMessage({
        instructions: testInstructions,
        payerKey: payerKp.publicKey,
        recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
      }).compileToV0Message(addressLookupTableAccounts)
    );
    cuTransaction.sign([payerKp, ...signers]);

    const rpcResponse = await connection.simulateTransaction(cuTransaction, {
      replaceRecentBlockhash: true,
      sigVerify: false,
    });

    const requiredCUs = rpcResponse.value.unitsConsumed;

    if (!requiredCUs) {
      throw new Error("Failed to get required CUs");
    }

    optimalCUs = requiredCUs * 1.1;
  }

  const computeUnitIx = ComputeBudgetProgram.setComputeUnitLimit({
    units: optimalCUs,
  });

  instructions.push(computeUnitIx);

  const feTransaction = new VersionedTransaction(
    new TransactionMessage({
      instructions,
      payerKey: payerKp.publicKey,
      recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
    }).compileToV0Message(addressLookupTableAccounts)
  );
  feTransaction.sign([payerKp, ...signers]);

  const response = await fetch(heliusRpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "1",
      method: "getPriorityFeeEstimate",
      params: [
        {
          transaction: bs58.encode(feTransaction.serialize()), // Pass the serialized transaction in Base58
          options: { priorityLevel: "High" },
        },
      ],
    }),
  });
  const data = await response.json();
  const feeEstimate = data.result;

  if (!feeEstimate) {
    throw new Error("Failed to get fee estimate");
  }

  const computePriceIx = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: feeEstimate.priorityFeeEstimate,
  });

  instructions.push(computePriceIx);

  const transaction = new VersionedTransaction(
    new TransactionMessage({
      instructions,
      payerKey: payerKp.publicKey,
      recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
    }).compileToV0Message(addressLookupTableAccounts)
  );
  transaction.sign([payerKp, ...signers]);

  const txSig = await connection.sendTransaction(transaction, {
    skipPreflight: false,
    preflightCommitment: "confirmed",
    maxRetries: 5,
  });

  const confirmationStrategy: TransactionConfirmationStrategy = {
    signature: txSig,
    blockhash: (await connection.getLatestBlockhash()).blockhash,
    lastValidBlockHeight: (await connection.getLatestBlockhash())
      .lastValidBlockHeight,
  };

  await connection.confirmTransaction(confirmationStrategy, "confirmed");

  return txSig;
};

export const setupTokenAccount = async (
  connection: Connection,
  payer: PublicKey,
  mint: PublicKey,
  owner: PublicKey,
  txIxs: TransactionInstruction[],
  programId: PublicKey = TOKEN_PROGRAM_ID
) => {
  const tokenAccount = getAssociatedTokenAddressSync(
    mint,
    owner,
    true,
    programId
  );

  const tokenAccountInfo = await connection.getAccountInfo(tokenAccount);

  if (!tokenAccountInfo) {
    const createTokenAccountIx =
      createAssociatedTokenAccountIdempotentInstruction(
        payer,
        tokenAccount,
        owner,
        mint,
        programId
      );
    txIxs.push(createTokenAccountIx);
  }

  return tokenAccount;
};

export const setupAddressLookupTable = async (
  connection: Connection,
  payer: PublicKey,
  authority: PublicKey,
  addresses: string[],
  txIxs: TransactionInstruction[],
  lookupTable: PublicKey
) => {
  const lutAddressesStr: string[] = [];
  const lutData = await connection.getAddressLookupTable(lookupTable);
  lutAddressesStr.push(
    ...(lutData.value?.state.addresses.map((a) => a.toBase58()) ?? [])
  );

  const filteredUniqueIxsPubkeys = addresses
    .filter((pubkey) => !lutAddressesStr.includes(pubkey))
    .map((pubkey) => new PublicKey(pubkey));

  if (filteredUniqueIxsPubkeys.length > 0) {
    txIxs.push(
      AddressLookupTableProgram.extendLookupTable({
        lookupTable,
        authority,
        addresses: filteredUniqueIxsPubkeys,
        payer,
      })
    );
  }
  return lookupTable;
};

export const getAddressLookupTableAccounts = async (
  keys: string[],
  connection: Connection
): Promise<AddressLookupTableAccount[]> => {
  const addressLookupTableAccountInfos =
    await connection.getMultipleAccountsInfo(
      keys.map((key) => new PublicKey(key))
    );

  return addressLookupTableAccountInfos.reduce((acc, accountInfo, index) => {
    const addressLookupTableAddress = keys[index];
    if (accountInfo) {
      const addressLookupTableAccount = new AddressLookupTableAccount({
        key: new PublicKey(addressLookupTableAddress),
        state: AddressLookupTableAccount.deserialize(accountInfo.data),
      });
      acc.push(addressLookupTableAccount);
    }
    return acc;
  }, new Array<AddressLookupTableAccount>());
};
