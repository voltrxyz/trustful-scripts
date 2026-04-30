import {
  appendTransactionMessageInstructions,
  compressTransactionMessageUsingAddressLookupTables,
  createSolanaRpc,
  createTransactionMessage,
  getBase64EncodedWireTransaction,
  getSignatureFromTransaction,
  pipe,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  type Address,
  type AddressesByLookupTableAddress,
  type Blockhash,
  type Instruction,
  type KeyPairSigner,
  type Signature,
  type TransactionSigner,
} from "@solana/kit";
import {
  getSetComputeUnitLimitInstruction,
  getSetComputeUnitPriceInstruction,
} from "@solana-program/compute-budget";
import {
  ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
  TOKEN_PROGRAM_ADDRESS,
  findAssociatedTokenPda,
  getCreateAssociatedTokenIdempotentInstructionAsync,
} from "@solana-program/token";
import {
  fetchAddressLookupTable,
  getExtendLookupTableInstruction,
} from "@solana-program/address-lookup-table";

type SolanaRpc = ReturnType<typeof createSolanaRpc>;

export const sendAndConfirmOptimisedTx = async (
  instructions: Instruction[],
  heliusRpcUrl: string,
  payerSigner: KeyPairSigner,
  addressesByLookupTable: AddressesByLookupTableAddress = {},
  computeUnitLimit: number | null = null
): Promise<Signature> => {
  const rpc = createSolanaRpc(heliusRpcUrl);

  const buildMessage = async (
    ixs: Instruction[],
    blockhash: { blockhash: Blockhash; lastValidBlockHeight: bigint }
  ) => {
    let m = pipe(
      createTransactionMessage({ version: 0 }),
      (m) => setTransactionMessageFeePayerSigner(payerSigner, m),
      (m) => setTransactionMessageLifetimeUsingBlockhash(blockhash, m),
      (m) => appendTransactionMessageInstructions(ixs, m)
    );
    if (Object.keys(addressesByLookupTable).length > 0) {
      m = compressTransactionMessageUsingAddressLookupTables(
        m,
        addressesByLookupTable
      ) as typeof m;
    }
    return m;
  };

  let optimalCUs: number;
  if (computeUnitLimit) {
    optimalCUs = computeUnitLimit;
  } else {
    const { value: latest } = await rpc.getLatestBlockhash().send();
    const simIxs: Instruction[] = [
      getSetComputeUnitLimitInstruction({ units: 1_400_000 }),
      ...instructions,
    ];
    const simMessage = await buildMessage(simIxs, latest);
    const simSigned = await signTransactionMessageWithSigners(simMessage);
    const wireSim = getBase64EncodedWireTransaction(simSigned);

    const sim = await rpc
      .simulateTransaction(wireSim, {
        encoding: "base64",
        replaceRecentBlockhash: true,
        sigVerify: false,
      })
      .send();

    const requiredCUs = sim.value.unitsConsumed;
    if (requiredCUs == null) {
      throw new Error("Failed to get required CUs");
    }
    optimalCUs = Math.ceil(Number(requiredCUs) * 1.1);
  }

  const cuLimitIx = getSetComputeUnitLimitInstruction({ units: optimalCUs });

  const { value: feeBlockhash } = await rpc.getLatestBlockhash().send();
  const feeEstMessage = await buildMessage(
    [...instructions, cuLimitIx],
    feeBlockhash
  );
  const feeEstSigned = await signTransactionMessageWithSigners(feeEstMessage);
  const wireFeeEst = getBase64EncodedWireTransaction(feeEstSigned);

  const feeEstResp = await fetch(heliusRpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "1",
      method: "getPriorityFeeEstimate",
      params: [
        {
          transaction: wireFeeEst,
          options: {
            priorityLevel: "High",
            transactionEncoding: "base64",
          },
        },
      ],
    }),
  });
  const feeEstData = await feeEstResp.json();
  const feeEstimate = feeEstData.result;
  if (!feeEstimate) {
    throw new Error("Failed to get fee estimate");
  }

  const cuPriceIx = getSetComputeUnitPriceInstruction({
    microLamports: BigInt(Math.ceil(feeEstimate.priorityFeeEstimate)),
  });

  const { value: sendBlockhash } = await rpc.getLatestBlockhash().send();
  const finalMessage = await buildMessage(
    [...instructions, cuLimitIx, cuPriceIx],
    sendBlockhash
  );
  const signed = await signTransactionMessageWithSigners(finalMessage);
  const wire = getBase64EncodedWireTransaction(signed);
  const signature = getSignatureFromTransaction(signed);

  await rpc
    .sendTransaction(wire, {
      encoding: "base64",
      skipPreflight: false,
      preflightCommitment: "confirmed",
      maxRetries: 5n,
    })
    .send();

  await confirmSignature(rpc, signature, sendBlockhash.lastValidBlockHeight);

  return signature;
};

const confirmSignature = async (
  rpc: SolanaRpc,
  signature: Signature,
  lastValidBlockHeight: bigint
): Promise<void> => {
  while (true) {
    const { value } = await rpc
      .getSignatureStatuses([signature], { searchTransactionHistory: true })
      .send();
    const status = value[0];
    if (
      status?.confirmationStatus === "confirmed" ||
      status?.confirmationStatus === "finalized"
    ) {
      if (status.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`);
      }
      return;
    }
    const blockHeight = await rpc.getBlockHeight().send();
    if (blockHeight > lastValidBlockHeight) {
      throw new Error(
        `Transaction expired: ${signature} not confirmed before lastValidBlockHeight ${lastValidBlockHeight}`
      );
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
};

export const setupTokenAccount = async (
  rpc: SolanaRpc,
  payerSigner: TransactionSigner,
  mint: Address,
  owner: Address,
  txIxs: Instruction[],
  programAddress: Address = TOKEN_PROGRAM_ADDRESS
): Promise<Address> => {
  const [ata] = await findAssociatedTokenPda({
    owner,
    mint,
    tokenProgram: programAddress,
  });

  const accountInfo = await rpc.getAccountInfo(ata).send();

  if (!accountInfo.value) {
    const ix = await getCreateAssociatedTokenIdempotentInstructionAsync({
      payer: payerSigner,
      owner,
      mint,
      tokenProgram: programAddress,
    });
    txIxs.push(ix);
  }

  return ata;
};

export const setupAddressLookupTable = async (
  rpc: SolanaRpc,
  payerSigner: TransactionSigner,
  authoritySigner: TransactionSigner,
  addresses: Address[],
  txIxs: Instruction[],
  lookupTable: Address
): Promise<Address> => {
  const lutAccount = await fetchAddressLookupTable(rpc, lookupTable);
  const existing = new Set<string>(lutAccount.data.addresses);
  const filtered = addresses.filter((a) => !existing.has(a));

  if (filtered.length > 0) {
    txIxs.push(
      getExtendLookupTableInstruction({
        address: lookupTable,
        authority: authoritySigner,
        payer: payerSigner,
        addresses: filtered,
      })
    );
  }
  return lookupTable;
};

export const getAddressesByLookupTable = async (
  keys: Address[],
  rpc: SolanaRpc
): Promise<AddressesByLookupTableAddress> => {
  const result: AddressesByLookupTableAddress = {};
  for (const key of keys) {
    const lut = await fetchAddressLookupTable(rpc, key);
    result[key] = [...lut.data.addresses];
  }
  return result;
};

export { ASSOCIATED_TOKEN_PROGRAM_ADDRESS, TOKEN_PROGRAM_ADDRESS };
