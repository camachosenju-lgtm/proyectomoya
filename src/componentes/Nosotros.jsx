import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2 } from 'lucide-react';
import imagenDeFondo from '../imagenes/fondo.jpg';
import logoPocketwork from '../imagenes/logo.png';
import './estilos.css';

const EQUIPO = [
  'Wuilian Camacho',
  'Isabell Mora',
  'Ricardo Romero',
  'Samuel Medina',
  'Jose Paez',
  'Jose Acosta',
  'Douglas Urquiola',
  'Alexander Torrealba',
  'Moises Mendoza',
  'Maria Morales',
  'Nicole Caicedo',
  'Karley Carrero',
  'Samuel Kostko',
];

const Nosotros = () => {
  const navigate = useNavigate();

  return (
    <div className="auth-pantalla libre" style={{ '--imagen-fondo': `url(${imagenDeFondo})` }}>
      <div className="auth-tarjeta ancha entrada-fade">
        <div className="auth-cabecera">
          <img src={logoPocketwork} alt="Logo de Pocketwork" className="auth-logo" />
          <h2 className="auth-titulo">Pocketwork</h2>
          <p className="auth-subtitulo">Portafolios creativos, seguros y personalizables</p>
        </div>

        <section className="bloque-info">
          <h3>¿Qué es Pocketwork?</h3>
          <p>
            Es una plataforma de gestión de portafolios diseñada para centralizar y potenciar el
            talento creativo. Permite organizar tus obras, recibir interacción real y personalizar
            tu entorno visual bajo una arquitectura robusta y segura, sin necesidad de
            conocimientos de programación.
          </p>
        </section>

        <section className="bloque-info">
          <h3>Equipo de Desarrollo (USM)</h3>
          <div className="grid-equipo">
            {EQUIPO.map((nombre) => (
              <div key={nombre} className="tarjeta-miembro">
                {nombre}
              </div>
            ))}
          </div>

          <div className="facultad">
            <Building2 size={16} className="icono-inline" />
            Facultad de Ingeniería · Ingeniería de Sistemas
          </div>
        </section>

        <p className="frase-final">"Construyendo el futuro desde la creatividad."</p>

        <button
          type="button"
          className="btn btn-primario btn-bloque entrada-modal"
          onClick={() => navigate('/login')}
        >
          <ArrowLeft size={18} /> Volver al inicio de sesión
        </button>
      </div>
    </div>
  );
};

export default Nosotros;
