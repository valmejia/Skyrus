import "./Navbar.css";
import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/auth.context";

const SkyrusLogo = () => {
    const primaryTextColor = '#666'; // Gris oscuro

    return (
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            {/* Ícono Placeholder (Manteniendo el concepto original, pero ahora representa a Skyrus) */}
            <span style={{ fontSize: '1.5em', color: primaryTextColor, marginRight: '5px' }}>✈️</span>
            {/* Texto 'SKYRUS' */}
            <span
                style={{
                    fontSize: '1.2em',
                    fontWeight: 'bold',
                    letterSpacing: '0.15em', // Ligeramente ajustado para 'SKYRUS'
                    color: primaryTextColor,
                    textTransform: 'uppercase'
                }}
            >
                SKYRUS
            </span>
        </Link>
    );
};
// ------------------------------------------
function Navbar() {
    const { isLoggedIn, user, logOutUser } = useContext(AuthContext);

    // Colores y estilos clave
    const accentColor = '#D84343';
    const primaryTextColor = '#666';

    // --- Estilos para la Navbar Traslúcida ---
    const navbarStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        // Mantenemos el padding derecho amplio para asegurarnos de que se muevan.
        padding: '15px 50px 15px 30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 100,

        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    };

    // Estilo base para todos los botones
    const baseButtonStyle = {
        border: 'none',
        padding: '8px 15px',
        borderRadius: '5px',
        cursor: 'pointer',
        fontWeight: '600',
        textDecoration: 'none',
        fontSize: '0.9em',
        transition: 'background-color 0.3s ease, color 0.3s ease',
        display: 'inline-block',
    };

    // Estilo para botones de acción (Login, Perfil)
    const actionButtonStyle = {
        ...baseButtonStyle,
        backgroundColor: accentColor,
        color: '#fff',
        // Mantener un margen a la izquierda
        marginLeft: '5px',
        // *** CAMBIO CLAVE ***: Añadir un margen a la derecha para empujarse del borde
        marginRight: '15px' // Añadimos 15px extra a la derecha del botón principal
    };

    // Estilo para botones secundarios (Registro, Logout)
    const secondaryButtonStyle = {
        ...baseButtonStyle,
        backgroundColor: 'transparent',
        border: `1px solid ${accentColor}`,
        color: accentColor,
        margin: '0 5px'
    };

    // Estilo para el nombre del usuario
    const userNameStyle = {
        color: primaryTextColor,
        fontWeight: '500',
        marginLeft: '15px',
        marginRight: '15px'
    }

    const controlsContainerStyle = {
        display: 'flex',
        alignItems: 'center',
    }


    return (
        <nav style={navbarStyle}>
            <SkyrusLogo />

            <div style={controlsContainerStyle}>
                {isLoggedIn && (
                    <>
                        {/* 1. Botón de Logout */}
                        <button onClick={logOutUser} style={secondaryButtonStyle}>
                            Logout
                        </button>

                        {/* 2. Enlace a Perfil */}
                        <Link to="/profile">
                            {/* Aquí mantenemos el actionButtonStyle, que ya tiene margen derecho (15px) */}
                            <button style={actionButtonStyle}>Perfil</button>
                        </Link>

                        {/* 3. Nombre del Usuario */}
                        <span style={userNameStyle}>{user && user.name}</span>
                    </>
                )}

                {!isLoggedIn && (
                    <>
                        {/* 1. Enlace a Registro (Sign Up) */}
                        <Link to="/signup">
                            <button style={secondaryButtonStyle}>Registro</button>
                        </Link>

                        {/* 2. Enlace a Inicio de Sesión (Login) - Botón principal */}
                        <Link to="/login">
                            {/* Aplicamos actionButtonStyle, que tiene un marginRight de 15px, moviendo la pareja de botones a la izquierda. */}
                            <button style={actionButtonStyle}>Iniciar Sesión</button>
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
}

export default Navbar;
