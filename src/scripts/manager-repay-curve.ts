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
import { AnchorProvider, BN, Program, Wallet } from "@coral-xyz/anchor";
import { VoltrClient } from "@voltr/vault-sdk";
import {
  assetMintAddress,
  vaultAddress,
  assetTokenProgram,
} from "../../config/base";
import {
  strategySeedString,
  borrowRateBps,
  repayStrategyAmount,
} from "../../config/trustful";
import { ADAPTOR_PROGRAM_ID, DISCRIMINATOR } from "../constants/trustful";
import { VoltrTrustfulAdaptor } from "../idl/voltr_trustful_adaptor";
import * as idl from "../idl/voltr_trustful_adaptor.json";

const repayCurveStrategy = async (
  connection: Connection,
  managerKp: Keypair,
  vault: PublicKey,
  vaultAssetMint: PublicKey,
  assetTokenProgram: PublicKey,
  adaptorProgramId: PublicKey,
  strategySeedString: string,
  instructionDiscriminator: number[],
  repayAmount: BN,
  borrowRateBps: number,
  lookupTableAddresses: string[] = []
) => {
  const vc = new VoltrClient(connection);

  const [strategy] = PublicKey.findProgramAddressSync(
    [Buffer.from(strategySeedString)],
    new PublicKey(adaptorProgramId)
  );

  const { vaultStrategyAuth } = vc.findVaultStrategyAddresses(vault, strategy);

  const [withdrawalHoldingAuth] = PublicKey.findProgramAddressSync(
    [vaultStrategyAuth.toBuffer(), strategy.toBuffer()],
    new PublicKey(adaptorProgramId)
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

  const _vaultStrategyAssetAta = await setupTokenAccount(
    connection,
    managerKp.publicKey,
    vaultAssetMint,
    vaultStrategyAuth,
    transactionIxs,
    assetTokenProgram
  );

  const strategyInitReceipt = vc.findStrategyInitReceipt(vault, strategy);

  let remainingAccounts = [
    {
      pubkey: strategyInitReceipt,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: withdrawalHoldingAuth, isWritable: false, isSigner: false },
    { pubkey: withdrawalHoldingAccount, isWritable: true, isSigner: false },
  ];

  let additionalArgs = Buffer.from([
    ...new BN(borrowRateBps).toArrayLike(Buffer, "le", 2),
  ]);

  const adaptorProgram = new Program<VoltrTrustfulAdaptor>(
    idl as VoltrTrustfulAdaptor,
    new AnchorProvider(connection, new Wallet(managerKp))
  );

  const transferIx = await adaptorProgram.methods
    .transferCurve(new BN(repayAmount), borrowRateBps)
    .accountsPartial({
      user: managerKp.publicKey,
      authority: vaultStrategyAuth,
      vaultAssetMint,
      tokenProgram: assetTokenProgram,
      strategyInitReceipt,
    })
    .instruction();

  transactionIxs.push(transferIx);

  const createWithdrawStrategyIx = await vc.createWithdrawStrategyIx(
    {
      instructionDiscriminator: Buffer.from(instructionDiscriminator),
      withdrawAmount: new BN(repayAmount),
      additionalArgs,
    },
    {
      manager: managerKp.publicKey,
      vault,
      vaultAssetMint,
      assetTokenProgram,
      strategy,
      remainingAccounts,
      adaptorProgram: adaptorProgramId,
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
  console.log("Curve strategy repaid with signature:", txSig);
};

const main = async () => {
  const payerKpFile = fs.readFileSync(process.env.MANAGER_FILE_PATH!, "utf-8");
  const payerKpData = JSON.parse(payerKpFile);
  const payerSecret = Uint8Array.from(payerKpData);
  const payerKp = Keypair.fromSecretKey(payerSecret);

  await repayCurveStrategy(
    new Connection(process.env.HELIUS_RPC_URL!),
    payerKp,
    new PublicKey(vaultAddress),
    new PublicKey(assetMintAddress),
    new PublicKey(assetTokenProgram),
    new PublicKey(ADAPTOR_PROGRAM_ID),
    strategySeedString,
    DISCRIMINATOR.REPAY_CURVE,
    new BN(repayStrategyAmount),
    borrowRateBps
  );
};

main();
