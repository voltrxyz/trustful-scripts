// NOTE: WILL ONLY SUCCEED IF THERE IS A REQUEST WITHDRAWAL OUTSTANDING
import "dotenv/config";
import * as fs from "fs";
import { createKeyPairSignerFromBytes } from "@solana/kit";
import { getCancelRequestWithdrawVaultInstructionAsync } from "@voltr/vault-sdk";
import { sendAndConfirmOptimisedTx } from "../utils/helper";
import { vaultAddress } from "../../config/base";

const main = async () => {
  const userSecret = Uint8Array.from(
    JSON.parse(fs.readFileSync(process.env.USER_FILE_PATH!, "utf-8"))
  );
  const userSigner = await createKeyPairSignerFromBytes(userSecret);

  const cancelRequestWithdrawVaultIx =
    await getCancelRequestWithdrawVaultInstructionAsync({
      userTransferAuthority: userSigner,
      vault: vaultAddress,
    });

  const txSig = await sendAndConfirmOptimisedTx(
    [cancelRequestWithdrawVaultIx],
    process.env.HELIUS_RPC_URL!,
    userSigner
  );
  console.log("Cancel Request Withdraw Vault Tx Sig:", txSig);
};

main();
