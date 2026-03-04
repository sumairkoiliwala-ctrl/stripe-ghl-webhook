import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    console.log("Disco Payload:");
    console.log(JSON.stringify(req.body, null, 2));

    return res.status(200).send("Received");
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Webhook Error");
  }
}