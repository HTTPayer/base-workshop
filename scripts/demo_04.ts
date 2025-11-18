/*
Simple client script to call x402 endpoint through HTTPayer relay (cross-chain + privacy-preserving)
*/

import { wrapFetchWithPayment, decodeXPaymentResponse, createSigner } from "x402-fetch";
import dotenv from "dotenv";

dotenv.config();

async function testRelay() {
  let PRIVATE_KEY = process.env.PRIVATE_KEY || "";
  if (!PRIVATE_KEY.startsWith("0x")) {
    PRIVATE_KEY = `0x${PRIVATE_KEY}`;
  }
  console.log("[client] PRIVATE_KEY detected:", PRIVATE_KEY ? true : false);

  // Create a signer using x402's createSigner helper
  const signer = await createSigner("base", PRIVATE_KEY as `0x${string}`);

  // Extract the account address for logging
  // Signer can be either a SignerWallet (with .account.address) or LocalAccount (with .address directly)
  const accountAddress = "account" in signer ? signer.account?.address : signer.address;
  console.log("[client] Using account address:", accountAddress || "N/A");
  console.log("[client] Using chain: Base");

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
        include_stablecoins: false
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

  // Wrap the fetch function with payment handling
  const fetchWithPay = wrapFetchWithPayment(fetch, signer);
  console.log("[client] Testing relay endpoint...");
  console.log("[client] Target API:", TARGET_API);
  console.log("[client] Payload:", payload);

  try {
    // Step 1: First call without payment to get HTTPayer payment instructions
    console.log("\n[client] Step 1: Calling relay without payment to get instructions...");
    const firstResponse = await fetch(RELAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log("[client] First response status:", firstResponse.status);

    if (firstResponse.status === 402) {
      const paymentInstructions = await firstResponse.json();
      console.log("[client] Payment required. Instructions:", JSON.stringify(paymentInstructions, null, 2));

      // Step 2: Make payment with x402-fetch
      console.log("\n[client] Step 2: Making payment and retrying...");
      const paidResponse = await fetchWithPay(RELAY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
      });

      console.log("[client] Paid response status:", paidResponse.status);

      // Check for payment response header
      const paymentResponseHeader = paidResponse.headers.get("x-payment-response");
      if (paymentResponseHeader) {
        const paymentResponse = decodeXPaymentResponse(paymentResponseHeader);
        console.log("[client] Payment executed:", JSON.stringify(paymentResponse, null, 2));
      }

      // Get response body
      const contentType = paidResponse.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const body = await paidResponse.json();
        console.log("[client] Response body:", JSON.stringify(body, null, 2));
      } else {
        const text = await paidResponse.text();
        console.log("[client] Response body:", text);
      }
    } else if (firstResponse.status === 200) {
      // Target API doesn't require payment
      const body = await firstResponse.text();
      console.log("[client] Success (no payment required):", body);
    } else {
      // Error
      const error = await firstResponse.text();
      console.error("[client] Error:", firstResponse.status, error);
    }
  } catch (error) {
    console.error("[client] Request failed:", error);
  }
}

// Run the test
testRelay().catch(console.error);