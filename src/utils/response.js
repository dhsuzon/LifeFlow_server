function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function jsonError(res, status, message) {
  return res.status(status).json({ success: false, error: message });
}

function parsePagination(query, defaultPageSize = 10, maxPageSize = 20) {
  const pageSize = Math.min(Math.max(Number(query.pageSize) || defaultPageSize, 1), maxPageSize);
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  return { page, pageSize };
}

function ownerQuery(user) {
  return { $or: [{ requesterId: user.id }, { requesterEmail: user.email }] };
}

function serializeRequest(request) {
  return {
    id: request._id.toString(),
    requesterId: request.requesterId || "",
    requesterName: request.requesterName || "",
    requesterEmail: request.requesterEmail || "",
    recipientName: request.recipientName || "",
    recipientDistrict: request.recipientDistrict || "",
    recipientUpazila: request.recipientUpazila || "",
    hospitalName: request.hospitalName || "",
    fullAddress: request.fullAddress || "",
    bloodGroup: request.bloodGroup || "",
    donationDate: request.donationDate || "",
    donationTime: request.donationTime || "",
    requestMessage: request.requestMessage || "",
    donationStatus: request.donationStatus || request.status || "pending",
    donorName: request.donorName || "",
    donorEmail: request.donorEmail || "",
    createdAt: request.createdAt?.toISOString?.() || "",
    updatedAt: request.updatedAt?.toISOString?.() || "",
  };
}

module.exports = { clean, jsonError, parsePagination, ownerQuery, serializeRequest };
