/*
Simple client script to call compute x402 endpoint and store result via Arkiv blockchain via Spuro
*/

import { wrapFetchWithPayment, decodeXPaymentResponse, createSigner } from "x402-fetch";
import dotenv from "dotenv";
import kleur from "kleur";
import { saveResponse } from "./utils/save_resp.js";
import { logStep, logInfo, logPayment, logResponseBody, logSuccess, logError, logApiUrl } from "./utils/format_output.js";

dotenv.config();

interface ExecuteRequest {
  snippet: string;
}

interface ExecuteResponse {
  // Add expected response fields based on your API
  result?: string;
  output?: string;
  error?: string;
  [key: string]: any;
}

// Make a request that may require payment
async function testClient() {
  let PRIVATE_KEY = process.env.PRIVATE_KEY || "";
  if (!PRIVATE_KEY.startsWith("0x")) {
    PRIVATE_KEY = `0x${PRIVATE_KEY}`;
  }

  console.log();
  console.log(kleur.bold().cyan("Demo 05: E2B Code Execution API"));
  console.log(kleur.bold().white("Execute Python code in secure sandbox"));
  console.log();

  logInfo("Private key detected", PRIVATE_KEY ? "✓" : "✗");

  // Create a signer using x402's createSigner helper
  const signer = await createSigner("base", PRIVATE_KEY as `0x${string}`);

  // Extract the account address for logging
  // Signer can be either a SignerWallet (with .account.address) or LocalAccount (with .address directly)
  const accountAddress = "account" in signer ? signer.account?.address : signer.address;
  logInfo("Account address", accountAddress || "N/A");
  logInfo("Chain", "Base");

  // Wrap the fetch function with payment handling
  const fetchWithPay = wrapFetchWithPayment(fetch, signer);

  const TARGET_API = "https://echo.router.merit.systems/resource/e2b/execute";
  const payload: ExecuteRequest = {
    snippet: 'print("Hello World!")'
  };

  console.log();
  logApiUrl(TARGET_API);
  logInfo("Code snippet", payload.snippet);

  try {
    // Step 1: First call without payment to get HTTPayer payment instructions
    logStep(1, "Initial request to check payment requirement");
    const firstResponse = await fetch(TARGET_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
        },
      body: JSON.stringify(payload)
    });

    logInfo("Response status", firstResponse.status);

    if (firstResponse.status === 402) {
      const paymentInstructions = await firstResponse.json();
      console.log();
      console.log(kleur.yellow("⚠ Payment required"));
      console.log(kleur.dim("Payment instructions received"));

      // Step 2: Make payment with x402-fetch
      logStep(2, "Executing code with payment");
      const paidResponse = await fetchWithPay(TARGET_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
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
      const savedFile = await saveResponse(paidResponse, "e2b-execute", paymentResponse, {
        prefix: "demo05"
      });

      logSuccess("Response saved successfully");

      // Get response body for display
      const contentType = paidResponse.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const body = await paidResponse.json();
        logResponseBody(body, "Code Execution Result", savedFile);
      } else {
        const text = await paidResponse.text();
        logResponseBody(text, "Code Execution Result", savedFile);
      }
    } else if (firstResponse.status === 200) {
      // Target API doesn't require payment
      const body = await firstResponse.text();
      logSuccess("Success (no payment required)");
      logResponseBody(body, "Code Execution Result");
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
testClient().catch(console.error);

