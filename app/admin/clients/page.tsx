import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { SubscriptionStatusBadge } from "@/components/shared/status-badge";
import { LinkButton } from "@/components/ui/link-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatGBP } from "@/lib/format";
import { ExternalLink, Plus } from "lucide-react";
import type { Client, Ticket } from "@/lib/db/types";
import { DeleteClientButton } from "./[id]/delete-client-button";

type ClientWithTickets = Client & {
  tickets: Pick<Ticket, "id" | "status" | "price_pence" | "paid_at">[];
};

function monthlyTotal(c: ClientWithTickets) {
  return (c.has_hosting ? (c.hosting_price_pence ?? 1500) : 0) + (c.has_seo ? 10000 : 0);
}

const OPEN_TICKET_STATUSES = ["new", "priced", "awaiting_payment", "paid", "in_progress"];

export default async function ClientsPage() {
  const { supabase } = await requireAdmin();
  const { data: clients } = await supabase
    .from("clients")
    .select("*, tickets(id, status, price_pence, paid_at)")
    .order("created_at", { ascending: false });

  const rows = (clients ?? []) as ClientWithTickets[];
  const activeMrr = rows
    .filter((c) => c.subscription_status === "active" || c.subscription_status === "trialing")
    .reduce((sum, c) => sum + monthlyTotal(c), 0);
  const lifetimeTicketsRevenue = rows.reduce(
    (sum, c) =>
      sum +
      c.tickets
        .filter((t) => t.paid_at)
        .reduce((s, t) => s + (t.price_pence ?? 0), 0),
    0,
  );

  return (
    <>
      <PageHeader
        title="Clients"
        description={`${rows.length} total · ${formatGBP(activeMrr)} MRR · ${formatGBP(lifetimeTicketsRevenue)} lifetime ticket revenue`}
        action={
          <LinkButton href="/admin/clients/new">
            <Plus className="h-4 w-4" /> New client
          </LinkButton>
        }
      />
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[220px]">Client</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Monthly</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>Next bill</TableHead>
              <TableHead>Tickets</TableHead>
              <TableHead>Started</TableHead>
              <TableHead className="w-px"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((c) => {
              const tickets = c.tickets ?? [];
              const open = tickets.filter((t) => OPEN_TICKET_STATUSES.includes(t.status)).length;
              return (
                <TableRow key={c.id} className="hover:bg-secondary/40">
                  <TableCell className="align-top py-3">
                    <Link
                      href={`/admin/clients/${c.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {c.name}
                    </Link>
                    {c.business_name && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {c.business_name}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-0.5">{c.email}</div>
                    {c.website_url && (
                      <a
                        href={c.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary/80 hover:text-primary inline-flex items-center gap-1 mt-0.5"
                      >
                        {c.website_url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground align-top py-3">
                    <div>
                      {[c.has_hosting && "Hosting", c.has_seo && "SEO"]
                        .filter(Boolean)
                        .join(" + ") || "—"}
                    </div>
                    {c.build_cost_pence ? (
                      <div className="text-xs text-foreground mt-0.5">
                        Build {formatGBP(c.build_cost_pence)}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className="font-mono text-sm align-top py-3">
                    {formatGBP(monthlyTotal(c))}
                  </TableCell>
                  <TableCell className="align-top py-3">
                    <SubscriptionStatusBadge status={c.subscription_status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground align-top py-3">
                    {formatDate(c.current_period_end)}
                  </TableCell>
                  <TableCell className="text-sm align-top py-3">
                    <div>
                      {open > 0 ? (
                        <span className="text-amber-300 font-medium">{open} open</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{tickets.length} total</div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground align-top py-3">
                    {formatDate(c.started_at)}
                  </TableCell>
                  <TableCell className="align-top py-3 text-right">
                    <DeleteClientButton clientId={c.id} clientName={c.name} compact />
                  </TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                  No clients yet.
                  <Link href="/admin/clients/new" className="text-primary ml-1 hover:underline">
                    Onboard your first.
                  </Link>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
