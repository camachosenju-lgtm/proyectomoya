import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import imagenDeFondo from '../imagenes/fondo.jpg';
import logoPocketwork from '../imagenes/logo.png';
import './estilos.css';
import ModalMensaje from './ModalMensaje';
import { traducirErrorSupabase } from './validaciones';

const Login = () => {
  const [datos, setDatos] = useState({ correo: '', clave: '' });
  const [verClave, setVerClave] = useState(false);
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

  const banSQL = /('|;|--|\/\*|\*\/|\b(drop|delete|insert|update|select|truncate|alter|create)\b)/i;

  const validarLogin = (email, password) => {
    if (!email || !email.trim()) return 'El correo es obligatorio.';
    if (email.length > 65) return 'El correo no puede tener más de 65 caracteres.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Formato de correo inválido.';
    if (banSQL.test(email)) return 'El correo contiene caracteres inválidos.';

    if (!password || !password.trim()) return 'La contraseña es obligatoria.';
    if (password.length > 30) return 'La contraseña no puede tener más de 30 caracteres.';
    if (banSQL.test(password)) return 'La contraseña contiene caracteres inválidos.';

    return null;
  };

  const manejarCambio = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  };

  const enviarFormulario = async (e) => {
    e.preventDefault();

    const errorValidar = validarLogin(datos.correo, datos.clave);
    if (errorValidar) {
      setModal({ abierto: true, texto: errorValidar, tipo: 'info' });
      return;
    }

    setCargando(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: datos.correo,
      password: datos.clave,
    });

    if (error) {
      setModal({ abierto: true, texto: traducirErrorSupabase(error.message), tipo: 'error' });
    } else {
      const { data: perfil } = await supabase
        .from('perfiles').select('tipo_cuenta').eq('id', data.user.id).single();
      if (perfil?.tipo_cuenta === 'suspendido') {
        await supabase.auth.signOut();
        setModal({ abierto: true, texto: 'Tu cuenta está suspendida. Contacta a un administrador.', tipo: 'error' });
      } else {
        navigate('/dashboard');
      }
    }
    setCargando(false);
  };

  return (
    <div
      className="auth-pantalla"
      style={{ '--imagen-fondo': `url(${imagenDeFondo})` }}
    >
      <form
        onSubmit={enviarFormulario}
        className={`auth-tarjeta ${isFadingOut ? 'salida-fade' : 'entrada-fade'}`}
        noValidate
      >
        <div className="auth-cabecera">
          <img src={logoPocketwork} alt="Logo de Pocketwork" className="auth-logo" />
          <h2 className="auth-titulo">Pocketwork</h2>
          <p className="auth-subtitulo">Tu portafolio creativo en un solo lugar</p>
        </div>

        <div className="auth-form">
          <div className="campo-password">
            <Mail size={18} className="icono-campo" />
            <input
              name="correo"
              type="email"
              placeholder="Tu correo"
              aria-label="Correo electrónico"
              onChange={manejarCambio}
              className="campo campo-con-icono"
              autoComplete="email"
              required
            />
          </div>

          <div className="campo-password">
            <Lock size={18} className="icono-campo" />
            <input
              name="clave"
              type={verClave ? 'text' : 'password'}
              placeholder="Tu contraseña"
              aria-label="Contraseña"
              onChange={manejarCambio}
              className="campo campo-con-icono campo-con-ojo"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="boton-ojo"
              onClick={() => setVerClave((v) => !v)}
              aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              title={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {verClave ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button type="submit" className="btn btn-primario btn-bloque" disabled={cargando}>
            {cargando ? 'Entrando...' : 'Entrar al perfil'}
          </button>
        </div>

        <div className="auth-links">
          <button
            type="button"
            className="auth-link"
            onClick={() => handleNavigate('/olvido')}
          >
            ¿Olvidaste tu contraseña?
          </button>
          <hr className="divisor sin-margen" />
          <button
            type="button"
            className="auth-link-fuerte"
            onClick={() => handleNavigate('/registro')}
          >
            Crear una cuenta nueva
          </button>
        </div>
      </form>

      <button
        type="button"
        className="boton-acerca"
        onClick={() => handleNavigate('/nosotros')}
      >
        Acerca de nosotros
      </button>

      <ModalMensaje
        mensaje={modal.abierto ? modal.texto : ''}
        tipo={modal.tipo}
        onClose={() => setModal({ ...modal, abierto: false })}
      />
    </div>
  );
};

export default Login;
