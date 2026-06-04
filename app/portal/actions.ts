"use server";

import { redirect } from "next/navigation";
import { requireClient } from "@/lib/auth";
import { stripe, appUrl, STRIPE_PRICE_HOSTING, STRIPE_PRICE_SEO } from "@/lib/stripe";

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

export async function startSubscription() {
  const { supabase, user } = await requireClient();
  const { data: client } = await supabase
    .from("clients")
    .select("id, stripe_customer_id, has_hosting, has_seo")
    .eq("profile_id", user.id)
    .single();
  if (!client?.stripe_customer_id) throw new Error("No Stripe customer on file.");

  const lineItems: { price: string; quantity: number }[] = [];
  if (client.has_hosting) lineItems.push({ price: STRIPE_PRICE_HOSTING, quantity: 1 });
  if (client.has_seo) lineItems.push({ price: STRIPE_PRICE_SEO, quantity: 1 });
  if (!lineItems.length) throw new Error("No plan selected on your account. Contact us.");

  const onboardingCoupon = process.env.STRIPE_ONBOARDING_COUPON_ID;
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: client.stripe_customer_id,
    line_items: lineItems,
    success_url: appUrl("/portal?welcome=1"),
    cancel_url: appUrl("/portal?cancelled=1"),
    subscription_data: { metadata: { client_id: client.id } },
    metadata: { client_id: client.id, kind: "subscription" },
    ...(onboardingCoupon ? { discounts: [{ coupon: onboardingCoupon }] } : {}),
  });

  if (!session.url) throw new Error("Stripe did not return a Checkout URL.");
  redirect(session.url);
}
