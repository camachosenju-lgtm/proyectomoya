import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import imagenDeFondo from '../imagenes/fondo.jpg';
import logoPocketwork from '../imagenes/logo.png';
import './estilos.css';
import ModalMensaje from './ModalMensaje';
import { traducirErrorSupabase } from './validaciones';

const Olvido = () => {
  const [email, setEmail] = useState('');
  const [cargando, setCargando] = useState(false);
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
      // URL a la que llega el usuario tras el clic en el correo
      redirectTo: 'http://localhost:3000/actualizar-password',
    });

    if (error) {
      setModal({ abierto: true, texto: traducirErrorSupabase(error.message), tipo: 'error' });
    } else {
      setModal({
        abierto: true,
        texto: '¡Listo! Revisa tu correo electrónico. Te enviamos un enlace para cambiar tu clave.',
        tipo: 'exito',
      });
    }
    setCargando(false);
  };

  return (
    <div className="auth-pantalla" style={{ '--imagen-fondo': `url(${imagenDeFondo})` }}>
      <form
        onSubmit={manejarRecuperacion}
        className={`auth-tarjeta ${isFadingOut ? 'salida-fade' : 'entrada-fade'}`}
        noValidate
      >
        <div className="auth-cabecera">
          <img src={logoPocketwork} alt="Logo de Pocketwork" className="auth-logo" />
          <h2 className="auth-titulo">Recuperar clave</h2>
          <p className="auth-subtitulo">
            Escribe tu correo y te enviaremos un enlace de recuperación.
          </p>
        </div>

        <div className="auth-form">
          <div className="campo-password">
            <Mail size={18} className="icono-campo" />
            <input
              type="email"
              placeholder="Tu correo registrado"
              aria-label="Correo electrónico"
              value={email}
              maxLength={60}
              onChange={(e) => setEmail(e.target.value)}
              className="campo campo-con-icono"
              autoComplete="email"
              required
              disabled={cargando}
            />
          </div>

          <button type="submit" className="btn btn-primario btn-bloque" disabled={cargando}>
            {cargando ? 'Procesando...' : 'Enviar enlace'}
          </button>
        </div>

        <div className="auth-links">
          <button
            type="button"
            className="auth-link fila"
            onClick={() => handleNavigate('/login')}
          >
            <ArrowLeft size={16} /> Volver al inicio de sesión
          </button>
        </div>
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
