import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { TicketStatusBadge, TicketTypeBadge } from "@/components/shared/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime, formatGBP } from "@/lib/format";
import type { Ticket, Client } from "@/lib/db/types";

type TicketWithClient = Ticket & { clients: Pick<Client, "name" | "email"> | null };

export default async function AdminTicketsPage() {
  const { supabase } = await requireAdmin();
  const { data: tickets } = await supabase
    .from("tickets")
    .select("*, clients(name,email)")
    .order("created_at", { ascending: false });

  const list = (tickets ?? []) as TicketWithClient[];
  const emergencies = list.filter((t) => t.type === "emergency" && !["complete", "cancelled", "declined"].includes(t.status));
  const open = list.filter((t) => t.type !== "emergency" && !["complete", "cancelled", "declined"].includes(t.status));
  const closed = list.filter((t) => ["complete", "cancelled", "declined"].includes(t.status));

  return (
    <>
      <PageHeader
        title="Tickets"
        description={`${emergencies.length} emergencies · ${open.length} open · ${closed.length} closed`}
      />
      {emergencies.length > 0 && <Section title="🚨 Emergencies" tickets={emergencies} />}
      <Section title="Open" tickets={open} />
      <Section title="Closed" tickets={closed} muted />
    </>
  );
}

function Section({
  title,
  tickets,
  muted,
}: {
  title: string;
  tickets: TicketWithClient[];
  muted?: boolean;
}) {
  if (tickets.length === 0 && muted) return null;
  return (
    <section className="mb-8">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
        {title}
      </h2>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Raised</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((t) => (
              <TableRow key={t.id} className="hover:bg-secondary/40">
                <TableCell>
                  <Link href={`/admin/tickets/${t.id}`} className="font-medium hover:text-primary">
                    {t.title}
                  </Link>
                  <div className="text-xs text-muted-foreground line-clamp-1">
                    {t.description}
                  </div>
                </TableCell>
                <TableCell><TicketTypeBadge type={t.type} /></TableCell>
                <TableCell className="text-sm">
                  {t.clients?.name}
                  <div className="text-xs text-muted-foreground">{t.clients?.email}</div>
                </TableCell>
                <TableCell><TicketStatusBadge status={t.status} /></TableCell>
                <TableCell className="font-mono">{formatGBP(t.price_pence)}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDateTime(t.created_at)}
                </TableCell>
              </TableRow>
            ))}
            {tickets.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground text-sm">
                  Nothing here.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
