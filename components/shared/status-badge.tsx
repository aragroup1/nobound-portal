import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Siren, Wrench } from "lucide-react";
import { TICKET_STATUS_LABEL, SUBSCRIPTION_STATUS_LABEL, TICKET_TYPE_LABEL } from "@/lib/format";

const TICKET_STYLES: Record<string, string> = {
  new: "bg-sky-500/10 text-sky-300 border-sky-500/20",
  priced: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
  awaiting_payment: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  paid: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  in_progress: "bg-purple-500/10 text-purple-300 border-purple-500/20",
  complete: "bg-green-500/15 text-green-300 border-green-500/30",
  declined: "bg-rose-500/10 text-rose-300 border-rose-500/20",
  cancelled: "bg-zinc-500/10 text-zinc-300 border-zinc-500/20",
};

const SUB_STYLES: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  trialing: "bg-sky-500/10 text-sky-300 border-sky-500/20",
  past_due: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  unpaid: "bg-rose-500/10 text-rose-300 border-rose-500/20",
  incomplete: "bg-zinc-500/10 text-zinc-300 border-zinc-500/20",
  canceled: "bg-zinc-500/10 text-zinc-300 border-zinc-500/20",
  none: "bg-zinc-500/10 text-zinc-300 border-zinc-500/20",
};

export function TicketStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("border", TICKET_STYLES[status])}>
      {TICKET_STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

export function TicketTypeBadge({ type }: { type: string }) {
  if (type === "emergency") {
    return (
      <Badge variant="outline" className="border border-rose-500/30 bg-rose-500/10 text-rose-300 gap-1">
        <Siren className="h-3 w-3" /> {TICKET_TYPE_LABEL.emergency}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border border-border bg-secondary/30 text-muted-foreground gap-1">
      <Wrench className="h-3 w-3" /> {TICKET_TYPE_LABEL.modification}
    </Badge>
  );
}

export function SubscriptionStatusBadge({ status }: { status: string | null | undefined }) {
  const key = status ?? "none";
  return (
    <Badge variant="outline" className={cn("border", SUB_STYLES[key])}>
      {SUBSCRIPTION_STATUS_LABEL[key] ?? key}
    </Badge>
  );
}
