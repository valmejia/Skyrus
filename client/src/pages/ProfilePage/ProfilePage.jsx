import React, { useContext, useState, useEffect } from "react";
import {
    Box, Grid, Card, Typography, Switch, IconButton
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import EmailIcon from "@mui/icons-material/Email";
import NotificationsIcon from "@mui/icons-material/Notifications";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CloudIcon from "@mui/icons-material/Cloud";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import FlightIcon from "@mui/icons-material/Flight";
import ThunderstormIcon from "@mui/icons-material/Thunderstorm";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import { AuthContext } from "../../context/auth.context";

// --- NUEVOS TRIGGERS (Zabbix reales) ---
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


// --- Componente Toggle ---
const ToggleSetting = ({ icon: Icon, title, isEnabled, onToggle, loading }) => (
    <Card
        variant="outlined"
        sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderRadius: 3,
            mb: 2,
            backgroundColor: "white",
            "&:hover": { backgroundColor: "#f5f7fa" },
        }}
    >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton sx={{ backgroundColor: "#1976d2", color: "#fff" }}>
                <Icon />
            </IconButton>
            <Typography variant="subtitle1" fontWeight="bold">{title}</Typography>
        </Box>
        <Switch
            checked={isEnabled}
            onChange={onToggle}
            color="primary"
            disabled={loading}
        />
    </Card>
);

// --- Datos del usuario ---
const CredentialItem = ({ icon: Icon, title, value }) => (
    <Box sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        p: 1.5,
        borderRadius: 3,
        "&:hover": { backgroundColor: "#f5f7fa", cursor: "pointer" },
    }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton sx={{ color: "#1976d2" }}>
                <Icon />
            </IconButton>
            <Typography variant="body1" fontWeight="medium">{title}</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" color="text.secondary">{value}</Typography>
            <ChevronRightIcon />
        </Box>
    </Box>
);

const ProfilePage = () => {
    const { user } = useContext(AuthContext);
    const [triggersState, setTriggersState] = useState({});
    const [loading, setLoading] = useState({});

    // 🧩 Obtener estados reales de Zabbix al cargar
    useEffect(() => {
        const fetchTriggerStates = async () => {
            const newStates = {};
            for (const t of TRIGGERS) {
                try {
                    const res = await fetch(`/api/zabbix/trigger/${t.id}/status`);
                    const data = await res.json();
                    // status = 0 (enabled), 1 (disabled)
                    newStates[t.id] = data.status === "0" || data.status === 0;
                } catch (err) {
                    console.error("Error al consultar trigger", t.id, err);
                }
            }
            setTriggersState(newStates);
        };
        fetchTriggerStates();
    }, []);

    // 🔄 Cambiar estado de un trigger
    const handleToggle = async (triggerId, newValue) => {
        setLoading(prev => ({ ...prev, [triggerId]: true }));
        try {
            await fetch(`/api/zabbix/trigger/${triggerId}/toggle`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ enable: newValue }),
            });
            setTriggersState(prev => ({ ...prev, [triggerId]: newValue }));
        } catch (err) {
            console.error("Error al actualizar trigger:", err);
        } finally {
            setLoading(prev => ({ ...prev, [triggerId]: false }));
        }
    };

    const transparentWhite = "rgba(255,255,255,0.3)";
    if (!user) return <Typography>Cargando perfil...</Typography>;

    return (
        <Box
            sx={{
                minHeight: "100vh",
                backgroundImage: 'url("/img/cielo.jpg")',
                backgroundSize: "cover",
                backgroundAttachment: "fixed",
                backgroundBlendMode: "overlay",
                backgroundColor: "rgba(0,0,0,0.2)",
                p: 6,
            }}
        >
            <Typography variant="h4" color="white" fontWeight="bold" mb={4}>
                Perfil de Usuario
            </Typography>

            <Grid container spacing={4}>
                {/* Datos del usuario */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ p: 3, borderRadius: 4, backgroundColor: transparentWhite }}>
                        <CredentialItem icon={AccountCircleIcon} title="Usuario" value={user.name} />
                        <CredentialItem icon={EmailIcon} title="Correo" value={user.email} />
                    </Card>
                </Grid>

                {/* Alertas de Zabbix */}
                <Grid item xs={12} md={8}>
                    <Card sx={{ p: 3, borderRadius: 4, backgroundColor: transparentWhite }}>
                        <Typography variant="h6" color="primary" mb={2}>
                            <NotificationsIcon /> Alertas del Sistema
                        </Typography>

                        {TRIGGERS.map(trigger => (
                            <ToggleSetting
                                key={trigger.id}
                                icon={trigger.icon}
                                title={trigger.title}
                                isEnabled={!!triggersState[trigger.id]}
                                loading={!!loading[trigger.id]}
                                onToggle={() => handleToggle(trigger.id, !triggersState[trigger.id])}
                            />
                        ))}
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ProfilePage;
