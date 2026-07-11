import { formatUSDC } from "@/lib/format/currency";
import { formatDate } from "@/lib/format/date";
import { explorerTxUrl } from "@/lib/web3/networks";
import { DEPOSIT_STATUS } from "@/lib/constants/status";

type DepositTimelineProps = {
  amount: number;
  asset: string;
  chain: string;
  status: string;
  createdAt: string | null;
  txHash: string | null;
  verificationStatus: string;
};

type StepState = "complete" | "failed" | "pending";

const statusBadgeClass: Record<string, string> = {
  pending: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  confirming: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  completed: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  failed: "border-rose-400/30 bg-rose-400/10 text-rose-300",
  cancelled: "border-slate-400/30 bg-slate-400/10 text-slate-300",
};

function shortenHash(hash: string): string {
  return hash.length > 18 ? `${hash.slice(0, 10)}…${hash.slice(-8)}` : hash;
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

export function DepositTimeline({
  amount,
  asset,
  chain,
  status,
  createdAt,
  txHash,
  verificationStatus,
}: DepositTimelineProps) {
  const isCompleted = status === DEPOSIT_STATUS.COMPLETED;
  const isFailed = status === DEPOSIT_STATUS.FAILED || status === DEPOSIT_STATUS.CANCELLED;

  const steps: { label: string; state: StepState }[] = [
    { label: "Blockchain transfer submitted", state: "complete" },
    { label: "Transaction broadcast", state: txHash ? "complete" : "pending" },
    {
      label: "Blockchain verification",
      state:
        verificationStatus === "verified"
          ? "complete"
          : verificationStatus === "failed"
            ? "failed"
            : "pending",
    },
    {
      label: "Compliance approval",
      state: isCompleted ? "complete" : isFailed ? "failed" : "pending",
    },
    { label: "Wallet credited", state: isCompleted ? "complete" : "pending" },
  ];

  const helper = isCompleted
    ? {
        text: "Funds credited to your Inwestim Wallet.",
        className: "text-emerald-300",
      }
    : isFailed
      ? {
          text: "This deposit was rejected or failed blockchain verification.",
          className: "text-rose-300",
        }
      : {
          text: "Blockchain transfer is being verified before compliance approval.",
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
          {txHash ? (
            <a
              href={explorerTxUrl(txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-emerald-300 underline-offset-2 hover:underline"
            >
              {shortenHash(txHash)}
            </a>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {steps.map((step) => (
          <div key={step.label} className="flex items-center gap-2">
            <StepDot state={step.state} />
            <span className={`text-xs ${stepLabelClass[step.state]}`}>{step.label}</span>
          </div>
        ))}
      </div>

      <p className={`text-xs ${helper.className}`}>{helper.text}</p>
    </div>
  );
}
