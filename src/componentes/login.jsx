import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom'; // 1. Importamos el "volante"
import imagenDeFondo from '../imagenes/fondo.jpg';
import logoPocketwork from '../imagenes/logo.png';
import './estilos.css';
import ModalMensaje from './ModalMensaje';
import { traducirErrorSupabase } from './validaciones';

const Login = () => {
  const [datos, setDatos] = useState({ correo: '', clave: '' });
  const [cargando, setCargando] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [modal, setModal] = useState({ abierto: false, texto: '', tipo: '' });
  const navigate = useNavigate(); // 2. Inicializamos el hook de navegación

  const handleNavigate = (ruta) => {
    setIsFadingOut(true);
    setTimeout(() => {
      navigate(ruta);
    }, 450); // Esperar un poco a que termine la animación
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
      setModal({ abierto: true, texto: errorValidar, tipo: '' });
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
      console.log("Usuario logueado:", data.user);
      // 3. Navegamos directamente a la ruta que definimos en App.js
      navigate('/dashboard');
    }
    setCargando(false);
  };

  return (
    <div className="login-padre login-fondoConImagen" style={{ backgroundImage: `url(${imagenDeFondo})` }}>
      <form onSubmit={enviarFormulario} className={`login-formulario ${isFadingOut ? 'fade-out' : 'fade-in'}`}>

        <div className="login-cabecera">
          <img src={logoPocketwork} alt="Logo" className="login-logo" />
          <h2 className="login-titulo">Pocketwork</h2>
        </div>

        <input
          name="correo"
          type="email"
          placeholder="Tu correo"
          onChange={manejarCambio}
          className="login-input"
          required
        />

        <input
          name="clave"
          type="password"
          placeholder="Tu contraseña"
          onChange={manejarCambio}
          className="login-input"
          required
        />

        <button type="submit" className="login-boton" disabled={cargando}>
          {cargando ? 'Entrando...' : 'Entrar al Perfil'}
        </button>

        <div className="login-contenedorLinks">
          <a href="#" className="login-link" onClick={(e) => { e.preventDefault(); handleNavigate('/olvido'); }}>
            ¿Olvidaste tu contraseña?
          </a>
          <div className="login-divisor"></div>
          <a href="#" className="login-linkSecundario" onClick={(e) => { e.preventDefault(); handleNavigate('/registro'); }}>
            Crear una cuenta
          </a>
        </div>
      </form>

       {/* Cambia el href="#!" por el evento onClick con handleNavigate */}
<div className="login-contenedorAcercaDe">
  <a 
    href="#" 
    className="login-botonAcercaDe" 
    onClick={(e) => { 
      e.preventDefault(); 
      handleNavigate('/nosotros'); 
    }}
  >
    Acerca de Nosotros
  </a>
</div>

      <ModalMensaje
        mensaje={modal.abierto ? modal.texto : ''}
        tipo={modal.tipo}
        onClose={() => setModal({ ...modal, abierto: false })}
      />
    </div>
  );
};

export default Login;