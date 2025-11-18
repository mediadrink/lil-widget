// File: /app/api/create-subscription/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseServer } from "@/lib/supabaseServer";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

export async function POST(req: Request) {
  try {
    const { email, priceId } = await req.json();

    // Get current user for metadata
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const customer = await stripe.customers.create({
      email,
      metadata: {
        user_id: user.id,
        user_email: email,
      },
    });

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [
        {
          price: priceId || process.env.STRIPE_PRICE_ID!,
        },
      ],
      payment_behavior: "default_incomplete",
      payment_settings: {
        save_default_payment_method: "on_subscription",
      },
      expand: ["latest_invoice.payment_intent"],
      metadata: {
        user_id: user.id,
        user_email: email,
      },
    });

    console.log("Subscription created:", subscription.id);
    console.log("Latest invoice type:", typeof subscription.latest_invoice);
    console.log("Latest invoice:", subscription.latest_invoice);

    // Handle expanded latest_invoice (will be Invoice object when expanded)
    const latestInvoice = subscription.latest_invoice as any;
    const paymentIntent = latestInvoice?.payment_intent;

    console.log("Payment intent:", paymentIntent);
    console.log("Payment intent type:", typeof paymentIntent);

    const clientSecret = paymentIntent?.client_secret;

    console.log("Client secret:", clientSecret ? "present" : "missing");

    if (!clientSecret) {
      console.error("No client secret found in subscription response");
      console.error("Full subscription object:", JSON.stringify(subscription, null, 2));
      return NextResponse.json(
        { error: "Failed to get payment details from Stripe" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      clientSecret,
      subscriptionId: subscription.id,
      customerId: customer.id,
    });
  } catch (error) {
    console.error("Stripe subscription error:", error);
    return NextResponse.json(
      { error: "Failed to create Stripe subscription." },
      { status: 500 }
    );
  }
}
