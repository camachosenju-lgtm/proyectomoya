import React from 'react';
import { useNavigate } from 'react-router-dom';
import imagenDeFondo from '../imagenes/fondo.jpg'; 
import logoPocketwork from '../imagenes/logo.png';
import './estilos.css';

const Nosotros = () => {
  const navigate = useNavigate();

  return (
    // CAMBIO 1: Eliminamos flexbox centrado vertical para que no se recorte arriba
    <div className="login-padre login-fondoConImagen" style={{ 
      backgroundImage: `url(${imagenDeFondo})`, 
      minHeight: '100vh', 
      display: 'block', // Volvemos a comportamiento normal de bloque
      padding: '40px 0' // Espacio arriba y abajo para que respire
    }}>
      <div className="login-formulario fade-in" style={{ 
        maxWidth: '1050px', // <--- CAMBIO 2: Mucho más ancho
        width: '90%',
        padding: '40px', 
        margin: '0 auto', // Centrado horizontal
        marginTop: '20px', 
        marginBottom: '20px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.5)' // Un poco de sombra para profundidad
      }}>
        
        <div className="login-cabecera">
          <img src={logoPocketwork} alt="Logo" className="login-logo" />
          <h2 className="login-titulo" style={{ letterSpacing: '2px', fontSize: '2rem' }}>POCKETWORK</h2>
        </div>

        <div className="nosotros-body" style={{ color: 'white', textAlign: 'left', marginTop: '30px' }}>
          
          <section style={{ marginBottom: '30px', borderBottom: '1px solid #333', paddingBottom: '20px' }}>
            <h3 style={{ color: '#f07e11', fontSize: '1.5rem', marginBottom: '15px' }}>¿Qué es Pocketwork?</h3>
            <p style={{ lineHeight: '1.7', color: '#ddd', fontSize: '1.05rem' }}>
              Es una plataforma de gestión de portafolios diseñada para centralizar y potenciar el talento creativo. 
              Permite a los usuarios organizar sus obras, recibir interacción real y personalizar su entorno visual 
              bajo una arquitectura robusta y segura, en la cual el usuario puede personalizar su espacio sin tener conocimientos de programación.
            </p>
          </section>

          <section style={{ marginBottom: '25px' }}>
            <h3 style={{ color: '#f07e11', fontSize: '1.5rem', marginBottom: '20px' }}>Equipo de Desarrollo (USM)</h3>
            <div style={{ 
              display: 'grid', 
              // Mantenemos repeat(auto-fit) para que sea responsive, pero ahora caben más
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
              gap: '15px', // Un poco más de separación entre tarjetas
              marginTop: '10px' 
            }}>
              {[
                "Wuilian Camacho",
                "Eduardo Moukhallaleh",
                "Ricardo Romero",
                "Samuel Salas",
                "David Nannini",
                "Ricardo Cornieles",
                "Douglas Urquiola",
                "Reinaldo Velásquez",
                "Ethan García"
              ].map((nombre, index) => (
                <div key={index} style={{ 
                  padding: '15px', // Tarjetas un poco más grandes
                  backgroundColor: 'rgba(255,255,255,0.05)', 
                  borderRadius: '10px', // Bordes más suaves
                  borderLeft: '5px solid #f07e11', // Borde más grueso
                  fontSize: '0.92rem',
                  color: '#fff'
                }}>
                  {nombre}
                </div>
              ))}
            </div>

            <div style={{ 
              marginTop: '30px',
              padding: '15px', 
              backgroundColor: 'rgba(240, 126, 17, 0.1)', 
              borderRadius: '8px',
              textAlign: 'center',
              fontSize: '0.95rem',
              color: '#f07e11',
              fontWeight: 'bold',
              border: '1px dashed #f07e11',
              letterSpacing: '1px'
            }}>
              Facultad de Ingeniería - Ingeniería de Sistemas
            </div>
          </section>

          <p style={{ 
            fontSize: '0.9rem', 
            textAlign: 'center', 
            color: '#777', 
            marginTop: '35px',
            fontStyle: 'italic' 
          }}>
            "Construyendo el futuro desde la creatividad."
          </p>
        </div>

        <button 
          onClick={() => navigate('/login')} 
          className="login-boton" 
          style={{ marginTop: '30px', width: '100%', fontWeight: 'bold', fontSize: '1.1rem' }}
        >
          ← Volver al Inicio de Sesión
        </button>
      </div>
    </div>
  );
};

export default Nosotros;