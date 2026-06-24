import { db } from "../config/db.js";

export const users = () => db.collection("user");
