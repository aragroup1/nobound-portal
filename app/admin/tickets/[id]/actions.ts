"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { stripe, appUrl } from "@/lib/stripe";
import { sendEmail } from "@/lib/email";
import { TicketPaymentRequestEmail } from "@/emails/ticket-payment-request";
import { TicketCompleteEmail } from "@/emails/ticket-complete";

const priceSchema = z.object({
  ticketId: z.string().uuid(),
  pricePounds: z.coerce.number().positive().max(100_000),
  adminNotes: z.string().optional().nullable(),
});

export async function setPrice(formData: FormData) {
  await requireAdmin();
  const parsed = priceSchema.parse({
    ticketId: formData.get("ticketId"),
    pricePounds: formData.get("pricePounds"),
    adminNotes: formData.get("adminNotes") || null,
  });
  const admin = createSupabaseAdminClient();
  await admin
    .from("tickets")
    .update({
      price_pence: Math.round(parsed.pricePounds * 100),
      admin_notes: parsed.adminNotes,
      status: "priced",
      priced_at: new Date().toISOString(),
    })
    .eq("id", parsed.ticketId);
  revalidatePath(`/admin/tickets/${parsed.ticketId}`);
  revalidatePath("/admin/tickets");
}

export async function sendForPayment(formData: FormData) {
  await requireAdmin();
  const ticketId = z.string().uuid().parse(formData.get("ticketId"));
  const admin = createSupabaseAdminClient();

  const { data: ticket } = await admin
    .from("tickets")
    .select("*, clients(name,email,stripe_customer_id)")
    .eq("id", ticketId)
    .single();

  if (!ticket || !ticket.price_pence) throw new Error("Ticket has no price set.");
  const client = (ticket as { clients: { name: string; email: string; stripe_customer_id: string | null } | null }).clients;
  if (!client?.stripe_customer_id) throw new Error("Client has no Stripe customer.");

  const onboardingCoupon = process.env.STRIPE_ONBOARDING_COUPON_ID;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: client.stripe_customer_id,
    line_items: [
      {
        price_data: {
          currency: "gbp",
          product_data: {
            name: ticket.title,
            description: ticket.description.slice(0, 300),
          },
          unit_amount: ticket.price_pence,
        },
        quantity: 1,
      },
    ],
    success_url: appUrl(`/portal/pay/success?ticket=${ticket.id}`),
    cancel_url: appUrl(`/portal/tickets/${ticket.id}?cancelled=1`),
    metadata: { ticket_id: ticket.id, kind: "ticket" },
    ...(onboardingCoupon ? { discounts: [{ coupon: onboardingCoupon }] } : {}),
  });

  await admin
    .from("tickets")
    .update({
      stripe_session_id: session.id,
      status: "awaiting_payment",
      payment_sent_at: new Date().toISOString(),
    })
    .eq("id", ticket.id);

  await sendEmail({
    to: client.email,
    subject: `Your change request is ready for payment — ${ticket.title}`,
    react: TicketPaymentRequestEmail({
      name: client.name,
      title: ticket.title,
      pricePence: ticket.price_pence,
      ticketUrl: appUrl(`/portal/tickets/${ticket.id}`),
      checkoutUrl: session.url!,
    }),
  });

  revalidatePath(`/admin/tickets/${ticket.id}`);
}

const statusSchema = z.object({
  ticketId: z.string().uuid(),
  status: z.enum(["in_progress", "complete", "declined", "cancelled"]),
});

export async function setStatus(formData: FormData) {
  await requireAdmin();
  const { ticketId, status } = statusSchema.parse({
    ticketId: formData.get("ticketId"),
    status: formData.get("status"),
  });
  const admin = createSupabaseAdminClient();

  const update: Record<string, unknown> = { status };
  if (status === "complete") update.completed_at = new Date().toISOString();

  const { data: ticket } = await admin
    .from("tickets")
    .update(update)
    .eq("id", ticketId)
    .select("*, clients(name,email)")
    .single();

  if (status === "complete" && ticket) {
    const client = (ticket as { clients: { name: string; email: string } | null }).clients;
    if (client) {
      await sendEmail({
        to: client.email,
        subject: `Your change is live — ${ticket.title}`,
        react: TicketCompleteEmail({
          name: client.name,
          title: ticket.title,
          ticketUrl: appUrl(`/portal/tickets/${ticket.id}`),
        }),
      });
    }
  }

  revalidatePath(`/admin/tickets/${ticketId}`);
  revalidatePath("/admin/tickets");
}

