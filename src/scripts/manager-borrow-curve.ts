import "dotenv/config";
import * as fs from "fs";
import { PublicKey } from "@solana/web3.js";
import {
  appendRemainingAccounts,
  publicKeyToAddress,
  sendAndConfirmOptimisedTx,
  setupTokenAccount,
} from "../utils/helper";
import { BN } from "@coral-xyz/anchor";
import {
  address,
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  type Instruction,
} from "@solana/kit";
import {
  findStrategyInitReceiptPda,
  findVaultStrategyAuthPda,
  getDepositStrategyInstructionAsync,
} from "@voltr/vault-sdk";
import {
  assetMintAddress,
  vaultAddress,
  assetTokenProgram,
} from "../../config/base";
import { depositStrategyAmount, borrowRateBps } from "../../config/trustful";
import {
  ADAPTOR_PROGRAM_ID,
  DISCRIMINATOR,
  SEEDS,
} from "../constants/trustful";

const borrowCurveStrategy = async () => {
  const payerSecret = Uint8Array.from(
    JSON.parse(fs.readFileSync(process.env.MANAGER_FILE_PATH!, "utf-8"))
  );
  const managerSigner = await createKeyPairSignerFromBytes(payerSecret);
  const rpc = createSolanaRpc(process.env.HELIUS_RPC_URL!);
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

  const transactionIxs: Instruction[] = [];

  await setupTokenAccount(
    rpc,
    managerSigner,
    assetMintAddress,
    vaultStrategyAuth,
    transactionIxs,
    assetTokenProgram
  );

  const managerAssetAta = await setupTokenAccount(
    rpc,
    managerSigner,
    assetMintAddress,
    managerSigner.address,
    transactionIxs,
    assetTokenProgram
  );

  const [strategyInitReceipt] = await findStrategyInitReceiptPda({
    vault: vaultAddress,
    strategy,
  });
  const remainingAccounts = [
    {
      pubkey: new PublicKey(strategyInitReceipt),
      isSigner: false,
      isWritable: false,
    },
    { pubkey: new PublicKey(managerAssetAta), isSigner: false, isWritable: true },
  ];

  const depositStrategyIx = await getDepositStrategyInstructionAsync({
    manager: managerSigner,
    vault: vaultAddress,
    strategy,
    vaultAssetMint: assetMintAddress,
    assetTokenProgram,
    adaptorProgram: address(ADAPTOR_PROGRAM_ID),
    amount: BigInt(new BN(depositStrategyAmount).toString()),
    instructionDiscriminator: new Uint8Array(DISCRIMINATOR.BORROW_CURVE),
    additionalArgs: new Uint8Array(Buffer.from([
    ...new BN(borrowRateBps).toArrayLike(Buffer, "le", 2),
  ])),
  });

  transactionIxs.push(
    appendRemainingAccounts(depositStrategyIx, remainingAccounts)
  );
  const txSig = await sendAndConfirmOptimisedTx(
    transactionIxs,
    process.env.HELIUS_RPC_URL!,
    managerSigner
  );
  console.log("Curve strategy borrowed with signature:", txSig);
};

const main = async () => {
  await borrowCurveStrategy();
};

main();
