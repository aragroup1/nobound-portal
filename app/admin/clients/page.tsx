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
import { Plus } from "lucide-react";
import type { Client } from "@/lib/db/types";

function monthlyTotal(client: Client) {
  return (client.has_hosting ? 1000 : 0) + (client.has_seo ? 10000 : 0);
}

export default async function ClientsPage() {
  const { supabase } = await requireAdmin();
  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader
        title="Clients"
        description={`${clients?.length ?? 0} total`}
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
              <TableHead>Client</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Monthly</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>Next bill</TableHead>
              <TableHead>Started</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(clients ?? []).map((c) => (
              <TableRow key={c.id} className="hover:bg-secondary/40">
                <TableCell>
                  <Link
                    href={`/admin/clients/${c.id}`}
                    className="font-medium hover:text-primary"
                  >
                    {c.name}
                  </Link>
                  <div className="text-xs text-muted-foreground">{c.email}</div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {[c.has_hosting && "Hosting", c.has_seo && "SEO"]
                    .filter(Boolean)
                    .join(" + ") || "—"}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {formatGBP(monthlyTotal(c))}
                </TableCell>
                <TableCell>
                  <SubscriptionStatusBadge status={c.subscription_status} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(c.current_period_end)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(c.started_at)}
                </TableCell>
              </TableRow>
            ))}
            {(clients?.length ?? 0) === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
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
