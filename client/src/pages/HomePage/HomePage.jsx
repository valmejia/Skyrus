import React, { useState, useEffect } from 'react';
import "./HomePage.css";

function HomePage() {
    // Controla si la animación debe iniciar (montaje del componente)
    const [animationStarted, setAnimationStarted] = useState(false);

    useEffect(() => {
        // Al montar el componente, establece el estado a true para aplicar la clase CSS
        setAnimationStarted(true);
    }, []);

    // --- ESTILOS (sin cambios en la lógica de la animación) ---
    const heroSectionStyle = {
        height: '100vh',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: `url('/img/cielo.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        backgroundBlendMode: 'multiply',
    };

    const animatedWingStyle = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: `url('/img/Ala_avion1.jpg')`,
        zIndex: 0,
        opacity: 0.9,
        filter: 'brightness(0.9)',
    };

    const heroTitleStyle = {
        position: 'relative',
        zIndex: 10,
        color: 'white',
        fontSize: '4em',
        textShadow: '2px 2px 8px rgba(0, 0, 0, 0.7)',
        fontWeight: '700',
        letterSpacing: '0.15em',
        textAlign: 'center',
    };

    const aboutSectionStyle = {
        padding: '80px 10%',
        backgroundColor: '#F7F7F7',
        minHeight: '60vh',
        color: '#444',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
    };

    const loremIpsum = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi. Nulla quis sem at nibh elementum imperdiet. Duis sagittis ipsum. Praesent mauris. Fusce nec tellus sed augue semper porta. Mauris massa. Vestibulum lacinia arcu eget nulla. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Curabitur sodales ligula in libero. Sed dignissim lacinia nunc. Nulla quis sem at nibh elementum imperdiet. Duis sagittis ipsum. Praesent mauris. Fusce nec tellus sed augue semper porta. Mauris massa. Vestibulum lacinia arcu eget nulla.";

    return (
        <div className="HomePage">

            <header style={heroSectionStyle}>

                {/* 🔑 CLAVE: Aplica la clase 'start-anim' solo una vez al montar */}
                <div
                    className={`background-animation ${animationStarted ? 'start-anim' : ''}`}
                    style={animatedWingStyle}
                ></div>

                <h1 style={heroTitleStyle}>
                    Bienvenido a SkyRus
                </h1>

            </header>

            <section style={aboutSectionStyle}>
                <h2>Acerca de Nosotros</h2>
                <p style={{textAlign: 'justify', maxWidth: '800px', margin: '0 auto', fontSize: '1.1em', lineHeight: '1.8'}}>
                    {loremIpsum}
                    <br/><br/>
                    {loremIpsum}
                </p>
            </section>
        </div>
    );
}

export default HomePage;