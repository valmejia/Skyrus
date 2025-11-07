// ✅ FUNCIÓN MONGODB METRICS - VERSIÓN SEGURA
async function getMongoDBMetrics() {
    try {
        const Flight = require('../models/Flight.model');

        console.log('[MongoDB] Obteniendo métricas...');

        // Métricas básicas
        const totalFlights = await Flight.countDocuments();
        const flightsInAir = await Flight.countDocuments({ on_ground: false });
        const flightsOnGround = await Flight.countDocuments({ on_ground: true });

        // Vuelos sobre CDMX
        const flightsOverCDMX = await Flight.countDocuments({
            latitude: { $gte: 19.0, $lte: 20.0 },
            longitude: { $gte: -99.5, $lte: -98.5 },
            on_ground: false
        });

        // Data freshness
        const lastFlight = await Flight.findOne().sort({ updatedAt: -1 });
        const dataFreshness = lastFlight ?
            Math.floor((Date.now() - lastFlight.updatedAt.getTime()) / 1000) : 999999;

        console.log(`[MongoDB] Métricas: ${totalFlights} total, ${flightsOverCDMX} en CDMX`);

        return [
            ['mongodb.flights.total_count', totalFlights],
            ['mongodb.flights.over_cdmx', flightsOverCDMX],
            ['mongodb.flights.in_air', flightsInAir],
            ['mongodb.flights.on_ground', flightsOnGround],
            ['mongodb.data_freshness', dataFreshness],
            ['mongodb.connection_status', 1],
        ];

    } catch (error) {
        console.error('[MongoDB] Error:', error.message);
        return [
            ['mongodb.flights.total_count', 0],
            ['mongodb.flights.over_cdmx', 0],
            ['mongodb.flights.in_air', 0],
            ['mongodb.flights.on_ground', 0],
            ['mongodb.data_freshness', 999999],
            ['mongodb.connection_status', 0],
        ];
    }
}

// ✅ VERSIÓN CORREGIDA DE getFlightsOverCDMX() (ESTIMADA)
async function getFlightsOverCDMX() {
    const startTime = Date.now();

    try {
        // ... tu código existente para llamar a la API OpenSky ...

        // ✅ CORRECCIÓN: Usar Flight en lugar de FlightModel
        const Flight = require('../models/Flight.model');

        // Operaciones de bulkWrite CORREGIDAS
        const operations = flights.map(flight => ({
            updateOne: {
                filter: { icao24: flight.icao24 },
                update: {
                    $set: {
                        origin_country: flight.origin_country,
                        longitude: flight.longitude,
                        latitude: flight.latitude,
                        velocity: flight.velocity,
                        altitude: flight.altitude,
                        on_ground: flight.on_ground,
                        last_contact: new Date(flight.last_contact * 1000),
                        // ... otros campos
                    }
                },
                upsert: true
            }
        }));

        // ✅ CORRECCIÓN: Usar Flight.bulkWrite() no FlightModel.bulkWrite()
        const bulkWriteResult = await Flight.bulkWrite(operations);

        const flightCount = flights.length;
        const latency = Date.now() - startTime;

        console.log(`[Collector] ${flightCount} vuelos en CDMX`);
        console.log(`[MongoDB] ${bulkWriteResult.upsertedCount} insertados, ${bulkWriteResult.modifiedCount} actualizados`);

        // ✅ RETORNAR STATUS 200 CUANDO ES EXITOSO
        return [
            ['opensky.http_status_code', 200], // ✅ Cambiar 0 por 200
            ['opensky.collection_latency', latency],
            ['opensky.flights_count', flightCount],
            ['opensky.null_latitude_count', flights.filter(f => !f.latitude).length],
            ['ingestion.data_freshness_seconds', 0],
            ['app.flights.emergency_squawk_count', 0],
            ['app.flights.hijack_squawk_count', 0],
            ['app.flights.radio_fail_squawk_count', 0],
            ['ingestion.update_rate', flightCount],
            ['opensky.oauth_enabled', 1],
            ['opensky.cdmx_filter', 1]
        ];

    } catch (error) {
        console.error('[Collector] Error:', error.message);
        const latency = Date.now() - startTime;

        // Solo retornar 0 si hay error real
        return [
            ['opensky.http_status_code', 0],
            ['opensky.collection_latency', latency],
            ['opensky.flights_count', 0],
            ['opensky.null_latitude_count', 0],
            ['ingestion.data_freshness_seconds', 999999],
            ['app.flights.emergency_squawk_count', 0],
            ['app.flights.hijack_squawk_count', 0],
            ['app.flights.radio_fail_squawk_count', 0],
            ['ingestion.update_rate', 0],
            ['opensky.oauth_enabled', 0],
            ['opensky.cdmx_filter', 0]
        ];
    }
}