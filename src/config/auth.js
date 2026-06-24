import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { jwt } from "better-auth/plugins";
import { client, db } from "./db.js"; // এখানে .js এক্সটেনশন যোগ করা হয়েছে

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:4000",
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
