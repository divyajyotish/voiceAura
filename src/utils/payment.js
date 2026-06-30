// Handles the full "pay ₹19 to unlock" flow:
//   1. Dynamically load Razorpay's checkout script (only once)
//   2. Ask our Netlify function to create an order (server-side, secret-safe)
//   3. Open Razorpay's checkout popup
//   4. On success, send the payment details to our verify function
//   5. Only call onSuccess() if the server confirms the signature is valid
//      - never trust the browser-side "success" callback by itself.

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout"));
    document.body.appendChild(script);
  });
}

export async function startPayment({ onSuccess, onFailure }) {
  try {
    await loadRazorpayScript();

    const orderRes = await fetch("/.netlify/functions/create-order", {
      method: "POST",
    });
    if (!orderRes.ok) throw new Error("Could not create order");
    const order = await orderRes.json();

    const options = {
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.orderId,
      name: "VoiceAura",
      description: "Unlock Full Voice Report",
      theme: { color: "#ffd700" },
      handler: async function (response) {
        try {
          const verifyRes = await fetch("/.netlify/functions/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          const result = await verifyRes.json();

          if (result.verified) {
            onSuccess();
          } else {
            onFailure("Payment could not be verified. Please contact support if money was deducted.");
          }
        } catch (err) {
          console.error(err);
          onFailure("Payment verification failed. Please try again.");
        }
      },
      modal: {
        ondismiss: function () {
          onFailure(null); // user just closed the popup, not a real error
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", function (response) {
      console.error(response.error);
      onFailure("Payment failed. Please try again.");
    });
    rzp.open();
  } catch (err) {
    console.error(err);
    onFailure("Something went wrong starting the payment. Please try again.");
  }
}