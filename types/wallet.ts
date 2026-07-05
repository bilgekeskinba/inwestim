// Wallet-domain shared types (deposit requests, etc.).

export type DepositVerificationCheck = {
  label: string;
  passed: boolean;
  detail?: string;
};

/** Enriched pending deposit request, shown in the admin panel. */
export type AdminDeposit = {
  id: string;
  userId: string;
  userEmail: string | null;
  amount: number;
  asset: string;
  walletAddress: string | null;
  chain: string | null;
  txHash: string | null;
  status: string;
  createdAt: string | null;
  verificationStatus: string;
  verificationDetails: DepositVerificationCheck[] | null;
  verifiedAt: string | null;
  /** True when the same tx_hash appears on more than one deposit request. */
  isDuplicate: boolean;
};
