import Link from "next/link";
import { requireClient } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import {
  SubscriptionStatusBadge,
  TicketStatusBadge,
} from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate, formatDateTime, formatGBP } from "@/lib/format";
import { ExternalLink, Plus, CreditCard, ArrowRight } from "lucide-react";
import type { Client, Ticket } from "@/lib/db/types";
import { openBillingPortal, startSubscription } from "./actions";

export default async function PortalHome() {
  const { supabase, user } = await requireClient();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("profile_id", user.id)
    .single();

  if (!client) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <h1 className="font-heading text-2xl mb-2">Account not ready</h1>
        <p className="text-muted-foreground">
          Your account is being set up. If this is a mistake, drop us a line.
        </p>
      </div>
    );
  }
  const c = client as Client;

  const { data: ticketsData } = await supabase
    .from("tickets")
    .select("*")
    .eq("client_id", c.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const monthly = (c.has_hosting ? 1000 : 0) + (c.has_seo ? 10000 : 0);
  const subscriptionActive = c.subscription_status === "active" || c.subscription_status === "trialing";

  return (
    <>
      <PageHeader
        title={`Welcome, ${c.name.split(" ")[0]}`}
        description={c.business_name ?? undefined}
      />

      {!subscriptionActive && (
        <Card className="mb-8 border-primary/30 bg-primary/5">
          <CardContent className="pt-6 space-y-5">
            <div>
              <div className="font-heading text-xl font-semibold">Start your subscription</div>
              <p className="text-sm text-muted-foreground mt-1">
                Activate your plan to keep your website live and your change requests flowing.
                You&apos;ll enter your card once and be billed monthly — cancel anytime.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              {c.has_hosting && (
                <div className="rounded-lg border border-border bg-card/60 p-4">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Hosting</div>
                  <div className="font-heading text-2xl font-semibold mt-1">£10<span className="text-sm text-muted-foreground font-normal">/mo</span></div>
                </div>
              )}
              {c.has_seo && (
                <div className="rounded-lg border border-border bg-card/60 p-4">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">SEO</div>
                  <div className="font-heading text-2xl font-semibold mt-1">£100<span className="text-sm text-muted-foreground font-normal">/mo</span></div>
                </div>
              )}
              <div className="rounded-lg border border-primary/40 bg-primary/10 p-4">
                <div className="text-xs uppercase tracking-wider text-primary/80">Total today</div>
                <div className="font-heading text-2xl font-semibold mt-1">{formatGBP(monthly)}<span className="text-sm text-muted-foreground font-normal">/mo</span></div>
              </div>
            </div>

            <form action={startSubscription}>
              <Button type="submit" size="lg" className="w-full sm:w-auto">
                Continue to secure checkout <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
            <p className="text-xs text-muted-foreground">
              Payment is processed by Stripe. You&apos;ll see the exact amount and any discounts on the next screen before paying.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6 mb-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Your site</CardTitle>
          </CardHeader>
          <CardContent>
            {c.website_url ? (
              <a
                href={c.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-lg font-medium hover:text-primary"
              >
                {c.website_url.replace(/^https?:\/\//, "")}
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : (
              <span className="text-muted-foreground">Not configured</span>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Subscription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <SubscriptionStatusBadge status={c.subscription_status} />
            <div className="text-2xl font-heading font-semibold">{formatGBP(monthly)}/mo</div>
            <div className="text-xs text-muted-foreground">
              {[c.has_hosting && "Hosting", c.has_seo && "SEO"].filter(Boolean).join(" + ") || "No plan"}
            </div>
            {c.current_period_end && (
              <div className="text-xs text-muted-foreground">
                Next renews {formatDate(c.current_period_end)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Billing</CardTitle>
          </CardHeader>
          <CardContent>
            {subscriptionActive ? (
              <>
                <form action={openBillingPortal}>
                  <Button
                    type="submit"
                    variant="secondary"
                    className="w-full"
                    disabled={!c.stripe_customer_id}
                  >
                    <CreditCard className="h-4 w-4" /> Manage payment &amp; invoices
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground mt-3">
                  Update your card, view invoices, or cancel — all handled securely by Stripe.
                </p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Billing tools appear here once your subscription is active.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl font-semibold">Recent change requests</h2>
          <LinkButton href="/portal/tickets/new">
            <Plus className="h-4 w-4" /> New request
          </LinkButton>
        </div>
        <div className="rounded-xl border border-border bg-card divide-y divide-border">
          {((ticketsData ?? []) as Ticket[]).map((t) => (
            <Link
              key={t.id}
              href={`/portal/tickets/${t.id}`}
              className="flex items-center justify-between gap-4 p-4 hover:bg-secondary/40 transition-colors"
            >
              <div className="min-w-0">
                <div className="font-medium truncate">{t.title}</div>
                <div className="text-xs text-muted-foreground">{formatDateTime(t.created_at)}</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono text-sm">{formatGBP(t.price_pence)}</span>
                <TicketStatusBadge status={t.status} />
              </div>
            </Link>
          ))}
          {(ticketsData?.length ?? 0) === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No requests yet. Need a change to your site?{" "}
              <Link href="/portal/tickets/new" className="text-primary hover:underline">
                Raise one
              </Link>.
            </div>
          )}
        </div>
      </section>
    </>
  );
}
