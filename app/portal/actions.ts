"use server";

import { redirect } from "next/navigation";
import { requireClient } from "@/lib/auth";
import { stripe, appUrl } from "@/lib/stripe";

export async function openBillingPortal() {
  const { supabase, user } = await requireClient();
  const { data: client } = await supabase
    .from("clients")
    .select("stripe_customer_id")
    .eq("profile_id", user.id)
    .single();
  if (!client?.stripe_customer_id) throw new Error("No Stripe customer on file.");
  const session = await stripe.billingPortal.sessions.create({
    customer: client.stripe_customer_id,
    return_url: appUrl("/portal"),
  });
  redirect(session.url);
}
