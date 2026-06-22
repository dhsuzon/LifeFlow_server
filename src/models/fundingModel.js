const { db } = require("../config/db");

const funds = () => db.collection("funds");

module.exports = { funds };
