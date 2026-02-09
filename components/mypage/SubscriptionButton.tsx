import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { supabase } from "@/lib/supabaseClient";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

interface SubscriptionButtonProps {
  subscriptionType: "monthly" | "weekly" | "daily";
  price: string;
  description: string;
}

export default function SubscriptionButton({
  subscriptionType,
  price,
  description,
}: SubscriptionButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("User is not authenticated.");
      }
      const accessToken = session.access_token;

      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          priceId: subscriptionType,
          successUrl: `${window.location.origin}/my-page?subscription=success`,
          cancelUrl: `${window.location.origin}/my-page?subscription=cancelled`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const { sessionId } = await response.json();
      const stripe = await stripePromise;

      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId });
        if (error) {
          throw error;
        }
      }
    } catch (error: any) {
      console.error("Subscription Error:", error);
      alert(`Payment processing failed: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSubscribe}
      disabled={loading}
      className='w-full bg-blue-600 text-white rounded-lg py-3 px-4 hover:bg-blue-700 transition-colors disabled:opacity-50'>
      {loading ? "Processing..." : `Subscribe for ${price}`}
    </button>
  );
}
