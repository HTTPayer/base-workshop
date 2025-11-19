/*
Deploy Smart Money Intelligence website to webdb.site
Reads website data and templates, then deploys via webdb.site API
*/

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import FormData from "form-data";
import fetch from "node-fetch";

const WEBDB_API = "https://webdb.site/api";

async function deployWebsite() {
  console.log("\n════════════════════════════════════════════════════════════════");
  console.log("🌐 Deploying Smart Money Intelligence to webdb.site");
  console.log("════════════════════════════════════════════════════════════════\n");

  // Check if data.json exists
  const dataPath = "./website/data.json";
  if (!existsSync(dataPath)) {
    console.error("❌ Error: data.json not found. Run demo_05 first to generate data.");
    process.exit(1);
  }

  // Generate unique site ID based on timestamp
  const timestamp = Date.now();
  const siteId = `smartmoney-${timestamp}`;

  console.log(`📦 Site ID: ${siteId}`);
  console.log(`🔗 Target URL: https://${siteId}.webdb.site\n`);

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
      // styleCss: Buffer.from(styleCss).length,
      // scriptJs: Buffer.from(scriptJs).length,
      // dataJson: Buffer.from(dataJson).length
    };
    const totalSize = Object.values(sizes).reduce((a, b) => a + b, 0);

    // Create FormData
    const formData = new FormData();
    formData.append('files', Buffer.from(indexHtml), { filename: 'index.html', contentType: 'text/html' });
    // formData.append('files', Buffer.from(styleCss), { filename: 'style.css', contentType: 'text/css' });
    // formData.append('files', Buffer.from(scriptJs), { filename: 'script.js', contentType: 'application/javascript' });
    // formData.append('files', Buffer.from(dataJson), { filename: 'data.json', contentType: 'application/json' });

    console.log("✅ Files loaded:");
    console.log(`   - index.html (${formatBytes(sizes.indexHtml)})`);
    // console.log(`   - style.css (${formatBytes(sizes.styleCss)})`);
    // console.log(`   - script.js (${formatBytes(sizes.scriptJs)})`);
    // console.log(`   - data.json (${formatBytes(sizes.dataJson)})`);
    console.log(`   📦 Total size: ${formatBytes(totalSize)}\n`);

    // Upload to webdb.site
    console.log("🚀 Uploading to webdb.site...");
    const uploadUrl = `${WEBDB_API}/upload/${siteId}`;

    // Add timeout and retry logic
    const TIMEOUT_MS = 120000; // 120 seconds
    const MAX_RETRIES = 3;
    let lastError: Error | null = null;
    let response: any = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 1) {
          console.log(`🔄 Retry attempt ${attempt}/${MAX_RETRIES}...`);
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

        response = await fetch(uploadUrl, {
          method: 'POST',
          body: formData,
          headers: formData.getHeaders(),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();

          // Check if it's a timeout error (524)
          if (response.status === 524) {
            throw new Error(`Server timeout (524) - Upload took too long. This might be due to large files or server load.`);
          }

          throw new Error(`Upload failed: ${response.status} ${response.statusText}\n${errorText}`);
        }

        // Success! Break out of retry loop
        lastError = null;
        break;

      } catch (error: any) {
        lastError = error;

        // If it's an abort error (our timeout), retry
        if (error.name === 'AbortError') {
          console.log(`⏱️  Request timed out after ${TIMEOUT_MS / 1000}s`);
          if (attempt < MAX_RETRIES) {
            continue;
          }
        }

        // If it's a 524 timeout, retry
        if (error.message?.includes('524') || error.message?.includes('timeout')) {
          console.log(`⏱️  Server timeout detected`);
          if (attempt < MAX_RETRIES) {
            continue;
          }
        }

        // For other errors, don't retry
        throw error;
      }
    }

    if (lastError) {
      throw lastError;
    }

    const result = await response.json();

    console.log("✅ Deployment successful!\n");
    console.log("════════════════════════════════════════════════════════════════");
    console.log(`🌐 Live URL: ${result.url || `https://${siteId}.webdb.site`}`);
    console.log("════════════════════════════════════════════════════════════════\n");

    // Display deployment details
    console.log("📋 Deployment Details:");
    console.log(JSON.stringify(result, null, 2));
    console.log("");

    // Save deployment info
    const deploymentsDir = "./deployments";
    if (!existsSync(deploymentsDir)) {
      mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentInfo = {
      siteId: result.siteId || siteId,
      url: result.url || `https://${siteId}.webdb.site`,
      deployed_at: new Date().toISOString(),
      files: result.files || [
        { path: "index.html" },
        { path: "style.css" },
        { path: "script.js" },
        { path: "data.json" }
      ],
      response: result
    };

    // Save by siteId:url format
    const deploymentFile = join(deploymentsDir, `${deploymentInfo.siteId}.json`);
    writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2), "utf-8");

    console.log(`💾 Deployment info saved to: ${deploymentFile}`);
    console.log("\n✨ Your Smart Money Intelligence dashboard is now live!");

  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  }
}

// Run deployment
deployWebsite().catch(console.error);
