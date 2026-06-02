import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { TicketStatusBadge, TicketTypeBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateTime, formatGBP } from "@/lib/format";
import { ArrowLeft } from "lucide-react";
import type { Ticket, Client } from "@/lib/db/types";
import { setPrice, sendForPayment, setStatus } from "./actions";

type Row = Ticket & { clients: Pick<Client, "id" | "name" | "email" | "stripe_customer_id"> | null };

export default async function AdminTicketDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("tickets")
    .select("*, clients(id,name,email,stripe_customer_id)")
    .eq("id", id)
    .single();
  if (!data) notFound();
  const t = data as Row;

  const isClosed = ["complete", "cancelled", "declined"].includes(t.status);
  const canSetPrice = ["new", "priced"].includes(t.status);
  const canSendForPayment = t.status === "priced" && (t.price_pence ?? 0) > 0;
  const canMarkProgress = t.status === "paid";
  const canMarkComplete = ["paid", "in_progress"].includes(t.status);

  return (
    <>
      <PageHeader
        title={t.title}
        description={`Raised by ${t.clients?.name} · ${formatDateTime(t.created_at)}`}
        action={
          <LinkButton href="/admin/tickets" variant="ghost">
            <ArrowLeft className="h-4 w-4" /> All tickets
          </LinkButton>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div className="space-y-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Request</CardTitle>
                <TicketTypeBadge type={t.type} />
              </div>
              <TicketStatusBadge status={t.status} />
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap leading-relaxed">{t.description}</p>
            </CardContent>
          </Card>

          {canSetPrice && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Set price</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={setPrice} className="space-y-4">
                  <input type="hidden" name="ticketId" value={t.id} />
                  <div className="space-y-2">
                    <Label htmlFor="pricePounds">Price (£)</Label>
                    <Input
                      id="pricePounds"
                      name="pricePounds"
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      defaultValue={t.price_pence ? (t.price_pence / 100).toFixed(2) : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adminNotes">Internal notes</Label>
                    <Textarea
                      id="adminNotes"
                      name="adminNotes"
                      rows={3}
                      defaultValue={t.admin_notes ?? ""}
                    />
                  </div>
                  <Button type="submit">Save price</Button>
                </form>
              </CardContent>
            </Card>
          )}

          {canSendForPayment && (
            <Card>
              <CardContent className="pt-6">
                <form action={sendForPayment}>
                  <input type="hidden" name="ticketId" value={t.id} />
                  <p className="text-sm text-muted-foreground mb-3">
                    Email the client a Stripe Checkout link for{" "}
                    <span className="font-mono text-foreground">{formatGBP(t.price_pence)}</span>.
                  </p>
                  <Button type="submit">Send for payment</Button>
                </form>
              </CardContent>
            </Card>
          )}

          {!isClosed && (canMarkProgress || canMarkComplete) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Update status</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-2">
                {canMarkProgress && (
                  <form action={setStatus}>
                    <input type="hidden" name="ticketId" value={t.id} />
                    <input type="hidden" name="status" value="in_progress" />
                    <Button type="submit" variant="secondary">
                      Mark in progress
                    </Button>
                  </form>
                )}
                {canMarkComplete && (
                  <form action={setStatus}>
                    <input type="hidden" name="ticketId" value={t.id} />
                    <input type="hidden" name="status" value="complete" />
                    <Button type="submit">Mark complete</Button>
                  </form>
                )}
                <form action={setStatus}>
                  <input type="hidden" name="ticketId" value={t.id} />
                  <input type="hidden" name="status" value="cancelled" />
                  <Button type="submit" variant="ghost">
                    Cancel
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Client</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1.5">
              <Link
                href={`/admin/clients/${t.clients?.id}`}
                className="block font-medium hover:text-primary"
              >
                {t.clients?.name}
              </Link>
              <a href={`mailto:${t.clients?.email}`} className="block text-muted-foreground hover:text-primary">
                {t.clients?.email}
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-muted-foreground">
              <Timeline label="Raised" value={t.created_at} />
              <Timeline label="Priced" value={t.priced_at} />
              <Timeline label="Sent for payment" value={t.payment_sent_at} />
              <Timeline label="Paid" value={t.paid_at} />
              <Timeline label="Completed" value={t.completed_at} />
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}

function Timeline({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className={value ? "text-foreground" : ""}>{formatDateTime(value)}</span>
    </div>
  );
}
