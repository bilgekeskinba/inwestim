/**
 * Formats an amount as a USDC string, e.g. "0 USDC", "1,250 USDC",
 * "125,000 USDC". Null, undefined, or non-numeric input renders as "0 USDC".
 */
export function formatUSDC(value: number | string | null | undefined): string {
  return `${(Number(value) || 0).toLocaleString("en-US")} USDC`;
}
