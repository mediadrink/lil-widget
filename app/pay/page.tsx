// File: /app/pay/page.tsx
"use client";

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { createClient } from "@/utils/supabase/client";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);

    const { error } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: "http://localhost:3000/dashboard",
      },
    });

    if (error) {
      setMessage(error.message || "An unexpected error occurred.");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4 p-6">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || loading}
        className="bg-green-600 text-white px-4 py-2 rounded w-full"
      >
        {loading ? "Processing…" : "Save Payment Method"}
      </button>
      {message && <div className="text-red-500 mt-2">{message}</div>}
    </form>
  );
}

export default function PayPage() {
  const supabase = createClient();
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const response = await fetch("/api/create-setup-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: user?.email }),
      });

      const data = await response.json();
      setClientSecret(data.client_secret);
    };

    fetchData();
  }, [supabase]);

  const appearance = {
    theme: "flat" as const,
  };

  const options = {
    clientSecret,
    appearance,
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">💳 Pay & Finish Setup</h1>
      {clientSecret && (
        <Elements options={options} stripe={stripePromise}>
          <CheckoutForm />
        </Elements>
      )}
    </div>
  );
}
