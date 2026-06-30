// Netlify serverless function: verifies a Razorpay payment signature.
// This is the step that actually proves a payment is genuine - never
// trust the browser's "payment succeeded" callback alone, since that
// JS can be tampered with. The signature can only be produced by
// someone holding the Key Secret (Razorpay's servers), so verifying it
// here confirms the payment is real.
const crypto = require("crypto");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      JSON.parse(event.body);

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return {
        statusCode: 400,
        body: JSON.stringify({ verified: false, error: "Missing fields" }),
      };
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const verified = expectedSignature === razorpay_signature;

    return {
      statusCode: 200,
      body: JSON.stringify({ verified }),
    };
  } catch (err) {
    console.error("verify-payment error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ verified: false, error: "Verification failed" }),
    };
  }
};