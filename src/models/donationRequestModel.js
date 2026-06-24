import { db } from "../config/db.js";

export const donationRequests = () => db.collection("donationRequests");
