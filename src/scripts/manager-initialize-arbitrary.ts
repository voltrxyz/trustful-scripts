import "dotenv/config";
import * as fs from "fs";
import { PublicKey } from "@solana/web3.js";
import {
  address,
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  type Instruction,
} from "@solana/kit";
import {
  getAddressesByLookupTable,
  publicKeyToAddress,
  sendAndConfirmOptimisedTx,
  setupTokenAccount,
} from "../utils/helper";
import {
  findVaultStrategyAuthPda,
  getInitializeStrategyInstructionAsync,
} from "@voltr/vault-sdk";
import {
  assetMintAddress,
  vaultAddress,
  assetTokenProgram,
} from "../../config/base";
import { strategySeedString } from "../../config/trustful";
import { ADAPTOR_PROGRAM_ID, DISCRIMINATOR } from "../constants/trustful";

const initializeArbitraryStrategy = async () => {
  const payerSecret = Uint8Array.from(
    JSON.parse(fs.readFileSync(process.env.MANAGER_FILE_PATH!, "utf-8"))
  );
  const payerSigner = await createKeyPairSignerFromBytes(payerSecret);
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

  const transactionIxs: Instruction[] = [];

  await setupTokenAccount(
    rpc,
    payerSigner,
    assetMintAddress,
    vaultStrategyAuth,
    transactionIxs,
    assetTokenProgram
  );

  const initializeStrategyIx = await getInitializeStrategyInstructionAsync({
    payer: payerSigner,
    manager: payerSigner,
    vault: vaultAddress,
    strategy,
    adaptorProgram: address(ADAPTOR_PROGRAM_ID),
    instructionDiscriminator: new Uint8Array(DISCRIMINATOR.INITIALIZE_ARBITRARY),
    additionalArgs: null,
  });

  transactionIxs.push(initializeStrategyIx);
  const txSig = await sendAndConfirmOptimisedTx(
    transactionIxs,
    process.env.HELIUS_RPC_URL!,
    payerSigner,
    {}
  );
  console.log("Arbitrary strategy initialized with signature:", txSig);
};

const main = async () => {
  await initializeArbitraryStrategy();
};

main();
