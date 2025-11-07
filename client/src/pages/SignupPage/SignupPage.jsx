import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import authService from "../../services/auth.service";

// IMPORTANTE: Asegúrate de que el archivo './SignupPage.css' está vacío o la importación eliminada.
// import "./SignupPage.css";

function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [ocupation, setOcupation] = useState("");
  const [errorMessage, setErrorMessage] = useState(undefined);

  const navigate = useNavigate();

  const handleEmail = (e) => setEmail(e.target.value);
  const handlePassword = (e) => setPassword(e.target.value);
  const handleName = (e) => setName(e.target.value);
  const handleOcupation = (e) => setOcupation(e.target.value);

  const handleSignupSubmit = (e) => {
    e.preventDefault();
    const requestBody = { email, password, name, ocupation };

    authService
        .signup(requestBody)
        .then((response) => {
          navigate("/login");
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
    maxWidth: '850px',
    height: '650px',
    overflow: 'hidden',

    display: 'flex',
    // 🔑 CAMBIO 1: Eliminamos justifyContent: 'center' para que el 50% sea estricto desde el inicio

    backgroundColor: 'transparent',
    boxSizing: 'border-box',
  };

  const formContainerStyle = {
    flex: '0 0 50%', // Columna Izquierda (50% fijo)
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: '40px',
    display: 'flex',
    flexDirection: 'column',
    // Esto centra el contenido del formulario verticalmente dentro de su 50%
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    boxSizing: 'border-box',
  };

  const formElementContainerStyle = {
    width: '100%',
    maxWidth: '350px',
  };

  const imageColumnStyle = {
    flex: '0 0 50%', // Columna Derecha (50% fijo)
    position: 'relative',
    overflow: 'hidden',
    // Aseguramos que ocupe todo el espacio del 50%
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    boxSizing: 'border-box',
  };

  const cardBackgroundAnimatedStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%', // Se estira al 100% del contenedor imageColumnStyle
    height: '100%',
    backgroundImage: `url('/img/Ala_avion.jpg')`,
    backgroundSize: 'cover',
    backgroundPosition: '50% 50%',
    zIndex: 0,
    filter: 'brightness(0.9)',
  };

  // ... (El resto de estilos se mantienen iguales)
  const titleStyle = { color: primaryTextColor, fontSize: '2.5em', marginBottom: '30px', fontWeight: '300', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center', width: '100%' };
  const inputStyle = { width: '100%', padding: '12px', margin: '8px 0 15px 0', border: `1px solid ${primaryTextColor}`, borderRadius: '4px', boxSizing: 'border-box', fontSize: '1em', color: primaryTextColor };
  const labelStyle = { display: 'block', textAlign: 'left', marginBottom: '5px', fontWeight: '500', color: textColorOnImage, fontSize: '0.9em', textTransform: 'uppercase', width: '100%' };
  const buttonStyle = { width: '100%', padding: '15px', backgroundColor: accentColor, color: 'white', border: 'none', borderRadius: '30px', cursor: 'pointer', fontSize: '1.1em', fontWeight: '600', marginTop: '20px', transition: 'background-color 0.3s ease, transform 0.2s ease', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)' };
  const linkContainerStyle = { marginTop: '25px', fontSize: '0.9em', color: primaryTextColor, textAlign: 'center', width: '100%' };
  const linkStyle = { color: accentColor, textDecoration: 'none', fontWeight: '600', marginLeft: '5px', transition: 'color 0.3s ease' };
  const errorStyle = { color: accentColor, marginTop: '15px', fontWeight: '500', textAlign: 'center', width: '100%' };


  return (
      <div style={pageContainerStyle}>
        {/* Contenedor principal de la tarjeta (SIN CLASS NAME) */}
        <div style={cardStyle}>

          {/* Columna Izquierda (50%): Formulario de Registro Centrado */}
          <div style={formContainerStyle}>
            <h1 style={titleStyle}>
              <span style={{ color: primaryTextColor }}>SKY</span>
              <span style={{ color: accentColor }}>RUS</span> REGISTRO
            </h1>

            {/* Contenedor interno para centrar el formulario */}
            <div style={formElementContainerStyle}>
              <form onSubmit={handleSignupSubmit} style={{ width: '100%' }}>
                <label style={labelStyle}>Email:</label>
                <input type="email" name="email" value={email} onChange={handleEmail} style={inputStyle} placeholder="Introduce tu email" />

                <label style={labelStyle}>Contraseña:</label>
                <input
                    type="password"
                    name="password"
                    value={password}
                    onChange={handlePassword}
                    style={inputStyle}
                    placeholder="Crea tu contraseña"
                />

                <label style={labelStyle}>Nombre:</label>
                <input type="text" name="name" value={name} onChange={handleName} style={inputStyle} placeholder="Tu nombre completo" />

                <label style={labelStyle}>Ocupación:</label>
                <input type="text" name="ocupation" value={ocupation} onChange={handleOcupation} style={inputStyle} placeholder="Tu ocupación" />

                <button type="submit" style={buttonStyle}>Regístrame</button>
              </form>

              {errorMessage && <p style={errorStyle} className="error-message">Error: {errorMessage}</p>}

              <div style={linkContainerStyle}>
                <p style={{ marginBottom: '5px' }}>¿Ya tienes una cuenta?</p>
                <Link to={"/login"} style={linkStyle}>Iniciar Sesión</Link>
              </div>
            </div>
          </div>

          {/* Columna Derecha (50%): Imagen Animada del Ala de Avión */}
          <div style={imageColumnStyle}>
            <div className="background-animation" style={cardBackgroundAnimatedStyle}></div>
          </div>

        </div>
      </div>
  );
}

export default SignupPage;