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
  findVaultStrategyAuthPda,
  getDepositStrategyInstructionAsync,
} from "@voltr/vault-sdk";
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

const depositArbitraryStrategy = async () => {
  const payerSecret = Uint8Array.from(
    JSON.parse(fs.readFileSync(process.env.MANAGER_FILE_PATH!, "utf-8"))
  );
  const managerSigner = await createKeyPairSignerFromBytes(payerSecret);
  const rpc = createSolanaRpc(process.env.HELIUS_RPC_URL!);
  const vaultAssetMintPk = new PublicKey(assetMintAddress);
  const destinationAssetTokenAccountPk = new PublicKey(destinationAssetTokenAccount);
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

  const remainingAccounts = [
    {
      pubkey: destinationAssetTokenAccountPk,
      isSigner: false,
      isWritable: true,
    },
  ];

  const depositStrategyIx = await getDepositStrategyInstructionAsync({
    manager: managerSigner,
    vault: vaultAddress,
    strategy,
    vaultAssetMint: assetMintAddress,
    assetTokenProgram,
    adaptorProgram: address(ADAPTOR_PROGRAM_ID),
    amount: BigInt(new BN(depositStrategyAmount).toString()),
    instructionDiscriminator: new Uint8Array(DISCRIMINATOR.DEPOSIT_ARBITRARY),
    additionalArgs: new Uint8Array(
      Buffer.from([...new BN(positionValueAfterDeposit).toArrayLike(Buffer, "le", 8)])
    ),
  });

  transactionIxs.push(
    appendRemainingAccounts(depositStrategyIx, remainingAccounts)
  );
  const txSig = await sendAndConfirmOptimisedTx(
    transactionIxs,
    process.env.HELIUS_RPC_URL!,
    managerSigner
  );
  console.log("Arbitrary strategy deposited with signature:", txSig);
  console.log(
    "IMPORTANT: To withdraw from strategy back to vault, transfer tokens back to:",
    withdrawalHoldingAccount
  );
};

const main = async () => {
  await depositArbitraryStrategy();
};

main();
