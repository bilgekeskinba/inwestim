// Wallet-domain shared types (deposit requests, etc.).

/** Enriched pending deposit request, shown in the admin panel. */
export type AdminDeposit = {
  id: string;
  userId: string;
  userEmail: string | null;
  amount: number;
  asset: string;
  walletAddress: string | null;
  chain: string | null;
  status: string;
  createdAt: string | null;
};
