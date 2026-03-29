const { MongoClient } = require("mongodb");

let db;
const client = new MongoClient(process.env.MONGO_URI);

async function connectDB() {
    await client.connect();
    db = client.db("jailbreak");
    console.log("MongoDB connected!");
}

function getDB() {
    if (!db) throw new Error("DB not initialized. Call connectDB() first.");
    return db;
}

module.exports = { connectDB, getDB };
