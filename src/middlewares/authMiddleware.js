const { ObjectId } = require("mongodb");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
const { auth } = require("../config/auth");
const { users } = require("../models/userModel");
const { jsonError } = require("../utils/response");

const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
const jwks = createRemoteJWKSet(new URL(`${clientUrl}/api/auth/jwks`));

function getToken(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return "";
  return header.slice(7);
}

async function resolveUser(identity) {
  if (!identity || (!identity.id && !identity.email)) return null;
  const conditions = [];
  if (identity.id) {
    conditions.push({ id: identity.id });
    if (ObjectId.isValid(identity.id)) conditions.push({ _id: new ObjectId(identity.id) });
  }
  if (identity.email) conditions.push({ email: identity.email });
  const doc = conditions.length ? await users().findOne({ $or: conditions }) : null;
  if (!doc) {
    return identity.email
      ? { id: identity.id || "", name: identity.name || "User", email: identity.email, role: "donor", status: "active" }
      : null;
  }
  return {
    id: doc.id || doc._id.toString(),
    name: doc.name || identity.name || "User",
    email: doc.email || identity.email || "",
    role: doc.role || "donor",
    status: doc.status || "active",
  };
}

async function getCurrentUser(req) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (session?.user) {
      return await resolveUser({ id: session.user.id, email: session.user.email, name: session.user.name });
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
}

async function authenticate(req, res, next) {
  const user = await getCurrentUser(req);
  if (!user) return jsonError(res, 401, "Unauthorized.");
  req.user = user;
  next();
}

module.exports = { authenticate, getCurrentUser };
