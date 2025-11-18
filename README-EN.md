# Base Workshop - HTTPayer x402 Demos

Collection of demonstration scripts for the x402 protocol (HTTP 402 Payment Required) on Base blockchain.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Account Generation](#account-generation)
- [Demo Scripts](#demo-scripts)
- [Save Directories](#save-directories)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Node.js and npm

This project requires Node.js (version 18 or higher) and npm (included with Node.js).

**Check if you already have Node.js installed:**

```bash
node --version
npm --version
```

**If you don't have Node.js installed:**

- **Windows**: Download the installer from [nodejs.org](https://nodejs.org/) and run it
- **macOS**: Use Homebrew: `brew install node`
- **Linux**: Use your package manager:

  ```bash
  # Ubuntu/Debian
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs

  # Fedora
  sudo dnf install nodejs
  ```

## Installation

1. **Clone or download this repository**

```bash
 git clone https://github.com/HTTPayer/base-workshop
```

2. **Navigate to the project directory:**

   ```bash
   cd path-to-project
   ```

3. **Install dependencies:**

   ```bash
   npm install
   ```

   This will install all necessary packages:

   - `x402-fetch` - SDK for x402 payments
   - `viem` - Ethereum library
   - `dotenv` - Environment variable management
   - `typescript`, `tsx` - TypeScript support

4. **Compile the project:**
   ```bash
   npm run build
   ```

## Configuration

1. **Create a `.env` file based on the template:**

   ```bash
   # Unix/Mac/Linux
   cp .env.sample .env

   # Windows
   copy .env.sample .env
   ```

2. **Edit `.env` and set your values:**

   ```env
   PRIVATE_KEY=your_private_key_here
   LLM_SERVER=http://localhost:3000
   SPURO_API_URL=https://qu01n0u34hdsh6ajci1ie9trq8.ingress.akash-palmito.org
   SERVER_API_KEY=your_server_api_key
   ```

   - **PRIVATE_KEY**: Your Ethereum/Base private key (with or without `0x` prefix)
     - You'll need USDC for x402 payments
   - **LLM_SERVER**: URL of the deployed LLM server (for AI-powered demos)
   - **SPURO_API_URL**: Spuro API endpoint for Arkiv storage
   - **SERVER_API_KEY**: LLM endpoint for translation and chat

3. **Get USDC:**
   - **Airdrop**: If running project this during the scheduled base workshop, the hosts will provide USDC to your address.
   - **Buy USDC**: Use anyone of the providers listed here to buy USDC: [usdc.com/providers](https://latam.usdc.com/providers)

## Account Generation

If you need to create new Ethereum accounts for testing:

```bash
npm run generate:evm:accounts
```

This script:

- Generates new Ethereum accounts with private keys
- Saves accounts to `./accounts/`
- Displays generated addresses and private keys

Once ran, copy the private key and paste into .env as value for "PRIVATE_KEY".

## Demo Scripts

### Demo 01: Gloria AI - Basic GET Request with x402

```bash
npm run demo:01
```

**What does it do?**

- Makes a simple GET request to Gloria AI API
- Implements x402 payments using `wrapFetchWithPayment`
- Decodes and displays payment details (amount, beneficiary, transaction hash)
- Automatically saves response to `./responses/` with timestamp

**Key technologies:**

- `x402-fetch`: Payment-enabled fetch wrapper
- `createSigner`: Creates a signer for Base blockchain
- `decodeXPaymentResponse`: Decodes x402 payment headers

**Flow:**

1. Sets up signer with your `PRIVATE_KEY`
2. Wraps `fetch` with payment capabilities
3. Makes request - payment is handled automatically
4. Decodes payment info from `X-Payment` header
5. Saves response and payment metadata

### Demo 02: (Description pending)

```bash
npm run demo:02
```

### Demo 03: (Description pending)

```bash
npm run demo:03
```

### Demo 04: POST Request with x402

```bash
npm run demo:04
```

**What does it do?**

- Demonstrates a POST request with x402 payments
- Similar to demo_01 but with POST method
- Saves response using `save_resp` utility

### Demo 05: Smart Money Intelligence Generation

```bash
npm run demo:05
```

**What does it do?**

- Generates "Smart Money Intelligence" analysis
- Combines data from multiple sources (Nansen, Heurist, etc.)
- Uses LLM to create analytical summary
- Saves structured data to `./website/data.json`

**Output structure:**

```json
{
  "summary": "LLM-generated summary...",
  "generated_at": "2024-01-15T10:30:00Z",
  "metadata": {
    "data_sources": ["nansen", "heurist"],
    "analysis_date": "2024-01-15"
  },
  "nansen": {
    /* Nansen data */
  },
  "heurist": {
    /* Heurist data */
  }
}
```

### Demo 06: Multi-API with HTTPayer Relay (Cross-Chain)

```bash
npm run demo:06
```

**What does it do?**

- Demonstrates **HTTPayer Relay** for cross-chain payments
- Makes multiple API calls with different methods, payloads, and networks
- Orchestrates a complete analysis flow:
  1. Fetches Smart Money data from Nansen (Solana endpoint)
  2. Searches related news with Heurist AI (Base endpoint)
  3. Generates summary with LLM
  4. Translates summary to Spanish
- Saves combined data to `./website/data.json`

**Key features:**

- **HTTPayer Relay**: Pay on Base while accessing APIs on other networks
- **Multi-chain**: Nansen analyzes Ethereum and Solana simultaneously
- **Smart data flow**: Extracts tokens from Nansen and uses them for Heurist search
- **Auto-translation**: Converts analysis to Spanish

**Relay payload:**

```typescript
{
  api_url: "https://target-api.com/endpoint",
  method: "POST",
  network: "base", // Network you want to pay on
  data: { /* your payload */ }
}
```

**APIs used:**

- Nansen API (Smart Money Netflow)
- Heurist AI Search (crypto news)
- LLM Server (/chat and /translate)

### Demo 07: Deploy to webdb.site with Timeout Handling

```bash
npm run demo:07
```

**What does it do?**

- Deploys static content to webdb.site (decentralized storage)
- Handles long uploads with 120-second timeout
- Implements retry logic (3 max attempts) with progressive backoff
- Displays file sizes during upload
- Saves deployment response with website URL

**Special features:**

- `AbortController` for timeouts
- Automatic retries on failure
- Upload progress visualization
- Human-readable file size formatting (KB/MB)

### Demo 08: Save to Arkiv Blockchain via Spuro SDK

```bash
npm run demo:08
```

**What does it do?**

- Reads Smart Money Intelligence summary from `./website/data.json` (generated by demo_05)
- Encodes summary as hexadecimal payload
- Saves to Arkiv blockchain using Spuro SDK
- Uses `fetchWithPay` for x402 payments to Spuro
- Verifies storage by reading data back
- Saves entity record to `./arkiv/` for future reference

**Detailed flow:**

1. Checks that `./website/data.json` exists (run demo_05 first if not)
2. Extracts `websiteData.summary` from data
3. Encodes to hexadecimal with `encodePayload()`
4. Calls `createEntity()` with:
   - `fetchWithPay` - x402 enabled
   - Hexadecimal payload
   - String attributes (required by Arkiv)
   - TTL: 1 year (86400 \* 365 seconds)
5. Receives `entity_key` and `tx_hash`
6. Verifies with `readEntity()`
7. Saves local record with all metadata

**Saved attributes:**

- `generated_at`: Generation timestamp
- `data_sources`: Data sources (as JSON string)
- `analysis_date`: Analysis date
- `has_nansen_data`, `has_heurist_data`: Data availability flags

**Usage modes:**

```bash
# Default mode: save latest demo_05 summary
npm run demo:08

# Read entity by key
npm run demo:08 read <entity_key>

# Save custom data
npm run demo:08 custom '{"my": "data"}'
```

**Output:**

```
🔑 Entity Key: 0x1234...abcd
🔗 Transaction Hash: 0x5678...ef90
🔗 Spuro URL: https://qu01n0u34hdsh6ajci1ie9trq8.ingress.akash-palmito.org/entities/0x1234...abcd
💾 Entity record saved to: ./arkiv/0x1234...abcd.json
```

## Save Directories

The project creates and uses several directories for saving data:

### `./responses/`

- **Purpose**: Stores HTTP responses from x402 APIs
- **Format**: JSON with timestamp
- **Naming**: `{prefix}_{name}_{timestamp}.json`
- **Contains**:
  - Response body
  - Payment metadata (amount, beneficiary, tx_hash)
  - HTTP headers
  - Timing information
- **Generated by**: demo_01, demo_04, demo_07, etc.
- **Example**: `demo01_gloria-ai_2024-01-15T10-30-45-123Z.json`

### `./website/`

- **Purpose**: Stores structured data for website generation
- **Main file**: `data.json`
- **Generated by**: demo_05
- **Contains**: Smart Money Intelligence analysis with LLM summary
- **Used by**: demo_08 (to save to Arkiv)

### `./arkiv/`

- **Purpose**: Local records of entities saved to Arkiv blockchain
- **Format**: JSON with entity_key as filename
- **Generated by**: demo_08
- **Contains**:
  - `entity_key`: Unique identifier on Arkiv
  - `tx_hash`: Blockchain transaction hash
  - `spuro_url`: URL to access data
  - `owner`: Owner address
  - `saved_at`: Timestamp
  - `summary`: Copy of saved summary
- **Example**: `0x1234...abcd.json`

### `./accounts/`

- **Purpose**: Locally generated Ethereum accounts
- **Generated by**: `npm run generate:evm:accounts`
- **Format**: JSON with address, private key, etc.
- **Security**: Never share these files or upload to Git

### `./deployments/`

- **Purpose**: Deployment records (contracts, websites)
- **Generated by**: Deployment scripts
- **Contains**: Addresses, URLs, deployment configuration

### `./dist/`

- **Purpose**: Compiled TypeScript code
- **Generated by**: `npm run build`
- **Not versioned**: Excluded in `.gitignore`

### `./node_modules/`

- **Purpose**: npm dependencies
- **Generated by**: `npm install`
- **Not versioned**: Excluded in `.gitignore`

## Utilities

### `scripts/utils/save_resp.ts`

Shared utility for saving HTTP responses with automatic timestamping.

**Functions:**

1. **`saveResponse(response, name, paymentInfo, options?)`**

   - Saves complete response with metadata
   - Includes x402 payment information
   - Adds headers and timing

2. **`saveResponseBody(response, name, options?)`**
   - Saves only response body
   - Lighter, for simple data

**Options:**

- `dir`: Custom directory (default: `./responses`)
- `prefix`: Filename prefix (default: `""`)

## Troubleshooting

### Error: "Cannot find module 'x402-fetch'"

**Solution:**

```bash
npm install
```

Make sure `tsconfig.json` has `"moduleResolution": "bundler"`.

### Error: "Signer type incompatible"

**Cause**: Using `createWalletClient` from viem instead of `createSigner` from x402-fetch.

**Solution**: Always use:

```typescript
import { createSigner } from "x402-fetch";
const signer = await createSigner("base", PRIVATE_KEY as `0x${string}`);
```

### Error: "524 Timeout" in demo_07

**Cause**: Very large upload or slow connection.

**Solution**: The script already includes:

- 120-second timeout
- 3 automatic retries
- Progressive backoff

If it persists, check your internet connection or the size of files being uploaded.

### Error: "rlp: expected input string" in demo_08

**Cause**: Attributes in Spuro must be strings.

**Solution**: Already implemented - all attributes are converted:

```typescript
attributes: {
  data_sources: JSON.stringify(array),  // Arrays → JSON string
  has_data: String(boolean),             // Booleans → string
  timestamp: dateString || ""            // Strings with fallback
}
```

### Error: "No website data found" in demo_08

**Cause**: Missing `./website/data.json` file.

**Solution**: Run demo_05 first:

```bash
npm run demo:05
npm run demo:08
```

### Error: "Insufficient funds"

**Cause**: Not enough USDC (for x402 payments).

**Solution**:

1. Buy USDC

### Script hangs without error

**Possible causes**:

1. Missing `.env` file
2. Invalid `PRIVATE_KEY`
3. Network issues

**Diagnostic steps**:

```bash
# 1. Check that .env exists
cat .env

# 2. Verify PRIVATE_KEY format (should be 64 hex characters)
# 3. Test with demo_01 (simpler)
npm run demo:01
```

## Additional Resources

- **x402 Documentation**: [GitHub x402](https://github.com/x402)
- **HTTPayer**: [GitHub HTTPayer](https://github.com/HTTPayer)
- **Spuro SDK**: Arkiv API for blockchain storage
- **Base Network**: [docs.base.org](https://docs.base.org)
- **Viem Documentation**: [viem.sh](https://viem.sh)

## Security

- **NEVER** upload your `.env` file to GitHub
- **NEVER** use your main wallet for testing
- The `.gitignore` file is configured to protect sensitive files

## Notes

- All scripts use **Base** mainnet by default
- x402 payments are automatic once the signer is configured
- Responses are automatically saved with timestamps for easy auditing
- Spuro requires x402 payments for all operations (read and write)
- Arkiv blockchain provides decentralized immutable storage

## License

TBA

---

**Need help?** Open an issue on the [GitHub repository](https://github.com/HTTPayer/base-workshop).
