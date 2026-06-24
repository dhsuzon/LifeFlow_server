import { ObjectId } from "mongodb";
import { donationRequests } from "../models/donationRequestModel.js";
import { users } from "../models/userModel.js";
import { bloodGroups } from "../data/bloodGroups.js";
import {
  clean,
  jsonError,
  parsePagination,
  ownerQuery,
  serializeRequest,
} from "../utils/response.js";
import { isValidLocation } from "../utils/geo.js";

const allowedBloodGroups = new Set(bloodGroups.map((group) => group.name));
const statuses = new Set(["pending", "inprogress", "done", "canceled"]);

const readRequestInput = (body) => {
  return {
    recipientName: clean(body?.recipientName),
    recipientDistrict: clean(body?.recipientDistrict),
    recipientUpazila: clean(body?.recipientUpazila),
    hospitalName: clean(body?.hospitalName),
    fullAddress: clean(body?.fullAddress),
    bloodGroup: clean(body?.bloodGroup),
    donationDate: clean(body?.donationDate),
    donationTime: clean(body?.donationTime),
    requestMessage: clean(body?.requestMessage),
  };
};

export const createRequest = async (req, res) => {
  const user = req.user;
  if (user.status !== "active")
    return jsonError(
      res,
      403,
      "Only active users can create donation requests.",
    );

  const input = readRequestInput(req.body);
  if (Object.values(input).some((value) => !value)) {
    return jsonError(res, 400, "Please complete every required field.");
  }
  if (!allowedBloodGroups.has(input.bloodGroup)) {
    return jsonError(res, 400, "Please select a valid blood group.");
  }
  if (!isValidLocation(input.recipientDistrict, input.recipientUpazila)) {
    return jsonError(res, 400, "Please select a valid district and upazila.");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.donationDate)) {
    return jsonError(res, 400, "Please select a valid donation date.");
  }
  if (!/^\d{2}:\d{2}(?::\d{2})?$/.test(input.donationTime)) {
    return jsonError(res, 400, "Please select a valid donation time.");
  }

  const now = new Date();
  const result = await donationRequests().insertOne({
    requesterId: user.id,
    requesterName: user.name,
    requesterEmail: user.email,
    ...input,
    donationStatus: "pending",
    createdAt: now,
    updatedAt: now,
  });

  return res
    .status(201)
    .json({ success: true, requestId: result.insertedId.toString() });
};

export const getMyRequests = async (req, res) => {
  const user = req.user;
  const selectedStatus = statuses.has(req.query.status)
    ? req.query.status
    : "all";
  const { page, pageSize } = parsePagination(req.query, 5, 20);
  const baseQuery = ownerQuery(user);
  const query =
    selectedStatus === "all"
      ? baseQuery
      : { $and: [baseQuery, { donationStatus: selectedStatus }] };

  const collection = donationRequests();
  const totalItems = await collection.countDocuments(query);
  const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  const documents = await collection
    .find(query)
    .sort({ createdAt: -1, _id: -1 })
    .skip((currentPage - 1) * pageSize)
    .limit(pageSize)
    .toArray();

  return res.json({
    success: true,
    selectedStatus,
    requests: documents.map(serializeRequest),
    pagination: { currentPage, pageSize, totalItems, totalPages },
  });
};

export const getPublicRequests = async (req, res) => {
  const { page, pageSize } = parsePagination(req.query, 9, 24);
  const query = { donationStatus: "pending" };
  const collection = donationRequests();
  const totalItems = await collection.countDocuments(query);
  const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  const requests = await collection
    .find(query)
    .sort({ createdAt: -1, _id: -1 })
    .skip((currentPage - 1) * pageSize)
    .limit(pageSize)
    .toArray();

  return res.json({
    success: true,
    requests: requests.map(serializeRequest),
    pagination: { currentPage, pageSize, totalItems, totalPages },
  });
};

export const searchDonors = async (req, res) => {
  const bloodGroup = clean(req.query.bloodGroup);
  const district = clean(req.query.district);
  const upazila = clean(req.query.upazila);

  if (
    !allowedBloodGroups.has(bloodGroup) ||
    !isValidLocation(district, upazila)
  ) {
    return res.json({ success: true, donors: [] });
  }

  const donors = await users()
    .find(
      { role: "donor", status: "active", bloodGroup, district, upazila },
      {
        projection: {
          name: 1,
          email: 1,
          image: 1,
          bloodGroup: 1,
          district: 1,
          upazila: 1,
        },
      },
    )
    .limit(50)
    .toArray();

  return res.json({
    success: true,
    donors: donors.map((donor) => ({
      id: donor._id.toString(),
      name: donor.name,
      email: donor.email,
      image: donor.image || "",
      bloodGroup: donor.bloodGroup,
      district: donor.district,
      upazila: donor.upazila,
    })),
  });
};

export const getPublicRequestById = async (req, res) => {
  if (!ObjectId.isValid(req.params.id))
    return jsonError(res, 400, "Invalid request.");
  const request = await donationRequests().findOne({
    _id: new ObjectId(req.params.id),
  });
  if (!request) return jsonError(res, 404, "Request not found.");
  return res.json({ success: true, request: serializeRequest(request) });
};

export const getRequestById = async (req, res) => {
  const user = req.user;
  if (!ObjectId.isValid(req.params.id))
    return jsonError(res, 400, "Invalid request.");
  const canManageAll = ["admin", "volunteer"].includes(user.role);
  const query = canManageAll
    ? { _id: new ObjectId(req.params.id) }
    : { $and: [{ _id: new ObjectId(req.params.id) }, ownerQuery(user)] };
  const request = await donationRequests().findOne(query);
  if (!request) return jsonError(res, 404, "Request not found.");
  return res.json({ success: true, request: serializeRequest(request) });
};

export const updateRequest = async (req, res) => {
  const user = req.user;
  if (user.role === "volunteer") return jsonError(res, 403, "Forbidden.");
  if (!ObjectId.isValid(req.params.id))
    return jsonError(res, 400, "Invalid request.");

  const input = readRequestInput(req.body);
  if (Object.values(input).some((value) => !value)) {
    return jsonError(res, 400, "Please complete every required field.");
  }
  if (!allowedBloodGroups.has(input.bloodGroup))
    return jsonError(res, 400, "Invalid blood group.");
  if (!isValidLocation(input.recipientDistrict, input.recipientUpazila)) {
    return jsonError(res, 400, "Invalid location.");
  }

  const updateQuery =
    user.role === "admin"
      ? { _id: new ObjectId(req.params.id) }
      : { $and: [{ _id: new ObjectId(req.params.id) }, ownerQuery(user)] };

  const result = await donationRequests().updateOne(updateQuery, {
    $set: { ...input, updatedAt: new Date() },
  });
  if (!result.matchedCount) return jsonError(res, 404, "Request not found.");
  return res.json({ success: true });
};

export const deleteRequest = async (req, res) => {
  const user = req.user;
  if (user.role === "volunteer") return jsonError(res, 403, "Forbidden.");
  if (!ObjectId.isValid(req.params.id))
    return jsonError(res, 400, "Invalid request.");

  const deleteQuery =
    user.role === "admin"
      ? { _id: new ObjectId(req.params.id) }
      : { $and: [{ _id: new ObjectId(req.params.id) }, ownerQuery(user)] };

  const result = await donationRequests().deleteOne(deleteQuery);
  if (!result.deletedCount) return jsonError(res, 404, "Request not found.");
  return res.json({ success: true });
};

export const updateStatus = async (req, res) => {
  const user = req.user;
  if (!ObjectId.isValid(req.params.id))
    return jsonError(res, 400, "Invalid request.");
  const nextStatus = clean(req.body?.status);
  if (!statuses.has(nextStatus))
    return jsonError(res, 400, "Invalid status update.");

  const collection = donationRequests();
  const request = await collection.findOne({
    _id: new ObjectId(req.params.id),
  });
  if (!request) return jsonError(res, 404, "Request not found.");

  const isOwner =
    request.requesterId === user.id || request.requesterEmail === user.email;
  const canManageAll = ["admin", "volunteer"].includes(user.role);

  if (canManageAll) {
    await collection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { donationStatus: nextStatus, updatedAt: new Date() } },
    );
    return res.json({ success: true });
  }

  if (
    !isOwner ||
    request.donationStatus !== "inprogress" ||
    !["done", "canceled"].includes(nextStatus)
  ) {
    return jsonError(
      res,
      403,
      "Only in-progress owner requests can be updated.",
    );
  }

  await collection.updateOne(
    { _id: new ObjectId(req.params.id), donationStatus: "inprogress" },
    { $set: { donationStatus: nextStatus, updatedAt: new Date() } },
  );
  return res.json({ success: true });
};
