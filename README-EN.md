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
   LLM_SERVER=https://api.httpayer.com/llm
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

### Demo 02: HTTPayer Relay - Same-Chain with Privacy

```bash
npm run demo:02
```

**What does it do?**

- Demonstrates **HTTPayer Relay** for privacy-preserving payments
- Makes a POST request to Heurist AI Search through the relay
- Pays on Base while accessing Heurist API (also on Base)
- Shows how relay hides your wallet address from the target API

**Key features:**

- **Privacy-preserving**: Target API doesn't see your wallet address
- **HTTPayer Relay**: Intermediary handles payment forwarding
- **AI-powered search**: Searches for "latest advancements in AI-powered search engines"
- **Two-step flow**: First call gets payment instructions (402), second call pays and retrieves data

**Relay payload:**

```typescript
{
  api_url: "https://mesh.heurist.xyz/x402/agents/ExaSearchDigestAgent/exa_web_search",
  method: "POST",
  network: "base",
  data: {
    search_term: "latest advancements in AI-powered search engines",
    limit: 5,
    time_filter: "past_week",
    include_domains: ["https://hackernoon.com"]
  }
}
```

**Flow:**

1. Call relay without payment → Receive 402 Payment Required
2. Extract payment instructions from response
3. Make payment with `wrapFetchWithPayment`
4. Receive search results from Heurist AI

### Demo 03: HTTPayer Relay - Cross-Chain (Base → Solana)

```bash
npm run demo:03
```

**What does it do?**

- Demonstrates **cross-chain** capabilities of HTTPayer Relay
- Pays with USDC on **Base** blockchain
- Accesses **Jupiter API** on **Solana** (DEX aggregator)
- Gets a quote for swapping 0.02 SOL → USDC

**Key features:**

- **Cross-chain payment**: Pay on one chain, access API on another
- **Jupiter integration**: Solana's premier DEX aggregator
- **Real DeFi use case**: Get swap quotes without having Solana wallet funded
- **Network abstraction**: Client only needs Base USDC

**Relay payload:**

```typescript
{
  api_url: "https://jupiter.api.corbits.dev/ultra/v1/order",
  method: "GET",
  network: "base", // Pay on Base
  params: {
    inputMint: "So11111111111111111111111111111111111111112", // SOL
    outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
    amount: "20000000", // 0.02 SOL
    taker: "corzHctjX9Wtcrkfxz3Se8zdXqJYCaamWcQA7vwKF7Q"
  }
}
```

**Why this matters:**

- **No Solana wallet needed**: Access Solana APIs without SOL for gas
- **Unified payment method**: Use USDC on Base for all API calls
- **Cross-chain composability**: Build apps that span multiple blockchains
- **Cost efficiency**: No need to bridge assets or maintain balances on multiple chains

### Demo 04: Nansen Smart Money Netflow API - Cross-Chain (Base → Solana)

```bash
npm run demo:04
```

**What does it do?**

- Fetches **Smart Money Netflow** data from Nansen Analytics
- Tracks token flows from institutional investors ("Fund", "Smart Trader")
- Analyzes both **Ethereum** and **Solana** chains simultaneously
- Uses HTTPayer Relay for cross-chain payment

**Key features:**

- **Premium data access**: Nansen API typically requires expensive subscription
- **Multi-chain analysis**: Get data for Ethereum and Solana in one call
- **Smart money tracking**: See which tokens funds and smart traders are accumulating/selling
- **Pay-per-use**: Only pay for the data you actually request

**API request:**

```typescript
{
  api_url: "https://nansen.api.corbits.dev/api/v1/smart-money/netflow",
  method: "POST",
  network: "base",
  data: {
    chains: ["ethereum", "solana"],
    filters: {
      include_smart_money_labels: ["Fund", "Smart Trader"],
      exclude_smart_money_labels: ["30D Smart Trader"],
      include_native_tokens: false,
      include_stablecoins: false
    },
    pagination: { page: 1, per_page: 10 }
  }
}
```

**Response data:**

- Token symbols and contract addresses
- Net flow (USD) over 7d, 30d periods
- Smart money wallet counts
- Token sectors and categories
- Chain-specific data

### Demo 05: E2B Code Execution API

```bash
npm run demo:05
```

**What does it do?**

- Demonstrates **remote code execution** using E2B (Execute to Build) API
- Executes Python code snippets in a secure sandboxed environment
- Automatically saves execution results with payment metadata

**Key features:**

- **Secure execution**: Run untrusted code in isolated sandbox
- **Python support**: Execute Python snippets and get results
- **Pay-per-execution**: Only pay when you run code

**API request:**

```typescript
{
  api_url: "https://echo.router.merit.systems/resource/e2b/execute",
  method: "POST",
  network: "base",
  data: {
    snippet: 'print("Hello World!")'
  }
}
```

**Use cases:**

- Testing code snippets without local setup
- Running compute jobs on-demand
- Executing data processing scripts
- Building serverless Python functions

**Response includes:**

- Execution result/output
- Any errors or exceptions
- Execution metadata

### Demo 06: Multi-API Orchestration with LLM & Translation

```bash
npm run demo:06
```

**What does it do?**

- Orchestrates **4 API calls** in sequence to generate Smart Money Intelligence
- Demonstrates advanced HTTPayer Relay capabilities
- Complete analysis pipeline:
  1. **Nansen Smart Money API**: Fetches token netflow data (Ethereum & Solana)
  2. **Heurist AI Search**: Finds related crypto news articles
  3. **LLM Chat API**: Generates comprehensive analysis
  4. **LLM Translate API**: Translates analysis to Spanish
- Saves results as markdown files and JSON data

**Key features:**

- **Multi-API workflow**: Chains multiple paid APIs together
- **Smart data flow**: Extracts tokens from Nansen, feeds to Heurist search query
- **AI-powered analysis**: LLM synthesizes data into actionable insights
- **Auto-translation**: Spanish version generated automatically
- **Multiple output formats**:
  - `./output/demo06_original_*.md` - English markdown
  - `./output/demo06_translated_*.md` - Spanish markdown
  - `./website/data.json` - Full structured data

**Complete flow:**

```
1. Nansen API → Smart money flows for ETH/SOL tokens
2. Extract token symbols → Build Heurist search query
3. Heurist Search → Related crypto news articles
4. LLM Chat → Analyze trends and generate summary
5. LLM Translate → Spanish version
6. Save → Markdown files + JSON data
```

**APIs used:**

- Nansen API (Smart Money Netflow) - Multi-chain analytics
- Heurist AI Search (ExaSearch) - Crypto news aggregation
- LLM Server (/chat) - GPT-4 analysis
- LLM Server (/translate) - Spanish translation

### Demo 07: Save to Arkiv Blockchain via Spuro SDK

```bash
npm run demo:07
```

**What does it do?**

- Reads Smart Money Intelligence summary from `./website/data.json` (generated by demo_06)
- Encodes summary as hexadecimal payload
- Saves to **Arkiv blockchain** using Spuro SDK
- Uses `fetchWithPay` for x402 payments to Spuro
- Verifies storage by reading data back
- Saves entity record to `./arkiv/` for future reference

**Detailed flow:**

1. Checks that `./website/data.json` exists (run demo_06 first if not)
2. Extracts `websiteData.summary` from data
3. Encodes to hexadecimal with `encodePayload()`
4. Calls `createEntity()` with:
   - `fetchWithPay` - x402 enabled
   - Hexadecimal payload
   - String attributes (required by Arkiv)
   - TTL: 1 year (86400 × 365 seconds)
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
# Default mode: save latest demo_06 summary
npm run demo:07

# Read entity by key
npm run demo:07 read <entity_key>

# Save custom data
npm run demo:07 custom '{"my": "data"}'
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
- **Generated by**: demo_01, demo_02, demo_03, demo_04, demo_05, demo_06
- **Example**: `demo01_gloria-ai_2024-01-15T10-30-45-123Z.json`

### `./output/`

- **Purpose**: Stores formatted output files (markdown, reports)
- **Format**: Markdown (.md) with timestamp
- **Generated by**: demo_06
- **Contains**:
  - `demo06_original_*.md` - English Smart Money Intelligence analysis
  - `demo06_translated_*.md` - Spanish translation
- **Features**: Clean markdown formatting for easy reading and sharing
- **Example**: `demo06_original_2024-01-15T10-30-45.md`

### `./website/`

- **Purpose**: Stores structured data for website generation
- **Main file**: `data.json`
- **Generated by**: demo_06
- **Contains**: Smart Money Intelligence analysis with LLM summary
- **Used by**: demo_07 (to save to Arkiv)

### `./arkiv/`

- **Purpose**: Local records of entities saved to Arkiv blockchain
- **Format**: JSON with entity_key as filename
- **Generated by**: demo_07
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

### Error: "rlp: expected input string" in demo_07

**Cause**: Attributes in Spuro must be strings.

**Solution**: Already implemented - all attributes are converted:

```typescript
attributes: {
  data_sources: JSON.stringify(array),  // Arrays → JSON string
  has_data: String(boolean),             // Booleans → string
  timestamp: dateString || ""            // Strings with fallback
}
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
