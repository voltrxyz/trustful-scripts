import type { Address } from "@solana/kit";
import { VaultConfigField } from "@voltr/vault-sdk";

export interface VaultConfig {
  maxCap: bigint;
  startAtTs: bigint;
  managerPerformanceFee: number;
  adminPerformanceFee: number;
  managerManagementFee: number;
  adminManagementFee: number;
  lockedProfitDegradationDuration: bigint;
  redemptionFee: number;
  issuanceFee: number;
  withdrawalWaitingPeriod: bigint;
}

export interface VaultParams {
  config: VaultConfig;
  name: string;
  description: string;
}

// ONLY NEEDED FOR INIT VAULT
export const vaultConfig: VaultConfig = {
  maxCap: 100_000_000_000n, // 100K USDC (10^6 Decimals)
  startAtTs: 0n,
  managerPerformanceFee: 500, // 500 = 5% in basis points
  adminPerformanceFee: 500, // 500 = 5% in basis points
  managerManagementFee: 0, // 0 = 0% in basis points
  adminManagementFee: 0, // 0 = 0% in basis points
  lockedProfitDegradationDuration: 0n, // profit will be realised linearly over time (seconds)
  redemptionFee: 0, // one time fee when withdrawing
  issuanceFee: 0, // one time fee when depositing
  withdrawalWaitingPeriod: 0n, // waiting period before withdrawing
};

// ONLY NEEDED FOR INIT VAULT
export const vaultParams: VaultParams = {
  config: vaultConfig,
  name: "",
  description: "",
};

// ONLY NEEDED IF YOU WANT TO SET LP TOKEN METADATA
export const lpTokenMetadata = {
  symbol: "",
  name: "",
  uri: "",
};

// MAIN ASSET DEPOSITED INTO VAULT
export const assetMintAddress = "" as Address;
export const assetTokenProgram = "" as Address; // TOKEN_PROGRAM_ADDRESS or TOKEN_2022_PROGRAM_ADDRESS

// TO FILL UP AFTER INIT VAULT
export const vaultAddress = "" as Address;

// LUT CREATED AND EXTENDED ON INITS AND UTILISED FOR DEPOSIT AND WITHDRAW STRATEGIES
export const useLookupTable = true;
// TO FILL UP IF useLookupTable IS TRUE AFTER LUT IS CREATED
export const lookupTableAddress = "" as Address;

// TAKE INTO ACCOUNT TOKEN DECIMALS 1_000_000 = 1 USDC (6 DECIMALS) LP is ALWAYS 9 DECIMALS
// ONLY NEEDED FOR DEPOSIT VAULT, WITHDRAW VAULT
export const depositAmountVault = 1_000_000n;
export const withdrawAmountVault = 1_000_000n;
export const isWithdrawAll = false;
export const isWithdrawInLp = false;

// FOR VAULT CONFIG UPDATES
export const vaultConfigUpdateField: VaultConfigField = VaultConfigField.MaxCap;
export const vaultConfigUpdateValue: bigint | number | Address =
  200_000_000_000n;
