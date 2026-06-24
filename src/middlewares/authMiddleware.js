import { ObjectId } from "mongodb";
import { createRemoteJWKSet, jwtVerify } from "jose-cjs";
import { auth } from "../config/auth.js";
import { users } from "../models/userModel.js";
import { jsonError } from "../utils/response.js";

const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
const jwks = createRemoteJWKSet(new URL(`${clientUrl}/api/auth/jwks`));

const getToken = (req) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return "";
  return header.slice(7);
};

const resolveUser = async (identity) => {
  if (!identity || (!identity.id && !identity.email)) return null;
  const conditions = [];
  if (identity.id) {
    conditions.push({ id: identity.id });
    if (ObjectId.isValid(identity.id))
      conditions.push({ _id: new ObjectId(identity.id) });
  }
  if (identity.email) conditions.push({ email: identity.email });

  const doc = conditions.length
    ? await users().findOne({ $or: conditions })
    : null;

  if (!doc) {
    return identity.email
      ? {
          id: identity.id || "",
          name: identity.name || "User",
          email: identity.email,
          role: "donor",
          status: "active",
        }
      : null;
  }
  return {
    id: doc.id || doc._id.toString(),
    name: doc.name || identity.name || "User",
    email: doc.email || identity.email || "",
    role: doc.role || "donor",
    status: doc.status || "active",
  };
};

export const getCurrentUser = async (req) => {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (session?.user) {
      return await resolveUser({
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      });
    }
  } catch {
    // ignore and fall back to bearer token
  }

  const token = getToken(req);
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, jwks);
    return await resolveUser({
      id: payload.sub || payload.id || payload.userId || payload.user?.id || "",
      email: payload.email || payload.user?.email || "",
      name: payload.name || payload.user?.name || "User",
    });
  } catch {
    return null;
  }
};

export const authenticate = async (req, res, next) => {
  const user = await getCurrentUser(req);
  if (!user) return jsonError(res, 401, "Unauthorized.");
  req.user = user;
  next();
};
