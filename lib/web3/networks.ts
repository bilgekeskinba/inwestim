// EVM network registry — the single source of truth for the blockchain layer.
//
// The rest of the app never hardcodes a specific chain; it reads ACTIVE_NETWORK
// (and, for multi-chain lookups, SUPPORTED_NETWORKS). To enable another EVM
// network later (Ethereum, Base, Arbitrum, Optimism, Avalanche C-Chain), add a
// registry entry + its RPC env var — no business-layer changes required.
import type { Chain } from "viem";
import { polygon } from "viem/chains";
import { ACTIVE_CHAIN, POLYGON_RPC_URL } from "@/lib/env";

export type TokenConfig = {
  symbol: string;
  address: `0x${string}`;
  decimals: number;
};

export type NetworkConfig = {
  /** Stable slug stored in the DB (deposit_requests.chain) and env selection. */
  key: string;
  chainId: number;
  name: string;
  /** viem chain used for RPC clients + wagmi. */
  chain: Chain;
  /** Optional RPC override; falls back to the chain's default public RPC. */
  rpcUrl?: string;
  explorerUrl: string;
  tokens: {
    USDC: TokenConfig;
  };
};

const POLYGON: NetworkConfig = {
  key: "polygon",
  chainId: polygon.id, // 137
  name: "Polygon",
  chain: polygon,
  rpcUrl: POLYGON_RPC_URL || undefined,
  explorerUrl: "https://polygonscan.com",
  tokens: {
    // Official Circle-issued USDC on Polygon Mainnet (native, 6 decimals).
    USDC: {
      symbol: "USDC",
      address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      decimals: 6,
    },
  },
};

/** Registry of networks the app knows about, keyed by slug. */
export const SUPPORTED_NETWORKS: Record<string, NetworkConfig> = {
  [POLYGON.key]: POLYGON,
};

export function getNetworkByChainId(chainId: number): NetworkConfig | undefined {
  return Object.values(SUPPORTED_NETWORKS).find((n) => n.chainId === chainId);
}

/** The currently enabled network, selected by NEXT_PUBLIC_ACTIVE_CHAIN. */
export function getActiveNetwork(): NetworkConfig {
  return SUPPORTED_NETWORKS[ACTIVE_CHAIN] ?? POLYGON;
}

export const ACTIVE_NETWORK = getActiveNetwork();

/** Explorer URL for a transaction hash on a given (or the active) network. */
export function explorerTxUrl(
  txHash: string,
  network: NetworkConfig = ACTIVE_NETWORK
): string {
  return `${network.explorerUrl}/tx/${txHash}`;
}
