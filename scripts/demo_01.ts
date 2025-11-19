/*
Simple client script to call a x402 endpoint (Gloria AI)
*/

import { wrapFetchWithPayment, decodeXPaymentResponse, createSigner } from "x402-fetch";
import dotenv from "dotenv";
import kleur from "kleur";
import { saveResponse, saveResponseBody } from "./utils/save_resp.js";
import { logStep, logInfo, logPayment, logResponseBody, logSuccess, logError, logApiUrl } from "./utils/format_output.js";

dotenv.config();

// Make a request that may require payment
async function testClient() {
  let PRIVATE_KEY = process.env.PRIVATE_KEY || "";
  if (!PRIVATE_KEY.startsWith("0x")) {
    PRIVATE_KEY = `0x${PRIVATE_KEY}`;
  }

  console.log();
  console.log(kleur.bold().cyan("Demo 01: Truecast - Pago x402 Básico"));
  console.log(kleur.bold().white("Solicitud POST con pago automático de USDC en Base"));
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
  const requestData = {
    prompt: "The x402 protocol is growing fast, and it enables developers to monetize applications with ease.",
  }

  const TARGET_API = "https://true-cast-agent.vercel.app/api/trueCast";
  console.log();
  logApiUrl(TARGET_API);

  try {
    // Step 1: First call without payment to get HTTPayer payment instructions
    logStep(1, "Solicitud inicial para verificar requisito de pago");
    const firstResponse = await fetch(TARGET_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
        },
      body: JSON.stringify(requestData)
    });

    logInfo("Response status", firstResponse.status);

    if (firstResponse.status === 402) {
      const paymentInstructions = await firstResponse.json();
      console.log();
      console.log(kleur.yellow("⚠ Payment required"));
      console.log(kleur.dim("Payment instructions received"));

      // Step 2: Make payment with x402-fetch
      logStep(2, "Realizando pago con x402-fetch");
      const paidResponse = await fetchWithPay(TARGET_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestData)
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
      const savedFile = await saveResponse(paidResponse, "trueCast", paymentResponse, {
        prefix: "demo01"
      });

      logSuccess("Response saved successfully");

      // Get response body for display
      const contentType = paidResponse.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const body = await paidResponse.json();
        logResponseBody(body, "API Response", savedFile);
      } else {
        const text = await paidResponse.text();
        logResponseBody(text, "API Response", savedFile);
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
testClient().catch(console.error);
