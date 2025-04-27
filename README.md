# Voltr Base Client Scripts

A set of base scripts for interacting with the Voltr Vault protocol on Solana using the `@voltr/vault-sdk`. These scripts provide fundamental operations for vault administration and user interaction.

## Table of Contents

- [Introduction](#introduction)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
  - [Environment Variables (Required)](#environment-variables-required)
  - [Configuration File (`config/base.ts`)](#configuration-file-configconfigts)
- [Available Scripts](#available-scripts)
  - [Admin Scripts](#admin-scripts)
  - [User Scripts](#user-scripts)
  - [Query Scripts](#query-scripts)
- [Basic Usage Flow](#basic-usage-flow)
- [Project Structure](#project-structure)
- [Development](#development)

---

## Introduction

This repository contains a collection of TypeScript scripts demonstrating basic interactions with Voltr Vaults on the Solana blockchain. They cover core functionalities like initializing and managing vaults, depositing and withdrawing assets for users, and querying vault/user state.

These scripts serve as a starting point and example for building more complex integrations with the Voltr protocol.

---

## Prerequisites

1.  **Node.js v18+**
    Ensure you have Node.js version 18 or higher installed.

2.  **pnpm**
    This project uses pnpm for package management. Install it if you haven't already:
    ```bash
    npm install -g pnpm
    ```
    Or see the [pnpm website](https://pnpm.io/installation).

3.  **Solana Keypairs**
    You'll need separate Solana keypair files (in JSON format) for the following roles:
    *   **Admin:** Manages vault configuration and fee harvesting.
    *   **Manager:** Designated during vault initialization (role specified by Voltr protocol, used in init/harvest).
    *   **User:** Interacts with the vault (deposit/withdraw).

    Store these JSON files securely on your filesystem.

4.  **Solana RPC URL**
    A reliable Solana RPC endpoint URL is required. The scripts are configured to use a Helius RPC URL provided via an environment variable, but any compatible RPC should work.

---

## Installation

1.  Clone this repository:
    ```bash
    git clone <your-repo-url> voltr-base-scripts
    cd voltr-base-scripts
    ```

2.  Install dependencies:
    ```bash
    pnpm install
    ```

---

## Configuration

Configuration requires setting environment variables and editing the `config/base.ts` file.

### Environment Variables (Required)

These scripts expect the following environment variables to be set, pointing to your keypair files and RPC URL:

*   `ADMIN_FILE_PATH`: Absolute path to the Admin keypair JSON file.
*   `MANAGER_FILE_PATH`: Absolute path to the Manager keypair JSON file.
*   `USER_FILE_PATH`: Absolute path to the User keypair JSON file.
*   `HELIUS_RPC_URL`: Your Solana RPC endpoint URL.

**Example (using .env file or exporting):**

```bash
export ADMIN_FILE_PATH="/path/to/your/admin.json"
export MANAGER_FILE_PATH="/path/to/your/manager.json"
export USER_FILE_PATH="/path/to/your/user.json"
export HELIUS_RPC_URL="https://your-rpc-provider-url"
```

**Security Note:** Never commit your private key JSON files to version control. Keep them secure and use environment variables or a secure secrets management system.

### Configuration File (`config/base.ts`)

This file contains parameters for vault operations. You **must** edit this file before running scripts.

*   **Vault Initialization (Needed for `admin-init-vault.ts`)**
    *   `vaultConfig`: An object defining parameters like `maxCap`, fees (`managerPerformanceFee`, `adminPerformanceFee`, etc.), `lockedProfitDegradationDuration`, `redemptionFee`, `issuanceFee`, `withdrawalWaitingPeriod`.
    *   `vaultParams`: Contains `vaultConfig` and basic metadata like `name`, `description`.

*   **Core Vault Details**
    *   `assetMintAddress`: **Required.** The public key (string) of the token mint that will be deposited into the vault (e.g., USDC, SOL).
    *   `assetTokenProgram`: **Required.** The public key (string) of the SPL Token program governing the `assetMintAddress` (e.g., `Tokenkeg...` for SPL Token, `Tokenz...` for Token-2022).
    *   `vaultAddress`: **Required after initialization.** Leave empty initially. After running `admin-init-vault.ts`, paste the outputted vault public key here.

*   **Transaction Optimization (Optional)**
    *   `useLookupTable`: Boolean. Set to `true` to create and use an Address Lookup Table (LUT) during initialization for potentially cheaper transactions.
    *   `lookupTableAddress`: **Required if `useLookupTable` is true.** Leave empty initially. After running `admin-init-vault.ts` with `useLookupTable: true`, paste the outputted LUT public key here.

*   **Action Parameters (Needed for deposit/withdraw scripts)**
    *   `depositAmountVault`: The amount of the base asset (in its smallest unit, e.g., lamports for SOL, 10^6 for USDC) to deposit.
    *   `withdrawAmountVault`: The amount to withdraw. Interpretation depends on `isWithdrawInLp`.
    *   `isWithdrawAll`: Boolean. If `true`, attempts to withdraw the user's entire position, overriding `withdrawAmountVault`.
    *   `isWithdrawInLp`: Boolean. If `true`, `withdrawAmountVault` is interpreted as the amount of *LP tokens* to withdraw. If `false`, it's interpreted as the amount of the *underlying asset* to withdraw.

---

## Available Scripts

Run scripts using `pnpm ts-node <script_path>`. Ensure environment variables are set and `config/base.ts` is updated appropriately for the script you are running.

### Admin Scripts

*   **`src/scripts/admin-init-vault.ts`**
    *   Initializes a new Voltr vault using the Admin as payer and designates the Manager.
    *   Requires `vaultConfig`, `vaultParams`, `assetMintAddress`, `assetTokenProgram` in `base.ts`.
    *   Outputs the new `vaultAddress` and `lookupTableAddress` (if `useLookupTable` is true). **You must update `base.ts` with these values after running.**
    *   Uses `ADMIN_FILE_PATH` and `MANAGER_FILE_PATH`.

*   **`src/scripts/admin-update-vault.ts`**
    *   Updates the configuration (`vaultConfig`) of an existing vault.
    *   Requires `vaultAddress` and the desired `vaultConfig` in `base.ts`.
    *   Uses `ADMIN_FILE_PATH`.

*   **`src/scripts/admin-harvest-fee.ts`**
    *   Collects accumulated performance and protocol fees from the vault, distributing them to Admin, Manager, and Protocol Admin.
    *   Requires `vaultAddress` in `base.ts`.
    *   Uses `ADMIN_FILE_PATH` and `MANAGER_FILE_PATH`.

### User Scripts

*   **`src/scripts/user-deposit-vault.ts`**
    *   Deposits a specified amount (`depositAmountVault`) of the vault's asset token from the User's account into the vault, receiving LP tokens in return.
    *   Handles wSOL wrapping/unwrapping if `assetMintAddress` is the native SOL mint.
    *   Requires `vaultAddress`, `assetMintAddress`, `assetTokenProgram`, `depositAmountVault` in `base.ts`.
    *   Uses `USER_FILE_PATH`.

*   **`src/scripts/user-request-withdraw-vault.ts`**
    *   Initiates a withdrawal request for the User. Fails if another request is pending.
    *   Uses `withdrawAmountVault`, `isWithdrawInLp`, `isWithdrawAll` from `base.ts`.
    *   Requires `vaultAddress` in `base.ts`.
    *   Uses `USER_FILE_PATH`.

*   **`src/scripts/user-withdraw-vault.ts`**
    *   Completes a previously requested withdrawal after any waiting period has passed. Fails if no request was made or the waiting period isn't over.
    *   Handles wSOL unwrapping if necessary.
    *   Requires `vaultAddress`, `assetMintAddress`, `assetTokenProgram` in `base.ts`.
    *   Uses `USER_FILE_PATH`.

*   **`src/scripts/user-request-and-withdraw-vault.ts`**
    *   Combines the request and withdrawal steps into a single transaction.
    *   **Only works if the vault's `withdrawalWaitingPeriod` in `vaultConfig` is set to 0.**
    *   Uses `withdrawAmountVault`, `isWithdrawInLp`, `isWithdrawAll` from `base.ts`.
    *   Requires `vaultAddress`, `assetMintAddress`, `assetTokenProgram` in `base.ts`.
    *   Uses `USER_FILE_PATH`.

### Query Scripts

*   **`src/scripts/user-query-position.ts`**
    *   Fetches the User's current LP token balance and calculates the approximate equivalent value in the underlying vault asset (both before and after potential withdrawal fees/degradation).
    *   Requires `vaultAddress` in `base.ts`.
    *   Uses `USER_FILE_PATH`.

*   **`src/scripts/query-strategy-positions.ts`**
    *   Fetches the vault account data, displays the total asset value, and lists any initialized strategy allocations (showing strategy address and position value).
    *   Requires `vaultAddress` in `base.ts`.
    *   Uses `ADMIN_FILE_PATH` (implicitly via RPC connection, though no signing needed).

---

## Basic Usage Flow

1.  **Configure Environment:** Set the `ADMIN_FILE_PATH`, `MANAGER_FILE_PATH`, `USER_FILE_PATH`, and `HELIUS_RPC_URL` environment variables.
2.  **Configure Vault Parameters:** Edit `config/base.ts`. Fill in `vaultConfig`, `vaultParams`, `assetMintAddress`, `assetTokenProgram`. Decide on `useLookupTable`. Leave `vaultAddress` and `lookupTableAddress` empty for now.
3.  **Initialize Vault (Admin):**
    ```bash
    pnpm ts-node src/scripts/admin-init-vault.ts
    ```
4.  **Update Config:** Copy the outputted `Vault:` and `Lookup Table:` (if used) addresses and paste them into the `vaultAddress` and `lookupTableAddress` fields in `config/base.ts`.
5.  **Update Vault (Admin, Optional):** If you need to change config after init:
    ```bash
    pnpm ts-node src/scripts/admin-update-vault.ts
    ```
6.  **Deposit (User):** Set `depositAmountVault` in `config/base.ts`.
    ```bash
    pnpm ts-node src/scripts/user-deposit-vault.ts
    ```
7.  **Check Position (User):**
    ```bash
    pnpm ts-node src/scripts/user-query-position.ts
    ```
8.  **Withdraw (User):** Set withdrawal parameters (`withdrawAmountVault`, `isWithdrawInLp`, `isWithdrawAll`) in `config/base.ts`.
    *   **If `withdrawalWaitingPeriod` > 0:**
        ```bash
        # Step 1: Request
        pnpm ts-node src/scripts/user-request-withdraw-vault.ts
        # Step 2: Wait for the period, then withdraw
        pnpm ts-node src/scripts/user-withdraw-vault.ts
        ```
    *   **If `withdrawalWaitingPeriod` == 0:**
        ```bash
        pnpm ts-node src/scripts/user-request-and-withdraw-vault.ts
        ```
9.  **Harvest Fees (Admin):**
    ```bash
    pnpm ts-node src/scripts/admin-harvest-fee.ts
    ```
10. **Query Strategies (Admin/General):**
    ```bash
    pnpm ts-node src/scripts/query-strategy-positions.ts
    ```

---

## Project Structure

```
voltr-base-scripts
├── config/
│   └── base.ts           # Main configuration file
├── src/
│   ├── constants/
│   │   └── base.ts         # Base constants (e.g., PROTOCOL_ADMIN)
│   ├── utils/
│   │   └── helper.ts       # Utility functions (transactions, ATAs, LUTs)
│   └── scripts/            # Executable scripts for vault interactions
│       ├── admin-*.ts      # Scripts requiring Admin keypair
│       ├── user-*.ts       # Scripts requiring User keypair
│       └── query-*.ts      # Scripts for querying state
├── node_modules/           # Project dependencies
├── pnpm-lock.yaml          # Dependency lockfile
├── package.json            # Project metadata and dependencies
├── tsconfig.json           # TypeScript compiler options
└── README.md               # This file
```

---

## Development

### Core Dependencies

*   `@coral-xyz/anchor`: For interacting with Anchor programs.
*   `@solana/web3.js`: Core Solana JavaScript SDK.
*   `@solana/spl-token`: Utilities for SPL Tokens.
*   `@voltr/vault-sdk`: The official SDK for interacting with Voltr Vaults.
*   `bs58`: Base58 encoding/decoding.

### Development Dependencies

*   `typescript`: TypeScript language support.
*   `ts-node`: Execute TypeScript files directly.
*   `@types/*`: Type definitions for Node.js and libraries.

Feel free to extend these base scripts for more specific use cases or integrations.

---

For questions or support regarding the Voltr protocol itself, please refer to the official Voltr documentation.

---

## Trustful Strategy Extensions (voltr-trustful-scripts)

The following sections detail the additions specific to the `voltr-trustful-scripts` project, which builds upon the base functionality to include trustful strategy interactions that can be used for custom integrations like Backpack.

### Additional Configuration (`config/trustful.ts`)

This file complements `config/base.ts` and holds parameters specific to the trustful strategy.

- **Strategy Action Parameters:**

  - `depositStrategyAmount`: **Required.** The amount of the **vault's base asset** (defined in `config/base.ts`) to deposit into the trustful strategy, denominated in the smallest units of the base asset (e.g., 1,000,000 for 1 USDC).
  - `withdrawStrategyAmount`: **Required.** The amount of the **vault's base asset** to withdraw from the trustful strategy, denominated in the smallest units of the base asset.

- **Strategy Position Values:**

  - `positionValueAfterDeposit`: **Required.** The expected position value after the deposit operation. This updates the vault's accounting of the strategy's value.
  - `positionValueAfterWithdraw`: **Required.** The expected position value after the withdrawal operation. This is typically 0 for a full withdrawal or the remaining balance for a partial withdrawal.

- **Strategy Destination:**

  - `destinationAssetTokenAccount`: **Required for deposit.** The token account where the strategy will transfer funds. This is an external account that the strategy will interact with.

- **Strategy Seeds:**
  - `strategySeedString`: **Required.** The seed string used to derive the strategy account address. The project includes a predefined seed in `src/constants/trustful.ts` under `SEEDS.BACKPACK`.

### New Admin Scripts

- **`src/scripts/admin-add-adaptor.ts`**
  - **Purpose:** Enables the vault to use trustful strategies by adding the official Voltr Arbitrary Adaptor program (`ADAPTOR_PROGRAM_ID` found in `src/constants/trustful.ts`) to the vault's list of approved adaptors. This only needs to be run once per vault.
  - **Requires:** `vaultAddress` (from `config/base.ts`).
  - **Uses:** `ADMIN_FILE_PATH`. May update the vault's LUT if `useLookupTable` is true.

### New Manager Scripts

These scripts are executed by the vault's designated Manager.

- **`src/scripts/manager-initialize-arbitrary.ts`**

  - **Purpose:** Initializes the necessary on-chain accounts for the vault to interact with a trustful strategy via the Voltr trustful Adaptor. This initializes the strategy account derived from the specified seed string.
  - **Requires:** `vaultAddress`, `assetMintAddress`, `assetTokenProgram` (from `config/base.ts`), and `strategySeedString` (from `config/trustful.ts`).
  - **Uses:** `MANAGER_FILE_PATH`. May update the vault's LUT if `useLookupTable` is true.

- **`src/scripts/manager-deposit-arbitrary.ts`**

  - **Purpose:** Deposits funds _from_ the vault _into_ the initialized trustful strategy, transferring them to the specified destination account.
  - **Requires:** `vaultAddress`, `assetMintAddress`, `assetTokenProgram` from `config/base.ts`. Also requires `depositStrategyAmount`, `positionValueAfterDeposit`, `destinationAssetTokenAccount`, and `strategySeedString` from `config/trustful.ts`.
  - **Uses:** `MANAGER_FILE_PATH`.

- **`src/scripts/manager-withdraw-arbitrary.ts`**
  - **Purpose:** Withdraws funds _from_ the trustful strategy _back into_ the main vault account. Note this assumes the funds have already been transferred back to the vault strategy authority (different from the vault idle account) token account.
  - **Requires:** `vaultAddress`, `assetMintAddress`, `assetTokenProgram` from `config/base.ts`. Also requires `withdrawStrategyAmount`, `positionValueAfterWithdraw`, and `strategySeedString` from `config/trustful.ts`.
  - **Uses:** `MANAGER_FILE_PATH`.

### Arbitrary Strategy Flow

This outlines the typical sequence for setting up and managing the arbitrary strategy:

1.  **Complete Basic Vault Setup:** Follow steps 1-4 in the [Basic Usage Flow](#basic-usage-flow) to initialize the vault and configure `config/base.ts`.
2.  **Configure Arbitrary Parameters:** Edit `config/trustful.ts`. Define `depositStrategyAmount`, `withdrawStrategyAmount`, `positionValueAfterDeposit`, `positionValueAfterWithdraw`, `destinationAssetTokenAccount`, and `strategySeedString`.
3.  **Add Arbitrary Adaptor (Admin):** Run `pnpm ts-node src/scripts/admin-add-adaptor.ts` to authorize the vault to use the trustful adaptor.
4.  **Initialize Arbitrary Strategy (Manager):** Run `pnpm ts-node src/scripts/manager-initialize-arbitrary.ts` to set up the on-chain accounts for the trustful strategy interaction.
5.  **Ensure Vault has Funds:** Use `user-deposit-vault.ts` (as the User) if the vault needs funds.
6.  **Deposit into Arbitrary Strategy (Manager):** Run `pnpm ts-node src/scripts/manager-deposit-arbitrary.ts` to allocate funds from the vault to the trustful strategy destination.

- **Note:** This transfers tokens to `destinationAssetTokenAccount` and updates the vault's accounting of the strategy value.

6.  **Query Positions:** Use `query-strategy-positions.ts` to see the updated allocation in the trustful strategy.
7.  **(External) Strategy Logic:** At this point, the trustful strategy (e.g., Backpack integration) would perform its operations with the funds sent to `destinationAssetTokenAccount`.
8.  **(External) Return Funds:** Before withdrawing, funds must be manually returned to the vault strategy authority (different from the vault idle account) token account (displayed in console output from deposit step).
9.  **Withdraw from Arbitrary Strategy (Manager):** Run `pnpm ts-node src/scripts/manager-withdraw-arbitrary.ts` to update the vault's accounting of returned funds from the arbitrary strategy.
10. **(Optional) User Withdrawal:** Users can withdraw from the vault as usual using the `user-*` withdrawal scripts.

### Protocol Integration Details

- **Trustful Adaptor:** The scripts interact with an trustful protocol integration via the Voltr Trustful Adaptor (`3pnpK9nrs1R65eMV1wqCXkDkhSgN18xb1G5pgYPwoZjJ`). The necessary program IDs, seed strings, and instruction discriminators are defined in `src/constants/trustful.ts`.
- **Trustful Design:** This adaptor follows a "trustful" design pattern, meaning it trusts the manager to accurately report position values and handle the actual strategy logic. The adaptor primarily serves as an accounting interface between the vault and external integrations.
- **External Transfers:** Unlike other adaptors that may handle all token transfers internally, the trustful adaptor requires manual handling of token flows between the strategy and external destinations. The deposit operation transfers tokens from the vault to the specified destination, but returns must be manually sent back to the vault strategy authority (different from the vault idle account) token account before withdrawal accounting can be finalized.

### Updated Project Structure (voltr-trustful-scripts)

```
voltr-trustful-scripts
├── pnpm-lock.yaml
├── config/
│   ├── base.ts             # Base vault configuration
│   └── trustful.ts        # ARBITRARY ADAPTOR: Trustful strategy config
├── README.md               # This file (now including Trustful extensions)
├── package.json            # Project metadata and dependencies
├── tsconfig.json           # TypeScript compiler options
└── src
    ├── constants/
    │   ├── base.ts         # Base constants (e.g., PROTOCOL_ADMIN)
    │   └── trustful.ts    # TRUSTFUL ADAPTOR: Constants (program IDs, seeds, discriminators)
    ├── utils/
    │   └── helper.ts       # Core utility functions (tx sending, ATAs, LUTs)
    └── scripts/            # Executable scripts
        ├── user-withdraw-vault.ts
        ├── user-query-position.ts
        ├── query-strategy-positions.ts
        ├── admin-update-vault.ts
        ├── user-request-and-withdraw-vault.ts
        ├── admin-harvest-fee.ts
        ├── user-deposit-vault.ts
        ├── admin-init-vault.ts
        ├── admin-add-adaptor.ts            # TRUSTFUL ADAPTOR: Adds the trustful adaptor to the vault
        ├── user-cancel-request-withdraw-vault.ts
        ├── user-request-withdraw-vault.ts
        ├── manager-initialize-arbitrary.ts  # TRUSTFUL ADAPTOR: Initializes arbitrary strategy
        ├── manager-deposit-arbitrary.ts     # TRUSTFUL ADAPTOR: Deposits vault funds into arbitrary strategy
        └── manager-withdraw-arbitrary.ts    # TRUSTFUL ADAPTOR: Withdraws funds from arbitrary strategy to vault
```
