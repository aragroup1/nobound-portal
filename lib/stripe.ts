import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  appInfo: { name: "NoBound Portal", version: "0.1.0" },
});

export const STRIPE_PRICE_HOSTING = process.env.STRIPE_PRICE_HOSTING!;
export const STRIPE_PRICE_SEO = process.env.STRIPE_PRICE_SEO!;
export const STRIPE_BUILD_PRODUCT_ID = process.env.STRIPE_BUILD_PRODUCT_ID!;
// Product the per-client hosting price is attached to. Optional: if unset, hosting
// falls back to the single fixed STRIPE_PRICE_HOSTING price (no per-client pricing).
export const STRIPE_HOSTING_PRODUCT_ID = process.env.STRIPE_HOSTING_PRODUCT_ID;

// Default monthly hosting price for NEW customers (£15). Existing customers keep
// their own hosting_price_pence. Kept in sync with migration 0003's default.
export const HOSTING_PRICE_PENCE = 1500;

/**
 * Build the recurring hosting line item for a client.
 *
 * Uses the client's own hosting_price_pence (so Shuks stays on £10 while new
 * customers pay £15) via an inline monthly price on the hosting Product. If the
 * hosting Product id isn't configured, falls back to the single fixed hosting
 * price so checkout never breaks.
 */
export function hostingLineItem(
  hostingPricePence: number | null | undefined,
): Stripe.Checkout.SessionCreateParams.LineItem {
  const pence = hostingPricePence ?? HOSTING_PRICE_PENCE;
  if (STRIPE_HOSTING_PRODUCT_ID) {
    return {
      price_data: {
        product: STRIPE_HOSTING_PRODUCT_ID,
        currency: "gbp",
        unit_amount: pence,
        recurring: { interval: "month" },
      },
      quantity: 1,
    };
  }
  return { price: STRIPE_PRICE_HOSTING, quantity: 1 };
}

/**
 * Create a ONE-OFF build fee for a customer as a pending invoice item.
 *
 * Stripe automatically pulls pending invoice items onto the customer's next
 * invoice — which, for a brand-new subscription started via Checkout, is the
 * first subscription invoice. This bills the build cost exactly once, unlike a
 * subscription line item (which would recur every billing period).
 */
export async function createBuildFeeInvoiceItem(
  customerId: string,
  buildCostPence: number,
) {
  return stripe.invoiceItems.create({
    customer: customerId,
    amount: buildCostPence,
    currency: "gbp",
    description: "One-off website build",
  });
}

export function appUrl(path = "/") {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return new URL(path, base).toString();
}

export const PUBLIC_LOGIN_URL = "https://nobound.design/login";
