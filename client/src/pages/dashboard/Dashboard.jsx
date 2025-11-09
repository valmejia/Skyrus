import React, { useEffect, useState } from "react";
import { Grid, Card, CardContent, Typography, Box } from "@mui/material";
import FlightIcon from "@mui/icons-material/Flight";
import ThunderstormIcon from "@mui/icons-material/Thunderstorm";
import CloudIcon from "@mui/icons-material/Cloud";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

// Configuración de triggers
const TRIGGERS = [
    { id: 23721, title: "EMERGENCIA AÉREA", icon: FlightIcon },
    { id: 23722, title: "POSIBLE SECUESTRO AÉREO", icon: FlightIcon },
    { id: 23723, title: "FALLO DE COMUNICACIÓN", icon: ThunderstormIcon },
    { id: 23724, title: "OpenSky API no responde", icon: CloudIcon },
    { id: 23725, title: "MongoDB desconectado", icon: CloudIcon },
    { id: 23726, title: "Datos de vuelos muy antiguos", icon: WarningAmberIcon },
    { id: 23727, title: "Alta latencia en collector", icon: WarningAmberIcon },
    { id: 23728, title: "No hay vuelos detectados sobre CDMX", icon: NotificationsIcon },
    { id: 23729, title: "Retraso en salidas de vuelos", icon: FlightIcon },
    { id: 23730, title: "Retraso en llegadas de vuelos", icon: FlightIcon },
    { id: 23731, title: "Salidas adelantadas de vuelos", icon: FlightIcon },
    { id: 23732, title: "Alertas meteorológicas activas", icon: ThunderstormIcon },
    { id: 23733, title: "Vientos fuertes en zona", icon: ThunderstormIcon },
    { id: 23734, title: "Visibilidad por clima", icon: CloudIcon },
];

const COLORS = ["#00C49F", "#FF4C4C"]; // Verde: OK, Rojo: Problema

export default function DashboardPage() {
    const [triggerData, setTriggerData] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTriggers = async () => {
            try {
                // ✅ CORREGIDO: Cambiado de "/api/zabbix/triggers" a "/api/triggers"
                const res = await fetch("/api/triggers");
                const data = await res.json();
                // data ejemplo: { "23721": { state: true, value: 7 }, ... }
                setTriggerData(data);
            } catch (err) {
                console.error("Error al obtener triggers:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTriggers();
    }, []);

    return (
        <Box sx={{ padding: 4 }}>
            <Typography variant="h4" gutterBottom>
                Panel de Monitoreo — Zabbix Triggers
            </Typography>

            <Grid container spacing={3}>
                {TRIGGERS.map(({ id, title, icon: Icon }) => {
                    const data = triggerData[id] || {};
                    const state = data.state ?? false;
                    const value = Math.min(data.value ?? 0, 100); // aseguramos 0-100

                    // Datos para PieChart
                    const chartData = [
                        { name: "Valor", value },
                        { name: "Restante", value: 100 - value },
                    ];

                    return (
                        <Grid item xs={12} sm={6} md={4} key={id}>
                            <Card
                                sx={{
                                    borderRadius: 3,
                                    border: "1px solid #ddd",
                                    transition: "0.3s",
                                    backgroundColor: state ? "#e3fcef" : "#ffeaea",
                                }}
                            >
                                <CardContent>
                                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                                        <Icon color={state ? "success" : "error"} />
                                        <Typography variant="h6">{title}</Typography>
                                    </Box>

                                    {/* PieChart */}
                                    <PieChart width={200} height={200}>
                                        <Pie
                                            data={chartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={40}
                                            outerRadius={70}
                                            paddingAngle={2}
                                            dataKey="value"
                                            label
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>

                                    <Typography variant="body2" color="text.secondary" textAlign="center" mt={1}>
                                        Valor reportado: {value}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>
        </Box>
    );
}