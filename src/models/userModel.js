const { db } = require("../config/db");

const users = () => db.collection("user");

module.exports = { users };
