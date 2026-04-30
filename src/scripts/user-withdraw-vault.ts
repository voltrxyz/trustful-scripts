// NOTE: THIS ASSUMES THE USER HAS REQUESTED A WITHDRAWAL, THROWS ERROR IF NOT
import "dotenv/config";
import * as fs from "fs";
import {
  createKeyPairSignerFromBytes,
  type Address,
  type Instruction,
} from "@solana/kit";
import {
  findAssociatedTokenPda,
  getCloseAccountInstruction,
  getCreateAssociatedTokenIdempotentInstructionAsync,
} from "@solana-program/token";
import { getWithdrawVaultInstructionAsync } from "@voltr/vault-sdk";
import { sendAndConfirmOptimisedTx } from "../utils/helper";
import {
  assetMintAddress,
  assetTokenProgram,
  vaultAddress,
} from "../../config/base";

const NATIVE_MINT = "So11111111111111111111111111111111111111112" as Address;

const main = async () => {
  const userSecret = Uint8Array.from(
    JSON.parse(fs.readFileSync(process.env.USER_FILE_PATH!, "utf-8"))
  );
  const userSigner = await createKeyPairSignerFromBytes(userSecret);

  const ixs: Instruction[] = [];
  const [userAssetAta] = await findAssociatedTokenPda({
    owner: userSigner.address,
    mint: assetMintAddress,
    tokenProgram: assetTokenProgram,
  });
  ixs.push(
    await getCreateAssociatedTokenIdempotentInstructionAsync({
      payer: userSigner,
      owner: userSigner.address,
      mint: assetMintAddress,
      tokenProgram: assetTokenProgram,
    })
  );

  const withdrawVaultIx = await getWithdrawVaultInstructionAsync({
    userTransferAuthority: userSigner,
    vault: vaultAddress,
    vaultAssetMint: assetMintAddress,
    assetTokenProgram,
  });
  ixs.push(withdrawVaultIx);

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
  console.log("Withdraw Vault Tx Sig:", txSig);
};

main();
