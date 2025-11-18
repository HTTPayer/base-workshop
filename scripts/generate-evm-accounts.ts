/**
 * Generate EVM Accounts
 *
 * Creates new Ethereum/EVM private keys and outputs:
 * - Address
 * - Private key (with and without 0x prefix)
 *
 * Usage: node --loader ts-node/esm scripts/generate-evm-accounts.ts [count]
 */

import { privateKeyToAccount } from "viem/accounts";
import { createWalletClient, http } from "viem";
import { generatePrivateKey } from "viem/accounts";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

// Get count from command line args (default to 2)
const count = parseInt(process.argv[1]) || 1;

console.log("\n════════════════════════════════════════════════════════════════");
console.log(`🔑 Generating ${count} EVM Account${count > 1 ? 's' : ''}`);
console.log("════════════════════════════════════════════════════════════════\n");

const accounts = [];

for (let i = 0; i < count; i++) {
  // Generate random private key
  const privateKey = generatePrivateKey();

  // Get account from private key
  const account = privateKeyToAccount(privateKey);

  accounts.push({
    index: i + 1,
    address: account.address,
    privateKey: privateKey,
    privateKeyNoPrefix: privateKey.slice(2),
  });
}

// Display each account
accounts.forEach((acc) => {
  console.log(`Account #${acc.index}:`);
  console.log(`  Address:     ${acc.address}`);
  console.log(`  Private Key: ${acc.privateKey}`);
  console.log(`  (no 0x):     ${acc.privateKeyNoPrefix}\n`);
});

console.log("════════════════════════════════════════════════════════════════");
console.log("📋 Add to your .env file:");
console.log("════════════════════════════════════════════════════════════════\n");

// Format for PRIVATE_KEYS (comma-separated)
const privateKeysForEnv = accounts.map(a => a.privateKey).join(",");
console.log(`# EVM Private Keys (comma-separated)`);
console.log(`PRIVATE_KEYS=${privateKeysForEnv}\n`);

// Also show individual keys
accounts.forEach((acc) => {
  console.log(`# Account #${acc.index} - ${acc.address}`);
  console.log(`# PRIVATE_KEY_${acc.index}=${acc.privateKey}\n`);
});

console.log("════════════════════════════════════════════════════════════════");
console.log("💾 Saving to file...");
console.log("════════════════════════════════════════════════════════════════\n");

// Create accounts directory if it doesn't exist
const accountsDir = "./accounts";
if (!existsSync(accountsDir)) {
  mkdirSync(accountsDir, { recursive: true });
}

// Generate timestamp for filename
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const filename = `evm-accounts_${timestamp}.json`;
const filepath = join(accountsDir, filename);

// Prepare data to save
const accountData = {
  generated_at: new Date().toISOString(),
  count: accounts.length,
  accounts: accounts,
  env_format: {
    private_keys_csv: privateKeysForEnv,
    individual_keys: accounts.reduce((acc, curr) => {
      acc[`PRIVATE_KEY_${curr.index}`] = curr.privateKey;
      return acc;
    }, {} as Record<string, string>)
  }
};

// Save to file
writeFileSync(filepath, JSON.stringify(accountData, null, 2), "utf-8");

console.log(`✅ Account info saved to: ${filepath}`);
console.log(`\n⚠️  IMPORTANT: Keep this file secure! It contains private keys.\n`);