// routes/zabbixTrigger.js - PARA ZABBIX 6.4+
const express = require("express");
const router = express.Router();
const fs = require("fs").promises;
const path = require("path");
const axios = require("axios");

const TRIGGERS_FILE = path.join(__dirname, '../data/triggers.json');

// Configuración Zabbix
const ZABBIX_CONFIG = {
    url: process.env.ZABBIX_API_URL || 'http://192.168.1.91/zabbix/api_jsonrpc.php',
    username: process.env.ZABBIX_USER || 'Admin',
    password: process.env.ZABBIX_PASS || 'zabbix',
    authToken: null
};

// Datos por defecto
const DEFAULT_TRIGGERS = {
    "23721": { state: true, value: 100, name: "EMERGENCIA AÉREA", zabbixId: "23721" },
    "23722": { state: false, value: 0, name: "POSIBLE SECUESTRO AÉREO", zabbixId: "23722" },
    "23723": { state: false, value: 0, name: "FALLO DE COMUNICACIÓN", zabbixId: "23723" },
    "23724": { state: false, value: 0, name: "OpenSky API no responde", zabbixId: "23724" },
    "23725": { state: false, value: 0, name: "MongoDB desconectado", zabbixId: "23725" },
    "23726": { state: true, value: 85, name: "Datos de vuelos muy antiguos", zabbixId: "23726" },
    "23727": { state: true, value: 65, name: "Alta latencia en collector", zabbixId: "23727" },
    "23728": { state: false, value: 0, name: "No hay vuelos detectados sobre CDMX", zabbixId: "23728" },
    "23729": { state: true, value: 75, name: "Retraso en salidas de vuelos", zabbixId: "23729" },
    "23730": { state: true, value: 60, name: "Retraso en llegadas de vuelos", zabbixId: "23730" },
    "23731": { state: false, value: 0, name: "Salidas adelantadas de vuelos", zabbixId: "23731" },
    "23732": { state: true, value: 90, name: "Alertas meteorológicas activas", zabbixId: "23732" },
    "23733": { state: true, value: 55, name: "Vientos fuertes en zona", zabbixId: "23733" },
    "23734": { state: false, value: 0, name: "Visibilidad por clima", zabbixId: "23734" }
};

// Autenticación en Zabbix 6.4+
const authenticateZabbix = async () => {
    try {
        const requestData = {
            jsonrpc: "2.0",
            method: "user.login",
            params: {
                username: ZABBIX_CONFIG.username,
                password: ZABBIX_CONFIG.password
            },
            id: 1
        };

        const response = await axios.post(ZABBIX_CONFIG.url, requestData, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.data.result) {
            ZABBIX_CONFIG.authToken = response.data.result;
            console.log('Zabbix: Conexión establecida');
            return true;
        }
    } catch (error) {
        console.log('Zabbix: Error de conexión - ', error.message);
    }
    return false;
};

// Cambiar estado de trigger en Zabbix
const toggleZabbixTrigger = async (triggerId, enable) => {
    if (!ZABBIX_CONFIG.authToken) {
        const authSuccess = await authenticateZabbix();
        if (!authSuccess) {
            return false;
        }
    }

    try {
        const status = enable ? 0 : 1;

        const requestData = {
            jsonrpc: "2.0",
            method: "trigger.update",
            params: {
                triggerid: triggerId,
                status: status
            },
            id: 2,
            auth: ZABBIX_CONFIG.authToken
        };

        const response = await axios.post(ZABBIX_CONFIG.url, requestData, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.data.result) {
            console.log(`Zabbix: Trigger ${triggerId} ${enable ? 'activado' : 'desactivado'}`);
            return true;
        }
    } catch (error) {
        console.log(`Zabbix: Error actualizando trigger ${triggerId} - ${error.message}`);
        if (error.response && error.response.data && error.response.data.error && error.response.data.error.code === -32602) {
            ZABBIX_CONFIG.authToken = null;
            return await toggleZabbixTrigger(triggerId, enable);
        }
    }
    return false;
};

// Cargar datos desde archivo
const loadTriggers = async () => {
    try {
        const data = await fs.readFile(TRIGGERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        await saveTriggers(DEFAULT_TRIGGERS);
        return DEFAULT_TRIGGERS;
    }
};

// Guardar datos en archivo
const saveTriggers = async (data) => {
    try {
        const dir = path.dirname(TRIGGERS_FILE);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(TRIGGERS_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        throw error;
    }
};

// Obtener TODOS los triggers
router.get("/triggers", async (req, res) => {
    try {
        const triggersData = await loadTriggers();

        const persistentData = {};
        Object.keys(triggersData).forEach(id => {
            persistentData[id] = {
                state: triggersData[id].state,
                value: triggersData[id].state ? triggersData[id].value : 0
            };
        });

        res.json(persistentData);
    } catch (error) {
        console.log('Error cargando triggers:', error.message);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Obtener trigger específico
router.get("/trigger/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const triggersData = await loadTriggers();
        const triggerData = triggersData[id];

        if (!triggerData) {
            return res.status(404).json({ error: "Trigger no encontrado" });
        }

        res.json({
            state: triggerData.state,
            value: triggerData.state ? triggerData.value : 0
        });
    } catch (error) {
        console.log('Error obteniendo trigger:', error.message);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Cambiar estado (activar/desactivar)
router.post("/trigger/:id/toggle", async (req, res) => {
    try {
        const { id } = req.params;
        const { enable } = req.body;

        const zabbixSuccess = await toggleZabbixTrigger(id, enable);

        const triggersData = await loadTriggers();

        if (triggersData[id]) {
            triggersData[id].state = enable;
            if (!enable) {
                triggersData[id].value = 0;
            }
            await saveTriggers(triggersData);
        }

        let message = '';
        if (zabbixSuccess) {
            message = `Trigger ${enable ? 'activado' : 'desactivado'} en Zabbix correctamente`;
        } else {
            message = `Trigger ${enable ? 'activado' : 'desactivado'} solo localmente (Error en Zabbix)`;
        }

        res.json({
            success: true,
            zabbixSuccess: zabbixSuccess,
            message: message,
            triggerId: id,
            newState: enable
        });

    } catch (error) {
        console.log('Error cambiando trigger:', error.message);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Health check
router.get("/health", async (req, res) => {
    try {
        const triggersData = await loadTriggers();
        const activeTriggers = Object.values(triggersData).filter(t => t.state).length;

        const zabbixConnected = await authenticateZabbix();

        res.json({
            status: "connected",
            message: `Sistema funcionando - ${activeTriggers} triggers activos`,
            triggers_count: Object.keys(triggersData).length,
            active_triggers: activeTriggers,
            zabbix_connected: zabbixConnected,
            mode: "zabbix-real-integration"
        });
    } catch (error) {
        console.log('Error health check:', error.message);
        res.status(500).json({ error: "Error en health check" });
    }
});

setTimeout(() => {
    authenticateZabbix();
}, 2000);

module.exports = router;