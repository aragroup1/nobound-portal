"use server";

import { redirect } from "next/navigation";
import type Stripe from "stripe";
import { requireClient } from "@/lib/auth";
import { stripe, appUrl, STRIPE_PRICE_SEO, hostingLineItem, createBuildFeeInvoiceItem } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendEmail, ADMIN_EMAIL } from "@/lib/email";
import { SeoInterestEmail } from "@/emails/seo-interest";

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

export async function requestSeoUpgrade(): Promise<{ ok: boolean; message?: string }> {
  const { supabase, user } = await requireClient();
  const { data: client } = await supabase
    .from("clients")
    .select("id, name, email, business_name, website_url, has_seo")
    .eq("profile_id", user.id)
    .single();
  if (!client) return { ok: false, message: "Client record missing." };
  if (client.has_seo) return { ok: false, message: "SEO is already on your plan." };

  const admin = createSupabaseAdminClient();
  await admin
    .from("clients")
    .update({ notes: `[${new Date().toISOString().slice(0, 10)}] SEO interest from portal` })
    .eq("id", client.id);

  try {
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `SEO interest: ${client.name} (${client.business_name ?? client.email})`,
      react: SeoInterestEmail({
        clientName: client.name,
        businessName: client.business_name,
        email: client.email,
        websiteUrl: client.website_url,
        clientAdminUrl: appUrl(`/admin/clients/${client.id}`),
      }),
    });
  } catch (err) {
    console.error("SEO interest notify failed:", err);
  }

  return { ok: true };
}

export async function startSubscription() {
  const { supabase, user } = await requireClient();
  const { data: client } = await supabase
    .from("clients")
    .select("id, stripe_customer_id, has_hosting, has_seo, hosting_price_pence, build_cost_pence")
    .eq("profile_id", user.id)
    .single();
  if (!client?.stripe_customer_id) throw new Error("No Stripe customer on file.");

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  if (client.has_hosting) lineItems.push(hostingLineItem(client.hosting_price_pence));
  if (client.has_seo) lineItems.push({ price: STRIPE_PRICE_SEO, quantity: 1 });

  if (!lineItems.length) throw new Error("No plan selected on your account. Contact us.");

  // One-off build fee → pending invoice item, folded into the first subscription
  // invoice (see createBuildFeeInvoiceItem). Never a recurring line item.
  if (client.build_cost_pence && client.build_cost_pence > 0) {
    await createBuildFeeInvoiceItem(client.stripe_customer_id, client.build_cost_pence);
  }

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
