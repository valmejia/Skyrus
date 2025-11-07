const mongoose = require("mongoose");

const MONGO_URI =
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/Skyrus";

// Exportar una promesa que se resuelve cuando MongoDB está conectado
const mongooseConnect = mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    bufferCommands: false,
    maxPoolSize: 10,
});

mongooseConnect
    .then((x) => {
        const dbName = x.connections[0].name;
        console.log(`✅ Connected to Mongo! Database name: "${dbName}"`);
    })
    .catch((err) => {
        console.error("❌ Error connecting to mongo: ", err);
    });

// Exportar la conexión para poder esperarla
module.exports = mongooseConnect;