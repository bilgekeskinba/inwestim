"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { formatUSDC } from "@/lib/format/currency";

type Props = {
  propertyId: string;
  title: string;
  minimumInvestment: number;
  totalValue: number;
  fundingPercentage: number;
};

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-[15px] text-white shadow-sm placeholder:text-slate-500 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";

export function InvestmentModal({
  propertyId,
  title,
  minimumInvestment,
  totalValue,
  fundingPercentage,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"amount" | "review">("amount");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Funding still available, when derivable from total value + funding %.
  const funded = Math.max(0, Math.min(100, Number(fundingPercentage) || 0));
  const remaining =
    totalValue > 0 ? Math.max(0, totalValue * (1 - funded / 100)) : 0;

  const amountNum = Number(amount) || 0;
  const ownership =
    totalValue > 0 ? (amountNum / totalValue) * 100 : 0;

  const resetAndClose = () => {
    setOpen(false);
    setStep("amount");
    setAmount("");
    setError("");
  };

  const handleStart = async () => {
    // Public page: only logged-in users can invest.
    const supabase = getSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/sign-in");
      return;
    }

    setStep("amount");
    setAmount("");
    setError("");
    setOpen(true);
  };

  const handleReview = () => {
    if (!amount || amountNum <= 0) {
      setError("Please enter an amount in USDC.");
      return;
    }
    if (amountNum < minimumInvestment) {
      setError(`Minimum investment is ${formatUSDC(minimumInvestment)}.`);
      return;
    }
    if (remaining > 0 && amountNum > remaining) {
      setError(`Amount exceeds remaining funding (${formatUSDC(remaining)}).`);
      return;
    }
    setError("");
    setStep("review");
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError("");

    const supabase = getSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setIsSubmitting(false);
      router.push("/sign-in");
      return;
    }

    const { error: insertError } = await supabase.from("investments").insert({
      user_id: user.id,
      property_id: propertyId,
      amount: amountNum,
      status: "pending",
    });

    if (insertError) {
      setIsSubmitting(false);
      setError(insertError.message);
      return;
    }

    setIsSubmitting(false);
    resetAndClose();
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <>
      <Button
        type="button"
        size="lg"
        onClick={handleStart}
        className="w-full bg-gradient-to-r from-emerald-500 to-emerald-400 text-white hover:from-emerald-400 hover:to-emerald-300"
      >
        Start Investing
        <ArrowUpRight className="ml-2 h-4 w-4" />
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={resetAndClose}
        >
          <div
            className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-8 text-white shadow-2xl shadow-black/40"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={resetAndClose}
              aria-label="Close"
              className="absolute right-5 top-5 text-slate-400 transition-colors hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            {step === "amount" ? (
              <div className="space-y-6">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-emerald-400/80">
                    Invest
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h2>
                </div>

                <div className="space-y-2">
                  <label htmlFor="invest-amount" className="text-sm font-medium text-slate-300">
                    Amount (USDC)
                  </label>
                  <input
                    id="invest-amount"
                    name="amount"
                    type="number"
                    min={minimumInvestment}
                    step="any"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={String(minimumInvestment)}
                    className={inputClass}
                    autoFocus
                  />
                </div>

                <div className="space-y-2 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Minimum investment</span>
                    <span className="font-medium text-white">
                      {formatUSDC(minimumInvestment)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Estimated ownership</span>
                    <span className="font-medium text-white">{ownership.toFixed(2)}%</span>
                  </div>
                </div>

                {error ? (
                  <p className="text-sm font-medium text-red-400">{error}</p>
                ) : null}

                <div className="flex items-center gap-3">
                  <Button type="button" className="flex-1" onClick={handleReview}>
                    Review
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={resetAndClose}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-emerald-400/80">
                    Review
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h2>
                </div>

                <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/60 p-5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Amount</span>
                    <span className="font-semibold text-white">{formatUSDC(amountNum)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Estimated ownership</span>
                    <span className="font-medium text-white">{ownership.toFixed(2)}%</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/10 pt-3">
                    <span className="text-slate-400">Status</span>
                    <span className="font-medium text-amber-300">Pending approval</span>
                  </div>
                </div>

                {error ? (
                  <p className="text-sm font-medium text-red-400">{error}</p>
                ) : null}

                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-400 text-white hover:from-emerald-400 hover:to-emerald-300"
                    onClick={handleConfirm}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting…" : "Confirm"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setStep("amount")}
                    disabled={isSubmitting}
                  >
                    Back
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
