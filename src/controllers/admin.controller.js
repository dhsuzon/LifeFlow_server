import { ObjectId } from "mongodb";
import { users } from "../models/userModel.js";
import { donationRequests } from "../models/donationRequestModel.js";
import { funds } from "../models/fundingModel.js";
import {
  clean,
  jsonError,
  parsePagination,
  serializeRequest,
} from "../utils/response.js";

const requestStatuses = new Set(["pending", "inprogress", "done", "canceled"]);

export const getUsers = async (req, res) => {
  if (req.user.role !== "admin") return jsonError(res, 403, "Forbidden.");
  const selectedStatus = ["active", "blocked"].includes(req.query.status)
    ? req.query.status
    : "all";
  const { page, pageSize } = parsePagination(req.query, 10, 20);
  const query = selectedStatus === "all" ? {} : { status: selectedStatus };

  const collection = users();
  const totalItems = await collection.countDocuments(query);
  const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  const docs = await collection
    .find(query, { projection: { password: 0 } })
    .sort({ createdAt: -1, _id: -1 })
    .skip((currentPage - 1) * pageSize)
    .limit(pageSize)
    .toArray();

  return res.json({
    success: true,
    selectedStatus,
    users: docs.map((item) => ({
      id: item.id || item._id.toString(),
      name: item.name,
      email: item.email,
      image: item.image || "",
      role: item.role || "donor",
      status: item.status || "active",
    })),
    pagination: { currentPage, pageSize, totalItems, totalPages },
  });
};

export const updateUser = async (req, res) => {
  const admin = req.user;
  if (admin.role !== "admin") return jsonError(res, 403, "Forbidden.");

  const update = {};
  if (["active", "blocked"].includes(req.body?.status))
    update.status = req.body.status;
  if (["donor", "volunteer", "admin"].includes(req.body?.role))
    update.role = req.body.role;
  if (!Object.keys(update).length)
    return jsonError(res, 400, "Invalid update.");
  if (req.params.id === admin.id && update.status === "blocked") {
    return jsonError(res, 400, "You cannot block your own account.");
  }

  const query = ObjectId.isValid(req.params.id)
    ? { $or: [{ id: req.params.id }, { _id: new ObjectId(req.params.id) }] }
    : { id: req.params.id };
  const result = await users().updateOne(query, {
    $set: { ...update, updatedAt: new Date() },
  });
  if (!result.matchedCount) return jsonError(res, 404, "User not found.");
  return res.json({ success: true });
};

export const getRequests = async (req, res) => {
  const user = req.user;
  if (!["admin", "volunteer"].includes(user.role))
    return jsonError(res, 403, "Forbidden.");
  const selectedStatus = requestStatuses.has(req.query.status)
    ? req.query.status
    : "all";
  const { page, pageSize } = parsePagination(req.query, 10, 20);
  const query =
    selectedStatus === "all" ? {} : { donationStatus: selectedStatus };

  const collection = donationRequests();
  const totalItems = await collection.countDocuments(query);
  const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  const docs = await collection
    .find(query)
    .sort({ createdAt: -1, _id: -1 })
    .skip((currentPage - 1) * pageSize)
    .limit(pageSize)
    .toArray();

  return res.json({
    success: true,
    role: user.role,
    selectedStatus,
    requests: docs.map(serializeRequest),
    pagination: { currentPage, pageSize, totalItems, totalPages },
  });
};

export const updateRequestStatus = async (req, res) => {
  if (!["admin", "volunteer"].includes(req.user.role))
    return jsonError(res, 403, "Forbidden.");
  if (!ObjectId.isValid(req.params.id))
    return jsonError(res, 400, "Invalid update.");
  const nextStatus = clean(req.body?.status);
  if (!requestStatuses.has(nextStatus))
    return jsonError(res, 400, "Invalid update.");

  await donationRequests().updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: { donationStatus: nextStatus, updatedAt: new Date() } },
  );
  return res.json({ success: true });
};

export const getStats = async (req, res) => {
  if (!["admin", "volunteer"].includes(req.user.role))
    return jsonError(res, 403, "Forbidden.");

  const [totalUsers, totalRequests, fundsAgg, statusGroups] = await Promise.all(
    [
      users().countDocuments({ role: "donor" }),
      donationRequests().countDocuments(),
      funds()
        .aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }])
        .toArray(),
      donationRequests()
        .aggregate([{ $group: { _id: "$donationStatus", count: { $sum: 1 } } }])
        .toArray(),
    ],
  );

  return res.json({
    success: true,
    totalUsers,
    totalRequests,
    totalFunding: fundsAgg[0]?.total || 0,
    statusCounts: Object.fromEntries(
      statusGroups.map((item) => [item._id, item.count]),
    ),
  });
};
