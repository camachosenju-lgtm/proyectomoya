import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import imagenDeFondo from '../imagenes/fondo.jpg';
import logoPocketwork from '../imagenes/logo.png';

const ActualizarPassword = () => {
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const manejarCambio = async (e) => {
    e.preventDefault();
    setMensaje('');

    // Validación básica de seguridad (USM standards)
    if (nuevaPassword.length < 6) {
      setMensaje('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (nuevaPassword !== confirmar) {
      setMensaje('Las contraseñas no coinciden.');
      return;
    }

    setCargando(true);

    try {
      // Función clave de Supabase para actualizar datos del usuario actual
      const { error } = await supabase.auth.updateUser({ 
        password: nuevaPassword 
      });

      if (error) throw error;

      setMensaje('¡Contraseña actualizada con éxito! Redirigiendo al login...');
      
      // Esperamos 2 segundos para que el usuario lea el mensaje y mandamos al Login
      setTimeout(() => {
        navigate('/login');
      }, 2500);

    } catch (error) {
      setMensaje('Error al actualizar: ' + error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{...estilos.padre, ...estilos.fondoConImagen}}>
      <form onSubmit={manejarCambio} style={estilos.formulario}>
        <div style={estilos.cabecera}>
          <img src={logoPocketwork} alt="Logo" style={estilos.logo} />
          <h2 style={estilos.titulo}>Nueva Contraseña</h2>
        </div>
        <p style={estilos.texto}>Escribe tu nueva clave de acceso.</p>
        <input
          type="password"
          placeholder="Nueva contraseña"
          value={nuevaPassword}
          minLength={6}
          maxLength={30}
          onChange={(e) => {
            const val = e.target.value;
            if (val.length <= 30) setNuevaPassword(val);
          }}
          style={estilos.input}
          required
          disabled={cargando}
        />
        <input
          type="password"
          placeholder="Confirmar contraseña"
          value={confirmar}
          minLength={6}
          maxLength={30}
          onChange={(e) => {
            const val = e.target.value;
            if (val.length <= 30) setConfirmar(val);
          }}
          style={estilos.input}
          required
          disabled={cargando}
        />
        <button 
          type="submit" 
          style={cargando ? {...estilos.boton, opacity: 0.6} : estilos.boton}
          disabled={cargando}
        >
          {cargando ? 'Actualizando...' : 'Guardar Nueva Clave'}
        </button>
        {mensaje && <p style={estilos.mensaje}>{mensaje}</p>}
      </form>
    </div>
  );
};

const estilos = {
  padre: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  fondoConImagen: { backgroundImage: `url(${imagenDeFondo})`, backgroundSize: 'cover', backgroundPosition: 'center' },
  formulario: { backgroundColor: 'rgba(15, 15, 15, 0.92)', padding: '30px 40px', borderRadius: '20px', display: 'flex', flexDirection: 'column', width: '350px', boxShadow: '0 10px 40px rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' },
  cabecera: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '25px' },
  logo: { width: '180px', height: 'auto', marginBottom: '-15px', filter: 'drop-shadow(0 0 10px rgba(240, 126, 17, 0.3))' },
  titulo: { color: '#f07e11', fontSize: '32px', fontWeight: 'bold', margin: '0', letterSpacing: '2px', textTransform: 'uppercase' },
  texto: { color: '#888', marginBottom: '25px', fontSize: '0.9em', textAlign: 'center' },
  input: { marginBottom: '15px', padding: '14px', fontSize: '16px', borderRadius: '10px', border: '1px solid #444', backgroundColor: '#222', color: '#eee', outline: 'none' },
  boton: { padding: '14px', backgroundColor: '#f07e11', color: '#000', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' },
  mensaje: { color: '#fff', marginTop: '20px', fontSize: '0.9em', backgroundColor: 'rgba(240, 126, 17, 0.2)', padding: '10px', borderRadius: '8px', textAlign: 'center' }
};

export default ActualizarPassword;