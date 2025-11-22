// ℹ️ Gets access to environment variables/settings
require("dotenv").config();

// ℹ️ Connects to the database
require("./db");

const collector = require("./api/openskyCollector");
const express = require("express");
const axios = require("axios");

const app = express();

// CORS configuration
const cors = require("cors");
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));

// Middleware configuration
require("./config")(app);

const clientId = process.env.OPENSKY_CLIENT_ID;
const clientSecret = process.env.OPENSKY_CLIENT_SECRET;

app.get("/api/opensky", async (req, res) => {
    if (!clientId || !clientSecret) {
        return res.status(500).json({ error: "OpenSky credentials not configured" });
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

        res.json(response.data);

    } catch (error) {
        const status = error.response ? error.response.status : 500;
        const message = error.response ? error.response.data : "Error querying OpenSky";
        res.status(status).json({ error: message });
    }
});

// Routes
const indexRoutes = require("./routes/index.routes");
app.use("/api", indexRoutes);

const authRoutes = require("./routes/auth.routes");
app.use("/auth", authRoutes);

const zabbixRoutes = require("./routes/zabbixTrigger.js");
app.use("/api/zabbix", zabbixRoutes);

// Compatibility routes
try {
    const compatibilityRoutes = require("./routes/compatibility");
    app.use("/api", compatibilityRoutes);
} catch (error) {
    // Emergency fallback routes
    const emergencyData = {
        "23721": { state: true, value: 100 },
        "23722": { state: false, value: 0 },
        "23723": { state: false, value: 0 },
        "23724": { state: false, value: 0 },
        "23725": { state: false, value: 0 },
        "23726": { state: true, value: 85 },
        "23727": { state: true, value: 65 },
        "23728": { state: false, value: 0 },
        "23729": { state: true, value: 75 },
        "23730": { state: true, value: 60 },
        "23731": { state: false, value: 0 },
        "23732": { state: true, value: 90 },
        "23733": { state: true, value: 55 },
        "23734": { state: false, value: 0 }
    };

    app.get("/api/triggers", async (req, res) => {
        res.json(emergencyData);
    });

    app.get("/api/zabbix/triggers", async (req, res) => {
        res.json(emergencyData);
    });

    app.get("/api/trigger/:id", async (req, res) => {
        const { id } = req.params;
        const triggerData = emergencyData[id];
        if (!triggerData) {
            return res.status(404).json({ error: "Trigger not found" });
        }
        res.json(triggerData);
    });

    app.get("/api/zabbix/trigger/:id", async (req, res) => {
        const { id } = req.params;
        const triggerData = emergencyData[id];
        if (!triggerData) {
            return res.status(404).json({ error: "Trigger not found" });
        }
        res.json(triggerData);
    });
}

// Error handling
require("./error-handling")(app);

module.exports = app;