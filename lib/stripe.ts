import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  appInfo: { name: "NoBound Portal", version: "0.1.0" },
});

export const STRIPE_PRICE_HOSTING = process.env.STRIPE_PRICE_HOSTING!;
export const STRIPE_PRICE_SEO = process.env.STRIPE_PRICE_SEO!;

export function appUrl(path = "/") {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return new URL(path, base).toString();
}

export const PUBLIC_LOGIN_URL = "https://nobound.design/login";
