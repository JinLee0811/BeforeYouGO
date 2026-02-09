import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { supabase } from "@/lib/supabaseClient";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

// IMPORTANT: Verify these Price IDs match the AUD prices in your Stripe dashboard!
const SUBSCRIPTION_PRICES = {
  monthly: "price_1RHaOCC2dAbRllVqPrnRujsK", // Corresponds to $9.99 AUD / month?
  weekly: "price_1RHaOCC2dAbRllVqggpdgxPZ", // Corresponds to $4.99 AUD / week?
  daily: "price_1RHaOCC2dAbRllVqU1iuAGJh", // Corresponds to $1.99 AUD / day?
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser(req.headers.authorization?.split(" ")[1]);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { priceId, successUrl, cancelUrl } = req.body;

    if (!priceId || !successUrl || !cancelUrl) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    if (!SUBSCRIPTION_PRICES[priceId as keyof typeof SUBSCRIPTION_PRICES]) {
      return res.status(400).json({ error: "Invalid price ID" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: SUBSCRIPTION_PRICES[priceId as keyof typeof SUBSCRIPTION_PRICES],
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: user.email,
      metadata: {
        userId: user.id,
        subscriptionType: priceId,
      },
    });

    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
}
