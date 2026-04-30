import "dotenv/config";
import * as fs from "fs";
import {
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  type Address,
  type Instruction,
} from "@solana/kit";
import {
  findAssociatedTokenPda,
  getCloseAccountInstruction,
  getCreateAssociatedTokenIdempotentInstructionAsync,
  getSyncNativeInstruction,
  TOKEN_PROGRAM_ADDRESS,
} from "@solana-program/token";
import { getTransferSolInstruction } from "@solana-program/system";
import {
  findVaultLpMintPda,
  getDepositVaultInstructionAsync,
} from "@voltr/vault-sdk";
import { sendAndConfirmOptimisedTx, setupTokenAccount } from "../utils/helper";
import {
  assetMintAddress,
  assetTokenProgram,
  depositAmountVault,
  vaultAddress,
} from "../../config/base";

const NATIVE_MINT = "So11111111111111111111111111111111111111112" as Address;

const main = async () => {
  const userSecret = Uint8Array.from(
    JSON.parse(fs.readFileSync(process.env.USER_FILE_PATH!, "utf-8"))
  );
  const userSigner = await createKeyPairSignerFromBytes(userSecret);

  const rpc = createSolanaRpc(process.env.HELIUS_RPC_URL!);

  const ixs: Instruction[] = [];

  const [userAssetAta] = await findAssociatedTokenPda({
    owner: userSigner.address,
    mint: assetMintAddress,
    tokenProgram: assetTokenProgram,
  });

  if (assetMintAddress === NATIVE_MINT) {
    ixs.push(
      await getCreateAssociatedTokenIdempotentInstructionAsync({
        payer: userSigner,
        owner: userSigner.address,
        mint: NATIVE_MINT,
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
      })
    );
    ixs.push(
      getTransferSolInstruction({
        source: userSigner,
        destination: userAssetAta,
        amount: depositAmountVault,
      })
    );
    ixs.push(getSyncNativeInstruction({ account: userAssetAta }));
  }

  const [vaultLpMint] = await findVaultLpMintPda({ vault: vaultAddress });
  await setupTokenAccount(
    rpc,
    userSigner,
    vaultLpMint,
    userSigner.address,
    ixs
  );

  const depositVaultIx = await getDepositVaultInstructionAsync({
    userTransferAuthority: userSigner,
    vault: vaultAddress,
    vaultAssetMint: assetMintAddress,
    assetTokenProgram,
    amount: depositAmountVault,
  });
  ixs.push(depositVaultIx);

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
  console.log("Deposit Vault Tx Sig:", txSig);
};

main();
