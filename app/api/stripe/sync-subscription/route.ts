import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // Only allow admins to trigger this
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("client_id");
  const email = searchParams.get("email");

  if (!clientId && !email) {
    return NextResponse.json(
      { error: "Missing client_id or email parameter" },
      { status: 400 }
    );
  }

  const admin = createSupabaseAdminClient();

  // Find the client
  let query = admin.from("clients").select("*");
  if (clientId) {
    query = query.eq("id", clientId);
  } else {
    query = query.eq("email", email);
  }

  const { data: client, error: clientError } = await query.single();

  if (clientError || !client) {
    return NextResponse.json(
      { error: "Client not found", details: clientError?.message },
      { status: 404 }
    );
  }

  // If no stripe_customer_id, can't look up in Stripe
  if (!client.stripe_customer_id) {
    return NextResponse.json(
      { error: "Client has no stripe_customer_id" },
      { status: 400 }
    );
  }

  try {
    // Look up subscriptions in Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: client.stripe_customer_id,
      status: "all",
      limit: 10,
    });

    const activeSub = subscriptions.data.find(
      (s) => s.status === "active" || s.status === "trialing"
    );

    if (!activeSub) {
      return NextResponse.json({
        client: {
          id: client.id,
          name: client.name,
          email: client.email,
          stripe_customer_id: client.stripe_customer_id,
          current_subscription_status: client.subscription_status,
        },
        stripe_subscriptions_found: subscriptions.data.length,
        stripe_subscriptions: subscriptions.data.map((s) => ({
          id: s.id,
          status: s.status,
          current_period_end: s.current_period_end,
        })),
        message: "No active or trialing subscription found in Stripe",
      });
    }

    // Update the client with the subscription info
    const { data: updated, error: updateError } = await admin
      .from("clients")
      .update({
        stripe_subscription_id: activeSub.id,
        subscription_status: activeSub.status,
        current_period_end: activeSub.current_period_end
          ? new Date(activeSub.current_period_end * 1000).toISOString()
          : null,
      })
      .eq("id", client.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update client", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Subscription synced: ${activeSub.status}`,
      client: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        stripe_customer_id: updated.stripe_customer_id,
        stripe_subscription_id: updated.stripe_subscription_id,
        subscription_status: updated.subscription_status,
        current_period_end: updated.current_period_end,
      },
      stripe_subscription: {
        id: activeSub.id,
        status: activeSub.status,
        current_period_end: activeSub.current_period_end,
      },
    });
  } catch (stripeError) {
    const message =
      stripeError instanceof Error ? stripeError.message : "Unknown Stripe error";
    return NextResponse.json(
      { error: "Stripe API error", details: message },
      { status: 500 }
    );
  }
}
