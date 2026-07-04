function toValidDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Formats a date as "4 Jul 2026". Missing/invalid input renders as "—".
 */
export function formatDate(value: string | Date | null | undefined): string {
  const date = toValidDate(value);
  if (!date) return "—";
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Formats a date with time, e.g. "4 Jul 2026, 09:30". Missing input → "—".
 */
export function formatDateTime(value: string | Date | null | undefined): string {
  const date = toValidDate(value);
  if (!date) return "—";
  return date.toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formats a start–end range, e.g. "1 Jun 2026 – 1 Jul 2026". Each missing
 * bound renders as "—", matching the current period displays.
 */
export function formatPeriod(
  start: string | Date | null | undefined,
  end: string | Date | null | undefined
): string {
  return `${formatDate(start)} – ${formatDate(end)}`;
}
