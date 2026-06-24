require("dotenv").config({ override: true });

const express = require("express");
const cors = require("cors");
const { toNodeHandler } = require("better-auth/node");

const { auth } = require("./src/config/auth");
const { corsOptions } = require("./src/middlewares/cors");
const fundingController = require("./src/controllers/funding.controller");
const donationRequestRoutes = require("./src/routes/donationRequest.routes");
const publicRequestRoutes = require("./src/routes/publicRequest.routes");
const adminRoutes = require("./src/routes/admin.routes");
const fundingRoutes = require("./src/routes/funding.routes");
const stripeRoutes = require("./src/routes/stripe.routes");

const app = express();
const port = process.env.PORT || 400;

app.use(cors(corsOptions));

app.use("/api/auth", toNodeHandler(auth));
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  fundingController.handleWebhook,
);
app.use(express.json());

app.get("/", (req, res) =>
  res.json({ status: "ok", message: "LifeFlow server is running" }),
);
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/donation-requests", donationRequestRoutes);
app.use("/api/public-requests", publicRequestRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/funding", fundingRoutes);
app.use("/api/stripe", stripeRoutes);

if (require.main === module) {
  app.listen(port, () =>
    console.log(`LifeFlow server running on http://localhost:${port}`),
  );
}

module.exports = app;
