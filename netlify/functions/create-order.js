// Netlify serverless function: creates a Razorpay order.
// Runs on Netlify's server, NOT in the browser - this is the only safe
// place to use the Razorpay Key Secret. The frontend only ever sees the
// public Key ID and this function's response (an order id).
const Razorpay = require("razorpay");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Report unlock price - kept server-side so it can't be tampered
    // with from the browser (e.g. someone editing frontend JS to pay ₹1).
    const amountInPaise = 2900; // ₹29.00

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `voiceaura_${Date.now()}`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      }),
    };
  } catch (err) {
    console.error("create-order error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to create order" }),
    };
  }
};