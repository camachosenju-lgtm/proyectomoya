import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
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
  const [verClave, setVerClave] = useState(false);
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
      const { data, error: errorAuth } = await supabase.auth.signUp({
        email,
        password,
      });

      if (errorAuth) {
        if (errorAuth.message.includes('already registered') || errorAuth.status === 422) {
          setModal({
            abierto: true,
            texto: 'Este correo ya está registrado. Intenta iniciar sesión.',
            tipo: 'error',
          });
        } else {
          setModal({ abierto: true, texto: traducirErrorSupabase(errorAuth.message), tipo: 'error' });
        }
        setCargando(false);
        return;
      }

      const usuario = data.user;

      if (usuario) {
        // 3. Crear fila en la tabla 'perfiles' (para el Dashboard)
        const { error: errorPerfil } = await supabase.from('perfiles').insert([
          {
            id: usuario.id,
            nombre_completo: 'Nuevo Artista',
            biografia: 'Cuenta pendiente de verificación.',
            avatar_url: 'https://via.placeholder.com/150',
          },
        ]);

        if (errorPerfil) console.error('Error Perfil:', errorPerfil.message);

        // 4. SEGURIDAD: Cerrar sesión automática tras registro
        await supabase.auth.signOut();

        setEnviado(true);
        setModal({
          abierto: true,
          texto: '¡Registro exitoso! Por seguridad, verifica tu correo electrónico para activar tu cuenta.',
          tipo: 'exito',
        });
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
    <div className="auth-pantalla" style={{ '--imagen-fondo': `url(${imagenDeFondo})` }}>
      <div className={`auth-tarjeta ${isFadingOut ? 'salida-fade' : 'entrada-fade'}`}>
        <div className="auth-cabecera">
          <img src={logoProyecto} alt="Logo de Pocketwork" className="auth-logo" />
          <h2 className="auth-titulo">Crear cuenta</h2>
          <p className="auth-subtitulo">Publica tus obras y recibe interacción real</p>
        </div>

        {!enviado ? (
          <form onSubmit={manejarRegistro} className="auth-form" noValidate>
            <div className="campo-password">
              <Mail size={18} className="icono-campo" />
              <input
                type="email"
                placeholder="Tu correo de artista"
                aria-label="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="campo campo-con-icono"
                autoComplete="email"
                required
                disabled={cargando}
              />
            </div>

            <div className="campo-password">
              <Lock size={18} className="icono-campo" />
              <input
                type={verClave ? 'text' : 'password'}
                placeholder="Crea tu contraseña (mín. 6)"
                aria-label="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="campo campo-con-icono campo-con-ojo"
                autoComplete="new-password"
                required
                disabled={cargando}
              />
              <button
                type="button"
                className="boton-ojo"
                onClick={() => setVerClave((v) => !v)}
                aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {verClave ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button type="submit" className="btn btn-primario btn-bloque" disabled={cargando}>
              {cargando ? 'Procesando...' : 'Crear mi cuenta'}
            </button>
          </form>
        ) : (
          <div className="auth-form">
            <p className="auth-aviso">Revisa tu correo para activar la cuenta antes de entrar.</p>
            <button
              type="button"
              className="btn btn-primario btn-bloque"
              onClick={() => handleNavigate('/login')}
            >
              Ir al inicio de sesión
            </button>
          </div>
        )}

        {!enviado && (
          <div className="auth-links">
            <hr className="divisor sin-margen" />
            <span className="auth-link">
              ¿Ya eres parte?{' '}
              <button
                type="button"
                className="auth-link-fuerte"
                onClick={() => handleNavigate('/login')}
              >
                Inicia sesión aquí
              </button>
            </span>
          </div>
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
