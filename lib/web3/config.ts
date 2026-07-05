import { cookieStorage, createStorage } from "wagmi";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { polygon as polygonAppKit } from "@reown/appkit/networks";
import type { AppKitNetwork } from "@reown/appkit/networks";
import { REOWN_PROJECT_ID } from "@/lib/env";
import { ACTIVE_NETWORK, SUPPORTED_NETWORKS } from "@/lib/web3/networks";

// Reown (WalletConnect v2) project id. Set NEXT_PUBLIC_REOWN_PROJECT_ID from
// https://dashboard.reown.com. A non-empty fallback keeps the adapter from
// throwing at load; the UI surfaces a notice when the real id is missing.
export const projectId = REOWN_PROJECT_ID || "REPLACE_WITH_REOWN_PROJECT_ID";

export const isProjectConfigured = Boolean(REOWN_PROJECT_ID);

// AppKit network objects, keyed by chain id. This is the only place that maps
// the registry to AppKit networks; add an entry here when enabling a new chain.
const APPKIT_NETWORK_BY_CHAIN_ID: Record<number, AppKitNetwork> = {
  [polygonAppKit.id]: polygonAppKit,
};

const activeAppKitNetwork =
  APPKIT_NETWORK_BY_CHAIN_ID[ACTIVE_NETWORK.chainId] ?? polygonAppKit;

// AppKit/wagmi only expose the currently-active network.
export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [activeAppKitNetwork];

// Derived, network-agnostic lookups used by the wallet UI.
export const SUPPORTED_CHAIN_IDS: number[] = Object.values(SUPPORTED_NETWORKS).map(
  (n) => n.chainId
);

export const CHAIN_LABELS: Record<number, string> = Object.fromEntries(
  Object.values(SUPPORTED_NETWORKS).map((n) => [n.chainId, n.name])
);

export const USDC_ADDRESS: Record<number, `0x${string}`> = Object.fromEntries(
  Object.values(SUPPORTED_NETWORKS).map((n) => [n.chainId, n.tokens.USDC.address])
);

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  projectId,
  networks,
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
