/*
Multi-API calls + LLM with varying networks, methods, and payloads, powered by HTTPayer Relay
*/

import { wrapFetchWithPayment, decodeXPaymentResponse, createSigner } from "x402-fetch";
import dotenv from "dotenv";
import { saveResponse } from "./utils/save_resp.js";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

dotenv.config();

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

// First we get nansen data (solana)
async function getNansenData(fetchWithPay: typeof fetch) {
  const RELAY_URL = "https://relay.httpayer.com";
  const TARGET_API = "https://nansen.api.corbits.dev/api/v1/smart-money/netflow";

  const requestData = {
    chains: [
        "ethereum",
        "solana"
    ],
    filters: {
        exclude_smart_money_labels: [
        "30D Smart Trader"
        ],
        include_native_tokens: false,
        include_smart_money_labels: [
        "Fund",
        "Smart Trader"
        ],
        include_stablecoins: true
    },
    pagination: {
        page: 1,
        per_page: 10
    },
    order_by: [
        {
        field: "chain",
        direction: "ASC"
        }
    ]
  };

  const payload = {
    api_url: TARGET_API,
    method: "POST",
    network: "base", // Specify which network the client wants to pay on
    data: requestData
  }

  try {
    const paidResponse = await fetchWithPay(RELAY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
      });

    // Extract payment info
    const paymentResponseHeader = paidResponse.headers.get("x-payment-response");
    let paymentResponse;
    if (paymentResponseHeader) {
      paymentResponse = decodeXPaymentResponse(paymentResponseHeader);
      console.log("[client] Payment executed:", JSON.stringify(paymentResponse, null, 2));
    }

    // Save response
    await saveResponse(paidResponse, "nansen-netflow", paymentResponse, {
      prefix: "demo05"
    });

    const contentType = paidResponse.headers.get("content-type");
    const body = await paidResponse.json();
    console.log("[client] Nansen response received");
    return body;
  } catch (error) {
    console.error("[client] Error during Nansen data fetch:", error);
  }

}

// then we extract tokens and pass to heurist for news (base)
async function getHeuristSearch(fetchWithPay: typeof fetch, nansenData: any) {
  const RELAY_URL = "https://relay.httpayer.com";
  const TARGET_API = "https://mesh.heurist.xyz/x402/agents/ExaSearchDigestAgent/exa_web_search";

  // Extract token symbols and sectors from Nansen data
  const tokens = nansenData?.data || [];
  const tokenSymbols = tokens.map((t: any) => t.token_symbol).filter(Boolean);
  const sectors = [...new Set(tokens.flatMap((t: any) => t.token_sectors || []))];

  // Create a focused search query
  const searchTerm = `Recent cryptocurrency news and market analysis for tokens: ${tokenSymbols.join(', ')}. Focus on ${sectors.join(', ')} sectors.`;

  console.log("[client] Calling:", `${TARGET_API}`);
  console.log("[client] Search term:", searchTerm);

  const payload = {
    api_url: TARGET_API,
    method: "POST",
    network: "base", // Specify which network the client wants to pay on
    data: {
        search_term: searchTerm,
        limit: 5,
        time_filter: "past_week",
    }
  }

  const paidResponse = await fetchWithPay(RELAY_URL, {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify(payload),
  });

  // Extract payment info
  const paymentResponseHeader = paidResponse.headers.get("x-payment-response");
  let paymentResponse;
  if (paymentResponseHeader) {
    paymentResponse = decodeXPaymentResponse(paymentResponseHeader);
    console.log("[client] Payment executed:", JSON.stringify(paymentResponse, null, 2));
  }

  // Save response
  await saveResponse(paidResponse, "heurist-search", paymentResponse, {
    prefix: "demo05"
  });

  const contentType = paidResponse.headers.get("content-type");
  let body;
  if (contentType?.includes("application/json")) {
        body = await paidResponse.json();
        console.log("[client] Heurist response received");
      } else {
        body = await paidResponse.text();
        console.log("[client] Heurist response received");
      }

  return body;

}

// then we summarize with gpt-4
async function summarizeWithLLM(fetchWithPay: typeof fetch, nansenData: any, heuristData: any, translate: boolean = true) {
  const TARGET_API = `${LLM_SERVER}/chat`;
  console.log("[client] Calling LLM:", `${TARGET_API}`);

  const requestData = {
    "messages": [
        {
        "role": "system",
        "content": "You are a helpful assistant that analyzes cryptocurrency smart money flows and related news to provide actionable insights."
        },
        {
            "role": "user",
            "content": `Analyze the following data:

SMART MONEY TOKEN FLOWS (from Nansen):
${JSON.stringify(nansenData, null, 2)}

RELATED NEWS & MARKET ANALYSIS (from Heurist):
${JSON.stringify(heuristData, null, 2)}

Provide a concise summary that:
1. Identifies which tokens smart money is accumulating or selling
2. Explains potential reasons based on the news articles
3. Highlights key trends or opportunities`
        }
    ]
  }

  const paidResponse = await fetchWithPay(TARGET_API, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.SERVER_API_KEY
    },
    body: JSON.stringify(requestData),
  });

  // Extract payment info
  const paymentResponseHeader = paidResponse.headers.get("x-payment-response");
  let paymentResponse;
  if (paymentResponseHeader) {
    paymentResponse = decodeXPaymentResponse(paymentResponseHeader);
    console.log("[client] Payment executed:", JSON.stringify(paymentResponse, null, 2));
  }

  // Save response
  await saveResponse(paidResponse, "llm-chat", paymentResponse, {
    prefix: "demo05"
  });

  const contentType = paidResponse.headers.get("content-type");
  let chatBody;
  if (contentType?.includes("application/json")) {
        chatBody = await paidResponse.json();
        console.log("[client] Chat response received");
      } else {
        chatBody = await paidResponse.text();
        console.log("[client] Chat response received");
      }

  // If translate is true, pass the response to /translate
  if (translate) {
    console.log("[client] Translation requested, calling /translate...");
    const translatedBody = await translateText(fetchWithPay, chatBody);
    return translatedBody;
  }

  return chatBody;
}

// translate text to Spanish
async function translateText(fetchWithPay: typeof fetch, text: any) {
  const TARGET_API = `${LLM_SERVER}/translate`;
  console.log("[client] Calling translate API:", `${TARGET_API}`);

  const requestData = {
    text: typeof text === 'string' ? text : JSON.stringify(text),
    target_language: "es" // Spanish
  }

  const paidResponse = await fetchWithPay(TARGET_API, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.SERVER_API_KEY
    },
    body: JSON.stringify(requestData),
  });

  // Extract payment info
  const paymentResponseHeader = paidResponse.headers.get("x-payment-response");
  let paymentResponse;
  if (paymentResponseHeader) {
    paymentResponse = decodeXPaymentResponse(paymentResponseHeader);
    console.log("[client] Payment executed:", JSON.stringify(paymentResponse, null, 2));
  }

  // Save response
  await saveResponse(paidResponse, "llm-translate", paymentResponse, {
    prefix: "demo05"
  });

  const contentType = paidResponse.headers.get("content-type");
  let translatedBody;
  if (contentType?.includes("application/json")) {
        translatedBody = await paidResponse.json();
        console.log("[client] Translation response received");
      } else {
        translatedBody = await paidResponse.text();
        console.log("[client] Translation response received");
      }

  return translatedBody;
}

// Main execution function
async function runDemo() {
  try {
    console.log("\n=== Step 1: Get Nansen Smart Money Data ===");
    const nansenData = await getNansenData(fetchWithPay);

    console.log("\n=== Step 2: Get Heurist News Search ===");
    const heuristData = await getHeuristSearch(fetchWithPay, nansenData);

    console.log("\n=== Step 3: Summarize with LLM (with translation) ===");
    const summary = await summarizeWithLLM(fetchWithPay, nansenData, heuristData, true); // translate = true by default

    console.log("\n=== Final Result ===");
    console.log(JSON.stringify(summary, null, 2));

    // Save combined data for website
    console.log("\n=== Step 4: Saving data for website ===");
    const websiteDir = "./website";
    if (!existsSync(websiteDir)) {
      mkdirSync(websiteDir, { recursive: true });
    }

    const websiteData = {
      generated_at: new Date().toISOString(),
      nansen: nansenData,
      heurist: heuristData,
      summary: summary,
      metadata: {
        data_sources: ["Nansen Smart Money", "Heurist AI Search"],
        analysis_date: new Date().toISOString()
      }
    };

    const dataPath = join(websiteDir, "data.json");
    writeFileSync(dataPath, JSON.stringify(websiteData, null, 2), "utf-8");
    console.log(`✅ Website data saved to: ${dataPath}`);

  } catch (error) {
    console.error("[client] Demo failed:", error);
  }
}

// Run the demo
runDemo().catch(console.error);