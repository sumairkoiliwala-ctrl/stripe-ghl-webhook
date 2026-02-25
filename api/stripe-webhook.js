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

      const fullSession = await stripe.checkout.sessions.retrieve(
        session.id,
        { expand: ["line_items.data.price"] }
      );

      const item = fullSession.line_items.data[0];

      const email = fullSession.customer_details?.email || null;
      const courseName = item.description;
      const amount = item.amount_total / 100;
      const priceType = item.price.type;
      const interval = item.price.recurring?.interval || null;

      await axios.post(process.env.GHL_WEBHOOK_URL, {
        email,
        courseName,
        amount,
        priceType,
        interval,
        stripeSessionId: session.id
      });
    }

    if (event.type === "invoice.paid") {
      const invoice = event.data.object;

      await axios.post(process.env.GHL_WEBHOOK_URL, {
        email: invoice.customer_email,
        amount: invoice.amount_paid / 100,
        renewal: true,
        invoiceId: invoice.id
      });
    }

    return res.status(200).send("Success");

  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Webhook Error");
  }
}