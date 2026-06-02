import Link from "next/link";
import { requireClient } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { TicketStatusBadge, TicketTypeBadge } from "@/components/shared/status-badge";
import { LinkButton } from "@/components/ui/link-button";
import { formatDateTime, formatGBP } from "@/lib/format";
import { Plus } from "lucide-react";
import type { Ticket } from "@/lib/db/types";

export default async function PortalTicketsPage() {
  const { supabase, user } = await requireClient();
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  const { data: tickets } = client
    ? await supabase
        .from("tickets")
        .select("*")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false })
    : { data: [] as Ticket[] };

  return (
    <>
      <PageHeader
        title="Change requests"
        description="Track every change you've asked for and its status."
        action={
          <LinkButton href="/portal/tickets/new">
            <Plus className="h-4 w-4" /> New request
          </LinkButton>
        }
      />
      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {((tickets ?? []) as Ticket[]).map((t) => (
          <Link
            key={t.id}
            href={`/portal/tickets/${t.id}`}
            className="block p-5 hover:bg-secondary/40 transition-colors"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="font-medium">{t.title}</div>
                <div className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                  {t.description}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatDateTime(t.created_at)}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <TicketTypeBadge type={t.type} />
                <span className="font-mono text-sm">{formatGBP(t.price_pence)}</span>
                <TicketStatusBadge status={t.status} />
              </div>
            </div>
          </Link>
        ))}
        {(tickets?.length ?? 0) === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            No change requests yet.
            <div className="mt-4">
              <LinkButton href="/portal/tickets/new">
                <Plus className="h-4 w-4" /> Raise your first
              </LinkButton>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
