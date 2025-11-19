/*
Simple client script to call x402 endpoint through HTTPayer relay (cross-chain + privacy-preserving)
*/

import { wrapFetchWithPayment, decodeXPaymentResponse, createSigner } from "x402-fetch";
import dotenv from "dotenv";
import kleur from "kleur";
import { saveResponse } from "./utils/save_resp.js";
import { logStep, logInfo, logPayment, logResponseBody, logSuccess, logError, logApiUrl } from "./utils/format_output.js";

dotenv.config();

async function testRelay() {
  let PRIVATE_KEY = process.env.PRIVATE_KEY || "";
  if (!PRIVATE_KEY.startsWith("0x")) {
    PRIVATE_KEY = `0x${PRIVATE_KEY}`;
  }

  console.log();
  console.log(kleur.bold().cyan("Demo 03: HTTPayer Relay - Cross-Chain"));
  console.log(kleur.bold().white("Pay on Base → Access Jupiter API on Solana"));
  console.log();

  logInfo("Private key detected", PRIVATE_KEY ? "✓" : "✗");

  // Create a signer using x402's createSigner helper
  const signer = await createSigner("base", PRIVATE_KEY as `0x${string}`);

  // Extract the account address for logging
  // Signer can be either a SignerWallet (with .account.address) or LocalAccount (with .address directly)
  const accountAddress = "account" in signer ? signer.account?.address : signer.address;
  logInfo("Account address", accountAddress || "N/A");
  logInfo("Payment chain", "Base");

  const RELAY_URL = "https://relay.httpayer.com";
  const TARGET_API = "https://jupiter.api.corbits.dev/ultra/v1/order";

  const callParams = {
    inputMint: "So11111111111111111111111111111111111111112", // sell SOL
    outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // buy USDC
    amount: "20000000", // 0.02 SOL
    taker: "corzHctjX9Wtcrkfxz3Se8zdXqJYCaamWcQA7vwKF7Q",
  }

  const payload = {
    api_url: TARGET_API,
    method: "GET",
    network: "base", // Specify which network the client wants to pay on
    params: callParams
  }

  // Wrap the fetch function with payment handling
  const fetchWithPay = wrapFetchWithPayment(fetch, signer);

  console.log();
  logApiUrl(RELAY_URL, "Relay URL");
  logApiUrl(TARGET_API, "Target API (Solana)");
  logInfo("Swap", "0.02 SOL → USDC");

  try {
    // Step 1: First call without payment to get HTTPayer payment instructions
    logStep(1, "Calling relay to get payment instructions");
    const firstResponse = await fetch(RELAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    logInfo("Response status", firstResponse.status);

    if (firstResponse.status === 402) {
      const paymentInstructions = await firstResponse.json();
      console.log();
      console.log(kleur.yellow("⚠ Payment required"));
      console.log(kleur.dim("Cross-chain payment: Base → Solana API"));

      // Step 2: Make payment with x402-fetch
      logStep(2, "Making cross-chain payment");
      const paidResponse = await fetchWithPay(RELAY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
      });

      logInfo("Response status", paidResponse.status);

      // Check for payment response header
      const paymentResponseHeader = paidResponse.headers.get("x-payment-response");
      let paymentResponse;
      if (paymentResponseHeader) {
        paymentResponse = decodeXPaymentResponse(paymentResponseHeader);
        logPayment(paymentResponse);
      }

      // Save the full response with metadata
      const savedFile = await saveResponse(paidResponse, "jupiter-quote", paymentResponse, {
        prefix: "demo03"
      });

      logSuccess("Response saved successfully");

      // Get response body
      const contentType = paidResponse.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const body = await paidResponse.json();
        logResponseBody(body, "Jupiter Swap Quote", savedFile);
      } else {
        const text = await paidResponse.text();
        logResponseBody(text, "Jupiter Swap Quote", savedFile);
      }
    } else if (firstResponse.status === 200) {
      // Target API doesn't require payment
      const body = await firstResponse.text();
      logSuccess("Success (no payment required)");
      logResponseBody(body, "API Response");
    } else {
      // Error
      const error = await firstResponse.text();
      logError(`Error: ${firstResponse.status} ${firstResponse.statusText}`, error);
    }
  } catch (error) {
    logError("Request failed", error);
  }
}

// Run the test
testRelay().catch(console.error);