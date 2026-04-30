import "dotenv/config";
import * as fs from "fs";
import {
  AccountRole,
  createKeyPairSignerFromBytes,
  getAddressEncoder,
  type AccountMeta,
  type Address,
} from "@solana/kit";
import {
  findVaultLpMintPda,
  getUpdateVaultConfigInstructionAsync,
  VaultConfigField,
} from "@voltr/vault-sdk";
import { sendAndConfirmOptimisedTx } from "../utils/helper";
import {
  vaultAddress,
  vaultConfigUpdateField,
  vaultConfigUpdateValue,
} from "../../config/base";

const serializeVaultConfigValue = (
  field: VaultConfigField,
  value: bigint | number | Address
): Uint8Array => {
  switch (field) {
    case VaultConfigField.MaxCap:
    case VaultConfigField.StartAtTs:
    case VaultConfigField.LockedProfitDegradationDuration:
    case VaultConfigField.WithdrawalWaitingPeriod: {
      if (typeof value !== "bigint") {
        throw new Error(`Expected bigint for field ${field}, got ${typeof value}`);
      }
      const buf = Buffer.alloc(8);
      buf.writeBigUInt64LE(value, 0);
      return new Uint8Array(buf);
    }

    case VaultConfigField.ManagerPerformanceFee:
    case VaultConfigField.AdminPerformanceFee:
    case VaultConfigField.ManagerManagementFee:
    case VaultConfigField.AdminManagementFee:
    case VaultConfigField.RedemptionFee:
    case VaultConfigField.IssuanceFee:
    case VaultConfigField.DisabledOperations: {
      if (typeof value !== "number") {
        throw new Error(`Expected number for field ${field}, got ${typeof value}`);
      }
      const buf = Buffer.alloc(2);
      buf.writeUInt16LE(value, 0);
      return new Uint8Array(buf);
    }

    case VaultConfigField.Manager:
    case VaultConfigField.PendingAdmin: {
      if (typeof value !== "string") {
        throw new Error(`Expected Address for field ${field}, got ${typeof value}`);
      }
      return new Uint8Array(getAddressEncoder().encode(value as Address));
    }

    default:
      throw new Error(`Unknown vault config field: ${field}`);
  }
};

const main = async () => {
  const adminSecret = Uint8Array.from(
    JSON.parse(fs.readFileSync(process.env.ADMIN_FILE_PATH!, "utf-8"))
  );
  const adminSigner = await createKeyPairSignerFromBytes(adminSecret);

  const data = serializeVaultConfigValue(
    vaultConfigUpdateField,
    vaultConfigUpdateValue
  );

  const updateVaultConfigIx = await getUpdateVaultConfigInstructionAsync({
    admin: adminSigner,
    vault: vaultAddress,
    field: vaultConfigUpdateField,
    data,
  });

  const requiresLpMint =
    vaultConfigUpdateField === VaultConfigField.ManagerManagementFee ||
    vaultConfigUpdateField === VaultConfigField.AdminManagementFee;

  let finalIx: typeof updateVaultConfigIx = updateVaultConfigIx;
  if (requiresLpMint) {
    const [vaultLpMint] = await findVaultLpMintPda({ vault: vaultAddress });
    const extraAccount: AccountMeta = {
      address: vaultLpMint,
      role: AccountRole.READONLY,
    };
    finalIx = {
      ...updateVaultConfigIx,
      accounts: [...(updateVaultConfigIx.accounts ?? []), extraAccount],
    } as typeof updateVaultConfigIx;
  }

  const txSig = await sendAndConfirmOptimisedTx(
    [finalIx],
    process.env.HELIUS_RPC_URL!,
    adminSigner
  );

  console.log(
    `Vault config field '${VaultConfigField[vaultConfigUpdateField]}' updated with signature: ${txSig}`
  );
};

main();
