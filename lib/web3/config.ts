import { cookieStorage, createStorage } from "wagmi";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { polygon, polygonAmoy } from "@reown/appkit/networks";
import type { AppKitNetwork } from "@reown/appkit/networks";

// Reown (WalletConnect v2) project id. Set NEXT_PUBLIC_REOWN_PROJECT_ID from
// https://dashboard.reown.com. A non-empty fallback keeps the adapter from
// throwing at load; the UI surfaces a notice when the real id is missing.
export const projectId =
  process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || "REPLACE_WITH_REOWN_PROJECT_ID";

export const isProjectConfigured =
  Boolean(process.env.NEXT_PUBLIC_REOWN_PROJECT_ID);

// Dev: Polygon Amoy. Prod: Polygon Mainnet. Only Polygon is supported.
export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [polygon, polygonAmoy];

export const SUPPORTED_CHAIN_IDS: number[] = [polygon.id, polygonAmoy.id];

export const CHAIN_LABELS: Record<number, string> = {
  [polygon.id]: "Polygon",
  [polygonAmoy.id]: "Polygon Amoy",
};

// USDC token contracts (6 decimals) per supported chain.
export const USDC_ADDRESS: Record<number, `0x${string}`> = {
  [polygon.id]: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
  [polygonAmoy.id]: "0x41E94Eb019C0762f9Bfcf9Fb1E58725bfB0e7582",
};

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  projectId,
  networks,
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
