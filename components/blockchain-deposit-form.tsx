"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { polygonAmoy } from "@reown/appkit/networks";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { DEPOSIT_STATUS } from "@/lib/constants/status";
import { USDC } from "@/lib/constants/wallet";

const AMOY_CHAIN_ID = polygonAmoy.id; // 80002
const AMOY_CHAIN_VALUE = "polygon-amoy";
const TX_HASH_RE = /^0x[a-fA-F0-9]{64}$/;

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-[15px] text-white shadow-sm placeholder:text-slate-500 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";
const labelClass = "text-sm font-medium text-slate-300";

export function BlockchainDepositForm({ userId }: { userId: string }) {
  const router = useRouter();
  const { open } = useAppKit();
  const { address, chainId, isConnected } = useAccount();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onAmoy = chainId === AMOY_CHAIN_ID;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation (task 8).
    if (!isConnected || !address) {
      setError("Connect your wallet first.");
      return;
    }
    if (!onAmoy) {
      setError("Please switch to Polygon Amoy.");
      return;
    }
    const amountNum = Number(amount) || 0;
    if (!(amountNum > 0)) {
      setError("Enter an amount greater than 0.");
      return;
    }
    const hash = txHash.trim();
    if (!hash) {
      setError("Transaction hash is required.");
      return;
    }
    if (!TX_HASH_RE.test(hash)) {
      setError("Enter a valid transaction hash (0x followed by 64 hex characters).");
      return;
    }

    setIsSubmitting(true);
    const supabase = getSupabaseBrowserClient();
    const { error: insertError } = await supabase.from("deposit_requests").insert({
      user_id: userId,
      wallet_address: address,
      chain: AMOY_CHAIN_VALUE,
      asset: USDC,
      amount: amountNum,
      tx_hash: hash,
      status: DEPOSIT_STATUS.PENDING,
    });

    if (insertError) {
      setIsSubmitting(false);
      setError(insertError.message);
      return;
    }

    setIsSubmitting(false);
    setSuccess("Deposit request submitted. An admin will confirm it shortly.");
    setAmount("");
    setTxHash("");
    router.refresh();
  };

  // Avoid SSR/first-paint mismatch until wagmi state hydrates.
  if (!mounted) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-6 text-sm text-slate-400">
        Loading wallet…
      </div>
    );
  }

  if (!isConnected || !address) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-6">
        <p className="text-sm text-slate-400">
          Connect your wallet to submit an on-chain deposit.
        </p>
        <Button type="button" onClick={() => open()}>
          Connect Wallet
        </Button>
      </div>
    );
  }

  if (!onAmoy) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-6">
        <p className="text-sm text-amber-300">Please switch to Polygon Amoy to deposit.</p>
        <Button type="button" onClick={() => open({ view: "Networks" })}>
          Switch Network
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">From wallet</span>
          <span className="font-medium text-white">
            {`${address.slice(0, 6)}…${address.slice(-4)}`}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-slate-400">Network</span>
          <span className="font-medium text-white">Polygon Amoy</span>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="bc_amount" className={labelClass}>
            Amount (USDC)
          </label>
          <input
            id="bc_amount"
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="bc_asset" className={labelClass}>
            Asset
          </label>
          <input id="bc_asset" type="text" value={USDC} readOnly className={inputClass} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="bc_txhash" className={labelClass}>
            Transaction hash
          </label>
          <input
            id="bc_txhash"
            type="text"
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            placeholder="0x…"
            className={inputClass}
          />
        </div>
      </div>

      {error ? <p className="text-sm font-medium text-red-400">{error}</p> : null}
      {success ? <p className="text-sm font-medium text-emerald-400">{success}</p> : null}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting…" : "Create Deposit Request"}
      </Button>
    </form>
  );
}
