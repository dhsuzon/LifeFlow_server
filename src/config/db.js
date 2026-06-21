const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = process.env.MONGO_DB_URL;
if (!uri) {
  throw new Error("MONGO_DB_URL is not configured");
}

const globalForMongo = globalThis;
const client =
  globalForMongo.__lifeflowMongoClient ||
  new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForMongo.__lifeflowMongoClient = client;
}

const db = client.db("blood_donation_db");

module.exports = { client, db };
