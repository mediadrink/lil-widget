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
        payment_method_types: ["card"],
      },
      expand: ["latest_invoice.payment_intent"],
      metadata: {
        user_id: user.id,
        user_email: email,
      },
      description: "Lil Widget - Growth Plan",
    });

    console.log("✅ Subscription created:", subscription.id);
    console.log("📋 Subscription status:", subscription.status);
    console.log("📄 Latest invoice type:", typeof subscription.latest_invoice);

    // Handle expanded latest_invoice (will be Invoice object when expanded)
    const latestInvoice = subscription.latest_invoice as any;

    console.log("📄 Is latest_invoice a string?", typeof latestInvoice === 'string');
    console.log("📄 Latest invoice ID:", typeof latestInvoice === 'string' ? latestInvoice : latestInvoice?.id);

    if (typeof latestInvoice === 'string') {
      console.error("❌ PROBLEM: latest_invoice is a string ID, not expanded object!");
      console.error("❌ This means expand parameter didn't work");
      return NextResponse.json(
        { error: "Stripe configuration error: invoice not expanded" },
        { status: 500 }
      );
    }

    // Check invoice details
    console.log("💰 Invoice status:", latestInvoice?.status);
    console.log("💰 Invoice amount_due:", latestInvoice?.amount_due);
    console.log("💰 Invoice total:", latestInvoice?.total);
    console.log("💰 Invoice payment_intent (raw):", latestInvoice?.payment_intent);

    let paymentIntent = latestInvoice?.payment_intent;
    console.log("💳 Payment intent type:", typeof paymentIntent);
    console.log("💳 Payment intent ID:", typeof paymentIntent === 'string' ? paymentIntent : paymentIntent?.id);
    console.log("💳 Payment intent status:", typeof paymentIntent === 'object' ? paymentIntent?.status : 'N/A');

    // If payment_intent is missing, manually create one
    if (!paymentIntent && latestInvoice?.id && latestInvoice?.amount_due) {
      console.log("⚠️ No payment intent found, creating one manually...");
      try {
        const createdPaymentIntent = await stripe.paymentIntents.create({
          amount: latestInvoice.amount_due,
          currency: latestInvoice.currency || 'usd',
          customer: customer.id,
          metadata: {
            invoice_id: latestInvoice.id,
            subscription_id: subscription.id,
            user_id: user.id,
          },
          setup_future_usage: 'off_session',
          statement_descriptor: 'MEDIADRINK LILWIDGET',
        });
        console.log("✅ Payment intent created manually:", createdPaymentIntent.id);
        paymentIntent = createdPaymentIntent;
        console.log("💳 Manual payment intent status:", paymentIntent.status);

        // Update the invoice to use this payment intent
        try {
          await stripe.invoices.update(latestInvoice.id, {
            default_payment_method: undefined, // Clear to allow payment_intent
          });
          console.log("✅ Invoice updated to use manual payment intent");
        } catch (updateError) {
          console.log("⚠️ Could not update invoice (non-critical):", updateError);
        }
      } catch (createError) {
        console.error("❌ Failed to create payment intent:", createError);
      }
    }

    const clientSecret = typeof paymentIntent === 'object' ? paymentIntent?.client_secret : null;

    console.log("🔑 Client secret:", clientSecret ? "✅ present" : "❌ missing");

    if (!clientSecret) {
      console.error("❌ No client secret found after all attempts");
      console.error("Debug info:", {
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        latestInvoiceType: typeof latestInvoice,
        latestInvoiceStatus: latestInvoice?.status,
        paymentIntentType: typeof paymentIntent,
        paymentIntentStatus: typeof paymentIntent === 'object' ? paymentIntent?.status : 'N/A'
      });
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
