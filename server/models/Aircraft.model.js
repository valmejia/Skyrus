const { Schema, model } = require("mongoose");

// Definición del Schema para el documento Aircraft (Metadatos de la Aeronave)
const aircraftSchema = new Schema(
    {
        // ICAO24 es el identificador único de 24 bits de la aeronave
        // Se utiliza como la clave principal para referenciar la aeronave en el modelo Flight.
        icao24: {
            type: String,
            required: [true, "El identificador ICAO24 es obligatorio."],
            unique: true,
            index: true,
            trim: true,
            uppercase: true,
        },

        // --- Datos de Registro y Propiedad ---

        // Matrícula o número de cola (ej. N123AA)
        registration: {
            type: String,
            default: null,
            trim: true,
            uppercase: true,
        },

        // La aerolínea propietaria o que opera la aeronave
        operator: {
            type: String,
            default: null,
            trim: true,
        },

        // País donde la aeronave está registrada
        registered_country: {
            type: String,
            default: null,
            trim: true,
        },

        // --- Datos Técnicos y Físicos ---

        // Fabricante (ej. 'Boeing', 'Airbus')
        manufacturer: {
            type: String,
            default: null,
            trim: true,
        },

        // Modelo de la aeronave (ej. 'B738', 'A320')
        model: {
            type: String,
            default: null,
            trim: true,
        },

        // Tipo de aeronave (ej. 'Avión', 'Helicóptero')
        type: {
            type: String,
            enum: ['Avión', 'Helicóptero', 'Planeador', 'Dirigible', 'Desconocido'],
            default: 'Desconocido',
        },

        // Año de fabricación o entrega (ej. 2005)
        build_year: {
            type: Number,
            default: null,
        },

        // Capacidad de pasajeros (estimada o real)
        passenger_capacity: {
            type: Number,
            default: null,
        },

        // URL a una imagen o logo representativo (opcional)
        image_url: {
            type: String,
            default: null,
        },
    },
    {
        // Añade `createdAt` y `updatedAt` automáticamente
        timestamps: true,
    }
);

const Aircraft = model("Aircraft", aircraftSchema);

module.exports = Aircraft;