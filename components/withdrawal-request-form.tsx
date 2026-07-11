"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { formatUSDC } from "@/lib/format/currency";
import { SUPPORTED_CHAINS, USDC } from "@/lib/constants/wallet";
import { WITHDRAWAL_STATUS } from "@/lib/constants/status";

const CHAINS = SUPPORTED_CHAINS;
const ASSETS = [USDC];

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-[15px] text-white shadow-sm placeholder:text-slate-500 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";
const labelClass = "text-sm font-medium text-slate-300";

export function WithdrawalRequestForm({
  userId,
  availableBalance,
}: {
  userId: string;
  availableBalance: number;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [chain, setChain] = useState<string>(CHAINS[0].value);
  const [asset, setAsset] = useState(ASSETS[0]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const amountNum = Number(amount) || 0;
    if (!(amountNum > 0)) {
      setError("Enter an amount greater than 0.");
      return;
    }
    if (amountNum > availableBalance) {
      setError(`Amount exceeds your available balance (${formatUSDC(availableBalance)}).`);
      return;
    }
    if (!walletAddress.trim()) {
      setError("Enter the destination wallet address.");
      return;
    }

    setIsSubmitting(true);
    const supabase = getSupabaseBrowserClient();
    const { error: insertError } = await supabase.from("withdrawal_requests").insert({
      user_id: userId,
      wallet_address: walletAddress.trim(),
      chain,
      asset,
      amount: amountNum,
      status: WITHDRAWAL_STATUS.PENDING,
    });

    if (insertError) {
      setIsSubmitting(false);
      setError(insertError.message);
      return;
    }

    setIsSubmitting(false);
    setSuccess("Withdrawal submitted. An admin will review it shortly.");
    setAmount("");
    setWalletAddress("");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Available balance</span>
          <span className="font-medium text-white">{formatUSDC(availableBalance)}</span>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="wd_amount" className={labelClass}>
            Amount (USDC)
          </label>
          <input
            id="wd_amount"
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
          <label htmlFor="wd_asset" className={labelClass}>
            Asset
          </label>
          <select
            id="wd_asset"
            value={asset}
            onChange={(e) => setAsset(e.target.value)}
            className={inputClass}
          >
            {ASSETS.map((a) => (
              <option key={a} value={a} className="bg-slate-900">
                {a}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="wd_wallet" className={labelClass}>
            Destination wallet address
          </label>
          <input
            id="wd_wallet"
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="0x…"
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="wd_chain" className={labelClass}>
            Chain
          </label>
          <select
            id="wd_chain"
            value={chain}
            onChange={(e) => setChain(e.target.value)}
            className={inputClass}
          >
            {CHAINS.map((c) => (
              <option key={c.value} value={c.value} className="bg-slate-900">
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? <p className="text-sm font-medium text-red-400">{error}</p> : null}
      {success ? <p className="text-sm font-medium text-emerald-400">{success}</p> : null}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting…" : "Withdraw USDC"}
      </Button>
    </form>
  );
}
