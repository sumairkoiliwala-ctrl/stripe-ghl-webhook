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

      // Customer info
      const email = fullSession.customer_details?.email || null;
      const fullName = fullSession.customer_details?.name || "";
      const phone = fullSession.customer_details?.phone || null;

      const nameParts = fullName.split(" ");
      const firstName = nameParts[0] || null;
      const lastName = nameParts.slice(1).join(" ") || null;

      // Payment info
      const amount = item.amount_total / 100;
      const priceType = item.price.type; // one_time or recurring
      const interval = item.price.recurring?.interval || null;
      const courseName = item.description;
      const sessionId = session.id;

      // Payment date
      const paymentDate = new Date(fullSession.created * 1000).toISOString();

      await axios.post(process.env.GHL_WEBHOOK_URL, {
        firstName,
        lastName,
        email,
        phone,
        paymentDate,
        amount,
        priceType,
        courseName,
        interval,
        sessionId
      });
    }

    return res.status(200).send("Success");

  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Webhook Error");
  }
}