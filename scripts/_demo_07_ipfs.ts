/*
Deploy Smart Money Intelligence website to IPFS via Pinata
Uploads all website files and provides gateway URLs
*/

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import FormData from "form-data";
import fetch from "node-fetch";

// Pinata API response type
interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

// Pinata API endpoints
const PINATA_API = "https://api.pinata.cloud";
const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs";

// Alternative IPFS gateways
const GATEWAYS = [
  "https://gateway.pinata.cloud/ipfs",
  "https://ipfs.io/ipfs",
  "https://cloudflare-ipfs.com/ipfs",
  "https://dweb.link/ipfs"
];

async function deployToIPFS() {
  console.log("\n════════════════════════════════════════════════════════════════");
  console.log("🌐 Deploying Smart Money Intelligence to IPFS");
  console.log("════════════════════════════════════════════════════════════════\n");

  // Check for Pinata API credentials
  const PINATA_JWT = process.env.PINATA_JWT;
  if (!PINATA_JWT) {
    console.error("❌ Error: PINATA_JWT environment variable not set\n");
    console.log("📝 To get Pinata API credentials:");
    console.log("   1. Go to https://app.pinata.cloud/developers/api-keys");
    console.log("   2. Create a new API key with 'pinFileToIPFS' permission");
    console.log("   3. Copy the JWT token");
    console.log("   4. Set environment variable: export PINATA_JWT='your-jwt-token'\n");
    console.log("Or run with: PINATA_JWT=your-jwt-token npm run demo:07:ipfs\n");
    process.exit(1);
  }

  // Check if data.json exists
  const dataPath = "./website/data.json";
  if (!existsSync(dataPath)) {
    console.error("❌ Error: data.json not found. Run demo_05 first to generate data.");
    process.exit(1);
  }

  try {
    // Read all files
    console.log("📂 Reading files...");
    const indexHtml = readFileSync("./website/templates/index.html", "utf-8");
    const styleCss = readFileSync("./website/templates/style.css", "utf-8");
    const scriptJs = readFileSync("./website/templates/script.js", "utf-8");
    const dataJson = readFileSync(dataPath, "utf-8");

    // Helper to format bytes
    const formatBytes = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    // Calculate sizes
    const sizes = {
      indexHtml: Buffer.from(indexHtml).length,
      styleCss: Buffer.from(styleCss).length,
      scriptJs: Buffer.from(scriptJs).length,
      dataJson: Buffer.from(dataJson).length
    };
    const totalSize = Object.values(sizes).reduce((a, b) => a + b, 0);

    console.log("✅ Files loaded:");
    console.log(`   - index.html (${formatBytes(sizes.indexHtml)})`);
    console.log(`   - style.css (${formatBytes(sizes.styleCss)})`);
    console.log(`   - script.js (${formatBytes(sizes.scriptJs)})`);
    console.log(`   - data.json (${formatBytes(sizes.dataJson)})`);
    console.log(`   📦 Total size: ${formatBytes(totalSize)}\n`);

    // Create FormData with all files
    console.log("🚀 Uploading to Pinata IPFS...");
    const formData = new FormData();

    // Add files to FormData
    formData.append('file', Buffer.from(indexHtml), {
      filepath: 'index.html',
      contentType: 'text/html'
    });
    formData.append('file', Buffer.from(styleCss), {
      filepath: 'style.css',
      contentType: 'text/css'
    });
    formData.append('file', Buffer.from(scriptJs), {
      filepath: 'script.js',
      contentType: 'application/javascript'
    });
    formData.append('file', Buffer.from(dataJson), {
      filepath: 'data.json',
      contentType: 'application/json'
    });

    // Add metadata
    const metadata = JSON.stringify({
      name: `Smart Money Intelligence - ${new Date().toISOString()}`,
      keyvalues: {
        project: "httpayer",
        type: "website",
        deployed: new Date().toISOString()
      }
    });
    formData.append('pinataMetadata', metadata);

    // Upload to Pinata
    const uploadResponse = await fetch(`${PINATA_API}/pinning/pinFileToIPFS`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}\n${errorText}`);
    }

    const result = await uploadResponse.json() as PinataResponse;
    const ipfsHash = result.IpfsHash;

    console.log("✅ Upload successful!\n");
    console.log("════════════════════════════════════════════════════════════════");
    console.log("🌐 IPFS Deployment Complete");
    console.log("════════════════════════════════════════════════════════════════\n");

    console.log(`📦 IPFS Hash (CID): ${ipfsHash}\n`);
    console.log("🔗 Access your site via these gateways:\n");

    GATEWAYS.forEach((gateway, index) => {
      console.log(`   ${index + 1}. ${gateway}/${ipfsHash}`);
    });

    console.log("\n💡 Tips:");
    console.log("   - IPFS content is permanent and immutable");
    console.log("   - Use different gateways if one is slow");
    console.log("   - Share the IPFS hash to let others access your site");
    console.log("   - You can also access via: ipfs://" + ipfsHash + "\n");

    // Save deployment info
    const deploymentsDir = "./deployments";
    if (!existsSync(deploymentsDir)) {
      mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentInfo = {
      ipfsHash: ipfsHash,
      timestamp: result.Timestamp,
      size: result.PinSize,
      deployed_at: new Date().toISOString(),
      gateways: GATEWAYS.map(gw => `${gw}/${ipfsHash}`),
      files: [
        { path: "index.html", size: sizes.indexHtml },
        { path: "style.css", size: sizes.styleCss },
        { path: "script.js", size: sizes.scriptJs },
        { path: "data.json", size: sizes.dataJson }
      ]
    };

    const deploymentFile = join(deploymentsDir, `ipfs-${ipfsHash}.json`);
    writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2), "utf-8");

    console.log(`💾 Deployment info saved to: ${deploymentFile}`);
    console.log("\n✨ Your Smart Money Intelligence dashboard is now live on IPFS!");

  } catch (error: any) {
    console.error("\n❌ Deployment failed:", error.message);

    if (error.message?.includes('401') || error.message?.includes('403')) {
      console.error("\n🔑 Authentication failed. Please check your PINATA_JWT token.");
    }

    process.exit(1);
  }
}

// Run deployment
deployToIPFS().catch(console.error);
