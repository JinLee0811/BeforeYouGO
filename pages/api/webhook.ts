import { NextApiRequest, NextApiResponse } from "next";
import { buffer } from "micro";
import Stripe from "stripe";
import { supabase } from "@/lib/supabaseClient";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export const config = {
  api: {
    bodyParser: false,
  },
};

async function updateUserSubscription(
  userId: string,
  subscriptionType: string,
  subscriptionEndsAt: Date | null
) {
  const { error } = await supabase
    .from("profiles")
    .update({
      subscription_type: subscriptionType,
      subscription_expires_at: subscriptionEndsAt,
    })
    .eq("id", userId);

  if (error) {
    console.error("Error updating user subscription:", error);
    throw error;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const buf = await buffer(req);
    const sig = req.headers["stripe-signature"]!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return res.status(400).json({ error: "Webhook signature verification failed" });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const subscriptionType = session.metadata?.subscriptionType;

        if (userId && subscriptionType) {
          // 구독 기간 계산
          let subscriptionEndsAt = new Date();
          switch (subscriptionType) {
            case "monthly":
              subscriptionEndsAt.setMonth(subscriptionEndsAt.getMonth() + 1);
              break;
            case "weekly":
              subscriptionEndsAt.setDate(subscriptionEndsAt.getDate() + 7);
              break;
            case "daily":
              subscriptionEndsAt.setDate(subscriptionEndsAt.getDate() + 1);
              break;
          }

          await updateUserSubscription(userId, subscriptionType, subscriptionEndsAt);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (userId) {
          await updateUserSubscription(userId, "free", null);
        }
        break;
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Webhook handler failed" });
  }
}
