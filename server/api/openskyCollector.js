const axios = require('axios');
const { exec } = require('child_process');
const fs = require('fs');
require('dotenv').config();

// Importar y esperar la conexión a MongoDB
const mongooseConnection = require('../db');

// ✅ AGREGAR ESTA LÍNEA: Importar mongoose directamente
const mongoose = require('mongoose');

// Configuraciones
const OPEN_SKY_URL = 'https://opensky-network.org/api/states/all';
const ZABBIX_HOST = '192.168.159.130';
const ZABBIX_HOSTNAME = 'OpenSky'; // ⬅️ HOSTNAME CORRECTO

// Códigos Squawk de emergencia
const EMERGENCY_SQUAWK = '7700';
const HIJACK_SQUAWK = '7500';
const RADIO_FAIL_SQUAWK = '7600';

// CDMX Bounding Box
const CDMX_BOUNDING_BOX = {
    lamin: 19.0,
    lamax: 20.0,
    lomin: -99.3,
    lomax: -98.9
};

// Variables OAuth2
let accessToken = null;
let tokenExpiry = null;

// 🌤️ NUEVA FUNCIÓN: Métricas de Clima (Simuladas)
async function fetchWeatherData() {
    try {
        // ⚠️ SIMULACIÓN TEMPORAL - Reemplazar con API real después
        const simulatedWeather = {
            alert_level: Math.random() > 0.9 ? 2 : Math.random() > 0.7 ? 1 : 0,
            wind_speed: 15 + Math.random() * 35, // 15-50 km/h
            visibility: 3000 + Math.random() * 7000, // 3-10km
            lightning_strikes: Math.random() > 0.95 ? Math.floor(Math.random() * 20) : 0,
            temperature: 18 + Math.random() * 12 // 18-30°C
        };

        console.log(`[Weather] Alert level: ${simulatedWeather.alert_level}, Wind: ${simulatedWeather.wind_speed.toFixed(1)} km/h`);

        return [
            ['weather.alert_level', simulatedWeather.alert_level],
            ['weather.wind_speed', simulatedWeather.wind_speed],
            ['weather.visibility', simulatedWeather.visibility],
            ['weather.lightning_strikes', simulatedWeather.lightning_strikes],
            ['weather.temperature', simulatedWeather.temperature],
        ];

    } catch (error) {
        console.error('[Weather] Error:', error);
        return [
            ['weather.alert_level', 0],
            ['weather.wind_speed', 0],
            ['weather.visibility', 10000],
            ['weather.lightning_strikes', 0],
            ['weather.temperature', 0],
        ];
    }
}

// ⏰ NUEVA FUNCIÓN: Métricas de Puntualidad
async function calculatePunctualityMetrics() {
    try {
        const db = mongoose.connection.db;
        const collection = db.collection('flights');

        // Contar vuelos por estado de puntualidad
        // Usando lógica simple basada en el campo 'status' existente
        const delayedFlights = await collection.countDocuments({
            status: 'Retrasado'
        });

        const earlyFlights = await collection.countDocuments({
            status: 'Adelantado'
        });

        // Para este ejemplo, dividimos entre salidas y llegadas de manera simétrica
        // En producción, necesitarías lógica más sofisticada
        const delayedDepartures = Math.floor(delayedFlights * 0.6); // 60% son salidas
        const delayedArrivals = Math.floor(delayedFlights * 0.4);   // 40% son llegadas
        const earlyDepartures = Math.floor(earlyFlights * 0.6);     // 60% son salidas
        const earlyArrivals = Math.floor(earlyFlights * 0.4);       // 40% son llegadas

        console.log(`[Punctuality] Delayed: ${delayedFlights}, Early: ${earlyFlights}`);

        return [
            ['app.flights.delayed_departures', delayedDepartures],
            ['app.flights.delayed_arrivals', delayedArrivals],
            ['app.flights.early_departures', earlyDepartures],
            ['app.flights.early_arrivals', earlyArrivals],
        ];

    } catch (error) {
        console.error('[Punctuality] Error:', error);
        return [
            ['app.flights.delayed_departures', 0],
            ['app.flights.delayed_arrivals', 0],
            ['app.flights.early_departures', 0],
            ['app.flights.early_arrivals', 0],
        ];
    }
}

// ✅ FUNCIÓN CORREGIDA: Solo métricas que existen en Zabbix
async function getMongoDBMetrics() {
    try {
        console.log('[MongoDB] Obteniendo métricas con mongoose...');

        // USAR LA CONEXIÓN DIRECTA DE MONGOOSE
        const db = mongoose.connection.db;
        const collection = db.collection('flights');

        const totalFlights = await collection.countDocuments();

        // Calcular promedio de altitud
        const avgAltitudeResult = await collection.aggregate([
            { $match: { altitude: { $ne: null, $gte: 0 } } },
            { $group: { _id: null, avgAltitude: { $avg: "$altitude" } } }
        ]).toArray();
        const avgAltitude = avgAltitudeResult.length > 0 ? Math.round(avgAltitudeResult[0].avgAltitude) : 0;

        const flightsOverCDMX = await collection.countDocuments({
            latitude: { $gte: 19.0, $lte: 20.0 },
            longitude: { $gte: -99.5, $lte: -98.5 },
            on_ground: false
        });

        // Contar emergencias por squawk code
        const emergencyCount = await collection.countDocuments({
            squawk: { $in: [EMERGENCY_SQUAWK, HIJACK_SQUAWK, RADIO_FAIL_SQUAWK] }
        });

        const lastFlight = await collection.findOne({}, { sort: { updatedAt: -1 } });
        const dataFreshness = lastFlight ?
            Math.floor((Date.now() - lastFlight.updatedAt.getTime()) / 1000) : 999999;

        console.log(`[MongoDB] ${totalFlights} vuelos totales, ${flightsOverCDMX} en CDMX`);

        return [
            ['mongodb.flights.total_count', totalFlights],
            ['mongodb.flights.over_cdmx', flightsOverCDMX],
            ['mongodb.flights.avg_altitude', avgAltitude],
            ['mongodb.flights.emergency_count', emergencyCount],
            ['mongodb.data_freshness', dataFreshness],
            ['mongodb.connection_status', 1],
        ];

    } catch (error) {
        console.error('[MongoDB] Error:', error.message);
        return [
            ['mongodb.flights.total_count', 0],
            ['mongodb.flights.over_cdmx', 0],
            ['mongodb.flights.avg_altitude', 0],
            ['mongodb.flights.emergency_count', 0],
            ['mongodb.data_freshness', 999999],
            ['mongodb.connection_status', 0],
        ];
    }
}

// ✅ FUNCIÓN sendToZabbix CORREGIDA con hostname correcto
function sendToZabbix(metrics) {
    return new Promise((resolve, reject) => {
        const tempFile = 'zabbix_data.txt';

        // ✅ DEBUG: Mostrar métricas antes de enviar
        console.log('\n[DEBUG] Lista completa de métricas a enviar:');
        metrics.forEach(([key, value], index) => {
            console.log(`  ${index + 1}. ${key} = ${value}`);
        });
        console.log(`[DEBUG] Total de métricas: ${metrics.length}`);
        console.log(`[DEBUG] Hostname: "${ZABBIX_HOSTNAME}"`);
        console.log(`[DEBUG] Servidor Zabbix: ${ZABBIX_HOST}:10051\n`);

        // ✅ FORMATO CORRECTO: Hostname correcto antes de cada métrica
        const lines = metrics.map(([key, value]) =>
            `"${ZABBIX_HOSTNAME}" ${key} ${value}`
        );

        console.log('[Zabbix] Preparando envío de', metrics.length, 'métricas...');

        fs.writeFile(tempFile, lines.join('\n'), (err) => {
            if (err) {
                console.error('[Zabbix] Error escribiendo archivo:', err);
                reject(err);
                return;
            }

            const command = `"C:\\Program Files\\Zabbix Agent\\zabbix_sender.exe" -z ${ZABBIX_HOST} -i "${tempFile}"`;

            exec(command, { encoding: 'utf8', maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
                // Limpiar archivo temporal
                try {
                    if (fs.existsSync(tempFile)) {
                        fs.unlinkSync(tempFile);
                    }
                } catch (e) {}

                if (stdout) {
                    console.log('[Zabbix] Respuesta:', stdout.trim());
                    if (stdout.includes('sent:')) {
                        console.log('[Zabbix] ✅ Datos enviados al servidor');
                        resolve(stdout);
                        return;
                    }
                }

                if (stderr) console.log('[Zabbix] Stderr:', stderr);

                if (error) {
                    console.error('[Zabbix] ❌ Error ejecutando comando:', error.message);
                    reject(error);
                } else {
                    if (stdout && stdout.includes('processed')) {
                        console.log('[Zabbix] ⚠️  Envío parcial, pero datos recibidos');
                        resolve(stdout);
                    } else {
                        console.error('[Zabbix] ❌ Error desconocido');
                        reject(new Error('Error desconocido en zabbix_sender'));
                    }
                }
            });
        });
    });
}

// ✅ FUNCIONES OAuth (mantener igual)
async function getOAuthToken() {
    try {
        console.log('[OAuth] Obteniendo token...');
        const response = await axios.post(
            'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token',
            new URLSearchParams({
                'grant_type': 'client_credentials',
                'client_id': process.env.OPENSKY_CLIENT_ID,
                'client_secret': process.env.OPENSKY_CLIENT_SECRET
            }),
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: 10000
            }
        );

        accessToken = response.data.access_token;
        tokenExpiry = Date.now() + (response.data.expires_in * 1000);
        console.log(`[OAuth] Token obtenido. Expira en: ${response.data.expires_in}s`);
        return accessToken;
    } catch (error) {
        console.error('[OAuth] Error:', error.message);
        return null;
    }
}

function isTokenValid() {
    return accessToken && Date.now() < tokenExpiry;
}

function validateAndCleanFlightData(state) {
    const icao24 = state[0] && typeof state[0] === 'string' ? state[0].trim() : null;
    const callsign = state[1] && typeof state[1] === 'string' ? state[1].trim() : null;
    const originCountry = state[2] && typeof state[2] === 'string' ? state[2].trim() : null;
    const lastContactTimestamp = state[3] && !isNaN(state[3]) ? state[3] : null;
    const longitude = state[5] !== null && !isNaN(state[5]) ? Number(state[5]) : null;
    const latitude = state[6] !== null && !isNaN(state[6]) ? Number(state[6]) : null;

    let onGround = false;
    const onGroundRaw = state[14];
    if (onGroundRaw !== null && onGroundRaw !== undefined) {
        if (typeof onGroundRaw === 'boolean') onGround = onGroundRaw;
        else if (typeof onGroundRaw === 'string') onGround = onGroundRaw.toLowerCase() === 'true' || onGroundRaw === '1';
        else if (typeof onGroundRaw === 'number') onGround = onGroundRaw === 1;
    }

    const velocity = state[9] !== null && !isNaN(state[9]) ? Number(state[9]) : null;
    const altitude = state[13] !== null && !isNaN(state[13]) ? Number(state[13]) : null;
    const squawkCode = state[17] ? String(state[17]) : null;

    return {
        icao24,
        callsign,
        origin_country: originCountry,
        last_contact: lastContactTimestamp ? new Date(lastContactTimestamp * 1000) : null,
        longitude,
        latitude,
        velocity,
        altitude,
        on_ground: onGround,
        squawk: squawkCode,
    };
}

// ✅ FUNCIÓN PRINCIPAL CORREGIDA CON NUEVAS MÉTRICAS
async function fetchAndProcessFlights() {
    console.log(`[Collector] Iniciando ciclo CDMX: ${new Date().toISOString()}`);
    const startTime = Date.now();

    let flightCount = 0;
    let httpStatusCode = 200;
    let nullLatitudeCount = 0;
    let maxDataAgeSeconds = 0;
    let emergencySquawkCount = 0;
    let hijackSquawkCount = 0;
    let radioFailSquawkCount = 0;

    try {
        // ESPERAR que MongoDB esté conectado
        await mongooseConnection;
        console.log('[MongoDB] Conexión verificada ✅');

        if (!isTokenValid()) {
            const token = await getOAuthToken();
            if (!token) throw new Error('No se pudo obtener token OAuth2');
        }

        const response = await axios.get(OPEN_SKY_URL, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            params: CDMX_BOUNDING_BOX,
            timeout: 15000
        });

        httpStatusCode = response.status;
        const data = response.data;

        if (httpStatusCode === 200 && data.states && data.states.length > 0) {
            flightCount = data.states.length;
            console.log(`[Collector] ${flightCount} vuelos en CDMX`);

            const processedFlights = data.states.map(state => {
                const flightData = validateAndCleanFlightData(state);

                const longitude = flightData.longitude;
                const latitude = flightData.latitude;
                const squawkCode = flightData.squawk;
                const lastContactTimestamp = state[3];

                if (lastContactTimestamp) {
                    const ageSeconds = Math.floor(Date.now() / 1000) - lastContactTimestamp;
                    if (ageSeconds > maxDataAgeSeconds) maxDataAgeSeconds = ageSeconds;
                }

                if (latitude === null || longitude === null) nullLatitudeCount++;
                if (squawkCode === EMERGENCY_SQUAWK) emergencySquawkCount++;
                else if (squawkCode === HIJACK_SQUAWK) hijackSquawkCount++;
                else if (squawkCode === RADIO_FAIL_SQUAWK) radioFailSquawkCount++;

                return flightData;
            });

            console.log('[Collector] Datos obtenidos de OpenSky - bulkWrite deshabilitado temporalmente');

            // Mostrar vuelos
            console.log('\n✈️  Vuelos en CDMX:');
            processedFlights.slice(0, 5).forEach((flight, index) => {
                console.log(`  ${index + 1}. ${flight.callsign || 'N/A'} - ${flight.origin_country} (${flight.latitude?.toFixed(4)}, ${flight.longitude?.toFixed(4)})`);
            });

        } else if (httpStatusCode === 200) {
            console.log("[Collector] Sin vuelos en CDMX");
        }

    } catch (error) {
        httpStatusCode = error.response ? error.response.status : 0;
        console.error("[Collector] Error:", error.message);
        if (error.response && error.response.status === 401) accessToken = null;
    } finally {
        const latency = Date.now() - startTime;

        // ✅ MÉTRICAS BASE (las 17 originales)
        const metrics = [
            // Métricas OpenSky
            ['opensky.http_status_code', httpStatusCode],
            ['opensky.collection_latency', latency],
            ['opensky.flights_count', flightCount],
            ['opensky.null_latitude_count', nullLatitudeCount],
            ['opensky.oauth_enabled', 1],
            ['opensky.cdmx_filter', 1],

            // Métricas Ingestion
            ['ingestion.data_freshness_seconds', maxDataAgeSeconds],
            ['ingestion.update_rate', flightCount],

            // Métricas App Flights
            ['app.flights.emergency_squawk_count', emergencySquawkCount],
            ['app.flights.hijack_squawk_count', hijackSquawkCount],
            ['app.flights.radio_fail_squawk_count', radioFailSquawkCount]
        ];

        // 🔄 AGREGAR NUEVAS MÉTRICAS
        try {
            // Métricas de Puntualidad
            const punctualityMetrics = await calculatePunctualityMetrics();
            metrics.push(...punctualityMetrics);
            console.log(`[Collector] Agregadas ${punctualityMetrics.length} métricas de puntualidad`);

            // Métricas de Clima
            const weatherMetrics = await fetchWeatherData();
            metrics.push(...weatherMetrics);
            console.log(`[Collector] Agregadas ${weatherMetrics.length} métricas meteorológicas`);

            // Métricas MongoDB (existentes)
            const mongoMetrics = await getMongoDBMetrics();
            metrics.push(...mongoMetrics);
            console.log(`[Collector] Agregadas ${mongoMetrics.length} métricas MongoDB`);

        } catch (error) {
            console.error('[Metrics] Error obteniendo métricas adicionales:', error.message);
        }

        // Enviar a Zabbix
        try {
            await sendToZabbix(metrics);
            console.log('[Zabbix] ✅ Todas las métricas enviadas correctamente a Zabbix');
        } catch (error) {
            console.error('[Zabbix] ❌ Error enviando métricas:', error);
        }

        console.log(`[Collector] Ciclo terminado en ${latency}ms. Total métricas: ${metrics.length}`);
    }
}

// ✅ FUNCIÓN DE INICIO (mantener igual)
async function startCollector() {
    try {
        console.log('🔄 Esperando conexión a MongoDB...');
        await mongooseConnection;
        console.log('✅ MongoDB conectado. Iniciando collector...');

        // Iniciar el polling
        const collectionInterval = 60 * 1000;
        setInterval(fetchAndProcessFlights, collectionInterval);

        // Ejecutar inmediatamente
        console.log('🚀 Iniciando primer ciclo de recolección...');
        fetchAndProcessFlights();

    } catch (error) {
        console.error('❌ No se pudo conectar a MongoDB:', error.message);
        process.exit(1);
    }
}

// Iniciar la aplicación
startCollector();

module.exports = {
    fetchAndProcessFlights,
    calculatePunctualityMetrics,
    fetchWeatherData
};