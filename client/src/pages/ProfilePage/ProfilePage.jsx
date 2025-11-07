import React, {useContext, useState} from "react";
import {
    Box,
    Grid,
    Card,
    Typography,
    Switch,
    Divider,
    IconButton,
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import EmailIcon from "@mui/icons-material/Email"; // ✅ CORREGIDO
import SettingsIcon from "@mui/icons-material/Settings";
import NotificationsIcon from "@mui/icons-material/Notifications";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CloudIcon from "@mui/icons-material/Cloud";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import FlightIcon from "@mui/icons-material/Flight";
import {AuthContext} from "../../context/auth.context";

// --- Configuración inicial ---
const initialUserSettings = {
    alerts: {
        scheduledDeparture: true,
        scheduledArrival: true,
        criticalTimeChange: true,
        flightStatusChange: true,
    },
    warnings: {
        receiveWeatherWarnings: true,
        onlyCriticalWeather: false,
        receiveGeneralWarnings: true,
        includeGateTerminalChanges: true,
    },
};

// --- Componente Toggle ---
const ToggleSetting = ({ icon: Icon, title, description, isEnabled, onToggle }) => (
    <Card
        variant="outlined"
        sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderRadius: 3,
            mb: 2,
            "&:hover": { backgroundColor: "#f5f7fa" },
        }}
    >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton sx={{ backgroundColor: "#1976d2", color: "#fff" }}>
                <Icon />
            </IconButton>
            <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                    {title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {description}
                </Typography>
            </Box>
        </Box>
        <Switch checked={isEnabled} onChange={onToggle} color="primary" />
    </Card>
);

const ProfilePage = () => {
    const [userSettings, setUserSettings] = useState(initialUserSettings);
    const { user } = useContext(AuthContext);
    const [email, setEmail] = useState(user.email);
    const [name, setName] = useState(user.name);

    const updateSettings = (section, key, value) => {
        setUserSettings((prev) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: value,
            },
        }));
    };

    return (
        <Box sx={{ minHeight: "100vh", backgroundColor: "#fafafa", p: { xs: 2, md: 6 } }}>
            {/* Encabezado */}
            <Box sx={{ borderBottom: "3px solid #1976d2", pb: 2, mb: 5 }}>
                <Typography
                    variant="h4"
                    color="primary"
                    fontWeight="bold"
                    display="flex"
                    alignItems="center"
                    gap={1}
                >
                    <AccountCircleIcon fontSize="large" /> Perfil de Usuario
                </Typography>
            </Box>

            <Grid container spacing={4}>
                {/* --- PANEL DE CREDENCIALES (ahora arriba) --- */}
                <Grid item xs={12}>
                    <Card
                        sx={{
                            p: 3,
                            borderRadius: 4,
                            backgroundColor: "#f9f9f9",
                            border: "1px solid #e0e0e0",
                            boxShadow: 2,
                        }}
                    >
                        <Typography
                            variant="h6"
                            color="primary"
                            display="flex"
                            alignItems="center"
                            gap={1}
                            mb={3}
                        >
                            <SettingsIcon /> Credenciales
                        </Typography>

                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            {/* Nombre de usuario */}
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                }}
                            >
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <AccountCircleIcon color="primary" />
                                    <Typography variant="body1" color="text.secondary">
                                        Nombre de Usuario
                                    </Typography>
                                </Box>
                                <Typography variant="body1" fontWeight="bold">
                                    {user.name}
                                </Typography>
                            </Box>

                            <Divider />

                            {/* Correo electrónico */}
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                }}
                            >
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <EmailIcon color="primary" />
                                    <Typography variant="body1" color="text.secondary">
                                        Correo Electrónico
                                    </Typography>
                                </Box>
                                <Typography variant="body1" fontWeight="bold">
                                    {user.email}
                                </Typography>
                            </Box>
                        </Box>
                    </Card>
                </Grid>

                {/* --- ALERTAS Y ADVERTENCIAS (debajo) --- */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ p: 3, borderRadius: 4, boxShadow: 2 }}>
                        <Typography
                            variant="h6"
                            color="primary"
                            display="flex"
                            alignItems="center"
                            gap={1}
                            mb={3}
                        >
                            <NotificationsIcon /> Alertas de Horarios
                        </Typography>

                        <ToggleSetting
                            icon={AccessTimeIcon}
                            title="Hora de Salida Programada"
                            description="Recibir alerta 1 hora antes de la salida."
                            isEnabled={userSettings.alerts.scheduledDeparture}
                            onToggle={() =>
                                updateSettings(
                                    "alerts",
                                    "scheduledDeparture",
                                    !userSettings.alerts.scheduledDeparture
                                )
                            }
                        />
                        <ToggleSetting
                            icon={AccessTimeIcon}
                            title="Hora de Llegada Programada"
                            description="Recibir alerta 2 horas antes de la llegada."
                            isEnabled={userSettings.alerts.scheduledArrival}
                            onToggle={() =>
                                updateSettings(
                                    "alerts",
                                    "scheduledArrival",
                                    !userSettings.alerts.scheduledArrival
                                )
                            }
                        />
                        <ToggleSetting
                            icon={AccessTimeIcon}
                            title="Cambio Crítico de Horario"
                            description="Notificar si hay un cambio significativo."
                            isEnabled={userSettings.alerts.criticalTimeChange}
                            onToggle={() =>
                                updateSettings(
                                    "alerts",
                                    "criticalTimeChange",
                                    !userSettings.alerts.criticalTimeChange
                                )
                            }
                        />
                        <ToggleSetting
                            icon={FlightIcon}
                            title="Estado del Vuelo"
                            description="Notificar si el vuelo cambia a retrasado, cancelado o desviado."
                            isEnabled={userSettings.alerts.flightStatusChange}
                            onToggle={() =>
                                updateSettings(
                                    "alerts",
                                    "flightStatusChange",
                                    !userSettings.alerts.flightStatusChange
                                )
                            }
                        />
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card sx={{ p: 3, borderRadius: 4, boxShadow: 2 }}>
                        <Typography
                            variant="h6"
                            color="primary"
                            display="flex"
                            alignItems="center"
                            gap={1}
                            mb={3}
                        >
                            <WarningAmberIcon /> Advertencias y Logística
                        </Typography>

                        <ToggleSetting
                            icon={CloudIcon}
                            title="Advertencias de Clima"
                            description="Recibir alertas por condiciones meteorológicas severas."
                            isEnabled={userSettings.warnings.receiveWeatherWarnings}
                            onToggle={() =>
                                updateSettings(
                                    "warnings",
                                    "receiveWeatherWarnings",
                                    !userSettings.warnings.receiveWeatherWarnings
                                )
                            }
                        />

                        {userSettings.warnings.receiveWeatherWarnings && (
                            <ToggleSetting
                                icon={CloudIcon}
                                title="Solo Alertas Críticas"
                                description="Limitar las notificaciones a las más graves."
                                isEnabled={userSettings.warnings.onlyCriticalWeather}
                                onToggle={() =>
                                    updateSettings(
                                        "warnings",
                                        "onlyCriticalWeather",
                                        !userSettings.warnings.onlyCriticalWeather
                                    )
                                }
                            />
                        )}

                        <ToggleSetting
                            icon={WarningAmberIcon}
                            title="Advertencias Generales"
                            description="Incluir alertas por problemas logísticos o técnicos."
                            isEnabled={userSettings.warnings.receiveGeneralWarnings}
                            onToggle={() =>
                                updateSettings(
                                    "warnings",
                                    "receiveGeneralWarnings",
                                    !userSettings.warnings.receiveGeneralWarnings
                                )
                            }
                        />
                        <ToggleSetting
                            icon={WarningAmberIcon}
                            title="Cambios de Puerta/Terminal"
                            description="Notificaciones por cambios en la puerta o terminal."
                            isEnabled={userSettings.warnings.includeGateTerminalChanges}
                            onToggle={() =>
                                updateSettings(
                                    "warnings",
                                    "includeGateTerminalChanges",
                                    !userSettings.warnings.includeGateTerminalChanges
                                )
                            }
                        />
                    </Card>
                </Grid>
            </Grid>

            {/* Footer */}
            <Box textAlign="center" mt={8} color="text.secondary">
                <Typography variant="body2">
                    &copy; {new Date().getFullYear()} Flight Monitor App. Todos los derechos reservados.
                </Typography>
            </Box>
        </Box>
    );
};

export default ProfilePage;
