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
  positionValueAfterWithdraw,
  withdrawStrategyAmount,
  strategySeedString,
} from "../../config/trustful";
import { ADAPTOR_PROGRAM_ID, DISCRIMINATOR } from "../constants/trustful";

const withdrawArbitraryStrategy = async (
  connection: Connection,
  managerKp: Keypair,
  vault: PublicKey,
  vaultAssetMint: PublicKey,
  assetTokenProgram: PublicKey,
  adaptorProgram: PublicKey,
  strategySeedString: string,
  instructionDiscriminator: number[],
  withdrawAmount: BN,
  endValue: BN,
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

  let additionalArgs = Buffer.from([
    ...new BN(endValue).toArrayLike(Buffer, "le", 8),
  ]);

  const createWithdrawStrategyIx = await vc.createWithdrawStrategyIx(
    {
      instructionDiscriminator: Buffer.from(instructionDiscriminator),
      withdrawAmount,
      additionalArgs,
    },
    {
      manager: managerKp.publicKey,
      vault,
      vaultAssetMint,
      assetTokenProgram,
      strategy,
      remainingAccounts: [],
      adaptorProgram,
    }
  );

  transactionIxs.push(createWithdrawStrategyIx);

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
  console.log("Arbitrary strategy withdrawed with signature:", txSig);
};

const main = async () => {
  const payerKpFile = fs.readFileSync(process.env.MANAGER_FILE_PATH!, "utf-8");
  const payerKpData = JSON.parse(payerKpFile);
  const payerSecret = Uint8Array.from(payerKpData);
  const payerKp = Keypair.fromSecretKey(payerSecret);

  await withdrawArbitraryStrategy(
    new Connection(process.env.HELIUS_RPC_URL!),
    payerKp,
    new PublicKey(vaultAddress),
    new PublicKey(assetMintAddress),
    new PublicKey(assetTokenProgram),
    new PublicKey(ADAPTOR_PROGRAM_ID),
    strategySeedString,
    DISCRIMINATOR.WITHDRAW_ARBITRARY,
    new BN(withdrawStrategyAmount),
    new BN(positionValueAfterWithdraw)
  );
};

main();
