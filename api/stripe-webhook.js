import Stripe from "stripe";
import axios from "axios";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const event = req.body;

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // Fetch full line items from Stripe
      const lineItems = await stripe.checkout.sessions.listLineItems(
        session.id
      );

      const courseName =
        lineItems.data[0]?.description || "Unknown Course";

      const amount = session.amount_total / 100;
      const email = session.customer_details.email;

      // Send clean data to GHL
      await axios.post(process.env.GHL_WEBHOOK_URL, {
        email,
        courseName,
        amount,
        stripeSessionId: session.id
      });
    }

    return res.status(200).send("Success");
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Webhook Error");
  }
}