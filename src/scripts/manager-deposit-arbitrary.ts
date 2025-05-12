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
import {
  positionValueAfterDeposit,
  depositStrategyAmount,
  destinationAssetTokenAccount,
  strategySeedString,
} from "../../config/trustful";
import { ADAPTOR_PROGRAM_ID, DISCRIMINATOR } from "../constants/trustful";

const depositArbitraryStrategy = async (
  connection: Connection,
  managerKp: Keypair,
  vault: PublicKey,
  vaultAssetMint: PublicKey,
  destinationAssetTokenAccount: PublicKey,
  assetTokenProgram: PublicKey,
  adaptorProgram: PublicKey,
  strategySeedString: string,
  instructionDiscriminator: number[],
  depositAmount: BN,
  endValue: BN,
  lookupTableAddresses: string[] = []
) => {
  const vc = new VoltrClient(connection);

  const [strategy] = PublicKey.findProgramAddressSync(
    [Buffer.from(strategySeedString)],
    new PublicKey(adaptorProgram)
  );

  const { vaultStrategyAuth } = vc.findVaultStrategyAddresses(vault, strategy);

  const [withdrawalHoldingAuth] = PublicKey.findProgramAddressSync(
    [vaultStrategyAuth.toBuffer(), strategy.toBuffer()],
    new PublicKey(adaptorProgram)
  );

  let transactionIxs: TransactionInstruction[] = [];

  const withdrawalHoldingAccount = await setupTokenAccount(
    connection,
    managerKp.publicKey,
    vaultAssetMint,
    withdrawalHoldingAuth,
    transactionIxs,
    assetTokenProgram
  );

  const vaultStrategyAssetAta = await setupTokenAccount(
    connection,
    managerKp.publicKey,
    vaultAssetMint,
    vaultStrategyAuth,
    transactionIxs,
    assetTokenProgram
  );

  // Prepare the remaining accounts
  const remainingAccounts = [
    { pubkey: destinationAssetTokenAccount, isSigner: false, isWritable: true },
  ];

  let additionalArgs = Buffer.from([
    ...new BN(endValue).toArrayLike(Buffer, "le", 8),
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
  console.log("Arbitrary strategy deposited with signature:", txSig);
  console.log(
    "IMPORTANT: To withdraw from strategy back to vault, transfer tokens back to:",
    withdrawalHoldingAccount.toBase58()
  );
};

const main = async () => {
  const payerKpFile = fs.readFileSync(process.env.MANAGER_FILE_PATH!, "utf-8");
  const payerKpData = JSON.parse(payerKpFile);
  const payerSecret = Uint8Array.from(payerKpData);
  const payerKp = Keypair.fromSecretKey(payerSecret);

  await depositArbitraryStrategy(
    new Connection(process.env.HELIUS_RPC_URL!),
    payerKp,
    new PublicKey(vaultAddress),
    new PublicKey(assetMintAddress),
    new PublicKey(destinationAssetTokenAccount),
    new PublicKey(assetTokenProgram),
    new PublicKey(ADAPTOR_PROGRAM_ID),
    strategySeedString,
    DISCRIMINATOR.DEPOSIT_ARBITRARY,
    new BN(depositStrategyAmount),
    new BN(positionValueAfterDeposit)
  );
};

main();
