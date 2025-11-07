import React, { useState, useEffect, useContext } from "react";
import "./HomePage.css";
import { AuthContext } from "../../context/auth.context";
import { Link } from "react-router-dom";

function HomePage() {
    const [animationStarted, setAnimationStarted] = useState(false);
    const { isLoggedIn, user } = useContext(AuthContext);

    useEffect(() => {
        setAnimationStarted(true);
    }, []);

    // --- ESTILOS ---
    const heroSectionStyle = {
        height: "100vh",
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

    const aboutSectionStyle = {
        padding: "80px 10%",
        backgroundColor: "#F7F7F7",
        minHeight: "60vh",
        color: "#444",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
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

    const loremIpsum =
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi. Nulla quis sem at nibh elementum imperdiet. Duis sagittis ipsum. Praesent mauris.";

    return (
        <div className="HomePage">
            <header style={heroSectionStyle}>
                {/* Fondo animado */}
                <div
                    className={`background-animation ${animationStarted ? "start-anim" : ""}`}
                    style={animatedWingStyle}
                ></div>

                {/* Título principal */}
                <h1 style={heroTitleStyle}>Bienvenido a SkyRus</h1>

                {/* 🔑 Si el usuario está logueado */}
                {isLoggedIn ? (
                    <>
                        <p
                            style={{
                                color: "white",
                                zIndex: 10,
                                fontSize: "1.5em",
                                marginTop: "20px",
                            }}
                        >
                            ¡Hola, {user?.name || "piloto"}! 🌤️
                        </p>
                        <Link to="/profile" style={buttonStyle}>
                            Ir a tu Perfil
                        </Link>
                    </>
                ) : (
                    <>
                        <p
                            style={{
                                color: "white",
                                zIndex: 10,
                                fontSize: "1.2em",
                                marginTop: "20px",
                            }}
                        >
                            Inicia sesión o crea una cuenta para comenzar tu vuelo.
                        </p>
                        <div
                            style={{
                                display: "flex",
                                gap: "15px",
                                zIndex: 10,
                            }}
                        >
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
                        </div>
                    </>
                )}
            </header>

            {/* Solo muestra “Acerca de nosotros” si NO está logueado */}
            {!isLoggedIn && (
                <section style={aboutSectionStyle}>
                    <h2>Acerca de Nosotros</h2>
                    <p
                        style={{
                            textAlign: "justify",
                            maxWidth: "800px",
                            margin: "0 auto",
                            fontSize: "1.1em",
                            lineHeight: "1.8",
                        }}
                    >
                        {loremIpsum}
                        <br />
                        <br />
                        {loremIpsum}
                    </p>
                </section>
            )}
        </div>
    );
}

export default HomePage;
