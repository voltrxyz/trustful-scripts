import "dotenv/config";
import * as fs from "fs";
import { createKeyPairSignerFromBytes } from "@solana/kit";
import { getAcceptVaultAdminInstruction } from "@voltr/vault-sdk";
import { sendAndConfirmOptimisedTx } from "../utils/helper";
import { vaultAddress } from "../../config/base";

const main = async () => {
  const pendingAdminKpFile = fs.readFileSync(
    process.env.ADMIN_FILE_PATH!,
    "utf-8"
  );
  const pendingAdminSecret = Uint8Array.from(JSON.parse(pendingAdminKpFile));
  const pendingAdminSigner = await createKeyPairSignerFromBytes(
    pendingAdminSecret
  );

  const acceptVaultAdminIx = getAcceptVaultAdminInstruction({
    pendingAdmin: pendingAdminSigner,
    vault: vaultAddress,
  });

  const txSig = await sendAndConfirmOptimisedTx(
    [acceptVaultAdminIx],
    process.env.HELIUS_RPC_URL!,
    pendingAdminSigner
  );

  console.log(`Accepted vault admin with signature: ${txSig}`);
};

main();
