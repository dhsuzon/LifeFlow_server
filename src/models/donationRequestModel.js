const { db } = require("../config/db");

const donationRequests = () => db.collection("donationRequests");

module.exports = { donationRequests };
