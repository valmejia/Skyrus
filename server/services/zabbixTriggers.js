import fetch from "node-fetch";

const ZABBIX_API_URL = process.env.ZABBIX_API_URL;
const ZABBIX_USER = process.env.ZABBIX_USER;
const ZABBIX_PASSWORD = process.env.ZABBIX_PASSWORD;

/**
 * Inicia sesión en la API de Zabbix y obtiene el token.
 */
async function login() {
    const response = await fetch(ZABBIX_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json-rpc" },
        body: JSON.stringify({
            jsonrpc: "2.0",
            method: "user.login",
            params: {
                user: ZABBIX_USER,
                password: ZABBIX_PASSWORD,
            },
            id: 1,
        }),
    });

    const data = await response.json();
    if (!data.result) throw new Error("❌ Error al autenticar con Zabbix");
    return data.result; // auth token
}

/**
 * Consulta el estado de un trigger específico.
 */
export async function getTriggerState(triggerId) {
    const auth = await login();
    const response = await fetch(ZABBIX_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json-rpc" },
        body: JSON.stringify({
            jsonrpc: "2.0",
            method: "trigger.get",
            params: {
                triggerids: [triggerId],
                output: ["triggerid", "description", "status"],
            },
            auth,
            id: 2,
        }),
    });

    const data = await response.json();
    if (!data.result || data.result.length === 0)
        throw new Error("⚠️ Trigger no encontrado");

    const trigger = data.result[0];
    return {
        id: trigger.triggerid,
        description: trigger.description,
        status: trigger.status === "0" ? "enabled" : "disabled",
    };
}


export async function setTriggerState(triggerId, enable = true) {
    const auth = await login();
    const status = enable ? 0 : 1; // 0 = habilitado, 1 = deshabilitado

    const response = await fetch(ZABBIX_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json-rpc" },
        body: JSON.stringify({
            jsonrpc: "2.0",
            method: "trigger.update",
            params: {
                triggerid: triggerId,
                status,
            },
            auth,
            id: 3,
        }),
    });

    const data = await response.json();
    if (!data.result) throw new Error("❌ No se pudo actualizar el trigger");
    return { success: true, newStatus: enable ? "enabled" : "disabled" };
}
