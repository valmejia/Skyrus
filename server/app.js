// ℹ️ Gets access to environment variables/settings
// https://www.npmjs.com/package/dotenv
require("dotenv").config();

// ℹ️ Connects to the database
require("./db");

// Handles http requests (express is node js framework)
// https://www.npmjs.com/package/express
const express = require("express");

const app = express();

const { aviationstackCollector, getMetrics } = require('./api/collector/aviationstackCollector');

// ℹ️ This function is getting exported from the config folder. It runs most pieces of middleware
require("./config")(app);

app.get('./api/collector/aviationstackCollector', (req, res) => {
    try {
        const metrics = getMetrics(); // <-- usa las métricas definidas dentro del collector
        if (!metrics || !metrics.lastRun) {
            return res.status(503).json({ message: 'No hay métricas disponibles aún' });
        }
        res.json({
            source: 'AviationStack',
            collectedAt: metrics.lastRun,
            httpStatusCode: metrics.httpStatusCode,
            latencyMs: metrics.latencyMs,
            flightCount: metrics.flightCount,
            delayedFlights: metrics.delayedFlights,
            arrivals: metrics.arrivals,
            departures: metrics.departures,
        });
    } catch (error) {
        console.error('[AviationStack] Error al obtener métricas:', error.message);
        res.status(500).json({ error: 'Error obteniendo métricas de AviationStack' });
    }
});

// 👇 Start handling routes here
const indexRoutes = require("./routes/index.routes");
app.use("/api", indexRoutes);

const authRoutes = require("./routes/auth.routes");
app.use("/auth", authRoutes);

// ❗ To handle errors. Routes that don't exist or errors that you handle in specific routes
require("./error-handling")(app);

module.exports = app;
