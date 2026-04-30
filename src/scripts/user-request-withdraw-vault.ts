// NOTE: ONLY ONE REQUEST WITHDRAWAL CAN BE MADE AT A TIME, WILL FAIL IF ANOTHER REQUEST WITHDRAWAL IS PENDING/NOT CLAIMED
import "dotenv/config";
import * as fs from "fs";
import {
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  type Instruction,
} from "@solana/kit";
import {
  findRequestWithdrawVaultReceiptPda,
  findVaultLpMintPda,
  getRequestWithdrawVaultInstructionAsync,
} from "@voltr/vault-sdk";
import { sendAndConfirmOptimisedTx, setupTokenAccount } from "../utils/helper";
import {
  isWithdrawAll,
  isWithdrawInLp,
  vaultAddress,
  withdrawAmountVault,
} from "../../config/base";

const main = async () => {
  const userSecret = Uint8Array.from(
    JSON.parse(fs.readFileSync(process.env.USER_FILE_PATH!, "utf-8"))
  );
  const userSigner = await createKeyPairSignerFromBytes(userSecret);

  const rpc = createSolanaRpc(process.env.HELIUS_RPC_URL!);

  const [vaultLpMint] = await findVaultLpMintPda({ vault: vaultAddress });
  const [requestWithdrawVaultReceipt] =
    await findRequestWithdrawVaultReceiptPda({
      vault: vaultAddress,
      userTransferAuthority: userSigner.address,
    });

  const ixs: Instruction[] = [];
  await setupTokenAccount(
    rpc,
    userSigner,
    vaultLpMint,
    requestWithdrawVaultReceipt,
    ixs
  );

  const requestWithdrawVaultIx = await getRequestWithdrawVaultInstructionAsync({
    payer: userSigner,
    userTransferAuthority: userSigner,
    vault: vaultAddress,
    amount: withdrawAmountVault,
    isAmountInLp: isWithdrawInLp,
    isWithdrawAll,
  });
  ixs.push(requestWithdrawVaultIx);

  const txSig = await sendAndConfirmOptimisedTx(
    ixs,
    process.env.HELIUS_RPC_URL!,
    userSigner
  );
  console.log("Request Withdraw Vault Tx Sig:", txSig);
};

main();
