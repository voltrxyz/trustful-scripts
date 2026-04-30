import "dotenv/config";
import * as fs from "fs";
import { createKeyPairSignerFromBytes } from "@solana/kit";
import {
  findLpMetadataPda,
  getCreateLpMetadataInstructionAsync,
} from "@voltr/vault-sdk";
import { sendAndConfirmOptimisedTx } from "../utils/helper";
import { lpTokenMetadata, vaultAddress } from "../../config/base";

const main = async () => {
  const adminSecret = Uint8Array.from(
    JSON.parse(fs.readFileSync(process.env.ADMIN_FILE_PATH!, "utf-8"))
  );
  const adminSigner = await createKeyPairSignerFromBytes(adminSecret);

  const [metadataAccount] = await findLpMetadataPda({ vault: vaultAddress });

  const createLpMetadataIx = await getCreateLpMetadataInstructionAsync({
    payer: adminSigner,
    admin: adminSigner,
    vault: vaultAddress,
    metadataAccount,
    name: lpTokenMetadata.name,
    symbol: lpTokenMetadata.symbol,
    uri: lpTokenMetadata.uri,
  });

  const txSig = await sendAndConfirmOptimisedTx(
    [createLpMetadataIx],
    process.env.HELIUS_RPC_URL!,
    adminSigner
  );

  console.log(`Lp token metadata created with signature: ${txSig}`);
};

main();
