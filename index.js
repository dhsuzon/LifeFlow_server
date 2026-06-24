import dotenv from "dotenv";
dotenv.config({ override: true });

import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";

// লোকাল ফাইল ইমপোর্ট করার সময় অবশ্যই .js এক্সটেনশন দিতে হবে
import { auth } from "./src/config/auth.js";
import { corsOptions } from "./src/middlewares/cors.js";
import * as fundingController from "./src/controllers/funding.controller.js";
import donationRequestRoutes from "./src/routes/donationRequest.routes.js";
import publicRequestRoutes from "./src/routes/publicRequest.routes.js";
import adminRoutes from "./src/routes/admin.routes.js";
import fundingRoutes from "./src/routes/funding.routes.js";
import stripeRoutes from "./src/routes/stripe.routes.js";

const app = express();
const port = process.env.PORT || 4000;

app.use(cors(corsOptions));

// Better Auth হ্যান্ডলার
app.use("/api/auth", toNodeHandler(auth));

// Stripe Webhook (এটি express.json()-এর আগে থাকতে হবে)
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  fundingController.handleWebhook,
);

app.use(express.json());

// Routes
app.get("/", (req, res) =>
  res.json({ status: "ok", message: "LifeFlow server is running" }),
);
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/donation-requests", donationRequestRoutes);
app.use("/api/public-requests", publicRequestRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/funding", fundingRoutes);
app.use("/api/stripe", stripeRoutes);

// সার্ভার স্টার্ট
if (process.env.NODE_ENV !== "production") {
  app.listen(port, () =>
    console.log(`LifeFlow server running on http://localhost:${port}`),
  );
}

export default app;
