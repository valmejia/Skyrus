const axios = require('axios');
const ZabbixSender = require('node-zabbix-sender');
const FlightModel = require('../../models/Flight.model');

// === CONFIGURACIÓN DE APIS ===
const OPEN_SKY_URL = 'https://opensky-network.org/api/states/all';

// === CONFIGURACIÓN DE ZABBIX ===
const ZABBIX_HOST = '192.168.159.130'; // IP de tu servidor/proxy Zabbix
const ZABBIX_PORT = 10051;
const ZABBIX_HOST_NAME = 'Skyrus Server'; // Debe coincidir con el nombre del host en Zabbix

// === CÓDIGOS SQUAWK DE EMERGENCIA ===
const EMERGENCY_SQUAWK = '7700'; // Emergencia general
const HIJACK_SQUAWK = '7500';    // Secuestro
const RADIO_FAIL_SQUAWK = '7600'; // Falla de radio

// === CONFIGURAR CLIENTE ZABBIX ===
const sender = new ZabbixSender({
    host: ZABBIX_HOST,
    port: ZABBIX_PORT,
    hostname: ZABBIX_HOST_NAME,
    timeout: 7000, // Aumentar tiempo de espera para evitar timeout
});

// === FUNCIÓN PRINCIPAL ===
async function fetchAndProcessFlights() {
    console.log(`[AviationStack] Iniciando recolección: ${new Date().toISOString()}`);
    const startTime = Date.now();

    // Variables de métricas
    let flightCount = 0;
    let httpStatusCode = 0;
    let nullLatitudeCount = 0;
    let maxDataAgeSeconds = 0;
    let emergencySquawkCount = 0;
    let hijackSquawkCount = 0;
    let radioFailSquawkCount = 0;

    try {
        console.log('[Collector] Iniciando recolección OpenSky (modo público)...');
        const response = await axios.get(OPEN_SKY_URL, { timeout: 10000 });
        httpStatusCode = response.status;
        const data = response.data;

        if (httpStatusCode === 200 && data.states && data.states.length > 0) {
            flightCount = data.states.length;
            const flightStates = data.states;

            // --- Procesamiento ---
            const processedFlights = flightStates.map(state => {
                const longitude = state[5];
                const latitude = state[6];
                const lastContactTimestamp = state[3];
                const squawkCode = state[17];

                // Calcular frescura de los datos
                const ageSeconds = Math.floor(Date.now() / 1000) - lastContactTimestamp;
                if (ageSeconds > maxDataAgeSeconds) {
                    maxDataAgeSeconds = ageSeconds;
                }

                // Contar datos nulos
                if (latitude === null || longitude === null) {
                    nullLatitudeCount++;
                }

                // Contar squawks de emergencia
                if (squawkCode === EMERGENCY_SQUAWK) {
                    emergencySquawkCount++;
                } else if (squawkCode === HIJACK_SQUAWK) {
                    hijackSquawkCount++;
                } else if (squawkCode === RADIO_FAIL_SQUAWK) {
                    radioFailSquawkCount++;
                }

                // Retornar objeto para Mongo
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

            // --- 🔧 Filtrar registros inválidos para evitar duplicados con icao24:null ---
            const validFlights = processedFlights.filter(
                f => f.icao24 && f.icao24 !== null && f.icao24.trim() !== ''
            );

            // --- Guardar en MongoDB ---
            if (validFlights.length > 0) {
                const bulkOps = validFlights.map(flight => ({
                    updateOne: {
                        filter: { icao24: flight.icao24 },
                        update: { $set: flight },
                        upsert: true,
                    },
                }));

                const bulkResult = await FlightModel.bulkWrite(bulkOps);
                console.log(`[Collector] Vuelos actualizados/insertados: ${bulkResult.upsertedCount + bulkResult.modifiedCount}`);
            } else {
                console.warn('[Collector] No se encontraron vuelos válidos con icao24.');
            }

        } else if (httpStatusCode === 200 && (!data.states || data.states.length === 0)) {
            console.warn('[Collector] Respuesta 200 OK, pero sin datos de vuelo.');
            sender.addItem('opensky.empty_data_received', 1);
        } else {
            console.error(`[Collector] Error HTTP: ${httpStatusCode}`);
        }

    } catch (error) {
        httpStatusCode = error.response ? error.response.status : 0;
        console.error('[Collector] Fallo en la recolección de OpenSky:', error.message);
    } finally {
        const latency = Date.now() - startTime;

        // === MÉTRICAS ZABBIX ===
        sender.addItem('opensky.http_status_code', httpStatusCode);
        sender.addItem('opensky.collection_latency', latency);
        sender.addItem('opensky.flights_count', flightCount);
        sender.addItem('opensky.null_latitude_count', nullLatitudeCount);
        sender.addItem('ingestion.data_freshness_seconds', maxDataAgeSeconds);
        sender.addItem('app.flights.emergency_squawk_count', emergencySquawkCount);
        sender.addItem('app.flights.hijack_squawk_count', hijackSquawkCount);
        sender.addItem('app.flights.radio_fail_squawk_count', radioFailSquawkCount);
        sender.addItem('ingestion.update_rate', flightCount);

        // Envío con manejo de error
        sender.send((err) => {
            if (err) {
                console.error('[Zabbix Sender] Error al enviar métricas:', err.message);
            } else {
                console.log('[Zabbix Sender] Métricas enviadas correctamente.');
            }
        });

        console.log(`[AviationStack] Ciclo completado en ${latency} ms.`);
    }
}

// === EJECUCIÓN PERIÓDICA ===
const collectionInterval = 60 * 1000; // 1 minuto
setInterval(fetchAndProcessFlights, collectionInterval);
fetchAndProcessFlights(); // Ejecutar inmediatamente

module.exports = {
    fetchAndProcessFlights,
};
