import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const event = req.body;

    const userId = event.data?.user?.id;
    if (!userId) {
      return res.status(200).send("No user ID found");
    }

    // 🔥 Fetch full user from Disco API
    const discoResponse = await axios.get(
      `https://api.disco.co/v1/users/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.DISCO_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const user = discoResponse.data;

    // Extract fields
    const firstName = user.first_name || null;
    const lastName = user.last_name || null;
    const email = user.email || null;
    const phone = user.phone || null;

    // Custom fields (adjust based on Disco structure)
    const industry = user.profile?.industry || null;
    const position = user.profile?.position || null;
    const company = user.profile?.company || null;

    // Send to GHL
    await axios.post(process.env.GHL_WEBHOOK_URL, {
      firstName,
      lastName,
      email,
      phone,
      industry,
      position,
      company,
      discoUserId: userId
    });

    return res.status(200).send("Success");

  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
    return res.status(500).send("Webhook Error");
  }
}