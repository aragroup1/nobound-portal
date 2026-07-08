"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type Stripe from "stripe";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { stripe, STRIPE_PRICE_SEO, HOSTING_PRICE_PENCE, hostingLineItem, createBuildFeeInvoiceItem, appUrl, PUBLIC_LOGIN_URL } from "@/lib/stripe";
import { sendEmail } from "@/lib/email";
import { ClientWelcomeEmail } from "@/emails/client-welcome";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  business_name: z.string().optional().nullable(),
  website_url: z.string().url().optional().or(z.literal("")).nullable(),
  has_hosting: z.boolean(),
  has_seo: z.boolean(),
  build_cost_pence: z.number().int().min(0).nullable(),
  started_at: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
});

export type OnboardState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  result?: {
    clientId: string;
    password: string;
    checkoutUrl: string;
    loginUrl: string;
  };
};

function generatePassword(length = 14) {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*";
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => charset[n % charset.length]).join("");
}

export async function onboardClient(_prev: OnboardState, formData: FormData): Promise<OnboardState> {
  await requireAdmin();

  const buildCostRaw = formData.get("build_cost") as string;
  const buildCostPence = buildCostRaw
    ? Math.round(parseFloat(buildCostRaw) * 100)
    : null;

  const parsed = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    business_name: formData.get("business_name") || null,
    website_url: formData.get("website_url") || null,
    has_hosting: formData.get("has_hosting") === "on",
    has_seo: formData.get("has_seo") === "on",
    build_cost_pence: buildCostPence && !isNaN(buildCostPence) && buildCostPence > 0 ? buildCostPence : null,
    started_at: formData.get("started_at") || null,
    notes: formData.get("notes") || null,
    password: (formData.get("password") as string) || null,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path.join(".")] = issue.message;
    }
    return { ok: false, fieldErrors };
  }
  const data = parsed.data;

  if (!data.has_hosting && !data.has_seo) {
    return { ok: false, message: "Pick at least one plan (hosting or SEO)." };
  }

  const admin = createSupabaseAdminClient();

  const password = (data.password && data.password.length >= 8) ? data.password : generatePassword();

  let userId: string;
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: data.email,
    password,
    email_confirm: true,
  });

  if (createErr) {
    if (createErr.message.toLowerCase().includes("already")) {
      const { data: list } = await admin.auth.admin.listUsers();
      const existing = list?.users.find((u) => u.email?.toLowerCase() === data.email.toLowerCase());
      if (!existing) return { ok: false, message: createErr.message };
      userId = existing.id;
      await admin.auth.admin.updateUserById(userId, { password, email_confirm: true });
    } else {
      return { ok: false, message: createErr.message };
    }
  } else {
    userId = created.user.id;
  }

  await admin.from("profiles").upsert({ id: userId, role: "client" });

  const customer = await stripe.customers.create({
    email: data.email,
    name: data.name,
    metadata: { onboarded_via: "nobound-portal" },
  });

  const { data: clientRow, error: insertErr } = await admin
    .from("clients")
    .insert({
      profile_id: userId,
      name: data.name,
      email: data.email,
      business_name: data.business_name,
      website_url: data.website_url || null,
      has_hosting: data.has_hosting,
      has_seo: data.has_seo,
      hosting_price_pence: HOSTING_PRICE_PENCE,
      build_cost_pence: data.build_cost_pence,
      started_at: data.started_at || new Date().toISOString().slice(0, 10),
      notes: data.notes,
      stripe_customer_id: customer.id,
      subscription_status: "none",
    })
    .select()
    .single();

  if (insertErr) return { ok: false, message: insertErr.message };

  await stripe.customers.update(customer.id, { metadata: { client_id: clientRow.id } });

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  if (data.has_hosting) lineItems.push(hostingLineItem(HOSTING_PRICE_PENCE));
  if (data.has_seo) lineItems.push({ price: STRIPE_PRICE_SEO, quantity: 1 });

  // One-off build fee: attach as a pending invoice item on the customer so Stripe
  // folds it into the FIRST subscription invoice only. It must NOT be a recurring
  // subscription line item, or the client would be charged the build cost every month.
  if (data.build_cost_pence && data.build_cost_pence > 0) {
    await createBuildFeeInvoiceItem(customer.id, data.build_cost_pence);
  }

  const onboardingCoupon = process.env.STRIPE_ONBOARDING_COUPON_ID;
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customer.id,
    line_items: lineItems,
    success_url: appUrl("/portal?welcome=1"),
    cancel_url: appUrl("/portal?cancelled=1"),
    subscription_data: { metadata: { client_id: clientRow.id } },
    metadata: { client_id: clientRow.id, kind: "subscription" },
    ...(onboardingCoupon ? { discounts: [{ coupon: onboardingCoupon }] } : {}),
  });

  try {
    await sendEmail({
      to: data.email,
      subject: "Welcome to NoBound — set up your account",
      react: ClientWelcomeEmail({
        name: data.name,
        checkoutUrl: session.url!,
        loginUrl: PUBLIC_LOGIN_URL,
        hosting: data.has_hosting,
        seo: data.has_seo,
        buildCostPence: data.build_cost_pence,
      }),
    });
  } catch (err) {
    console.error("Welcome email failed:", err);
  }

  revalidatePath("/admin/clients");
  return {
    ok: true,
    result: {
      clientId: clientRow.id,
      password,
      checkoutUrl: session.url!,
      loginUrl: PUBLIC_LOGIN_URL,
    },
  };
}
