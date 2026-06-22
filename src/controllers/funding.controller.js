const Stripe = require("stripe");
const { funds } = require("../models/fundingModel");
const { jsonError } = require("../utils/response");

const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

exports.getFunding = async (req, res) => {
  const records = await funds().find().sort({ fundingDate: -1, _id: -1 }).limit(100).toArray();
  return res.json({
    success: true,
    records: records.map((item) => ({
      id: item._id.toString(),
      userName: item.userName,
      amount: item.amount,
      fundingDate: item.fundingDate?.toISOString?.() || "",
    })),
  });
};

exports.createCheckout = async (req, res) => {
  const user = req.user;
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) return jsonError(res, 503, "Stripe is not configured");
  if (!secretKey.startsWith("sk_")) {
    return jsonError(res, 503, "STRIPE_SECRET_KEY must use an sk_test_ or sk_live_ key, not a publishable key.");
  }

  const amount = Number(req.body?.amount);
  if (!Number.isFinite(amount) || amount < 1 || amount > 100000) {
    return jsonError(res, 400, "Enter a valid amount");
  }

  try {
    const stripe = new Stripe(secretKey);
    const origin = req.headers.origin || clientUrl;
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: Math.round(amount * 100),
            product_data: { name: "LifeFlow Organization Fund" },
          },
        },
      ],
      customer_email: user.email,
      metadata: { userId: user.id, userName: user.name, userEmail: user.email },
      success_url: `${origin}/funding?payment=success`,
      cancel_url: `${origin}/funding?payment=canceled`,
    });
    return res.json({ success: true, url: checkout.url });
  } catch (error) {
    return jsonError(res, 500, error?.message || "Unable to start Stripe Checkout.");
  }
};

exports.handleWebhook = async (req, res) => {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secretKey || !webhookSecret) {
    return res.status(503).send("Stripe is not configured");
  }

  try {
    const stripe = new Stripe(secretKey);
    const signature = req.headers["stripe-signature"];
    const event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      await funds().updateOne(
        { stripeSessionId: session.id },
        {
          $setOnInsert: {
            stripeSessionId: session.id,
            userId: session.metadata?.userId || "",
            userName: session.metadata?.userName || "User",
            userEmail: session.metadata?.userEmail || session.customer_email || "",
            amount: (session.amount_total || 0) / 100,
            currency: session.currency || "usd",
            fundingDate: new Date(),
          },
        },
        { upsert: true },
      );
    }

    return res.json({ received: true });
  } catch (error) {
    return res.status(400).send(error?.message || "Invalid signature");
  }
};
