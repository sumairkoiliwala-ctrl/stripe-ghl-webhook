import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const event = req.body;

  try {

    // 1️⃣ First payment (one-time OR subscription start)
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
      const priceType = item.price.type; // one_time or recurring
      const interval = item.price.recurring?.interval || null;

      console.log("Checkout Completed:");
      console.log({
        email,
        courseName,
        amount,
        priceType,
        interval,
        stripeSessionId: session.id
      });
    }

    // 2️⃣ Subscription renewals
    if (event.type === "invoice.paid") {
      const invoice = event.data.object;

      const email = invoice.customer_email;
      const amount = invoice.amount_paid / 100;

      console.log("Subscription Renewal:");
      console.log({
        email,
        amount,
        invoiceId: invoice.id
      });
    }

    return res.status(200).send("Success");

  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Webhook Error");
  }
}