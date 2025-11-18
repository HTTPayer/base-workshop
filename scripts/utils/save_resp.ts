import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

interface SaveOptions {
  dir?: string;
  prefix?: string;
  includeHeaders?: boolean;
}

interface ResponseData {
  timestamp: string;
  url: string;
  status: number;
  statusText: string;
  headers?: Record<string, string>;
  body: any;
  paymentInfo?: any;
}

/**
 * Saves an HTTP response to a file with timestamp
 *
 * @param response - The Response object to save
 * @param name - Base name for the file (e.g., "gloria", "e2b")
 * @param paymentInfo - Optional payment information from x-payment-response header
 * @param options - Additional options for saving
 * @returns The path where the file was saved
 */
export async function saveResponse(
  response: Response,
  name: string,
  paymentInfo?: any,
  options: SaveOptions = {}
): Promise<string> {
  const {
    dir = "./responses",
    prefix = "",
    includeHeaders = true
  } = options;

  // Create responses directory if it doesn't exist
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Generate timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  // Clone response to read body (since response.body can only be read once)
  const clonedResponse = response.clone();

  // Determine content type
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  // Read body
  let body: any;
  try {
    body = isJson ? await clonedResponse.json() : await clonedResponse.text();
  } catch (error) {
    body = `Error reading body: ${error}`;
  }

  // Collect headers if requested
  let headers: Record<string, string> | undefined;
  if (includeHeaders) {
    headers = {};
    response.headers.forEach((value, key) => {
      headers![key] = value;
    });
  }

  // Build response data
  const responseData: ResponseData = {
    timestamp: new Date().toISOString(),
    url: response.url,
    status: response.status,
    statusText: response.statusText,
    ...(headers && { headers }),
    body,
    ...(paymentInfo && { paymentInfo })
  };

  // Generate filename
  const filePrefix = prefix ? `${prefix}_` : "";
  const filename = `${filePrefix}${name}_${timestamp}.json`;
  const filepath = join(dir, filename);

  // Save to file
  writeFileSync(filepath, JSON.stringify(responseData, null, 2), "utf-8");

  console.log(`[save_resp] Response saved to: ${filepath}`);

  return filepath;
}

/**
 * Saves response body only (without metadata)
 *
 * @param response - The Response object to save
 * @param name - Base name for the file
 * @param options - Additional options for saving
 * @returns The path where the file was saved
 */
export async function saveResponseBody(
  response: Response,
  name: string,
  options: SaveOptions = {}
): Promise<string> {
  const {
    dir = "./responses",
    prefix = ""
  } = options;

  // Create responses directory if it doesn't exist
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Generate timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  // Clone response to read body
  const clonedResponse = response.clone();

  // Determine content type and extension
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const ext = isJson ? "json" : "txt";

  // Read body
  let body: any;
  try {
    body = isJson ? await clonedResponse.json() : await clonedResponse.text();
  } catch (error) {
    body = `Error reading body: ${error}`;
  }

  // Generate filename
  const filePrefix = prefix ? `${prefix}_` : "";
  const filename = `${filePrefix}${name}_${timestamp}.${ext}`;
  const filepath = join(dir, filename);

  // Save to file
  const content = isJson ? JSON.stringify(body, null, 2) : body;
  writeFileSync(filepath, content, "utf-8");

  console.log(`[save_resp] Response body saved to: ${filepath}`);

  return filepath;
}
