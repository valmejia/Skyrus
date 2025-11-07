// routes/zabbixTrigger.js
const express = require("express");
const router = express.Router();
const axios = require("axios");

// Configuración base de Zabbix
const ZABBIX_API = process.env.ZABBIX_API_URL || "http://localhost/zabbix/api_jsonrpc.php";
const ZABBIX_USER = process.env.ZABBIX_USER;
const ZABBIX_PASS = process.env.ZABBIX_PASS;

// 🔹 Obtener token de autenticación de Zabbix
async function getAuthToken() {
    const res = await axios.post(ZABBIX_API, {
        jsonrpc: "2.0",
        method: "user.login",
        params: {
            user: ZABBIX_USER,
            password: ZABBIX_PASS,
        },
        id: 1,
    });
    return res.data.result;
}

// 🔹 Obtener el estado actual del trigger
router.get("/trigger/:id/status", async (req, res) => {
    try {
        const token = await getAuthToken();
        const { id } = req.params;

        const response = await axios.post(ZABBIX_API, {
            jsonrpc: "2.0",
            method: "trigger.get",
            params: {
                triggerids: id,
                output: ["triggerid", "description", "status"],
            },
            auth: token,
            id: 1,
        });

        const trigger = response.data.result?.[0];
        if (!trigger) {
            return res.status(404).json({ error: "Trigger no encontrado" });
        }

        res.json({ id: trigger.triggerid, status: trigger.status });
    } catch (err) {
        console.error("[Zabbix] Error obteniendo estado del trigger:", err.message);
        res.status(500).json({ error: "Error al consultar trigger" });
    }
});

// 🔹 Cambiar estado (activar/desactivar)
router.post("/trigger/:id/toggle", async (req, res) => {
    try {
        const token = await getAuthToken();
        const { id } = req.params;
        const { enable } = req.body; // true o false

        const status = enable ? 0 : 1; // 0 = habilitado, 1 = deshabilitado

        const response = await axios.post(ZABBIX_API, {
            jsonrpc: "2.0",
            method: "trigger.update",
            params: {
                triggerid: id,
                status,
            },
            auth: token,
            id: 1,
        });

        res.json({ success: true, result: response.data.result });
    } catch (err) {
        console.error("[Zabbix] Error cambiando estado del trigger:", err.message);
        res.status(500).json({ error: "Error al cambiar estado del trigger" });
    }
});

// ✅ Exporta correctamente el router
module.exports = router;
