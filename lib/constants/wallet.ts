// Wallet-domain string constants (asset, chains, ledger types). Values match
// the database and existing UI exactly.

export const USDC = "USDC";

export const SUPPORTED_CHAINS = [
  { value: "polygon", label: "Polygon" },
  { value: "polygon-amoy", label: "Polygon Amoy" },
] as const;

export const WALLET_TX_TYPE = {
  DEPOSIT: "deposit",
  INVESTMENT: "investment",
  DISTRIBUTION: "distribution",
  WITHDRAWAL: "withdrawal",
  REFUND: "refund",
  ADJUSTMENT: "adjustment",
} as const;

export const WALLET_DIRECTION = {
  CREDIT: "credit",
  DEBIT: "debit",
} as const;

export const REFERENCE_TYPE = {
  INVESTMENT: "investment",
  RENTAL_DISTRIBUTION: "rental_distribution",
  DEPOSIT_REQUEST: "deposit_request",
} as const;
