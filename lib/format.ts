export function formatGBP(pence: number | null | undefined) {
  if (pence == null) return "—";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: pence % 100 === 0 ? 0 : 2,
  }).format(pence / 100);
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const TICKET_TYPE_LABEL: Record<string, string> = {
  modification: "Modification",
  emergency: "Emergency",
};

export const TICKET_STATUS_LABEL: Record<string, string> = {
  new: "New",
  priced: "Priced",
  awaiting_payment: "Awaiting payment",
  paid: "Paid",
  in_progress: "In progress",
  complete: "Complete",
  declined: "Declined",
  cancelled: "Cancelled",
};

export const SUBSCRIPTION_STATUS_LABEL: Record<string, string> = {
  none: "Not set up",
  incomplete: "Setup incomplete",
  trialing: "Trial",
  active: "Active",
  past_due: "Past due",
  unpaid: "Unpaid",
  canceled: "Cancelled",
};
