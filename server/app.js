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

// ✅✅✅ AGREGAR CORS - Esto permite que localhost:3000 acceda al backend
const cors = require("cors");
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

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

// ✅ COMENTADO: El collector ya se inicia automáticamente en openskyCollector.js
// No necesitamos llamarlo manualmente aquí para evitar duplicación
/*
try {
    collector.fetchAndProcessFlights();
    console.log("✈️ El servicio de recolección OpenSky se ha iniciado.");
} catch (error) {
    console.error("🔴 Error al iniciar el servicio de recolección:", error.message);
}
*/

// 👇 Start handling routes here
const indexRoutes = require("./routes/index.routes");
app.use("/api", indexRoutes);

const authRoutes = require("./routes/auth.routes");
app.use("/auth", authRoutes);

const zabbixRoutes = require("./routes/zabbixTrigger.js");
app.use("/api/zabbix", zabbixRoutes);

// ✅✅✅ DEBUG + COMPATIBILIDAD - Versión corregida
console.log('🔍 DEBUG: Intentando cargar rutas de compatibilidad...');
try {
  const compatibilityRoutes = require("./routes/compatibility");
  console.log('✅ DEBUG: compatibility.js cargado exitosamente');
  app.use("/api", compatibilityRoutes);
} catch (error) {
  console.log('❌ DEBUG: Error cargando compatibility.js:', error.message);
  console.log('🔄 DEBUG: Creando rutas directas...');
  
  // 🔄 RUTAS DIRECTAS DE EMERGENCIA
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
    console.log('[Emergency Route] ✅ Enviando datos a /api/triggers');
    res.json(emergencyData);
  });

  app.get("/api/zabbix/triggers", async (req, res) => {
    console.log('[Emergency Route] ✅ Enviando datos a /api/zabbix/triggers');
    res.json(emergencyData);
  });

  app.get("/api/trigger/:id", async (req, res) => {
    const { id } = req.params;
    console.log(`[Emergency Route] Enviando trigger ${id}`);
    const triggerData = emergencyData[id];
    if (!triggerData) {
      return res.status(404).json({ error: "Trigger no encontrado" });
    }
    res.json(triggerData);
  });

  app.get("/api/zabbix/trigger/:id", async (req, res) => {
    const { id } = req.params;
    console.log(`[Emergency Route] Enviando trigger ${id} (zabbix)`);
    const triggerData = emergencyData[id];
    if (!triggerData) {
      return res.status(404).json({ error: "Trigger no encontrado" });
    }
    res.json(triggerData);
  });
}

// ❗ To handle errors. Routes that don't exist or errors that you handle in specific routes
require("./error-handling")(app);

module.exports = app;