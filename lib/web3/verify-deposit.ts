import {
  createPublicClient,
  http,
  parseUnits,
  parseEventLogs,
  erc20Abi,
  getAddress,
} from "viem";
import { ACTIVE_NETWORK } from "@/lib/web3/networks";
import { MIN_DEPOSIT_CONFIRMATIONS } from "@/lib/env";

export type VerificationCheck = {
  label: string;
  passed: boolean;
  detail?: string;
};

export type VerificationResult = {
  status: "verified" | "failed";
  checks: VerificationCheck[];
};

function normalize(address: string | null | undefined): string | null {
  if (!address) return null;
  try {
    return getAddress(address);
  } catch {
    return null;
  }
}

/**
 * Read-only verification of a USDC deposit on the active EVM network. Fetches
 * the transaction receipt and inspects the USDC Transfer log. Never moves funds
 * and never approves — it only returns pass/fail checks for the admin to review.
 * Network, RPC, USDC contract, and decimals all come from the network registry.
 */
export async function verifyDepositTransaction(params: {
  txHash: string;
  walletAddress: string | null;
  amount: number;
  treasury: string | null | undefined;
  /** Optional RPC override; defaults to the active network's RPC. */
  rpcUrl?: string;
  /** Optional confirmations override; defaults to MIN_DEPOSIT_CONFIRMATIONS. */
  minConfirmations?: number;
}): Promise<VerificationResult> {
  const minConfirmations = params.minConfirmations ?? MIN_DEPOSIT_CONFIRMATIONS;
  const network = ACTIVE_NETWORK;
  const token = network.tokens.USDC;

  const checks: VerificationCheck[] = [];
  const finalize = (): VerificationResult => ({
    status: checks.every((c) => c.passed) ? "verified" : "failed",
    checks,
  });

  const treasury = normalize(params.treasury);
  if (!treasury) {
    checks.push({
      label: "Treasury configured",
      passed: false,
      detail: "Set NEXT_PUBLIC_TREASURY_ADDRESS",
    });
    return finalize();
  }

  const client = createPublicClient({
    chain: network.chain,
    transport: http(params.rpcUrl || network.rpcUrl || undefined),
  });

  let receipt;
  try {
    receipt = await client.getTransactionReceipt({
      hash: params.txHash as `0x${string}`,
    });
  } catch {
    checks.push({
      label: "Transaction exists",
      passed: false,
      detail: `Not found on ${network.name} (may be pending or invalid)`,
    });
    return finalize();
  }

  checks.push({ label: "Transaction exists", passed: true });
  checks.push({
    label: "Transaction succeeded",
    passed: receipt.status === "success",
    detail: receipt.status !== "success" ? `status: ${receipt.status}` : undefined,
  });

  // Confirmations: current head − tx block + 1.
  try {
    const head = await client.getBlockNumber();
    const confirmations =
      head >= receipt.blockNumber
        ? head - receipt.blockNumber + BigInt(1)
        : BigInt(0);
    checks.push({
      label: "Minimum confirmations reached",
      passed: confirmations >= BigInt(minConfirmations),
      detail: `${confirmations.toString()}/${minConfirmations}`,
    });
  } catch {
    checks.push({
      label: "Minimum confirmations reached",
      passed: false,
      detail: "Could not read chain head",
    });
  }

  checks.push({
    label: `Network is ${network.name}`,
    passed: true,
    detail: `chainId ${network.chainId}`,
  });

  // Decode the ERC-20 Transfer logs. Inference (not an erasing annotation) keeps
  // each log's `args` ({ from, to, value }) typed; a decode failure yields [].
  const transfers = (() => {
    try {
      return parseEventLogs({
        abi: erc20Abi,
        eventName: "Transfer",
        logs: receipt.logs,
      });
    } catch {
      return [];
    }
  })();

  const usdc = getAddress(token.address);
  const usdcTransfers = transfers.filter((log) => {
    try {
      return getAddress(log.address) === usdc;
    } catch {
      return false;
    }
  });

  checks.push({
    label: `Token is official ${network.name} USDC`,
    passed: usdcTransfers.length > 0,
    detail:
      usdcTransfers.length === 0 ? `No ${network.name} USDC transfer in this tx` : undefined,
  });
  if (usdcTransfers.length === 0) return finalize();

  const wallet = normalize(params.walletAddress);
  const expected = parseUnits(String(params.amount), token.decimals);

  const fromMatch = usdcTransfers.some(
    (log) => wallet !== null && normalize(log.args.from) === wallet
  );
  const toMatch = usdcTransfers.some(
    (log) => normalize(log.args.to) === treasury
  );
  const amountMatch = usdcTransfers.some(
    (log) =>
      wallet !== null &&
      normalize(log.args.from) === wallet &&
      normalize(log.args.to) === treasury &&
      log.args.value === expected
  );

  checks.push({
    label: "Sender matches wallet address",
    passed: fromMatch,
    detail: fromMatch ? undefined : `expected ${params.walletAddress ?? "—"}`,
  });
  checks.push({
    label: "Recipient matches treasury",
    passed: toMatch,
    detail: toMatch ? undefined : `expected ${params.treasury}`,
  });
  checks.push({
    label: "Amount matches",
    passed: amountMatch,
    detail: amountMatch ? `${params.amount} USDC` : `expected ${params.amount} USDC`,
  });

  return finalize();
}
