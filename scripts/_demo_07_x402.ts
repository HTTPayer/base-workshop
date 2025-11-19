/*
Deploy Smart Money Intelligence website to IPFS via x402 payment
Uses ipfs.openx402.ai - pay 0.01 USDC per file, no API keys needed!
*/

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { config } from "dotenv";
import { createWalletClient, http, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { wrapFetchWithPayment, decodeXPaymentResponse, createSigner } from "x402-fetch";
import FormData from "form-data";
import dotenv from "dotenv";


dotenv.config();

// x402 IPFS gateway
const IPFS_X402_API = "https://ipfs.openx402.ai";

// Alternative IPFS gateways for viewing
const GATEWAYS = [
  "https://gateway.pinata.cloud/ipfs",
  "https://ipfs.io/ipfs",
  "https://cloudflare-ipfs.com/ipfs",
  "https://dweb.link/ipfs"
];

interface UploadResponse {
  success: boolean;
  id: string;
  filename: string;
  size: number;
  expiresIn: string;
  paymentUrl: string;
}

interface PinResponse {
  ipfsHash: string;
  pinataUrl: string;
  fileName: string;
  fileSize: number;
}

let PRIVATE_KEY = process.env.PRIVATE_KEY || "";
  if (!PRIVATE_KEY.startsWith("0x")) {
    PRIVATE_KEY = `0x${PRIVATE_KEY}`;
  }
console.log("[client] PRIVATE_KEY detected:", PRIVATE_KEY ? true : false);

// Create a signer using x402's createSigner helper
const signer = await createSigner("base", PRIVATE_KEY as `0x${string}`);

const LLM_SERVER = process.env.LLM_SERVER || "http://localhost:3000"
const SERVER_API_KEY = process.env.SERVER_API_KEY || "";
if (!SERVER_API_KEY) {
  console.warn("[client] Warning: SERVER_API_KEY is not set. LLM server requests may fail.");
}

// Extract the account address for logging
// Signer can be either a SignerWallet (with .account.address) or LocalAccount (with .address directly)
const accountAddress = "account" in signer ? signer.account?.address : signer.address;
console.log("[client] Using account address:", accountAddress || "N/A");
console.log("[client] Using chain: Base");

// Wrap the fetch function with payment handling
const fetchWithPay = wrapFetchWithPayment(fetch, signer);


async function deployToIPFSWithX402() {
  console.log("\n════════════════════════════════════════════════════════════════");
  console.log("🌐 Deploying Smart Money Intelligence to IPFS via x402");
  console.log("════════════════════════════════════════════════════════════════\n");

  // Check for private key
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("❌ Error: PRIVATE_KEY not set in .env file\n");
    process.exit(1);
  }

  // Check if data.json exists
  const dataPath = "./website/data.json";
  if (!existsSync(dataPath)) {
    console.error("❌ Error: data.json not found. Run demo_05 first to generate data.");
    process.exit(1);
  }

  console.log(`💼 Wallet: ${accountAddress}\n`);

  try {
    // Read all files
    console.log("📂 Reading files...");
    const files = [
      { name: "index.html", path: "./website/templates/index.html", contentType: "text/html" },
      { name: "style.css", path: "./website/templates/style.css", contentType: "text/css" },
      { name: "script.js", path: "./website/templates/script.js", contentType: "application/javascript" },
      { name: "data.json", path: dataPath, contentType: "application/json" }
    ];

    const fileData = files.map(f => ({
      ...f,
      content: readFileSync(f.path, "utf-8"),
      size: Buffer.from(readFileSync(f.path, "utf-8")).length
    }));

    // Helper to format bytes
    const formatBytes = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const totalSize = fileData.reduce((sum, f) => sum + f.size, 0);

    console.log("✅ Files loaded:");
    fileData.forEach(f => {
      console.log(`   - ${f.name} (${formatBytes(f.size)})`);
    });
    console.log(`   📦 Total size: ${formatBytes(totalSize)}\n`);

    // Calculate total cost
    const costPerFile = 0.01; // USDC
    const totalCost = costPerFile * files.length;
    console.log(`💰 Cost: ${costPerFile} USDC per file × ${files.length} files = ${totalCost} USDC\n`);

    // Step 1: Upload all files to RAM (FREE)
    console.log("📤 Step 1: Uploading files to RAM (FREE)...\n");

    const uploadedFiles: Array<{
      name: string;
      id: string;
      paymentUrl: string;
      size: number;
    }> = [];

    for (const file of fileData) {
      console.log(`   Uploading ${file.name}...`);

      const formData = new FormData();
      formData.append('file', Buffer.from(file.content), {
        filename: file.name,
        contentType: file.contentType
      });

      const uploadResponse = await fetchWithPay(`${IPFS_X402_API}/upload`, {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders()
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Upload failed for ${file.name}: ${uploadResponse.status}\n${errorText}`);
      }

      const uploadData = await uploadResponse.json() as UploadResponse;

      uploadedFiles.push({
        name: file.name,
        id: uploadData.id,
        paymentUrl: uploadData.paymentUrl,
        size: file.size
      });

      console.log(`   ✅ ${file.name}: ID ${uploadData.id}`);
    }

    console.log("\n✅ All files uploaded to RAM!\n");

    // Step 2: Pin files to IPFS with payment
    console.log("💳 Step 2: Paying & pinning to IPFS (0.01 USDC each)...\n");

    const pinnedFiles: Array<{
      name: string;
      ipfsHash: string;
      size: number;
    }> = [];

    for (const file of uploadedFiles) {
      console.log(`   Pinning ${file.name}...`);

      try {
        // Use fetchWithPay to make payment and pin
        const pinResponse = await fetchWithPay(
          `${IPFS_X402_API}/pin/${file.id}`,
          {
            method: 'GET'
          },
        );

        if (!pinResponse.ok) {
          const errorText = await pinResponse.text();
          console.error(`   ⚠️  Failed to pin ${file.name}: ${errorText}`);
          continue;
        }

        const pinData = await pinResponse.json() as PinResponse;

        pinnedFiles.push({
          name: file.name,
          ipfsHash: pinData.ipfsHash,
          size: file.size
        });

        console.log(`   ✅ ${file.name}: ${pinData.ipfsHash}`);

      } catch (error: any) {
        console.error(`   ⚠️  Error pinning ${file.name}:`, error.message);
      }
    }

    if (pinnedFiles.length === 0) {
      console.error("\n❌ No files were successfully pinned to IPFS");
      process.exit(1);
    }

    console.log("\n✅ Deployment successful!\n");
    console.log("════════════════════════════════════════════════════════════════");
    console.log("🌐 IPFS Deployment Complete");
    console.log("════════════════════════════════════════════════════════════════\n");

    console.log("📋 Pinned Files:");
    pinnedFiles.forEach(f => {
      console.log(`   ${f.name}: ${f.ipfsHash}`);
    });

    console.log("\n🔗 Access your files via these gateways:\n");

    // Show index.html as the main entry point
    const indexFile = pinnedFiles.find(f => f.name === "index.html");
    if (indexFile) {
      console.log("Main site (index.html):");
      GATEWAYS.forEach((gateway, idx) => {
        console.log(`   ${idx + 1}. ${gateway}/${indexFile.ipfsHash}`);
      });
      console.log("");
    }

    console.log("💡 Note: Each file is pinned separately.");
    console.log("   For production, consider bundling into a single directory upload.\n");

    // Save deployment info
    const deploymentsDir = "./deployments";
    if (!existsSync(deploymentsDir)) {
      mkdirSync(deploymentsDir, { recursive: true });
    }

    const timestamp = Date.now();
    const deploymentInfo = {
      deployed_at: new Date().toISOString(),
      method: "x402-ipfs",
      cost_usdc: totalCost,
      files: pinnedFiles.map(f => ({
        name: f.name,
        ipfsHash: f.ipfsHash,
        size: f.size,
        gateways: GATEWAYS.map(gw => `${gw}/${f.ipfsHash}`)
      })),
      main_url: indexFile ? `${GATEWAYS[0]}/${indexFile.ipfsHash}` : null
    };

    const deploymentFile = join(deploymentsDir, `x402-ipfs-${timestamp}.json`);
    writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2), "utf-8");

    console.log(`💾 Deployment info saved to: ${deploymentFile}`);
    console.log("\n✨ Your Smart Money Intelligence dashboard is now live on IPFS!");

    if (indexFile) {
      console.log(`\n🌐 Visit: ${GATEWAYS[0]}/${indexFile.ipfsHash}`);
    }

  } catch (error: any) {
    console.error("\n❌ Deployment failed:", error.message);

    if (error.message?.includes('insufficient funds')) {
      console.error("\n💰 You need USDC on Base Sepolia to pay for IPFS pinning.");
      console.error("   Get testnet USDC from a faucet or bridge.");
    }

    process.exit(1);
  }
}

// Run deployment
deployToIPFSWithX402().catch(console.error);
