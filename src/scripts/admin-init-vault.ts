import "dotenv/config";
import * as fs from "fs";
import {
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  generateKeyPairSigner,
  type Address,
  type Instruction,
} from "@solana/kit";
import {
  findAddressLookupTablePda,
  getCreateLookupTableInstructionAsync,
} from "@solana-program/address-lookup-table";
import { findAssociatedTokenPda } from "@solana-program/token";
import {
  findVaultAssetIdleAuthPda,
  getInitializeVaultInstructionAsync,
} from "@voltr/vault-sdk";
import {
  sendAndConfirmOptimisedTx,
  setupAddressLookupTable,
} from "../utils/helper";
import {
  assetMintAddress,
  assetTokenProgram,
  useLookupTable,
  vaultParams,
} from "../../config/base";

const main = async () => {
  const payerSecret = Uint8Array.from(
    JSON.parse(fs.readFileSync(process.env.ADMIN_FILE_PATH!, "utf-8"))
  );
  const payerSigner = await createKeyPairSignerFromBytes(payerSecret);

  const managerSecret = Uint8Array.from(
    JSON.parse(fs.readFileSync(process.env.MANAGER_FILE_PATH!, "utf-8"))
  );
  const managerSigner = await createKeyPairSignerFromBytes(managerSecret);

  const vaultSigner = await generateKeyPairSigner();

  const rpc = createSolanaRpc(process.env.HELIUS_RPC_URL!);

  const [vaultAssetIdleAuth] = await findVaultAssetIdleAuthPda({
    vault: vaultSigner.address,
  });
  const [vaultAssetIdleAta] = await findAssociatedTokenPda({
    owner: vaultAssetIdleAuth,
    mint: assetMintAddress,
    tokenProgram: assetTokenProgram,
  });

  const initializeVaultIx = await getInitializeVaultInstructionAsync({
    payer: payerSigner,
    admin: payerSigner.address,
    manager: managerSigner.address,
    vault: vaultSigner,
    vaultAssetMint: assetMintAddress,
    vaultAssetIdleAta,
    assetTokenProgram,
    ...vaultParams.config,
    name: vaultParams.name,
    description: vaultParams.description,
  });

  const txSig0 = await sendAndConfirmOptimisedTx(
    [initializeVaultIx],
    process.env.HELIUS_RPC_URL!,
    payerSigner
  );

  console.log(`Vault initialized with signature: ${txSig0}`);
  console.log(`Update below vault address into config/base.ts`);
  console.log("Vault:", vaultSigner.address);

  if (useLookupTable) {
    const slot = await rpc.getSlot().send();
    const [lookupTable] = await findAddressLookupTablePda({
      authority: payerSigner.address,
      recentSlot: slot,
    });

    const createLUTIx = await getCreateLookupTableInstructionAsync({
      authority: payerSigner.address,
      payer: payerSigner,
      recentSlot: slot,
    });

    const txSig1 = await sendAndConfirmOptimisedTx(
      [createLUTIx],
      process.env.HELIUS_RPC_URL!,
      payerSigner,
      undefined,
      50_000
    );

    console.log(`LUT created with signature: ${txSig1}`);
    console.log(`Update below LUT address into config/base.ts`);
    console.log("LUT:", lookupTable);

    const transactionIxs1: Instruction[] = [];

    const ixAddresses: Address[] = Array.from(
      new Set(
        (initializeVaultIx.accounts ?? []).map((a) => a.address as Address)
      )
    );

    await setupAddressLookupTable(
      rpc,
      payerSigner,
      payerSigner,
      ixAddresses,
      transactionIxs1,
      lookupTable
    );

    const txSig2 = await sendAndConfirmOptimisedTx(
      transactionIxs1,
      process.env.HELIUS_RPC_URL!,
      payerSigner,
      undefined,
      50_000
    );

    console.log(`LUT extended with signature: ${txSig2}`);
  }
};

main();
