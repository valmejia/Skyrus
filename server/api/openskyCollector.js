const axios = require('axios'); // Asegúrese de instalar axios
const ZabbixSender = require('node-zabbix-sender'); // Asegúrese de instalar node-zabbix-sender
const FlightModel = require('../models/Flight.model'); // Su modelo de Vuelo Mongoose
// Nota: Debe requerir este archivo en su archivo principal (ej. app.js) para que comience el polling.

// URL de la API de OpenSky
const OPEN_SKY_URL = 'https://opensky-network.org/api/states/all';

// Configuración de Zabbix (ajuste según su configuración local o proxy)
const ZABBIX_HOST = '192.168.159.130'; // Dirección de su Zabbix Server/Proxy
const ZABBIX_PORT = 10051;
const ZABBIX_HOST_NAME = 'OpenSky'

// Códigos Squawk de emergencia (usados para monitoreo de anomalías)
const EMERGENCY_SQUAWK = '7700'; // Emergencia General
const HIJACK_SQUAWK = '7500';   // Interferencia Ilegal/Secuestro
const RADIO_FAIL_SQUAWK = '7600'; // Falla de Radio

// Configuración del Zabbix Sender
const sender = new ZabbixSender({
    host: ZABBIX_HOST,
    port: ZABBIX_PORT,
    hostname: ZABBIX_HOST_NAME
});


// Función principal del colector: Llama a OpenSky, procesa y guarda
async function fetchAndProcessFlights() {
    console.log(`[Collector] Iniciando ciclo de recolección en: ${new Date().toISOString()}`);
    const startTime = Date.now();

    // Variables de monitoreo inicializadas
    let flightCount = 0;
    let httpStatusCode = 0;
    let nullLatitudeCount = 0;
    let maxDataAgeSeconds = 0;

    // Contadores para alertas de emergencia
    let emergencySquawkCount = 0;
    let hijackSquawkCount = 0;
    let radioFailSquawkCount = 0;

    try {
        // La autenticación (si la tiene) se toma de las variables de entorno
        const response = await axios.get(OPEN_SKY_URL, {
            auth: {
                username: process.env.OPENSKY_CLIENT_ID,
                password: process.env.OPENSKY_CLIENT_SECRET,
            },
            params: {
                // Parámetros opcionales: bbox, time, etc.
            },
            timeout: 15000 // 15 segundos de timeout
        });

        httpStatusCode = response.status;
        const data = response.data;

        if (httpStatusCode === 200 && data.states && data.states.length > 0) {
            flightCount = data.states.length;
            const flightStates = data.states;

            // 1. PROCESAMIENTO Y CÁLCULO DE MÉTRICAS
            const processedFlights = flightStates.map(state => {
                // Indices brutos de OpenSky
                const longitude = state[5];
                const latitude = state[6];
                const lastContactTimestamp = state[3]; // UNIX time in seconds
                const squawkCode = state[17];

                // a) Calular Frescura (Data Freshness)
                const ageSeconds = Math.floor(Date.now() / 1000) - lastContactTimestamp;
                if (ageSeconds > maxDataAgeSeconds) {
                    maxDataAgeSeconds = ageSeconds;
                }

                // b) Contar datos nulos/inválidos
                if (latitude === null || longitude === null) {
                    nullLatitudeCount++;
                }

                // c) Contar Squawks de emergencia
                if (squawkCode === EMERGENCY_SQUAWK) {
                    emergencySquawkCount++;
                } else if (squawkCode === HIJACK_SQUAWK) {
                    hijackSquawkCount++;
                } else if (squawkCode === RADIO_FAIL_SQUAWK) {
                    radioFailSquawkCount++;
                }


                // Mapear los índices de OpenSky a campos de Mongoose
                return {
                    icao24: state[0],
                    callsign: state[1] ? state[1].trim() : null,
                    origin_country: state[2],
                    last_contact: new Date(lastContactTimestamp * 1000),
                    longitude: longitude,
                    latitude: latitude,
                    velocity: state[9],
                    altitude: state[13],
                    on_ground: state[14],
                    squawk: squawkCode,
                };
            });

            // 2. LÓGICA DE NEGOCIO Y GUARDADO EN MONGODB

            const bulkOps = processedFlights.map(flight => ({
                updateOne: {
                    filter: { icao24: flight.icao24 },
                    update: { $set: flight },
                    upsert: true // Inserta si no existe, actualiza si existe
                }
            }));

            // Ejecuta las operaciones en MongoDB
            const bulkResult = await FlightModel.bulkWrite(bulkOps);

            console.log(`[Collector] Colección exitosa. Vuelos insertados/actualizados: ${bulkResult.upsertedCount + bulkResult.modifiedCount}`);

        } else if (httpStatusCode === 200 && data.states && data.states.length === 0) {
            console.warn("[Collector] Respuesta 200 OK, pero sin datos de vuelo.");
            // Enviar a Zabbix: Error de datos vacíos
            sender.addItem('opensky.empty_data_received', 1);
        } else {
            console.error(`[Collector] Error HTTP: ${httpStatusCode}`);
        }

    } catch (error) {
        httpStatusCode = error.response ? error.response.status : 0;
        console.error("[Collector] Fallo en la recolección de OpenSky:", error.message);
    } finally {
        const endTime = Date.now();
        const latency = endTime - startTime;

        // 3. ENVÍO DE MÉTRICAS A ZABBIX (PUSH)

        // Métricas de Rendimiento y Respuesta HTTP
        sender.addItem('opensky.http_status_code', httpStatusCode);
        sender.addItem('opensky.collection_latency', latency);

        // Métricas de Calidad de Datos
        sender.addItem('opensky.flights_count', flightCount);
        sender.addItem('opensky.null_latitude_count', nullLatitudeCount);
        sender.addItem('ingestion.data_freshness_seconds', maxDataAgeSeconds);

        // Métricas de Squawk de Emergencia
        sender.addItem('app.flights.emergency_squawk_count', emergencySquawkCount);
        sender.addItem('app.flights.hijack_squawk_count', hijackSquawkCount);
        sender.addItem('app.flights.radio_fail_squawk_count', radioFailSquawkCount);

        // Asumimos que la tasa de actualización es igual al conteo de vuelos para monitorear que la escritura esté ocurriendo
        sender.addItem('ingestion.update_rate', flightCount);

        // Ejecutar el envío de métricas
        sender.send(function(err, res) {
            if (err) {
                console.error('[Zabbix Sender] Error al enviar métricas:', err);
            }
        });

        console.log(`[Collector] Ciclo terminado en ${latency}ms.`);
    }
}

// Inicializar el colector: Ejecutar cada 60 segundos
const collectionInterval = 60 * 1000;

// Iniciar el polling
const collectorInterval = setInterval(fetchAndProcessFlights, collectionInterval);
fetchAndProcessFlights(); // Ejecutar inmediatamente al inicio

module.exports = {
    fetchAndProcessFlights,
    collectorInterval // Exportar el intervalo por si se necesita detenerlo
};