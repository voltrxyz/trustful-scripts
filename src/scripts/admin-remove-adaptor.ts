import "dotenv/config";
import {
  Connection,
  Keypair,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import * as fs from "fs";
import { sendAndConfirmOptimisedTx } from "../utils/helper";
import { VoltrClient } from "@voltr/vault-sdk";
import { vaultAddress } from "../../config/base";
import { ADAPTOR_PROGRAM_ID } from "../constants/trustful";

const payerKpFile = fs.readFileSync(process.env.ADMIN_FILE_PATH!, "utf-8");
const payerKpData = JSON.parse(payerKpFile);
const payerSecret = Uint8Array.from(payerKpData);
const payerKp = Keypair.fromSecretKey(payerSecret);
const payer = payerKp.publicKey;

const vault = new PublicKey(vaultAddress);

const connection = new Connection(process.env.HELIUS_RPC_URL!);
const vc = new VoltrClient(connection);

const removeAdaptorHandler = async () => {
  const createRemoveAdaptorIx = await vc.createRemoveAdaptorIx({
    vault,
    admin: payer,
    adaptorProgram: new PublicKey(ADAPTOR_PROGRAM_ID),
  });

  const transactionIxs0: TransactionInstruction[] = [];

  transactionIxs0.push(createRemoveAdaptorIx);

  const txSig0 = await sendAndConfirmOptimisedTx(
    transactionIxs0,
    process.env.HELIUS_RPC_URL!,
    payerKp,
    []
  );

  await connection.confirmTransaction(txSig0, "finalized");
  console.log(`Adaptor removed from vault with signature: ${txSig0}`);
};

const main = async () => {
  await removeAdaptorHandler();
};

main();
