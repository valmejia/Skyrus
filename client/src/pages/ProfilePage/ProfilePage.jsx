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
// Importaciones de Íconos
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import EmailIcon from "@mui/icons-material/Email";
import SettingsIcon from "@mui/icons-material/Settings";
import NotificationsIcon from "@mui/icons-material/Notifications";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CloudIcon from "@mui/icons-material/Cloud";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import FlightIcon from "@mui/icons-material/Flight";
import ThunderstormIcon from "@mui/icons-material/Thunderstorm";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import EditIcon from "@mui/icons-material/Edit";

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

// --- Componente Toggle (para Alertas/Advertencias) ---
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
            backgroundColor: 'white',
            "&:hover": { backgroundColor: "#f5f7fa" },
        }}
    >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton sx={{ backgroundColor: "#1976d2", color: "#fff" }}>
                <Icon />
            </IconButton>

            <Box sx={{ textAlign: 'left' }}>
                <Typography variant="subtitle1" fontWeight="bold">
                    {title}
                </Typography>
                <Typography
                    variant="body2"
                    color="text.secondary"
                    ml={0}
                >
                    {description}
                </Typography>
            </Box>

        </Box>
        <Switch checked={isEnabled} onChange={onToggle} color="primary" />
    </Card>
);

// --- Componente de Ítem de Credencial (CORREGIDO ESPACIADO) ---
const CredentialItem = ({ icon: Icon, title, value, onEdit }) => {

    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: 1.5,
                borderRadius: 3,
                "&:hover": { backgroundColor: "#f5f7fa", cursor: 'pointer' },
                transition: 'background-color 0.2s',
            }}
        >
            {/* Lado Izquierdo (Icono y Título) */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <IconButton sx={{ color: "#1976d2" }}>
                    <Icon />
                </IconButton>
                <Typography variant="body1" fontWeight="medium">
                    {title}
                </Typography>
            </Box>

            {/* Lado Derecho (Valor y Flecha) */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    flexShrink: 1,
                    minWidth: 0,
                    textAlign: 'right',
                    flexDirection: 'row',
                    alignItems: 'center',
                }}
            >
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                        lineHeight: 1.2,
                        whiteSpace: 'normal',
                        overflowWrap: 'break-word',
                        mb: 0,
                        // 🔑 AÑADIMOS MARGEN IZQUIERDO AQUÍ
                        ml: 1,
                    }}
                >
                    {value}
                </Typography>
                <IconButton size="small" onClick={onEdit} sx={{ color: 'text.secondary' }}>
                    <ChevronRightIcon />
                </IconButton>
            </Box>
        </Box>
    );
};


const ProfilePage = () => {
    const [userSettings, setUserSettings] = useState(initialUserSettings);
    const { user } = useContext(AuthContext);

    // Definición del color transparente
    const transparentWhite = "rgba(255, 255, 255, 0.3)";

    const updateSettings = (section, key, value) => {
        setUserSettings((prev) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: value,
            },
        }));
    };

    if (!user) {
        return <Box sx={{ minHeight: "100vh", display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Typography variant="h5">Cargando perfil o no autenticado.</Typography>
        </Box>;
    }


    return (
        <Box
            sx={{
                minHeight: "100vh",
                // FONDO DE CIELO
                backgroundImage: 'url("/img/cielo.jpg")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',

                // Overlay Oscuro Sutil
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                backgroundBlendMode: 'overlay',

                p: { xs: 2, md: 6 },
                pt: { xs: 8, md: 10 }
            }}
        >
            {/* Encabezado Principal */}
            <Box sx={{ borderBottom: "3px solid #1976d2", pb: 2, mb: 5 }}>
                <Typography
                    variant="h4"
                    color="white"
                    fontWeight="bold"
                    display="flex"
                    alignItems="center"
                    gap={1}
                >
                    <AccountCircleIcon fontSize="large" /> Perfil de Usuario
                </Typography>
            </Box>

            <Grid container spacing={4}>
                {/* --- PANEL DE CREDENCIALES (TRANSPARENTE) --- */}
                <Grid item xs={12}>
                    <Card
                        sx={{
                            p: 2,
                            borderRadius: 4,
                            backgroundColor: transparentWhite,
                            boxShadow: 2,
                            maxWidth: { xs: '100%', sm: '400px' },
                            margin: { xs: '0', sm: '0 auto 20px auto' }
                        }}
                    >
                        {/* Título de la tarjeta */}
                        <Box sx={{ pb: 1, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AccountCircleIcon fontSize="medium" color="primary"/>
                            <Typography
                                variant="h6"
                                fontWeight="bold"
                            >
                                Profile
                            </Typography>
                        </Box>

                        <Divider sx={{ mb: 1 }}/>

                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>

                            {/* Nombre de usuario */}
                            <CredentialItem
                                icon={AccountCircleIcon}
                                title="Nombre de Usuario"
                                value={user.name}
                                onEdit={() => console.log('Habilitar edición de Nombre')}
                            />

                            {/* Correo electrónico */}
                            <CredentialItem
                                icon={EmailIcon}
                                title="Correo Electrónico"
                                value={user.email}
                                onEdit={() => console.log('Habilitar edición de Correo')}
                            />

                        </Box>
                    </Card>
                </Grid>

                {/* --- ALERTAS DE HORARIOS (TRANSPARENTE) --- */}
                <Grid item xs={12} md={6}>
                    <Card sx={{
                        p: 3,
                        borderRadius: 4,
                        boxShadow: 4,
                        backgroundColor: transparentWhite
                    }}>
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

                {/* --- ADVERTENCIAS Y LOGÍSTICA (TRANSPARENTE) --- */}
                <Grid item xs={12} md={6}>
                    <Card sx={{
                        p: 3,
                        borderRadius: 4,
                        boxShadow: 4,
                        backgroundColor: transparentWhite
                    }}>
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
                                icon={ThunderstormIcon}
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
                    &copy; {new Date().getFullYear()} Skyrus App. Todos los derechos reservados.
                </Typography>
            </Box>
        </Box>
    );
};

export default ProfilePage;