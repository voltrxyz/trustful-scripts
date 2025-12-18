import "dotenv/config";
import * as fs from "fs";
import {
  Connection,
  Keypair,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import { sendAndConfirmOptimisedTx } from "../utils/helper";
import { VoltrClient } from "@voltr/vault-sdk";
import { vaultAddress } from "../../config/base";
import { ADAPTOR_PROGRAM_ID, SEEDS } from "../constants/trustful";

const removeCurveStrategy = async (
  connection: Connection,
  payerKp: Keypair,
  managerKp: Keypair,
  vault: PublicKey,
  adaptorProgram: PublicKey,
  strategySeedString: string
) => {
  const vc = new VoltrClient(connection);

  const [strategy] = PublicKey.findProgramAddressSync(
    [Buffer.from(strategySeedString)],
    new PublicKey(adaptorProgram)
  );

  let transactionIxs: TransactionInstruction[] = [];

  const createCloseStrategyIx = await vc.createCloseStrategyIx({
    payer: payerKp.publicKey,
    manager: managerKp.publicKey,
    vault,
    strategy,
  });

  transactionIxs.push(createCloseStrategyIx);

  const txSig = await sendAndConfirmOptimisedTx(
    transactionIxs,
    process.env.HELIUS_RPC_URL!,
    managerKp,
    [],
    []
  );
  console.log("Curve strategy removed with signature:", txSig);
};

const main = async () => {
  const payerKpFile = fs.readFileSync(process.env.ADMIN_FILE_PATH!, "utf-8");
  const payerKpData = JSON.parse(payerKpFile);
  const payerSecret = Uint8Array.from(payerKpData);
  const payerKp = Keypair.fromSecretKey(payerSecret);

  await removeCurveStrategy(
    new Connection(process.env.HELIUS_RPC_URL!),
    payerKp,
    payerKp,
    new PublicKey(vaultAddress),
    new PublicKey(ADAPTOR_PROGRAM_ID),
    SEEDS.CURVE
  );
};

main();
