import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import imagenDeFondo from '../imagenes/fondo.jpg';
import logoPocketwork from '../imagenes/logo.png';
import './estilos.css';

const RUTA_LOGIN = '/login';

// Campo de contraseña reutilizable con ojo para mostrar/ocultar.
const CampoClave = ({ valor, alCambiar, placeholder, visible, alternarVisible, deshabilitado }) => (
  <div className="campo-password">
    <KeyRound size={18} className="icono-campo" />
    <input
      type={visible ? 'text' : 'password'}
      placeholder={placeholder}
      aria-label={placeholder}
      value={valor}
      minLength={6}
      maxLength={30}
      onChange={(e) => alCambiar(e.target.value)}
      className="campo campo-con-icono campo-con-ojo"
      autoComplete="new-password"
      required
      disabled={deshabilitado}
    />
    <button
      type="button"
      className="boton-ojo"
      onClick={alternarVisible}
      aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
    >
      {visible ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  </div>
);

const ActualizarPassword = () => {
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [verNueva, setVerNueva] = useState(false);
  const [verConfirmar, setVerConfirmar] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', esError: true });
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const manejarCambio = async (e) => {
    e.preventDefault();
    setMensaje({ texto: '', esError: true });

    if (nuevaPassword.length < 6) {
      setMensaje({ texto: 'La contraseña debe tener al menos 6 caracteres.', esError: true });
      return;
    }

    if (nuevaPassword !== confirmar) {
      setMensaje({ texto: 'Las contraseñas no coinciden.', esError: true });
      return;
    }

    setCargando(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: nuevaPassword });

      if (error) throw error;

      setMensaje({
        texto: '¡Contraseña actualizada con éxito! Redirigiendo al inicio de sesión...',
        esError: false,
      });

      setTimeout(() => {
        navigate(RUTA_LOGIN);
      }, 2500);
    } catch (error) {
      setMensaje({ texto: 'Error al actualizar: ' + error.message, esError: true });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="auth-pantalla" style={{ '--imagen-fondo': `url(${imagenDeFondo})` }}>
      <form onSubmit={manejarCambio} className="auth-tarjeta entrada-fade" noValidate>
        <div className="auth-cabecera">
          <img src={logoPocketwork} alt="Logo de Pocketwork" className="auth-logo" />
          <h2 className="auth-titulo">Nueva contraseña</h2>
          <p className="auth-subtitulo">Escribe y confirma tu nueva clave de acceso.</p>
        </div>

        <div className="auth-form">
          <CampoClave
            valor={nuevaPassword}
            alCambiar={(valor) => valor.length <= 30 && setNuevaPassword(valor)}
            placeholder="Nueva contraseña"
            visible={verNueva}
            alternarVisible={() => setVerNueva((v) => !v)}
            deshabilitado={cargando}
          />

          <CampoClave
            valor={confirmar}
            alCambiar={(valor) => valor.length <= 30 && setConfirmar(valor)}
            placeholder="Confirmar contraseña"
            visible={verConfirmar}
            alternarVisible={() => setVerConfirmar((v) => !v)}
            deshabilitado={cargando}
          />

          <button type="submit" className="btn btn-primario btn-bloque" disabled={cargando}>
            {cargando ? 'Actualizando...' : 'Guardar nueva clave'}
          </button>

          {mensaje.texto && (
            <p className={`auth-aviso ${mensaje.esError ? 'peligro' : ''}`}>{mensaje.texto}</p>
          )}
        </div>
      </form>
    </div>
  );
};

export default ActualizarPassword;
