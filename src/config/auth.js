const { betterAuth } = require("better-auth");
const { mongodbAdapter } = require("better-auth/adapters/mongodb");
const { jwt } = require("better-auth/plugins");
const { client, db } = require("./db");

const auth = betterAuth({
  plugins: [jwt()],
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
  },
  database: mongodbAdapter(db, { client }),
  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "donor" },
      status: { type: "string", defaultValue: "active" },
      bloodGroup: { type: "string" },
      district: { type: "string" },
      upazila: { type: "string" },
    },
  },
});

module.exports = { auth };
