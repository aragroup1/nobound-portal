"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type Stripe from "stripe";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { stripe, STRIPE_PRICE_SEO, hostingLineItem, createBuildFeeInvoiceItem, appUrl } from "@/lib/stripe";

const schema = z.object({ clientId: z.string().uuid() });

function generatePassword(length = 14) {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*";
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => charset[n % charset.length]).join("");
}

export async function resetPassword(formData: FormData): Promise<string> {
  await requireAdmin();
  const { clientId } = schema.parse({ clientId: formData.get("clientId") });

  const admin = createSupabaseAdminClient();
  const { data: client } = await admin
    .from("clients")
    .select("profile_id")
    .eq("id", clientId)
    .single();
  if (!client?.profile_id) throw new Error("No login account on this client.");

  const password = generatePassword();
  const { error } = await admin.auth.admin.updateUserById(client.profile_id, { password });
  if (error) throw new Error(error.message);
  return password;
}

export async function generatePaymentLink(formData: FormData): Promise<string> {
  await requireAdmin();
  const { clientId } = schema.parse({ clientId: formData.get("clientId") });

  const admin = createSupabaseAdminClient();
  const { data: client } = await admin
    .from("clients")
    .select("stripe_customer_id, has_hosting, has_seo, hosting_price_pence, build_cost_pence")
    .eq("id", clientId)
    .single();

  if (!client?.stripe_customer_id) throw new Error("No Stripe customer on this client.");

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  if (client.has_hosting) lineItems.push(hostingLineItem(client.hosting_price_pence));
  if (client.has_seo) lineItems.push({ price: STRIPE_PRICE_SEO, quantity: 1 });

  // A subscription-mode Checkout requires at least one recurring line item, so we
  // can only bill a build fee alongside hosting/SEO here. (A build-cost-only client
  // would need a one-off payment link, which this admin flow doesn't create.)
  if (!lineItems.length) {
    throw new Error(
      client.build_cost_pence
        ? "Build-cost-only checkout isn't supported here — the client needs hosting or SEO too."
        : "Client has no plan selected.",
    );
  }

  // One-off build fee → pending invoice item on the first subscription invoice.
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
    subscription_data: { metadata: { client_id: clientId } },
    metadata: { client_id: clientId, kind: "subscription" },
    ...(onboardingCoupon ? { discounts: [{ coupon: onboardingCoupon }] } : {}),
  });

  if (!session.url) throw new Error("Stripe did not return a Checkout URL.");
  return session.url;
}

/**
 * Pull the client's current subscription straight from Stripe and write it to
 * their row. A recovery path for when a webhook was missed (e.g. the endpoint
 * wasn't subscribed to customer.subscription.created). Returns a status message.
 */
export async function syncSubscription(formData: FormData): Promise<string> {
  await requireAdmin();
  const { clientId } = schema.parse({ clientId: formData.get("clientId") });

  const admin = createSupabaseAdminClient();
  const { data: client } = await admin
    .from("clients")
    .select("id, stripe_customer_id")
    .eq("id", clientId)
    .single();

  if (!client) throw new Error("Client not found.");
  if (!client.stripe_customer_id) throw new Error("No Stripe customer on this client.");

  const subscriptions = await stripe.subscriptions.list({
    customer: client.stripe_customer_id,
    status: "all",
    limit: 10,
  });

  const activeSub = subscriptions.data.find(
    (s) => s.status === "active" || s.status === "trialing",
  ) as (Stripe.Subscription & { current_period_end?: number }) | undefined;

  if (!activeSub) {
    throw new Error(
      `No active subscription found in Stripe (${subscriptions.data.length} subscription(s) total).`,
    );
  }

  const { error } = await admin
    .from("clients")
    .update({
      stripe_subscription_id: activeSub.id,
      subscription_status: activeSub.status,
      current_period_end: activeSub.current_period_end
        ? new Date(activeSub.current_period_end * 1000).toISOString()
        : null,
    })
    .eq("id", client.id);

  if (error) throw new Error(`Failed to update client: ${error.message}`);

  revalidatePath(`/admin/clients/${client.id}`);
  return `Synced — subscription is ${activeSub.status}.`;
}

export async function deleteClient(formData: FormData) {
  await requireAdmin();
  const { clientId } = schema.parse({ clientId: formData.get("clientId") });

  const admin = createSupabaseAdminClient();

  const { data: client } = await admin
    .from("clients")
    .select("profile_id, stripe_customer_id, stripe_subscription_id")
    .eq("id", clientId)
    .single();

  if (!client) redirect("/admin/clients");

  if (client.stripe_subscription_id) {
    try {
      await stripe.subscriptions.cancel(client.stripe_subscription_id, {
        invoice_now: false,
        prorate: false,
      });
    } catch (err) {
      console.error("Stripe subscription cancel failed (continuing):", err);
    }
  }

  if (client.stripe_customer_id) {
    try {
      await stripe.customers.del(client.stripe_customer_id);
    } catch (err) {
      console.error("Stripe customer delete failed (continuing):", err);
    }
  }

  await admin.from("clients").delete().eq("id", clientId);

  if (client.profile_id) {
    try {
      await admin.auth.admin.deleteUser(client.profile_id);
    } catch (err) {
      console.error("Supabase auth user delete failed (continuing):", err);
    }
  }

  revalidatePath("/admin/clients");
  redirect("/admin/clients?deleted=1");
}
