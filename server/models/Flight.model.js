const { Schema, model } = require("mongoose");

// Definición del Schema para los documentos de Vuelo (Aircraft States)
const flightSchema = new Schema(
    {
        // Identificador único de la aeronave (Primary Key de facto)
        icao24: {
            type: String,
            required: [true, "El identificador ICAO24 es obligatorio."],
            unique: true, // Esto asegura que cada documento es único por aeronave
            index: true,  // Crea un índice para búsquedas rápidas (usado en bulkWrite filter)
            trim: true,
            uppercase: true,
        },


        // País de origen/registro. Índice 2 de OpenSky.
        origin_country: {
            type: String,
            required: true,
        },

        // Código ICAO del aeropuerto de destino (p.ej., 'LEMD').
        arrival_airport_icao: {
            type: String,
            default: null,
            trim: true,
            uppercase: true,
        },

        // --- Campos de Horario (Scheduled & Estimated Times) ---

        // Horario Programado de Salida (STD - Scheduled Time of Departure).
        scheduled_departure: {
            type: Date,
            default: null,
        },
        // Horario Estimado de Salida (ETD - Estimated Time of Departure).
        estimated_departure: {
            type: Date,
            default: null,
        },

        // Horario Programado de Llegada (STA - Scheduled Time of Arrival).
        scheduled_arrival: {
            type: Date,
            default: null,
        },
        // Horario Estimado de Llegada (ETA - Estimated Time of Arrival).
        estimated_arrival: {
            type: Date,
            default: null,
        },

        // --- Posición y Movimiento (Datos de OpenSky) ---

        // Último contacto de posición (Timestamp UNIX convertido a Date). Índice 3 de OpenSky.
        last_contact: {
            type: Date,
            required: true,
        },

        // Coordenadas geográficas
        longitude: { // Índice 5 de OpenSky.
            type: Number,
            default: null,
        },
        latitude: { // Índice 6 de OpenSky.
            type: Number,
            default: null,
        },

        // Información de movimiento y estado
        velocity: { // Velocidad terrestre en m/s. Índice 9 de OpenSky.
            type: Number,
            default: null,
        },
        altitude: { // Altitud barométrica en metros. Índice 13 de OpenSky.
            type: Number,
            default: null,
        },
        on_ground: { // Booleano: ¿Está la aeronave en tierra? Índice 14 de OpenSky.
            type: Boolean,
            default: false,
        },

        // Campo para el estado del vuelo.
        status: {
            type: String,
            // ¡'Adelantado' añadido a la lista de estados!
            enum: ['En Vuelo', 'Aterrizado', 'Retrasado', 'Patrón de Vuelo', 'Adelantado', 'Desconocido'],
            default: 'Desconocido',
        },
    },
    {
        // Añade `createdAt` y `updatedAt` automáticamente
        timestamps: true,
    }
);

// Definimos un índice 2D Sphere para consultas geográficas (mapas)
flightSchema.index({ longitude: 1, latitude: 1 });

const Flight = model("Flight", flightSchema);

module.exports = Flight;