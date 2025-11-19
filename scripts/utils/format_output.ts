/**
 * Utility for formatting and truncating console output with kleur coloring
 */
import kleur from "kleur";

const MAX_CONSOLE_LENGTH = 500;

/**
 * Truncates text to a maximum length and adds ellipsis
 */
export function truncateText(text: string, maxLength: number = MAX_CONSOLE_LENGTH): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Formats JSON for console output with truncation
 */
export function formatJSON(data: any, truncate: boolean = true): string {
  const jsonString = JSON.stringify(data, null, 2);
  return truncate ? truncateText(jsonString) : jsonString;
}

/**
 * Logs response body with truncation and note about full response
 */
export function logResponseBody(body: any, label: string = "Response body", savedPath?: string) {
  console.log();
  console.log(kleur.bold().cyan(`=== ${label} ===`));

  const bodyText = typeof body === 'string' ? body : JSON.stringify(body, null, 2);
  const truncated = truncateText(bodyText);
  const wasTruncated = truncated.length < bodyText.length;

  console.log(kleur.white(truncated));

  if (wasTruncated) {
    console.log();
    console.log(kleur.dim(`... (truncated, showing first ${MAX_CONSOLE_LENGTH} characters)`));
    if (savedPath) {
      console.log(kleur.dim(`📁 Full response saved to: ${kleur.cyan(savedPath)}`));
    }
  }
  console.log();
}

/**
 * Logs section header
 */
export function logSection(title: string) {
  console.log();
  console.log(kleur.bold().white(`=== ${title} ===`));
}

/**
 * Logs step in a process
 */
export function logStep(stepNumber: number, description: string) {
  console.log();
  console.log(kleur.bold().cyan(`[Step ${stepNumber}]`) + " " + kleur.white(description));
}

/**
 * Logs success message
 */
export function logSuccess(message: string) {
  console.log(kleur.green(`✓ ${message}`));
}

/**
 * Logs error message
 */
export function logError(message: string, error?: any) {
  console.log(kleur.red(`✗ ${message}`));
  if (error) {
    console.log(kleur.dim(error.toString()));
  }
}

/**
 * Logs info message with label
 */
export function logInfo(label: string, value: string | number | boolean) {
  console.log(kleur.white().dim(label + ":"), kleur.cyan(String(value)));
}

/**
 * Logs API URL
 */
export function logApiUrl(url: string, label: string = "Calling") {
  console.log(kleur.white(`${label}: ${kleur.cyan().underline(url)}`));
}

/**
 * Logs payment information
 */
export function logPayment(paymentInfo: any) {
  if (!paymentInfo) return;

  console.log();
  console.log(kleur.bold().green("=== Payment Executed ==="));
  if (paymentInfo.amount) {
    logInfo("Amount", paymentInfo.amount);
  }
  if (paymentInfo.beneficiary) {
    logInfo("Beneficiary", paymentInfo.beneficiary);
  }
  if (paymentInfo.tx_hash || paymentInfo.txHash) {
    logInfo("Transaction", paymentInfo.tx_hash || paymentInfo.txHash);
  }
  console.log();
}
