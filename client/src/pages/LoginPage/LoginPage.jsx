import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/auth.context";
import authService from "../../services/auth.service";
import './LoginPage.css'; // ¡Necesitas este CSS para la animación!

function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState(undefined);

    const navigate = useNavigate();
    const { storeToken, authenticateUser } = useContext(AuthContext);

    const handleEmail = (e) => setEmail(e.target.value);
    const handlePassword = (e) => setPassword(e.target.value);

    const handleLoginSubmit = (e) => {
        e.preventDefault();
        const requestBody = { email, password };

        authService
            .login(requestBody)
            .then((response) => {
                storeToken(response.data.authToken);
                authenticateUser();
                navigate("/");
            })
            .catch((error) => {
                const errorDescription = error.response.data.message;
                setErrorMessage(errorDescription);
            });
    };

    // --- DECLARACIÓN DE ESTILOS ---
    const accentColor = '#D84343';
    const primaryTextColor = '#666';
    const textColorOnImage = '#444';

    const pageContainerStyle = {
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundImage: `url('/img/cielo.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        backgroundBlendMode: 'multiply',
    };

    const cardStyle = {
        position: 'relative',
        borderRadius: '10px',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)',
        width: '100%',
        maxWidth: '450px',
        overflow: 'hidden',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '450px',
        backgroundColor: 'white',
    };

    const cardBackgroundAnimatedStyle = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        // 🔑 CORRECCIÓN CLAVE: Usamos .jpg según tu última indicación
        backgroundImage: `url('/img/Ala_avion.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: '50% 50%',
        zIndex: 0,
        filter: 'brightness(0.9)',

        opacity: 1,
        visibility: 'visible',
    };

    const cardContentOverlayStyle = {
        position: 'relative',
        zIndex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        padding: '40px',
        width: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flexGrow: 1,
    };

    const titleStyle = {
        color: textColorOnImage,
        fontSize: '2.5em',
        marginBottom: '30px',
        fontWeight: '300',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
    };

    const inputStyle = {
        width: '100%',
        padding: '12px',
        margin: '8px 0 20px 0',
        border: `1px solid ${primaryTextColor}`,
        borderRadius: '4px',
        boxSizing: 'border-box',
        fontSize: '1em',
        color: primaryTextColor,
    };

    const labelStyle = {
        display: 'block',
        textAlign: 'left',
        marginBottom: '5px',
        fontWeight: '500',
        color: textColorOnImage,
        fontSize: '0.9em',
        textTransform: 'uppercase',
        width: '100%',
    };

    const buttonStyle = {
        width: '100%',
        padding: '15px',
        backgroundColor: accentColor,
        color: 'white',
        border: 'none',
        borderRadius: '30px',
        cursor: 'pointer',
        fontSize: '1.1em',
        fontWeight: '600',
        marginTop: '20px',
        transition: 'background-color 0.3s ease, transform 0.2s ease',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
    };

    const linkContainerStyle = {
        marginTop: '25px',
        fontSize: '0.9em',
        color: textColorOnImage,
    };

    const linkStyle = {
        color: accentColor,
        textDecoration: 'none',
        fontWeight: '600',
        marginLeft: '5px',
        transition: 'color 0.3s ease',
    };

    const errorStyle = {
        color: accentColor,
        marginTop: '15px',
        fontWeight: '500',
    };

    return (
        <div style={pageContainerStyle}>
            {/* Recuadro central */}
            <div className="login-card" style={cardStyle}>
                {/* Fondo Animado del Ala */}
                <div className="background-animation" style={cardBackgroundAnimatedStyle}></div>

                {/* Contenido del formulario */}
                <div style={cardContentOverlayStyle}>
                    <h1 style={titleStyle}>
                        <span style={{ color: primaryTextColor }}>SKY</span>
                        <span style={{ color: accentColor }}>RUS</span> LOGIN
                    </h1>

                    <form onSubmit={handleLoginSubmit} style={{ width: '100%' }}>
                        <label style={labelStyle}>Email:</label>
                        <input
                            type="email"
                            name="email"
                            value={email}
                            onChange={handleEmail}
                            style={inputStyle}
                            placeholder="Introduce tu email"
                        />

                        <label style={labelStyle}>Contraseña:</label>
                        <input
                            type="password"
                            name="password"
                            value={password}
                            onChange={handlePassword}
                            style={inputStyle}
                            placeholder="Introduce tu contraseña"
                        />

                        <button type="submit" style={buttonStyle}>
                            Iniciar Sesión
                        </button>
                    </form>

                    {errorMessage && <p style={errorStyle} className="error-message">Error: {errorMessage}</p>}

                    <div style={linkContainerStyle}>
                        <p style={{marginBottom: '5px'}}>¿No tienes una cuenta aún?</p>
                        <Link to={"/signup"} style={linkStyle}>
                            Regístrate aquí
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;