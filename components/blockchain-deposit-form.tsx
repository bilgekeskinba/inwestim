"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import {
  erc20Abi,
  parseUnits,
  getAddress,
  BaseError,
  UserRejectedRequestError,
} from "viem";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { DEPOSIT_STATUS } from "@/lib/constants/status";
import { USDC } from "@/lib/constants/wallet";
import { ACTIVE_NETWORK, explorerTxUrl } from "@/lib/web3/networks";
import { TREASURY_ADDRESS } from "@/lib/env";

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-[15px] text-white shadow-sm placeholder:text-slate-500 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";
const labelClass = "text-sm font-medium text-slate-300";

function shorten(value: string): string {
  return value.length > 12 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value;
}

// Returns a checksummed treasury address, or null when unset/invalid.
function normalizeTreasury(): `0x${string}` | null {
  if (!TREASURY_ADDRESS) return null;
  try {
    return getAddress(TREASURY_ADDRESS);
  } catch {
    return null;
  }
}

// True when the error (or a nested cause) is a wallet user-rejection.
function isUserRejection(err: unknown): boolean {
  if (err instanceof BaseError) {
    return Boolean(err.walk((e) => e instanceof UserRejectedRequestError));
  }
  return err instanceof UserRejectedRequestError;
}

/**
 * Native wallet deposit (Sprint 6D). The user enters an amount and clicks
 * Deposit; WalletConnect opens their wallet to sign an official Polygon USDC
 * ERC-20 `transfer()` to the treasury. The tx hash is captured automatically —
 * no manual entry. A `deposit_requests` row is created ONLY after the transfer
 * is mined and confirmed successful (not rejected, not reverted). Admin
 * approval, the ledger, and on-chain verification are all unchanged downstream.
 */
export function BlockchainDepositForm({ userId }: { userId: string }) {
  const router = useRouter();
  const { open } = useAppKit();
  const { address, chainId, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ chainId: ACTIVE_NETWORK.chainId });

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = ACTIVE_NETWORK.tokens.USDC;
  const treasury = normalizeTreasury();
  const onActiveChain = chainId === ACTIVE_NETWORK.chainId;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setStatus("");

    // Guards.
    if (!isConnected || !address) {
      setError("Connect your wallet first.");
      return;
    }
    if (!onActiveChain) {
      setError(`Please switch to ${ACTIVE_NETWORK.name}.`);
      return;
    }
    if (!treasury) {
      setError("Deposits are unavailable: the treasury address is not configured.");
      return;
    }
    if (!publicClient) {
      setError("Network client unavailable. Please try again.");
      return;
    }
    const amountNum = Number(amount) || 0;
    if (!(amountNum > 0)) {
      setError("Enter an amount greater than 0.");
      return;
    }

    // USDC uses 6 decimals (from the network registry).
    let value: bigint;
    try {
      value = parseUnits(amount, token.decimals);
    } catch {
      setError("Enter a valid amount.");
      return;
    }

    setIsSubmitting(true);

    // 1. Ask the wallet to sign the USDC transfer() to the treasury.
    setStatus("Confirm the transfer in your wallet…");
    let hash: `0x${string}`;
    try {
      hash = await writeContractAsync({
        abi: erc20Abi,
        address: token.address,
        functionName: "transfer",
        args: [treasury, value],
        chainId: ACTIVE_NETWORK.chainId,
      });
    } catch (err) {
      // Rejected or failed to submit → do NOT create a request (tasks 6 & 7).
      setIsSubmitting(false);
      setStatus("");
      setError(
        isUserRejection(err)
          ? "Transaction rejected. No deposit was created."
          : "Could not submit the transfer. No deposit was created."
      );
      return;
    }

    // 2. Wait for the tx to be mined and confirm it did not revert.
    setStatus("Waiting for on-chain confirmation…");
    let succeeded = false;
    try {
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      succeeded = receipt.status === "success";
    } catch {
      // We can't read the receipt; the transfer may still be pending. Do NOT
      // create a request automatically — surface the hash so it isn't lost.
      setIsSubmitting(false);
      setStatus("");
      setError(
        `Transfer sent (${shorten(hash)}) but confirmation could not be read. ` +
          "If it succeeds on-chain, contact support with this hash to record it."
      );
      return;
    }

    if (!succeeded) {
      // Reverted → do NOT create a request (task 7).
      setIsSubmitting(false);
      setStatus("");
      setError("The on-chain transfer failed (reverted). No deposit was created.");
      return;
    }

    // 3. Success → automatically create the pending deposit request (task 8).
    const supabase = getSupabaseBrowserClient();
    const { error: insertError } = await supabase.from("deposit_requests").insert({
      user_id: userId,
      wallet_address: address,
      chain: ACTIVE_NETWORK.key,
      asset: USDC,
      amount: amountNum,
      tx_hash: hash,
      status: DEPOSIT_STATUS.PENDING,
    });

    setIsSubmitting(false);
    setStatus("");

    if (insertError) {
      // The transfer already succeeded on-chain; only the record failed.
      setError(
        insertError.code === "23505"
          ? "This transfer has already been recorded as a deposit."
          : `Transfer confirmed (${shorten(hash)}) but the deposit could not be saved: ` +
              `${insertError.message}. Contact support with this hash.`
      );
      return;
    }

    setSuccess("Deposit submitted. An admin will confirm it shortly.");
    setAmount("");
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
          Connect your wallet to deposit USDC directly from Inwestim.
        </p>
        <Button type="button" onClick={() => open()}>
          Connect Wallet
        </Button>
      </div>
    );
  }

  if (!onActiveChain) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-6">
        <p className="text-sm text-amber-300">
          Please switch to {ACTIVE_NETWORK.name} to deposit.
        </p>
        <Button type="button" onClick={() => open({ view: "Networks" })}>
          Switch Network
        </Button>
      </div>
    );
  }

  if (!treasury) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-6 text-sm text-amber-300">
        Deposits are temporarily unavailable — the treasury address is not
        configured. Please try again later.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">From wallet</span>
          <span className="font-medium text-white">{shorten(address)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-slate-400">Network</span>
          <span className="font-medium text-white">{ACTIVE_NETWORK.name}</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-slate-400">To treasury</span>
          <span className="font-mono font-medium text-white">{shorten(treasury)}</span>
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
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="bc_asset" className={labelClass}>
            Asset
          </label>
          <input id="bc_asset" type="text" value={USDC} readOnly className={inputClass} />
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Clicking Deposit opens your wallet to send USDC to the Inwestim treasury.
        Your deposit is created automatically once the transfer confirms
        on-chain.
      </p>

      {status ? <p className="text-sm font-medium text-slate-300">{status}</p> : null}
      {error ? <p className="text-sm font-medium text-red-400">{error}</p> : null}
      {success ? <p className="text-sm font-medium text-emerald-400">{success}</p> : null}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Processing…" : "Deposit"}
      </Button>
    </form>
  );
}
