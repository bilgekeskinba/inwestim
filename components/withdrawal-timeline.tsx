import { formatUSDC } from "@/lib/format/currency";
import { formatDate } from "@/lib/format/date";
import { explorerAddressUrl } from "@/lib/web3/networks";
import { WITHDRAWAL_STATUS } from "@/lib/constants/status";

type WithdrawalTimelineProps = {
  amount: number;
  asset: string;
  chain: string;
  status: string;
  createdAt: string | null;
  walletAddress: string | null;
};

type StepState = "complete" | "failed" | "pending";

const statusBadgeClass: Record<string, string> = {
  pending: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  approved: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  completed: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  failed: "border-rose-400/30 bg-rose-400/10 text-rose-300",
  cancelled: "border-rose-400/30 bg-rose-400/10 text-rose-300",
};

function shorten(value: string): string {
  return value.length > 14 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value;
}

function StepDot({ state }: { state: StepState }) {
  if (state === "complete") {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/15 text-[11px] text-emerald-300">
        ✓
      </span>
    );
  }
  if (state === "failed") {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-400/15 text-[11px] text-rose-300">
        ✗
      </span>
    );
  }
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/15 text-[11px] text-slate-500">
      •
    </span>
  );
}

const stepLabelClass: Record<StepState, string> = {
  complete: "text-slate-300",
  failed: "text-rose-300",
  pending: "text-slate-500",
};

export function WithdrawalTimeline({
  amount,
  asset,
  chain,
  status,
  createdAt,
  walletAddress,
}: WithdrawalTimelineProps) {
  const isPending = status === WITHDRAWAL_STATUS.PENDING;
  const isApproved = status === WITHDRAWAL_STATUS.APPROVED;
  const isCompleted = status === WITHDRAWAL_STATUS.COMPLETED;
  const isFailed = status === WITHDRAWAL_STATUS.FAILED;
  const isCancelled = status === WITHDRAWAL_STATUS.CANCELLED;
  const isEnded = isFailed || isCancelled;

  const terminalLabel = isFailed ? "Failed" : isCancelled ? "Cancelled" : "Funds delivered";

  const steps: { label: string; state: StepState }[] = [
    { label: "Withdrawal submitted", state: "complete" },
    {
      label: "Compliance approval",
      // Reached for approved/completed/cancelled; rejected (failed) never got here.
      state: isFailed ? "failed" : isApproved || isCompleted || isCancelled ? "complete" : "pending",
    },
    {
      label: "Blockchain payout",
      state: isCompleted ? "complete" : isEnded ? "failed" : "pending",
    },
    {
      label: terminalLabel,
      state: isCompleted ? "complete" : isEnded ? "failed" : "pending",
    },
    { label: "Wallet debited", state: isCompleted ? "complete" : "pending" },
  ];

  const helper = isCompleted
    ? {
        text: "Funds sent successfully and your wallet has been debited.",
        className: "text-emerald-300",
      }
    : isEnded
      ? {
          text: "This withdrawal failed or was cancelled.",
          className: "text-rose-300",
        }
      : isApproved
        ? {
            text: "Awaiting blockchain payout.",
            className: "text-slate-400",
          }
        : {
            text: "Your withdrawal is awaiting approval.",
            className: "text-slate-400",
          };

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-950/60 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-base font-semibold text-white">{formatUSDC(amount)}</span>
          <span className="text-xs text-slate-400">
            {asset} · {chain}
          </span>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${
              statusBadgeClass[status] ?? statusBadgeClass.pending
            }`}
          >
            {status}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs sm:flex-col sm:items-end sm:gap-1">
          <span className="text-slate-500">{formatDate(createdAt)}</span>
          {walletAddress ? (
            <a
              href={explorerAddressUrl(walletAddress)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-emerald-300 underline-offset-2 hover:underline"
            >
              {shorten(walletAddress)}
            </a>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {steps.map((step, index) => (
          <div key={`${step.label}-${index}`} className="flex items-center gap-2">
            <StepDot state={step.state} />
            <span className={`text-xs ${stepLabelClass[step.state]}`}>{step.label}</span>
          </div>
        ))}
      </div>

      <p className={`text-xs ${helper.className}`}>{helper.text}</p>
    </div>
  );
}
