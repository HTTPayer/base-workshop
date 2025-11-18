/*
Save JSON response summaries to Arkiv via Spuro SDK
This script takes response data and stores it permanently on Arkiv blockchain
*/

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import dotenv from "dotenv";
import { wrapFetchWithPayment, decodeXPaymentResponse, createSigner } from "x402-fetch";
import {
  createEntity,
  readEntity,
  encodePayload,
  decodePayload,
  type CreateEntityResponse,
  type ReadEntityResponse
} from "../src/spuroSdk.js";

dotenv.config();

const SPURO_API_URL = process.env.SPURO_API_URL || "https://qu01n0u34hdsh6ajci1ie9trq8.ingress.akash-palmito.org";

// Setup x402 payment-enabled fetch
let PRIVATE_KEY = process.env.PRIVATE_KEY || "";
if (!PRIVATE_KEY.startsWith("0x")) {
  PRIVATE_KEY = `0x${PRIVATE_KEY}`;
}

console.log("[demo_08] PRIVATE_KEY detected:", PRIVATE_KEY ? true : false);

// Create a signer using x402's createSigner helper
const signer = await createSigner("base", PRIVATE_KEY as `0x${string}`);

// Extract the account address for logging
const accountAddress = "account" in signer ? signer.account?.address : signer.address;
console.log("[demo_08] Using account address:", accountAddress || "N/A");
console.log("[demo_08] Using chain: Base");

// Wrap the fetch function with payment handling
const fetchWithPay = wrapFetchWithPayment(fetch, signer);

async function saveToArkiv(data: any, options: {
  ttl?: number;
  attributes?: Record<string, any>;
  description?: string;
} = {}) {
  const {
    ttl = 86400 * 365, // 1 year default
    attributes = {},
    description = "Response data"
  } = options;

  console.log(`\n📦 Preparing to save ${description} to Arkiv...`);

  // Convert data to JSON string
  const jsonPayload = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

  // Encode to hex for Spuro
  const hexPayload = encodePayload(jsonPayload);

  console.log(`   📊 Payload size: ${(jsonPayload.length / 1024).toFixed(2)} KB`);
  console.log(`   🔢 Hex size: ${(hexPayload.length / 1024).toFixed(2)} KB`);
  console.log(`   ⏱️  TTL: ${ttl} seconds (${(ttl / 86400).toFixed(1)} days)`);

  try {
    console.log(`\n🚀 Uploading to Arkiv blockchain via Spuro (with x402 payment)...`);

    const result: CreateEntityResponse = await createEntity(
      fetchWithPay, // Use payment-enabled fetch
      SPURO_API_URL,
      {
        payload: hexPayload,
        content_type: 'application/json',
        attributes: {
          ...attributes,
          saved_at: new Date().toISOString(),
          source: "demo_08"
        },
        ttl
      }
    );

    console.log(`✅ Saved to Arkiv blockchain!`);
    console.log(`   🔑 Entity Key: ${result.entity_key}`);
    console.log(`   🔗 Transaction Hash: ${result.tx_hash}`);

    return result;

  } catch (error) {
    console.error(`❌ Failed to save to Arkiv:`, error);
    throw error;
  }
}

async function readFromArkiv(entityKey: string) {
  console.log(`\n📖 Reading from Arkiv...`);
  console.log(`   🔑 Entity Key: ${entityKey}`);

  try {
    const result: ReadEntityResponse = await readEntity(
      fetchWithPay, // Use payment-enabled fetch
      SPURO_API_URL,
      entityKey
    );

    console.log(`✅ Retrieved from Arkiv blockchain!`);
    console.log(`   👤 Owner: ${result.entity.owner}`);
    console.log(`   📄 Content Type: ${result.entity.content_type}`);

    // Decode the hex payload
    const decodedData = decodePayload(result.data);

    return {
      ...result,
      decodedData
    };

  } catch (error) {
    console.error(`❌ Failed to read from Arkiv:`, error);
    throw error;
  }
}

async function saveLatestResponse() {
  console.log("\n════════════════════════════════════════════════════════════════");
  console.log("💾 Save Smart Money Summary to Arkiv Blockchain via Spuro");
  console.log("════════════════════════════════════════════════════════════════");
  console.log(`🌐 Spuro API: ${SPURO_API_URL}`);
  console.log("════════════════════════════════════════════════════════════════\n");

  // Check if website data.json exists
  const dataPath = "./website/data.json";
  if (!existsSync(dataPath)) {
    console.error("❌ No website data found at ./website/data.json");
    console.log("💡 Run demo:05 first to generate the Smart Money Intelligence data.\n");
    process.exit(1);
  }

  console.log(`📄 Reading Smart Money Intelligence data from: ${dataPath}\n`);

  // Read the website data file
  const websiteData = JSON.parse(readFileSync(dataPath, 'utf-8'));

  // Extract the summary (which is the LLM-generated analysis)
  const summary = websiteData.summary;

  // Save to Arkiv
  // Note: All attribute values must be strings for Arkiv
  const arkivResult = await saveToArkiv(summary, {
    description: "Smart Money Intelligence Summary",
    attributes: {
      generated_at: websiteData.generated_at || "",
      data_sources: JSON.stringify(websiteData.metadata?.data_sources || []),
      analysis_date: websiteData.metadata?.analysis_date || "",
      has_nansen_data: String(!!websiteData.nansen),
      has_heurist_data: String(!!websiteData.heurist)
    },
    ttl: 86400 * 365 // 1 year
  });

  // Verify by reading it back
  console.log(`\n🔍 Verifying storage...`);
  const verifyResult = await readFromArkiv(arkivResult.entity_key);

  // Parse the decoded payload to show it
  const storedData = JSON.parse(verifyResult.decodedData);
  console.log(`\n📋 Stored Data:`);
  console.log(JSON.stringify(storedData, null, 2));

  // Save entity key for later reference
  const arkivDir = "./arkiv";
  if (!existsSync(arkivDir)) {
    mkdirSync(arkivDir, { recursive: true });
  }

  const entityRecord = {
    entity_key: arkivResult.entity_key,
    tx_hash: arkivResult.tx_hash,
    source_file: "website/data.json",
    saved_at: new Date().toISOString(),
    spuro_url: `${SPURO_API_URL}/entities/${arkivResult.entity_key}`,
    owner: verifyResult.entity.owner,
    generated_at: websiteData.generated_at,
    data_sources: websiteData.metadata?.data_sources || [],
    summary: storedData
  };

  const recordFile = join(arkivDir, `${arkivResult.entity_key}.json`);
  writeFileSync(recordFile, JSON.stringify(entityRecord, null, 2), 'utf-8');

  console.log(`\n💾 Entity record saved to: ${recordFile}`);

  console.log("\n════════════════════════════════════════════════════════════════");
  console.log("✅ Success! Response saved to Arkiv blockchain via Spuro");
  console.log("════════════════════════════════════════════════════════════════");
  console.log(`\n🔗 Spuro URL: ${SPURO_API_URL}/entities/${arkivResult.entity_key}`);
  console.log(`🔑 Entity Key: ${arkivResult.entity_key}`);
  console.log(`🔗 Transaction Hash: ${arkivResult.tx_hash}`);
  console.log(`\n💡 This data is now permanently stored on the Arkiv blockchain!`);
  console.log(`   You can retrieve it anytime using the entity key.\n`);
}

// Alternative: Save specific data directly
async function saveCustomData(data: any, description: string) {
  console.log("\n════════════════════════════════════════════════════════════════");
  console.log(`💾 Save Custom Data: ${description}`);
  console.log("════════════════════════════════════════════════════════════════\n");

  const arkivResult = await saveToArkiv(data, {
    description,
    attributes: {
      type: "custom_data"
    }
  });

  console.log(`\n✅ Saved to Arkiv via Spuro!`);
  console.log(`🔑 Entity Key: ${arkivResult.entity_key}`);
  console.log(`🔗 URL: ${SPURO_API_URL}/entities/${arkivResult.entity_key}\n`);

  return arkivResult.entity_key;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'read' && args[1]) {
    // Read mode: retrieve entity by key
    const entityKey = args[1];
    const result = await readFromArkiv(entityKey);
    console.log(`\n📄 Decoded Payload:`);
    console.log(result.decodedData);
  } else if (command === 'custom' && args[1]) {
    // Custom mode: save provided JSON string
    const data = JSON.parse(args[1]);
    await saveCustomData(data, "Custom data");
  } else {
    // Default mode: save latest response
    await saveLatestResponse();
  }
}

// Run the script
main().catch(error => {
  console.error("\n❌ Error:", error);
  process.exit(1);
});
