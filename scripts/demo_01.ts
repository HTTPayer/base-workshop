/*
Simple client script to call a x402 endpoint (Gloria AI)
*/

import { wrapFetchWithPayment, decodeXPaymentResponse, createSigner } from "x402-fetch";
import dotenv from "dotenv";
import { saveResponse, saveResponseBody } from "./utils/save_resp.js";

dotenv.config();

// Make a request that may require payment
async function testClient() {
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

  // Wrap the fetch function with payment handling
  const fetchWithPay = wrapFetchWithPayment(fetch, signer);

  const TARGET_API = "https://api.itsgloria.ai/news?feed_categories=ai,crypto";
  console.log("[client] Calling:", `${TARGET_API}`);

  try {
    // Step 1: First call without payment to get HTTPayer payment instructions
    console.log("\n[client] Step 1: Calling relay without payment to get instructions...");
    const firstResponse = await fetch(TARGET_API, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
        },
    });

    console.log("[client] First response status:", firstResponse.status);

    if (firstResponse.status === 402) {
      const paymentInstructions = await firstResponse.json();
      console.log("[client] Payment required. Instructions:", JSON.stringify(paymentInstructions, null, 2));

      // Step 2: Make payment with x402-fetch
      console.log("\n[client] Step 2: Making payment and retrying...");
      const paidResponse = await fetchWithPay(TARGET_API, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
      });

      console.log("[client] Paid response status:", paidResponse.status);

      // Check for payment response header
      const paymentResponseHeader = paidResponse.headers.get("x-payment-response");
      let paymentResponse;
      if (paymentResponseHeader) {
        paymentResponse = decodeXPaymentResponse(paymentResponseHeader);
        console.log("[client] Payment executed:", JSON.stringify(paymentResponse, null, 2));
      }

      // Save the full response with metadata
      await saveResponse(paidResponse, "gloria-ai", paymentResponse, {
        prefix: "demo01"
      });

      // Get response body for display
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
testClient().catch(console.error);
