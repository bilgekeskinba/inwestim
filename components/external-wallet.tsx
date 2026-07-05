"use client";

import { useEffect, useState } from "react";
import { useAccount, useDisconnect, useReadContract } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { erc20Abi, formatUnits } from "viem";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import {
  SUPPORTED_CHAIN_IDS,
  USDC_ADDRESS,
  CHAIN_LABELS,
  isProjectConfigured,
} from "@/lib/web3/config";
import { ACTIVE_NETWORK } from "@/lib/web3/networks";

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between border-b border-white/10 py-3 last:border-b-0">
    <span className="text-sm text-slate-400">{label}</span>
    <span className="text-sm font-medium text-white">{value}</span>
  </div>
);

export function ExternalWallet({ userId }: { userId: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { open } = useAppKit();
  const { address, chainId, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const isSupported = chainId ? SUPPORTED_CHAIN_IDS.includes(chainId) : false;
  const usdcAddress = chainId ? USDC_ADDRESS[chainId] : undefined;

  const { data: rawBalance } = useReadContract({
    abi: erc20Abi,
    address: usdcAddress,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId,
    query: { enabled: Boolean(mounted && address && usdcAddress && isSupported) },
  });

  const usdcBalance =
    rawBalance != null ? formatUnits(rawBalance as bigint, 6) : null;

  // Read-only identity: persist the linked wallet on the user's profile.
  // Re-linking the same wallet just rewrites the same values (idempotent).
  useEffect(() => {
    if (!mounted || !isConnected || !address || !chainId || !isSupported) return;
    const supabase = getSupabaseBrowserClient();
    supabase
      .from("profiles")
      .update({ wallet_address: address, wallet_chain: String(chainId) })
      .eq("id", userId)
      .then(({ error }) => {
        if (error && process.env.NODE_ENV !== "production") {
          console.error("[wallet] persist failed", error);
        }
      });
  }, [mounted, isConnected, address, chainId, isSupported, userId]);

  const cardClass =
    "flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-950/60 p-6";

  // Avoid SSR/first-paint mismatch: render the disconnected shell until mounted.
  if (!mounted || !isConnected || !address) {
    return (
      <div className={cardClass}>
        <div className="flex flex-col gap-1">
          <p className="text-sm text-slate-400">Status</p>
          <p className="text-lg font-medium text-white">Not Connected</p>
        </div>
        <div>
          <Button type="button" onClick={() => open()} disabled={!mounted}>
            Connect Wallet
          </Button>
        </div>
        {mounted && !isProjectConfigured ? (
          <p className="text-xs text-amber-300">
            Set NEXT_PUBLIC_REOWN_PROJECT_ID to enable wallet connections.
          </p>
        ) : null}
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className={cardClass}>
        <div className="flex flex-col gap-1">
          <p className="text-sm text-slate-400">Status</p>
          <p className="text-lg font-medium text-amber-300">
            Please switch to {ACTIVE_NETWORK.name}.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={() => open({ view: "Networks" })}>
            Switch Network
          </Button>
          <Button type="button" variant="secondary" onClick={() => disconnect()}>
            Disconnect
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between">
        <p className="text-lg font-medium text-emerald-300">Connected</p>
        <Button type="button" variant="secondary" size="sm" onClick={() => disconnect()}>
          Disconnect
        </Button>
      </div>
      <div className="flex flex-col">
        <Row label="Wallet Address" value={shortenAddress(address)} />
        <Row
          label="Network"
          value={chainId ? CHAIN_LABELS[chainId] ?? ACTIVE_NETWORK.name : "—"}
        />
        <Row
          label="USDC Balance"
          value={usdcBalance != null ? `${usdcBalance} USDC` : "…"}
        />
      </div>
    </div>
  );
}
