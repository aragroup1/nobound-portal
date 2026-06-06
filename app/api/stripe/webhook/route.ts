import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe, appUrl } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendEmail, ADMIN_EMAIL } from "@/lib/email";
import { TicketPaidAdminEmail } from "@/emails/ticket-paid-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const sig = request.headers.get("stripe-signature");
  const body = await request.text();
  const secret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig!, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Webhook signature failed: ${message}` }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const kind = session.metadata?.kind;
        if (kind === "ticket" && session.metadata?.ticket_id) {
          const { data: ticket } = await admin
            .from("tickets")
            .update({
              status: "paid",
              paid_at: new Date().toISOString(),
              stripe_payment_intent_id:
                typeof session.payment_intent === "string" ? session.payment_intent : null,
            })
            .eq("id", session.metadata.ticket_id)
            .select("*, clients(name,email)")
            .single();
          if (ticket) {
            const client = (ticket as { clients: { name: string; email: string } | null }).clients;
            await sendEmail({
              to: ADMIN_EMAIL,
              subject: `Paid ticket: ${ticket.title}`,
              react: TicketPaidAdminEmail({
                clientName: client?.name ?? "—",
                title: ticket.title,
                pricePence: ticket.price_pence ?? 0,
                ticketUrl: appUrl(`/admin/tickets/${ticket.id}`),
              }),
            });
          }
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const periodEnd =
          (sub as Stripe.Subscription & { current_period_end?: number }).current_period_end ?? null;

        const { data: updatedClients, error: updateError } = await admin
          .from("clients")
          .update({
            stripe_subscription_id: sub.id,
            subscription_status: sub.status,
            current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          })
          .eq("stripe_customer_id", customerId)
          .select("id");

        if (updateError) {
          console.error("Failed to update client subscription:", updateError);
          return NextResponse.json({ error: "update_failed" }, { status: 500 });
        }

        if (!updatedClients || updatedClients.length === 0) {
          console.error(
            "Webhook: No client found with stripe_customer_id:",
            customerId,
            "for subscription:",
            sub.id,
            "status:",
            sub.status
          );
          return NextResponse.json({ error: "client_not_found" }, { status: 404 });
        }

        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (!customerId) break;
        const { data: client } = await admin
          .from("clients")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();
        if (!client) break;
        const lineFirst = invoice.lines?.data?.[0];
        const period = lineFirst?.period;
        await admin.from("invoices").upsert(
          {
            client_id: client.id,
            stripe_invoice_id: invoice.id!,
            amount_pence: invoice.amount_paid ?? invoice.total ?? 0,
            status: invoice.status ?? "paid",
            invoice_pdf_url: invoice.invoice_pdf ?? null,
            hosted_invoice_url: invoice.hosted_invoice_url ?? null,
            period_start: period?.start ? new Date(period.start * 1000).toISOString() : null,
            period_end: period?.end ? new Date(period.end * 1000).toISOString() : null,
            paid_at: invoice.status_transitions?.paid_at
              ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
              : new Date().toISOString(),
          },
          { onConflict: "stripe_invoice_id" },
        );
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerEmail = invoice.customer_email;
        if (customerEmail) {
          console.warn("Invoice payment failed for", customerEmail, invoice.id);
        }
        break;
      }

      default:
        // ignore everything else
        break;
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "handler_failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
