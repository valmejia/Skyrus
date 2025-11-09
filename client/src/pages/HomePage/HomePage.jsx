import React, { useState, useEffect, useContext } from "react";
import "./HomePage.css";
import { AuthContext } from "../../context/auth.context";
import { Link } from "react-router-dom";
import Dashboard from "../dashboard/Dashboard";
import { Box } from "@mui/material";

function HomePage() {
    const [animationStarted, setAnimationStarted] = useState(false);
    const { isLoggedIn, user } = useContext(AuthContext);

    useEffect(() => {
        setAnimationStarted(true);
    }, []);

    const heroSectionStyle = {
        height: "70vh", // menos alto para dejar espacio al dashboard
        width: "100%",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: `url('/img/cielo.jpg')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        backgroundColor: "rgba(0, 0, 0, 0.3)",
        backgroundBlendMode: "multiply",
    };

    const animatedWingStyle = {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundImage: `url('/img/Ala_avion1.jpg')`,
        zIndex: 0,
        opacity: 0.9,
        filter: "brightness(0.9)",
    };

    const heroTitleStyle = {
        position: "relative",
        zIndex: 10,
        color: "white",
        fontSize: "4em",
        textShadow: "2px 2px 8px rgba(0, 0, 0, 0.7)",
        fontWeight: "700",
        letterSpacing: "0.15em",
        textAlign: "center",
    };

    const buttonStyle = {
        backgroundColor: "#D84343",
        color: "white",
        padding: "15px 30px",
        border: "none",
        borderRadius: "30px",
        cursor: "pointer",
        fontSize: "1.1em",
        fontWeight: "600",
        marginTop: "30px",
        textDecoration: "none",
        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
        transition: "background-color 0.3s ease, transform 0.2s ease",
    };

    return (
        <div className="HomePage">
            {/* --- SECCIÓN DE BIENVENIDA --- */}
            <header style={heroSectionStyle}>
                <div
                    className={`background-animation ${animationStarted ? "start-anim" : ""}`}
                    style={animatedWingStyle}
                ></div>

                <h1 style={heroTitleStyle}>Bienvenido a SkyRus</h1>

                {isLoggedIn ? (
                    <Box textAlign="center" zIndex={10}>
                        <p style={{ color: "white", fontSize: "1.5em", marginTop: "20px" }}>
                            ¡Hola, {user?.name || "piloto"}! 🌤️
                        </p>
                        <Link to="/profile" style={buttonStyle}>
                            Ir a tu Perfil
                        </Link>
                    </Box>
                ) : (
                    <Box textAlign="center" zIndex={10}>
                        <p style={{ color: "white", fontSize: "1.2em", marginTop: "20px" }}>
                            Inicia sesión o crea una cuenta para comenzar tu vuelo.
                        </p>
                        <Box display="flex" gap="15px" justifyContent="center">
                            <Link to="/login" style={buttonStyle}>
                                Iniciar Sesión
                            </Link>
                            <Link
                                to="/signup"
                                style={{
                                    ...buttonStyle,
                                    backgroundColor: "transparent",
                                    border: "2px solid #fff",
                                }}
                            >
                                Registrarse
                            </Link>
                        </Box>
                    </Box>
                )}
            </header>

            {/* --- SECCIÓN DEL DASHBOARD --- */}
            {isLoggedIn && (
                <Box sx={{ backgroundColor: "#fff", p: 4 }}>
                    <Dashboard />
                </Box>
            )}
        </div>
    );
}

export default HomePage;
