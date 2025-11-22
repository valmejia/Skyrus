const axios = require('axios');
const { exec } = require('child_process');
const fs = require('fs');
require('dotenv').config();

const mongooseConnection = require('../db');
const mongoose = require('mongoose');

const OPEN_SKY_URL = 'https://opensky-network.org/api/states/all';
const ZABBIX_HOST = '192.168.1.91';
const ZABBIX_HOSTNAME = 'OpenSky';

const EMERGENCY_SQUAWK = '7700';
const HIJACK_SQUAWK = '7500';
const RADIO_FAIL_SQUAWK = '7600';

const CDMX_BOUNDING_BOX = {
    lamin: 19.0,
    lamax: 20.0,
    lomin: -99.3,
    lomax: -98.9
};

let accessToken = null;
let tokenExpiry = null;

async function getMongoDBMetrics() {
    try {
        const db = mongoose.connection.db;
        const collection = db.collection('flights');

        const totalFlights = await collection.countDocuments();

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

        const emergencyCount = await collection.countDocuments({
            squawk: { $in: [EMERGENCY_SQUAWK, HIJACK_SQUAWK, RADIO_FAIL_SQUAWK] }
        });

        const lastFlight = await collection.findOne({}, { sort: { updatedAt: -1 } });
        const dataFreshness = lastFlight ?
            Math.floor((Date.now() - lastFlight.updatedAt.getTime()) / 1000) : 999999;

        return [
            ['mongodb.flights.total_count', totalFlights],
            ['mongodb.flights.over_cdmx', flightsOverCDMX],
            ['mongodb.flights.avg_altitude', avgAltitude],
            ['mongodb.flights.emergency_count', emergencyCount],
            ['mongodb.data_freshness', dataFreshness],
            ['mongodb.connection_status', 1],
        ];

    } catch (error) {
        console.log('MongoDB: Error obteniendo métricas -', error.message);
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

function sendToZabbix(metrics) {
    return new Promise((resolve, reject) => {
        const tempFile = 'zabbix_data.txt';

        const lines = metrics.map(([key, value]) =>
            `"${ZABBIX_HOSTNAME}" ${key} ${value}`
        );

        fs.writeFile(tempFile, lines.join('\n'), (err) => {
            if (err) {
                console.log('Zabbix: Error creando archivo temporal -', err.message);
                reject(err);
                return;
            }

            const command = `"C:\\Program Files\\Zabbix Agent\\zabbix_sender.exe" -z ${ZABBIX_HOST} -i "${tempFile}"`;

            exec(command, { encoding: 'utf8', maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
                try {
                    if (fs.existsSync(tempFile)) {
                        fs.unlinkSync(tempFile);
                    }
                } catch (e) {}

                if (error) {
                    console.log('Zabbix: Error enviando datos -', error.message);
                    reject(error);
                } else {
                    console.log('Zabbix: Datos enviados correctamente');
                    resolve(stdout);
                }
            });
        });
    });
}

async function getOAuthToken() {
    try {
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
        console.log('OpenSky: Token OAuth obtenido');
        return accessToken;
    } catch (error) {
        console.log('OpenSky: Error obteniendo token -', error.message);
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

async function fetchAndProcessFlights() {
    let flightCount = 0;
    let httpStatusCode = 200;
    let nullLatitudeCount = 0;
    let maxDataAgeSeconds = 0;
    let emergencySquawkCount = 0;
    let hijackSquawkCount = 0;
    let radioFailSquawkCount = 0;

    try {
        await mongooseConnection;

        if (!isTokenValid()) {
            const token = await getOAuthToken();
            if (!token) {
                console.log('OpenSky: No se pudo obtener token, abortando ciclo');
                return;
            }
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
            console.log(`OpenSky: ${flightCount} vuelos encontrados en CDMX`);

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

            // Mostrar vuelos
            processedFlights.slice(0, 10).forEach((flight, index) => {
                if (flight.callsign && flight.latitude && flight.longitude) {
                    console.log(`${index + 1}. ${flight.callsign} - ${flight.origin_country} (${flight.latitude.toFixed(4)}, ${flight.longitude.toFixed(4)})`);
                }
            });
            if (processedFlights.length > 10) {
                console.log(`... and ${processedFlights.length - 10} more flights`);
            }
        } else if (httpStatusCode === 200) {
            console.log('OpenSky: No hay vuelos en área CDMX');
        }

    } catch (error) {
        httpStatusCode = error.response ? error.response.status : 0;
        console.log('OpenSky: Error en conexión -', error.message);
        if (error.response && error.response.status === 401) {
            console.log('OpenSky: Token expirado, renovando...');
            accessToken = null;
        }
    } finally {
        const metrics = [
            ['opensky.http_status_code', httpStatusCode],
            ['opensky.flights_count', flightCount],
            ['opensky.null_latitude_count', nullLatitudeCount],
            ['opensky.oauth_enabled', 1],
            ['opensky.cdmx_filter', 1],
            ['ingestion.data_freshness_seconds', maxDataAgeSeconds],
            ['ingestion.update_rate', flightCount],
            ['app.flights.emergency_squawk_count', emergencySquawkCount],
            ['app.flights.hijack_squawk_count', hijackSquawkCount],
            ['app.flights.radio_fail_squawk_count', radioFailSquawkCount]
        ];

        try {
            const mongoMetrics = await getMongoDBMetrics();
            metrics.push(...mongoMetrics);
            await sendToZabbix(metrics);
        } catch (error) {
            console.log('Error procesando métricas:', error.message);
        }
    }
}

async function startCollector() {
    try {
        await mongooseConnection;
        console.log('Collector: Iniciando servicio');
        const collectionInterval = 60 * 1000;
        setInterval(fetchAndProcessFlights, collectionInterval);
        fetchAndProcessFlights();
    } catch (error) {
        console.log('Collector: Error de conexión a MongoDB -', error.message);
        process.exit(1);
    }
}

startCollector();

module.exports = {
    fetchAndProcessFlights
};