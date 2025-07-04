import "dotenv/config";
import * as fs from "fs";
import {
  Connection,
  Keypair,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  getAddressLookupTableAccounts,
  sendAndConfirmOptimisedTx,
  setupTokenAccount,
} from "../utils/helper";
import { BN } from "@coral-xyz/anchor";
import { VoltrClient } from "@voltr/vault-sdk";
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

const borrowCurveStrategy = async (
  connection: Connection,
  managerKp: Keypair,
  vault: PublicKey,
  vaultAssetMint: PublicKey,
  assetTokenProgram: PublicKey,
  adaptorProgram: PublicKey,
  strategySeedString: string,
  instructionDiscriminator: number[],
  depositAmount: BN,
  borrowRateBps: number,
  lookupTableAddresses: string[] = []
) => {
  const vc = new VoltrClient(connection);

  const [strategy] = PublicKey.findProgramAddressSync(
    [Buffer.from(strategySeedString)],
    new PublicKey(adaptorProgram)
  );

  const { vaultStrategyAuth } = vc.findVaultStrategyAddresses(vault, strategy);

  let transactionIxs: TransactionInstruction[] = [];

  const _vaultStrategyAssetAta = await setupTokenAccount(
    connection,
    managerKp.publicKey,
    vaultAssetMint,
    vaultStrategyAuth,
    transactionIxs,
    assetTokenProgram
  );

  const managerAssetAta = await setupTokenAccount(
    connection,
    managerKp.publicKey,
    vaultAssetMint,
    managerKp.publicKey,
    transactionIxs,
    assetTokenProgram
  );

  const strategyInitReceipt = vc.findStrategyInitReceipt(vault, strategy);

  // Prepare the remaining accounts
  const remainingAccounts = [
    {
      pubkey: strategyInitReceipt,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: managerAssetAta, isSigner: false, isWritable: true },
  ];

  let additionalArgs = Buffer.from([
    ...new BN(borrowRateBps).toArrayLike(Buffer, "le", 2),
  ]);

  const createDepositStrategyIx = await vc.createDepositStrategyIx(
    {
      instructionDiscriminator: Buffer.from(instructionDiscriminator),
      depositAmount,
      additionalArgs,
    },
    {
      manager: managerKp.publicKey,
      vault,
      vaultAssetMint,
      assetTokenProgram,
      strategy,
      remainingAccounts,
      adaptorProgram,
    }
  );

  transactionIxs.push(createDepositStrategyIx);

  const lookupTableAccounts = lookupTableAddresses
    ? await getAddressLookupTableAccounts(lookupTableAddresses, connection)
    : [];

  const txSig = await sendAndConfirmOptimisedTx(
    transactionIxs,
    process.env.HELIUS_RPC_URL!,
    managerKp,
    [],
    lookupTableAccounts
  );
  console.log("Curve strategy borrowed with signature:", txSig);
};

const main = async () => {
  const payerKpFile = fs.readFileSync(process.env.MANAGER_FILE_PATH!, "utf-8");
  const payerKpData = JSON.parse(payerKpFile);
  const payerSecret = Uint8Array.from(payerKpData);
  const payerKp = Keypair.fromSecretKey(payerSecret);

  await borrowCurveStrategy(
    new Connection(process.env.HELIUS_RPC_URL!),
    payerKp,
    new PublicKey(vaultAddress),
    new PublicKey(assetMintAddress),
    new PublicKey(assetTokenProgram),
    new PublicKey(ADAPTOR_PROGRAM_ID),
    SEEDS.CURVE,
    DISCRIMINATOR.BORROW_CURVE,
    new BN(depositStrategyAmount),
    borrowRateBps
  );
};

main();
