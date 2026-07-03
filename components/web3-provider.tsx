"use client";

import type { ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import { polygonAmoy } from "@reown/appkit/networks";
import { wagmiAdapter, wagmiConfig, projectId, networks } from "@/lib/web3/config";

const queryClient = new QueryClient();

// Initialise the Reown AppKit modal once, on the client.
createAppKit({
  adapters: [wagmiAdapter],
  networks,
  defaultNetwork: polygonAmoy,
  projectId,
  metadata: {
    name: "Inwestim",
    description: "Inwestim investment platform",
    url: "https://inwestim.app",
    icons: ["https://inwestim.app/icon.png"],
  },
  features: {
    analytics: false,
    email: false,
    socials: false,
  },
});

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
