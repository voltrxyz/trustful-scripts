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
  getWithdrawStrategyInstructionAsync,
} from "@voltr/vault-sdk";
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

const withdrawArbitraryStrategy = async () => {
  const payerSecret = Uint8Array.from(
    JSON.parse(fs.readFileSync(process.env.MANAGER_FILE_PATH!, "utf-8"))
  );
  const managerSigner = await createKeyPairSignerFromBytes(payerSecret);
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

  const remainingAccounts = [
    { pubkey: withdrawalHoldingAuth, isWritable: false, isSigner: false },
    {
      pubkey: new PublicKey(withdrawalHoldingAccount),
      isWritable: true,
      isSigner: false,
    },
  ];

  const withdrawStrategyIx = await getWithdrawStrategyInstructionAsync({
    manager: managerSigner,
    vault: vaultAddress,
    strategy,
    vaultAssetMint: assetMintAddress,
    assetTokenProgram,
    adaptorProgram: address(ADAPTOR_PROGRAM_ID),
    amount: BigInt(new BN(withdrawStrategyAmount).toString()),
    instructionDiscriminator: new Uint8Array(DISCRIMINATOR.WITHDRAW_ARBITRARY),
    additionalArgs: new Uint8Array(
      Buffer.from([...new BN(positionValueAfterWithdraw).toArrayLike(Buffer, "le", 8)])
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
  console.log("Arbitrary strategy withdrawed with signature:", txSig);
};

const main = async () => {
  await withdrawArbitraryStrategy();
};

main();
