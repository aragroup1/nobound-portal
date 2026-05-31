"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireClient } from "@/lib/auth";

export async function redirectToCheckout(formData: FormData) {
  const { supabase, user } = await requireClient();
  const ticketId = z.string().uuid().parse(formData.get("ticketId"));

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("profile_id", user.id)
    .single();
  if (!client) throw new Error("Client missing.");

  const { data: ticket } = await supabase
    .from("tickets")
    .select("stripe_session_id, status")
    .eq("id", ticketId)
    .eq("client_id", client.id)
    .single();

  if (!ticket?.stripe_session_id || ticket.status !== "awaiting_payment") {
    throw new Error("This ticket is not ready for payment.");
  }

  // Stripe Checkout sessions have a URL we can redirect to; admin server already stored session id.
  // Retrieving the session is cheap and works whether or not the URL is still valid.
  const { stripe } = await import("@/lib/stripe");
  const session = await stripe.checkout.sessions.retrieve(ticket.stripe_session_id);
  if (!session.url) throw new Error("Checkout link has expired. Ask us to resend.");
  redirect(session.url);
}
