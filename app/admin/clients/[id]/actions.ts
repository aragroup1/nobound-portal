"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { stripe, STRIPE_PRICE_HOSTING, STRIPE_PRICE_SEO, appUrl } from "@/lib/stripe";

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
    .select("stripe_customer_id, has_hosting, has_seo")
    .eq("id", clientId)
    .single();

  if (!client?.stripe_customer_id) throw new Error("No Stripe customer on this client.");

  const lineItems: { price: string; quantity: number }[] = [];
  if (client.has_hosting) lineItems.push({ price: STRIPE_PRICE_HOSTING, quantity: 1 });
  if (client.has_seo) lineItems.push({ price: STRIPE_PRICE_SEO, quantity: 1 });
  if (!lineItems.length) throw new Error("Client has no plan selected.");

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
