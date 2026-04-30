import "dotenv/config";
import { createSolanaRpc } from "@solana/kit";
import {
  fetchAllStrategyInitReceiptAccountsOfVault,
  fetchVault,
} from "@voltr/vault-sdk";
import { vaultAddress } from "../../config/base";

const main = async () => {
  const rpc = createSolanaRpc(process.env.HELIUS_RPC_URL!);

  const vaultAccount = await fetchVault(rpc, vaultAddress);
  console.log(
    "vaultTotalPosition:",
    vaultAccount.data.asset.totalValue.toString()
  );

  const allocations = await fetchAllStrategyInitReceiptAccountsOfVault(
    rpc,
    vaultAddress
  );

  allocations.forEach((allocation) => {
    console.log("Pk:", allocation.address);
    console.log("Strategy:", allocation.data.strategy);
    console.log("amount:", allocation.data.positionValue.toString());
  });
};

main();
