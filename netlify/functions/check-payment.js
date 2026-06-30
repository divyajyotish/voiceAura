// Recovery function: lets a user manually verify a payment by its
// Payment ID if the Razorpay checkout widget's success callback never
// fired (a known glitch where the widget shows "Too many requests" /
// a false failure even though the payment was actually captured
// server-side). We look the payment up directly via Razorpay's API
// using our secret key, server-side, so this can't be spoofed.
const Razorpay = require("razorpay");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { paymentId } = JSON.parse(event.body);

    if (!paymentId || typeof paymentId !== "string") {
      return {
        statusCode: 400,
        body: JSON.stringify({ verified: false, error: "Payment ID required" }),
      };
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const payment = await razorpay.payments.fetch(paymentId.trim());

    const isPaid = payment.status === "captured" || payment.status === "authorized";

    return {
      statusCode: 200,
      body: JSON.stringify({
        verified: isPaid,
        status: payment.status,
      }),
    };
  } catch (err) {
    console.error("check-payment error:", err);
    return {
      statusCode: 200,
      body: JSON.stringify({ verified: false, error: "Could not find that payment" }),
    };
  }
};