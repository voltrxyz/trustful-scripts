import "dotenv/config";
import * as fs from "fs";
import {
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  type Instruction,
} from "@solana/kit";
import {
  findVaultLpMintPda,
  getHarvestFeeInstructionAsync,
} from "@voltr/vault-sdk";
import { sendAndConfirmOptimisedTx, setupTokenAccount } from "../utils/helper";
import { vaultAddress } from "../../config/base";
import { PROTOCOL_ADMIN } from "../constants/base";

const main = async () => {
  const adminSecret = Uint8Array.from(
    JSON.parse(fs.readFileSync(process.env.ADMIN_FILE_PATH!, "utf-8"))
  );
  const adminSigner = await createKeyPairSignerFromBytes(adminSecret);

  const managerSecret = Uint8Array.from(
    JSON.parse(fs.readFileSync(process.env.MANAGER_FILE_PATH!, "utf-8"))
  );
  const managerSigner = await createKeyPairSignerFromBytes(managerSecret);

  const rpc = createSolanaRpc(process.env.HELIUS_RPC_URL!);

  const transactionIxs: Instruction[] = [];
  const [lpMint] = await findVaultLpMintPda({ vault: vaultAddress });

  await setupTokenAccount(
    rpc,
    adminSigner,
    lpMint,
    adminSigner.address,
    transactionIxs
  );
  await setupTokenAccount(
    rpc,
    adminSigner,
    lpMint,
    managerSigner.address,
    transactionIxs
  );
  await setupTokenAccount(
    rpc,
    adminSigner,
    lpMint,
    PROTOCOL_ADMIN,
    transactionIxs
  );

  const harvestFeeIx = await getHarvestFeeInstructionAsync({
    harvester: adminSigner,
    vaultManager: managerSigner.address,
    vaultAdmin: adminSigner.address,
    protocolAdmin: PROTOCOL_ADMIN,
    vault: vaultAddress,
  });

  transactionIxs.push(harvestFeeIx);

  const txSig = await sendAndConfirmOptimisedTx(
    transactionIxs,
    process.env.HELIUS_RPC_URL!,
    adminSigner
  );

  console.log(`Harvested fee with signature: ${txSig}`);
};

main();
