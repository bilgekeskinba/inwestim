// Canonical status string constants. Values match the database exactly, so
// swapping literals for these references never changes behavior or output.

export const INVESTMENT_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export const DISTRIBUTION_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
  CANCELLED: "cancelled",
} as const;

export const CYCLE_STATUS = {
  DRAFT: "draft",
  CALCULATED: "calculated",
  APPROVED: "approved",
  PAID: "paid",
  CANCELLED: "cancelled",
} as const;

export const PROPERTY_STATUS = {
  DRAFT: "draft",
  LIVE: "live",
  FUNDED: "funded",
  EXITED: "exited",
} as const;

export const DEPOSIT_STATUS = {
  PENDING: "pending",
  CONFIRMING: "confirming",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
} as const;

export const WITHDRAWAL_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
} as const;

export const WALLET_TX_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;
