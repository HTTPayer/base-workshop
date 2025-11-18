# Utility: save_resp

Utility functions for saving HTTP responses with timestamps.

## Functions

### `saveResponse(response, name, paymentInfo?, options?)`

Saves the complete response with metadata including headers, status, and payment information.

**Parameters:**
- `response: Response` - The fetch Response object to save
- `name: string` - Base name for the file (e.g., "gloria-ai", "e2b")
- `paymentInfo?: any` - Optional payment information from x-payment-response header
- `options?: SaveOptions` - Additional options:
  - `dir?: string` - Directory to save to (default: `./responses`)
  - `prefix?: string` - Prefix for the filename (e.g., "demo01")
  - `includeHeaders?: boolean` - Whether to include headers (default: `true`)

**Returns:** `Promise<string>` - Path to the saved file

**Example:**
```typescript
import { saveResponse } from "./utils/save_resp.js";

const response = await fetchWithPay(url);
const paymentInfo = decodeXPaymentResponse(
  response.headers.get("x-payment-response")
);

await saveResponse(response, "gloria-ai", paymentInfo, {
  prefix: "demo01"
});
```

**Saved file structure:**
```json
{
  "timestamp": "2025-01-18T15:30:45.123Z",
  "url": "https://api.itsgloria.ai/news",
  "status": 200,
  "statusText": "OK",
  "headers": {
    "content-type": "application/json",
    "x-payment-response": "..."
  },
  "body": { ... },
  "paymentInfo": { ... }
}
```

### `saveResponseBody(response, name, options?)`

Saves only the response body without metadata.

**Parameters:**
- `response: Response` - The fetch Response object to save
- `name: string` - Base name for the file
- `options?: SaveOptions` - Additional options:
  - `dir?: string` - Directory to save to (default: `./responses`)
  - `prefix?: string` - Prefix for the filename

**Returns:** `Promise<string>` - Path to the saved file

**Example:**
```typescript
import { saveResponseBody } from "./utils/save_resp.js";

const response = await fetchWithPay(url);
await saveResponseBody(response, "gloria-ai", {
  prefix: "demo01"
});
```

## File Naming Convention

Files are saved with the following naming pattern:
```
{prefix}_{name}_{timestamp}.{ext}
```

Examples:
- `demo01_gloria-ai_2025-01-18T15-30-45-123Z.json`
- `demo02_e2b_2025-01-18T15-31-20-456Z.json`
- `result_2025-01-18T15-32-10-789Z.txt`

## Default Directories

- **Responses directory:** `./responses/` (automatically created)
- **Gitignored:** The `responses/` directory is added to `.gitignore` to avoid committing saved responses

## Usage in Demo Scripts

```typescript
import { saveResponse, saveResponseBody } from "./utils/save_resp.js";
import { wrapFetchWithPayment, decodeXPaymentResponse, createSigner } from "x402-fetch";

async function demo() {
  // ... setup signer ...

  const fetchWithPay = wrapFetchWithPayment(fetch, signer);
  const response = await fetchWithPay(url);

  // Get payment info
  const paymentResponseHeader = response.headers.get("x-payment-response");
  const paymentInfo = paymentResponseHeader
    ? decodeXPaymentResponse(paymentResponseHeader)
    : undefined;

  // Save full response with metadata
  await saveResponse(response, "api-name", paymentInfo, {
    prefix: "demo01"
  });

  // Or save just the body
  await saveResponseBody(response, "api-name", {
    prefix: "demo01"
  });
}
```

## Notes

- The utility automatically creates the `responses/` directory if it doesn't exist
- Responses can be read multiple times because the utility uses `response.clone()`
- JSON responses are pretty-printed with 2-space indentation
- Timestamps use ISO 8601 format with colons and dots replaced by dashes for filesystem compatibility
