import "dotenv/config";
import * as fs from "fs";
import { address, createKeyPairSignerFromBytes } from "@solana/kit";
import { PublicKey } from "@solana/web3.js";
import { sendAndConfirmOptimisedTx } from "../utils/helper";
import { getCloseStrategyInstructionAsync } from "@voltr/vault-sdk";
import { vaultAddress } from "../../config/base";
import { ADAPTOR_PROGRAM_ID, SEEDS } from "../constants/trustful";

const removeCurveStrategy = async () => {
  const payerSecret = Uint8Array.from(
    JSON.parse(fs.readFileSync(process.env.ADMIN_FILE_PATH!, "utf-8"))
  );
  const payerSigner = await createKeyPairSignerFromBytes(payerSecret);
  const strategy = address(
    PublicKey.findProgramAddressSync(
      [Buffer.from(SEEDS.CURVE)],
      new PublicKey(ADAPTOR_PROGRAM_ID)
    )[0].toBase58()
  );

  const closeStrategyIx = await getCloseStrategyInstructionAsync({
    payer: payerSigner,
    manager: payerSigner,
    vault: vaultAddress,
    strategy,
  });

  const txSig = await sendAndConfirmOptimisedTx(
    [closeStrategyIx],
    process.env.HELIUS_RPC_URL!,
    payerSigner
  );
  console.log("Curve strategy removed with signature:", txSig);
};

const main = async () => {
  await removeCurveStrategy();
};

main();
