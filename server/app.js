// ℹ️ Gets access to environment variables/settings
// https://www.npmjs.com/package/dotenv
require("dotenv").config();

// ℹ️ Connects to the database
require("./db");

const collector = require("./api/openskyCollector");
// Handles http requests (express is node js framework)
// https://www.npmjs.com/package/express
const express = require("express");

const axios = require("axios"); // Asegúrate de importar axios


const app = express();

// ℹ️ This function is getting exported from the config folder. It runs most pieces of middleware
require("./config")(app);

const clientId = process.env.OPENSKY_CLIENT_ID;
const clientSecret = process.env.OPENSKY_CLIENT_SECRET;

app.get("/api/opensky", async (req, res) => {
    if (!clientId || !clientSecret) {
        return res.status(500).json({ error: "Credenciales de OpenSky no configuradas en el entorno." });
    }

    try {
        const response = await axios.get(
            "https://api.opensky-network.org/api/states/all",
            {
                auth: {
                    username: clientId,
                    password: clientSecret
                }
            }
        );

        // Envía los datos de OpenSky como respuesta JSON
        res.json(response.data);

    } catch (error) {
        console.error("❌ Error consultando OpenSky:", error.message);
        // Devuelve el estado de error de la API si es posible, sino un 500
        const status = error.response ? error.response.status : 500;
        const message = error.response ? error.response.data : "Error consultando OpenSky";
        res.status(status).json({ error: message });
    }
});

try {
    collector.fetchAndProcessFlights();
    console.log("✈️ El servicio de recolección OpenSky se ha iniciado.");
} catch (error) {
    console.error("🔴 Error al iniciar el servicio de recolección:", error.message);
}

// 👇 Start handling routes here
const indexRoutes = require("./routes/index.routes");
app.use("/api", indexRoutes);

const authRoutes = require("./routes/auth.routes");
app.use("/auth", authRoutes);

// ❗ To handle errors. Routes that don't exist or errors that you handle in specific routes
require("./error-handling")(app);

module.exports = app;
