import "dotenv/config";
import * as fs from "fs";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  appendRemainingAccounts,
  createKitSignerFromKeypair,
  publicKeyToAddress,
  sendAndConfirmOptimisedTx,
  setupTokenAccount,
  web3InstructionToKit,
} from "../utils/helper";
import { AnchorProvider, BN, Program, Wallet } from "@coral-xyz/anchor";
import {
  address,
  createSolanaRpc,
  type Instruction,
} from "@solana/kit";
import {
  findStrategyInitReceiptPda,
  findVaultStrategyAuthPda,
  getWithdrawStrategyInstructionAsync,
} from "@voltr/vault-sdk";
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

const repayCurveStrategy = async () => {
  const payerSecret = Uint8Array.from(
    JSON.parse(fs.readFileSync(process.env.MANAGER_FILE_PATH!, "utf-8"))
  );
  const managerKp = Keypair.fromSecretKey(payerSecret);
  const managerSigner = await createKitSignerFromKeypair(managerKp);
  const connection = new Connection(process.env.HELIUS_RPC_URL!);
  const rpc = createSolanaRpc(process.env.HELIUS_RPC_URL!);
  const strategy = publicKeyToAddress(
    PublicKey.findProgramAddressSync(
      [Buffer.from(strategySeedString)],
      new PublicKey(ADAPTOR_PROGRAM_ID)
    )[0]
  );
  const [vaultStrategyAuth] = await findVaultStrategyAuthPda({
    vault: vaultAddress,
    strategy,
  });

  const [withdrawalHoldingAuth] = PublicKey.findProgramAddressSync(
    [new PublicKey(vaultStrategyAuth).toBuffer(), new PublicKey(strategy).toBuffer()],
    new PublicKey(ADAPTOR_PROGRAM_ID)
  );

  const transactionIxs: Instruction[] = [];

  const withdrawalHoldingAccount = await setupTokenAccount(
    rpc,
    managerSigner,
    assetMintAddress,
    publicKeyToAddress(withdrawalHoldingAuth),
    transactionIxs,
    assetTokenProgram
  );

  await setupTokenAccount(
    rpc,
    managerSigner,
    assetMintAddress,
    vaultStrategyAuth,
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
    { pubkey: withdrawalHoldingAuth, isWritable: false, isSigner: false },
    {
      pubkey: new PublicKey(withdrawalHoldingAccount),
      isWritable: true,
      isSigner: false,
    },
  ];

  const adaptorProgram = new Program<VoltrTrustfulAdaptor>(
    idl as VoltrTrustfulAdaptor,
    new AnchorProvider(connection, new Wallet(managerKp))
  );

  const transferIx = await adaptorProgram.methods
    .transferCurve(new BN(repayStrategyAmount), borrowRateBps)
    .accountsPartial({
      user: managerKp.publicKey,
      authority: vaultStrategyAuth,
      vaultAssetMint: new PublicKey(assetMintAddress),
      tokenProgram: assetTokenProgram,
      strategyInitReceipt,
    })
    .instruction();

  transactionIxs.push(web3InstructionToKit(transferIx));

  const withdrawStrategyIx = await getWithdrawStrategyInstructionAsync({
    manager: managerSigner,
    vault: vaultAddress,
    strategy,
    vaultAssetMint: assetMintAddress,
    assetTokenProgram,
    adaptorProgram: address(ADAPTOR_PROGRAM_ID),
    amount: BigInt(new BN(repayStrategyAmount).toString()),
    instructionDiscriminator: new Uint8Array(DISCRIMINATOR.REPAY_CURVE),
    additionalArgs: new Uint8Array(
      Buffer.from([...new BN(borrowRateBps).toArrayLike(Buffer, "le", 2)])
    ),
  });

  transactionIxs.push(
    appendRemainingAccounts(withdrawStrategyIx, remainingAccounts)
  );
  const txSig = await sendAndConfirmOptimisedTx(
    transactionIxs,
    process.env.HELIUS_RPC_URL!,
    managerSigner
  );
  console.log("Curve strategy repaid with signature:", txSig);
};

const main = async () => {
  await repayCurveStrategy();
};

main();
