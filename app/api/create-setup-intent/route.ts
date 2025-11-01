// File: /app/api/create-setup-intent/route.ts
import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    const customer = await stripe.customers.create({ email });

    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
    });

    return NextResponse.json({ client_secret: setupIntent.client_secret });
  } catch (error) {
    console.error("Setup Intent error:", error);
    return NextResponse.json(
      { error: "Failed to create setup intent." },
      { status: 500 }
    );
  }
}
