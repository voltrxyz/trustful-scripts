import "dotenv/config";
import * as fs from "fs";
import { PublicKey } from "@solana/web3.js";
import {
  address,
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  type Address,
  type Instruction,
} from "@solana/kit";
import {
  getAddressesByLookupTable,
  publicKeyToAddress,
  sendAndConfirmOptimisedTx,
  setupAddressLookupTable,
  setupTokenAccount,
} from "../utils/helper";
import {
  findVaultStrategyAuthPda,
  getInitializeStrategyInstructionAsync,
} from "@voltr/vault-sdk";
import {
  assetMintAddress,
  vaultAddress,
  assetTokenProgram,
  useLookupTable,
  lookupTableAddress,
} from "../../config/base";
import { ADAPTOR_PROGRAM_ID, DISCRIMINATOR, SEEDS } from "../constants/trustful";

const initializeCurveStrategy = async () => {
  const payerSecret = Uint8Array.from(
    JSON.parse(fs.readFileSync(process.env.ADMIN_FILE_PATH!, "utf-8"))
  );
  const payerSigner = await createKeyPairSignerFromBytes(payerSecret);
  const rpc = createSolanaRpc(process.env.HELIUS_RPC_URL!);
  const vaultAssetMintPk = new PublicKey(assetMintAddress);
  const strategy = publicKeyToAddress(
    PublicKey.findProgramAddressSync(
      [Buffer.from(SEEDS.CURVE)],
      new PublicKey(ADAPTOR_PROGRAM_ID)
    )[0]
  );
  const [vaultStrategyAuth] = await findVaultStrategyAuthPda({
    vault: vaultAddress,
    strategy,
  });

  const [withdrawalHoldingAuth] = PublicKey.findProgramAddressSync(
    [new PublicKey(vaultStrategyAuth).toBuffer(), new PublicKey(strategy).toBuffer()],
    new PublicKey(ADAPTOR_PROGRAM_ID)
  );

  const transactionIxs: Instruction[] = [];

  await setupTokenAccount(
    rpc,
    payerSigner,
    assetMintAddress,
    publicKeyToAddress(withdrawalHoldingAuth),
    transactionIxs,
    assetTokenProgram
  );

  await setupTokenAccount(
    rpc,
    payerSigner,
    assetMintAddress,
    vaultStrategyAuth,
    transactionIxs,
    assetTokenProgram
  );

  await setupTokenAccount(
    rpc,
    payerSigner,
    assetMintAddress,
    payerSigner.address,
    transactionIxs,
    assetTokenProgram
  );

  const initializeStrategyIx = await getInitializeStrategyInstructionAsync({
    payer: payerSigner,
    manager: payerSigner,
    vault: vaultAddress,
    strategy,
    adaptorProgram: address(ADAPTOR_PROGRAM_ID),
    instructionDiscriminator: new Uint8Array(DISCRIMINATOR.INITIALIZE_CURVE),
    additionalArgs: null,
  });

  transactionIxs.push(initializeStrategyIx);

  const lookupTables =
    useLookupTable && lookupTableAddress
      ? await getAddressesByLookupTable([lookupTableAddress], rpc)
      : {};

  const txSig = await sendAndConfirmOptimisedTx(
    transactionIxs,
    process.env.HELIUS_RPC_URL!,
    payerSigner,
    lookupTables
  );
  console.log("Curve strategy initialized with signature:", txSig);

  if (useLookupTable && lookupTableAddress) {
    const transactionIxs1: Instruction[] = [];
    const ixAddresses: Address[] = Array.from(
      new Set((initializeStrategyIx.accounts ?? []).map((a) => a.address as Address))
    );

    await setupAddressLookupTable(
      rpc,
      payerSigner,
      payerSigner,
      ixAddresses,
      transactionIxs1,
      lookupTableAddress
    );

    const txSig1 = await sendAndConfirmOptimisedTx(
      transactionIxs1,
      process.env.HELIUS_RPC_URL!,
      payerSigner,
      undefined,
      50_000
    );

    console.log(`LUT updated with signature: ${txSig1}`);
  }
};

const main = async () => {
  await initializeCurveStrategy();
};

main();
