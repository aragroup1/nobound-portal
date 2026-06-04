import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import {
  SubscriptionStatusBadge,
  TicketStatusBadge,
} from "@/components/shared/status-badge";
import { LinkButton } from "@/components/ui/link-button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatDateTime, formatGBP } from "@/lib/format";
import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Client, Ticket, Invoice } from "@/lib/db/types";
import { DeleteClientButton } from "./delete-client-button";
import { PaymentLinkButton } from "./payment-link-button";
import { ResetPasswordButton } from "./reset-password-button";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const [{ data: client }, { data: tickets }, { data: invoices }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).single(),
    supabase
      .from("tickets")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("invoices")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!client) notFound();
  const c = client as Client;
  const monthly =
    (c.has_hosting ? 1000 : 0) + (c.has_seo ? 10000 : 0);

  return (
    <>
      <PageHeader
        title={c.name}
        description={c.business_name ?? c.email}
        action={
          <>
            <LinkButton href="/admin/clients" variant="ghost">
              <ArrowLeft className="h-4 w-4" /> All clients
            </LinkButton>
            <DeleteClientButton clientId={c.id} clientName={c.name} />
          </>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6 mb-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <SubscriptionStatusBadge status={c.subscription_status} />
            <div className="text-2xl font-heading font-semibold">{formatGBP(monthly)}/mo</div>
            <div className="text-xs text-muted-foreground">
              Next: {formatDate(c.current_period_end)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <a href={`mailto:${c.email}`} className="block hover:text-primary">
              {c.email}
            </a>
            {c.website_url && (
              <a
                href={c.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-primary"
              >
                {c.website_url} <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lifecycle
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <div>Status: <span className="text-foreground">{c.status}</span></div>
            <div className="text-muted-foreground">Started {formatDate(c.started_at)}</div>
            <div className="text-muted-foreground">Created {formatDate(c.created_at)}</div>
            <div className="pt-3">
              <ResetPasswordButton clientId={c.id} />
            </div>
          </CardContent>
        </Card>
      </div>

      {c.subscription_status !== "active" && c.subscription_status !== "trialing" && (
        <Card className="mb-10 border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-base">Payment not set up yet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Generate a one-time Stripe Checkout link and send it to the client (WhatsApp,
              SMS, your own email — whatever they&apos;ll respond to). Once they pay, the
              webhook will mark their subscription active automatically.
            </p>
            <PaymentLinkButton clientId={c.id} />
          </CardContent>
        </Card>
      )}

      <section className="mb-10">
        <h2 className="font-heading text-xl font-semibold mb-4">Tickets</h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Raised</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {((tickets ?? []) as Ticket[]).map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <Link href={`/admin/tickets/${t.id}`} className="font-medium hover:text-primary">
                      {t.title}
                    </Link>
                  </TableCell>
                  <TableCell><TicketStatusBadge status={t.status} /></TableCell>
                  <TableCell className="font-mono">{formatGBP(t.price_pence)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDateTime(t.created_at)}
                  </TableCell>
                </TableRow>
              ))}
              {(tickets?.length ?? 0) === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    No tickets yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section>
        <h2 className="font-heading text-xl font-semibold mb-4">Invoices</h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {((invoices ?? []) as Invoice[]).map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="text-sm">{formatDateTime(inv.paid_at ?? inv.created_at)}</TableCell>
                  <TableCell className="font-mono">{formatGBP(inv.amount_pence)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{inv.status}</TableCell>
                  <TableCell className="text-right">
                    {inv.hosted_invoice_url && (
                      <a
                        href={inv.hosted_invoice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                      >
                        View <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {(invoices?.length ?? 0) === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    No invoices yet — Stripe will populate this once the first subscription charge runs.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </>
  );
}
