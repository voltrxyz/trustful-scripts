import "dotenv/config";
import * as fs from "fs";
import { address, createKeyPairSignerFromBytes } from "@solana/kit";
import { getRemoveAdaptorInstructionAsync } from "@voltr/vault-sdk";
import { sendAndConfirmOptimisedTx } from "../utils/helper";
import { vaultAddress } from "../../config/base";
import { ADAPTOR_PROGRAM_ID } from "../constants/trustful";

const removeAdaptorHandler = async () => {
  const payerSecret = Uint8Array.from(
    JSON.parse(fs.readFileSync(process.env.ADMIN_FILE_PATH!, "utf-8"))
  );
  const payerSigner = await createKeyPairSignerFromBytes(payerSecret);

  const removeAdaptorIx = await getRemoveAdaptorInstructionAsync({
    admin: payerSigner,
    vault: vaultAddress,
    adaptorProgram: address(ADAPTOR_PROGRAM_ID),
  });

  const txSig0 = await sendAndConfirmOptimisedTx(
    [removeAdaptorIx],
    process.env.HELIUS_RPC_URL!,
    payerSigner
  );
  console.log(`Adaptor removed from vault with signature: ${txSig0}`);
};

const main = async () => {
  await removeAdaptorHandler();
};

main();
