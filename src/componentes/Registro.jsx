import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import imagenDeFondo from '../imagenes/fondo.jpg';
import logoProyecto from '../imagenes/logo.png';
import './estilos.css';
import ModalMensaje from './ModalMensaje';
import { traducirErrorSupabase } from './validaciones';

// --- VALIDACIONES DE SEGURIDAD ---
const esTextoSeguro = (texto) => {
  // Bloquea patrones comunes de SQL Injection
  const ban = /('|;|--|\/\*|\*\/|\b(drop|delete|insert|update|select|truncate|alter|create)\b)/i;
  return !ban.test(texto);
};

const validarFormulario = (email, password) => {
  if (!email || !email.trim()) return 'El correo es obligatorio.';
  if (email.length > 65) return 'El correo es demasiado largo.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Formato de correo inválido.';
  if (!esTextoSeguro(email)) return 'Caracteres no permitidos en el correo.';

  if (!password || password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
  if (password.length > 30) return 'La contraseña es demasiado larga.';
  if (!esTextoSeguro(password)) return 'Caracteres no permitidos en la contraseña.';

  return null;
};

const Registro = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const manejarRegistro = async (e) => {
    e.preventDefault();

    // 1. Validar inputs localmente
    const errorValidacion = validarFormulario(email, password);
    if (errorValidacion) {
      setModal({ abierto: true, texto: errorValidacion, tipo: 'error' });
      return;
    }

    setCargando(true);

    try {
      // 2. Intentar registro en Supabase Auth
      // Nota: Supabase detecta automáticamente si el correo ya existe
      const { data, error: errorAuth } = await supabase.auth.signUp({
        email,
        password,
      });

      if (errorAuth) {
        // Manejo específico para correos duplicados
        if (errorAuth.message.includes('already registered') || errorAuth.status === 422) {
          setModal({ abierto: true, texto: 'Este correo ya está registrado. Intenta iniciar sesión.', tipo: 'error' });
        } else {
          setModal({ abierto: true, texto: traducirErrorSupabase(errorAuth.message), tipo: 'error' });
        }
        setCargando(false);
        return;
      }

      const usuario = data.user;

      if (usuario) {
        // 3. Crear fila en la tabla 'perfiles' (para el Dashboard)
        const { error: errorPerfil } = await supabase
          .from('perfiles')
          .insert([
            {
              id: usuario.id,
              nombre_completo: 'Nuevo Artista',
              biografia: 'Cuenta pendiente de verificación.',
              avatar_url: 'https://via.placeholder.com/150'
            }
          ]);

        if (errorPerfil) console.error("Error Perfil:", errorPerfil.message);

        // 4. SEGURIDAD: Cerrar sesión automática tras registro
        // Esto obliga al usuario a verificar su email antes de entrar.
        await supabase.auth.signOut();

        setEnviado(true);
        setModal({ abierto: true, texto: '¡Registro exitoso! Por seguridad, verifica tu correo electrónico para activar tu cuenta.', tipo: 'exito' });
        setEmail('');
        setPassword('');
      }
    } catch (error) {
      setModal({ abierto: true, texto: 'Error inesperado de conexión.', tipo: 'error' });
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="registro-padre login-fondoConImagen" style={{ backgroundImage: `url(${imagenDeFondo})` }}>
      <div className={`registro-tarjeta fade-in ${isFadingOut ? 'fade-out' : ''}`}>
        <div className="registro-contenedorLogo">
          <img src={logoProyecto} alt="Logo" className="registro-logo" />
        </div>

        <h2 className="registro-titulo">Registro</h2>

        {!enviado ? (
          <form onSubmit={manejarRegistro} className="registro-form">
            <input
              type="email"
              placeholder="Tu Gmail de Artista"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="registro-input"
              required
              disabled={cargando}
            />
            <input
              type="password"
              placeholder="Crea tu Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="registro-input"
              required
              disabled={cargando}
            />
            <button
              type="submit"
              className="login-boton"
              style={cargando ? { opacity: 0.7 } : {}}
              disabled={cargando}
            >
              {cargando ? 'Procesando...' : 'Crear Mi Cuenta'}
            </button>
          </form>
        ) : (
          <div className="registro-zonaExito">
            <h3 style={{ color: '#fff', marginBottom: '20px' }}>¡Registro completado!</h3>
            <button onClick={() => handleNavigate('/login')} className="registro-botonLogin">Ir al Login</button>
          </div>
        )}

        {!enviado && (
          <>
            <p className="registro-footerTexto">
              ¿Ya eres parte? <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate('/login'); }} className="registro-link">Loguéate aquí</a>
            </p>
          </>
        )}
      </div>

      <ModalMensaje 
        mensaje={modal.abierto ? modal.texto : ''} 
        tipo={modal.tipo} 
        onClose={() => {
          setModal({ ...modal, abierto: false });
          if (modal.tipo === 'exito') {
            handleNavigate('/login');
          }
        }} 
      />
    </div>
  );
};

export default Registro;