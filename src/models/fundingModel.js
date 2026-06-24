import { db } from "../config/db.js";

export const funds = () => db.collection("funds");
