import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import imagenDeFondo from '../imagenes/fondo.jpg';
import logoPocketwork from '../imagenes/logo.png';
import './estilos.css';
import ModalMensaje from './ModalMensaje';
import { traducirErrorSupabase } from './validaciones';

const Olvido = () => {
  const [email, setEmail] = useState('');
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [modal, setModal] = useState({ abierto: false, texto: '', tipo: '' });
  const navigate = useNavigate();

  const handleNavigate = (ruta) => {
    setIsFadingOut(true);
    setTimeout(() => {
      navigate(ruta);
    }, 450);
  };

  const manejarRecuperacion = async (e) => {
    e.preventDefault();
    setCargando(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // Esta es la URL a donde llegará el usuario después de hacer clic en el correo
      redirectTo: 'http://localhost:3000/actualizar-password',
    });

    if (error) {
      setModal({ abierto: true, texto: traducirErrorSupabase(error.message), tipo: 'error' });
    } else {
      setEnviado(true);
      setModal({ abierto: true, texto: '¡Listo! Revisa tu correo electrónico. Te hemos enviado un enlace para cambiar tu clave.', tipo: 'exito' });
    }
    setCargando(false);
  };

  return (
    <div className="login-padre login-fondoConImagen" style={{ backgroundImage: `url(${imagenDeFondo})` }}>
      <form onSubmit={manejarRecuperacion} className={`login-formulario fade-in ${isFadingOut ? 'fade-out' : ''}`}>
        <div className="login-cabecera">
          <img src={logoPocketwork} alt="Logo" className="login-logo" />
          <h2 className="login-titulo">Recuperacion</h2>
        </div>
        <p className="login-texto">Ingresa tu correo y te enviaremos un link de recuperación.</p>
        <input
          type="email"
          placeholder="Tu correo registrado"
          value={email}
          maxLength={60}
          onChange={(e) => setEmail(e.target.value)}
          className="login-input"
          required
        />
        <button type="submit" className="login-boton" disabled={cargando}>
          {cargando ? 'Procesando...' : 'Enviar Enlace'}
        </button>
        <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate('/login'); }} className="login-linkCentrado">Volver al Login</a>
      </form>

      <ModalMensaje 
        mensaje={modal.abierto ? modal.texto : ''} 
        tipo={modal.tipo} 
        onClose={() => setModal({ ...modal, abierto: false })} 
      />
    </div>
  );
};

export default Olvido;