import { notFound } from "next/navigation";
import { requireClient } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { TicketStatusBadge, TicketTypeBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateTime, formatGBP } from "@/lib/format";
import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Ticket } from "@/lib/db/types";
import { redirectToCheckout } from "./actions";

export default async function PortalTicketDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string; cancelled?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const { supabase, user } = await requireClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!client) notFound();

  const { data: ticket } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", id)
    .eq("client_id", client.id)
    .single();
  if (!ticket) notFound();
  const t = ticket as Ticket;

  const canPay = t.status === "awaiting_payment" && (t.price_pence ?? 0) > 0;

  return (
    <>
      <PageHeader
        title={t.title}
        description={`Raised ${formatDateTime(t.created_at)}`}
        action={
          <LinkButton href="/portal/tickets" variant="ghost">
            <ArrowLeft className="h-4 w-4" /> All requests
          </LinkButton>
        }
      />

      {sp.new && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 mb-6 text-sm">
          Request submitted. We&apos;ll come back with a price shortly.
        </div>
      )}
      {sp.cancelled && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 mb-6 text-sm">
          Payment cancelled. You can come back to pay anytime.
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div className="space-y-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Your request</CardTitle>
                <TicketTypeBadge type={t.type} />
              </div>
              <TicketStatusBadge status={t.status} />
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="whitespace-pre-wrap leading-relaxed">{t.description}</p>
              {t.attachment_urls && t.attachment_urls.length > 0 && (
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    Screenshots
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {t.attachment_urls.map((url) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-border bg-card overflow-hidden aspect-video block hover:border-primary/50"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="Attachment" className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {canPay && (
            <Card className="border-primary/40">
              <CardHeader>
                <CardTitle>Ready to pay</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Total</div>
                  <div className="font-heading text-4xl font-semibold mt-1">
                    {formatGBP(t.price_pence)}
                  </div>
                </div>
                <form action={redirectToCheckout}>
                  <input type="hidden" name="ticketId" value={t.id} />
                  <Button type="submit" size="lg" className="w-full">
                    Pay securely with Stripe <ExternalLink className="h-4 w-4" />
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground text-center">
                  We start work as soon as payment lands. You&apos;ll get an email when it&apos;s live.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <aside>
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
