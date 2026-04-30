import "dotenv/config";
import * as fs from "fs";
import {
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  type Address,
  type Instruction,
} from "@solana/kit";
import { getCloseAccountInstruction } from "@solana-program/token";
import { getInstantWithdrawVaultInstructionAsync } from "@voltr/vault-sdk";
import { sendAndConfirmOptimisedTx, setupTokenAccount } from "../utils/helper";
import {
  assetMintAddress,
  assetTokenProgram,
  isWithdrawAll,
  isWithdrawInLp,
  vaultAddress,
  withdrawAmountVault,
} from "../../config/base";

const NATIVE_MINT = "So11111111111111111111111111111111111111112" as Address;

const main = async () => {
  const userSecret = Uint8Array.from(
    JSON.parse(fs.readFileSync(process.env.USER_FILE_PATH!, "utf-8"))
  );
  const userSigner = await createKeyPairSignerFromBytes(userSecret);

  const rpc = createSolanaRpc(process.env.HELIUS_RPC_URL!);

  const ixs: Instruction[] = [];
  const userAssetAta = await setupTokenAccount(
    rpc,
    userSigner,
    assetMintAddress,
    userSigner.address,
    ixs,
    assetTokenProgram
  );

  const instantWithdrawVaultIx =
    await getInstantWithdrawVaultInstructionAsync({
      userTransferAuthority: userSigner,
      vault: vaultAddress,
      vaultAssetMint: assetMintAddress,
      assetTokenProgram,
      amount: withdrawAmountVault,
      isAmountInLp: isWithdrawInLp,
      isWithdrawAll,
    });
  ixs.push(instantWithdrawVaultIx);

  if (assetMintAddress === NATIVE_MINT) {
    ixs.push(
      getCloseAccountInstruction({
        account: userAssetAta,
        destination: userSigner.address,
        owner: userSigner,
      })
    );
  }

  const txSig = await sendAndConfirmOptimisedTx(
    ixs,
    process.env.HELIUS_RPC_URL!,
    userSigner
  );
  console.log("Instant Withdraw Vault Tx Sig:", txSig);
};

main();
