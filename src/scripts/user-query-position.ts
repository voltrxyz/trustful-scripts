import "dotenv/config";
import * as fs from "fs";
import {
  createKeyPairSignerFromBytes,
  createSolanaRpc,
} from "@solana/kit";
import {
  fetchMint,
  fetchToken,
  findAssociatedTokenPda,
  TOKEN_PROGRAM_ADDRESS,
} from "@solana-program/token";
import {
  calculateAssetsForWithdraw,
  fetchVault,
  findVaultLpMintPda,
} from "@voltr/vault-sdk";
import { vaultAddress } from "../../config/base";

const main = async () => {
  const userSecret = Uint8Array.from(
    JSON.parse(fs.readFileSync(process.env.USER_FILE_PATH!, "utf-8"))
  );
  const userSigner = await createKeyPairSignerFromBytes(userSecret);

  const rpc = createSolanaRpc(process.env.HELIUS_RPC_URL!);

  const [vaultLpMint] = await findVaultLpMintPda({ vault: vaultAddress });
  const [userLpAta] = await findAssociatedTokenPda({
    owner: userSigner.address,
    mint: vaultLpMint,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });
  const userLpAccount = await fetchToken(rpc, userLpAta);
  const userLpAmount = userLpAccount.data.amount;

  console.log("User Lp Amount:", userLpAmount.toString());

  const vaultLpMintAccount = await fetchMint(rpc, vaultLpMint);
  const totalLpSupply = vaultLpMintAccount.data.supply;
  const vaultAccount = await fetchVault(rpc, vaultAddress);
  const vaultAssetTotalValue = vaultAccount.data.asset.totalValue;

  const userLpShareRatioNumber =
    totalLpSupply === 0n
      ? 0
      : Number(userLpAmount) / Number(totalLpSupply);
  const userAssetAmount =
    Number(vaultAssetTotalValue) * userLpShareRatioNumber;

  console.log(
    "User Asset Amount (Before Redemption Fee & Degradation):",
    userAssetAmount.toString()
  );

  const userAssetAmountAfterWithdrawalFee = await calculateAssetsForWithdraw(
    rpc,
    vaultAddress,
    userLpAmount
  );

  console.log(
    "User Asset Amount (After Redemption Fee & Degradation):",
    userAssetAmountAfterWithdrawalFee.toString()
  );
};

main();
